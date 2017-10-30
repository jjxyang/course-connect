// ####################################################################
// server.js
var io = require('socket.io')(webpage);

io.on('connection', function(socket) {
    // Use socket to communicate with this particular client only, sending it it's own id

    //what goes on after hearing the event 'make posting'?
    //not sure what console.log is doing here?
    //supposed to be accepting an input?
    //don't see an emit function inside of the client?
    // socket.on('make posting', function(data) {
    //   console.log(data)
    // });

    socket.on('make posting', function (data) {
      console.log(data);
    });
  
    socket.on('make posting', (data) => {
        console.log(data)
    });
  
    function onMakePosting(data) {
      console.log(data)
    }
    socket.on('make posting', onMakePosting(data));


});

//socket is listening to some emitting event
//whatever the event sends, 
//.on takes two parameters: name of the event, and a function
//function has no name... that's because it's a lambda function
//
//following is json data sent by emitter... listener is the function that will be called once the event happens

// emitter.on(eventName, listener)

{ data: 
   { courseSelected: 'EE 16A',
     location: 'dsf',
     issueType: 'I have a bug',
     issueDetails: '' } }

//on happens on some event, the event needs to be emitted by emit in order for on to see it in order to give its listener an emit so that it can be executed
//basically on
def listener(data){
  print data
}

//basically emit
def emit(listener){
  name = 'stephanie'
  age = '24'
  data = {name, age}
  return listener(data)
}


// ####################################################################
// make-posting.html
  <!--Creates io-->
  <script src="http://localhost:3000/socket.io/socket.io.js"></script> <!-- must change this so that it works with your host -->
  <script type="text/javascript" src="/js/connect/make-posting.js"></script>



// ####################################################################
// make-posting.js
  
//   top
    var socket = io('http://localhost:3000')
  
//  bottom
    socket.emit('make posting', {data: posting})





