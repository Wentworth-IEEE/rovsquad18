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
const { tokenTypes, responseTypes, responseToken } = require('bot-protocol');
const { Pca9685Driver } = require("pca9685");
const util = require('util');
const fs = require('fs');
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
];
const manipulatorChannel = 0;
const LEDChannels = [5, 6];
const motorMapMatrix = [
    // F/B, Turn, Strafe, Pitch, Depth
    [ 1,  1,  1,  0, 0 ], // LF
    [ 1, -1, -1,  0, 0 ], // RF
    [ 1,  1, -1,  0, 0 ], // LB
    [ 1, -1,  1,  0, 0 ], // RB
    [ 0,  0,  0, -1, 1 ], // F
    [ 0,  0,  0,  1, 1 ], // B
];

let SHOULD_DO_CONTROL_LOOP = false; // Should we be doing the control loop? Defaults to false.
let lastValMatrix = [
   // F/B, Turn, Strafe, Pitch, Depth
    [ 0, 0, 0, 0, 0 ], // LF
    [ 0, 0, 0, 0, 0 ], // RF
    [ 0, 0, 0, 0, 0 ], // LB
    [ 0, 0, 0, 0, 0 ], // RB
    [ 0, 0, 0, 0, 0 ], // F
    [ 0, 0, 0, 0, 0 ], // B
];

let prevLinear     = [0,0,0];
let prevRotational = [0,0,0];

// # of turbines in the vector drive
const vectorTurbines = 2;
const intervals = {};

// set up logger
const logger = new nugLog(args.logLevel, 'remote.log', () => {
    console.log(`logging at level ${args.logLevel}`)
});
if (args.debug) logger.i('startup', 'running in debug mode');
const tokenTypeEmitter = new EventEmitter();
const pca = args.debug ? undefined : new Pca9685Driver({
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
    motorChannels.map(async channel => {
        console.log(`setting channel ${channel} to 1550us`);
        pca.setPulseLength(channel, 1550);
    });
});

// global not-constants
let _client;

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
    Object.values(intervals).map(interval => clearInterval(interval));
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
tokenTypeEmitter.on(tokenTypes.CONTROLLERDATA, setMotors);
tokenTypeEmitter.on(tokenTypes.READPITEMP, readPiTemp);
tokenTypeEmitter.on(tokenTypes.STARTPITEMPSTREAM, startPiTempStream);
tokenTypeEmitter.on(tokenTypes.STOPPITEMPSTREAM, stopPiTempStream);
tokenTypeEmitter.on(tokenTypes.LEDTEST, setLEDBrightness);

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
    clearInterval(intervals['mag']);
    /*
     * The third setInterval parameter is used as a fake token to pass to the readMag function.
     * Since readMag only ever looks at the token's transactionID, we can
     * trick it into sending a response token with the a pre-determined
     * transactionID. The surface station will then emit an event of that
     * pre-determined type, and we can handle that event knowing that it's
     * a response from the magStream.
     */
    intervals['mag'] = setInterval(readMag, data.body.interval, {
        headers: {
            transactionID: responseTypes.MAGDATA
        }
    });
    sendToken(new responseToken({}, data.headers.transactionID));
}

function stopMagStream(data) {
    clearInterval(intervals['mag']);
    sendToken(new responseToken({}, data.headers.transactionID));
}

function enableControlLoop() {
    SHOULD_DO_CONTROL_LOOP = true;
}

function disableControlLoop() {
    SHOULD_DO_CONTROL_LOOP = false;
}

function motorMatrixMath(joystickVals) {
    //  setpoint = [F/B, Yaw, Strafe, Pitch, Depth]
    let setpoint = [0,0,0,0,0,0];
    for(let i=0; i<6; i++) {
        setpoint[i] = joystickVals[i] * motorMapMatrix[i];// TODO: fix me <3
    }

    let max_e = Math.abs(Math.max(setpoint[4], setpoint[5]));
    if(max_e > 1) {
        setpoint[4] /= max_e;
        setpoint[5] /= max_e;
    }

    let max_l = Math.abs(Math.max(setpoint[0], setpoint[1], setpoint[2], setpoint[3]));
    if(max_l > 1) {
        for(let i = 0; i < 4; i++) {
            setpoint[i] /= max_l;
        }
    }

    return setpoint;

}

