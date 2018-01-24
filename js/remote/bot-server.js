/**
 * botServer.js
 * for running on the robot
 *
 * Bobby Martin
 * 2017
 */

// native dependencies
const net = require('net');
const EventEmitter = require('events');

// package dependancies
const clp = require('clp');

// local package dependancies
const { tokenTypes, responseTypes, responseToken } = require('botprotocol');

// make process.send do nothing if botServer was not spawned as a child process
process.send = process.send || function() {};
// exit on any message from parent process
process.on('message', process.exit);

/*
 * if -d or --debug is specified as a command line argument
 * run server on 127.0.0.1 (localhost)
 * return all sensor calls with dummy data
 */
const argv = clp(process.argv);
const debug = argv['d'] || argv['debug'];
if (debug) console.log('running in debug mode');

// global constants
// TODO: figure out a way to get the pi's address
const address = debug ? '127.0.0.1' : '0.0.0.0';   // the second clause will eventually be the pi's address
const port = 8080;
const emitter = new EventEmitter();

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

// listening listener (heh)
server.on('listening', () => {
    console.log(`server is listening at ${address}:${port}`);
    process.send('listening');
});

// error listener
server.on('error', error => {
    console.error(error);
});

// connection logic
server.on('connection', client => {
    console.log('client connected');
    _client = client;

    client.on('data', onClientData);
    client.on('close', onClientDisconnect);
    client.on('error', onClientError);
});

function onClientData(data) {
    console.log(`Hey I got this: ${data}`);
    data = JSON.parse(data);
    emitter.emit(data.type, data);
}

function onClientDisconnect() {
    console.log('client disconnected');
    /*
     * TODO:
     * should this interval be cleared here when the client disconnects
     * or explicitly as a command from the surface when it disconnects or both?
     */
    clearInterval(_magInterval);
    _client = null;
}

function onClientError(error) {
    console.error(error);
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
 *   type: [botProtocol.tokenType]
 *   headers: {
 *     transactionID: [UUIDv1]
 *   }
 *   body: [whatever ur feelin]
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
    if (debug) {
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
     * dummyToken is used as a fake token to pass to the readMag function.
     * since readMag only ever looks at the token's transactionID, we can
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

function consumeControllerData(data) {
    if (debug) {
        // do nothing if the server is running in debug mode
        const response = new responseToken({}, data.headers.transactionID);
        sendToken(response);
        return;
    }
}

function sendToken(token) {
    console.log('sending it:' + token.stringify());
    _client.write(token.stringify());
}
