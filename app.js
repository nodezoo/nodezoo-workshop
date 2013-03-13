"use strict";

var express = require('express')
var seneca  = require('seneca')()

var logentries = require('node-logentries'), log


try {
  seneca.use( 'config', {object:require('./config.mine.js')} )
}
catch(e) {
  console.log(e)
}


seneca.act(
  {role:'config',cmd:'get',base:'nodezoo',default$:{
    web: { port: 8101 }
  }}, 
  function(err,config){
    if( err ) throw err;

    if( config.logentries ) {
      log = logentries.logger({token:config.logentries.token})
    }
    else {
      log = {
        debug: console.log,
        info: console.log,
        notice: console.log,
        warning: console.log,
        err: console.log,
        crit: console.log,
        alert: console.log,
        emerg: console.log,
        log: console.log,
      }
    }
    seneca.use( './lib/nodezoo', {log:log} )

    start_express(config)
  })


function start_express(config) {
  var app = express()

  app.use(express.cookieParser())
  app.use(express.query())
  app.use(express.bodyParser())
  app.use(express.methodOverride())
  app.use(express.json())
  app.use(express.static(__dirname+'/site/public'))
  //app.use(express.session({ secret: 'waterford' }))


  app.use( seneca.service() )

  log.info('start '+config.instance)
  app.listen( config.web.port )
}


