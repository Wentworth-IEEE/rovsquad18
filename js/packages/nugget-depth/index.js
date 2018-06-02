const net = require('net');
const SLAVE_PORT = 8083;

module.exports = class {

    constructor() {
        this._socket = net.connect(SLAVE_PORT, 'localhost');
    }

    getDepth() {
        return new Promise((resolve, reject) => {
            this._socket.once('data', data => resolve(data.toString()));
            this._socket.write('D');
            setTimeout(reject, 1000);
        })
    }

    getPressure() {
        return new Promise((resolve, reject) => {
            this._socket.once('data', data => resolve(data.toString()));
            this._socket.write('P');
            setTimeout(reject, 1000);
        })
    }

};

if (require.main === module) {
    const depth = new module.exports();
    setInterval(async () => {
        console.log(await depth.getPressure());
    }, 1000);
}
