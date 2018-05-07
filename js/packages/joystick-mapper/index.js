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
            0  // LEDs
        ];

        const controlMatrix = [
          //  A   1   2   3   4   5   B   1   2   3   4   5   6   7   8   9   10  11
            [-1,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0 ],
            [ 0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0 ],
            [ 0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0 ],
            [ 0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0 ],
            [ 0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0 ]
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
            !this.buttons[6] && !this.buttons[0] * -this.axes[0], // FB
            !this.buttons[6] &&  this.axes[4], // turn
            !this.buttons[6] &&  this.axes[1], // strafe
            !this.buttons[6] &&  this.buttons[0] * -this.axes[0], // pitch
            !this.buttons[6] && (this.buttons[3] ? -this.axes[5] * !this.buttons[2] : this.directions[4]), // depth
            !this.buttons[6] && (this.buttons[2] ? -this.axes[5] * !this.buttons[3] : this.directions[5]), // LEDs
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