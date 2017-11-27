function makePosting() {
  console.log("telling server to make a posting")
  var socket = io('http://localhost:3000')

  // parse form
  var course = $('#course-selected').val();
  var loc = $('#location').val();
  var type = $('#issue-type').val();
  var details = $('#issue-details').val();

  // validate form
  // TODO: see about security / possible attacks?
  if (course === "" || loc === "" || type === "") {
    console.log("make a posting form incomplete")
    alert("Please fill out all required fields.")
    event.preventDefault();
    return false;
  }

  var posting = {
    "courseSelected": course,
    "location": loc,
    "issueType": type,
    "issueDetails": details
  }

  console.log('sending make-posting data');
  socket.emit('make posting', {data: posting});
  event.preventDefault();
  return false;
};
