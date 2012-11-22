
var nodezoo = require('..')({url:{
  prefix:'http://nodezoo.com/api/query?q=',
  suffix:''
}})

nodezoo.query({q:'test'},function(err, res ){
  console.dir(res)
})