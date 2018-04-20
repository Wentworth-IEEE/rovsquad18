const events = require('events');
const emitter = new events.EventEmitter();

const { nugLog, levels } = require('nugget-logger');
const logger = new nugLog('info', 'emit_data.log');

logger.i('info', 'Running');
let sampleString = '{"joysticks":[0.090370,0.004444,0.010370,0.084444,0.042963,-0.007407],"buttons":[0]}'
let data=JSON.parse(sampleString);
 
emitter.emit('data', data);

