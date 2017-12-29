/**
 * botProtocol.js
 * contains all the tokens for surface <-> robot communication
 *
 * Bobby Martin
 * 2017
 */

// package dependancies
const uuidv1 = require('uuid/v1');

// ye olde ghetto JS enum
// if I wasn't a fucking idiot I'd have started writing this whole project in
const tokenTypes = {
    RESPONSE: 'response',
    ECHO: 'echo',
    READMAG: 'readMag',
    STARTMAGSTREAM: 'startMagStream',
    STOPMAGSTREAM: 'stopMagStream'
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

// EVERYTHING ELSE
class echoToken extends token {
    constructor(body) {
        super(tokenTypes.ECHO, body);
    }
}

class readMagToken extends token {
    constructor() {
        super(tokenTypes.READMAG, {});
    }
}

class startMagStreamToken extends token {
    constructor(interval) {
        super(tokenTypes.STARTMAGSTREAM, { interval: interval });
    }
}

class stopMagStreamToken extends token {
    constructor() {
        super(tokenTypes.STOPMAGSTREAM, {});
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
    stopMagStreamToken: stopMagStreamToken
};