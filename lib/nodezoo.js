/* Copyright (c) 2012 Richard Rodger, MIT License */

"use strict";

var path = require('path')
var fs   = require('fs')

var _       = require('underscore')
var seneca  = require('seneca')
var request = require('request')
var request  = require('request')
var optimist = require('optimist')
var byline   = require('byline')
var js       = require('JSONStream')


var github  = new(require('github'))({
  version: "3.0.0"
})


var log = {info:function(){},error:function(){}}


function rank(score) {
  var i = 0, cutoff = [0.1,1,5,10,20]
  while( cutoff[i++] < score ); 
  return i
}


function dorequest(q,url,cb){
  request( url, function( err, res, body ){
    if( err ) {
      log.error('search', '~'+q+'~'+err)
      return cb(err);
    }

    var qr = JSON.parse(body)
    var items = []

    var hits = qr.hits ? qr.hits.hits : qr.items

    if( hits ) {
      log.info('search', '~'+q+'~'+hits.length)
      for( var i = 0; i < hits.length; i++ ) {
        var hit = hits[i]
        delete hit.readme
        //console.dir(hit)
        var row = hit._source ? hit._source : hit
        items.push({
          name:row.name,
          desc:row.desc,
          latest:row.latest,
          maints:_.isArray(row.maints)?row.maints:(''+row.maints).split(' '),
          site:row.site,
          git:row.git,
          rank:rank(row.nr||0),
          score:hit._score,
          nr:row.nr,
          created:row.created,
          modified:row.modified,
          git_star:row.git_star,
          git_fork:row.git_fork,
        })
      }
    }
    else {
      log.info('search', '~'+q+'~'+0)
    }

    console.dir(items)

    cb( null, {items:items} )
  })
}


function cutcomma(str) {
  if( str.match(/,$/) ) {
    return str.substring(0,str.length-1)
  }
  else return str;
}


