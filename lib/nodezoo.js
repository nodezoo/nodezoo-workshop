
var seneca  = require('seneca')()
var request = require('request')
var _ = require('underscore')

var log = {info:function(){},error:function(){}}


function rank(score) {
  var i = 0, cutoff = [0.1,1,5,10,20]
  while( cutoff[i++] < score ); 
  return i
}

function dorequest(q,url,cb){
  request( url, function( err, res, body ){
    if( err ) {
      log.error('search', '~'+q+'~'+err)
      return cb(err);
    }

    var qr = JSON.parse(body)
    var items = []

    var hits = qr.hits ? qr.hits.hits : qr.items

    if( hits ) {
      log.info('search', '~'+q+'~'+hits.length)
      for( var i = 0; i < hits.length; i++ ) {
        var hit = hits[i]
        delete hit.readme
        //console.dir(hit)
        var row = hit._source ? hit._source : hit
        items.push({
          name:row.name,
          desc:row.desc,
          latest:row.latest,
          maints:_.isArray(row.maints)?row.maints:row.maints.split(' '),
          site:row.site,
          git:row.git,
          rank:rank(row.nr||0),
          score:hit._score,
          nr:row.nr
        })
      }
    }
    else {
      log.info('search', '~'+q+'~'+0)
    }

    cb( null, {items:items} )
  })
}


function nodezoo(si,opts,cb) {
  log = opts.log || log

  opts.url = _.extend({
    prefix:'http://nodezoo.com/api/query?q=',
    suffix:''  
  },opts.url)

  si.add({role:'nodezoo',cmd:'ping'},function(args,cb){
    cb(null,{ping:new Date().toISOString()})
  })

  si.add({role:'nodezoo',cmd:'query'},function(args,cb){
    var q = args.q || args.query
    var url = opts.url.prefix + encodeURIComponent(q) + (opts.url.suffix||'')
    dorequest(q,url,cb)
  })


  si.add({role:'nodezoo',cmd:'similar'},function(args,cb){
    var name = args.name
    // FIX: make configurable
    var url = opts.url.prefix.replace('_search?q=','')
    url+=name+'/_mlt'
    console.log(url)
    dorequest(name,url,cb)
  })


  var api = si.http({
    prefix: '/api/',
    pin: {role:'nodezoo',cmd:'*'},
    map:{
      ping:{},
      query:{},
      similar:{}
    }
  })

  si.act({role:'config',cmd:'get',base:'nodezoo',default$:{}},function(err,config){
    if( err ) return cb(err);
    opts.url = opts.url || config.url
    cb( null, api )
  })
}

module.exports = seneca.module( nodezoo, {role:'nodezoo',cmd:'*'} )

