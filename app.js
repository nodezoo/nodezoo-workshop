"use strict";

var express = require('express')
var seneca  = require('seneca')

var si = seneca({log:'print'})

si.use( 'config', {object:require('./config.mine.js')} )
si.use( require('./lib/nodezoo') )



var app = express()

app.use(express.cookieParser())
app.use(express.query())
app.use(express.bodyParser())
app.use(express.methodOverride())
app.use(express.json())
//app.use(express.session({ secret: 'waterford' }))


app.use( si.service() )

app.listen(8101)


