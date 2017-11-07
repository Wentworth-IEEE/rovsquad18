// Bobby Martin
// 2017

// native dependencies
const EventEmitter = require('events');

// package dependencies
const SerialPort = require('serialport');
const Readline = SerialPort.parsers.Readline;

const baudRate = 19200;

// yay!
class controller extends EventEmitter {

    constructor() {
        super();
    }

    async init() {
        const list = await SerialPort.list();
        // look through each COM port returned by SerialPort.list()
        for (let i = 0; i < list.length; i++) {
            // if the port's manufacturer contains "Arduino"
            if (list[i].manufacturer.indexOf('Arduino') !== -1) {
                // return a new SerialPort object opened on that port
                this.port = new SerialPort(list[i].comName, {
                    baudRate: baudRate
                });
                this.setUpListeners();
                return this;
            }
        }
        // throw an error if we don't find the arduino
        throw 'Arduino not found';
    }

    setUpListeners() {
        // this gathers our data into nice lines
        this.parser = this.port.pipe(new Readline());
        // listeners
        this.parser.on('data', data => {
            this.emit('data', data);
        });
        this.port.on('open', () => {
            this.emit('open');
        });
    }

}

module.exports = controller;
