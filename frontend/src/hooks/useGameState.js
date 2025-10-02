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
  const [isLoadingHistory, setIsLoadingHistory] = useState(true);
  const [isLoadingCashouts, setIsLoadingCashouts] = useState(true);

  const updateGameState = useCallback((updates) => {
    setGameState(prev => ({ ...prev, ...updates }));
  }, []);

  const resetRound = useCallback(() => {
    setGameState(initialGameState);
    setCurrentBet(null);
    setActiveBettors([]);
  }, []);

  const loadCrashHistory = useCallback((history) => {
    if (history && Array.isArray(history) && history.length > 0) {
      setCrashHistory(history);
      console.log(`✅ Historial cargado desde WebSocket: ${history.length} crashes`);
    } else {
      console.log('ℹ️ No hay historial de crashes disponible');
    }
    setIsLoadingHistory(false);
  }, []);

  const loadRecentCashouts = useCallback((cashouts) => {
    if (cashouts && Array.isArray(cashouts) && cashouts.length > 0) {
      setRecentCashouts(cashouts);
      console.log(`✅ Cashouts cargados desde WebSocket: ${cashouts.length} retiros`);
    } else {
      console.log('ℹ️ No hay cashouts recientes disponibles');
    }
    setIsLoadingCashouts(false);
  }, []);

  const addToCrashHistory = useCallback((crashPoint) => {
    setCrashHistory(prev => {
      if (prev[0] === crashPoint) {
        return prev;
      }
      return [crashPoint, ...prev].slice(0, 10);
    });
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
    setRecentCashouts(prev => {
      const isDuplicate = prev.some(
        c => c.clientId === cashout.clientId &&
          c.multiplier === cashout.multiplier &&
          Math.abs(c.profit - cashout.profit) < 0.01
      );

      if (isDuplicate) {
        return prev;
      }

      return [cashout, ...prev].slice(0, 10);
    });
  }, []);

  const clearRoundData = useCallback(() => {
    setActiveBettors([]);
  }, []);

  return {
    gameState,
    balance,
    currentBet,
    activeBettors,
    recentCashouts,
    crashHistory,
    isLoadingHistory,
    isLoadingCashouts,
    setBalance,
    setCurrentBet,
    updateGameState,
    resetRound,
    loadCrashHistory,
    loadRecentCashouts,
    addToCrashHistory,
    addActiveBettor,
    addRecentCashout,
    clearRoundData
  };
};