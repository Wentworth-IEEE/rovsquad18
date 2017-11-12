// Bobby Martin
// 2017

// all tokens should extend this class
class token {
    constructor(type, body) {
        this.type = type;
        this.body = body;
    }

    toString() {
        return JSON.stringify(this);
    }
}

class echoToken extends token {
    constructor(body) {
        super('echo', body);
    }
}

module.exports.echoToken = echoToken;
