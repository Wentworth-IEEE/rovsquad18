// Bobby Martin
// 2017

module.exports.commands = {
    ECHO: 'echo',
    READMAG: 'readMag',
    STARTMAGSTREAM: 'startMagStream',
    STOPMAGSTREAM: 'stopMagStream'
};

// all tokens should extend this class
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
        super(commands.ECHO, body);
    }
};

module.exports.readMagToken = class extends token {
    constructor() {
        super(commands.READMAG, {});
    }
};

module.exports.startmagStreamToken = class extends token {
    constructor() {
        super(commands.STARTMAGSTREAM, {})
    }
};

module.exports.startmagStreamToken = class extends token {
    constructor() {
        super(commands.STOPMAGSTREAM, {})
    }
};