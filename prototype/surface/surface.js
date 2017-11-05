// Bobby Martin
// 2017

const Controller = require('./lib/controller');

async function main() {

    const controller = new Controller();
    await controller.init();

    controller.on('open', () => console.log('connection with controller opened'));
    controller.on('data', data => console.log(data));

}

main().catch(error => {
    console.error(error);
});
