import React from 'react';
import { getCrashItemClass } from '../../../utils/helpers';
import './CrashHistory.css';

const CrashHistory = ({ crashHistory }) => {
  return (
    <div className="panel">
      <h3>📊 Historial de Crashes</h3>
      <div className="crash-history">
        {crashHistory.length === 0 ? (
          <p className="empty-message">Sin historial aún</p>
        ) : (
          crashHistory.map((crash, index) => (
            <div
              key={index}
              className={`crash-item ${getCrashItemClass(crash)}`}
            >
              {crash.toFixed(2)}x
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default CrashHistory;