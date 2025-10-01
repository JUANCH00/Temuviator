export const GAME_CHANNEL = 'aviator:game-events';
export const BETS_KEY = 'aviator:current-bets';
export const DB_NAME = 'aviator_game';

export const GAME_CONFIG = {
    WAIT_TIME: 5000,           // 5 segundos para apostar
    TICK_INTERVAL: 100,        // 100ms por tick
    INCREMENT_SPEED: 0.01,     // Incremento por tick
    POST_CRASH_WAIT: 3000      // 3 segundos después del crash
};

export const GAME_STATUS = {
    WAITING: 'waiting',
    FLYING: 'flying',
    CRASHED: 'crashed'
};

export const DEFAULT_BALANCE = 1000;