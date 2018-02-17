/**
 * botProtocol.js
 * contains all the tokens for surface <-> robot communication
 *
 * Nugget Industries
 * 2017
 */

// package dependancies
const uuidv1 = require('uuid/v1');

// ye olde ghetto JS enum
const tokenTypes = {
    RESPONSE: 'response',
    ECHO: 'echo',
    READMAG: 'readMag',
    STARTMAGSTREAM: 'startMagStream',
    STOPMAGSTREAM: 'stopMagStream',
    CONTROLLERDATA: 'controllerData'
};
const responseTypes = {
    MAGDATA: 'magData'
};

// all tokens should extend this class
class token {
    constructor(type, body, transactionID = uuidv1()) {
        this.type = type;
        this.headers = {
            transactionID: transactionID // so we can keep track of this mothafucka
        };
        this.body = body;
    }

    stringify() {
        return JSON.stringify(this);
    }
}

// RESPONSE TOKEN
class responseToken extends token {
    constructor(body, transactionID) {
        super(tokenTypes.RESPONSE, body, transactionID);
    }
}

// ECHO TOKEN
class echoToken extends token {
    constructor(body) {
        super(tokenTypes.ECHO, body);
    }
}

// READ MAG TOKEN
class readMagToken extends token {
    constructor() {
        super(tokenTypes.READMAG, {});
    }
}

// START MAG STREAM TOKEN
class startMagStreamToken extends token {
    constructor(interval) {
        super(tokenTypes.STARTMAGSTREAM, { interval: interval });
    }
}

// STOP MAG STREAM TOKEN
class stopMagStreamToken extends token {
    constructor() {
        super(tokenTypes.STOPMAGSTREAM, {});
    }
}

// CONTROLLER DATA TOKEN
/*
 * {
 *   axes: []
 *   buttons: []
 * }
 */
class controllerDataToken extends token {
    constructor(controllerData) {
        super(tokenTypes.STOPMAGSTREAM, controllerData);
    }
}

module.exports = {
    tokenTypes: tokenTypes,
    responseTypes: responseTypes,
    // actual tokens
    responseToken: responseToken,
    echoToken: echoToken,
    readMagToken: readMagToken,
    startMagStreamToken: startMagStreamToken,
    stopMagStreamToken: stopMagStreamToken,
    controllerDataToken: controllerDataToken
};