/**
 * Nugget Industries
 * 2018
 *
 * testPCA.js
 * For testing the PCA by calling the 'consumeControllerData(data)' function
 */

let is_pca_init_flag = false;
const i2cBus = require("i2c-bus");
const Pca9685Driver = require("pca9685").Pca9685Driver;
const remote = require("./index.js");
var pwm; // giving this global scope

let sampleString = '{"joysticks":[0.090370,0.004444,0.010370,0.084444,0.042963,-0.007407],"buttons":[0]}';
let data = JSON.parse(sampleString);
console.log(data);

let argsString = '{"debug":false}';
let args = JSON.parse(argsString);

// Test function by calling it
consumeControllerData(data);

function initPCA() {
    console.log("Entered the 'initPCA' function.");
    if (is_pca_init_flag) {
        // If you're here, the PCA is already set up. Exit function.
        return;
    }
    // If the function hasn't already returned, there's setup to be done:

    // Options to setup the PCA with. These are the defaults, here if you need to change them.
    const options = {
        i2c: i2cBus.openSync(1),
        address: 0x40,
        frequency: 50,
        debug: false
    }
 
    pwm = new Pca9685Driver(options, function(err) {
        if (err) {
            console.error("OH GOD I DON'T KNOW WHERE THE PCA IS"); process.exit(-1);
        }
        console.log("Found PCA");
    });
    // If we've gotten here safely, it's time to flag the PCA as set up.
    is_pca_init_flag = true;
    console.log("Set PCA init flag to true");
}
 
function joystickMap(i) {
    return (i+1)/2;
}

function consumeControllerData(data) {
    console.log("Entered the 'consumeControllerData' function.");
    if (args.debug) {
        // do nothing if the server is running in debug mode
        const response = new responseToken({}, data.headers.transactionID);
        sendToken(response);
        return;
    }

    // If it's not in debug mode, it's time to actually move things!
    initPCA(); // initialize the PCA, if it isn't already initialized
    console.log("Doing control stuff now");
    for (var i = 0; i < 6; i++) {
        // Go through each PWM and do the appropriate action
        console.log("Setting PWM for "+i);
        pwm.setDutyCycle(i, joystickMap(data.joysticks[i]));
    }
}
