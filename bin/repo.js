
var nodezoo = require('..')(require('../config.mine.js').nodezoo)
var argv = require('optimist').argv

nodezoo.indexrepo({user:argv.u,repo:argv.r,name:argv.m},function(err, repo){
  console.log(err)
  console.dir(repo)
})


/*
nodezoo.getrepo({user:argv.u,repo:argv.r},function(err, repo){
  if( err ) {
    return console.error(err)
  }
  else {
    nodezoo.repodata({name:argv.m,repo:repo},function(err,res){
      if( err ) return console.error(err)
      console.dir(res)
    })
  }
})
*/

