var nodezoo = require('..')()

nodezoo.query({q:'foo'},function(err, results ){
  console.dir(results)
})
