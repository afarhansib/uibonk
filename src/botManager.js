const simpleGit = require('simple-git');
const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

const BOT_DIR = process.env.BOT_DIR || './bots';

// Ensure the bots directory exists
if (!fs.existsSync(BOT_DIR)) {
    fs.mkdirSync(BOT_DIR);
}

async function downloadBotRepo(repoUrl, botName) {
    const botPath = path.join(BOT_DIR, botName);

    if (fs.existsSync(botPath)) {
        console.log(`Bot ${botName} already exists at ${botPath}`);
        return botPath;
    }

    console.log(`Cloning bot repository from ${repoUrl}`);
    await simpleGit().clone(repoUrl, botPath);

    console.log(`Bot repository cloned to ${botPath}`);
    return botPath;
}

function installBotDependencies(botPath) {
    return new Promise((resolve, reject) => {
        console.log(`Installing dependencies for bot at ${botPath}`);
        const child = spawn('npm', ['install'], { cwd: botPath });

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

module.exports = { downloadBotRepo, installBotDependencies };