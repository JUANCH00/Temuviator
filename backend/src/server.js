import express from 'express';
import http from 'http';
import { WebSocketServer } from 'ws';
import path from 'path';
import { fileURLToPath } from 'url';

import mongoDB from './db/mongodb.js';
import redisClient from './db/redis-client.js';
import gameService from './services/game.service.js';
import gameState from './models/game-state.js';
import {
    handleConnection,
    handleMessage,
    handleDisconnection,
    handleError,
    handlePong
} from './handlers/websocket.handler.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configuración
const PORT = process.argv[2] || 3001;
const IS_MASTER = PORT == 3001;

// Express y WebSocket
const app = express();
app.use(express.json());
app.use(express.static(path.join(__dirname, '../../frontend/build')));

const server = http.createServer(app);
const wss = new WebSocketServer({ server });

// WebSocket Connection Handler
wss.on('connection', async (ws, req) => {
    const params = new URLSearchParams(req.url.slice(1));
    const clientId = params.get('clientId');

    if (!clientId) {
        console.log("❌ Conexión rechazada: no se proporcionó clientId");
        ws.close();
        return;
    }

    await handleConnection(ws, clientId, PORT);

    ws.on('pong', () => handlePong(ws));
    ws.on('message', async (message) => await handleMessage(ws, message));
    ws.on('close', () => handleDisconnection(clientId, PORT));
    ws.on('error', (error) => handleError(clientId, error));
});

// Suscripción a Redis
function setupRedisSubscription() {
    redisClient.subscribe((data) => {
        // Actualizar estado local
        if (data.type === 'round-started') {
            gameState.update({
                roundId: data.roundId,
                status: 'flying',
                multiplier: 1.00,
                crashPoint: data.crashPoint,
                startTime: Date.now()
            });
        } else if (data.type === 'multiplier-update') {
            gameState.update({ multiplier: data.multiplier });
        } else if (data.type === 'round-crashed') {
            gameState.update({
                status: 'crashed',
                multiplier: data.crashPoint
            });
        } else if (data.type === 'new-round-waiting') {
            gameState.reset(data.roundId);
        }

        // Broadcast a todos los clientes
        wss.clients.forEach(client => {
            if (client.readyState === client.OPEN) {
                client.send(JSON.stringify(data));
            }
        });
    });
}

// Heartbeat para limpiar conexiones muertas
const heartbeatInterval = setInterval(() => {
    wss.clients.forEach(ws => {
        if (ws.isAlive === false) {
            console.log(`💀 Eliminando conexión muerta de ${ws.clientId}`);
            return ws.terminate();
        }
        ws.isAlive = false;
        ws.ping();
    });
}, 30000);

// Limpieza al cerrar
process.on('SIGTERM', async () => {
    console.log('🛑 Cerrando servidor...');
    clearInterval(heartbeatInterval);
    gameService.stopGameLoop();
    await mongoDB.close();
    redisClient.disconnect();
    process.exit(0);
});

// INICIAR SERVIDOR
async function startServer() {
    try {
        await mongoDB.connect();
        redisClient.connect();
        setupRedisSubscription();

        server.listen(PORT, () => {
            console.log(`\n🚀 Servidor Aviator escuchando en puerto ${PORT}`);
            console.log(`📊 Rol: ${IS_MASTER ? 'MAESTRO (gestiona rondas)' : 'ESCLAVO (solo responde)'}`);
            console.log(`🔗 MongoDB: Cluster conectado`);
            console.log(`🔴 Redis: localhost:6379\n`);

            if (IS_MASTER) {
                gameService.startGameLoop();
            }
        });
    } catch (error) {
        console.error('❌ Error iniciando servidor:', error);
        process.exit(1);
    }
}

startServer();