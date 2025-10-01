import dotenv from 'dotenv';
dotenv.config();

export const GAME_CHANNEL = 'aviator:game-events';
export const BETS_KEY = 'aviator:current-bets';
export const DB_NAME = 'aviator_game';

export const GAME_CONFIG = {
    WAIT_TIME: process.env.WAIT_TIME,           // 5 segundos para apostar
    TICK_INTERVAL: process.env.TICK_INTERVAL,        // 100ms por tick
    INCREMENT_SPEED: 0.05,     // Incremento por tick
    POST_CRASH_WAIT: process.env.POST_CRASH_WAIT       // 3 segundos después del crash
};

export const GAME_STATUS = {
    WAITING: 'waiting',
    FLYING: 'flying',
    CRASHED: 'crashed'
};

export const DEFAULT_BALANCE = 1000;