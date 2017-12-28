// Bobby Martin
// 2017

/*
 * YE OLDE MONOLITHIC DEPLOYMENT SCRIPT
 *
 * The idea here is to have one big script that installs dependancies for the robot,
 * copies everything in the 'remote' folder to the robot in an executeable place, and then
 * executes it.
 *
 * Time will tell if this should be split up into separate scripts or not.
 */

// native dependanciea
const { spawn, fork } = require('child_process');

// package dependencies
const clp = require('clp');

// global constants
const argv = clp(process.argv);
const debug = argv['d'] || argv['debug'];
const startSurface = argv['s'] || argv['startSurface'];

// FUCKING WINDOWS
const isWindows = /^win/.test(process.platform);
const cmd = isWindows ? 'npm.cmd' : 'npm';
const scp = isWindows ? 'pscp' : 'scp';

async function setupRobot(debug) {
    console.log('starting bot server');
    /*
     * if we're in debug mode, spawn botServer in debug mode
     * resolve when the server sends an IPC message
     * TODO:
     * this is done kind of weirdly
     * can we make it better?
     */
    if (debug) return new Promise(resolve => {
        const child = fork(__dirname + '/../../remote/botServer.js', ['--debug'], {
            execArgv: ['--inspect'],
            stdio: ['pipe', 'pipe', 'pipe', 'ipc']
        }).on('message', () => resolve(child));
    });

    // otherwise we'll do all the file copying and executing here
    await new Promise(resolve =>
        // copy files to robot, resolve when complete
        spawn(scp, [
            '-r',
            'remote/',
            'root@87.73.84.1:/opt/rov2017'
        ]).on('exit', resolve)
        // TODO: (blocked) start botServer on pi after copying [https://trello.com/c/kNBrK7R5]
    );
}

async function setupSurface() {
    // give it a start job
    fork(__dirname + '/../../surface/ROV.js');
}

async function main() {
    await setupRobot(debug);
    // start the surface station too if it was specified
    if (startSurface) await setupSurface();
}

// if __name__ == "__main__" type of thing
if (require.main === module)
    main().catch(error => console.error(error));

module.exports.setupRobot = setupRobot;
