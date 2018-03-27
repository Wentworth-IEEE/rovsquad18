/**
 * Nugget Industries
 * 2017
 *
 * COMMAND LINE ARGUMENTS:
 * -d | --debug:
 *   runs bot in debug mode
 * -l | --local:
 *   runs bot the bot and the surface station in local mode (should be run with debug mode)
 * --pi-address:
 *   specify an address
 * --start-surface:
 *   starts the surface station too
 */

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
const yargs = require('yargs');
const { scp } = require('scp2');
const remoteExec = require('remote-exec');

// look for the pi here!
const defaultPiAddress = 'spacenugget.local';

const args = yargs
    .usage('Usage: $0 [options]')
    .version(false)
    .option('d', {
        alias: 'debug',
        desc: 'use fake sensor values instead of real onez',
        type: 'boolean'
    })
    .option('l', {
        alias: 'local',
        desc: 'run the robot on localhost and tell the surface to look there too',
        type: 'boolean',
    })
    .option('P', {
        alias: 'pi-address',
        desc: 'connect to the robot at this address',
        type: 'string',
        default: defaultPiAddress,
        nargs: 1
    })
    .option('S', {
        alias: 'start-surface',
        desc: 'start the surface station too! (ya lazy bum)',
        type: 'boolean'
    })
    .option('N', {
        alias: 'no-run',
        desc: 'just copy the files, don\'t restart the nugget daemon on the pi',
        type: 'boolean'
    })
    .alias('h', 'help')
    .argv;

const piPath = '/opt/rov2017';

// HERE'S WHERE ALL OUR FILES DO
const remotePackageLocation = '/../remote';
const surfacePackageLocation = '/../surface';

async function setupRobot(args) {
    console.log('Starting robot setup');

    /*
     * if we're in debug mode, spawn botServer in debug mode
     * resolve when the server sends an IPC message
     */
    ////////////////
    // DEBUG MODE //
    ////////////////
    if (args.local) return new Promise(resolve => {
        const botArgs = ['--local', '--debug', '--logLevel', 'DEBUG'];
        console.log('Starting robot in local and debug mode');

        const forkOptions = {
            execArgv: ['--inspect'],
            stdio: ['pipe', 'pipe', 'pipe', 'ipc']
        };
        const child = fork(__dirname + remotePackageLocation, botArgs, forkOptions).on('message', () => {
            console.log('Finished setting up robot in local and debug mode');
            resolve(child);
        });
    });

    ////////////////////
    // NOT DEBUG MODE //
    ////////////////////
    console.log('Copying files to robot');
    // copy files to robot, resolve when complete
    const scpOptions = {
        host: args.piAddress,
        username: 'root',
        password: 'spacenugget',
        path: piPath,
        readyTimeout: 99000
    };
    // COPY
    await new Promise(resolve =>
        scp(__dirname + remotePackageLocation, scpOptions, error => {
            if (error) throw error;
            console.log('Finished copying files');
            resolve();
        })
    );

    // stop if noRun was specified
    if (args.noRun) return Promise.resolve();

    console.log('Starting server remotely');
    const remoteExecOptions = {
        username: 'root',
        password: 'spacenugget',
        readyTimeout: 99000
    };
    // RUN
    if (args.debug) {
        await new Promise(resolve =>
            // DO THE THING
            remoteExec(args.piAddress, 'service nugget debug', remoteExecOptions, error => {
                if (error) throw error;
                console.log('Server started in debug mode');
                resolve();
            })
        );
        return Promise.resolve();
    }
    await new Promise(resolve =>
        // DO THE THING
        remoteExec(args.piAddress, 'service nugget restart', remoteExecOptions, error => {
            if (error) throw error;
            console.log('Finished starting server remotely');
            resolve();
        })
    );
}

async function setupSurface(args) {
    // give it a start job
    const surfaceArgs = [];
    if (args.local) surfaceArgs.push('--local');
    if (args.piAddress) surfaceArgs.push(`--pi-address ${args.piAddress}`);
    fork(__dirname + surfacePackageLocation, surfaceArgs);
}

async function main() {
    await setupRobot(args);
    // start the surface station too if it's in the args
    if (args.startSurface) await setupSurface(args);
}

if (require.main === module)
    main().catch(error => console.error(error));

module.exports.setupRobot = setupRobot;
