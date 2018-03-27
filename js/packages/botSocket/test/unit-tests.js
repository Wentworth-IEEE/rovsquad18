// Nugget Industries
// 2018

const { setupRobot } = require('deploy');
const BotSocket = require('../');
const assert = require('assert');

const botSocket = new BotSocket();
let serverProcess;

before(async function() {
    this.timeout(600000);
    // start the robot in debug mode
    serverProcess = await setupRobot({
        local: true
    });

    // connect to the bot
    await botSocket.connect({
        host: '127.0.0.1',
        port: 8080
    });
});

after(async function() {
    await botSocket.disconnect();
    serverProcess.send('goodbye');
});

describe('botSocket command tests', function() {
    // just make sure each command yields a response from the robot
    // pretty simple
    it('echo', async function() {
        const testPhrase = 'this is a test do not be alarmed';
        assert.equal(testPhrase, await botSocket.echo(testPhrase));
    });
    it('readMag', async function () {
        const response = await botSocket.readMag();
        assert(response.heading);
        assert(response.pitch);
        assert(response.roll);
    });
    it('sendControllerData', async function() {
        assert(await botSocket.sendControllerData({
            axes: [
                'SEND HELP'
            ],
            buttons: [
                'PLEASE GOD'
            ]
        }));
    });
});
