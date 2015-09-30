
require('seneca')()

  .use('redis-transport')
  .use('beanstalk-transport')
  .use('level-store')
  .use('../../nodezoo-npm')

  .add('role:info,req:part',function(args,done){
    done()

    this.act(
      'role:npm,cmd:get',
      {name:args.name},
      function(err,mod){
        if( err ) return done(err);
        
        this.act('role:info,res:part,part:npm',
                 {name:args.name,data:mod.data$()})
      })
  })

  .add('role:npm,info:change',function(args,done){
    done()
    this.act('role:npm,cmd:get',{name:args.name,update:true})
  })

  .listen({type:'redis',pin:'role:info,req:part'})
  .client({type:'redis',pin:'role:info,res:part'})

  .listen({type:'beanstalk',pin:'role:npm,info:change'})

  .client({port:9003,pin:'role:search'})

  .listen(9001)
  .repl(44001)
