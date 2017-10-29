

/*
      >>>>>TO IMPLEMENT<<<<<
*/
//A function that can detect if login, and then checks the information for the database if it matches. If so, that page will need to use oauth with facebook's api

/*
      >>>>>IMPORTS<<<<<
*/
var http = require('http');
var fs = require("fs");
var path = require("path");

/*
      >>>>>HELPER FUNCTIONS<<<<<
*/

// To do: learn how to implement css later
// For now: work on implementing backend
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

// Function ensures that the page is one of several valid paths
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
    //Howe: what is going on here?
    || param === "/components/navigation-bar.html"
    || param === "/js/connect/make-posting.js"
    || param === "/js/courses.js"
    ){
    return true;
  }
  return false;
}

/*
      >>>>>CREATE SERVER<<<<<
*/
function server(request, response) {
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
}


var webpage = http.createServer(server);



/*
      >>>>>LISTEN REQUESTS<<<<<
*/
//your socket.io has a function "listen" where it listens to webpage for it to know what to do next
var io = require('socket.io').listen(webpage);

io.on('connection', function(socket) {
    // Use socket to communicate with this particular client only, sending it it's own id

    //what goes on after hearing the event 'make posting'?
    //not sure what console.log is doing here?
    //supposed to be accepting an input?
    //don't see an emit function inside of the client?


    //inside my terminal, I should be able to see the json information
    //manipulate this
    socket.on('make posting', function (data) {
      console.log(data);
    });


});












//webpage has a function "listen" that listens to localhost:3000
webpage.listen(3000);
