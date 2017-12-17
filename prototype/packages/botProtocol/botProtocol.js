// Bobby Martin
// 2017

const tokenTypes = {
    ECHO: 'echo',
    READMAG: 'readMag',
    STARTMAGSTREAM: 'startMagStream',
    STOPMAGSTREAM: 'stopMagStream'
};
module.exports.tokenTypes = tokenTypes;

// all tokenTypes should extend this class
class token {
    constructor(type, body) {
        this.type = type;
        this.body = body;
    }

    stringify() {
        return JSON.stringify(this);
    }
}

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
    constructor() {
        super(tokenTypes.STARTMAGSTREAM, {})
    }
};

module.exports.startmagStreamToken = class extends token {
    constructor() {
        super(tokenTypes.STOPMAGSTREAM, {})
    }
};