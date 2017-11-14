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
const host = '127.0.0.1';
const port = 8080;

// express logic
const app = express();
app.set('view engine', 'pug');
app.set('views', viewsDirectory);
app.use('/static', express.static('dashboard/static'));

// http server shit
const server = http.Server(app);

// dashSocket
const dashSocket = io(server);

/*
 * My idea here was to do all the setup first then do
 * all the listener shit
 *
 * Only time will tell if this was s good idea or not
 */

// GET renderer
app.get('/', (request, response) => {
    response.render('index', {
        title: 'Hello there',
        message: 'welcome!'
    });
});

// TODO: socket.io server stuff goes here

server.listen(80, () => console.log(`dashboard listening on port ${dashPort}!!!`));

async function main() {

    // this is commented out for now so we can focus on bot connection stuff
    // const controller = new Controller();
    // await controller.init();
    //
    // controller.on('open', () => console.log('connection with controller opened'));
    // controller.on('data', data => console.log(data));
    //
    // const socket = new BotSocket();
    // socket.connect({
    //     host: host,
    //     port: port
    // });
    // socket.echo('greetings');
    // socket.on('data', data => console.log(data));

}

main().catch(error => {
    console.error(error);
});
