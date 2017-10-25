function makePosting() {
  console.log("telling server to make a posting")

  // parse form
  var course = $('#course-selected').val();
  var loc = $('#location').val();
  var type = $('#issue-type').val();
  var details = $('#issue-details').val();

  // validate form
  if (course === "" || loc === "" || type === "") {
    alert("Please fill out all required fields.")
  }

  var posting = {
    "courseSelected": course,
    "location": loc,
    "issueType": type,
    "issueDetails": details
  }

  // TODO: socket.io --> send it via socket, emit it

  alert(JSON.stringify(posting));
  return false;
};
