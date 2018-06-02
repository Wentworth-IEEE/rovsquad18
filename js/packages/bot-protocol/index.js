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
    CONTROLLERDATA: 'controllerData',
    READPITEMP: 'readPiTemp',
    STARTPITEMPSTREAM: 'startPiTempStream',
    STOPPITEMPSTREAM: 'stopPiTempStream',
    SETDEPTHLOCK: 'setDepthLock',
    LEDTEST: 'LEDTest'
};
exports.tokenTypes = tokenTypes;
exports.responseTypes = {
    MAGDATA: 'magData',
    PITEMPDATA: 'piTempData'
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
exports.responseToken = class extends token {
    constructor(body, transactionID) {
        super(tokenTypes.RESPONSE, body, transactionID);
    }
};

// ECHO TOKEN
exports.echoToken = class extends token {
    constructor(body) {
        super(tokenTypes.ECHO, body);
    }
};

// READ MAG TOKEN
exports.readMagToken = class extends token {
    constructor() {
        super(tokenTypes.READMAG);
    }
};

// START MAG STREAM TOKEN
exports.startMagStreamToken = class extends token {
    constructor(interval) {
        // TODO there's no need for an object here, just send the interval as the only thing in the body
        super(tokenTypes.STARTMAGSTREAM, { interval: interval });
    }
};

// STOP MAG STREAM TOKEN
exports.stopMagStreamToken = class extends token {
    constructor() {
        super(tokenTypes.STOPMAGSTREAM);
    }
};

// CONTROLLER DATA TOKEN
exports.controllerDataToken = class extends token {
    constructor(data) {
        super(tokenTypes.CONTROLLERDATA, data);
    }
};

// READ PI TEMP TOKEN
exports.readPiTempToken = class extends token {
    constructor() {
        super(tokenTypes.READPITEMP);
    }
};

exports.startPiTempStreamToken = class extends token {
    constructor(interval) {
        super(tokenTypes.STARTPITEMPSTREAM, interval);
    }
};

exports.stopPiTempStreamToken = class extends token {
    constructor() {
        super(tokenTypes.STOPPITEMPSTREAM);
    }
};

exports.setDepthLockToken = class extends token {
    constructor(value) {
        super(tokenTypes.SETDEPTHLOCK, value);
    }
};

exports.LEDTestToken = class extends token {
    constructor(brightness) {
        super(tokenTypes.LEDTEST, brightness);
    }
};
