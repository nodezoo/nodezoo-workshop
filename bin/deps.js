
var fs = require('fs')
var js = require('JSONStream')
var request = require('request')
var _ = require('underscore')

var read = fs.ReadStream('mods.json');
read.setEncoding('ascii'); 

var write = fs.WriteStream('deps.json');
write.setEncoding('ascii'); 

jsr = js.parse(['rows',true])
jsw = js.stringify()
var count = 0
var done  = 0
var waitfordone = false

function finish() {
  if( waitfordone && count == done ) {
    jsw.end()
  }
}

jsr.on('data',function(data){
  var modname = data.id
  console.log((++count)+' '+modname)
  request.get('http://isaacs.iriscouch.com/registry/'+modname,function(err,res){
    if( err ) {
      console.log(err)
      finish()
      return
    }

    console.log('RES:'+modname)
    var data = JSON.parse(res.body)
    var latest = (data['dist-tags']||{}).latest
    var deps = (data.versions && latest) ? _.keys( (data.versions[latest]||{}).dependencies || {} ) : []
    console.log('DEPS:'+modname+':'+deps)
    jsw.write({i:count,m:modname,d:deps})
    finish()
  })
})
jsr.on('root',function(data){
  waitfordone = true
})

read.pipe(jsr)
jsw.pipe(write)

