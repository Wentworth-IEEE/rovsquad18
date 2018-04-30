/**
 * botSocket.js
 * an API for talking to the robot
 *
 * Nugget Industries
 * 2017
 */

// dependencies
const net = require('net');
const EventEmitter = require('events');
const { nugLog } = require('nugget-logger');
const botProtocol = require('botprotocol'), responseTypes = botProtocol.responseTypes;

// set up logger
const logger = new nugLog('debug', 'botSocket.log');

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
            const socket = net.createConnection(options, () => {
                logger.i('connection', 'connected');
                this._isConnecting = false;
                this._isConnected = true;
                resolve();
            });
            socket.on('error', error => {
                logger.e('connection error', error);
                reject(error);
            });

            socket.on('data', this._onData);
            socket.on('close', this._onClose.bind(this));

            this._socket = socket;

        }).catch(error =>
            logger.e('disconnection error', error)
        );
    }

    _onData(data) {
        /*
         * emit transactionID event with data as callback parameter
         * sometimes data comes in all stuck together so we have to split it up
         */
        data.toString().replace(/}{/g, '}|{').split('|').forEach(datum => {
            try {
                datum = JSON.parse(datum);
                emitter.emit(datum.headers.transactionID, datum);
            }
            catch (error) {
                console.error(error);
            }
        })
    }

    _onClose(hadError) {
        if (hadError)
            logger.w('disconnection', 'disconnected with error');
        else
            logger.i('disconnection', 'disconnected');

        this._isConnected = false;
        delete this._socket;
    }

    disconnect() {
        // do nothing if we're not connected to anything
        if (!this._isConnected) {
            logger.w('disconnection', 'You\'re not even connected to anything');
            return Promise.resolve();
        }
        return new Promise(resolve => {
            this._socket.end();
            this._socket.on('close', hadError => {
                resolve(hadError);
            });
        });
    }

    /**
     * Send some arbitrary data to the robot, expect the same arbitrary data in return
     *
     * @param data - The arbitrary data to be echoed
     * @returns {Promise<*>} Resolves with the response from the robot
     */
    echo(data) {
        const token = new botProtocol.echoToken(data);
        return this.sendToken(token);
    }

    /**
     * Read the magnetometer values from the robot
     *
     * @returns {Promise<*>} Resolves with magnetometer values in the following format:
     * {
     *    heading,
     *    pitch,
     *    roll
     * }
     */
    readMag() {
        const token = new botProtocol.readMagToken();
        return this.sendToken(token);
    }

    /**
     * Tell the robot to start streaming magnetometer data at a certain frequency
     *
     * @param interval - The interval to stream at (time in ms between data being sent)
     * @returns {Promise<*>} Resolves when the robot ackgnowledges the request
     */
    startMagStream(interval) {
        const token = new botProtocol.startMagStreamToken(interval);
        return this.sendToken(token);
    }

    /**
     * Tell the robot to stop streaming magnetometer data
     *
     * @returns {Promise<*>} Resolves when the robot ackgnowledges the request
     */
    stopMagStream() {
        const token = new botProtocol.stopMagStreamToken();
        return this.sendToken(token);
    }

    /**
     * Send controller data to the robot
     * This one isn't completely implemented robot-side yet
     *
     * @param data - YER DATA U BITCH
     * @returns {Promise<*>} Resolves when the robot ackgnowledges and processes the request
     */
    sendControllerData(data) {
        const token = new botProtocol.controllerDataToken(data);
        return this.sendToken(token);
    }

    sendLEDTestData(brightness) {
        const token = new botProtocol.LEDTestToken(brightness);
        return this.sendToken(token);
    }

    /**
     * Send a token and wait for its unique response from the robot
     *
     * @param token - the token to be sent
     * @returns {Promise<*>}
     */
    sendToken(token) {
        if (!this._isConnected) {
            logger.d('sendToken', 'YOU\'RE NOT CONNECTED YOU FUCKING BITCH');
            return Promise.resolve();
        }

        return new Promise(resolve => {
            logger.d('sendToken', `sending it: ${JSON.stringify(token)}`);
            this._socket.write(token.stringify());
            emitter.once(token.headers.transactionID, data => {
                resolve(data);
            });
        });
    }

}

module.exports = botSocket;
