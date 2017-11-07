// Bobby Martin
// 2017

// native depensancies
const EventEmitter = require('events');
const net = require('net');

class botSocket extends EventEmitter {

    constructor() {
        super();
    }

    connect(options) {
        this.socket = new net.Socket();
        this.socket.connect(options);
        this.socket.on('connect', () => {
            console.log('connected');
            this.socket.write('hey therre from botSocket')
        });
        this.socket.on('data', data => {
            console.log('data: ' + data);
        });
        this.socket.on('close', () => {
            console.log('closed');
        });
    }

}

module.exports = botSocket;