
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

    filePath = path.join(__dirname, urlRequest);
    console.log(filePath);

    sendFileContent(response, filePath, "text/html");
  } else if(/^\/[a-zA-Z0-9\/]*.js$/.test(request.url.toString())) {
    console.log("ENTERED JAVASCRIPT");
    console.log("urlRequest: " + urlRequest);

    filePath = path.join(__dirname, urlRequest);
    console.log(filePath);

    sendFileContent(response, filePath, "text/javascript");
  }  else if(/^\/[a-zA-Z0-9\/]*.css$/.test(request.url.toString())) {
    console.log("ENTERED CSS");
    console.log("urlRequest: " + urlRequest);

    filePath = path.join(__dirname, urlRequest);

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

/*
      >>>VARIABLES<<<
*/
var webpage = http.createServer(server);
var googleDict = {}; //keeps track of all online users and their connection sockets {userID: [googleUser, socketID]}
//stores only publicID info for all users and their corresponding posts
var spaceDict = {
  'Cory Hall': null,
  'Soda Hall': null,
  'MLK Student Union': null,
  'Moffitt Library': null,
  'Doe Library': null
};

/*
      >>>SERVER HELPER FUNCTIONS<<<
*/
function getNumPeople(){
  var spaceDictNumPeople = {};

  for(var key in spaceDict){
    var value = spaceDict[key];

    if(value == null){
      spaceDictNumPeople[key] = 0;
    }else{
      spaceDictNumPeople[key] = value.length;
    }
  }
  return spaceDictNumPeople;
}


/*
      >>>SOCKETS<<<
*/
//your socket.io has a function "listen" where it listens to webpage for it to know what to do next
var io = require('socket.io').listen(webpage);

io.on('connection', function(socket) {
    // Use socket to communicate with this particular client only, sending it it's own id
    //will need to use json-sockets with this
    socket.emit('welcome', {message: 'Welcome to CourseConnect!'});



    //send to the client the list of users of each user every 10 seconds
    setInterval(
      function peopleInSpaces() {
        //returns key-value pair called "dictionary," which is a dictionary of rooms-numPeople
        socket.emit('spaces', {dictionary: getNumPeople()} );
    }, 10000);

    //listen for the userID data
    //consolidate and compile received client data to a set
    socket.on('add user', function addUser(info) {
      var googleUser = info.googleUser;
      var publicUserID = info.googleUserID;
      var email = info.gmail;
      var studySpace = info.studySpace;
      var posting = info.posting;

      if(spaceDict[studySpace] === null || spaceDict[studySpace] === undefined){
        spaceDict[studySpace] = [[publicUserID, posting]];
      }else{
        // if user already exists, remove it (so it can later be replaced)
        if (publicUserID in spaceDict[studySpace]) {
          spaceDict[studySpace] = list.filter(el => el[0] !== publicUserID);
        }
        spaceDict[studySpace].push([publicUserID, posting]);
      }
      googleDict[publicUserID] = [googleUser, socket, email];
    });


    socket.on('remove user', function removeUser(info){
      var googleUser = info.googleUser;
      var publicUserID = info.googleUserID; //NEED TO FIGURE OUT GOOGLE ID STUFF... this should be public info
      var studySpace = info.studySpace;
      var posting = info.posting;

      if(spaceDict[studySpace] != null && spaceDict[studySpace] != undefined) {
        // remove the user in this space by publicUserID
        var list = spaceDict[studySpace];
        spaceDict[studySpace] = list.filter(el => el[0] !== publicUserID);
        delete googleDict.publicUserID;
      }
    });


    socket.on('update posting', function updatePosting(info) {
      var googleUser = info.googleUser;
      var publicUserID = info.googleUserID; //NEED TO FIGURE OUT GOOGLE ID STUFF... this should be public info
      var studySpace = info.studySpace;
      var posting = info.posting;

      if (spaceDict[studySpace] != null && spaceDict[studySpace] != undefined) {
        var list = spaceDict[studySpace];
        // remove the user in this space by publicUserID, then push updated posting
        spaceDict[studySpace] = list.filter(el => el[0] !== publicUserID);
        spaceDict[studySpace].push([publicUserID, posting]);
      }
    });


    socket.on('chosen space', function getPostingsList(data){
      var space = data.studySpace;

      setInterval(
        function showSpaceStuff(){
          socket.emit('show space stuff', {posts: spaceDict[space], numPeople: getNumPeople()[space] })
        }, 10000);
    });


    // "user" sent ping to "person"; "person" receives ping
    socket.on('send ping', function receivePing(info){
      var name = info.userName;
      var userID = info.publicUserID;
      var personID = info.publicPersonID;
      googleDict[personID][1].emit('receive ping', {publicUserID: userID, requestorName: name});
    });


    //person (called user below) accepts ping
    //user (called person below) receives ack
    socket.on('accept ping', function receiveAck(info){
      var userID = info.publicUserID;
      var personID = info.publicPersonID;
      var email = googleDict[userID][2];

      googleDict[personID][1].emit('receive ack', {publicUserID: userID, emailInfo: email});
    });

});

//webpage has a function "listen" that listens to localhost:3000
webpage.listen(process.env.PORT || 5000);
