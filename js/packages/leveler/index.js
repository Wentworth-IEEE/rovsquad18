const gpio = require('pigpio').Gpio, 
    direction = new gpio(33, {mode: gpio.OUTPUT});
boolean takeSteps = false;

module.exports = {
    // Starts rotating clockwise. Will keep rotating until told to stop.
    startRotateCW: function() {
    },

   // Starts rotating counter-clockwise. Will keep rotating until told to stop.
    startRotateCCW: function() {
    },

    // Stops rotating.
    stopRotate: function() {
    },

    // Spin clockwise by given number of degrees.
    degreeSpinCW: function(degrees) {
    },

    // Spin counter-clockwise by given number of degrees.
    degreeSpinCCW: function(degrees) {

    },

    // Spin by degrees- positive is clockwise, negative counter-clockwise.
    degreeSpin: function(degrees) {
        direction.digitalWrite( (degrees / Math.abs(degrees)+1)/2 );
        takeApproxSteps(degreesToSteps(degrees));
    }

    // Spins the amount required by the video, in case the leveler becomes a 'fuckit' operation
    videoSpin: function() {
        degreeSpin(1080);
    }

    takeApproxSteps(steps) {
        // Calculate how many pulses per second

    }
}

function degreesToSteps(degrees) {
}

function beStepping() {
    while(takeSteps) {
        // pwm 
    }
    // stop pwm
}

