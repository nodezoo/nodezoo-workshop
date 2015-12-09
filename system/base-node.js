
var HOST = process.env.HOST || 'localhost'

require('seneca')()
  .use('mesh',{base:true})
