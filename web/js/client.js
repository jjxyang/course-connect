$(document).ready(function() {
  var FADE_TIME = 150; // ms
  var COLORS = [
    '#e21400', '#91580f', '#f8a700', '#f78b00',
    '#58dc00', '#287b00', '#a8f07a', '#4ae8c4',
    '#3b88eb', '#3824aa', '#a700ff', '#d300e7'
  ];

  // Initialize variables
  var $window = $(window);
  var $loginPage = $('.login.page'); // the login page
  var $joinPage = $('.join.page'); // the join page
  var $connectPage = $('.connect.page'); // the connect page


  var spaceDictionary = {};
  var gUser;
  var gUserID;
  var email;
  var chosenSpace;
  var userPosting = null;
  var username;
  var connected = false;

  var socket = io();

  // temp signin button
  $('#tempSignIn').on('click', function (e) {
    setProfile();
  });

  // google auth signin
  window.onSignIn = function (googleUser) {
    // save off the googleUser
    gUser = googleUser;
    gUserID = gUser.getBasicProfile().getId();

    var profile = googleUser.getBasicProfile();
    var email = profile.getEmail();
    console.log('Full Name: ' + profile.getName());
    console.log('Given Name: ' + profile.getGivenName());
    console.log("Email: " + profile.getEmail());
    console.log("gUser: " + gUser);
    console.log("signed in!");
  };



  //H: emits the chosen space to the server
  //H: should RENDER all of the postings the server emits back to client
  // temp "join cory hall study space button"
  $('#coryHall').on('click', function (e) {
    chosenSpace = 'Cory'
    socket.emit('chosen space', {studySpace: chosenSpace});

    //initial event for 'show space stuff'
    socket.on('show space stuff', spaceStuff);

    console.log("googleUser: " + gUser);
    // TODO: what's publicUserID

    var posting = post();
    if (posting !== undefined) {
      var data = {
        googleUser: gUser,
        googleUserID: gUserID,
        gmail: email,
        studySpace: "Cory Hall",
        posting: posting
      };
      console.log("adding user");
      socket.emit("add user", data);

      $joinPage.fadeOut();
      $connectPage.show();
      $joinPage.off('click');
    }
  });

//H: Actual space-reading stuff to implement here:



  //H: edited to be useful for both createPost and editPost actions.
  //Whenever a user wants to edit a post, it is safe to reuse this function
  // Sets the client's google profile
  function post() {
    var name = gUser.getBasicProfile().getGivenName();
    var topic = $('#topic').val();
    var category = $('#category').val();
    var status = $('input[name=status]:checked', '#statusChoice').val();

    // format name
    name = name.toLowerCase();
    name = name.charAt(0).toUpperCase() + name.slice(1);
    topic = cleanInput(topic);

    // verify topic is not empty
    if (topic === "") {
      alert("Please choose a class or topic.");
      return undefined;
    } else {
      var posting = {
        name: name,
        topic: topic,
        category: category,
        status: status
      }
      console.log(posting);

      userPosting = posting;
      return posting
    }
  }

  // Sets the client's google profile
  function setProfile () {
    email = gUser.getBasicProfile().getEmail();
    console.log("setting profile");
    console.log("gUser: " + gUser);

    // If the email is valid, fade out page
    if (email.indexOf("@berkeley.edu") !== -1) {
      console.log("yay you're a berkeley student")
      $loginPage.fadeOut();
      $joinPage.show();
      $loginPage.off('click');
    } else {
      alert("Sorry, you're not a Berkeley student!");
      console.log("you're not a berkeley student O:<");
    }
  }

  // Prevents input from having injected markup
  function cleanInput (input) {
    return $('<div/>').text(input).html();
  }

  // Gets the color of a username through our hash function
  function getUsernameColor (username) {
    // Compute hash code
    var hash = 7;
    for (var i = 0; i < username.length; i++) {
       hash = username.charCodeAt(i) + (hash << 5) - hash;
    }
    // Calculate color
    var index = Math.abs(hash % COLORS.length);
    return COLORS[index];
  }




  //<<<Howe's Client-side Socket Code>>>

  //should reconstruct the dictionary sent from the event 'spaces' for use in client
  socket.on('welcome', function welcomeUser(info){
    var message = info.message;
    console.log(message);
  });

  //converted back to Dictionary object for good measure
  socket.on('spaces', function readSpaces(info){
    spaceDictionary = Object.assign({}, info.dictionary);

    //print to console to examine what happened here... should expect a dictionary
    console.log(spaceDictionary);
  });

  //NOTE: I have no idea what to do here.. this isn't done
  function spaceStuff(info){
    //not sure if I have to convert this back into a list?
    var postsList = info.posts; //contains a list of all [user, post] entries from the server... ie. [[user, post]...]
    console.log(postsList); //check to see if it looks like a list of lists

    var numberOfPeople = info.numPeople;

    //Jessie: need to render data live here
  }

  //I think this is right? Not sure
  //this is the second place that I have the event 'show space stuff'
  socket.on('show space stuff', spaceStuff);


  //should emit the event 'remove user' to server
  window.addEventListener("beforeunload", function (e) {
    socket.emit('remove user', {googleUser: gUser, googleUserID: gUserID, studySpace: chosenSpace, posting: userPosting});
  });

  //function call to editPost
  function editPost(){
    post();
    socket.emit('update posting', {googleUser: gUser, googleUserID: gUserID, studySpace: chosenSpace, posting: userPosting});
  }

  //NOTE: Jessie, you'll want to implement this somewhere
  //USER wants to connect to SOMEONE
  //this will need to be called somewhere, where an onclick listener selects the otherUser's ID that they want to connect
  //will need to be implemented by Jessie
  function requestConnection(otherUserID){
    socket.emit('send ping', {publicUserID: gUserID, publicPersonID: otherUserID});
  }

  //NOTE: Jessie, you might want to display the information in here in another window
  socket.on('receive ack', function receiveAck(info){
    var otherEmail = info.emailInfo;
    var otherPersonID = info.publicUserID;
  });


  //NOTE: Jessie, you'll need to do something here too
  //SOMEONE wants to connect to the USER
  //receive a ping that someone sent you. You can either ACCEPT or REJECT
  socket.on('receive ping', function receivePing(info){
    var somePersonID = info.publicPersonID;

    //TODO: some message that pops up in the tab that indicates someone wants to connect
    var decision = null; //make this dependent on the event listener for whether to accept (true) or reject (false) the request

    if(decision === true){
      //accept the ping
      socket.emit('accept ping', {publicUserID: gUserID, publicPersonID: somePersonID});
    }
  });

}); // closure
