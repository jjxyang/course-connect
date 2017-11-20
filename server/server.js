
/*
      >>>WEBPAGE IMPORTS<<<
*/
var http = require('http');
var fs = require("fs");
var path = require("path");

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
      >>>LOCAL VARIABLES<<<
*/
var userSet = new Set();
var spaceDict = {};

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
    socket.on('add user', addUser(data));
    socket.on('remove user', removeUser(data));
    socket.on('update posting', updatePosting(data));



});


/*
      >>>EMIT REQUESTS<<<
*/
//aggregates and sends the list of all users found in open clients
function showOnlineUsers() {
  //need to modify
    io.emit('show online users', {dictionary: getNumPeople()} );
}

//send to the client the list of users of each user every 10 seconds
setInterval(showOnlineUsers, 10000);

/*
      >>>SERVER HELPER FUNCTIONS<<<
*/
function addUser(info) {
    var googleUser = info.googleUser;
    var studySpace = info.studySpace;
    var posting = info.posting;

    if(spaceDict[studySpace] == null){
      spaceDict[studySpace] = [googleUser, posting];
    }else{
      spaceDict[studySpace] = Array.prototype.push.apply(spaceDict[studySpace], [googleUser, posting]); //combine lists and update
    }
}

function removeUser(info){
  var googleUser = info.googleUser;
  var studySpace = info.studySpace;
  var posting = info.posting;

  if(spaceDict[studySpace] != null) {
    var list = spaceDict[studySpace];
    for(i = 0; i < list.length; i++) {
      if (list[i][0] == googleUser) {
        list.splice(i, 1); //remove the element at this index
        spaceDict[studySpace] = list; //update the element inside the dictionary
      }
    }
  }
}

function updatePosting(info) {
  var googleUser = info.googleUser;
  var studySpace = info.studySpace;
  var posting = info.posting;

  if(spaceDict[studySpace] != null) {
    var list = spaceDict[studySpace];
    var length = list.length;
    for(i = 0; i < list.length; i++) {
      if (list[i][0] == googleUser) {
        list.splice(i, 1); //remove the element at this index
      }
      spaceDict[studySpace] = Array.prototype.push.apply(spaceDict[studySpace], [googleUser, posting]); //combine lists and update
    }
  }
}

function getNumPeople(){
  var spaceDictNumPeople = {};
  for(var key in spaceDict){
    var value = spaceDict[key];
    spaceDictNumPeople[key] = value.length;
  }
  return spaceDictNumPeople;
}













//webpage has a function "listen" that listens to localhost:3000
webpage.listen(3000);
