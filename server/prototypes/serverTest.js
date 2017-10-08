

/*
you can break js files into modules

if you wanted to move database stuff into own file
var db = require('db.js')

and you'd have imported the content of db into the server.js module

but if you're trying to update a file, you need to incorporate another requires call that can communicate with it
eg. require('SQL')

However, if you are implementing a database, you will need to use another backend that communicates to the database


//parse and firebase
//use firebase for figuring out how to create a database module
//this is another backend that our backend for the website will communicate to
//you can host your code into the firebase as well


Note: if curly braces are not attached to a function then they're an object
*/


var http = require('http');
var fs = require("fs");
 
http.createServer(function(request, response) {

if(request.url === "/index"){
   fs.readFile("index.html", function(err, data){
   if(err){
      response.writeHead(404);
      response.write("Not Found!");
   }
   else{
      response.writeHead(200, {'Content-Type': 'text/html'});
      response.write(data);
   }
   response.end();
});

}
//consider using switch statements instead of else ifs
else if(request.url === "/index2"){
   fs.readFile("index2.html", function(err, data){
   if(err){
      response.writeHead(404);
      response.write("Not Found!");
   }
   else{

      response.writeHead(200, {'Content-Type': 'text/html'});
      response.write(data);
   }
   response.end();
});

}

//default code for now
else{
   response.writeHead(200, {'Content-Type': 'text/html'});
   response.write('<b>Hey there!</b><br /><br />This is the default response. Requested URL is: ' + request.url);
   response.end();
}



}).listen(3000);






// sendFileContent_cssWrapper(request.url, response)


//file is index.html and the like
function sendFileContent_cssWrapper(requestURLCall, response){
	if(/^\/[a-zA-Z0-9\/]*.css$/.test(requestURLCall.toString())){
		sendFileContent(response, requestURLCall.toString().substring(1), "text/css");
	}
}

 
function sendFileContent(response, fileName, contentType){
  fs.readFile(fileName, function(err, data){
    if(err){
      response.writeHead(404);
      response.write("Not Found!");
    }
    else{
      response.writeHead(200, {'Content-Type': contentType});
      response.write(data);
    }
    response.end();
  });
}







