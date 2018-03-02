/*
 * pca-test.js
 * Aims to test  controlling the PCA
 * using I2C on the board designed by the
 * electrical team.
 *
 * Author: Chris Thierauf <chris@cthierauf.com>
 *
 * Licensed under GPLv3, see details and license
 * in root folder.
 * Copyright (c) 2018 Nugget Industries
 *
 */

// Should cycle a thruster on and off.

var i2cBus = require("i2c-bus");
var Pca9685Driver = require("pca9685").Pca9685Driver;

var options = {
     i2c: i2cBus.openSync(1),
     address: 0x40,
     frequency: 50,
     debug: false
};

// Loops through turning on and off
while(true) {
    var on = setInterval(on(), 1000);
    var off = setInterval(off(), 1000);
}

// Sets the PWM to a duty cycle of 90%
function on() {
    pwm.setDutyCycle(1, .9);
}

// Sets the PWM to a duty cycle of 0%
function off() {
    pwm.setDutyCycle(1, 0);
}
