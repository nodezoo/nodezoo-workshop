
var fs       = require('fs')
var request  = require('request');
var optimist = require('optimist');
var nodezoo  = require('..')



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
            process.stdout.write('\n')
            console.log('total:'+total)
            cb()
          }))
}


function rank(){
  console.log('rank')
}



if( argv.d ) {
  var filepath = argv.d+'.json'
  if( argv.f ) {
    filepath = argv.f
  }
  var url = urls[argv.d]
  console.log('Downloading '+url+' to '+filepath)
  download(filepath,url,function(){
    if( argv.r ) {
      rank()
    }
  })
}
else if( argv.r ) {
  rank()
}