import React from 'react';
import { formatCurrency } from '../../utils/helpers';
import './Header.css';

const Header = ({ connected, serverPort, clientId, balance }) => {
  return (
    <header className="header">
      <div className="header-left">
        <h1>🛩️ Aviator Game</h1>
        <div className="connection-status">
          {connected ? (
            <span className="status-online">
              🟢 Conectado {serverPort && `(Puerto ${serverPort})`}
            </span>
          ) : (
            <span className="status-offline">
              🔴 Desconectado - Reconectando...
            </span>
          )}
        </div>
      </div>
      <div className="header-right">
        <div className="user-info">
          <span className="user-id">👤 {clientId}</span>
          <span className="balance">💰 {formatCurrency(balance)}</span>
        </div>
      </div>
    </header>
  );
};

export default Header;