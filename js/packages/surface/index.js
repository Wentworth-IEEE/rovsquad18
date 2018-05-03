/**
 * Nugget Industries
 * 2017
 */

// dependancies
const http = require('http');
const yargs = require('yargs');
const express = require('express');
// const { app, BrowserWindow } = require('electron');
const path = require('path');
const url = require('url');
const io = require('socket.io');
const { nugLog } = require('nugget-logger');
const BotSocket = require('botsocket');
const JoystickMapper = require('joystick-mapper');

// set up logger
const logger = new nugLog('debug', 'surface.log');
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
        default: 'hardboilednugget.local',
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

// botSocket!!!!
const botSocket = new BotSocket();
const mapper = new JoystickMapper(17);

// socket.io stuff
const app = express();
const server = http.Server(app);
const dashboard = io(server);

let _dashSocket = dummySocket;
let win;
/*
app.on('ready', () => {
    win = new BrowserWindow({
        width: 800,
        height: 600
    });

    win.loadURL(url.format({
        pathname: path.join(__dirname, 'dashboard', 'index.html'),
        protocol: 'file:',
        slashes: true
    }));

    win.on('close', () => {
        win = null;
    })
});
*/

/*
 * 1. controller
 * 2. app (express)
 * 3. server
 * 4. dashSocket
 * 5. botSocket
 */
async function main() {

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
            // await botSocket.startMagStream(17);
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
