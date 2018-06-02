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
const depthSlave = new (require('nugget-depth'))();
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
    0,  // Manipulator
    10  // picam servo
];
const LEDChannels = [5, 6];
const vectorMapMatrix = [
    // F/B, Turn, Strafe
    [ 1,  1,  1 ], // LF
    [ 1, -1, -1 ], // RF
    [ 1,  1, -1 ], // LB
    [ 1, -1,  1 ], // RB
];
const depthMapMatrix = [
    // Pitch, Depth
    [  1, -1 ], // F
    [ -1, -1 ]  // B
];
// # of turbines in the vector drive
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
let _client, depthLockToggle, targetDepth;

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
tokenTypeEmitter.on(tokenTypes.SETDEPTHLOCKTOKEN, setDepthLock);
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

/**
 * Maps degrees of freedom to motor values and sends the motor values in the body of a response token.
 * @param data - token recieved from the surface
 */
function setMotors(data) {
    const vectorMotorVals = setMotorValues(data.body.slice(0, 3), vectorMapMatrix);
    const depthMotorVals = setMotorValues(data.body.slice(3, 5), depthMapMatrix);    const manipulatorVal = setMotorValue(data.body[5]);
    const picamServoVal = setMotorValue(data.body[7]);
    const motorValues = vectorMotorVals.concat(depthMotorVals.concat(manipulatorVal.concat(picamServoVal)));
    logger.d('motor values', JSON.stringify(motorValues));
    motorValues.map((motorVal, index) => {
        if (args.debug) return;
        try {
            if (!depthLockToggle && index !== 4)
                pca.setPulseLength(motorChannels[index], motorVal);
        }
        catch (error) {
            console.error(`YOU GOT AN ERROR BITCH ${motorVal} INDEX ${index} DON'T FLY`);
            console.error(error);
        }
    });

    if (!args.debug)
        pca.setDutyCycle(6, data.body[6]);
    logger.d('leveler', `Setting leveler channel to ${data.body[6]}`);

    const response = new responseToken(motorValues, data.headers.transactionID);
    sendToken(response);
}

/**
 * Wrapper for setMotorValues for when you only have to set one motor value (  like the manipulator)
 * @param data - DOF data
 * @returns {Array<Object>}
 */
function setMotorValue(data) {
    return setMotorValues([[data]], [[1]])
}

/**
 * Map the input DOF data to motor values
 * @param data - Array of DOF values
 * @param matrix - Matrix mapping DOFs to motor values
 * @returns {Array<Object>}
 */
