"use strict";

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
    var lastweek = new Date().getTime() - (7*24*60*60*1000)
    var modent = si.make('mod') 
    modent.list$({limit$:10,native$:true,lastgit:{$lt:lastweek}},function(err,list){
      console.log('list-len:'+list.length)
      die(err)

      function indexrepo(i) {
        if( i < list.length ) {
          var mod = list[i]
          var m = /\/([^\/]+?)\/([^\/]+?)\.git$/.exec(mod.giturl)
          if( m ) {
            si.act({role:'nodezoo',cmd:'indexrepo',user:m[1],repo:m[2],name:mod.name},function(err){
              if( err ) {
                console.log('ERROR:'+mod+':'+err)
              }

              mod.lastgit = new Date().getTime()
              console.log(''+mod)
              mod.save$()

              setTimeout(function(){indexrepo(i+1)},5000)
            })
          }
          else indexrepo(i+1);
        }
        else setTimeout(feed,5000)
      }
      indexrepo(0)

    })
  }
  catch( e ) {
    die(e)
  }

}


si.ready(feed)


