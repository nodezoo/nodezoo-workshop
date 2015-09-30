require('seneca')()
  .use('redis-transport')
  .use('level-store')
  .use('../../nodezoo-github')

  .add('role:info,req:part',function(args,done){
    done()

    this.act(
      'role:github,cmd:get',
      {name:args.name},

      function(err,mod){
        if( err ) return;

        if( mod ) {
          this.act('role:info,res:part,part:github',
                   {name:args.name,data:mod.data$()})
        }
        else {
          this.act(
            'role:npm,cmd:get',
            {name:args.name},

            function(err,mod){
              if( err ) return;
              
              if( mod ) {
                this.act(
                  'role:github,cmd:get',
                  {name:args.name,giturl:mod.giturl},
                  
                  function( err, mod ){
                    if( err ) return;

                    if( mod ) {
                      this.act('role:info,res:part,part:github',
                               {name:args.name,data:mod.data$()})
                    }
                  })
              }
            })
        }
      })
  })

  .listen({type:'redis',pin:'role:info,req:part'})
  .client({type:'redis',pin:'role:info,res:part'})

  .client({port:9001,pin:'role:npm'})

  .listen(9002)
  .repl(44002)

