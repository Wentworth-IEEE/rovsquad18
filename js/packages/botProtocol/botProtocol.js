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
export const tokenTypes = {
    RESPONSE: 'response',
    ECHO: 'echo',
    READMAG: 'readMag',
    STARTMAGSTREAM: 'startMagStream',
    STOPMAGSTREAM: 'stopMagStream',
    CONTROLLERDATA: 'controllerData',
    READPITEMP: 'readPiTemp',
    STARTPITEMPSTREAM: 'startPiTempStream',
    STOPPITEMPSTREAM: 'stopPiTempStream',
    LEDTEST: 'LEDTest'
};
export const responseTypes = {
    MAGDATA: 'magData'
};

// all tokens should extend this class
class token {
    constructor(type, body = undefined, transactionID = uuidv1()) {
        this.type = type;
        this.headers = {
            transactionID: transactionID // so we can keep track of this mothafucka
        };
        if (body) this.body = body;
    }

    stringify() {
        return JSON.stringify(this);
    }
}

// RESPONSE TOKEN
export class responseToken extends token {
    constructor(body, transactionID) {
        super(tokenTypes.RESPONSE, body, transactionID);
    }
}

// ECHO TOKEN
export class echoToken extends token {
    constructor(body) {
        super(tokenTypes.ECHO, body);
    }
}

// READ MAG TOKEN
export class readMagToken extends token {
    constructor() {
        super(tokenTypes.READMAG);
    }
}

// START MAG STREAM TOKEN
export class startMagStreamToken extends token {
    constructor(interval) {
        // TODO there's no need for an object here, just send the interval as the only thing in the body
        super(tokenTypes.STARTMAGSTREAM, { interval: interval });
    }
}

// STOP MAG STREAM TOKEN
export class stopMagStreamToken extends token {
    constructor() {
        super(tokenTypes.STOPMAGSTREAM);
    }
}

// CONTROLLER DATA TOKEN
export class controllerDataToken extends token {
    constructor(data) {
        super(tokenTypes.CONTROLLERDATA, data);
    }
}

// READ PI TEMP TOKEN
export class readPiTempToken extends token {
    constructor() {
        super(tokenTypes.READPITEMP);
    }
}

export class startPiTempStreamToken extends token {
    constructor(interval) {
        super(tokenTypes.STARTPITEMPSTREAM, interval);
    }
}

export class stopPiTempStreamToken extends token {
    constructor() {
        super(tokenTypes.STOPPITEMPSTREAM);
    }
}

export class LEDTestToken extends token {
    constructor(brightness) {
        super(tokenTypes.LEDTEST, brightness);
    }
}