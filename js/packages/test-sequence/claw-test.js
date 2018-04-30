const i2cbus = require('i2c-bus');
const { Pca9685Driver } = require("pca9685");
const {nugLog, levels} = require('../nugget-logger');
const logger = new nugLog('verbose', 'clawTest.log');
console.log('Logging! (Running claw tests, log in "clawTest.log")');aaaaa

const pca = new Pca9685Driver({
    i2c: i2cbus.openSync(1),
    address: 0x40,
    frequency: 300,
    debug: false
}, error => {
    if (error) {
        logger.e('PCA Init`, `Stuff borked\n');
        throw error;
    }
    logger.i('PCA Init', 'PCA up!');

    
    let dutyCycle = .55
    for(let i=0; i < 7; i++) {
        setInterval(() => {
            pca.setDutyCycle(0, dutyCycle);
        }, 250);
        if(i === 0 || i === 2 || i === 4 || i === 6) {
            dutyCycle = .5;
        } else if(i === 1) {
            dutyCycle = .55;
        } else if(i === 3 || i === 5) {
            dutyCycle = .45;
        }
    }
        
    
});

// Test the claw by opening a bit, pausing, opening a bit more, pausing,
// closing a bit, pausing, closing a bit more.

