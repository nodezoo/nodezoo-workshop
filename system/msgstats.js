
var HOST = process.env.HOST || 'localhost'

require('seneca')()
  .use('msgstats',{
    udp:{host:HOST},
    collect:true,
    ratios:[['res:part,role:info','req:part,role:info']]
  })
