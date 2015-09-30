require('seneca')()
  .use('../../nodezoo-index')

  .listen(9003)
  .repl(44003)
