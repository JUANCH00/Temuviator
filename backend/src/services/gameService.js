import { redis, subscriber } from '../config/redis.js';
import Round from '../models/Round.js';
import config from '../config/constants.js';
import { generateCrashPoint, sleep } from '../utils/gameUtils.js';
import { processLostBets } from './betService.js';
import { broadcastToClients } from './webSocketService.js';

let gameState = {
    roundId: null,
    status: 'waiting',
    multiplier: 1.00,
    crashPoint: null,
    startTime: null
};

async function startGameLoop() {
    if (!config.IS_MASTER) {
        console.log('ℹ️  Este nodo NO es el maestro, no ejecutará el ciclo del juego');
        return;
    }

    console.log('🎮 Nodo MAESTRO - Iniciando ciclo del juego...');

    while (true) {
        await handleWaitingPhase();
        await handleFlyingPhase();
        await handleCrashPhase();
        await sleep(3000);
    }
}

async function handleWaitingPhase() {
    const roundId = `round_${Date.now()}`;
    gameState = {
        roundId,
        status: 'waiting',
        multiplier: 1.00,
        crashPoint: null,
        startTime: null
    };

    await redis.del(config.BETS_KEY);
    await redis.publish(config.GAME_CHANNEL, JSON.stringify({
        type: 'new-round-waiting',
        roundId,
        waitTime: 5
    }));

    console.log(`\n🆕 Nueva ronda: ${roundId} - Esperando apuestas...`);
    await sleep(config.WAIT_TIME);
}

async function handleFlyingPhase() {
    const crashPoint = generateCrashPoint();
    gameState.status = 'flying';
    gameState.crashPoint = crashPoint;
    gameState.startTime = Date.now();

    await Round.create(gameState.roundId, crashPoint);
    await redis.publish(config.GAME_CHANNEL, JSON.stringify({
        type: 'round-started',
        roundId: gameState.roundId,
        crashPoint
    }));

    console.log(`🚀 Ronda ${gameState.roundId} iniciada - Crash point: ${crashPoint.toFixed(2)}x`);

    let multiplier = 1.00;
    const incrementSpeed = 0.01;

    while (multiplier < crashPoint) {
        multiplier += incrementSpeed;
        gameState.multiplier = multiplier;

        await redis.publish(config.GAME_CHANNEL, JSON.stringify({
            type: 'multiplier-update',
            multiplier: parseFloat(multiplier.toFixed(2))
        }));

        await sleep(config.TICK_INTERVAL);
    }
}

async function handleCrashPhase() {
    gameState.status = 'crashed';
    gameState.multiplier = gameState.crashPoint;

    await redis.publish(config.GAME_CHANNEL, JSON.stringify({
        type: 'round-crashed',
        roundId: gameState.roundId,
        crashPoint: gameState.crashPoint
    }));

    console.log(`💥 Ronda ${gameState.roundId} crasheó en ${gameState.crashPoint.toFixed(2)}x`);
    await processLostBets(gameState.roundId);
    await Round.complete(gameState.roundId, gameState.crashPoint);
}

function getGameState() {
    return gameState;
}

function updateGameState(newState) {
    gameState = { ...gameState, ...newState };
}

subscriber.subscribe(config.GAME_CHANNEL, (err) => {
    if (err) {
        console.error('❌ Error suscribiéndose a Redis:', err);
    } else {
        console.log(`📡 Nodo ${config.PORT} suscrito al canal '${config.GAME_CHANNEL}'`);
    }
});

subscriber.on('message', (channel, message) => {
    const data = JSON.parse(message);
    handleGameStateUpdate(data);
    broadcastToClients(message);
});

function handleGameStateUpdate(data) {
    switch (data.type) {
        case 'round-started':
            updateGameState({
                roundId: data.roundId,
                status: 'flying',
                multiplier: 1.00,
                crashPoint: data.crashPoint,
                startTime: Date.now()
            });
            break;
        case 'multiplier-update':
            updateGameState({ multiplier: data.multiplier });
            break;
        case 'round-crashed':
            updateGameState({
                status: 'crashed',
                multiplier: data.crashPoint
            });
            break;
        case 'new-round-waiting':
            updateGameState({
                roundId: data.roundId,
                status: 'waiting',
                multiplier: 1.00,
                crashPoint: null,
                startTime: null
            });
            break;
    }
}

export {
    startGameLoop,
    getGameState,
    updateGameState
};