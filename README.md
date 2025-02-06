# Bonk UI

A web-based interface for managing and interacting with multiple Bonk bots.

![Screenshot](./screenshot.png)

## Features
- **Download and Set Up Bots Automatically**: Provide a GitHub repository URL, and the manager will clone and install the bot for you.
- **Start, Stop, and Monitor Bots**: Manage multiple bot instances from a single interface.
- **Real-Time Interaction**: View bot logs and send commands via WebSocket.

## Setup
1. Clone the repository:
   ```bash
   git clone https://github.com/afarhansib/uibonk.git
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Rename `.env.example` to `.env` and configure environment variables:
   ```env
   PORT=3000
   BOT_DIR=./bots
   ```
4. Start the server:
   ```bash
   npm start
   ```

## Deployment
Deploy the app to your preferred hosting platform (e.g., Heroku, AWS, etc.).

## Contributing
Pull requests are welcome! For major changes, please open an issue first to discuss what you'd like to change.

## Credits
- **Qwen**: Provided guidance and assistance in designing the architecture, implementing features, and writing documentation for this project. [Qwen by Alibaba Cloud](https://qwen.aliyun.com)