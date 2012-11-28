
var assert = require('assert')
var nodezoo = require('..')

var config = require('../config.mine.js')

var nz = nodezoo(config.nodezoo)

module.exports = {

  query: function(){
    nz.query({q:"mysql"},function(err,res){
      assert.isNull(err)
      console.dir(res)
    })
  },

  getrepo: function(){
    nz.getrepo({user:"rjrodger",repo:'nodezoo'},function(err,res){
      assert.isNull(err)
      console.dir(res)
    })
  },

  repodata: function(){
    try {
      nz.repodata({name:"nodezoo",repo:{watchers:1}},function(err,res){
        assert.isNull(err)
        console.dir(res)
      })
    }
    catch(e) {
      console.log(e)
    }
  }

}