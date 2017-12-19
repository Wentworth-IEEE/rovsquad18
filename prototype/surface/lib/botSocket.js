// Bobby Martin
// 2017

// native depensancies
const net = require('net');
const EventEmitter = require('events');

// local package dependancies
const botProtocol = require('botprotocol');

// global constants
const emitter = new EventEmitter();

module.exports = class {

    async connect(options) {
        // if we're busy connecting
        if (this._isConnecting) {
            console.log('still connecting');
            return;
        }
        // if the socket is already established resolve and do nothing
        if (this._isConnected) {
            console.log('already connected');
            return;
        }
        // moderately ghetto semaphore
        this._isConnecting = true;
        await new Promise((resolve, reject) => {
            console.log(`connecting to bot at ${options.host}:${options.port}`);

            // combination connection creation and connection listener :dab:
            this._socket = net.createConnection(options, () => {
                console.log('connected');
                resolve();
            });

            // let ya boy know when there's an error
            this._socket.once('error', error => {
                console.error(error);
                reject(error);
            });

            // DATA TIME
            this._socket.on('data', data => {
                // emit transactionID event with data as callback parameter
                data = JSON.parse(data);
                emitter.emit(data.headers.transactionID, data);
            });

            // do this once per instance of this._socket on 'close'
            this._socket.once('close', hadError => {
                if (hadError) console.log('disconnected with error');
                else console.log('disconnected');
                this._isConnected = false;
                delete this._socket;
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
            this._socket.end();
            this._socket.once('close', hadError => {
                resolve(hadError);
            });
        });
    }

    /**
     * send an echo token to the robot
     * resolve with response that has the same transactionID
     * @param data - data to be echoed
     * @returns {Promise}
     */
    echo(data) {
        return new Promise(resolve => {
            const token = new botProtocol.echoToken(data);
            this._socket.write(token.stringify());
            emitter.once(token.headers.transactionID, data => {
                resolve(data.body);
            });
        });
    }

    readMag() {
        return new Promise(resolve => {
            const token = new botProtocol.readMagToken();
            this._socket.write(token.stringify());
            emitter.once(token.headers.transactionID, data => {
                resolve(data.body);
            });
        });
    }

    // this is incomplete
    startMagStreaming(interval) {
        return new Promise(resolve => {
            const token = new botProtocol.startmagStreamToken(interval);
            this._socket.write(token.stringify());
            // TODO: https://trello.com/c/nXncpk9v
        })
    }

};
