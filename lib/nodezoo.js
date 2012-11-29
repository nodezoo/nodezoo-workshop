
var seneca  = require('seneca')
var request = require('request')
var _       = require('underscore')

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
          nr:row.nr
        })
      }
    }
    else {
      log.info('search', '~'+q+'~'+0)
    }

    cb( null, {items:items} )
  })
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

      request(
        {
          method:'POST',
          url:url,
          json:data
        }, 
        si.result(cb,function(res,bdy){
          console.log(args.name)
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

