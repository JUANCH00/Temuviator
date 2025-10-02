import userService from '../services/user.service.js';
import betService from '../services/bet.service.js';
import gameState from '../models/game-state.js';
import mongoDB from '../db/mongodb.js';

export async function handleConnection(ws, clientId, port) {
    ws.clientId = clientId;
    ws.isAlive = true;

    console.log(`Cliente ${clientId} conectado al puerto ${port}`);

    try {
        const user = await userService.registerOrUpdateUser(clientId);
        const crashHistory = await getCrashHistory(10);
        const recentCashouts = await getRecentCashouts(10);

        ws.send(JSON.stringify({
            type: 'welcome',
            port,
            clientId,
            balance: user.balance,
            gameState: gameState.get(),
            crashHistory: crashHistory,
            recentCashouts: recentCashouts
        }));

    } catch (error) {
        console.error('Error al registrar usuario:', error);
        ws.send(JSON.stringify({
            type: 'error',
            message: 'Error de conexión'
        }));
    }
}

async function getCrashHistory(limit = 10) {
    try {
        const db = mongoDB.getDB();

        const rounds = await db.collection('rounds')
            .find({
                status: 'completed',
                crashPoint: { $exists: true }
            })
            .sort({ endTime: -1 })
            .limit(limit)
            .toArray();

        const crashes = rounds.map(round => round.crashPoint);

        console.log(`Historial enviado: ${crashes.length} crashes`);
        return crashes;

    } catch (error) {
        console.error('Error obteniendo historial:', error);
        return [];
    }
}

async function getRecentCashouts(limit = 10) {
    try {
        const db = mongoDB.getDB();

        const transactions = await db.collection('transactions')
            .find({
                type: 'cashout',
                amount: { $gt: 0 }
            })
            .sort({ timestamp: -1 })
            .limit(limit)
            .toArray();

        const cashouts = transactions.map(tx => ({
            clientId: tx.clientId,
            multiplier: tx.multiplier || 0,
            profit: tx.amount || 0,
            timestamp: tx.timestamp
        }));

        console.log(`Cashouts enviados: ${cashouts.length} retiros`);
        return cashouts;

    } catch (error) {
        console.error('Error obteniendo cashouts recientes:', error);
        return [];
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

            case 'request-crash-history':
                const history = await getCrashHistory(data.limit || 10);
                ws.send(JSON.stringify({
                    type: 'crash-history-update',
                    crashHistory: history
                }));
                break;

            case 'request-recent-cashouts':
                const cashouts = await getRecentCashouts(data.limit || 10);
                ws.send(JSON.stringify({
                    type: 'recent-cashouts-update',
                    recentCashouts: cashouts
                }));
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