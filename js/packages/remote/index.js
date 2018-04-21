/**
 * Nugget Industries
 * 2017
 *
 * index.js
 * for running on the robot
 *
 * COMMAND LINE ARGUMENTS:
 * -d | --debug:
 *   runs the script without actually trying to read from sensors, sends made up values instead
 * -l | --local:
 *   runs the robot on localhost, should be run with --debug
 */

// dependencies
const net = require('net');
const EventEmitter = require('events');
const yargs = require('yargs');
const { nugLog, levels } = require('nugget-logger');
const { tokenTypes, responseTypes, responseToken } = require('botprotocol');
const i2cbus = require('i2c-bus');
const { Pca9685Driver } = require("pca9685");

// if botServer wasn't spawned as a child process, make process.send do nothing
process.send = process.send || function() {};
// exit on any message from parent process (if it exists)
process.on('message', process.exit);

/*
 * if -d or --debug is specified as a command line argument
 * run server on 127.0.0.1 (localhost)
 * return all sensor calls with dummy data
 */
const args = yargs
    .usage('Usage: $0 [options]')
    .version(false)
    .option('d', {
        alias: 'debug',
        desc: 'use fake sensor values instead of real onez',
        type: 'boolean'
    })
    .option('l', {
        alias: 'local',
        desc: 'run the server on localhost',
        type: 'boolean'
    })
    .option('L', {
        alias: 'log-level',
        desc: 'specify the logging level to use',
        type: 'string',
        choices: levels,
        default: 'INFO'
    })
    .alias('h', 'help')
    .argv;

// set up logger
const logger = new nugLog(args.logLevel, 'remote.log');
console.log(`logging at level ${args.logLevel}`);

if (args.debug) logger.i('startup', 'running in debug mode');

// global constants
const address = args.local ? '127.0.0.1' : '0.0.0.0';
const port = 8080;
const emitter = new EventEmitter();
const pca = new Pca9685Driver({
    i2c: i2cbus.openSync(1),
    address: 0x40,
    frequency: 50,
    debug: false
}, error => {
    if (error) {
        logger.e('PCA Init', 'wow some serious shit happened trying to initialize the PCA. here\'s some more on that:\n');
        throw error;
    }
    logger.i('PCA Init', 'PCA Initialized successfully');
});

// global not-constants
let _client;
let _magInterval;

//////////////////////////////////
// server logic & listener shit //
//////////////////////////////////

const server = net.createServer();
server.listen({
    host: address,
    port: port,
    exclusive: true
});

server.on('listening', onServerListening);
server.on('error', onServerError);
server.on('connection', onServerConnection);

// listening listener (heh)
function onServerListening() {
    logger.i('listening', `server is listening at ${address}:${port}`);
    process.send('listening');
}

// error listener
function onServerError(error) {
    logger.e('server error', error);
}

// connection logic
function onServerConnection(client) {
    logger.i('connection', 'client connected');
    _client = client;

    client.on('data', onClientData);
    client.on('close', onClientDisconnect);
    client.on('error', onClientError);
}

function onClientData(data) {
    logger.d('message', `Hey I got this: ${data}`);
    data = JSON.parse(data);
    emitter.emit(data.type, data);
}

function onClientDisconnect() {
    logger.i('connection', 'client disconnected');
    /*
     * TODO:
     * should this interval be cleared here when the client disconnects
     * or explicitly as a command from the surface when it disconnects or both?
     */
    clearInterval(_magInterval);
    _client = null;
}

function onClientError(error) {
    logger.e('client error', error);
}

/*
 * EMITTER LOGIC
 *
 * Instead of having a big disgusting switch statement to handle commands
 * like two years ago, we're using an event emitter now.
 *
 * This server gets data from the surface in the form of stringified botProtocol tokens.
 * botProtocol tokens look like this:
 * {
 *   type: botProtocol.tokenType
 *   headers: {
 *     transactionID: UUIDv1
 *   }
 *   body: message body
 * }
 * When the server gets one of these tokens, [emitter] will emit an event with the token's
 * 'type' as the event name and with the whole token itself as the callback parameter.
 * The token is recieved as a string and is parsed to an object before it is emitted.
 */
emitter.on(tokenTypes.ECHO, echo);
emitter.on(tokenTypes.READMAG, readMag);
emitter.on(tokenTypes.STARTMAGSTREAM, startMagStream);
emitter.on(tokenTypes.STOPMAGSTREAM, stopMagStream);
emitter.on(tokenTypes.CONTROLLERDATA, consumeControllerData);

// respond with the same body as the request
function echo(data) {
    const response = new responseToken(data.body, data.headers.transactionID);
    sendToken(response);
}

function readMag(data) {
    // if we're in debug mode, send back random values from [-pi - pi) radians
    if (args.debug) {
        const response = new responseToken({
            heading: Math.random() * 2 * Math.PI - Math.PI,
            pitch: Math.random() * 2 * Math.PI - Math.PI,
            roll: Math.random() * 2 * Math.PI - Math.PI
        }, data.headers.transactionID);
        sendToken(response);
        return;
    }
    // Chris' sensor library call would go here
}

function startMagStream(data) {
    clearInterval(_magInterval);
    /*
     * DummyToken is used as a fake token to pass to the readMag function.
     * Since readMag only ever looks at the token's transactionID, we can
     * trick it into sending a response token with the a pre-determined
     * transactionID. The surface station will then emit an event of that
     * pre-determined type, and we can handle that event knowing that it's
     * a response from the magStream.
     */
    const dummyToken = {
        headers: {
            transactionID: responseTypes.MAGDATA
        }
    };
    // set up the ol' interval
    _magInterval = setInterval(readMag, data.body.interval, dummyToken);

    // respond anyway cuz they all do that
    const response = new responseToken({}, data.headers.transactionID);
    sendToken(response);
}

function stopMagStream(data) {
    clearInterval(_magInterval);

    const response = new responseToken({}, data.headers.transactionID);
    sendToken(response.stringify());
}

function joystickMap(i) {
    // Turn the range of values from the controller (-1 to 1) into
    // a PWM-friendly range (0.0... to 1.0)
    return (i+1)/2;
}

function consumeControllerData(data) {
    if (args.debug) {
        // do nothing if the server is running in debug mode
        const response = new responseToken({}, data.headers.transactionID);
        sendToken(response);
        return;
    }
    
    logger.d('PCA-debug', 'Setting PCA values.');
    logger.d('PCA-debug', data);
    
    let joystick = data.joysticks;

    pca.setDutyCycle(0, joystickMap(joystick[3]));
    pca.setDutyCycle(1, joystickMap(joystick[2]));
    pca.setDutyCycle(2, joystickMap(joystick[0]));   
    pca.setDutyCycle(3, joystickMap(joystick[1]));
    pca.setDutyCycle(4, joystickMap(joystick[4]));
    pca.setDutyCycle(5, joystickMap(joystick[5]));
}

function sendToken(token) {
    // be careful with verbose logging in local mode
    // this can crash the script if too much is being logged
    logger.d('message', 'sending it: ' + token.stringify());
    _client.write(token.stringify());
}
