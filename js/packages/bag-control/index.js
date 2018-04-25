const gpio = require('pigpio').Gpio,
    bagOneOpen  = new gpio(22, {mode: gpio.OUTPUT}),
    bagOneClose = new gpio(23, {mode: gpio.OUTPUT}),
    bagTwoOpen  = new gpio(24, {mode: gpio.OUTPUT}),
    bagTwoClose = new gpio(25, {mode: gpio.OUTPUT});

class bagControl {
    openBagOne() {
        pulsePin(bagOneOpen);
    }

    closeBagOne() {
        pulsePin(bagOneClose);
    }

    openBagTwo() {
        pulsePin(bagTwoOpen);
    }

    closeBagTwo() {
        pulsePin(bagTwoClose);
    }

    pulsePin(pin) {
        console.log('Pin on!');
        pin.digitalWrite(1);
        setTimeout(() => {
            console.log('Pin off!');
            pin.digitalWrite(0);
        }, 100);
    }
}

module.exports.bagControl = bagControl;
