import { useState, useCallback } from 'react';
import { GAME_STATUS } from '../utils/constants';

const initialGameState = {
  status: GAME_STATUS.WAITING,
  multiplier: 1.00,
  roundId: null
};

export const useGameState = () => {
  const [gameState, setGameState] = useState(initialGameState);
  const [balance, setBalance] = useState(0);
  const [currentBet, setCurrentBet] = useState(null);
  const [activeBettors, setActiveBettors] = useState([]);
  const [recentCashouts, setRecentCashouts] = useState([]);
  const [crashHistory, setCrashHistory] = useState([]);

  const updateGameState = useCallback((updates) => {
    setGameState(prev => ({ ...prev, ...updates }));
  }, []);

  const resetRound = useCallback(() => {
    setGameState(initialGameState);
    setCurrentBet(null);
    setActiveBettors([]);
    setRecentCashouts([]);
  }, []);

  const addToCrashHistory = useCallback((crashPoint) => {
    setCrashHistory(prev => [crashPoint, ...prev].slice(0, 10));
  }, []);

  const addActiveBettor = useCallback((bettor) => {
    setActiveBettors(prev => {
      if (!prev.find(b => b.clientId === bettor.clientId)) {
        return [...prev, bettor];
      }
      return prev;
    });
  }, []);

  const addRecentCashout = useCallback((cashout) => {
    setRecentCashouts(prev => [cashout, ...prev].slice(0, 5));
  }, []);

  return {
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
  };
};