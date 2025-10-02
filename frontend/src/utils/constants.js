export const GAME_STATUS = {
  WAITING: 'waiting',
  FLYING: 'flying',
  CRASHED: 'crashed'
};

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

export const QUICK_BET_AMOUNTS = [50, 100, 200];

export const WS_CONFIG = {
  //Localhost
  URL: 'ws://localhost:8080',
  //Conexion
  // URL: 'ws://172.20.10.3:8080',
  RECONNECT_DELAY: 3000
};