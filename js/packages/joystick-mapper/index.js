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
let setDepthButton;
let unsetDepthButton;
let controller2RightTrigger;
let controller2LeftTrigger;
let rightThumbUD;

if (win) {
    FBAxis = 0;
    LRAxis = 1;
    dickspinAxis = 4;
    smolLeftRightAxis = 2;
    smolUpDownAxis = 3;
    throttleAxis = 5;
    setDepthButton = 9;
    unsetDepthButton = 8;
}
else {
    FBAxis = 1;
    LRAxis = 0;
    dickspinAxis = 2;
    smolLeftRightAxis = 4;
    smolUpDownAxis = 5;
    throttleAxis = 3;
    setDepthButton = 5;
    unsetDepthButton = 4;
    controller2RightTrigger = 5;
    controller2LeftTrigger = 2;
    rightThumbUD = 4;
}

gamepad.init();
setInterval(gamepad.processEvents, 17);
setInterval(gamepad.detectDevices, 500);

module.exports = class extends EventEmitter {

    constructor(interval, deadzone = 0.15) {
        super();
        this.deadzone = deadzone;

        this.axes = [
            [0, 0, 0, 0, 0, 0],
            [0, 0, 0, 0, 0, 0]
        ];
        this.axes[1][controller2RightTrigger] = -1;
        this.axes[1][controller2LeftTrigger] = -1
        this.buttons = [false, false, false, false, false, false, false, false, false, false, false, false];

        this.directions = [
            0, // forward/backward
            0, // turn (yaw)
            0, // strafe
            0, // pitch
            0, // depth
            0, // manipulator
            0, // leveler
            0  // picam servo
        ];

        gamepad.on('down', (id, num) => this.buttonDown(id, num));
        gamepad.on('up', (id, num) => this.buttonUp(id, num));
        gamepad.on('move', (id, num, val) => this.joystickMove(id, num, val));
        setInterval(() => this.checkValues(), interval);
    }

    buttonDown(id, num) {
        this.buttons[num] = true;
        this.emit('rawData', this.buttons);
        if (id === 1 && num === setDepthButton)
            this.emit('setDepthLock', true);
        if (id === 1 && num === unsetDepthButton)
            this.emit('setDepthLock', false);
    }

    buttonUp(id, num) {
        this.buttons[num] = false;
        this.emit('rawData', this.buttons);
    }

    joystickMove(id, axis, val) {
        if (Math.abs(val) < this.deadzone) {
            this.axes[id][axis] = 0;
            return;
        }

        this.axes[id][axis] = val;
        this.emit('rawData', this.axes);
    }

    checkValues() {
        const newVals = [
            !this.buttons[6] && !this.buttons[0] * -this.axes[0][FBAxis], // FB
            !this.buttons[6] &&  this.axes[0][dickspinAxis], // turn
            !this.buttons[6] &&  this.axes[0][LRAxis], // strafe
            !this.buttons[6] &&  this.axes[1][rightThumbUD], // pitch
            !this.buttons[6] && (this.axes[1][controller2LeftTrigger] - this.axes[1][controller2RightTrigger]) / 2, // depth
            !this.buttons[6] && (this.buttons[1] * -this.axes[0][throttleAxis] * !this.buttons[3]), // manipulator
            !this.buttons[6] &&  this.buttons[10] * 1, // leveler
             this.buttons[2] ?  -this.axes[0][throttleAxis] : this.directions[7] // picam
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
