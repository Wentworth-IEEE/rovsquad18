// Bobby Martin
// 2017

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
module.exports.tokenTypes = tokenTypes;

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
module.exports.responseToken = class extends token {
    constructor(body, transactionID) {
        super(tokenTypes.RESPONSE, body, transactionID);
    }
};

// EVERYTHING ELSE
module.exports.echoToken = class extends token {
    constructor(body) {
        super(tokenTypes.ECHO, body);
    }
};

module.exports.readMagToken = class extends token {
    constructor() {
        super(tokenTypes.READMAG, {});
    }
};

module.exports.startmagStreamToken = class extends token {
    constructor(interval) {
        super(tokenTypes.STARTMAGSTREAM, { interval: interval });
    }
};

module.exports.startmagStreamToken = class extends token {
    constructor() {
        super(tokenTypes.STOPMAGSTREAM, {});
    }
};