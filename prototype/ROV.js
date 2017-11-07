// Bobby Martin
// 2017

const Controller = require('./lib/controller');
const BotSocket = require('./lib/botSocket');

// global constants
const host = '127.0.0.1';
const port = 8080;

async function main() {

    const controller = new Controller();
    await controller.init();

    controller.on('open', () => console.log('connection with controller opened'));
    controller.on('data', data => console.log(data));

    const socket = new BotSocket();
    socket.connect({
        host: host,
        port: port
    });

}

main().catch(error => {
    console.error(error);
});
