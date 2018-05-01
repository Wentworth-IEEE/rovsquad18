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
const defaultPiAddress = 'hardboilednugget.local';

const args = yargs
    .usage('Usage: $0 [options]')
    .version(false)
    .option('d', {
        alias: 'daemon-action',
        desc: 'command to use when restarting nugget daemon',
        choices: [
            'restart',
            'debug',
            'debugLogging'
        ],
        default: 'restart'
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

    if (args.local) return spawnRobotLocalDebug();

    await copyFilesToRobot(args);

    if (args.noRun) return Promise.resolve();

    return restartRobot(args);
}

const spawnRobotLocalDebug = () => new Promise(resolve => {
    // spawn the robot as a child process, resolve when the robot is done setting up.
    const botArgs = ['--local', '--debug', '--log-level', 'DEBUG'];
    console.log('Starting robot in local and debug mode');

    const forkOptions = {
        execArgv: ['--inspect=0.0.0.0:8779'],
        stdio: ['pipe', 'pipe', 'pipe', 'ipc']
    };
    const child = fork(__dirname + remotePackageLocation, botArgs, forkOptions).on('message', () => {
        console.log('Finished setting up robot in local and debug mode');
        resolve(child);
    });
});

const copyFilesToRobot = args => new Promise(resolve => {
    // copy files to robot, resolve when complete
    console.log('Copying files to robot');
    scp(__dirname + remotePackageLocation, {
        host: args.piAddress,
        username: 'root',
        password: 'spacenugget',
        path: piPath,
        readyTimeout: 99000
    }, error => {
        if (error) throw error;
        console.log('Finished copying files');
        resolve();
    })
});

const restartRobot = args => new Promise(resolve => {
    // restart nugget daemon, resolve when complete
    console.log('Restarting server remotely');
    remoteExec(args.piAddress, `systemctl restart nugget`, {
        username: 'root',
        password: 'spacenugget',
        readyTimeout: 99000
    }, error => {
        if (error) throw error;
        console.log(`Server Restarted in ${args.daemonAction} mode`);
        resolve();
    })
});

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
