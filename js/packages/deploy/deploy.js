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
const { fork } = require('child_process');

// package dependencies
const clp = require('clp');
const scp = require('scp2').scp;
const remoteExec = require('remote-exec');

// global constants
const argv = clp(process.argv);
const debug = argv['d'] || argv['debug'];
const startSurface = argv['s'] || argv['startSurface'];
const piAddress = clp['piAddress'] || 'spacenugget.local';

const piPath = '/opt/rov2017';

async function setupRobot(debug) {
    console.log('Starting robot setup');

    /*
     * if we're in debug mode, spawn botServer in debug mode
     * resolve when the server sends an IPC message
     */
    ////////////////
    // DEBUG MODE //
    ////////////////
    if (debug) return new Promise(resolve => {
        console.log('Setting up robot in debug mode');
        const botArgs = [
            '--debug'
        ];
        const forkOptions = {
            execArgv: ['--inspect'],
            stdio: ['pipe', 'pipe', 'pipe', 'ipc']
        };
        const child = fork(__dirname + '/../../remote/botServer.js', botArgs, forkOptions).on('message', () => {
            console.log('Finished setting up robot in debug mode');
            resolve(child)
        });
    });

    ////////////////////
    // NOT DEBUG MODE //
    ////////////////////
    // COPY
    await new Promise(resolve => {
        console.log('Copying files to robot');
        // copy files to robot, resolve when complete
        const scpOptions = {
            host: piAddress,
            username: 'root',
            password: 'spacenugget',
            path: piPath
        };
        // COPY
        scp(__dirname + '/../../remote', scpOptions, error => {
            if (error) throw error;
            console.log('Finished copying files');
            resolve();
        });
    });
    // RUN
    await new Promise(resolve => {
        console.log('Starting server remotely');
        const remoteExecOptions = {
            username: 'root',
            password: 'spacenugget'
        };
        // DO THE THING
        remoteExec(piAddress, `service nugget restart`, remoteExecOptions, error => {
            if (error) throw error;
            console.log('Finished starting server remotely');
            resolve();
        })
    })
}

async function setupSurface() {
    // give it a start job
    const surfaceArgs = debug ? [ '--local' ] : [];
    fork(__dirname + '/../../surface/ROV.js', surfaceArgs);
}

async function main() {
    await setupRobot(debug);
    // start the surface station too if it was specified
    if (startSurface) await setupSurface();
}

if (require.main === module)
    main().catch(error => console.error(error));

module.exports.setupRobot = setupRobot;
