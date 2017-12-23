const http = require('http');
const https = require('https');
var app = require('../htmlStats.js');    
var test = require('unit.js');

describe('Test html meta info', function(){
	it('functions test', function(){
		test.object(app).hasProperty('readLine')
										.hasProperty('requestAndParse');
	});
	it('test good address', function(done){
	  test.error(app.requestAndParse("https://nodejs.org", https, (ret)=>{
		test.object(ret);
		done();		
		}));
	});
	it('test retrieved object', function(done){
	app.requestAndParse("https://nodejs.org", https, (ret)=>{
		test.object(ret)
					.hasProperty('tagChildrenInfo')
					.hasProperty('tagChildren')
					.hasProperty('resources')
					.hasProperty('tagCount')
					.hasProperty('treeDepth');
		done();
	 });
	});
	it('test tag count', function(done){
	app.requestAndParse("https://nodejs.org", https, (ret)=>{
		test.object(ret.tagCount)
					.is( { html: 1, body: 1, center: 2, hr: 1, h1: 1, head: 1, title: 1 });
		done();
	 });
   });
	it('test tag children count', function(done){
		app.requestAndParse("https://nodejs.org", https, (ret)=>{
			test.object(ret.tagChildren)
						.is( { html: 2, body: 3, center: 1, hr: 0, h1: 0, head: 1, title: 0 });
			done();
		});
	});
		it('test tag children info', function(done){
		app.requestAndParse("https://nodejs.org", https, (ret)=>{
			test.object(ret.tagChildrenInfo)
						.is( { html: 
									  [ 'head', 
										'body bgcolor="white"'],
									 body: 
									  ['center',
										'hr',
										'center' ],
									 center: [ 'h1'],
									 hr: [],
									 h1: [],
									 head: [ 'title' ],
									 title: [] });
			done();
			});
		});
		it('test resources', function(done){
		app.requestAndParse("https://www.w3.org/2010/05/video/mediaevents.html", https, (ret)=>{
			test.object(ret.resources).is({ 'video/mp4': [ 'https://media.w3.org/2010/05/sintel/trailer.mp4' ],
			 'video/webm': [ 'https://media.w3.org/2010/05/sintel/trailer.webm' ],
			 'video/ogg': [ 'https://media.w3.org/2010/05/sintel/trailer.ogv' ],
			 script: [ 'script.js' ] });
			done();
		});
	});
});
