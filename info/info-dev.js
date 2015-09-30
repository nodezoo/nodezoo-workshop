require('seneca')()
  .use('redis-transport')
  .use('../../nodezoo-info')

  .client({type:'redis',pin:'role:info,req:part'})
  .listen({type:'redis',pin:'role:info,res:part'})

  .listen(9100)
  .repl(44100)
