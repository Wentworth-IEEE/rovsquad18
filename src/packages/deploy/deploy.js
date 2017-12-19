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

async function setupRobot() {
    // npm install in the remote directory
    await new Promise(resolve => {
        const npmInstallBot = spawn(cmd, ['install'], {
            cwd: './remote',
            stdio: 'inherit'
        });
        npmInstallBot.once('exit', () => resolve())
    });

    console.log('starting bot server');
    // if we're in debug mode, spawn botServer in debug mode
    if (debug) return fork('./remote/botServer.js', ['--debug'], {
        execArgv: ['--inspect'],
        silent: true
    });

    // otherwise we'll do all the file copying and executing here
    await new Promise(resolve => {
        // copy files to robot, resolve when complete
        const remoteCopy = spawn(scp, [
            '-r',
            'remote/',
            'root@87.73.84.1:/opt/rov2017'
        ]);
        remoteCopy.on('exit', () => resolve());
    });
}

async function setupSurface() {
    // npm install in the surface directory
    await new Promise(resolve => {
        const npmInstallSurface = spawn(cmd, ['install'], {
            cwd: './surface',
            stdio: 'inherit'
        });
        npmInstallSurface.once('exit', () => resolve())
    });
    // give it a start job
    fork('surface/ROV.js');
}

async function main() {
    await setupRobot();
    // start the surface station too if it was specified
    if (startSurface) await setupSurface();
}

main().catch(error => console.error(error));
