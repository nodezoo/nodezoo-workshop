


var app = {
  tm: {},
  em: {},
  state: {
    lastkeytime: Number.MAX_VALUE
  }
}



app.display_results = function(body) {
  var items = body.items
  var divr = $('<div>')
  for(var i = 0; i < items.length; i++) {
    var item = items[i]
    //console.log(item)
    var result = app.tm.result.clone()

    result.find('div.rank').css('background-image','url(img/hex'+item.rank+'.png)')

    result.find('a.site')
      .text(item.name+' '+item.latest)//+' s='+item.score+' r='+item.nr)
      .attr('href',item.site)

    var git = result.find('a.git')
    if( item.git && item.git != item.site ) {
      git.attr('href',item.git)
    }
    else {
      git.empty()
    }

    result.find('a.npm')
      .attr('href',"http://npmjs.org/package/"+item.name)

    result.find('p.desc').text(item.desc)

    var maintsdiv = result.find('div.maints').empty()
    for(var mI = 0; mI < item.maints.length; mI++) {
      //console.log(item.maints[mI])
      maintsdiv.append( $('<a>').attr('href','?q='+item.maints[mI]).text(item.maints[mI]) )
    }

    result.find('a.similar').attr('href','?s='+item.name)

    divr.append(result)
  }
  app.em.results.empty().append(divr)
}


app.query = function(q) {
  app.em.welcome.hide()
  app.state.lastkeytime = Number.MAX_VALUE
  var eq = encodeURIComponent(q)
  var href = document.location.href
  href = href.replace(/#.*$/,'')
  if( -1 == href.indexOf('?') ) {
    document.location.href = href+ '#q='+eq 
  }

  app.record_search(q)

  $.ajax({
    url: "/api/query?q="+eq,
    success: app.display_results
  })
}


app.record_search = function(term) {
  clearTimeout(app.record_search_interval)
  app.record_search_interval = setTimeout(function(){
    //console.log(term)
    _gaq.push(['_trackEvent', 'act', 'search', term]);
  },2222)
}


app.similar = function(name) {
  app.state.lastkeytime = Number.MAX_VALUE
  var ename = encodeURIComponent(name)
  $.ajax({
    url: "/api/similar?name="+ename,
    success: app.display_results
  })
}

app.route = function() {
  var up = parseUri(document.location.href)
  var qs = up.query || up.anchor
  //console.log(qs)
  var qp = {}
  _.each(qs.split('&'),function(kvs){var kv=kvs.split('=');qp[kv[0]]=kv[1]})
  if( qp.q ) {
    var q = decodeURIComponent(qp.q)
    app.em.term.val(q)
    app.query(q)
  }

  else if( qp.s ) {
    var name = decodeURIComponent(qp.s)
    app.similar(name)
  }
}

app.init = function() {
  app.em.results = $('#results')
  app.em.term    = $('#term')
  app.em.welcome = $('#welcome')
  app.em.about   = $('a.about')

  app.tm.result = $('#result').clone().removeClass('tm')
  
  $('#query_form').submit(function(){
    var q = app.em.term.val()
    //console.log('q='+q)
    app.query(q)
    return false
  })

  app.em.term.keyup(function(ev){
    if( 13 != ev.keyCode ) {
      app.state.lastkeytime = $.now()
    }
  })

  app.em.about.click(function(){
    app.em.results.empty()
    app.em.welcome.show()
  })

  setInterval(function(){
    if( 222 < $.now() - app.state.lastkeytime ) {
      var q = app.em.term.val()
      //console.log('auto q='+q)
      app.query(q)
    }
  },222)

  app.route()
}


$(app.init)




