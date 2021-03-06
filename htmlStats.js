
const http = require('http');
const https = require('https');
const util = require('util');
const readline = require('readline');
const htmlparser = require("htmlparser");

const rl = readline.createInterface({
	input: process.stdin,
	output: process.stdout
});


/**
 * Prompts user for html page address in the format http://www.mywebsite.com, 
 * tries to get page source (with http or https protocols according to the address specified-
 * no other protocols are supported) and parses the retrieved source.
 * @function
 * @augments 
 * 
 */
function readLine(){
	rl.question('Insert address:  ', (answer) => {
		console.log(`Address inserted: ${answer}`);
		try{
			var substrs = answer.split("://");
			var protocolStr = substrs[0].toLowerCase();			
			var protocol;
			if(protocolStr=='http')
				protocol=http;
			else if(protocolStr=='https')
				protocol=https;
			else
				throw "unable to make request for address  "+answer;
			requestAndParse(answer, protocol, (info)=>{
				if(info){
					console.log("jsobject="+util.inspect(info, false, null));
					console.log("json="+JSON.stringify(info, false, null));
				}
				readLine();
			});
		} catch(err){
			console.log("error: "+err);			
			readLine();	
		}
	});
};

/**
 * Requests page source of address, using protocol (http or https),
 * and parses the retrieved source.
 * Searches html dom tree depth-first and collects meta info on the page html source, namely: 
 * - list of all children nodes by each tag type   (property tagChildrenInfo)
 * - total count of of children nodes by each tag type (property tagChildren)
 * - list of resources loaded by the page by resource type, if specified (property resources)
 * - total count of attributes by tag type (property tagCount)
 * - maximum depth of html dom tree (property treeDepth)
 * Meta info is passed to finishedCB as a javascript object, with the mentioned properties. 
 *
 * @function
 * @arguments 
 * 
 */
function requestAndParse(address, protocol, finishedCB){
	var handler = new htmlparser.DefaultHandler(function (error, dom) {
	if(error)
		console.log("error "+error);
		//finishedCB();
	});
	var parser = new htmlparser.Parser(handler);
	protocol.get(address, (res) => {
	  //console.log(`STATUS: ${res.statusCode}`);
	  //console.log(`HEADERS: ${JSON.stringify(res.headers)}`);
	  res.setEncoding('utf8');

	  res.on('data', (chunk) => {
		 //console.log(`BODY: ${chunk}`);
		parser.parseChunk(chunk);
		//console.log(chunk);
	});

	res.on('end', () => {
		parser.done();
		//console.log("dom="+util.inspect(handler.dom, false, null));

		var tagMap = {};
		var tagAttributes = {};
		var resources = {};
		var tagChildren = {};
		var tagChildrenInfo = {};
		var maxDepth=0;

		var stIdx;
		for(stIdx = 0; stIdx < handler.dom.length && !(handler.dom[stIdx].type=='tag' && (handler.dom[stIdx].name=='html' || handler.dom[stIdx].name=='HTML')); stIdx++);
		if(stIdx>=handler.dom.length){
			console.log("error: root element not found");
			finishedCB();
		}else {
			handler.dom[stIdx]["depth"]=0;
			var nodesToVisit=[handler.dom[stIdx]];	
			while(nodesToVisit.length>0){
				var currNode = nodesToVisit.pop();
				//visita
				if(currNode.type=='tag' || currNode.type=='script' || currChild.type=='style'){
					if(tagMap[currNode.name]==undefined){
						tagMap[currNode.name]=0;
						tagAttributes[currNode.name]=0;						
						tagChildren[currNode.name]=0;			
						tagChildrenInfo[currNode.name]=[];						
					}
					tagMap[currNode.name]++;
					if(currNode.attribs)			
						for(attr in currNode.attribs)
							tagAttributes[currNode.name]++;
					for(c=0;currNode.children && c<currNode.children.length;c++){
						var currChild=currNode.children[c];
						if(currChild.type=='tag' || currChild.type=='script' || currChild.type=='style'){
							tagChildren[currNode.name]++;
							tagChildrenInfo[currNode.name].push(currChild.data);	
						}		
					}
				}
				if(currNode.attribs && currNode.attribs.src){
					var resName=currNode.name;
					if((currNode.name=='source' || currNode.name=='SOURCE') && currNode.attribs.type){
						resName=currNode.attribs.type;
					} 	
					if(!resources[resName])
						resources[resName]=[];
					resources[resName].push(currNode.attribs.src);
				}
				//console.log("visited node "+currNode.name+ " ("+currNode.type+")");
				//marca proximas visitas
				if(currNode.children != undefined && currNode.children.length>0){
					for(i = 0; i < currNode.children.length; i++){
						var child = currNode.children[i];
						child["depth"]=currNode.depth+1;
						nodesToVisit.push(child);
					}
					//console.log("added "+currNode.children.length+" children to visit");
					if(maxDepth<currNode.depth+1){
						maxDepth=currNode.depth+1;
						//console.log("updated maxDepth="+maxDepth);	
					}
				}
			}
			var ret={};
			ret["tagChildrenInfo"]=tagChildrenInfo;
			ret["tagChildren"]=tagChildren;
			ret["resources"]=resources;
			ret["tagAttributesCount"]=tagAttributes;
			ret["tagCount"]=tagMap;
			ret["treeDepth"]=maxDepth;			
			finishedCB(ret);
		}
	});
});
};
module.exports.requestAndParse = requestAndParse; 
module.exports.readLine = readLine; 


