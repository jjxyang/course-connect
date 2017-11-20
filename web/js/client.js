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

  var gUser;
  var userPosting;
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
    var profile = googleUser.getBasicProfile();
    var email = profile.getEmail();
    console.log('Full Name: ' + profile.getName());
    console.log('Given Name: ' + profile.getGivenName());
    console.log("Email: " + profile.getEmail());
    console.log("gUser: " + gUser);
    console.log("signed in!")
  };

  // temp "join cory hall study space button"
  $('#coryHall').on('click', function (e) {
    console.log("googleUser: " + gUser);
    // TODO: what's publicUserID

    var posting = createPosting();
    if (posting !== undefined) {
      userPosting = posting;
      var data = {
        googleUser: gUser,
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

  // Sets the client's google profile
  function createPosting () {
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
      return posting;
    }
  }

  // Sets the client's google profile
  function setProfile () {
    var email = gUser.getBasicProfile().getEmail();
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


  // Whenever the server emits 'new message', update the chat body
  socket.on('new message', function (data) {
    addChatMessage(data);
  });

  // Whenever the server emits 'user joined', log it in the chat body
  socket.on('user joined', function (data) {
    log(data.username + ' joined');
    addParticipantsMessage(data);
  });

  // Whenever the server emits 'user left', log it in the chat body
  socket.on('user left', function (data) {
    log(data.username + ' left');
    addParticipantsMessage(data);
  });

  socket.on('disconnect', function () {
    log('you have been disconnected');
  });

  socket.on('reconnect', function () {
    log('you have been reconnected');
    if (username) {
      socket.emit('add user', username);
    }
  });

  socket.on('reconnect_error', function () {
    log('attempt to reconnect has failed');
  });
});
