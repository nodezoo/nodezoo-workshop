


var fs = require('fs')
var js = require('JSONStream')
var request = require('request')
var _ = require('underscore')

var read = fs.ReadStream('deps.json');
read.setEncoding('ascii'); 


jsr = js.parse([true])
jsw = js.stringify()



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
      //console.log(depname)
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

  fs.writeFileSync('links.json',JSON.stringify(links))
})

read.pipe(jsr)


