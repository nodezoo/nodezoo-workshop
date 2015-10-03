require('seneca')()
  .use('redis-transport')
  .use('../../nodezoo-info')

  .client({type:'redis',pin:'role:info,req:part'})
  .listen({type:'redis',pin:'role:info,res:part'})

  .listen(44001)
  .repl(43001)
