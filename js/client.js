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

  var spamDictionary = {};
  var connectedDictionary = {};


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


  /*
     BUILT IN SPAM BLOCK
     How it works:
     if you choose to ignore someone's request, they're put in your spamDictionary
     for 10 minutes. For the time being, you will not receive their notifications again,
     UNLESS you REQUEST to connect with them, and they ACCEPT your request,
     in which case they are removed from your spamDictionary and added into your
     connectedDictionary, for 100 minutes (a time that is renewed every time you interact with them).
  */
  function addSpamDictionary(inputID){
    if(inputID in connectedDictionary == false){
      if(inputID in spamDictionary == false){
        spamDictionary[inputID] = 60; //6 = 1 minute, 60 = 10 minutes
      } // do nothing if inputID is already in spamDictionary... wait for the timeout from spamBlock()
    } // don't do anything if inputID is in connectedDictionary
  }

  function addConnectedDictionary(inputID){
    //every time you talk, the connection is renewed...
    //removal happens only after being inactive for a certain period of time
    connectedDictionary[inputID] = 600; //600 = 100 minutes
  }

  setInterval(
    function decrementDictionaries() {
    for (var spamID in spamDictionary){
      spamDictionary[spamID] = spamDictionary[spamID] - 1;
      console.log("spamDictionary: " + spamDictionary[spamID]);
      if(spamDictionary[spamID] ==0 || spamDictionary == undefined){
        //remove the item from the dictionary
        console.log("REACHED INSIDE FOR THE 0 CONDITION FOR SPAM");
        delete spamDictionary[spamID];
      }
    }

    for (var connectedID in connectedDictionary){
      connectedDictionary[connectedID] = connectedDictionary[connectedID] - 1;
      console.log("connectedDictionary: " + connectedDictionary[connectedID]);
      if(connectedDictionary[connectedID]==0){
        //remove the item from the dictionary
        console.log("REACHED INSIDE FOR THE 0 CONDITION FOR CONNECTED");
        delete connectedDictionary[connectedID];
      }
    }
  }, 10000);





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
    condition = email.indexOf("@berkeley.edu") !== -1

    // If the email is valid, fade out page
    if (true) {
      console.log("yay you're a berkeley student")
      $loginPage.fadeOut();
      $joinPage.show();
      $loginPage.off('click');
    } else {u
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
          '<div class="panel-body" id="' + posting.name + '">' +
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
        requestConnection($(this).attr("id"), $(this).parent().attr("id"));
      });
    }
  };

  socket.on('show space stuff', spaceStuff);

  //should emit the event 'remove user' to server
  window.addEventListener("beforeunload", function (e) {
    socket.emit('remove user', {googleUserID: gUserID, studySpace: chosenSpace, posting: userPosting});
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

    if (requestorID in spamDictionary == false){
      var name = gUser.getBasicProfile().getName();
      addToLog(requestorName + " wants to meet up with you!");

      // unbind listeners first
      $('#acceptPing').off('click');
      $('#ignorePing').off('click');

      // functions for USER to accept or ignore ping from OTHER;
      $('#acceptPing').on('click', function (e) {
        // some function in here to add to connectedDictionary... timeout = 100 minutes
        addConnectedDictionary(requestorID);

        socket.emit('accept ping', {
          wantedName: name,
          requestorName: requestorName,
          wantedID: gUserID,
          requestorID: requestorID
        });
        $('#receivePing').css("display", "none");
      });
      $('#ignorePing').on('click', function (e) {
        // some function in here to add to spamDictionary... timeout = 1 minutes
        addSpamDictionary(requestorID);

        $('#receivePing').css("display", "none");
      });

      // display the ping via popup
      $('#receivePingText').text(requestorName + " wants to meet up with you!");
      $('#receivePing').css("display", "block");
  } // do nothing if requestorID is in spamDictionary

  });




  socket.on('receive ack', function receiveAck(info){
    var name = info.name;
    var email = info.email;
    var idInfo = info.id;

    if(spamDictionary[idInfo] !== null){
      delete spamDictionary[idInfo];
    }
    addConnectedDictionary(idInfo);

    addToLog("Great, " + name + " wants to meet with you! Their email is: " + email);
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
