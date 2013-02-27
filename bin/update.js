/*
node update.js -d ids 
node update.js -d all -f ../data/npm.json

node update.js -p -f ../data/npm.json
node update.js -l -f ../data/deps.json
node update.js -r -f ../data/deps.json
node update.js -m -f ../data/deps.json
node update.js -i -f ../data/rank.json -h http://127.0.0.1:9200/zoo/doc/

node update.js -p -l -r -i -f ../data/npm.json -h http://127.0.0.1:9200/zoo/doc/

node update.js -d all -f ../data/npm.json -p -l -r -i -m -h http://127.0.0.1:9200/zoo/doc/

*/


var fs       = require('fs')
var path     = require('path')

var request  = require('request')
var optimist = require('optimist')
var byline   = require('byline')
var js       = require('JSONStream')
var _        = require('underscore')

var argv = optimist.argv

var config = require( argv.c || '../config.mine.js')

var noderank = require('./noderank.js')
var nodezoo  = require('../lib/nodezoo.js')(config.nodezoo)





function die(err) {
  if( err ) {
    console.error(err)
    process.exit(1)
  }
}


function cutcomma(str) {
  if( str.match(/,$/) ) {
    return str.substring(0,str.length-1)
  }
  else return str;
}


var npmentry = {
  latest: function(data) {
    var value = data.value || {}
    var version = (value['dist-tags']||{}).latest
    var latest = (value.versions && version) ? value.versions[version] : null
    return latest
  }
}





var total = 0

var urls = {
  all: "http://isaacs.iriscouch.com/registry/_design/app/_view/listAll",
  ids: "http://isaacs.iriscouch.com/registry/_all_docs"
}

function download( filepath, url, cb ) {
    console.log('STAGE: download'+filepath+' '+url )
  request( url )
    .on('data',function(data){
      var previous = total
      var datalen = data.length
      total += datalen
      if( Math.floor(previous/102400) < Math.floor(total/102400) ) { 
        process.stdout.write('.')
      }
    })
    .pipe(fs.createWriteStream(filepath)  
          .on('error',die)
          .on('close',function(){
            console.log('\nbyte-size:'+total)
            cb()
          }))
}


function makels(filepath,online,onend) {
  var rs=fs.createReadStream(filepath)
  rs.setEncoding('ascii')
  var ls = byline.createStream()
  online && ls.on('data', online) 
  onend  && ls.on('end',  onend) 
  rs.pipe(ls)
  return ls
}



function deps(filepath) {
  console.log('STAGE: deps'+filepath)


  var depsfile = path.dirname(filepath) +'/deps.json'
  var fw = fs.WriteStream( depsfile )
  var jsw = js.stringify()
  jsw.pipe(fw)

    fw.on('close',function(){
	console.log('fw close')
      if( argv.l ) {
        links( depsfile )
      }
    })

  var index = 0

  var ls = makels(
    filepath, 
    function(line){
      try {
        var data = JSON.parse( cutcomma(line) ).value

        // avoid falsey names
        if( data.name ) {
      
          var latest = (data['dist-tags']||{}).latest
          var deps   = (data.versions && latest) ? _.keys( (data.versions[latest]||{}).dependencies || {} ) : []
          jsw.write({i:index,m:data.name,d:deps})
          index++

          if( 0 == index % 100 ) {
            process.stdout.write('=')
          }
        }
      }
      catch(e) {
        console.log(e)
      }
    },
    function(){
      console.log('\nmodule-count:'+index)
      jsw.end()

    })
}


function links( pathfile ) {
  console.log('STAGE: links '+filepath)

  var depsfile = path.dirname(filepath) +'/deps.json'
  var linksfile = path.dirname(filepath) +'/links.json'

  var read = fs.ReadStream(depsfile);
  read.setEncoding('ascii'); 
  //var jsr = js.parse([true])

  var linestream = byline.createStream()


  var index = {}

  var links = {
    "py/object": "__main__.web",
    dangling_pages:{},
    in_links:{},
    number_out_links:{},
  }

  var count = 0
  linestream.on('data',function(line){
    if( ',' == line || '[' == line || ']' == line ) return;

    try {
      var data = JSON.parse(cutcomma(line))

      data.i = ''+data.i
      index[data.m]=data
      links.dangling_pages[data.i]=true
      count++
      if( 0 == count % 100 )  {
	process.stdout.write('+')
      }
    }
    catch( e ) {
      console.log(e+' bad line:<'+line+'>')
    }
  })

  linestream.on('end',function(){
    console.log('end')

    var count = 0
    for( var n in index ) {
      count++
      var m = index[n]
      links.in_links[m.i] = []
    }

    for( var n in index ) {
      var m = index[n]
      //console.log(n+' -> '+m.d)
      for( var dI = 0; dI < m.d.length; dI++ ) {
        var depname = m.d[dI]
        if( _.isUndefined(index[depname]) ) {
          continue
        }


        var dep = index[depname].i
        links.in_links[dep].push( m.i )



        if( _.isUndefined(links.number_out_links[m.i]) ) {
          links.number_out_links[m.i]=1
          delete links.dangling_pages[m.i]
        }
        else {
          links.number_out_links[m.i]++
        }
      }
    }

    links.size = count

    fs.writeFileSync(linksfile,JSON.stringify(links))
    console.log('links-size:'+count)

    if( argv.r ) {
      rank(depsfile)
    }
  })

  read.pipe(linestream)

}


