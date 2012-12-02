"use strict";

// node feeder.js -w 1000 -s 100 -b 60

var argv = require('optimist').argv
var wait = argv.w  // request delay
var size = argv.s  // limit s
var back = argv.b  // since b minutes

var logentries = require('node-logentries');
var log

var si = require('seneca')({xlog:'print'})

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
    var lastweek = new Date().getTime() - back*60*1000
    var modent = si.make('mod') 
      var q = {limit$:size,native$:true,lastgit:{$lt:lastweek}}
    modent.list$(q,function(err,list){
	console.log('list-len:'+list.length+' q='+JSON.stringify(q))
      die(err)

      function indexrepo(i) {
        if( i < list.length ) {
          var mod = list[i]
          console.log(mod.giturl)
          var m = /[\/:]([^\/]+?)\/([^\/]+?)(\.git)*$/.exec(mod.giturl)
          if( m ) {
            si.act({role:'nodezoo',cmd:'indexrepo',user:m[1],repo:m[2],name:mod.name},function(err){
              if( err ) {
                console.log('ERROR:'+mod+':'+err)
              }

              mod.lastgit = new Date().getTime()
              console.log(''+mod)
              mod.save$()

              setTimeout(function(){indexrepo(i+1)},wait)
            })
          }
          else indexrepo(i+1);
        }
        else setTimeout(feed,wait)
      }
      indexrepo(0)

    })
  }
  catch( e ) {
    die(e)
  }

}


si.ready(feed)


