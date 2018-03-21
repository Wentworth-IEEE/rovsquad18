const logger = require('./');

const l1 = new logger('error');
l1.s('FUNK', 'DON\'T SHOW ME');

const l2 = new logger('info');
l2.i('BUNK', 'SDSKJFH PLEAS SHOW ME');

const l3 = new logger('silly', 'l3.log');
l3.e('all', 'PLEASE SHOW ALL OF US');
l3.w('all', 'PLEASE SHOW ALL OF US');
l3.i('all', 'PLEASE SHOW ALL OF US');
l3.v('all', 'PLEASE SHOW ALL OF US');
l3.d('all', 'PLEASE SHOW ALL OF US');
l3.s('all', 'PLEASE SHOW ALL OF US');