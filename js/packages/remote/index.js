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
const { Pca9685Driver } = require("pca9685");
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
if (args.local) args.debug = true;
const i2cbus = args.debug ? { openSync: () => 69 } : require('i2c-bus');

// global constants
const hostAddress = '0.0.0.0';
const hostPort = 8080;
const motorChannels = [
    // maps each motor position to its PWM channel
    3,  // LF
    8,  // RF
    2,  // LB
    9,  // RB
    1,  // F
    11, // B
    5,  // LED1
    6   // LED2
];
const motorMapMatrix = [
   // F/B, Turn, Strafe, Pitch, Depth
    [ 1,  1,  1,  0, 0 ], // LF
    [ 1, -1, -1,  0, 0 ], // RF
    [ 1,  1, -1,  0, 0 ], // LB
    [ 1, -1,  1,  0, 0 ], // RB
    [ 0,  0,  0, -1, 1 ], // F
    [ 0,  0,  0,  1, 1 ], // B
];
// # of turbines in the vector drive
const vectorTurbines = 4;

// set up logger
const logger = new nugLog(args.logLevel, 'remote.log', () => {
    console.log(`logging at level ${args.logLevel}`)
});
if (args.debug) logger.i('startup', 'running in debug mode');
const tokenTypeEmitter = new EventEmitter();
const pca = args.debug ? undefined : new Pca9685Driver({
        i2c: i2cbus.openSync(1),
        address: 0x40,
        frequency: 300,
        debug: false
    }, error => {
        if (error) {
            logger.e('PCA Init', 'wow some serious shit happened trying to initialize the PCA. here\'s some more on that:\n');
            throw error;
        }
        logger.i('PCA Init', 'PCA Initialized successfully');
        motorChannels.map(channel => {
            pca.setDutyCycle(channel, 0);
            pca.setDutyCycle(channel, 0.5);
        });
    });

// global not-constants
let _client;
let _magInterval;

// exit on any message from parent process (if it exists)
process.on('message', process.exit);

//////////////////////////////////
// server logic & listener shit //
//////////////////////////////////

const server = net.createServer();
server.on('listening', onServerListening);
server.on('error', onServerError);
server.on('connection', onServerConnection);
server.listen({
    host: hostAddress,
    port: hostPort,
    exclusive: true
});

// listening listener (heh)
function onServerListening() {
    logger.i('listening', `server is listening at ${hostAddress}:${hostPort}`);
    try {
        process.send('listening');
    }
    catch(error) {
        logger.v('listening', 'process was not spawned as a child process')
    }
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
    data.toString().replace(/}{/g, '}|{').split('|').forEach(datum => {
        logger.d('message', `Hey I got this: ${datum}`);
        try {
            datum = JSON.parse(datum);
        }
        catch(error) {
            logger.e('token parse', `couldn't parse this: ${datum}`);
            datum = 'tokenerror';
        }
        tokenTypeEmitter.emit(datum.type, datum);
    })
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
tokenTypeEmitter.on(tokenTypes.ECHO, echo);
tokenTypeEmitter.on(tokenTypes.READMAG, readMag);
tokenTypeEmitter.on(tokenTypes.STARTMAGSTREAM, startMagStream);
tokenTypeEmitter.on(tokenTypes.STOPMAGSTREAM, stopMagStream);
tokenTypeEmitter.on(tokenTypes.CONTROLLERDATA, recieveControllerData);
tokenTypeEmitter.on(tokenTypes.LEDTEST, LEDTest);

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

/**
 * Maps degrees of freedom to motor values and sends the motor values in the body of a response token.
 * @param data - token recieved from the surface
 */
function recieveControllerData(data) {
    const motorValues = motorMapMatrix.map((row, rowIndex) => {
        /*
         * OK let me explain my math here:
         *
         * Each row in the matrix motorMapMatrix is a motor, and each column is a degree of freedom.
         *
         * With the reduce function we're applying the values of the 5 degrees of freedom to each row
         * in the matrix, where each value represents weather the turbine represented by that row should
         * go forwards or backwards based on the value of the degree of freedom in that column.
         *
         * Then we take that and divide it by the number of motors there are in the vector drive (4 in our case)
         * so that no motor's value will never go over 1 or below -1.
         *
         * THEN we take that value and add 1 & divide by 2 so the number's range becomes [0 -> 1] instead of [-1 -> 1].
         *
         * FINALLY because sometimes the buttons hiccup and joystick-mapper adds more degrees of freedom together than
         * it needs to, we set the duty cycle in a try/catch.
         *
         * TODO I'd like to fix the last one if we have time, it's really a nitpicky thing though.
         */
        const value = (row.reduce((sum, dir, index) => sum + dir * data.body[index], 0) / vectorTurbines) + 1 / 2;
        if (args.debug)
            return value;

        try {
            pca.setDutyCycle(motorChannels[rowIndex], value);
        }
        catch (error) {
            console.error(error);
            console.log(`YOU GOT AN ERROR, BITCH: ${value} DON'T FUCKIN FLY`);
        }
        return value;
    });
    logger.d('motor values', JSON.stringify(motorValues));

    const response = new responseToken(motorValues, data.headers.transactionID);
    sendToken(response);
}

function LEDTest(data) {
    if (args.debug)
        return;

    const dutyCycle = (data.body + 1) / 2;
    [5, 6].map(channel => {
        logger.d('LEDTest', `${channel} ${dutyCycle}`);
        pca.setDutyCycle(channel, dutyCycle);
    });
}

function sendToken(token) {
    // be careful with verbose logging in local mode
    // this can crash the script if too much is being logged
    logger.d('message', 'sending it: ' + token.stringify());
    _client.write(token.stringify());
}
