const fs = require('fs');

const levels = [
    'ERROR',
    'WARN',
    'INFO',
    'VERBOSE',
    'DEBUG',
    'SILLY'
];

class logger {

    /**
     * @param level - name (not index) of the level for this logger to be
     * @param logFilePath - file name/path for file to write logs to
     * @param callback - a callback function for more readable code on initialization
     */
    constructor(level, logFilePath = '', callback) {
        // make sure the level is between 0 and 5
        level = levels.indexOf(level.toUpperCase());
        if (level < 0 || level > levels.length - 1)
            throw 'level must be between 0 and 5 inclusive';

        // this.level is set to a number instead of the actual name of the level
        // the number is the index of the level name in `levels`
        this.level = level;

        this.logFile = logFilePath
            ? fs.createWriteStream(logFilePath, { flags: 'a' })
            : this.logFile = {
                write: () => {}
            };

        // callback();
    }

    print(label, message, level) {
        // don't log anything above the level we specified in the constructor
        if (level > this.level)
            return;

        const logMessage = `${new Date().toISOString()} ${levels[level]} [${label}] ${message}`;
        console.log(logMessage);
        this.logFile.write(logMessage + '\n');
    }

    e(label, message) { this.print(label, message, 0) };
    w(label, message) { this.print(label, message, 1) };
    i(label, message) { this.print(label, message, 2) };
    v(label, message) { this.print(label, message, 3) };
    d(label, message) { this.print(label, message, 4) };
    s(label, message) { this.print(label, message, 5) };

}

module.exports.nugLog = logger;
module.exports.levels = levels;