/**
 * Maps degrees of freedom to motor values and sends the motor values in the body of a response token.
 * @param data - token recieved from the surface
 */
function recieveControllerData(data) {
    // If doLoop is true, do the control loop. Otherwise, use raw controller data.
    const values = (SHOULD_DO_CONTROL_LOOP) ? controlLoopify(data.body) : motorMatrixMath(data.body);
    for(let rowIndex=0; rowIndex < 5; rowIndex++) {
        if (args.debug)
            return values;

        try {
            pca.setDutyCycle(motorChannels[rowIndex], values[rowIndex]);
        }
        catch (error) {
            console.error(error);
            console.log(`YOU GOT AN ERROR, BITCH: ${value} DON'T FUCKIN FLY`);
        }
        return values;
    }
    logger.d('motor values', JSON.stringify(motorValues));

    const response = new responseToken(motorValues, data.headers.transactionID);
    sendToken(response);
}

/**
 * Respond with Pi's CPU temp in degrees Celcius
 * @param data
 */
async function readPiTemp(data) {
    // TODO SEND TEMP HERE
    if (args.debug)
        return sendToken(new responseToken('6 bajillion degrees', data.headers.transactionID));

    sendToken(new responseToken(
        (await util.promisify(fs.readFile)('/sys/class/thermal/thermal_zone0/temp', 'utf8'))/1000,
        data.headers.transactionID)
    );
}

/**
 * Start streaming Pi CPU temp at the interval sent as data.body
 * @param data
 */
function startPiTempStream(data) {
    intervals['piTemp'] = setInterval(readPiTemp, data.body, {
        headers: {
            transactionID: responseTypes.PITEMPDATA
        }
    });
    sendToken(new responseToken({}, data.headers.transactionID));
}

/**
 * Stop streaming Pi CPU temp data to the surface
 * @param data
 */
function stopPiTempStream(data) {
    clearInterval(intervals['piTemp']);
    sendToken(new responseToken({}, data.headers.transactionID));
}

function setLEDBrightness(data) {

// Because of the way the board is laid out, 'x' isn't actually 'x', 'roll' isn't actually 'roll', 
// and so on. These functions act as sort-of 'wrappers' for those things.
function getYaw() {
    return 0;
}

function getPitch() {
    return 0;
}

function getFB() {
    return 0;
}

function getUD() {
    return 0;
}

function getLinearMeasurements() {
    return [0,0,0];
}

function getRotationalMeasurements() {
    return [0,0];
}

function controlLoopify(data) {
    var intervalID = setInterval( () => {
        // Kill the loop if needs to stop
        if (!SHOULD_DO_CONTROL_LOOP) {
            clearInterval(intervalID);
        }

        // If zero values for degrees of freedom, set an interval until Ok conditions pop up again-
        // either values are right, or we're trying to move.
        let nowLinearMovement = [0,0,0];
        nowLinearMovement = getLinearMeasurements();
        let nowRotationalMovement = [0,0];
        nowRotationalMovement = getRotationalMeasurements();
    
        let linearVelocity = nowLinearMovement - prevLinear;
        let rotationalVelocity = nowRotationalMovement - prevRotational;
        
        let okLinearRange = 5;
        let okRotationalRange = 5; 

        // If the value for a range of motion isn't (about) zero, and the user wants it to be,
        // corrective action needs to be taken. That corrective action is a PI- a summation of 
        // proportional and integral values. Derivative values may need to be added later. 
        let lin = getLinearMeasurements();
        let rot = getRotationalMeasurements();
        let processvar = [lin[0], rot[0], lin[1], rot[1], lin[2]];
         
    }, 100);
}

function LEDTest(data) {
    if (args.debug)
        return;

    const dutyCycle = (data.body + 1) / 2;
    LEDChannels.map(channel => {
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
