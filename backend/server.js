import express from 'express';
import http from 'http';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import { connectMongoDB } from './src/config/database.js';
import { redis, subscriber } from './src/config/redis.js';
import { initializeWebSocketServer, setupHeartbeat } from './src/services/webSocketService.js';
import { setupWebSocketConnection } from './src/controllers/wsController.js';
import { startGameLoop } from './src/services/gameService.js';
import config from './src/config/constants.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Express setup
const app = express();
app.use(express.json());
app.use(express.static(path.join(__dirname, '../../frontend/build')));

// HTTP server
const server = http.createServer(app);

// WebSocket setup
const wss = initializeWebSocketServer(server);
wss.on('connection', setupWebSocketConnection);

// Heartbeat setup
const heartbeatInterval = setupHeartbeat();

// Cleanup on server close
function cleanup() {
    console.log('🛑 Cerrando servidor...');
    clearInterval(heartbeatInterval);
    const { getClient } = require('./config/database');
    const mongoClient = getClient();
    if (mongoClient) mongoClient.close();
    redis.disconnect();
    subscriber.disconnect();
    process.exit(0);
}

process.on('SIGTERM', cleanup);
process.on('SIGINT', cleanup);

module.exports = {
    app,
    server,
    startServer: async function () {
        await connectMongoDB();

        server.listen(config.PORT, () => {
            console.log(`\n🚀 Servidor Aviator escuchando en puerto ${config.PORT}`);
            console.log(`📊 Rol: ${config.IS_MASTER ? 'MAESTRO (gestiona rondas)' : 'ESCLAVO (solo responde)'}`);
            console.log(`🔗 MongoDB: ${config.MONGO_URI}`);
            console.log(`🔴 Redis: localhost:6379\n`);

            if (config.IS_MASTER) {
                startGameLoop();
            }
        });
    }
};