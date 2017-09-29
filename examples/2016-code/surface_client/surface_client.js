// native dependancies
var net = require('net');
// NPM dependancies
var joystick = require('joystick');

// if true, prints some shit to the console
var debug = false;

// not sure what this is for
var options  = {
  fd: null,
  readable: true,
  writeable: true
}

var sock = new net.Socket();

sock.connect(6969, '10.10.10.1');

sock.on('data', function(data) {
  console.log('response: ' + data);
});

sock.on('close', function() {
  console.log('connection closed');
});

var joy1 = new joystick(0, 3500, 350);

joy1.on('button', function(data) {
  if (debug)
    console.log('writing to socket: "action":"joyStick","value":"' + data.value + '","number":"' + data.number + '","type":"' + data.type + '","id":"' + data.id + '"}\n');
  sock.write('{"action":"joyStick","value":"' + data.value + '","number":"' + data.number + '","type":"' + data.type + '","id":"' + data.id + '"}\n');
});

joy1.on('axis', function(data) {
  if (debug)
    console.log('writing to socket: "action":"joyStick","value":"' + data.value + '","number":"' + data.number + '","type":"' + data.type + '"}\n');
  sock.write('{"action":"joyStick","value":"' + data.value + '","number":"' + data.number + '","type":"' + data.type + '"}\n');
});
