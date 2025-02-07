const simpleGit = require('simple-git');
const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

const BOT_DIR = path.join(__dirname, '../bots');
const LOG_DIR = path.join(__dirname, '../logs');

// Ensure the logs directory exists
if (!fs.existsSync(LOG_DIR)) {
    fs.mkdirSync(LOG_DIR);
}

async function downloadBotRepo(repoUrl, botName) {
    const botPath = path.join(BOT_DIR, botName);

    if (fs.existsSync(botPath)) {
        console.log(`Bot ${botName} already exists at ${botPath}. Pulling latest changes...`);
        try {
            await simpleGit(botPath).pull();
            console.log(`Pulled latest changes for bot ${botName}`);
        } catch (error) {
            console.error(`Failed to pull latest changes for bot ${botName}: ${error.message}`);
        }
        return botPath;
    }

    console.log(`Cloning bot repository from ${repoUrl}`);
    await simpleGit().clone(repoUrl, botPath);

    console.log(`Bot repository cloned to ${botPath}`);
    return botPath;
}

function installBotDependencies(botPath) {
    return new Promise((resolve, reject) => {
        const npmCmd = process.platform === 'win32' ? 'npm.cmd' : 'npm';
        const child = spawn(npmCmd, ['install'], { cwd: botPath, shell: true });

        child.on('error', (err) => {
            console.error(`Failed to spawn npm: ${err.message}`);
            reject(err);
        });

        child.stdout.on('data', (data) => {
            console.log(`npm install stdout: ${data}`);
        });

        child.stderr.on('data', (data) => {
            console.error(`npm install stderr: ${data}`);
        });

        child.on('close', (code) => {
            if (code === 0) {
                console.log('Dependencies installed successfully');
                resolve();
            } else {
                reject(new Error(`npm install failed with code ${code}`));
            }
        });
    });
}

function startBotProcess(botPath, botName, socket) {
    const logOutput = (output) => {
        const logPath = path.join(LOG_DIR, `${botName}.log`);
        fs.appendFileSync(logPath, output); // Log output server-side
    };

    const bot = spawn('npm', ['start'], { cwd: botPath, shell: true });

    bot.stdout.on('data', (data) => {
        const output = data.toString();
        console.log(`botOutput: ${botName} - ${output}`);
        logOutput(output);
        socket.emit('botOutput', { name: botName, output });
    });

    bot.stderr.on('data', (data) => {
        const error = data.toString();
        logOutput(`[ERROR] ${error}`);
        socket.emit('botError', { name: botName, error });
    });

    bot.on('close', (code) => {
        console.log(`Bot process (${botName}) exited with code ${code}`);
        logOutput(`\nBot ${botName} closed\n`);
        socket.emit('botClosed', { name: botName });
    });

    return bot;
}

module.exports = { downloadBotRepo, installBotDependencies, startBotProcess };