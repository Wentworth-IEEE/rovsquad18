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

// Get dependencies, initialize stuff
var sleep = require('sleep');
/*
	// If the defaults ever need to get changed, uncomment this
	// and comment out 'var makePwm = require('adafruit-pca9685');'
	// Note that the contents of this object are the defaults

var makePwm =  {
    "freq": "50",				// frequency of the device
    "correctionFactor": "1.0",	// correction factor - fine tune the frequency
    "address": "0x40",			// i2c bus address
    "device": '/dev/i2c-1',		// device name
    "debug": <null>				// adds some debugging methods if set
}

*/
var makePwm = require('adafruit-pca9685');
var pwm = makePwm();

// Tell PCA to do the things, print to console
while(true) {
	console.log('Setting PWM on channel 1 to 255!');
	pwm.setPulse(1, 255);
	sleep.sleep(5);
	console.log('Setting PWM on channel 1 to 0!');
	pwm.setPulse(1, 0);
	sleep.sleep(5);
}
