const EventEmitter = require('events');
const gamepad = require('gamepad');

const arrEquals = (arr1, arr2) => !arr1.filter((elem, index) => elem !== arr2[index]).length;

// true if platform is windows
const win = require('os').platform().indexOf('win32') > -1;

let FBAxis;
let LRAxis;
let dickspinAxis;
let smolLeftRightAxis;
let smolUpDownAxis;
let throttleAxis;

if (win) {
    FBAxis = 0;
    LRAxis = 1;
    dickspinAxis = 4;
    smolLeftRightAxis = 2;
    smolUpDownAxis = 3;
    throttleAxis = 5;
}
else {
    FBAxis = 1;
    LRAxis = 0;
    dickspinAxis = 2;
    smolLeftRightAxis = 4;
    smolUpDownAxis = 5;
    throttleAxis = 3;
}


gamepad.init();
setInterval(gamepad.processEvents, 17);

module.exports = class extends EventEmitter {

    constructor(interval, deadzone = 0.15) {
        super();
        this.deadzone = deadzone;

        this.axes = [0, 0, 0, 0, 0, 0];
        this.buttons = [false, false, false, false, false, false, false, false, false, false, false, false];

        this.directions = [
            0, // forward/backward
            0, // turn (yaw)
            0, // strafe
            0, // pitch
            0, // depth
            0, // manipulator
            0  // leveler
        ];

        gamepad.on('down', (id, num) => this.buttonDown(id, num));
        gamepad.on('up', (id, num) => this.buttonUp(id, num));
        gamepad.on('move', (id, num, val) => this.joystickMove(id, num, val));
        setInterval(() => this.checkValues(), interval);
    }

    buttonDown(id, num) {
        this.buttons[num] = true;
        this.emit('rawData', this.buttons);
    }

    buttonUp(id, num) {
        this.buttons[num] = false;
        this.emit('rawData', this.buttons);
    }

    joystickMove(id, axis, val) {
        if (Math.abs(val) < this.deadzone) {
            this.axes[axis] = 0;
            return;
        }

        this.axes[axis] = val;
        this.emit('rawData', this.axes);
    }

    checkValues() {
        const newVals = [
            !this.buttons[6] && !this.buttons[0] * -this.axes[FBAxis], // FB
            !this.buttons[6] &&  this.axes[dickspinAxis], // turn
            !this.buttons[6] &&  this.axes[LRAxis], // strafe
            !this.buttons[6] &&  this.buttons[0] * -this.axes[FBAxis], // pitch
            !this.buttons[6] && (this.buttons[3] ? -this.axes[throttleAxis] * !this.buttons[1] : this.directions[4]), // depth
            !this.buttons[6] && (this.buttons[1] * -this.axes[throttleAxis] * !this.buttons[3]), // manipulator
            !this.buttons[6] &&  this.buttons[10] * 1
        ];
        if (arrEquals(newVals, this.directions))
            return;

        this.emit('data', newVals);
        this.directions = newVals;
    }

};

if (require.main === module) {
    const mapper = new module.exports(17, 0.15);
    mapper.on('data', console.log);
}
