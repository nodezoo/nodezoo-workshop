"use strict";

var _ = require('underscore')


// node feeder.js -w 1000 -s 100 -b 60

var argv = require('optimist').argv
var wait     = argv.w || 2000  // request delay
var size     = argv.s || 1000   // limit s
var back     = argv.b || 30    // since b minutes
var usequeue = _.isUndefined(argv.q) ? true : argv.q




var logentries = require('node-logentries');
var log

var si = require('seneca')({xlog:'print'})

si.use( 'config', {object:require('../config.mine.js')} )

si.use('mongo-store')


if( usequeue ) {
  console.log('using queue')
  si.use( require('seneca-transport-queue'), {
    pins:[
      {role:'nodezoo',cmd:'indexrepo'},
      {role:'nodezoo',cmd:'repodata'}
    ]
  })
}
else {
  si.use( require('../lib/nodezoo'), {} )
}



function die(err) {
  if( err ) {
    console.error(err)
    process.exit(1)
  }
}


function printlog(msg) {
  console.log(new Date().toISOString()+': '+msg)
}

function feed() {
  try {
    var backperiod = new Date().getTime() - back*60*1000
    var modent = si.make('mod') 
    var q_exists = {limit$:size,native$:true,git_star:{$exists:false}}
    var q_back = {limit$:size,native$:true,lastgit:{$lt:backperiod}}

    modent.list$(q_exists,function(err,list){
      printlog('exists list-len:'+list.length+' q='+JSON.stringify(q_exists))
      die(err)

      if( 0 == list.length ) {
        modent.list$(q_back,function(err,list){
          printlog('back list-len:'+list.length+' q='+JSON.stringify(q_back))
          die(err)

          if( 0 < list.length ) {
            indexrepo(list,0)
          }
          else setTimeout(feed,100*wait)
        })
      }
      else indexrepo(list,0);


      function indexrepo(list,i) {
	  console.log('indexrepo '+i+' len='+list.length)
        if( i < list.length ) {
          var mod = list[i]
          printlog(i+' '+mod.name+' '+mod.giturl)

          var m = /[\/:]([^\/]+?)\/([^\/]+?)(\.git)*$/.exec(mod.giturl)
          if( m ) {
            si.act({role:'nodezoo',cmd:'indexrepo',user:m[1],repo:m[2],name:mod.name},function(err){
              if( err ) {
                printlog('ERROR:'+mod+':'+err)
              }

              mod.lastgit = new Date().getTime()
              printlog('indexrepo done: '+mod)
              mod.save$()

		setTimeout(function(){indexrepo(list,i+1)},wait)
            })
          }
          else {
            si.act({role:'nodezoo',cmd:'repodata',name:mod.name,repo:{}},function(err){
              if(err) return printlog(err);
            })
            indexrepo(list,i+1);
          }
        }
        else setTimeout(feed,wait)
      }
    })
  }
  catch( e ) {
    die(e)
  }
}


si.ready(feed)


