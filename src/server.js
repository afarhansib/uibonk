const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const path = require('path');
const { downloadBotRepo, installBotDependencies } = require('./botManager');

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

// Serve static files
app.use(express.static(path.join(__dirname, '../public')));

// Store bot instances
const bots = {};

io.on('connection', (socket) => {
    console.log('Client connected');

    // Start a bot
    socket.on('startBot', async ({ repoUrl, botName }) => {
        try {
            const botPath = await downloadBotRepo(repoUrl, botName);
            await installBotDependencies(botPath);

            const bot = spawn('node', ['bot.js'], { cwd: botPath });
            bots[botName] = bot;

            bot.stdout.on('data', (data) => {
                socket.emit('botOutput', { name: botName, output: data.toString() });
            });

            bot.stderr.on('data', (data) => {
                socket.emit('botError', { name: botName, error: data.toString() });
            });

            bot.on('close', () => {
                delete bots[botName];
                socket.emit('botClosed', { name: botName });
            });

            socket.emit('botStarted', { name: botName });
        } catch (error) {
            socket.emit('error', `Failed to start bot: ${error.message}`);
        }
    });

    socket.on('disconnect', () => {
        console.log('Client disconnected');
    });
});

server.listen(process.env.PORT || 3000, () => {
    console.log(`Server running on port ${process.env.PORT || 3000}`);
});