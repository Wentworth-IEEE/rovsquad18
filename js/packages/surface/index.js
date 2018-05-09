/**
 * Nugget Industries
 * 2017
 */

// dependancies
const http = require('http');
const yargs = require('yargs');
const express = require('express');
const io = require('socket.io');
const { nugLog } = require('../nugget-logger');
const BotSocket = require('../bot-socket');
const JoystickMapper = require('../joystick-mapper');

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
        default: 'deepfriednug.local',
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

// BotSocket!!!!
const botSocket = new BotSocket();
const mapper = new JoystickMapper(17);

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
 * 5. BotSocket
 */
async function main() {

    // convert radians to degrees
    botSocket.on('magData', data => {
        Object.keys(data).map(k => data[k] *= 180 / Math.PI);
        _dashSocket.emit('magData', data);
    });
    botSocket.on('piTempData', data => {
        _dashSocket.emit('piTempData', data);
    });

    // set us up some dashboard listeners
    dashboard.on('connection', socket => {

        logger.i('dashboard', 'the dashboard awakens');
        socket.on('connectToBot', async () => {
            await botSocket.connect(options);
            await botSocket.startPiTempStream(1000);
            mapper.on('data', async data => {
                _dashSocket.emit('motorData', (await botSocket.sendControllerData(data)).body);
            });
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

main().catch(error => console.error(error));
