
/*
      >>>IMPORTS<<<
*/
var http = require('http');
var fs = require("fs");
var path = require("path");


/*
      >>>GLOBAL VARIABLES<<<
*/
var usersSet = new Set();

/*
      >>>WEBPAGE FUNCTIONS<<<
*/
//sends corresponding FileContent to client to open
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

//ensures that the webpage is one of several valid paths
function verifyWebpage(param){
  if(param === "/"
    || param === "/index.html"
    //|| param === "SCHOOL-LOCATIONS-HERE.HTML"
    ){
    return true;
  }
  return false;
}

//checks for components for css and javascripts
function verifyComponent(param){
  //No components yet
  // if (param === "/components/navigation-bar.html"
  //   || param === "/js/connect/make-posting.js"
  //   || param === "/js/courses.js"
  //   ){
  //   return true;
  // }
  return false;
}

//wrapper function for webpages and css/javascript
function verifyWebRequest(param){
  if(verifyWebpage(param) || verifyComponent(param)){
    return true;
  }
  return false;
}

/*
      >>>CREATE SERVER<<<
*/
function server(request, response) {
  urlRequest = request.url.toString();

  if (verifyWebRequest(urlRequest)){
    //Set homepage at index.html
    if(urlRequest === "/"){
      urlRequest = urlRequest + "index.html"
    }

    console.log("ENTERED HTML");
    console.log("urlRequest: " + urlRequest);

    filePath = path.join(__dirname, '..', '/web', urlRequest);
    console.log(filePath);

    sendFileContent(response, filePath, "text/html");
  } else if(/^\/[a-zA-Z0-9\/]*.js$/.test(request.url.toString())) {
    console.log("ENTERED JAVASCRIPT");
    console.log("urlRequest: " + urlRequest);

    filePath = path.join(__dirname, '..', '/web', urlRequest);
    console.log(filePath);

    sendFileContent(response, filePath, "text/javascript");
  }  else if(/^\/[a-zA-Z0-9\/]*.css$/.test(request.url.toString())) {
    console.log("ENTERED CSS");
    console.log("urlRequest: " + urlRequest);

    filePath = path.join(__dirname, '..', '/web', urlRequest);

    console.log(filePath);
    sendFileContent(response, filePath, "text/css");
  } else{
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
      >>>LISTEN REQUESTS<<<
*/
//your socket.io has a function "listen" where it listens to webpage for it to know what to do next
var io = require('socket.io').listen(webpage);

io.on('connection', function(socket) {
    // Use socket to communicate with this particular client only, sending it it's own id
    socket.emit('welcome', {message: 'Welcome to CourseConnect!'});

    //listen for the userID data
    //consolidate and compile received client data to a set
    // socket.on('clientUser', addUser(data.userID));
});


/*
      >>>EMIT REQUESTS<<<
*/
//aggregates and sends the list of all users found in open clients
function sendUsers() {
  //need to modify
    io.emit('users', {users: getUsers()} );
}

//send to the client the list of users of each user every 10 seconds
setInterval(sendUsers, 10000);


/*
      >>>SERVER HELPER FUNCTIONS<<<
*/
function addUser(user) {
    usersSet.add(user);
}

//TODO:
//need to figure out a way to get users removed
//should this happen in client or in server?
//as in... should the server detect a timeout and then remove a user (that's a lot of things to keep track of!)
//or... should the client tell the server when a user has left? (can this be done automatically on exit of a frame?)
function removeUser(user){

}

//getUsers will only be correct for the index... since we haven't implemented the other chat-channels based on school locations yet
function getUsers(){
  return usersSet.toString();
}



























//webpage has a function "listen" that listens to localhost:3000
webpage.listen(3000);
