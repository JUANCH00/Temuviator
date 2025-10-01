import React from 'react';
import MultiplierDisplay from './MultiplierDisplay/MultiplierDisplay';
import BetControls from './BetControls/BetControls';
import './GameArea.css';

const GameArea = ({ 
  gameState, 
  currentBet, 
  betAmount, 
  setBetAmount, 
  balance, 
  connected,
  onPlaceBet,
  onCashOut 
}) => {
  return (
    <div className="game-area">
      <MultiplierDisplay gameState={gameState} currentBet={currentBet} />
      <BetControls 
        gameState={gameState}
        currentBet={currentBet}
        betAmount={betAmount}
        setBetAmount={setBetAmount}
        balance={balance}
        connected={connected}
        onPlaceBet={onPlaceBet}
        onCashOut={onCashOut}
      />
    </div>
  );
};

export default GameArea;