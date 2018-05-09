const gpio = require('pigpio').Gpio,
    bagOneOpen  = new gpio(22, {mode: gpio.OUTPUT}),
    bagOneClose = new gpio(23, {mode: gpio.OUTPUT}),
    bagTwoOpen  = new gpio(24, {mode: gpio.OUTPUT}),
    bagTwoClose = new gpio(25, {mode: gpio.OUTPUT});

// Guarantee no floating pins
bagOneOpen.digitalWrite(0);
bagOneClose.digitalWrite(0);
bagTwoOpen.digitalWrite(0);
bagTwoClose.digitalWrite(0);

module.exports = {
    openBagOne: function() {
        pulsePin(bagOneOpen);
    },

    closeBagOne: function() {
        pulsePin(bagOneClose);
    },

    openBagTwo: function() {
        pulsePin(bagTwoOpen);
    },

    closeBagTwo: function() {
        pulsePin(bagTwoClose);
    }
}

function pulsePin(pin) {
    console.log('Pin on!');
    pin.digitalWrite(1);
    setTimeout(() => {
        console.log('Pin off!');
        pin.digitalWrite(0);
    }, 100);
}
