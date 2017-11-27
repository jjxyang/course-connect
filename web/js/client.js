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
  $('#enter').on('click', function (e) {
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
    console.log("signed in!");
  };


  //H: emits the chosen space to the server
  //H: should RENDER all of the postings the server emits back to client
  $('#coryHall').on('click', function (e) {
    chosenSpace = 'Cory Hall'
    socket.emit('chosen space', {studySpace: chosenSpace});

    //initial event for 'show space stuff'
    socket.on('show space stuff', spaceStuff);

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

  // Useful for both createPost and editPost actions.
  // Whenever a user wants to edit a post, it is safe to reuse this function
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
      userPosting = posting;
      return posting
    }
  }

  // Sets the client's google profile
  function setProfile () {
    email = gUser.getBasicProfile().getEmail();
    console.log("setting profile");

    // If the email is valid, fade out page
    if (email.indexOf("@berkeley.edu") !== -1) {
      console.log("yay you're a berkeley student")
      $loginPage.fadeOut();
      $joinPage.show();
      $loginPage.off('click');
    } else {
      alert("Sorry, you're not a Berkeley student!");
    }
  }

  // Prevents input from having injected markup
  function cleanInput (input) {
    return $('<div/>').text(input).html();
  }



  //<<<Howe's Client-side Socket Code>>>

  //should reconstruct the dictionary sent from the event 'spaces' for use in client
  socket.on('welcome', function welcomeUser(info){
    var message = info.message;
    console.log(message);
  });

  socket.on('spaces', function readSpaces(info){
    spaceDictionary = info.dictionary
    console.log("space dict", spaceDictionary);
  });

  function spaceStuff(info){
    //not sure if I have to convert this back into a list?
    var postsList = info.posts; //contains a list of all [user, post] entries from the server... ie. [[user, post]...]
    var numberOfPeople = info.numPeople;
    console.log(info);

    // clear div and re-render each item in postsList
    $('#postings').empty();

    for (var idx in postsList) {
      // var id = ($('#postings').length + 1).toString();
      var userID = postsList[idx][0];
      var posting = postsList[idx][1];

      // create and append div element for each posting
      $('#postings').append(
        '<div class="panel panel-primary">' +
          '<ul class="list-group">' +
            '<li class="list-group-item">' +
              posting.name + " is " +
              posting.status + " on " +
              posting.category + " for " +
              posting.topic +
            '</li>' +
          '</ul>' +
          '<div class="panel-body">' +
            '<button class="btn btn-info">' +
            'Connect</button>' +
          '</div>' +
        '</div>'
      );
    }
  }

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
