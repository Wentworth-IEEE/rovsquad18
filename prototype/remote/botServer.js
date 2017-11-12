// Bobby Martin
// 2017

// native dependencies
const net = require('net');
const EventEmitter = require('events');

// global constants
const address = '127.0.0.1';
const port = 8080;
const emitter = new EventEmitter();

// begin server logic & listener shit

const server = net.createServer();
server.listen({
    host: address,
    port: port,
    exclusive: true
});

// listening listener (heh)
server.on('listening', () => {
    console.log('server listening on port ' + port)
});

// error listener
server.on('error', error => {
    console.error(error);
});

// connection logic
server.on('connection', client => {
    console.log('client connected');

    client.on('data', data => {
        data = JSON.parse(data);
        console.log('Hey I got this: ' + JSON.stringify(data));
        emitter.emit(data.type, data.body, client);
    });

    client.on('close', () => {
        console.log('client disconnected');
    })
});

/*
 * EMITTER LOGIC
 *
 * Instead of having a big disgusting switch statement to handle commands
 * like last year, we're using an event emitter now.
 *
 * When this server gets data from the client, it will presumably be in
 * the form of a stringified botProtocol token. botProtocol tokens have
 * 'type' and 'body' keys. When the server gets one of these tokens, the
 * 'emitter' will emit an event with the token's 'type' as the event name
 * and with the token's body and the client object as callback parameters.
 *
 * example:
 * The server recieves the following token:
 * {
 *   type: "echo",
 *   body: "hello from the client"
 * }
 * It will then use the 'emitter' object to emit an 'echo' event with
 * "hello from the client" as the first callback parameter
 *
 * What I maight eventually like to do is make the client global so we only
 * have to pass the body
 */
emitter.on('echo', (body, client) => {
    client.write(body);
});
