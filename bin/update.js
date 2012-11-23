
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

function download( url, cb ) {
  request( url )
    .on('data',function(data){total+=data.length})
    .pipe(fs.createWriteStream("ids.json")  
          .on('error',die)
          .on('close',cb))
}

function rank(){
  console.log('total:'+total)
}



if( argv.d ) {
  download(urls[argv.d],rank)
}