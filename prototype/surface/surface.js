// Bobby Martin
// 2017

const SerialPort = require('serialport');
const Readline = SerialPort.parsers.Readline;

// TODO: turn this into a class/module once we know it works

const baudRate = 696969; // TODO: Chris what the heck baud rate did you use I forget

let port;
// this works in theory but has not been tested
SerialPort.list()
    .then((ports) => {
        console.log(ports);
        // look through each COM port returned by SerialPort.list()
        for (let i = 0; i < ports.length; i++) {
            // if the port's manufacturer contains "Arduino"
            if (ports[i].manufacturer.indexOf('Arduino') !== -1)
                // return a new SerialPort object opened on that port
                port = new SerialPort(ports[i].comName, {
                    baudRate: baudRate
                });
        }
        throw 'Arduino not found';
    })
    .then(() => {
        const parser = new Readline();
        parser.pipe(port);
        // set up our listeners
        port.on('open', () => {
            console.log('Serial port opened!');
        });
        port.on('close', () => {
            console.log('Serial port closed');
        });
        parser.on('data', (data) => {
            console.log('Data: ', data)
        });
    });
