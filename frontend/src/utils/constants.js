// Game status constants
export const GAME_STATUS = {
  WAITING: 'waiting',
  FLYING: 'flying',
  CRASHED: 'crashed'
};

// WebSocket message types
export const WS_MESSAGE_TYPES = {
  WELCOME: 'welcome',
  NEW_ROUND_WAITING: 'new-round-waiting',
  ROUND_STARTED: 'round-started',
  MULTIPLIER_UPDATE: 'multiplier-update',
  ROUND_CRASHED: 'round-crashed',
  BET_PLACED: 'bet-placed',
  BET_REJECTED: 'bet-rejected',
  PLAYER_CASHED_OUT: 'player-cashed-out',
  CASHOUT_REJECTED: 'cashout-rejected',
  ERROR: 'error'
};

// Quick bet amounts
export const QUICK_BET_AMOUNTS = [50, 100, 200];

// WebSocket configuration
export const WS_CONFIG = {
  URL: 'ws://localhost:8080',
  RECONNECT_DELAY: 3000
};