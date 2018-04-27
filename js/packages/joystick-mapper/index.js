const EventEmitter = require('events');
const gamepad = require('gamepad');

module.exports = class extends EventEmitter {

    /*
     * Buttons that do shit:
     * 0, 1
     */

    constructor() {

        super();

        this.axes = [0, 0, 0, 0, 0, 0];
        this.buttons = [false, false, false, false, false, false, false, false, false, false, false, false];

        this.directions = [0, 0, 0, 0, 0];

    }

    buttonUp(id, num) {
        this.buttons[num] = false;
        this.updateDirections();
    }

    buttonDown(id, num) {
        this.buttons[num] = true;
        this.updateDirections()
    }

    joystickMove(id, axis, val) {
        this.axes[axis] = val;
        this.updateDirections()
    }

    updateDirections() {
        const newVals = [
            -this.axes[0] * !this.buttons[0], // FB
             this.axes[1] * !this.buttons[1], // turn
            -this.axes[0] *  this.buttons[0] * !this.buttons[1], // pitch
             this.axes[1] *  this.buttons[1] * !this.buttons[0], // strafe
            -this.axes[0] *  this.buttons[0] *  this.buttons[1]  // depth
        ];

        newVals.map((element, index) => {
            // do nothing if this direction didn't change
            if (element === this.directions[index])
                return;

            this.directions[index] = element;
            this.emit('data', index, element);
        });
    }

};

if (require.main === module) {
    gamepad.init();
    setInterval(gamepad.processEvents, 10);

    const mapper = new module.exports();

    gamepad.on('move', (id, axis, value) => mapper.joystickMove(axis, value));
    gamepad.on('up', (id, num) => mapper.buttonUp(num));
    gamepad.on('down', (id, num) => mapper.buttonDown(num));

    mapper.on('data', console.log);
}