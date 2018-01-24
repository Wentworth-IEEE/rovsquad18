// Bobby Martin
// 2017

const { setupRobot } = require('deploy');
const BotSocket = require('botsocket');
const assert = require('assert');

const botSocket = new BotSocket();
let serverProcess;

/*
 * TODO
 * can this be broken up into tests for individual modules?
 * can each module's test scrpits just require and use deploy themselves?
 * probably.
 */

before(async function() {
    this.timeout(600000);
    // start the robot in debug mode
    serverProcess = await setupRobot(true);

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

describe('command tests', function() {
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
        assert(await botSocket.sendControllerData());
    });
});
