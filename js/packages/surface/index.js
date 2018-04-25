/**
 * Nugget Industries
 * 2017
 */

// dependancies
const http = require('http');
const yargs = require('yargs');
const express = require('express');
const io = require('socket.io');
const gamepad = require('gamepad');
const { nugLog } = require('nugget-logger');
const Controller = require('controller');
const BotSocket = require('botsocket');
const JoystickMapper = require('joystick-mapper');

gamepad.init();
setInterval(gamepad.processEvents, 10);

// set up logger
const logger = new nugLog('debug', 'surface.log');

// socket.io dashboard port
const dashPort = 80;

const args = yargs
    .usage('Usage: $0 [options]')
    .version(false)
    .option('l', {
        alias: 'local',
        desc: 'connect to the robot on localhost',
        type: 'boolean'
    })
    .option('P', {
        alias: 'pi-address',
        desc: 'connect to the robot at this address',
        type: 'string',
        default: 'spacenugget.local',
        nargs: 1
    })
    .alias('h', 'help')
    .argv;

// address to look for robot at
const botAddress = args.local ? '127.0.0.1' : args.piAddress;
// port to look for robot on
const piPort = 8080;
// robot connection options
const options = {
    host: botAddress,
    port: piPort
};

// so that the dashboard doesn't blow up in our face when we leave or try to re-load
const dummySocket = {
    reset: () => {
        this.notified = false;
        return dummySocket;
    },
    // overload emit, be annoying if you try to send stuff to a dashboard that isn't there
    emit: () => {
        if (this.notified)
            return;

        logger.w('dashboard', 'dashboard disconnected WHAT HAVE YOU DONE OPEN IT BACK UP');
        this.notified = true;
    }
};

// controller!
const controller = new Controller();

// botSocket!!!!
const botSocket = new BotSocket();
const mapper = new JoystickMapper();

// socket.io stuff
const app = express();
const server = http.Server(app);
const dashboard = io(server);

let _dashSocket = dummySocket;

// express/webserver stuff
app.use('/static', express.static(__dirname + '/dashboard/static'));
app.locals.pretty = true;

// GET renderer
app.get('/', (request, response) => response.sendFile(__dirname + '/dashboard/index.html'));

// http server shit
server.listen(dashPort, () => logger.i('dashboard', `dashboard running on localhost:${dashPort}`));

/*
 * 1. controller
 * 2. app (express)
 * 3. server
 * 4. dashSocket
 * 5. botSocket
 */
async function main() {

    // this is commented out for now so we can focus on bot connection stuff
    // await controller.init();
    // controller.on('open', () => console.log('controller connected'));
    controller.on('data', data => botSocket.sendControllerData(data));
    gamepad.on('move', gamepadOnMove);
    gamepad.on('up', gamepadOnUp);
    gamepad.on('down', gamepadOnDown);

    // convert radians to degrees
    botSocket.on('magData', mag => {
        Object.keys(mag).map(k => mag[k] *= 180 / Math.PI);
        _dashSocket.emit('readMag', mag);
    });

    // set us up some dashboard listeners
    dashboard.on('connection', socket => {

        logger.i('dashboard', 'the dashboard awakens');
        socket.on('connectToBot', async () => {
            await botSocket.connect(options);
            await botSocket.startMagStream(17);
        });

        socket.on('disconnectFromBot', async () => {
            await botSocket.disconnect();
        });

        // actual socket.io disconnect event from dashboard
        socket.on('disconnect', () => {
            logger.i('dashboard', 'dashboard connection closed');
            _dashSocket = dummySocket.reset()
        });
        _dashSocket = socket;
    });

}

const directionsMap = {
    forwardBackward: 0,
    turnYaw: 1,
    pitch: 2,
    strafe: 3,
    depth: 4
};
let direction;
const joystickMap = {
    0: async (value) => {
        direction = joystickButtons[0]
            ? directionsMap.pitch
            : directionsMap.forwardBackward;
        console.log(direction, -value);
        // await botSocket.sendControllerData(direction, -value)
    },
    1: async (value) => {
        direction = joystickButtons[1]
            ? directionsMap.strafe
            : directionsMap.turnYaw;
        console.log(direction, value)
    },
    5: async (value) => {
        await botSocket.sendLEDTestData(-value);
    }
};

const joystickButtons = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];

async function gamepadOnMove(id, axis, value) {
    joystickMap[axis](value);
}

async function gamepadOnUp(id, num) {
    joystickButtons[num] = 0;
    logger.d('gamepad', joystickButtons);
}

async function gamepadOnDown(id, num) {
    joystickButtons[num] = 1;
    logger.d('gamepad', joystickButtons);
}

main().catch(error => console.error(error));
