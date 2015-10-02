require('seneca')()
  .use('level-store')
  .use('beanstalk-transport')
  .use('../../seneca-msgstats',{pin:'role:npm,info:change'})
  .use('../../nodezoo-npm-update')

  .client({pin:'role:npm,info:change',type:'beanstalk'})

  .listen(9201)
  .repl(44201)
