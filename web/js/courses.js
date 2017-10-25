// const io = require('socket.io-client');
// var socket = io();

function updateCoursesProfile() {
  console.log("telling server to update courses profile");

  // parse form
  var taken = $('#courses-taken').val();
  var enrolled = $('#courses-enrolled').val();

  // verify that user has selected more than 0 options
  if (taken.length === 0 || enrolled.length === 0) {
    console.log("courses form incomplete")
    alert("Please fill out all required fields.")
    return false;
  }

  // verify that user is not enrolled in courses they've already taken
  for (i = 0; i < taken.length; i++) {
    if (enrolled.indexOf(taken[i]) != -1) {
      console.log("user cannot be enrolled in a course they've already taken");
      alert("Users cannot be enrolled in a course they've already taken. Please check your selections and try again.");
      return false;
    }
  }

  var profile = {
    "coursesTaken": taken,
    "coursesEnrolled": enrolled
  }

  // TODO: socket.io --> send it via socket, emit it

  alert(JSON.stringify(profile));
  return false;
};