function setMotorValues(data, matrix) {
    const rawValues = matrix.map(row => {
        /*
         * OK let me explain my math here:
         *
         * Each row in the matrix vectorMapMatrix is a motor, and each column is a degree of freedom.
         *
         * With the reduce function we're applying the values of the 5 degrees of freedom to each row
         * in the matrix, where each value represents weather the turbine represented by that row should
         * go forwards or backwards based on the value of the degr.ee of freedom in that column.
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
        return row.reduce((sum, dir, index) => sum + dir * data[index], 0);
    });

    return rawValues.map(element =>
        // divide all elements by max
        //        calculate max using reduce
        element / rawValues.reduce((accum, val) => Math.abs(val) > accum ? Math.abs(val) : accum, 1) * 400 + 1550
    )
}

/**
 * Respond with Pi's CPU temp in degrees Celcius
 * @param data
 */
async function readPiTemp(data) {
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

/**
 * Toggles depth lock to be enabled or disabled
 * @param data - token sent from robot, body has boolean to lock depth or not
 */
async function setDepthLock(data) {
    // clear interval first
    clearInterval(intervals['depthLock']);
    if (!data.body) {
        // depth lock off
        logger.i('depth lock', 'depth lock disabled');
        depthLockToggle = false;
        return;
    }

    // depth lock on!!
    depthLockToggle = true;
    targetDepth = await depthSlave.getDepth();
    logger.i('depth lock', `depth lock enabled, setting to ${targetDepth}`);
    intervals['depthLock'] = setInterval(depthLoop, 100);

    // respond like a good boy
    sendToken(new responseToken({}, data.headers.transactionID));
}

let startZLog=false;
var zlogfile = require('fs');
var filepath = '/opt/zlog/zlog.csv'; /*""+makeZLogName();*/ // there was a fancy naming thing but it kept not working so it can fuck right off

function doZLog(zp, zi, zd, zout, depth) {
    if(!startZLog) {
        console.log("Started logging at"+makeZLogName());
        zlogfile.open(filepath, 'w', function(err, fd) {
            if(err) throw err;
        });
        zlogfile.appendFile(filepath, generateHeaderString(), function(err) {
            if(err) throw err;
        });
        startZLog = true;
    }

    zlogfile.appendFile(filepath, generateDataString(zp, zi, zd, zout, depth, z_last_raw, z_last_diff), function(err) {
        console.log("Logged");
        if(err) throw err;
    });
}

function generateHeaderString() {
    let headerstring = 'zp, zi, zout, depth'
    for(let i = 0; i < z_last_raw.length; i++)
        headerstring += ", z_last_raw"+i;
    for(let i = 0; i < z_last_diff.length; i++)
        headerstring += ", z_last_diff"+i;
    return headerstring+'\n';
}

function generateDataString(zp, zi, zout, depth) {
    let dstring = "";
    dstring += zp+", "+zi+", "+zout+", "+depth
    for(let i = 0; i < z_last_raw.length; i++)
        dstring += ", "+z_last_raw[i];
    for(let i = 0; i < z_last_diff.length; i++)
        dstring += ", "+z_last_raw[i];

    return dstring+'\n';
}

function makeZLogName() {
    let d = new Date();
    let logname = "/opt/zlogs/"+d+".csv";
    return logname;
}

function inDepthDeadzone(args) {
    // Checking if the values are within the deadzone.
    // Done seperately just in case they aren't the same value.
    if( !(args[0] < .15 && args[0] > -.15) )
        return false;
    if( !(args[1] < .15 && args[1] > -.15) )
        return false;
    return true;
}

// This \/ was contributing to stupid, so bye for now
// let loop_history = 10; // Being a variable lets us change this later, if that's useful.
let z_last_raw=[0,0,0,0,0,0,0,0,0,0]; //  To be used as an array- ideally these wouldn't be set like this but attempting to prevent stupid over here
let z_last_diff=[0,0,0,0,0,0,0,0,0,0]; // Also to be used as an array
// Constants are here for now, will be set by the user through the dashboard later.
let zKp = 1;
let zKi = 1;
let zKd = 0;

async function depthLoop() {
    //do depth lock
    let depth = await depthSlave.getDepth();
    appendZ(depth);

    let zp = z_last_raw[9]; // We don't want a specific depth, we want depth to be constant. So- P is change between now and last.
    let zi = getDepthIntegral();
    let zd = getDepthDerivative();
    let zout = doDepthPID(zp, zi, zd);

    doZLog(zp, zi, zd, zout, depth, z_last_raw, z_last_diff);

    pca.setPulseLength(1, zout+1550);
    pca.setPulseLength(11, zout+1550);
}

function doDepthPID(zp, zi, zd) {
    return zKp*zp + zKi*zi + zKd*zd;
}

function initLoopArray() {
    return;
    // cutting things up to fix stupid again, they're all set to a length of 10 @ 0 anyway
    if(z_last_raw[0] == -1) {
        for(let i = 0; i < 10; i++) {
            z_last_raw.push(0);
        }
        z_last_diff = z_last_raw;
    }
}

function appendZ(depth) {
    initLoopArray();
    // Shift everything in the array one to the left, discarding [0] and making the last index redundant
    let z_last_0 = z_last_raw[0]; // We're about to get rid of this, but we need it for math later.
    for(let i = 0; i < 9; i++) {  // Getting raw values to play with
        z_last_raw[i] = z_last_raw[i+1]
    }
    z_last_raw[9] = depth;

    // We don't actually care about the actual depth, we care that we aren't moving. So, a new array comprised of
    // the difference between each measurement is what we need.
    for(let i = 1; i < 10; i++) {
        z_last_diff[i] = -(z_last_raw[i] - z_last_raw[i-1]); // make negative because pressure decreases as ROV goes up
    }
    z_last_diff[0] = z_last_diff[0] - z_last_0;
}

function getDepthIntegral() {
    // This isn't an integral of the entire usage since that's not useful- it's just loop_history*interval length ms.
    let returnval=0;
    for(let i = 0; i < 10; i++) {
        returnval += z_last_diff[i]*100;
    }
    return returnval;
}

function getDepthDerivative() {
    return (z_last_diff[9] - z_last_diff[0] ) / 2;
}

function setLEDBrightness(data) {
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
