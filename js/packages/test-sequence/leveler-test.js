const leveler = require('../leveler');
const i2cbus = require('i2c-bus');
const {Pca9685Driver} = require('pca9685');
const {nugLog, levels} = require('../nugget-logger');
const logger = new nugLog('verbose', 'levelerTest.log');
console.log('Logging! (Running leveler tests, log in "levelerTest.log")');

const pca = new Pca9685Driver({
    i2c: i2cbus.openSync(1),
    address: 0x40,
    frequency: 50, debug: false
}, error => {
    if (error) {
        logger.e('PCA init', 'Stuff borked (claw PCA init)');
        throw error;
    }
    logger.i('PCA Init', 'PCA up!');
});

function testRotateCW() {
}

function testRotateCCW() {
}

function testStopRotate() {
}

function testDegreeSpinCW() {
}

function testDegreeSpin() {
}

function testVideoSpin() {
}

