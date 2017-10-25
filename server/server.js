

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
var path = require("path");

http.createServer(function(request, response) {
  urlRequest = request.url.toString();

  // //formatting the url to include ".html" if not there
  // if(urlRequest.slice(-5)!==".html"){
  //   console.log("ENTERED");
  //   urlRequest = urlRequest + ".html";
  //   console.log(urlRequest);
  // }

  if (verifyWebpage(urlRequest)){
    //Set homepage at index.html
    if(urlRequest === "/"){
      urlRequest = urlRequest + "index.html"
    }

    //actual code
    console.log("ENTERED HTML");
    console.log("urlRequest: " + urlRequest);


    filePath = path.join(__dirname, '..', '/web', urlRequest);
    console.log(filePath);
    sendFileContent(response, filePath, "text/html");
  }
  /*
  Work on js implementation later
  Need to understand why this can't be commented
  Otherwise seems to have three separate calls going on in server.js
  */
  else if(/^\/[a-zA-Z0-9\/]*.js$/.test(request.url.toString())) {
    console.log("ENTERED JAVASCRIPT");
    console.log("urlRequest: " + urlRequest);


    filePath = path.join(__dirname, '..', '/web', urlRequest);
    console.log(filePath);
    sendFileContent(response, filePath, "text/javascript");
  }
  /*
  Work on CSS implementation later
  Need to understand why this can't be commented
  Otherwise seems to have three separate calls going on in server.js
  */
  else if(/^\/[a-zA-Z0-9\/]*.css$/.test(request.url.toString())) {
    console.log("ENTERED CSS");
    console.log("urlRequest: " + urlRequest);


    filePath = path.join(__dirname, '..', '/web', urlRequest);
    console.log(filePath);
    sendFileContent(response, filePath, "text/css");
  }
  else{
    console.log("Invalid page request... URL: " + request.url);
    console.log(/^\/[a-zA-Z0-9\/]*.js$/.test(request.url.toString()));
    console.log(request.url.toString());
    console.log("ENTERED LAST");



    response.write("Invalid page request!");
    response.end();
  }
}).listen(3000);


/*
To do: learn how to implement css later
For now: work on implementing backend

*/
function sendFileContent(response, fileName, contentType){
  fs.readFile(fileName, function(err, data){
    if(err){
      response.writeHead(404);
      response.write("Page not Found!");
    }
    else{
      response.writeHead(200, {'Content-Type': contentType});
      response.write(data);
    }
    response.end();
  });
}

/*
Function ensures that the page is one of several valid paths
*/
function verifyWebpage(param){
  // console.log("Requested URL is: " + request.url);
  if(param === "/"
    || param === "/about.html"
    || param === "/connect.html"
    || param === "/connect/make-posting.html"
    || param === "/connect/view-postings.html"
    || param === "/courses.html"
    || param === "/index.html"
    || param === "/login.html"
    || param === "/components/navigation-bar.html"
    || param === "/js/connect/make-posting.js"
    ){
    return true;
  }
  return false;
}


//Note: need a function that can detect if login, and then checks the information for the database if it matches
//if so, that page will need to use oauth with facebook's api
