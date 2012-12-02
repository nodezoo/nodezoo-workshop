"use strict";

var logentries = require('node-logentries');
var log

var si = require('seneca')({xlog:'print'})

si.use( 'config', {object:require('../config.mine.js')} )

si.use('mongo-store')

si.act({role:'config',cmd:'get',base:'nodezoo'}, function(err,config){
  if( err ) throw err;

  log = logentries.logger({token:config.logentries.repo})
  si.use( require('../lib/nodezoo'), {log:log} )
})


si.use( require('seneca-transport-queue') )

