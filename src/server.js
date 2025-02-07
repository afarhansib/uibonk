const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const path = require('path');
const fs = require('fs');
const { downloadBotRepo, installBotDependencies, startBotProcess } = require('./botManager');

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

const botProcesses = {};
const botStatuses = {};

const BOT_DIR = path.join(__dirname, '../bots'); // Directory for bot repositories
const LOG_DIR = path.join(__dirname, '../logs'); // Directory for bot logs

// Ensure directories exist
if (!fs.existsSync(BOT_DIR)) fs.mkdirSync(BOT_DIR);
if (!fs.existsSync(LOG_DIR)) fs.mkdirSync(LOG_DIR);

// Serve static files
app.use(express.static(path.join(__dirname, '../public')));

// API Endpoint: Get list of bots
app.get('/api/bots', (req, res) => {
    fs.readdir(BOT_DIR, (err, files) => {
        if (err) return res.status(500).json({ error: 'Failed to read bot directory' });

        const bots = files.map((file) => ({
            name: file,
            status: botStatuses[file] || 'Stopped',
        }));

        res.json(bots);
    });
});

// API Endpoint: Get logs for a specific bot
app.get('/api/logs/:botName', (req, res) => {
    const botName = req.params.botName;
    const logPath = path.join(LOG_DIR, `${botName}.log`);

    if (!fs.existsSync(logPath)) {
        return res.status(404).json({ error: 'Log not found' });
    }

    const logContent = fs.readFileSync(logPath, 'utf8');
    res.json({ botName, log: logContent });
});

// WebSocket Events
io.on('connection', (socket) => {
    console.log('Client connected');

    // Start a bot
    socket.on('startBot', async ({ botName }) => {
        try {
            const repoUrl = 'https://github.com/afarhansib/bonk'; // Default repository URL
            const botPath = await downloadBotRepo(repoUrl, botName);
            await installBotDependencies(botPath);

            if (botProcesses[botName]) {
                socket.emit('error', `Bot ${botName} is already running`);
                return;
            }

            botProcesses[botName] = startBotProcess(botPath, botName, socket);
            botStatuses[botName] = 'Running';
            socket.emit('botStarted', { name: botName });
        } catch (error) {
            socket.emit('error', `Failed to start bot: ${error.message}`);
        }
    });

    // Stop a bot
    socket.on('stopBot', ({ botName }) => {
        const botProcess = botProcesses[botName];
        if (!botProcess) {
            socket.emit('error', `Bot ${botName} is not running`);
            return;
        }

        botProcess.kill(); // Kill the bot process
        delete botProcesses[botName];
        botStatuses[botName] = 'Stopped';
        socket.emit('botStopped', { name: botName });
    });

    // Restart a bot
    socket.on('restartBot', async ({ botName }) => {
        socket.emit('stopBot', { botName }); // Stop the bot first
        setTimeout(() => {
            socket.emit('startBot', { botName }); // Start the bot again
        }, 1000); // Small delay to ensure the bot stops before restarting
    });

    // Send a command to a bot
    socket.on('sendCommand', ({ botName, command }) => {
        const botProcess = botProcesses[botName];
        if (!botProcess) {
            socket.emit('error', `Bot ${botName} is not running`);
            return;
        }

        botProcess.stdin.write(`${command}\n`); // Send the command to the bot's stdin
    });

    socket.on('disconnect', () => {
        console.log('Client disconnected');
    });
});

// Start the server
server.listen(3000, () => {
    console.log('Server running on port 3000');
});