
var assert = require('assert')
var nodezoo = require('..')

var config = require('../config.mine.js')

module.exports = {
  query: function(){
    var nz = nodezoo(config.nodezoo)
    nz.query({q:"mysql"},function(err,res){
      assert.isNull(err)
      console.dir(res)
    })
  }
}