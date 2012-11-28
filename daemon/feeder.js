"use strict";

var logentries = require('node-logentries');
var log

var nodezoo  = require('../lib/nodezoo.js')({},{log:'print'})
var si = nodezoo.seneca()

si.use( 'config', {object:require('../config.mine.js')} )

si.use('mongo-store')

si.use( require('seneca-transport-queue'), {
  pins:[{role:'nodezoo',cmd:'indexrepo'}]
})


function die(err) {
  if( err ) {
    console.error(err)
    process.exit(1)
  }
}


function feed() {
  try {
    var lastweek = new Date().getTime() - (7*24*60*60*1000)
    var modent = si.make('mod') 
    modent.list$({limit$:10,native$:true,lastgit:{$lt:lastweek}},function(err,list){
      die(err)
      console.dir(list)
      setTimeout(feed,5000)
    })
  }
  catch( e ) {
    die(e)
  }

}


si.ready(feed)


