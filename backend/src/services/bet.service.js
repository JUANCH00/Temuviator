import mongoDB from '../db/mongodb.js';
import redisClient from '../db/redis-client.js';
import userService from './user.service.js';
import gameState from '../models/game-state.js';
import { BETS_KEY, GAME_STATUS } from '../config/constants.js';

class BetService {
    async placeBet(clientId, betAmount) {
        // Validación de estado del juego
        if (gameState.getStatus() !== GAME_STATUS.WAITING) {
            throw new Error('La ronda ya comenzó');
        }

        // Validación de monto
        if (!betAmount || betAmount <= 0) {
            throw new Error('Monto inválido');
        }

        // Verificar balance
        const user = await userService.getUser(clientId);
        if (!user || user.balance < betAmount) {
            throw new Error('Balance insuficiente');
        }

        // Verificar si ya apostó
        const alreadyBet = await redisClient.hexists(BETS_KEY, clientId);
        if (alreadyBet) {
            throw new Error('Ya apostaste en esta ronda');
        }

        // Guardar apuesta en Redis
        await redisClient.hset(BETS_KEY, clientId, JSON.stringify({
            betAmount,
            cashedOut: false,
            cashoutMultiplier: null,
            profit: 0
        }));

        // Descontar balance
        await userService.updateBalance(clientId, -betAmount);

        // Guardar en MongoDB
        const db = mongoDB.getDB();
        await db.collection('bets').insertOne({
            roundId: gameState.getRoundId(),
            clientId,
            betAmount,
            timestamp: new Date(),
            cashedOut: false,
            cashoutMultiplier: null,
            profit: 0
        });

        // Publicar evento
        await redisClient.publish({
            type: 'bet-placed',
            clientId,
            betAmount,
            newBalance: user.balance - betAmount
        });

        console.log(`💰 ${clientId} apostó $${betAmount} en ronda ${gameState.getRoundId()}`);

        return {
            success: true,
            newBalance: user.balance - betAmount
        };
    }

    async cashout(clientId) {
        // Validación de estado
        if (gameState.getStatus() !== GAME_STATUS.FLYING) {
            throw new Error('No hay ronda activa');
        }

        // Verificar apuesta activa
        const betDataStr = await redisClient.hget(BETS_KEY, clientId);
        if (!betDataStr) {
            throw new Error('No tienes apuesta activa');
        }

        const bet = JSON.parse(betDataStr);

        if (bet.cashedOut) {
            throw new Error('Ya hiciste cashout');
        }

        // Calcular ganancia
        const currentMultiplier = gameState.getMultiplier();
        const profit = bet.betAmount * currentMultiplier;
        const netProfit = profit - bet.betAmount;

        // Actualizar Redis
        bet.cashedOut = true;
        bet.cashoutMultiplier = currentMultiplier;
        bet.profit = netProfit;
        await redisClient.hset(BETS_KEY, clientId, JSON.stringify(bet));

        // Actualizar balance
        await userService.updateBalance(clientId, profit);

        // Actualizar MongoDB
        const db = mongoDB.getDB();
        await db.collection('bets').updateOne(
            { roundId: gameState.getRoundId(), clientId },
            {
                $set: {
                    cashedOut: true,
                    cashoutMultiplier: currentMultiplier,
                    profit: netProfit,
                    cashoutTime: new Date()
                }
            }
        );

        // Guardar transacción
        await db.collection('transactions').insertOne({
            clientId,
            type: 'cashout',
            amount: profit,
            roundId: gameState.getRoundId(),
            multiplier: currentMultiplier,
            timestamp: new Date()
        });

        // Publicar evento
        await redisClient.publish({
            type: 'player-cashed-out',
            clientId,
            multiplier: currentMultiplier,
            profit: netProfit
        });

        console.log(`✅ ${clientId} hizo cashout en ${currentMultiplier.toFixed(2)}x - Ganancia: $${netProfit.toFixed(2)}`);

        return {
            success: true,
            multiplier: currentMultiplier,
            profit: netProfit
        };
    }

    async processLostBets(roundId) {
        const allBets = await redisClient.hgetall(BETS_KEY);
        const db = mongoDB.getDB();

        for (const [clientId, betDataStr] of Object.entries(allBets)) {
            const bet = JSON.parse(betDataStr);

            if (!bet.cashedOut) {
                await db.collection('bets').updateOne(
                    { roundId, clientId },
                    {
                        $set: {
                            cashedOut: false,
                            profit: -bet.betAmount,
                            endTime: new Date()
                        }
                    }
                );

                await db.collection('transactions').insertOne({
                    clientId,
                    type: 'loss',
                    amount: -bet.betAmount,
                    roundId,
                    timestamp: new Date()
                });

                console.log(`❌ ${clientId} perdió $${bet.betAmount}`);
            }
        }
    }

    async clearBets() {
        await redisClient.del(BETS_KEY);
    }
}

export default new BetService();