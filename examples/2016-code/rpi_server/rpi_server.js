// TODO: write a better header lol
// WIT ROV RPI control script
// Bobby Martin && Nate Dube
// 2016

// Native Dependencies
var net = require('net');                   // Socket connections
var os = require('os');                     // System stats
// NPM dependancies
var joystick = require('joystick');         // Joystix
var pca9685 = require('adafruit-pca9685');  // PCA MUTHAFUCKA

// Setup variables
var host = '10.10.10.1';
var port = 6969;
var exclusive = false;
// variables for the sensors and shit
var joyEnabled = false;
var joyX = 0, joyY = 0;
var lThrust, rThrust, upThrust = 0, manNips = 0;
var options = {
  freq: 50,
};


console.log('WIT ROV 2016 - Server Unit');

// determine processor architecture
var arch = os.arch();
// true if we're on the pi
var rpi = (arch.indexOf('arm') > -1);
// initialize pca and shit
var pca = new pca9685(options);
for (var i = 0; i < 5; i++) {
  console.log('setting pca channel ' + i + ' to 1617');
  pca.setPulse(i, 1617);
}

console.log('System Architecture: '+arch);
console.log('Enable RPI features: '+rpi+'\n');

// Initialize a TCP socket server
var server = net.createServer();
server.listen(port, host, exclusive);

// if we have ajoystick plugged in
if (joyEnabled) {
  // initialize joystick
  var joy1 = new joystick(0, 3500, 350);

  // do some joystick shit
  joy1.on('axis', function(peen) {
    var scale = -peen.value/32767;
    console.log('scale = ' + scale);
    if (peen.number == 0) {
      joyX = scale;
      console.log('joyX set to ' + joyX);
    }
    if (peen.number == 1) {
      joyY = scale;
      console.log('joyY set to ' + joyY);
    }
    if (peen.number == 3) {
      upThrust = (scale*540+1617);
      console.log('upThrust set to ' + upThrust);
    }
    if (peen.number == 5) {
     manNips = ((scale)*100+1617);
     console.log('manNips set to ' + manNips);
    }
    lThrust = (-joyX*540+1617)/2 + (joyY*500+1617)/2;
    console.log('lThrust set to ' + lThrust);
    rThrust = (joyX*540+1617)/2 + (joyY*500+1617)/2;
    console.log('rThrust set to ' +rThrust);
    console.log();
    pca.setPulse(4, lThrust);
    pca.setPulse(3, rThrust);
    pca.setPulse(2, upThrust);
    pca.setPulse(1, upThrust);
    pca.setPulse(0, manNips);
  });

  joy1.on('button', function(peen) {
    console.log(peen);
  });
}

server.on('listening', function serverListening() {
  console.log('Server listening on ' + server.address().address +':'+ server.address().port);
});

server.on('connection', function serverConnection(client) {
  console.log('Client connected: ' + client.remoteAddress +':'+ client.remotePort);
  var buf = ''; // holds string read by server, end of command marked by \n character
  var cmds;     // holds an array of the JSON commands sent

  // Set up event listeners to start cooperating with the client
  client.on('data', function clientData(data) {
    // Data chunks are split pretty randomly, so we store them until we see a newline
    // and then process on that instead.
    buf += data.toString('utf-8');
    console.log('buf = ' + buf);
    if (buf.indexOf('\n') > -1) {
      // There's at least one command ready. Process the buffer...
      var cmds = buf.replace(/\n/gi, '\n|').split('|');
      console.log('cmds = ' + cmds);
      // We use a for/in since there might be more than one
      for (var i in cmds) {
        if (cmds[i].indexOf('\n') > -1)
          // For each command, process and then respond to the client with the result
          client.write(JSON.stringify(processCommand(cmds[i].split('\n')[0]))+'\n');
        else
          buf = cmds[i];
      }
    }
  });

  client.on('close', function clientClose() {
    console.log('Client disconnected. Why did it have to end like this? We had a nice thing going.');
  });

});

// On error. 'close' will follow immediately after this.
server.on('error', function serverError(err) {
  console.log('Fatal Error: '+err);
});

server.on('close', function serverClose() {
  console.log('Goodbye!');
});


// Received commands are passed through this function.
function processCommand(data) {
  var cmd;

  // This is the default response for a failed action
  var response = {
    success: false,
    err: false,
    data: false
  };

  try {
    // Parse the command into a JSON object
    cmd = JSON.parse(data.toString('utf-8'));
  } catch (e) {
    // This is where we catch any bad (non-json) input
    response.err = 'not_json'; // Send back an error message
    response.data = data.toString('utf-8'); // Send back the bad command so we can look at it
    console.log('Invalid JSON: '+response.data);
    return response; // Respond to the client
  }

  // Let's make sure it specifies some action
  if (!cmd.hasOwnProperty('action')) {
    response.err = 'no_action';
    response.data = cmd;
    console.log('Invalid action: '+JSON.stringify(cmd));
    return response;
  }

  /*
   * This is our primary switch case for event processing
   * We can pretty much get away with hooking up most
   * commands right in here.
   */
  switch (cmd.action) {
    // GENERAL COMMANDS
    case 'get_time':
      // Return the rov time for some reason
      response.success = true;
      response.data = {time: Date.now()};
      break;
    case 'get_mem_usage':
      // Get memory usage stats
      response.success = true;
      response.data = {free: os.freemem(), total: os.totalmem()};
      break;
    case 'get_cpu_usage':
      // Get the processor load average
      response.success = true;
      response.data = {cpuload: os.loadavg()};
      break;
    case 'ping':
      // Do nothing, successfully
      response.success = true;
      break;
    case 'echo':
      // echo recieved data, if there was any
      response.success = true;
      if (!cmd.hasOwnProperty('data')) {
        return response;
      }
      response.data = cmd.data;
      return response;
      break;
    case 'joyStick':
      // DO SOME SHIT YEEEEEEEAH
      response.success = true;
      if (!cmd.hasOwnProperty('value') || !cmd.hasOwnProperty('number') || !cmd.hasOwnProperty('type')) {
        return response;
      }
      var scale = -cmd.value/32767;
      console.log('scale = ' + scale);
      if (cmd.number == 0) {
        joyX = scale;
        console.log('joyX set to ' + joyX);
      }
      if (cmd.number == 1) {
        joyY = scale;
        console.log('joyY set to ' + joyY);
      }
      if (cmd.number == 3) {
        upThrust = (scale*540+1617);
        console.log('upThrust set to ' + upThrust);
      }
      if (cmd.number == 5) {
        manNips = (-scale*100+1617);
        console.log('manNips set to ' + manNips);
      }
      lThrust = (-joyX*540+1617)/2 + (joyY*500+1617)/2;
      console.log('lThrust set to ' + lThrust);
      rThrust = (joyX*540+1617)/2 + (joyY*500+1617)/2;
      console.log('rThrust set to ' + rThrust);
      console.log();
      pca.setPulse(4, lThrust);
      pca.setPulse(3, rThrust);
      pca.setPulse(2, upThrust);
      pca.setPulse(1, upThrust);
      pca.setPulse(0, manNips);
      break;

    default:
      response.err = 'not_implemented';
      response.data = cmd;
      console.log('Command not implemented: '+cmd.action);
      break;
  }

  console.log('Command was: '+JSON.stringify(cmd));
  return response;
}
