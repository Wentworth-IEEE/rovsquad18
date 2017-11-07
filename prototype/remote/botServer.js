// Bobby Martin
// 2017

// native dependencies
const net = require('net');

// global constants
const address = '127.0.0.1';
const port = 8080;

// right now this is just gonna be s atupid server that will echo or something or some shit

const server = net.createServer();
server.listen({
    host: address,
    port: port,
    exclusive: true
});

server.on('listening', () => {
    console.log('server listening on port ' + port)
});

server.on('error', error => {
    console.error(error);
});

// connection logic
server.on('connection', client => {
    console.log('client connected');

    client.on('data', data => {
        client.write('Hey I got this: ' + data);
        client.destroy();
    });

    client.on('close', () => {
        console.log('client disconnected');
    })
});