const socket = io.connect('http://localhost');
const imgDirectory = '/static/lib/indicators/img/';
let attitude, heading;
// set up all the indicators
$(document).ready(() => {
    attitude = $.flightIndicator('#attitude', 'attitude', {
        size: 300,
        showBox: false,
        img_directory: imgDirectory
    });
    heading = $.flightIndicator('#heading', 'heading', {
        size: 300,
        showBox: false,
        img_directory: imgDirectory
    });

    // do some button listeners
    $('#disconnect').click(() => {
        socket.emit('disconnectFromBot');
        console.log('fiuck');
    });
});
// ye olde socket listeners
socket.on('readMag', data => {
    console.log(data);
    attitude.setPitch(data.pitch);
    attitude.setRoll(data.roll);
    heading.setHeading(data.heading)
});