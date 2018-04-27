const gpio = require('pigpio').Gpio, 
    direction = new gpio(33, {mode: gpio.OUTPUT});
const Pca9685Driver = require('pca9685');
const i2cbus = require('i2c-bus');

// TODO- make an import for both this file and the remote/index.js I snagged this from
// That way they share stuff
const pcs = new Pca9685Driver({
    i2c: i2cbus.openSync(1),
    address: 0x40,
    frequency: 50,
    debug: false
}, error => {
    if (error) {
        logger.e('PCA Init', 'it borked:\n');
        throw error;
    }
    logger.i('PCA Init', 'PCA initialized successfully');
});

module.exports = {
    // Starts rotating clockwise. Will keep rotating until told to stop.
    startRotateCW: function() {
        stopRotate();
        direction.digitalWrite(1);
        beStepping();
    },

   // Starts rotating counter-clockwise. Will keep rotating until told to stop.
    startRotateCCW: function() {
        stopRotate();
        direction.digitalWrite(0);
        beStepping();
    },

    // Stops rotating.
    stopRotate: function() {
        pca.setDutyCycle(0, 0);
    },

    // Spin clockwise by given number of degrees.
    degreeSpinCW: function(degrees) {
        direction.digitalWrite(1);
        takeApproxSteps(degreesToSteps(degrees));
    },

    // Spin counter-clockwise by given number of degrees.
    degreeSpinCCW: function(degrees) {
        direction.digitalWrite(0);
        takeApproxSteps(degreesToStep(degrees));
    },

    // Spin by degrees- positive is clockwise, negative counter-clockwise.
    degreeSpin: function(degrees) {
        direction.digitalWrite( (degrees / Math.abs(degrees)+1)/2 );
        takeApproxSteps(degreesToSteps(degrees));
    },

    // Spins the amount required by the video, in case the leveler becomes a 'fuckit' operation
    // Actually a tiny bit more just for safety
    videoSpin: function() {
        degreeSpin(1200);
    },

    takeApproxSteps(steps) {
        beStepping();
        setTimeout(() => {
            stopRotate();
        }, (steps*0.005));
    }
}

// Convert degrees given to number of steps- note that there's 1.8 degrees per step, so 1/1.8 steps per degree
function degreesToSteps(degrees) {
    return degrees*0.5556
}

function beStepping() {
    pca.setDutyCycle(7, 0.5);
}

