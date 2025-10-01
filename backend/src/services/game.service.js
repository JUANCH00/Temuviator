import mongoDB from '../db/mongodb.js';
import redisClient from '../db/redis-client.js';
import betService from './bet.service.js';
import gameState from '../models/game-state.js';
import { generateCrashPoint } from '../utils/crash-point.js';
import { sleep } from '../utils/sleep.js';
import { GAME_CONFIG, GAME_STATUS } from '../config/constants.js';

class GameService {
    constructor() {
        this.isRunning = false;
    }

    async startGameLoop() {
        if (this.isRunning) {
            console.log('⚠️  El ciclo del juego ya está en ejecución');
            return;
        }

        this.isRunning = true;
        console.log('🎮 Iniciando ciclo del juego...');

        while (this.isRunning) {
            await this.runRound();
        }
    }

    async runRound() {
        // Fase 1: ESPERA
        await this.waitingPhase();

        // Fase 2: VUELO
        await this.flyingPhase();

        // Fase 3: CRASH
        await this.crashPhase();

        // Esperar antes de siguiente ronda
        await sleep(GAME_CONFIG.POST_CRASH_WAIT);
    }

    async waitingPhase() {
        const roundId = `round_${Date.now()}`;
        gameState.reset(roundId);

        await betService.clearBets();

        await redisClient.publish({
            type: 'new-round-waiting',
            roundId,
            waitTime: GAME_CONFIG.WAIT_TIME / 1000
        });

        console.log(`\n🆕 Nueva ronda: ${roundId} - Esperando apuestas...`);
        await sleep(GAME_CONFIG.WAIT_TIME);
    }

    async flyingPhase() {
        const crashPoint = generateCrashPoint();
        const roundId = gameState.getRoundId();

        gameState.update({
            status: GAME_STATUS.FLYING,
            crashPoint,
            startTime: Date.now()
        });

        // Guardar ronda en MongoDB
        const db = mongoDB.getDB();
        await db.collection('rounds').insertOne({
            roundId,
            crashPoint,
            startTime: new Date(),
            status: 'active'
        });

        await redisClient.publish({
            type: 'round-started',
            roundId,
            crashPoint
        });

        console.log(`🚀 Ronda ${roundId} iniciada - Crash point: ${crashPoint.toFixed(2)}x`);

        // Incrementar multiplicador
        let multiplier = 1.00;

        while (multiplier < crashPoint) {
            multiplier += GAME_CONFIG.INCREMENT_SPEED;
            gameState.update({ multiplier });

            await redisClient.publish({
                type: 'multiplier-update',
                multiplier: parseFloat(multiplier.toFixed(2))
            });

            await sleep(GAME_CONFIG.TICK_INTERVAL);
        }
    }

    async crashPhase() {
        const crashPoint = gameState.getCrashPoint();
        const roundId = gameState.getRoundId();

        gameState.update({
            status: GAME_STATUS.CRASHED,
            multiplier: crashPoint
        });

        await redisClient.publish({
            type: 'round-crashed',
            roundId,
            crashPoint
        });

        console.log(`💥 Ronda ${roundId} crasheó en ${crashPoint.toFixed(2)}x`);

        // Procesar apuestas perdidas
        await betService.processLostBets(roundId);

        // Actualizar ronda
        const db = mongoDB.getDB();
        await db.collection('rounds').updateOne(
            { roundId },
            {
                $set: {
                    status: 'completed',
                    endTime: new Date(),
                    finalMultiplier: crashPoint
                }
            }
        );
    }

    stopGameLoop() {
        this.isRunning = false;
        console.log('🛑 Deteniendo ciclo del juego...');
    }
}

export default new GameService();