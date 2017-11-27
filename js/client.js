$(document).ready(function() {
  var FADE_TIME = 150; // ms
  var COLORS = [
    '#e21400', '#91580f', '#f8a700', '#f78b00',
    '#58dc00', '#287b00', '#a8f07a', '#4ae8c4',
    '#3b88eb', '#3824aa', '#a700ff', '#d300e7'
  ];

  // Initialize variables
  var $window = $(window);
  var $loginPage = $('.login.page'); // The login page
  var $connectPage = $('.connect.page'); // The chatroom page

  var googleProfile;
  var username;
  var connected = false;

  var socket = io();

  // temp signin button
  $('#tempSignIn').on('click', function (e) {
    setUsername();
  });

  // google auth signin
  window.onSignIn = function (googleUser) {
    // save off the googleUser
    googleProfile = googleUser;
    var profile = googleUser.getBasicProfile();
    console.log('Full Name: ' + profile.getName());
    console.log('Given Name: ' + profile.getGivenName());
    console.log("Email: " + profile.getEmail());
    console.log("googleProfile: " + googleProfile);

    // ID token to pass to backend
    // var id_token = googleUser.getAuthResponse().id_token;
    // console.log("ID Token: " + id_token);
  };

  // temp "join cory hall study space button"
  $('#coryHall').on('click', function (e) {
    console.log("googleUser: " + googleProfile);
    socket.emit("add user", {googleUser: googleProfile, studySpace: "Cory Hall"});
  });

  // Sets the client's google profile
  function setProfile () {
    // TODO: verify that the google email is a berkeley email
    // TODO: save the google profile as googleProfile

    // If the email is valid, fade out page
    if (email) {
      $loginPage.fadeOut();
      $connectPage.show();
      $loginPage.off('click');
    }
  }

  // Sets the client's username
  function setUsername () {
    username = cleanInput("first".trim());
    console.log("setting username: " + username);

    // If the username is valid
    if (username) {
      $loginPage.fadeOut();
      $connectPage.show();
      $loginPage.off('click');

      // Tell the server your username
      socket.emit('add user', username);
    }
  }

  // Log a message
  function log (message, options) {
    var $el = $('<li>').addClass('log').text(message);
    addMessageElement($el, options);
  }

  // Adds a message element to the messages and scrolls to the bottom
  // el - The element to add as a message
  // options.fade - If the element should fade-in (default = true)
  // options.prepend - If the element should prepend
  //   all other messages (default = false)
  function addMessageElement (el, options) {
    var $el = $(el);

    // Setup default options
    if (!options) {
      options = {};
    }
    if (typeof options.fade === 'undefined') {
      options.fade = true;
    }
    if (typeof options.prepend === 'undefined') {
      options.prepend = false;
    }

    // Apply options
    if (options.fade) {
      $el.hide().fadeIn(FADE_TIME);
    }
    if (options.prepend) {
      $messages.prepend($el);
    } else {
      $messages.append($el);
    }
    $messages[0].scrollTop = $messages[0].scrollHeight;
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

  // Socket events

  // Whenever the server emits 'login', log the login message
  // socket.on('login', function (data) {
  //   connected = true;
  //   // Display the welcome message
  //   var message = "Welcome to Socket.IO Chat – ";
  //   log(message, {
  //     prepend: true
  //   });
  //   addParticipantsMessage(data);
  // });

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
