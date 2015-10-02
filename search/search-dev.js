require('seneca')()
  .use('../../seneca-msgstats',{pin:'role:search,cmd:search'})
  .use('../../nodezoo-index')

  .listen(9003)
  .repl(44003)


