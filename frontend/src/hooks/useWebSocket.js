import { useRef, useEffect, useCallback } from 'react';
import { WS_CONFIG, WS_MESSAGE_TYPES } from '../utils/constants';

export const useWebSocket = (clientId, onMessage) => {
  const wsRef = useRef(null);
  const reconnectTimeoutRef = useRef(null);

  const connect = useCallback(() => {
    if (!clientId) return;

    const ws = new WebSocket(`${WS_CONFIG.URL}?clientId=${clientId}`);
    wsRef.current = ws;

    ws.onopen = () => {
      console.log('✅ Conectado al servidor');
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
        reconnectTimeoutRef.current = null;
      }
    };

    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      onMessage(data);
    };

    ws.onclose = () => {
      console.log('❌ Desconectado del servidor');
      onMessage({ type: 'connection-closed' });
      
      reconnectTimeoutRef.current = setTimeout(() => {
        console.log('🔄 Intentando reconectar...');
        connect();
      }, WS_CONFIG.RECONNECT_DELAY);
    };

    ws.onerror = (error) => {
      console.error('Error en WebSocket:', error);
    };
  }, [clientId, onMessage]);

  const sendMessage = useCallback((message) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(message));
      return true;
    }
    return false;
  }, []);

  useEffect(() => {
    connect();

    return () => {
      if (wsRef.current) {
        wsRef.current.close();
      }
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
    };
  }, [connect]);

  return { sendMessage, isConnected: wsRef.current?.readyState === WebSocket.OPEN };
};