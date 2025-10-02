import { handlePlaceBet, handleCashout } from '../services/betService.js';
import { getGameState } from '../services/gameService.js';
import { handleUserConnection } from '../services/userService.js';
import config from '../config/constants.js';

async function setupWebSocketConnection(ws, req) {
    const params = new URLSearchParams(req.url.slice(1));
    const clientId = params.get('clientId');

    if (!clientId) {
        console.log("Conexión rechazada: no se proporcionó clientId");
        ws.close();
        return;
    }

    ws.clientId = clientId;
    ws.isAlive = true;

    console.log(`Cliente ${clientId} conectado al puerto ${config.PORT}`);

    try {
        const user = await handleUserConnection(ws, clientId);

        ws.send(JSON.stringify({
            type: 'welcome',
            port: config.PORT,
            clientId,
            balance: user.balance,
            gameState: getGameState()
        }));

        setupMessageHandler(ws);
        setupConnectionHandlers(ws);

    } catch (error) {
        console.error('Error al registrar usuario:', error);
        ws.send(JSON.stringify({ type: 'error', message: 'Error de conexión' }));
    }
}

function setupMessageHandler(ws) {
    ws.on('message', async (message) => {
        try {
            const data = JSON.parse(message);

            switch (data.type) {
                case 'place-bet':
                    await handlePlaceBet(ws, data);
                    break;

                case 'cashout':
                    await handleCashout(ws, data);
                    break;

                default:
                    console.log(`Mensaje desconocido: ${data.type}`);
            }
        } catch (error) {
            console.error('Error procesando mensaje:', error);
            ws.send(JSON.stringify({ type: 'error', message: 'Error procesando solicitud' }));
        }
    });
}

function setupConnectionHandlers(ws) {
    ws.on('pong', () => {
        ws.isAlive = true;
    });

    ws.on('close', () => {
        console.log(`Cliente ${ws.clientId} desconectado del puerto ${config.PORT}`);
    });

    ws.on('error', (error) => {
        console.error(`Error en WebSocket de ${ws.clientId}:`, error);
    });
}

export {
    setupWebSocketConnection
};