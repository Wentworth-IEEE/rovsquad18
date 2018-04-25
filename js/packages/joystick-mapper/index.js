const EventEmitter = require('events');

module.exports = class extends EventEmitter {

    /*
     * Buttons that do shit:
     * 0, 1
     */

    constructor() {

        super();

        this.axes = [0, 0, 0, 0, 0, 0];
        this.buttons = [false, false, false, false, false, false, false, false, false, false, false, false];

        this.FB = this.axes[0] * !this.buttons[0];
        this.turn = this.axes[1] * !this.buttons[1];
        this.pitch = this.axes[0] * this.buttons[0];
        this.strafe = this.axes[1] * this.buttons[0] * !this.buttons[1];
        this.depth = this.axes [0] * this.buttons[0] * this.buttons[1]

    }

    buttonUp(num) {
        this.buttons[num] = false;
    }

    buttonDown(num) {
        this.buttons[num] = true;
    }

    updateAxis(axis, val) {
        this.axes[axis] = val;
    }

};