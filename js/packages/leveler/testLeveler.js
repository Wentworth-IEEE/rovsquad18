const leveler = require('../leveler');

console.log("I'm going to try to spin 180.");
leveler.degreeSpin(180);
console.log("I'm going to try to stop for a moment.");
let now = Date.now();
while(now+2000 > Date.now()){}
console.log("I'm going to try to spin -180.");
leveler.degreeSpin(-180);

console.log("I'm going to try to spin clockwise for 2 seconds.");
leveler.startRotateCW();
now = Date.now();
while(now+2000 > Date.now()){}
console.log("Stopping rotation.");
leveler.stopRotate();

console.log("All done testing!");

