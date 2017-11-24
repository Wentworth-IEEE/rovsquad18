// Bobby Martin
// 2017

// native dependancies
const http = require('http');

// package dependancies
const express = require('express');
const io = require('socket.io');

// local dependancies
const Controller = require('./lib/controller');
const BotSocket = require('./lib/botSocket');

// global constants
// dashboard stuff
const viewsDirectory = './dashboard/templates';
const dashPort = 80;
// botSocket stuff
const botHost = '127.0.0.1';
const botPort = 8080;

// controller!
const controller = new Controller();

// botSocket!!!!
const botSocket = new BotSocket();

// socket.io stuff
// TODO: make this big ugly chunk of shit into its own library
const app = express();
const server = http.Server(app);
const dashboard = io(server);
let _dashSocket;
// express/webserver stuff
app.set('view engine', 'pug');
app.set('views', viewsDirectory);
app.use('/static', express.static('dashboard/static'));
app.locals.pretty = true;
// GET renderer
app.get('/', (request, response) => {
    app.locals.pretty = true;
    response.render('index');
});
// http server shit
server.listen(dashPort, () => console.log(`dashboard running on http://localhost:${dashPort}`));

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

    botSocket.connect({
        host: botHost,
        port: botPort
    });

    // do this every 1 second
    // some ghetto debugging
    setInterval(async () => {
        let mag = await botSocket.readMag();
        try {
            // convert radians to degrees
            Object.keys(mag).map(k => mag[k] *= 180 / Math.PI);
            _dashSocket.emit('readMag', mag);
        }
        catch (error) {
            if (error instanceof TypeError);
            throw error;
        }
    }, 1000);

    // set us up some dashboard listeners
    dashboard.on('connection', socket => {
        socket.on('disconnect', () => _dashSocket = undefined);
        socket.on('disconnectFromBot', async () => {
            console.log('disconnecting from robot');
            await botSocket.disconnect();
            console.log('disconnected from robot');
        });
        _dashSocket = socket;
    });

}

main().catch(error => {
    console.error(error);
});
