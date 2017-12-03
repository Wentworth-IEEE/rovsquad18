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
const cmd = /^win/.test(process.platform) ? 'npm.cmd' : 'npm';
const scp = /^win/.test(process.platform) ? 'pscp' : 'scp';

async function main() {

    // npm install in the remote directory
    await new Promise(resolve => {
        const remoteInstall = spawn(cmd, ['install'], {
            cwd: './remote',
            stdio: 'inherit'
        });
        remoteInstall.once('exit', () => resolve())
    });

    console.log('starting bot server');
    if (debug)
        // if we're in debug mode, spawn botServer in debug mode
        fork('./remote/botServer.js', ['--debug']);
    else
        // otherwise we'll do all the file copying and executing here
        await new Promise(resolve => {
            const remoteCopy = spawn(scp, [
                '-r',
                'remote/',
                'root@87.73.84.1:/opt/rov2017'
            ], { stdio: 'inherit' });
            remoteCopy.on('exit', () => resolve());
        });

    ///////////////////////
    // LOGICAL DELIMITER //
    ///////////////////////

    // start the surface station too if it was specified
    if (startSurface) {
        // npm install in the surface directory
        await new Promise(resolve => {
            const surfaceInstall = spawn(cmd, ['install'], {
                cwd: './surface',
                stdio: 'inherit'
            });
            surfaceInstall.once('exit', () => resolve())
        });
        // give it a start job
        fork('surface/ROV.js');
    }
}

main().catch(error => console.error(error));