function rank(depsfile) {
  var depsfile = path.dirname(filepath) +'/deps.json'

  console.log('STAGE: rank'+depsfile)
  var deps = JSON.parse( fs.readFileSync( depsfile ) )

  var linksfile = path.dirname(depsfile) +'/links.json'
  var rankfile = path.dirname(depsfile) +'/rank.json'

  var write = fs.WriteStream( rankfile )
  var jsw = js.stringify()

    write.on('close',function(){
	if( argv.m ) {
	    mongo(depsfile)
	} 
        else if( argv.i ) {
            insertall(depsfile,argv.h)
        }
    })

  jsw.pipe(write)

  var count = 0

  var g = JSON.parse(fs.readFileSync( linksfile ))
  var rank = noderank(g,0.85,0.0001)


  jsw.on('end',function(){
    console.log( 'rank-size:'+count)
  })

  for(var i = 0; i < rank.length; i++) {
    count++
    delete deps[i].d
    deps[i].r = 1000*rank[i]
    jsw.write(deps[i])
  }
  jsw.end()

}


function mongo(depsfile) {
    console.log('STAGE: mongo: '+depsfile)

  var npmfile = path.dirname(depsfile) +'/npm.json'

  var si = nodezoo.seneca()
  si.use('mongo-store',config.mongo)

  si.ready(function(err,si){
    console.log('ready '+err+si)

    var read = fs.ReadStream(npmfile);
    read.setEncoding('ascii'); 

    var linestream = byline.createStream()
    var count = 0
    var done  = 0

    var modent = si.make('mod')

    linestream.on('data', function(line){
      try {
	var data = JSON.parse( cutcomma(line) )
	count++

        modent.load$({name:data.id},function(err,mod){
          if(err) {
            return console.error(err)
          }
          mod = mod || modent.make$()
          mod.name = data.id

          var latest = npmentry.latest(data)
          if( latest && latest.repository && 'git'==latest.repository.type ) {
            mod.lastgit = mod.lastgit || 0
            mod.giturl = latest.repository.url
          }
          else {
            mod.lastgit = Number.MAX_VALUE
          }

          mod.lastnpm = mod.lastnpm || 0
          mod.save$(function(err,mod){
            done++
            if( 0 == count % 100 ) {
              process.stdout.write('*')
            }
          })
        })
      }
      catch(e){
        console.error(e)
      }
    })

    linestream.on('end',function(){
      console.log('\nmongo-size:'+count)

	console.log('count:'+count+' done:'+done)
      function waitfordb() {
        if( done < count ) {
	    process.stdout.write(' '+done)
          setTimeout(waitfordb,333)
        }
        else {
          si.close()
          if( argv.i ) {
              insertall(depsfile,argv.h)
          }
        }
      }
      waitfordb()
    })

    read.pipe(linestream)
  })
}


function insertall(filepath,hosturl) {
    console.log('STAGE: insertall: '+filepath+' '+hosturl)
    var rankfile = path.dirname(filepath)+'/rank.json'
    var npmfile  = path.dirname(filepath)+'/npm.json'
  nodezoo.insertall({rankfile:rankfile,npmfile:npmfile,hosturl:hosturl},function(err,res){
    die(err)
    console.dir(res)
    
    if( argv.g ) {
      gitmeta()
    }
  })
}



function gitmeta(depsfile) {
  var si = nodezoo.seneca()
  si.use('mongo-store',config.mongo)

  si.ready(function(err,si){
    console.log('ready '+err+si)

    var modent = si.make('mod') 
    var q_gitmeta = {native$:true,git_star:{$exists:true}}

    modent.list$(q_gitmeta,function(err,list){
      console.log('meta list-len:'+list.length+' q='+JSON.stringify(q_gitmeta))
      die(err)

      function updatemeta(list,i) {
        if( i < list.length ) {
	    var mod = list[i]
	    console.log(i+' '+mod)
          nodezoo.repodata({name:mod.name,repo:{watchers:mod.git_star,forks:mod.git_fork}},function(err,res){
            if( err ) { console.log(err) }
            if( 0 == i % 100 ) {
              process.stdout.write('^')
            }
            updatemeta(list,i+1)
          })
        }
      }

      updatemeta(list,0)
    })
  })
}





var filepath

if( argv.d ) {
  filepath = argv.d+'.json'
  if( argv.f ) {
    filepath = argv.f
  }
  var url = urls[argv.d]
  console.log('Downloading '+url+' to '+filepath)
  download(filepath,url,function(){
    console.log('download done')
    if( argv.p ) {
      deps(filepath)
    }
  })
}
else if( argv.p ) {
  filepath = argv.f
  deps(filepath)
}
else if( argv.l ) {
  filepath = argv.f
  links(filepath)
}
else if( argv.r ) {
  filepath = argv.f
  rank(filepath)
}
else if( argv.m ) {
  filepath = argv.f
  mongo(filepath)
}
else if( argv.i ) {
  filepath = argv.f
  var hosturl = argv.h
  insertall(filepath,hosturl)
}
else if( argv.g ) {
  gitmeta()
}

