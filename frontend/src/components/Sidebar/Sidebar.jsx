import React from 'react';
import CrashHistory from './CrashHistory/CrashHistory';
import ActiveBettors from './ActiveBettors/ActiveBettors';
import RecentCashouts from './RecentCashouts/RecentCashouts';
import './Sidebar.css';

const Sidebar = ({ crashHistory, activeBettors, recentCashouts, clientId }) => {
  return (
    <div className="sidebar">
      <CrashHistory crashHistory={crashHistory} />
      <ActiveBettors activeBettors={activeBettors} clientId={clientId} />
      <RecentCashouts recentCashouts={recentCashouts} clientId={clientId} />
    </div>
  );
};

export default Sidebar;