import { redis } from '../config/redis.js';
import config from '../config/constants.js';
import User from '../models/User.js';
import Bet from '../models/Bet.js';
import Transaction from '../models/Transaction.js';
import { getGameState } from './gameService.js';

async function handlePlaceBet(ws, { betAmount }) {
    const { clientId } = ws;
    const gameState = getGameState();

    // Validaciones
    if (gameState.status !== 'waiting') {
        ws.send(JSON.stringify({
            type: 'bet-rejected',
            reason: 'La ronda ya comenzó'
        }));
        return;
    }

    if (!betAmount || betAmount <= 0) {
        ws.send(JSON.stringify({
            type: 'bet-rejected',
            reason: 'Monto inválido'
        }));
        return;
    }

    const user = await User.findByClientId(clientId);
    if (!user || user.balance < betAmount) {
        ws.send(JSON.stringify({
            type: 'bet-rejected',
            reason: 'Balance insuficiente'
        }));
        return;
    }

    const alreadyBet = await redis.hexists(config.BETS_KEY, clientId);
    if (alreadyBet) {
        ws.send(JSON.stringify({
            type: 'bet-rejected',
            reason: 'Ya apostaste en esta ronda'
        }));
        return;
    }

    await redis.hset(config.BETS_KEY, clientId, JSON.stringify({
        betAmount,
        cashedOut: false,
        cashoutMultiplier: null,
        profit: 0
    }));

    await User.updateBalance(clientId, -betAmount);
    await Bet.create(gameState.roundId, clientId, betAmount);

    await redis.publish(config.GAME_CHANNEL, JSON.stringify({
        type: 'bet-placed',
        clientId,
        betAmount,
        newBalance: user.balance - betAmount
    }));

    console.log(`💰 ${clientId} apostó $${betAmount} en ronda ${gameState.roundId}`);
}

async function handleCashout(ws) {
    const { clientId } = ws;
    const gameState = getGameState();

    if (gameState.status !== 'flying') {
        ws.send(JSON.stringify({
            type: 'cashout-rejected',
            reason: 'No hay ronda activa'
        }));
        return;
    }

    const betData = await redis.hget(config.BETS_KEY, clientId);
    if (!betData) {
        ws.send(JSON.stringify({
            type: 'cashout-rejected',
            reason: 'No tienes apuesta activa'
        }));
        return;
    }

    const bet = JSON.parse(betData);
    if (bet.cashedOut) {
        ws.send(JSON.stringify({
            type: 'cashout-rejected',
            reason: 'Ya hiciste cashout'
        }));
        return;
    }

    const currentMultiplier = gameState.multiplier;
    const profit = bet.betAmount * currentMultiplier;
    const netProfit = profit - bet.betAmount;

    bet.cashedOut = true;
    bet.cashoutMultiplier = currentMultiplier;
    bet.profit = netProfit;

    await redis.hset(config.BETS_KEY, clientId, JSON.stringify(bet));
    await User.updateBalance(clientId, profit);
    await Bet.updateCashout(gameState.roundId, clientId, currentMultiplier, netProfit);
    await Transaction.create(clientId, 'cashout', profit, gameState.roundId, currentMultiplier);

    await redis.publish(config.GAME_CHANNEL, JSON.stringify({
        type: 'player-cashed-out',
        clientId,
        multiplier: currentMultiplier,
        profit: netProfit
    }));

    console.log(`✅ ${clientId} hizo cashout en ${currentMultiplier.toFixed(2)}x - Ganancia: $${netProfit.toFixed(2)}`);
}

async function processLostBets(roundId) {
    const allBets = await redis.hgetall(config.BETS_KEY);

    for (const [clientId, betDataStr] of Object.entries(allBets)) {
        const bet = JSON.parse(betDataStr);

        if (!bet.cashedOut) {
            await Bet.updateLoss(roundId, clientId, bet.betAmount);
            await Transaction.create(clientId, 'loss', -bet.betAmount, roundId);
            console.log(`❌ ${clientId} perdió $${bet.betAmount}`);
        }
    }
}

export {
    handlePlaceBet,
    handleCashout,
    processLostBets
};