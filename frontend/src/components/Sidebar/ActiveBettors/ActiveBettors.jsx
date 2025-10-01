import React from 'react';
import { formatCurrency } from '../../../utils/helpers';
import './ActiveBettors.css';

const ActiveBettors = ({ activeBettors, clientId }) => {
  return (
    <div className="panel">
      <h3>👥 Apostadores Activos ({activeBettors.length})</h3>
      <div className="bettors-list">
        {activeBettors.length === 0 ? (
          <p className="empty-message">Nadie ha apostado aún</p>
        ) : (
          activeBettors.map((bettor, index) => (
            <div
              key={index}
              className={`bettor-item ${bettor.clientId === clientId ? 'me' : ''}`}
            >
              <span className="bettor-name">
                {bettor.clientId === clientId ? '🟢 Tú' : bettor.clientId}
              </span>
              <span className="bettor-amount">{formatCurrency(bettor.amount)}</span>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default ActiveBettors;