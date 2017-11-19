// TODO: socket.io client stuff goes here
const socket = io.connect('http://localhost');
socket.on('fun', () => {
    console.log('WE\'RE HAVING SO MUCH FUN');
    socket.emit('noMoreFun');
});
