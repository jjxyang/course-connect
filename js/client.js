$(document).ready(function() {
  var socket = io();
  var $window = $(window);
  var $loginPage = $('.login.page');     // the login page
  var $joinPage = $('.join.page');       // the join page
  var $connectPage = $('.connect.page'); // the connect page

  var spamDictionary = {};
  var connectedDictionary = {};         // dict of who user has connected to
  var spaceDictionary = {};             // list of spaces and members in it
  var gUserProfile;                     // google user profile
  var gUserID;                          // google user ID
  var email;                            // user's email
  var chosenSpace;                      // user's current space
  var userPosting = null;               // user's posting with topic, category, status
  var connected = false;

  var cory = 'Cory Hall';
  var soda = 'Soda Hall';
  var mlk = 'MLK Student Union';
  var moffitt = 'Moffitt Library';
  var doe = 'Doe Library';

  // ------------------------ LOGIN PAGE ------------------------
  $('#enter').on('click', function (e) {
    checkIfDuplicateUser();
  });

  // google auth signin
  window.onSignIn = function (googleUser) {
    // save off user's google profile and id
    // TODO: deal with auth/security concerns re: google id's
    // https://developers.google.com/identity/sign-in/web/people
    // https://developers.google.com/identity/sign-in/web/backend-auth
    gUserProfile = googleUser.getBasicProfile();
    gUserID = gUserProfile.getId();

    console.log('Full Name: ' + gUserProfile.getName());
    console.log('Given Name: ' + gUserProfile.getGivenName());
    console.log("Email: " + gUserProfile.getEmail());
    console.log("signed in!");
  };
  // ------------------------------------------------------------


  // ------------------------ JOIN PAGE -------------------------
  // takes user to the chosen space

  $('#coryHall').on('click', function (e) {
    chosenSpace = cory;
    showStudySpace(cory);
  });
  $('#sodaHall').on('click', function (e) {
    chosenSpace = soda;
    showStudySpace(soda);
  });
  $('#mlk').on('click', function (e) {
    chosenSpace = mlk;
    showStudySpace(mlk);
  });
  $('#moffittLibrary').on('click', function (e) {
    chosenSpace = moffitt;
    showStudySpace(moffitt);
  });
  $('#doeLibrary').on('click', function (e) {
    chosenSpace = doe;
    showStudySpace(doe);
  });
  // ------------------------------------------------------------


  // ------------------------ CONNECT PAGE ----------------------
  $('#editPosting').on('click', function (e) {
    goToEditPosting();
  });

  // function call to editPost
  function goToEditPosting() {
    console.log("going back to edit posting, removing user's current posting");
    $connectPage.hide();
    $connectPage.off('click');
    $joinPage.fadeToggle();
    socket.emit('remove user', {googleUserID: gUserID, studySpace: chosenSpace, posting: userPosting});
  }
  // ------------------------------------------------------------


  // emits user's chosen space and posting to the server
  function showStudySpace(chosenSpace) {
    console.log("going to study space", chosenSpace);
    console.log("number of people", spaceDictionary[chosenSpace]);


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

      $joinPage.fadeToggle();
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

  setInterval(function decrementDictionaries() {
    for (var spamID in spamDictionary) {
      spamDictionary[spamID] = spamDictionary[spamID] - 1;
      console.log("spamDictionary: " + spamDictionary[spamID]);
      if (spamDictionary[spamID] == 0 || spamDictionary == undefined) {
        //remove the item from the dictionary
        console.log("REACHED INSIDE FOR THE 0 CONDITION FOR SPAM");
        delete spamDictionary[spamID];
      }
    }

    for (var connectedID in connectedDictionary) {
      connectedDictionary[connectedID] = connectedDictionary[connectedID] - 1;
      console.log("connectedDictionary: " + connectedDictionary[connectedID]);
      if (connectedDictionary[connectedID] == 0) {
        //remove the item from the dictionary
        console.log("REACHED INSIDE FOR THE 0 CONDITION FOR CONNECTED");
        delete connectedDictionary[connectedID];
      }
    }
  }, 10000);
  // ------------------------------------------------------------


  // Sets the client's google profile, works with "duplicate user" event
  function checkIfDuplicateUser () {
    console.log("setting profile");
    email = gUserProfile.getEmail();
    socket.emit('check duplicate', {googleUserID: gUserID});
  }

  // sets user profile only if:
  // (1) user hasn't logged in already, (2) user has berkeley email
  function setProfile(info) {
    console.log("receiving if user is a duplicate", info.condition);
    if (info.condition) {
      alert("You've logged in already.");
      console.log("number of times")
    } else {
      // If the email is valid, fade out page
      if (email.indexOf("@berkeley.edu") !== -1) {
        console.log("user is a berkeley student");
        $loginPage.fadeOut();
        $joinPage.show();
        $loginPage.off('click');
        socket.emit('active user', {googleUserID: gUserID});
      } else {
        alert("Sorry, you're not a Berkeley student!");
        console.log("user is not a berkeley student");
      }
    }
  }
  socket.on('duplicate user', setProfile);


  // Useful for both createPost and editPost actions.
  // Whenever a user wants to edit a post, it is safe to reuse this function
  function post() {
    var name = gUserProfile.getGivenName();
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


  //should reconstruct the dictionary sent from the event 'spaces' for use in client
  socket.on('welcome', function welcomeUser(info){
    var message = info.message;
    console.log(message);
  });

  socket.on('spaces', function readSpaces(info){
    spaceDictionary = info.dictionary;
    // console.log(spaceDictionary);

    $("#coryHallPeople").text(spaceDictionary[cory]);
    $("#sodaHallPeople").text(spaceDictionary[soda]);
    $("#mlkPeople").text(spaceDictionary[mlk]);
    $("#moffittLibraryPeople").text(spaceDictionary[moffitt]);
    $("#doeLibraryPeople").text(spaceDictionary[doe]);

    $("#numPeopleInRoom").text(spaceDictionary[chosenSpace]);

    console.log(spaceDictionary[cory]);
    console.log(spaceDictionary[soda]);
    console.log(spaceDictionary[mlk]);
    console.log(spaceDictionary[moffitt]);
    console.log(spaceDictionary[doe]);
    console.log(spaceDictionary[chosenSpace]);
  });

  // setInterval(function checkLog(){
  //     console.log(spaceDictionary);
  // }, 1000);

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
      // check if this is the current user's ID or not
      if (userID != gUserID) {
        // add new click listener to the 'connect' button of each div
        $('#postings').on('click', '#' + userID, function (e) {
          requestConnection($(this).attr("id"), $(this).parent().attr("id"));
        });
      } else {
        // user shouldn't be able to ping themselves; change button attributes
        $('#' + userID).removeClass("btn-info");
        $('#' + userID).addClass("btn-success");
        $('#' + userID).text("Your posting!");
      }
    }
  };

  socket.on('show space stuff', spaceStuff);

  // should emit the event 'remove user' to server when user leaves/refreshes page
  window.addEventListener("beforeunload", function (e) {
    socket.emit('remove user', {googleUserID: gUserID, studySpace: chosenSpace, posting: userPosting, socketID: socket});
    return;
  });


  // ------------------------ PING SYSTEM -----------------------
  // THIS USER wants to connect to SOMEONE ELSE
  function requestConnection(otherUserID, otherUserName) {
    console.log("requesting connection with", otherUserName);
    var name = gUserProfile.getName();
    socket.emit('send ping', {requestorID: gUserID, requestorName: name, wantedID: otherUserID});
    addToLog("You sent a ping to " + otherUserName + "!");
  }

  // SOMEONE wants to connect to this USER
  // receive a ping that someone sent you. You can either ACCEPT or REJECT
  socket.on('receive ping', function receivePing(info){
    var requestorID = info.requestorID;
    var requestorName = info.requestorName;

    if (requestorID in spamDictionary == false){
      var name = gUserProfile.getName();
      addToLog(requestorName + " wants to meet up with you! You can accept or ignore.");

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
        $('#receivePing').hide();
      });
      $('#ignorePing').on('click', function (e) {
        // some function in here to add to spamDictionary... timeout = 1 minutes
        addSpamDictionary(requestorID);

        $('#receivePing').hide();
      });

      // display the ping via popup
      $('#receivePingText').text(requestorName + " wants to meet up with you!");
      $('#receivePing').show();
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
  // ------------------------------------------------------------


  // Prevents input from having injected markup
  function cleanInput (input) {
    return $('<div/>').text(input).html();
  }

  function addToLog(message) {
    // format a timestamp
    var date = new Date();
    var min = date.getMinutes().toString();
    min = min.length < 2 ? ("0" + min) : min;
    var sec = date.getSeconds().toString();
    sec = sec.length < 2 ? ("0" + sec) : sec;
    var timestamp = "[" + date.getHours() + ":" + min + ":" + sec + "] ";

    // add new message elem to log
    $('#messages').append(
      '<li class="list-group-item">' + timestamp + message + '</li>'
    );
  }

}); // closure
