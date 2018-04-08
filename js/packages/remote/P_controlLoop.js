/**
 * Nugget Industries
 * 2018
 *
 * p_controlLoop.js
 * A simple control loop that gives proportional response to gyroscope input.
 */

const mpu9250 = require('mpu9250');
var mpu = new mpu9250();
if(!mpu.initialize()) {
    console.log("Couldn't find the MPU!");
    return;
}