function insertall(args,cb) {
  var rankfile = args.filepath
  var hosturl  = args.hosturl

  var npmfile = path.dirname(rankfile) +'/npm.json'

  var prmap = {}
  var count = 0
  var rs = fs.createReadStream(rankfile)
  rs.setEncoding('ascii')

  rs.pipe(
    js
      .parse([true]).on('data',function(data){
        prmap[data.m]=data.r
      })
      .on('root',function(){
        var rs = fs.createReadStream(npmfile); 
        rs.setEncoding('ascii')
        
        var linestream = byline.createStream()

        linestream.on('data', function(line){

	  try {
            try {
	      var data = JSON.parse( cutcomma(line) )
            }
            catch(e){
              console.log(e)
              return
            }

	    count++

	    var v = data.value

	    var doc = {
	      name:v.name,
	      desc:v.description||'',
	      latest:(v['dist-tags']||{}).latest,
	      author:(v.author&&v.author.name)||''
	    }

	    var r = v.versions[doc.latest]
	    if( r ) {
	      if( r.homepage ) {
		doc.site = ''+r.homepage
	      }
	      doc.keywords = (r.keywords||[])
	      if( _.isArray( doc.keywords ) ) {
	        doc.keywords = doc.keywords.join(' ')
	      }
	      doc.license = r.license||''

	      try {
		doc.maints = _.isArray(r.maintainers) ? 
                  _.map(r.maintainers||[],function(m){return m.name}).join(' ') : 
                ''+r.maintainers
	      }
	      catch( err ) {
                console.log(err)
	      }

	      doc.readme = r.readme||''

	      if( r.repository && r.repository.url ) {
		var git = r.repository.url
                  .replace(/^git:/,"https:")
                  .replace(/git@github.com:/,"https://github.com/")
                  .replace(/\.git$/,"") 
		doc.git = git
		if( !doc.site ) {
		  doc.site = git
		}
                else {
                  doc.site = ''+doc.site
                  if( doc.site.match(/^www/) ) {
                    doc.site = 'http://'+doc.site
                  }
                }
	      }

              if( !doc.site ) {
                doc.site = "http://npmjs.org/package/"+v.name
              }

              if( doc.site && !doc.git ) {
                if( doc.site.match(/github.com\//) ) {
                  doc.git = doc.site
                }
              }
	    }


	    if( prmap[v.name] ) {
	      doc.nr = prmap[v.name]
	      doc._boost = prmap[v.name] / 10
	    }
	    else {
	      doc._boost = 1
	    }

	    var mul = {}

	    if( doc.latest ) {
	      try {
		mul.version = 1
		var parts = doc.latest.split('.')
		for( var pI = 0; pI < parts.length; pI++ ) {
		  try {
		    mul.version += parseInt(parts[pI].substring(0,1)) / (1000 * (parts.length-pI))
		  } catch(e) {}
		}
		doc._boost *= mul.version
	      }
	      catch(e){}
	    }

	    if( v.time ) {
	      try {
		var now = new Date().getTime()
		if( v.time.created && v.time.modified ) {
		  var created = new Date(v.time.created).getTime()
		  var modified = new Date(v.time.modified).getTime()
		  var age = now - created
		  var recent = now - modified
		  mul.time = 1 + Math.min( 0.001, ( age / recent ) / 10000 )
		  doc._boost *= mul.time

                  doc.created  = created
                  doc.modified = modified
		}
	      }
	      catch(e){}
	    }


            console.dir(doc)
	    request({method:'POST',url:hosturl+doc.name,json:doc},function(err,res,bdy){
	      //console.log(v.name+' '+err)
              //console.dir(bdy)
              if( err ) {
                console.log(err)
              }
	    })

	    //console.log(doc.name+' r='+doc.nr+' b='+doc._boost+' vm='+mul.version+' tm='+mul.time)

            if( 0 == count % 100 ) {
              process.stdout.write('.')
            }

	  }
	  catch( err ) {
            console.log(err)
	  }
        })

        linestream.on('end',function(){
          //cb(null,{index_size:count})
          //console.log('\nindex-size:'+count)
        })

        rs.pipe(linestream)
      }))
}




function nodezoo(si,opts,cb) {
  log = opts.log || log

  si.add({role:'nodezoo',cmd:'ping'},function(args,cb){
    cb(null,{ping:new Date().toISOString()})
  })


  si.add({role:'nodezoo',cmd:'query'},function(args,cb){
    var q = args.q || args.query
    var url = opts.search.hosturl+opts.search.query.prefix + encodeURIComponent(q) + (opts.search.query.suffix||'')
    dorequest(q,url,cb)
  })


  si.add({role:'nodezoo',cmd:'listall'},function(args,cb){
    var url = opts.search.hosturl+opts.search.listall
    dorequest(q,url,cb)
  })


  si.add({role:'nodezoo',cmd:'insertall'},insertall)


  si.add({role:'nodezoo',cmd:'getrepo'},function(args,cb){
    var user = args.user
    var repo = args.repo

    github.authenticate({
      type: "oauth",
      token: opts.git.token
    })

    github.repos.get(
      {
        user: user,
        repo: repo
      },
      function(err,repo){
        if( err ) return cb(err);
        log.info('git','get-repo',repo.full_name)
        cb(null,repo)
      }
    )
  })


  si.add(
    {role:'nodezoo',cmd:'repodata'},
    {required$:['name','repo'],name:'string$',repo:'$object'},
    function(args,cb){
      var url = opts.search.hosturl+opts.search.update.prefix + encodeURIComponent(args.name) + (opts.search.update.suffix||'')
      var data = {
        script: "ctx._source.git_star="+(args.repo.watchers||0)+";"+
          "ctx._source.git_fork="+(args.repo.forks||0)
      }

      console.log(url)
      request(
        {
          method:'POST',
          url:url,
          json:data
        }, 
        si.result(cb,function(res,bdy){
          console.log(args.name)
          console.dir(bdy)
          cb(null,{ok:true})
        }))

      var modent = si.make('mod')
      modent.load$({name:args.name},function(err,mod){
        if(err) {
          return console.error(err)
        }
        mod = mod || modent.make$()
        mod.git_star = (args.repo.watchers||0)
        mod.git_fork = (args.repo.forks||0)
        mod.save$()
      })
    })


  si.compose({role:'nodezoo',cmd:'indexrepo'},[
    {role:'nodezoo',cmd:'getrepo',modify$:function(res,args){return {repo:res,name:args.name}}},
    {role:'nodezoo',cmd:'repodata'},
  ])


  si.add({role:'nodezoo',cmd:'similar'},function(args,cb){
    var name = args.name
    // FIX: make configurable
    var url = opts.search.prefix.replace('_search?q=','')
    url+=name+'/_mlt'
    dorequest(name,url,cb)
  })


  var api = si.http({
    prefix: '/api/',
    pin: {role:'nodezoo',cmd:'*'},
    map:{
      ping:{},
      query:{},
      similar:{}
    }
  })

  si.act({role:'config',cmd:'get',base:'nodezoo',default$:{}},function(err,config){
    if( err ) return si.fail(err,cb);

    opts = _.extend({
      url: {
        prefix:'http://nodezoo.com/api/query?q=',
        suffix:''  
      }},opts,config)

    cb( null, api )
  })
}

module.exports = seneca.module( nodezoo, {role:'nodezoo',cmd:'*'} )

