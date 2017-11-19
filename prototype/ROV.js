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

// I'm very insecure about the odrer of setting things up here

const controller = new Controller();

// express logic
const app = express();
app.set('view engine', 'pug');
app.set('views', viewsDirectory);
app.use('/static', express.static('dashboard/static'));

// GET renderer
app.get('/', (request, response) => {
    response.render('index', {
        title: 'NUGBoard',
        message: 'welcome!'
    });
});

// http server shit
const server = http.Server(app);

server.listen(dashPort, () => console.log(`dashboard running on http://localhost:${dashPort}`));

// dashSocket
const dashSocket = io(server);

dashSocket.on('connection', socket => {
    socket.emit('fun');
    socket.on('noMoreFun', () => console.log('no more fun allowed'))
});

const botSocket = new BotSocket();

/*
 * My idea here was to do all the setup first then do
 * all the listener shit
 *
 * Only time will tell if this was s good idea or not
 */

async function main() {

    // this is commented out for now so we can focus on bot connection stuff
    await controller.init();

    controller.on('open', () => console.log('connection with controller opened'));
    controller.on('data', data => console.log(data));

    botSocket.connect({
        host: botHost,
        port: botPort
    });
    let boi = await botSocket.echo('greeetings');
    let boi2 = await botSocket.readMag();
    console.log(boi.toString(), boi2.toString());

}

main().catch(error => {
    console.error(error);
});
