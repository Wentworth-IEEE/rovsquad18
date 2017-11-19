// Bobby Martin
// 2017

// native depensancies
const net = require('net');

// local dependancies
const botProtocol = require('./botProtocol');

// TODO: figure out a way to give each command a unique ID so command responses don't get all mangled

module.exports = class {

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
        return new Promise(resolve => {
            let token = new botProtocol.echoToken(data);
            this.socket.write(token.toString());
            this.socket.on('data', data => {
                resolve(data);
            })
        });
    }

    readMag() {
        return new Promise(resolve => {
            let token = new botProtocol.readMagToken();
            this.socket.write(token.toString());
            this.socket.on('data', data => {
                resolve(data);
            })
        })
    }

}
