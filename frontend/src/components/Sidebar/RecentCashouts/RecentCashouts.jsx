import React from 'react';
import { formatCurrency } from '../../../utils/helpers';
import './RecentCashouts.css';

const RecentCashouts = ({ recentCashouts, clientId }) => {
  return (
    <div className="panel">
      <h3>💸 Retiros Recientes</h3>
      <div className="cashouts-list">
        {recentCashouts.length === 0 ? (
          <p className="empty-message">Sin retiros aún</p>
        ) : (
          recentCashouts.map((cashout, index) => (
            <div
              key={index}
              className={`cashout-item ${cashout.clientId === clientId ? 'me' : ''}`}
            >
              <span className="cashout-player">
                {cashout.clientId === clientId ? '🟢 Tú' : cashout.clientId}
              </span>
              <span className="cashout-multiplier">
                {cashout.multiplier.toFixed(2)}x
              </span>
              <span className={`cashout-profit ${cashout.profit > 0 ? 'positive' : ''}`}>
                +{formatCurrency(cashout.profit)}
              </span>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default RecentCashouts;