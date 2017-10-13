// Bobby Martin
// 2017

const SerialPort = require('serialport');
const Readline = SerialPort.parsers.Readline;

// TODO: turn this into a module once we know it works

const baudRate = 19200;

// this works in theory but has not been tested
SerialPort.list().then((ports) => {
    // look through each COM port returned by SerialPort.list()
    for (let i = 0; i < ports.length; i++) {
        // if the port's manufacturer contains "Arduino"
        if (ports[i].manufacturer.indexOf('Arduino') !== -1)
        // return a new SerialPort object opened on that port
            return new SerialPort(ports[i].comName, {
                baudRate: baudRate
            });
    }
    // throw an error if we don't find the arduino
    throw 'Arduino not found';
}).then((port) => {
    const parser = port.pipe(new Readline());
    port.on('open', () => {
        console.log('HEYYY');
    });
    parser.on('data', (data) => {
        console.log(data);
    });
});
