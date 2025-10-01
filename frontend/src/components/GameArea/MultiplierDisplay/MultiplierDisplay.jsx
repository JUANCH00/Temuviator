import React from 'react';
import { GAME_STATUS } from '../../../utils/constants';
import { getMultiplierColor, formatCurrency } from '../../../utils/helpers';
import './MultiplierDisplay.css';

const MultiplierDisplay = ({ gameState, currentBet }) => {
  const multiplierColor = getMultiplierColor(gameState.status, gameState.multiplier);
  
  const getPotentialWin = () => {
    if (!currentBet) return 0;
    return formatCurrency(currentBet.amount * gameState.multiplier);
  };

  return (
    <div className="multiplier-display" style={{ color: multiplierColor }}>
      {gameState.status === GAME_STATUS.WAITING && (
        <div className="waiting-message">
          <h2>Esperando siguiente ronda...</h2>
          <p>Coloca tu apuesta</p>
        </div>
      )}

      {gameState.status === GAME_STATUS.FLYING && (
        <div className="flying-multiplier">
          <h1>{gameState.multiplier.toFixed(2)}x</h1>
          {currentBet && !currentBet.cashedOut && (
            <div className="potential-win">
              Ganancia potencial: {getPotentialWin()}
            </div>
          )}
        </div>
      )}

      {gameState.status === GAME_STATUS.CRASHED && (
        <div className="crashed-message">
          <h1>💥 {gameState.multiplier.toFixed(2)}x</h1>
          <p>¡Avión crasheado!</p>
        </div>
      )}
    </div>
  );
};

export default MultiplierDisplay;