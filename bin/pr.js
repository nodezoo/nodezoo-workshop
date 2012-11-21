
var fs = require('fs')
var js = require('JSONStream')
var _ = require('underscore')

//var numeric = require('./numeric')




var numpy = exports.numpy = {
  sum: function(arr) {
    arr = _.flatten(arr)
    var out = 0
    for( var i = 0; i < arr.length; i++ ) {
      out += arr[i]
    }
    return out
  }
}

function repeats(x) {
  return function(spec) {
    var size = spec[0]
    var len  = spec[1]
    var out = []
    for(var i = 0; i < size; i++ ) {
      var elem = []
      for(var j = 0; j < len; j++ ) {
        elem.push(x)
      }
      out.push(elem)
    }
    return out
  }
}

numpy.zeros = repeats(0)
numpy.ones  = repeats(1)

/*
function sumarr(arr) {
  var out = 0
  for( var i = 0; i < arr.length; i++ ) {
    out += arr[i][0]
  }
  return out
}
*/

function step(g,p,s) {
  s = s || 0.85
/**
  '''Performs a single step in the PageRank computation,
  with web g and parameter s.  Applies the corresponding M
  matrix to the vector p, and returns the resulting
  vector.'''
*/

  var n = g.size
  var v = numpy.zeros((n,1))
  //var inner_product = sum([])//[p[j] for j in g.dangling_pages.keys()] )
  //console.log( _.keys(g.dangling_pages) )
  //console.log( _.map(_.keys(g.dangling_pages),function(j){return p[j]}) )
  
  var inner_product = numpy.sum(_.map(_.keys(g.dangling_pages),function(j){return p[j]}))
  console.log('inner_product: '+inner_product)

  //for j in xrange(n):
  for( var j = 0; j < n; j++ ) {
    var arrpk = []
    var linkarr = g.in_links[j]
    for( var kI = 0; kI < linkarr.length; kI++ ) {
      var k = linkarr[kI]
      //console.log('k='+k+' ol:'+g.number_out_links[k])
      if( 0 ==g.number_out_links[k] ) throw new Error('divbyz '+k)
      arrpk.push( p[k]/g.number_out_links[k] )
    }
    //console.dir(arrpk)

    sumpk = numpy.sum(arrpk)

    v[j] = s * sumpk + s * inner_product / n+(1-s) / n
  }

/*
  # We rescale the return vector, so it remains a
  # probability distribution even with floating point
  # roundoff.
*/

  //console.log( numpy.sum(v) )
  //console.log(v)

  var sumv = numpy.sum(v)  
  //console.log(sumv)

  v = _.map(v,function(a){
    //a[0] = a[0] / sumv
    //a[0] = a[0] * 1.1
    return a / sumv
  })
  return v
}

function pagerank(g,s,tolerance) {
  s = s || 0.85
  tolerance = tolerance || 0.00001

/*
  '''Returns the PageRank vector for the web g and
  parameter s, where the criterion for convergence is that
  we stop when M^(j+1)P-M^jP has length less than
  tolerance, in l1 norm.'''
*/

  var n = g.size
  var p = _.map(numpy.ones([n,1]),function(xa){return [xa[0]/n]})
  var iteration = 1
  var change = 2

  while( change > tolerance ) {
    console.log( "Iteration: " + iteration )
    var new_p = step(g,p,s)
    //console.log('step')
    //console.dir(new_p)

    var pdiff = []
    for(var i = 0; i < p.length; i++) {
      pdiff[i] = [ Math.abs(p[i]-new_p[i]) ]
    }

    change = numpy.sum( pdiff )
    console.log( "Change in l1 norm: " + change )
    p = new_p
    iteration += 1
  }

  return p
}

var g = JSON.parse(fs.readFileSync('links.json'))
console.log(g.size)
pr = pagerank(g,0.85,0.0001)

var deps = JSON.parse( fs.readFileSync('deps.json') )

var write = fs.WriteStream('pr.json');
jsw = js.stringify()
jsw.pipe(write)

for(var i = 0; i < pr.length; i++) {
  delete deps[i].d
  deps[i].pr = 1000*pr[i]
  jsw.write(deps[i])
}
jsw.end()


