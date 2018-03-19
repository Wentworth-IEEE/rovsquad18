/**
 * botSocket.js
 * an API for talking to the robot
 *
 * Nugget Industries
 * 2017
 */

// native depensancies
const net = require('net');
const EventEmitter = require('events');

// local package dependancies
const logger = require('nugget-logger');
const botProtocol = require('botprotocol'),
    responseTypes = botProtocol.responseTypes;


// emitter is used to emit responses from the robot with the event type being the response's transactionID.
const emitter = new EventEmitter();

class botSocket extends EventEmitter {

    constructor() {
        super();
        // set up magData event listener
        // is this the right place to set this up? only time will tell...
        emitter.on(responseTypes.MAGDATA, data => {
            this.emit('magData', data.body);
        });
    }

    async connect(options) {
        // if we're busy connecting
        if (this._isConnecting) {
            logger.w('connection', 'still connecting');
            return;
        }
        // if the socket is already established resolve and do nothing
        if (this._isConnected) {
            logger.w('connection', 'already connected');
            return;
        }
        // moderately ghetto semaphore
        this._isConnecting = true;
        await new Promise((resolve, reject) => {
            logger.i('connection', `connecting to bot at ${options.host}:${options.port}`);

            // combination connection creation and connection listener :dab:
            this._socket = net.createConnection(options, () => {
                logger.i('connection', 'connected');
                resolve();
            });

            // let ya boy know when there's an error
            this._socket.on('error', error => {
                logger.e('connection error', error);
                reject(error);
            });

            // DATA TIME
            this._socket.on('data', data => {
                /*
                 * emit transactionID event with data as callback parameter
                 * sometimes data comes in all stuck together so we have to split it up
                 */
                data.toString().replace(/}{/g, '}|{').split('|').forEach(datum => {
                    datum = JSON.parse(datum);
                    emitter.emit(datum.headers.transactionID, datum);
                })
            });

            // // do this once per instance of this._socket on 'close'
            // this._socket.on('close', this.onClose);
        }).catch(error => logger.e('disconnection error', error));

        this._isConnecting = false;
        this._isConnected = true;
    }

    disconnect() {
        console.log(this._socket === undefined);
        if (!this._isConnected) {
            logger.w('disconnection', 'You\'re not even connected to anything');
            return;
        }
        this._socket.on('close', this.onClose);
        this._socket.end();
    }

    onClose(hadError) {
        if (hadError) logger.w('disconnection error', 'disconnected with error');
        else logger.i('disconnection', 'disconnected');

        this._isConnected = false;
        delete this._socket;
    }

    /**
     * Send some arbitrary data to the robot, expect the same arbitrary data in return
     *
     * @async
     * @param data - The arbitrary data to be echoed
     * @returns {Promise<*>} Resolves with the response from the robot
     */
    async echo(data) {
        const token = new botProtocol.echoToken(data);
        return await this.sendToken(token);
    }

    /**
     * Read the magnetometer values from the robot
     *
     * @async
     * @returns {Promise<*>} Resolves with magnetometer values in the following format:
     * {
     *    heading,
     *    pitch,
     *    roll
     * }
     */
    async readMag() {
        const token = new botProtocol.readMagToken();
        return await this.sendToken(token);
    }

    /**
     * Tell the robot to start streaming magnetometer data at a certain frequency
     *
     * @async
     * @param interval - The interval to stream at (time in ms between data being sent)
     * @returns {Promise<*>} Resolves when the robot ackgnowledges the request
     */
    async startMagStream(interval) {
        const token = new botProtocol.startMagStreamToken(interval);
        return await this.sendToken(token);
    }

    /**
     * Tell the robot to stop streaming magnetometer data
     *
     * @async
     * @returns {Promise<*>} Resolves when the robot ackgnowledges the request
     */
    async stopMagStream() {
        const token = new botProtocol.stopMagStreamToken();
        return await this.sendToken(token);
    }

    /**
     * Send controller data to the robot
     * This one isn't completely implemented yet
     *
     * @async
     * @param controllerData - The controller data
     * @returns {Promise<*>} Resolves when the robot ackgnowledges and processes the request
     */
    async sendControllerData(controllerData) {
        const token = new botProtocol.controllerDataToken(controllerData);
        return await this.sendToken(token);
    }

    /**
     * Send a token and wait for its unique response from the robot
     *
     * @param token - the token to be sent
     * @returns {Promise<*>}
     */
    sendToken(token) {
        return new Promise(resolve => {
            this._socket.write(token.stringify());
            emitter.once(token.headers.transactionID, data => {
                resolve(data.body);
            });
        });
    }

}

module.exports = botSocket;