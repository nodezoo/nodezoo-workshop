require('seneca')()
  .use('../../seneca-msgstats',{pin:'role:search,cmd:search'})
  .use('../../nodezoo-index')

  .listen(9002)
  .repl(44002)


