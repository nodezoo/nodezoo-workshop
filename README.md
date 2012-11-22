nodezoo
=======

A search engine for Node.js modules - visit: (nodezoo.com)[http://nodezoo.com]

This is a web app, command line utility, and module. 


```sh
npm install nodezoo
```

And then:

```sh
nodezoo foo
```

And also:

```javascript
var nodezoo = require('nodezoo')()

nodezoo.query({q:'foo'},function(err, results ){
  console.dir(results)
})
```

You'll need network access to http://nodezoo.com for this work, of course.


more docs to come...




