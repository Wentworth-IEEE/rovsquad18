// Bobby Martin
// 2017

const { setupRobot } = require('deploy');
const BotSocket = require('botsocket');
const assert = require('assert');

const botSocket = new BotSocket();
let serverProcess;

before(async function() {
    this.timeout(600000);
    // set up the ol' bot (in debug mode)
    serverProcess = await setupRobot(true);

    // connect to the ol' bot
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
});
