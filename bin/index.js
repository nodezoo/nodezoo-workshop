
var fs = require('fs')
var js = require('JSONStream')
var _ = require('underscore')
var request = require('request')
var byline = require('byline')


var prmap = {}
var count = 0
var rs
(rs=fs.createReadStream('pr.json')).setEncoding('ascii')
rs.pipe(js.parse([true]).on('data',function(data){
    //console.log(data)
    
    prmap[data.m]=data.pr
}).on('root',function(){
    //console.log(prmap)


    var rs=fs.createReadStream('npm.json'); rs.setEncoding('ascii')

    var linestream = byline.createStream()

    linestream.on('data', function(line){
	try {
	    var data = JSON.parse(line.substring(0,line.length-1))
	    count++

	    var v = data.value

	    var doc = {
		name:v.name,
		desc:v.description||'',
		latest:v['dist-tags'].latest,
		author:(v.author&&v.author.name)||''
	    }

	    var r = v.versions[doc.latest]
	    if( r ) {
		if( r.homepage ) {
		    doc.site = r.homepage
		}
		doc.keywords = (r.keywords||[])
		if( _.isArray( doc.keywords ) ) {
	           doc.keywords = doc.keywords.join(' ')
		}
		doc.license = r.license||''

		try {
		    doc.maints = _.isArray(r.maintainers)?_.map(r.maintainers||[],function(m){return m.name}).join(' '):''+r.maintainers
		}
		catch( e ) {
		    console.error(e)
		}

		doc.readme = r.readme||''

		if( r.repository && r.repository.url ) {
		    var git = r.repository.url.replace(/^git:/,"https:").replace(/\.git$/,"") 
		    doc.git = git
		    if( !doc.site ) {
			doc.site = git
		    }
		}
	    }


	    if( prmap[v.name] ) {
		doc.nr = prmap[v.name]
		doc._boost = prmap[v.name] / 10
	    }
	    else {
		doc._boost = 1
	    }

	    var mul = {}

	    if( doc.latest ) {
		try {
		    mul.version = 1
		    var parts = doc.latest.split('.')
		    for( var pI = 0; pI < parts.length; pI++ ) {
			try {
			    mul.version += parseInt(parts[pI].substring(0,1)) / (1000 * (parts.length-pI))
			} catch(e) {}
		    }
		    doc._boost *= mul.version
		}
		catch(e){}
	    }

	    if( v.time ) {
		try {
		    var now = new Date().getTime()
		    if( v.time.created && v.time.modified ) {
			var created = new Date(v.time.created).getTime()
			var modified = new Date(v.time.modified).getTime()
			var age = now - created
			var recent = now - modified
			mul.time = 1 + Math.min( 0.001, ( age / recent ) / 10000 )
			doc._boost *= mul.time
		    }
		}
		catch(e){}
	    }


	    request({method:'POST',url:"http://165.225.148.40:9200/zoo/doc/"+doc.name,json:doc},function(err,res,bdy){
		console.log(v.name+' '+err+' '+bdy)
	    })

	    console.log(doc.name+' r='+doc.nr+' b='+doc._boost+' vm='+mul.version+' tm='+mul.time)
	}
	catch( e ) {
	    console.error(e)
	}
    })

    rs.pipe(linestream)

}))


/*
	{
"id":"0x21","key":"0x21","value":{
"_id":"0x21","_rev":"3-0e422a52b4902ef18228b4443d0da70b","name":"0x21","description":"0x21 === `!`","dist-tags":{
"latest":"0.0.1"},"versions":{
"0.0.1":{
"name":"0x21","version":"0.0.1","description":"0x21 === `!`","keywords":["0x21","!","bang"],"author":{
"name":"cfddream","email":"cfddream@gmail.com","url":"http://kissdry.com/"},"license":"MIT","repository":{
},"scripts":{
},"dependencies":{
},"devDependencies":{
},"_id":"0x21@0.0.1","dist":{
"shasum":"9f3a1288040c3b46185cfbece5354f637dd57d01","tarball":"http://registry.npmjs.org/0x21/-/0x21-0.0.1.tgz"},"readme":"","maintainers":[{
"name":"cfddream","email":"cfddream@gmail.com"}]}},"readme":"","maintainers":[{
"name":"cfddream","email":"cfddream@gmail.com"}],"time":{
"modified":"2012-07-14T10:34:02.401Z","created":"2012-07-14T10:33:57.485Z","0.0.1":"2012-07-14T10:34:02.401Z"},"author":{
"name":"cfddream","email":"cfddream@gmail.com","url":"http://kissdry.com/"},"repository":{
},"_attachments":{
"0x21-0.0.1.tgz":{
"content_type":"application/octet-stream","revpos":3,"digest":"md5-w+yrlYHmf+Q+qQ2Fk1R/2Q==","length":288,"stub":true}}}},    count++

*/