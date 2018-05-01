const EventEmitter = require('events');
const gamepad = require('gamepad');

const arrEquals = (arr1, arr2) => !arr1.filter((elem, index) => elem !== arr2[index]).length;

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
            0, // man nip
            0  // LEDs
        ];

        gamepad.on('down', (id, num) => this.buttonDown(id, num));
        gamepad.on('up', (id, num) => this.buttonUp(id, num));
        gamepad.on('move', (id, num, val) => this.joystickMove(id, num, val));
        setInterval(() => this.checkValues(), interval);
    }

    buttonDown(id, num) {
        this.buttons[num] = true;
    }

    buttonUp(id, num) {
        this.buttons[num] = false;
    }

    joystickMove(id, axis, val) {
        if (Math.abs(val) < this.deadzone) {
            this.axes[axis] = 0;
            return;
        }

        this.axes[axis] = val;
    }

    checkValues() {
        const newVals = [
            -this.axes[0] * !this.buttons[0], // FB
             this.axes[1] * !this.buttons[1], // turn
             this.axes[1] *  this.buttons[1] * !this.buttons[0], // strafe
            -this.axes[0] *  this.buttons[0] * !this.buttons[1], // pitch
            -this.axes[5] *  this.buttons[3] * !this.buttons[2] || this.directions[4], // depth
            -this.axes[3], // man nips
            -this.axes[5] *  this.buttons[2] * !this.buttons[3] || this.directions[5]  // LEDs
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