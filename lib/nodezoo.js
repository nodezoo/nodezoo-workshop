
var seneca  = require('seneca')()
var request = require('request')



function nodezoo(si,opts,cb) {

  si.add({role:'nodezoo',cmd:'ping'},function(args,cb){
    cb(null,{ping:new Date().toISOString()})
  })

  si.add({role:'nodezoo',cmd:'query'},function(args,cb){
    var q = args.q || args.query
    var url = opts.url.prefix + encodeURIComponent(q) + (opts.url.suffix||'')

    request( url, function( err, res, body ){
      if( err ) return cb(err);
      var qr = JSON.parse(body)
      var items = []

      for( var i = 0; i < qr.hits.hits.length; i++ ) {
        var hit = qr.hits.hits[i]
        var row = hit._source
        items.push({
          name:row.name,
          desc:row.desc,
          latest:row.latest,
        })
      }

      cb( null, items )
    })
  })

  var api = si.http({
    prefix: '/api/',
    pin: {role:'nodezoo',cmd:'*'},
    map:{
      ping:{},
      query:{}
    }
  })

  si.act({role:'config',cmd:'get',base:'nodezoo',default$:{}},function(err,config){
    if( err ) return cb(err);
    opts.url = opts.url || config.url
    cb( null, api )
  })
}

module.exports = seneca.module( nodezoo, {role:'nodezoo',cmd:'*'} )

