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

let i2cBus = require("i2c-bus");
let Pca9685Driver = require("pca9685").Pca9685Driver;

const options = {
     i2c: i2cBus.openSync(1),
     address: 0x40,
     frequency: 50,
     debug: false
};

// Loops through turning on and off
function main() {
    let pwm_on = false;
    let milliseconds = new Date().getTime();
    while(true) {
        if(new Date().getTime() < (milliseconds+100)){
            if(pwm_on) {
                pwm.setDutyCycle(1, .9);
                pwm_on = true;
                milliseconds = new Date().getTime();
            } else {
                pwm.setDutyCycle(1, 0);
                pwm_on = false;
                milliseconds = new Date().getTime();
            }
        } 
    }
}

// Sets the PWM to a duty cycle of 90%
function on() {
    pwm.setDutyCycle(1, .9);

}

// Sets the PWM to a duty cycle of 0%
function off() {
    pwm.setDutyCycle(1, 0);
}
