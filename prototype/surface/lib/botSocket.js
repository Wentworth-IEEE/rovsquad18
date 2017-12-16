// Bobby Martin
// 2017

// native depensancies
const net = require('net');

// local package dependancies
const botProtocol = require('botprotocol');

// TODO: figure out a way to give each command a unique ID so command responses don't get all mangled maybe???

module.exports = class {

    async connect(options) {
        // if we're busy connecting
        if (this._isConnecting) {
            console.log('chill out I\'m working on it');
            return;
        }
        // if the socket is already established resolve and do nothing
        if (this._isConnected) {
            console.log('You\'re already connected you fuckin dope');
            return;
        }
        // moderately ghetto semaphore
        this._isConnecting = true;
        await new Promise((resolve, reject) => {
            console.log(`connecting to bot at ${options.host}:${options.port}`);

            // combination connection creation and connection listener :dab:
            this.socket = net.createConnection(options, () => {
                console.log('connected');
                resolve();
            });

            // do this once per instance of this.socket on 'close'
            this.socket.once('close', hadError => {
                if (hadError) console.log('closed with error');
                else console.log('closed');
                this._isConnected = false;
                delete this.socket;
            });

            // let ya boy know when there's an error
            this.socket.once('error', error => {
                console.error(error);
                reject(error);
            });
        }).catch(error => console.error(error));
        this._isConnecting = false;
        this._isConnected = true;
    }

    disconnect() {
        return new Promise(resolve => {
            // do nothing if we're not connected to anything
            if (!this._isConnected) {
                console.log('You\'re not even connected to anything');
                return resolve();
            }
            this.socket.end();
            this.socket.once('close', hadError => {
                resolve(hadError);
            });
        })
    }

    echo(data) {
        return new Promise(resolve => {
            let token = new botProtocol.echoToken(data);
            this.socket.write(token.stringify());
            this.socket.once('data', data => resolve(JSON.parse(data)))
        });
    }

    readMag() {
        return new Promise(resolve => {
            let token = new botProtocol.readMagToken();
            this.socket.write(token.stringify());
            this.socket.once('data', data => resolve(JSON.parse(data)))
        })
    }

};
