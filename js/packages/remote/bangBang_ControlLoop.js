/**
 * Nugget Industries
 * 2018 (cthierauf)
 *
 * bangBangControlLoop.js
 * Attempts to implement a simple bang-bang control loop.
 *
 * HOW THIS CONTROL LOOP WORKS
 * - We've got a couple of thrusters. By combining their movements, we move in 3 axis (Axes? axises?).
 * - We've got an accelerometer! It tells us, via roll, pitch, and yaw, which way we're headed.
 * So! If the acceleration is 0 (+/- a little bit to keep it reasonable), don't do anything.
 * If the acceleration isn't 0, we're accelerating- so GO FULL ZOOM IN THE OTHER DIRECTION!!!
 * Then we're accelerating in the other direction- so GO FULL ZOOM IN THE OTHER DIRECTION!!!
 * So basically, it bounces back and forth between the goal positions (that's how it gets its name).
 * It's not super pretty, and motors often don't like it (esp. at speed). However, the water slows
 * everything down a bunch, and it's the best we can do until we get something proper in and tuned.
 * For safety, everything is done at half speed.
 */

const mpu9250 = require('mpu9250');
let mpu = new mpu9250();
if(!mpu.initialize()) {
    console.log("MPU failed to initialize.");
    return;
}

function getYaw() {
    return 0;
}

function getPitch() {
    return 0;
}

function getElevate() {
    return 0;
}

function getStrafe() {
    return 0;
}

function getForwards() {
    return 0;
}

function reactYaw() {
}

function reactPitch() {
}

function reactElevate() {
}

function reactStafe() {
}

function reactForwards() {
}

while(true){
    reactYaw(getYaw());
    reactPitch(getPitch());
    reactElevate(getElevate());
    reactStrafe(getStrafe());
    reactForwards(getForwards());
}



