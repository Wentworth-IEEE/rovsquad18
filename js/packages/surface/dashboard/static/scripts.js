const socket = io.connect('http://localhost');
const imgDirectory = '/static/lib/indicators/img/';
let attitude, heading, motors;
// set up all the indicators
$(document).ready(() => {
    attitude = $.flightIndicator('#attitude', 'attitude', {
        size: 300,
        showBox: true,
        img_directory: imgDirectory
    });
    heading = $.flightIndicator('#heading', 'heading', {
        size: 300,
        showBox: true,
        img_directory: imgDirectory
    });
    motors = [ $('#LF'), $('#RF'), $('#LB'), $('#RB'), $('#F'), $('#B'), $('#MAN') ];
    // do some button listeners
    $('#connect').click(() => socket.emit('connectToBot'));
    $('#disconnect').click(() => socket.emit('disconnectFromBot'));
});
// ye olde socket listeners
socket.on('magData', data => {
    attitude.setPitch(data.pitch);
    attitude.setRoll(data.roll);
    heading.setHeading(data.heading)
});
socket.on('piTempData', data => $('#piTemp').val(data));
socket.on('motorData', data => {
    console.log(data);
    data.map((value, index) => motors[index].val((value - 1550) / 400))
});