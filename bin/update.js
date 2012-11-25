/*
node update.js -d ids 
node update.js -d all -f ../data/npm.json
node update.js -p -f ../data/npm.json
node update.js -p -l -f ../data/npm.json
node update.js -l -f ../data/deps.json
*/


var fs       = require('fs')
var path     = require('path')

var request  = require('request')
var optimist = require('optimist')
var byline   = require('byline')
var js       = require('JSONStream')
var _        = require('underscore')

var nodezoo  = require('../lib/nodezoo.js')




function die(err) {
  console.error(err)
  process.exit(1)
}


var argv = optimist.argv

var total = 0

var urls = {
  all: "http://isaacs.iriscouch.com/registry/_design/app/_view/listAll",
  ids: "http://isaacs.iriscouch.com/registry/_all_docs"
}

function download( filepath, url, cb ) {
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
  console.log('Dependencies...')

  var depsfile = path.dirname(filepath) +'/deps.json'
  var fw = fs.WriteStream( depsfile )
  var jsw = js.stringify()
  jsw.pipe(fw)

  var index = 0

  var ls = makels(
    filepath, 
    function(line){
      try {
        var data = JSON.parse(line.substring(0,line.length-1)).value
      
        var latest = (data['dist-tags']||{}).latest
        var deps   = (data.versions && latest) ? _.keys( (data.versions[latest]||{}).dependencies || {} ) : []
        jsw.write({i:index,m:data.name,d:deps})
        index++

        if( 0 == index % 100 ) {
          process.stdout.write('.')
        }
      }
      catch(e) {
        console.log(e)
      }
    },
    function(){
      console.log('\nmodule-count:'+index)
      jsw.end()

      if( argv.l ) {
        links( depsfile )
      }
    })
}


function links( depsfile ) {
  var linksfile = path.dirname(filepath) +'/links.json'

  var read = fs.ReadStream(depsfile);
  read.setEncoding('ascii'); 
  var jsr = js.parse([true])

  var index = {}

  var links = {
    "py/object": "__main__.web",
    dangling_pages:{},
    in_links:{},
    number_out_links:{},
  }

  jsr.on('data',function(data){
    data.i = ''+data.i
    index[data.m]=data
    links.dangling_pages[data.i]=true
  })

  jsr.on('root',function(){

    var count = 0
    for( var n in index ) {
      count++
      var m = index[n]
      links.in_links[m.i] = []
    }

    for( var n in index ) {
      var m = index[n]
      for( var dI = 0; dI < m.d.length; dI++ ) {
        var depname = m.d[dI]
        if( !index[depname] ) {
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
  })

  read.pipe(jsr)

}


if( argv.d ) {
  var filepath = argv.d+'.json'
  if( argv.f ) {
    filepath = argv.f
  }
  var url = urls[argv.d]
  console.log('Downloading '+url+' to '+filepath)
  download(filepath,url,function(){
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