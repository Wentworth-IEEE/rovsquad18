// Bobby Martin
// 2017

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
        super('echo', body);
    }
};

module.exports.readMagToken = class extends token {
    constructor() {
        super('readMag', {});
    }
};

