import { GAME_STATUS } from '../config/constants.js';

class GameState {
    constructor() {
        this.state = {
            roundId: null,
            status: GAME_STATUS.WAITING,
            multiplier: 1.00,
            crashPoint: null,
            startTime: null
        };
    }

    update(newState) {
        this.state = { ...this.state, ...newState };
    }

    get() {
        return { ...this.state };
    }

    getRoundId() {
        return this.state.roundId;
    }

    getStatus() {
        return this.state.status;
    }

    getMultiplier() {
        return this.state.multiplier;
    }

    getCrashPoint() {
        return this.state.crashPoint;
    }

    reset(roundId) {
        this.state = {
            roundId,
            status: GAME_STATUS.WAITING,
            multiplier: 1.00,
            crashPoint: null,
            startTime: null
        };
    }
}

export default new GameState();