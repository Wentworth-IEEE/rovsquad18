const allsensors = require('./allsensors-test.js');
const allthrusters = require('./allthrusters-test.js');
const allmoves = require('./allmoves-test.js');
const subsystems = require('./subsystems-test.js');

function waitForDunk(){
}

function waitForConfirm(){
}

console.log("I'm going to start with a test of the sensors. Please make sure the ROV is on flat(ish) land.");
allsensors.test();

console.log("I'm now ready to get dunked in the water. I'll keep an eye on the depth sensor and start moving once I'm underwater.");
waitForDunk();
waitForConfirm();

console.log("I'm now going to start testing thrusters.")
allthrusters.test();

console.log("Did all thrusters fire? If so, let's keep going!");
waitForConfirm();

console.log("I'm now going to try moving.");
allmoves.test();

console.log("Did all of those moves look right?");
waitForConfirm();

console.log("Great! Time to test subsystems.");
subsystems.test();

console.log("Did that look right?");
waitForConfirm();

console.log("Great! All systems seem up and running. Good luck!");

