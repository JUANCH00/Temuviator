import React from 'react';
import { GAME_STATUS, QUICK_BET_AMOUNTS } from '../../../utils/constants';
import { formatCurrency } from '../../../utils/helpers';
import './BetControls.css';

const BetControls = ({ 
  gameState, 
  currentBet, 
  betAmount, 
  setBetAmount, 
  balance, 
  connected,
  onPlaceBet,
  onCashOut 
}) => {
  const getPotentialWin = () => {
    if (!currentBet) return 0;
    return formatCurrency(currentBet.amount * gameState.multiplier);
  };

  return (
    <div className="bet-controls">
      {gameState.status === GAME_STATUS.WAITING && !currentBet && (
        <div className="betting-panel">
          <input
            type="number"
            value={betAmount}
            onChange={(e) => setBetAmount(Number(e.target.value))}
            min="1"
            max={balance}
            className="bet-input"
            disabled={!connected}
          />
          <button
            onClick={onPlaceBet}
            className="btn btn-bet"
            disabled={!connected || betAmount <= 0 || betAmount > balance}
          >
            Apostar {formatCurrency(betAmount)}
          </button>
          <div className="quick-bets">
            {QUICK_BET_AMOUNTS.map(amount => (
              <button 
                key={amount}
                onClick={() => setBetAmount(amount)} 
                className="btn-quick"
              >
                ${amount}
              </button>
            ))}
            <button 
              onClick={() => setBetAmount(balance)} 
              className="btn-quick"
            >
              Todo
            </button>
          </div>
        </div>
      )}

      {currentBet && !currentBet.cashedOut && gameState.status === GAME_STATUS.FLYING && (
        <div className="cashout-panel">
          <button onClick={onCashOut} className="btn btn-cashout">
            💵 Retirar en {gameState.multiplier.toFixed(2)}x
            <br />
            <small>{getPotentialWin()}</small>
          </button>
        </div>
      )}

      {currentBet && currentBet.cashedOut && (
        <div className="cashed-out-message">
          ✅ Ya retiraste tu apuesta
        </div>
      )}

      {gameState.status === GAME_STATUS.WAITING && currentBet && (
        <div className="waiting-for-round">
          ⏳ Apuesta colocada: {formatCurrency(currentBet.amount)}
        </div>
      )}
    </div>
  );
};

export default BetControls;