import userService from '../services/user.service.js';
import betService from '../services/bet.service.js';
import gameState from '../models/game-state.js';

export async function handleConnection(ws, clientId, port) {
    ws.clientId = clientId;
    ws.isAlive = true;

    console.log(`👤 Cliente ${clientId} conectado al puerto ${port}`);

    try {
        const user = await userService.registerOrUpdateUser(clientId);

        ws.send(JSON.stringify({
            type: 'welcome',
            port,
            clientId,
            balance: user.balance,
            gameState: gameState.get()
        }));

    } catch (error) {
        console.error('Error al registrar usuario:', error);
        ws.send(JSON.stringify({
            type: 'error',
            message: 'Error de conexión'
        }));
    }
}

export async function handleMessage(ws, message) {
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
        ws.send(JSON.stringify({
            type: 'error',
            message: 'Error procesando solicitud'
        }));
    }
}

async function handlePlaceBet(ws, data) {
    const { betAmount } = data;
    const { clientId } = ws;

    try {
        const result = await betService.placeBet(clientId, betAmount);

        ws.send(JSON.stringify({
            type: 'bet-confirmed',
            betAmount,
            newBalance: result.newBalance
        }));

    } catch (error) {
        ws.send(JSON.stringify({
            type: 'bet-rejected',
            reason: error.message
        }));
    }
}

async function handleCashout(ws, data) {
    const { clientId } = ws;

    try {
        const result = await betService.cashout(clientId);

        ws.send(JSON.stringify({
            type: 'cashout-confirmed',
            multiplier: result.multiplier,
            profit: result.profit
        }));

    } catch (error) {
        ws.send(JSON.stringify({
            type: 'cashout-rejected',
            reason: error.message
        }));
    }
}

export function handleDisconnection(clientId, port) {
    console.log(`👋 Cliente ${clientId} desconectado del puerto ${port}`);
}

export function handleError(clientId, error) {
    console.error(`Error en WebSocket de ${clientId}:`, error);
}

export function handlePong(ws) {
    ws.isAlive = true;
}