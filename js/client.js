$(document).ready(function() {
  var FADE_TIME = 150; // ms

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
  var connected = false;

  var socket = io();

  // temp signin button
  $('#enter').on('click', function (e) {
    setProfile();
  });

  // google auth signin
  window.onSignIn = function (googleUser) {
    // save off the googleUser
    // TODO: is this secure?
    gUser = googleUser;
    // TODO: deal with auth/security concerns re: google id's
    // https://developers.google.com/identity/sign-in/web/people
    // https://developers.google.com/identity/sign-in/web/backend-auth
    gUserID = gUser.getBasicProfile().getId();

    var profile = googleUser.getBasicProfile();
    var email = profile.getEmail();
    console.log('Full Name: ' + profile.getName());
    console.log('Given Name: ' + profile.getGivenName());
    console.log("Email: " + profile.getEmail());
    console.log("signed in!");
  };

  // takes user to the chosen space
  $('#coryHall').on('click', function (e) {
    chosenSpace = 'Cory Hall';
    showStudySpace(chosenSpace);
  });
  $('#sodaHall').on('click', function (e) {
    chosenSpace = 'Soda Hall';
    showStudySpace(chosenSpace);
  });
  $('#mlk').on('click', function (e) {
    chosenSpace = 'MLK Student Union';
    showStudySpace(chosenSpace);
  });
  $('#moffittLibrary').on('click', function (e) {
    chosenSpace = 'Moffitt Library';
    showStudySpace(chosenSpace);
  });
  $('#doeLibrary').on('click', function (e) {
    chosenSpace = 'Doe Library';
    showStudySpace(chosenSpace);
  });


  // emits user's chosen space and posting to the server
  function showStudySpace(chosenSpace) {
    console.log("going to study space", chosenSpace);
    socket.emit('chosen space', {studySpace: chosenSpace});

    // set title of page to be the chosen studySpace
    $("#studySpaceName").text(chosenSpace);

    var posting = post();
    if (posting !== undefined && posting !== null) {
      var data = {
        googleUser: gUser,
        googleUserID: gUserID,
        gmail: email,
        studySpace: chosenSpace,
        posting: posting
      };
      console.log("adding user");
      socket.emit("add user", data);

      $joinPage.fadeOut();
      $connectPage.show();
      $joinPage.off('click');
    }
  }

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


  //should reconstruct the dictionary sent from the event 'spaces' for use in client
  socket.on('welcome', function welcomeUser(info){
    var message = info.message;
    console.log(message);
  });

  socket.on('spaces', function readSpaces(info){
    spaceDictionary = info.dictionary
  });

  function spaceStuff(info){
    var postsList = info.posts; //contains a list of all [user, post] entries from the server... ie. [[user, post]...]
    var numberOfPeople = info.numPeople;

    // clear div and re-render each item in postsList
    $('#postings').empty();
    for (var idx in postsList) {
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
            '<button class="btn btn-info" id="' + userID + '">' +
              'Connect with ' + posting.name +
            '</button>' +
          '</div>' +
        '</div>'
      );

      // unbind existing click listeners
      $('#postings').off('click', '#' + userID);
      // add new click listener to the 'connect' button of each div
      $('#postings').on('click', '#' + userID, function (e) {
        requestConnection(userID, posting.name);
      });
    }
  };

  socket.on('show space stuff', spaceStuff);

  //should emit the event 'remove user' to server
  window.addEventListener("beforeunload", function (e) {
    socket.emit('remove user', {googleUser: gUser, googleUserID: gUserID, studySpace: chosenSpace, posting: userPosting});
    return;
  });

  // THIS USER wants to connect to SOMEONE ELSE
  function requestConnection(otherUserID, otherUserName) {
    console.log("requesting connection with", otherUserName);
    var name = gUser.getBasicProfile().getName();
    socket.emit('send ping', {requestorID: gUserID, requestorName: name, wantedID: otherUserID});
    addToLog("You sent a ping to " + otherUserName + "!");
  }

  // SOMEONE wants to connect to this USER
  // receive a ping that someone sent you. You can either ACCEPT or REJECT
  socket.on('receive ping', function receivePing(info){
    var requestorID = info.requestorID;
    var requestorName = info.requestorName;

    var name = gUser.getBasicProfile().getName();
    addToLog(requestorName + " wants to meet up with you!");

    // unbind listeners first
    $('#acceptPing').off('click');
    $('#ignorePing').off('click');

    // functions for USER to accept or ignore ping from OTHER;
    $('#acceptPing').on('click', function (e) {
      socket.emit('accept ping', {wantedName: name, wantedID: gUserID, requestorID: requestorID});
      $('#receivePing').css("display", "none");
    });
    $('#ignorePing').on('click', function (e) {
      $('#receivePing').css("display", "none");
    });

    // display the ping
    $('#receivePingText').text(requestorName + " wants to meet up with you!");
    $('#receivePing').css("display", "block");
  });




  socket.on('receive ack', function receiveAck(info){
    var wantedName = info.wantedName;
    var wantedEmail = info.wantedEmail;

    addToLog(wantedName + " wants to meet with you, too! Their email is: " + wantedEmail);
  });

  //function call to editPost
  // TODO: finish implementation
  function editPost(){
    post();
    socket.emit('update posting', {googleUser: gUser, googleUserID: gUserID, studySpace: chosenSpace, posting: userPosting});
  }

  function addToLog(message) {
    $('#messages').append(
      '<li class="list-group-item">' + message + '</li>'
    );
  }

}); // closure
