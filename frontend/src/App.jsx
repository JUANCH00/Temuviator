import React, { useState, useEffect, useCallback } from 'react';
import Header from './components/Header/Header';
import GameArea from './components/GameArea/GameArea';
import Sidebar from './components/Sidebar/Sidebar';
import { useWebSocket } from './hooks/useWebSocket';
import { useGameState } from './hooks/useGameState';
import { generateClientId } from './utils/helpers';
import { WS_MESSAGE_TYPES, GAME_STATUS } from './utils/constants';
import './App.css';

function App() {
  const [clientId, setClientId] = useState('');
  const [connected, setConnected] = useState(false);
  const [serverPort, setServerPort] = useState(null);
  const [betAmount, setBetAmount] = useState(100);

  const {
    gameState,
    balance,
    currentBet,
    activeBettors,
    recentCashouts,
    crashHistory,
    setBalance,
    setCurrentBet,
    updateGameState,
    resetRound,
    addToCrashHistory,
    addActiveBettor,
    addRecentCashout
  } = useGameState();

  // Initialize persistent clientId
  useEffect(() => {
    let id = localStorage.getItem('aviator_clientId');
    if (!id) {
      id = generateClientId();
      localStorage.setItem('aviator_clientId', id);
    }
    setClientId(id);
  }, []);

  // Handle WebSocket messages
  const handleWebSocketMessage = useCallback((data) => {
    switch (data.type) {
      case 'connection-closed':
        setConnected(false);
        setServerPort(null);
        break;

      case WS_MESSAGE_TYPES.WELCOME:
        setConnected(true);
        setServerPort(data.port);
        setBalance(data.balance);
        if (data.gameState) {
          updateGameState(data.gameState);
        }
        break;

      case WS_MESSAGE_TYPES.NEW_ROUND_WAITING:
        updateGameState({
          status: GAME_STATUS.WAITING,
          multiplier: 1.00,
          roundId: data.roundId
        });
        setCurrentBet(null);
        // Reset lists for new round
        break;

      case WS_MESSAGE_TYPES.ROUND_STARTED:
        updateGameState({
          status: GAME_STATUS.FLYING,
          roundId: data.roundId
        });
        break;

      case WS_MESSAGE_TYPES.MULTIPLIER_UPDATE:
        updateGameState({ multiplier: data.multiplier });
        break;

      case WS_MESSAGE_TYPES.ROUND_CRASHED:
        updateGameState({
          status: GAME_STATUS.CRASHED,
          multiplier: data.crashPoint
        });
        addToCrashHistory(data.crashPoint);
        if (currentBet && !currentBet.cashedOut) {
          setCurrentBet(null);
        }
        break;

      case WS_MESSAGE_TYPES.BET_PLACED:
        if (data.clientId === clientId) {
          setBalance(data.newBalance);
          setCurrentBet({
            amount: data.betAmount,
            cashedOut: false
          });
        }
        addActiveBettor({ clientId: data.clientId, amount: data.betAmount });
        break;

      case WS_MESSAGE_TYPES.BET_REJECTED:
        alert(`Apuesta rechazada: ${data.reason}`);
        break;

      case WS_MESSAGE_TYPES.PLAYER_CASHED_OUT:
        if (data.clientId === clientId) {
          setCurrentBet(prev => prev ? { ...prev, cashedOut: true } : null);
          setBalance(prev => prev + data.profit);
        }
        addRecentCashout({
          clientId: data.clientId,
          multiplier: data.multiplier,
          profit: data.profit
        });
        break;

      case WS_MESSAGE_TYPES.CASHOUT_REJECTED:
        alert(`Cashout rechazado: ${data.reason}`);
        break;

      case WS_MESSAGE_TYPES.ERROR:
        alert(`Error: ${data.message}`);
        break;

      default:
        console.log('Mensaje desconocido:', data);
    }
  }, [clientId, currentBet, setBalance, setCurrentBet, updateGameState, addToCrashHistory, addActiveBettor, addRecentCashout]);

  const { sendMessage } = useWebSocket(clientId, handleWebSocketMessage);

  const handlePlaceBet = useCallback(() => {
    if (!sendMessage({ type: 'place-bet', betAmount })) {
      alert('No estás conectado al servidor');
      return;
    }

    if (gameState.status !== GAME_STATUS.WAITING) {
      alert('No puedes apostar ahora');
      return;
    }

    if (betAmount <= 0 || betAmount > balance) {
      alert('Monto de apuesta inválido');
      return;
    }
  }, [sendMessage, betAmount, gameState.status, balance]);

  const handleCashOut = useCallback(() => {
    if (!sendMessage({ type: 'cashout' })) {
      alert('No estás conectado al servidor');
      return;
    }

    if (!currentBet || currentBet.cashedOut) {
      alert('No tienes apuesta activa');
      return;
    }
  }, [sendMessage, currentBet]);

  return (
    <div className="app">
      <Header
        connected={connected}
        serverPort={serverPort}
        clientId={clientId}
        balance={balance}
      />
      
      <div className="main-content">
        <GameArea
          gameState={gameState}
          currentBet={currentBet}
          betAmount={betAmount}
          setBetAmount={setBetAmount}
          balance={balance}
          connected={connected}
          onPlaceBet={handlePlaceBet}
          onCashOut={handleCashOut}
        />
        
        <Sidebar
          crashHistory={crashHistory}
          activeBettors={activeBettors}
          recentCashouts={recentCashouts}
          clientId={clientId}
        />
      </div>
    </div>
  );
}

export default App;