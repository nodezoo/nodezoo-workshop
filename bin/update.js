/*
node update.js -d ids 
node update.js -d all -f ../data/npm.json

node update.js -p -f ../data/npm.json
node update.js -l -f ../data/deps.json
node update.js -r -f ../data/deps.json
node update.js -i -f ../data/rank.json -h http://127.0.0.1:9200/zoo/doc/

node update.js -p -l -r -i -f ../data/npm.json -h http://127.0.0.1:9200/zoo/doc/

node update.js -d all -f ../data/npm.json -p -l -r -i -h http://127.0.0.1:9200/zoo/doc/

*/


var fs       = require('fs')
var path     = require('path')

var request  = require('request')
var optimist = require('optimist')
var byline   = require('byline')
var js       = require('JSONStream')
var _        = require('underscore')

var noderank = require('./noderank.js')
var nodezoo  = require('../lib/nodezoo.js')




function die(err) {
  console.error(err)
  process.exit(1)
}


function cutcomma(str) {
  if( str.match(/,$/) ) {
    return str.substring(0,str.length-1)
  }
  else return str;
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
        var data = JSON.parse( cutcomma(line) ).value
      
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

    if( argv.i ) {
      index(linksfile)
    }
  })

  read.pipe(jsr)

}


function rank(depsfile) {
  var deps = JSON.parse( fs.readFileSync( depsfile ) )

  var linksfile = path.dirname(depsfile) +'/links.json'
  var rankfile = path.dirname(depsfile) +'/rank.json'

  var write = fs.WriteStream( rankfile )
  var jsw = js.stringify()
  jsw.pipe(write)

  var count = 0

  var g = JSON.parse(fs.readFileSync( linksfile ))
  var rank = noderank(g,0.85,0.0001)


  jsw.on('end',function(){
    console.log( 'rank-size:'+count)
    if( argv.i ) {
      index(rankfile)
    }
  })

  for(var i = 0; i < rank.length; i++) {
    count++
    delete deps[i].d
    deps[i].r = 1000*rank[i]
    jsw.write(deps[i])
  }
  jsw.end()

}


function index(rankfile) {
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
	    var data = JSON.parse( cutcomma(line) )
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
	      catch( e ) {
		console.error(e)
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
		}
	      }
	      catch(e){}
	    }


	    request({method:'POST',url:argv.h+doc.name,json:doc},function(err,res,bdy){
	      //console.log(v.name+' '+err+' '+bdy)
              if( err ) {
                console.error(v.name+' '+err+' '+bdy)
              }
	    })

	    //console.log(doc.name+' r='+doc.nr+' b='+doc._boost+' vm='+mul.version+' tm='+mul.time)

            if( 0 == count % 100 ) {
              process.stdout.write('.')
            }

	  }
	  catch( e ) {
            console.log(line)
	    console.error(e)
	  }
        })

        linestream.on('end',function(){
          console.log('\nindex-size:'+count)
        })

        rs.pipe(linestream)
      }))
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
else if( argv.r ) {
  filepath = argv.f
  rank(filepath)
}
else if( argv.i ) {
  filepath = argv.f
  index(filepath)
}

