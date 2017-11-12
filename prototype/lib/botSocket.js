// Bobby Martin
// 2017

// native depensancies
const EventEmitter = require('events');
const net = require('net');

// local dependancies
const botProtocol = require('./botProtocol');

class botSocket extends EventEmitter {

    constructor() {
        super();
    }

    connect(options) {
        this.socket = new net.Socket();
        this.socket.connect(options);
        this.setUpListeners();
    }

    setUpListeners() {
        this.socket.on('connect', () => {
            console.log('connected');
        });
        this.socket.on('close', () => {
            console.log('closed');
        });
    }

    echo(data) {
        let token = new botProtocol.echoToken(data);
        this.socket.end(token.toString());
        this.socket.on('data', data => {
            this.emit('data', data);
        })
    }

}

module.exports = botSocket;
