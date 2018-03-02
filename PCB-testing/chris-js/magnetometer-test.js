/*
 * magnetometer-test.js
 * Aims to test getting mangetometer data
 * using I2C on the board designed by the
 * electrical team.
 *
 * Author: Chris Thierauf <chris@cthierauf.com>
 * A lot of stuff taken form Owen McAree here:
 * https://github.com/omcaree/node-hmc6343
 *
 * Licensed under GPLv3, see details and license
 * in root folder.
 * Copyright (c) 2018 Nugget Industries
 *
 */

// Include the module
const hmc6343 = require('hmc6343.js');

// Create new instance
let compass = new hmc6343('/dev/i2c-3', 0x19);

// Read in accelerometer data
compass.readAccel(
	accelData => console.log(`Accel Data: ${accelData.ax}, ${accelData.ay}, ${accelData.az}`);
);

// Read in magnetic data
compass.readMag(
	magData => console.log(`Mag Data: ${magData.mx}, ${magData.my}, ${magData.mz}`);
);

// Read in attitude data (in radians)
compass.readAtt(
	attData => console.log(`Attitude: ${attData.heading}, ${attData.pitch}, ${attData.roll}`);
);
