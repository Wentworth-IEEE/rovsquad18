const leveler = require('../leveler');

console.log("I'm going to try to spin 180.");
degreeSpin(180);
console.log("I'm going to try to stop for a moment.");
let now = Date.time();
while(now+2000 > Date.time()){}
console.log("I'm going to try to spin -180.");
degreeSpin(-180);

console.log("I'm going to try to spin clockwise for 2 seconds.");
startRotateCW();
now = Date.time();
while(now+2000 > Date.time()){}
console.log("Stopping rotation.");
stopRotate();

console.log("All done testing!");

