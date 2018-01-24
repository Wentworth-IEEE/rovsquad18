
// Bobby Martin
// 2017

// native dependancies
const http = require('http');

// package dependancies
const clp = require('clp');
const express = require('express');
const io = require('socket.io');

// local dependancies
const Controller = require('controller');
const BotSocket = require('botsocket');

// global constants
const argv = clp(process.argv);
const local = argv['l'] || argv['local'];

// dashboard stuff
const dashPort = 80;

// botSocket stuff
const piAddress = local ? '127.0.0.1' : 'spacenugget.local';
const piPort = 8080;
const options = {
    host: piAddress,
    port: piPort
};

// so that the dashboard doesn't blow up in our face when we leave or try to re-load
const dummySocket = {
    reset: () => {
        this.notified = false;
        return dummySocket;
    },
    // overload emit, be annoying if you try to emit to a dashboard that isn't there
    emit: () => {
        if (this.notified)
            return;
        console.log('dashboard disconnected WHAT HAVE YOU DONE');
        this.notified = true;
    }
};

// controller!
const controller = new Controller();

// botSocket!!!!
const botSocket = new BotSocket();

// socket.io stuff
const app = express();
const server = http.Server(app);
const dashboard = io(server);
let _dashSocket = dummySocket;
// express/webserver stuff
app.set('view engine', 'pug');
app.set('views', __dirname + '/dashboard/templates');
app.use('/static', express.static(__dirname + '/dashboard/static'));
app.locals.pretty = true;

// GET renderer
app.get('/', (request, response) => response.render('index'));

// http server shit
server.listen(dashPort, () => console.log(`dashboard running on localhost:${dashPort}`));

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
    // controller.on('open', () => console.log('connection with controller opened'));
    // controller.on('data', data => console.log(data));

    // convert radians to degrees
    botSocket.on('magData', mag => {
        Object.keys(mag).map(k => mag[k] *= 180 / Math.PI);
        _dashSocket.emit('readMag', mag);
    });

    // set us up some dashboard listeners
    dashboard.on('connection', socket => {
        console.log('the dashboard awakens');
        socket.on('connectToBot', async () => {
            await botSocket.connect(options);
            await botSocket.startMagStream(17);
        });
        socket.on('disconnectFromBot', async () => {
            await botSocket.disconnect();
        });

        // actual socket.io disconnect event from dashboard
        socket.on('disconnect', () => {
            console.log('dashboard connection closed');
            _dashSocket = dummySocket.reset()
        });
        _dashSocket = socket;
    });

}

main().catch(error => console.error(error));
