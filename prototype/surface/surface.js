// Bobby Martin
// 2017

const SerialPort = require('serialport');

const baudRate = 696969; // TODO: Chris what the heck baud rate did you use I forget

// this works in theory but has not been tested
// TODO: maybe rework this with callbacks??
SerialPort.list()
    .then((ports) => {
        console.log(ports);
        // look through each COM port returned by SerialPort.list()
        for (let i = 0; i < ports.length; i++) {
            // if the port's manufacturer contains "Arduino"
            if (ports[i].manufacturer.indexOf('Arduino') !== -1)
                // return it for the next thing in the promise chain
                return ports[i].manufacturer;
        }
        throw 'Arduino not found';
    })
    .then((port) => {
        return new SerialPort(port, {
            baudRate: baudRate
        });
    });
