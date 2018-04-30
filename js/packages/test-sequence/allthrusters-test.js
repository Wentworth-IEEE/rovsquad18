const i2cbus = require('i2c-bus');
const { Pca9685Driver } = require("pca9685");
const {nugLog, levels} = require('../nugget-logger');
const logger = new nugLog('verbose', 'thrusterTest.log');
console.log('Logging! (Running thruster tests, log in "thrusterTest.log")');                                           

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
});

for(let i = 0; i<12; ++i) {
    pca.setDutyCycle(i, .5);
}

function pos(pin) {
    pca.setDutyCycle(pin, 0.55);
    let start = Date.now();
    while(Date.now() < start + 1000){}
    stopAndPause();
}

function neg(pin) {
    pca.setDutyCycle(pin, 0.45);
    let start = Date.now();
    while(Date.now() < start + 1000){}
    stopAndPause();
}

function stopAndPause() {
    let start = Date.now();
    while(Date.now() < start + 1000){}
}

console.log("\nBEGIN THRUSTER TEST\n");
console.log("LEFT FRONT THRUSTER");
console.log("  Start Left Front thruster Forwards (PWM channel 3 at 55% duty cycle)");
console.log("  Stop left front");
pos(3);
console.log("  Start Left Front thruster Backwards (PWM channel 3 at 45% duty cycle)");
console.log("  Stop left front.");
neg(3);

console.log("LEFT BACK THRUSTER");
console.log("  Start Left Back thruster Forwards (PWM channel 2 at 55% duty cycle)");
console.log("  Stop left back");
pos(2);
console.log("  Start Left Back thruster Backwards (PWM channel 2 at 45% duty cycle)");
console.log("  Stop left back.");
neg(2);

console.log("RIGHT FRONT THRUSTER");
console.log("  Start Right Front thruster Forwards (PWM channel 8 at 55% duty cycle)");
console.log("  Stop right front");
pos(8);
console.log("  Start Right Front thruster Backwards (PWM channel 8 at 45% duty cycle)");
console.log("  Stop right front.");
neg(8);

console.log("RIGHT BACK THRUSTER");
console.log("  Start Right Back thruster Forwards (PWM channel 9 at 55% duty cycle)");
console.log("  Stop right back");
pos(9);
console.log("  Start Right Back thruster Backwards (PWM channel 9 at 45% duty cycle)");
console.log("  Stop right back.");
neg(9);

console.log("FRONT THRUSTER");
console.log("  Start Front thruster Forwards (PWM channel 1 at 55% duty cycle)");
console.log("  Stop front");
pos(1);
console.log("  Start Front thruster Backwards (PWM channel 1 at 45% duty cycle)");
console.log("  Stop front.");
neg(1);

console.log("BACK THRUSTER");
console.log("  Start Back thruster Forwards (PWM channel 11 at 55% duty cycle)");
console.log("  Stop Back");
pos(11);
console.log("  Start Back thruster Backwards (PWM channel 11 at 45% duty cycle)");
console.log("  Stop Back.");
neg(11);

