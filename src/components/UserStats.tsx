import React from 'react';
import { useUserStats } from '../hooks/useUserStats';
import '../styles/UserStats.css';

export function UserStats() {
  const { activeUsers, totalUsers } = useUserStats();

  return (
    <div className="user-stats">
      <div className="stat-item">
        <span className="stat-value">{activeUsers}</span>
        <span className="stat-label">
          <span className="jp">👥 体験中</span>
          <span className="en">Active Users</span>
        </span>
      </div>
      <div className="stat-item">
        <span className="stat-value">{totalUsers}</span>
        <span className="stat-label">
          <span className="jp">🔄 総体験回数</span>
          <span className="en">Total Visits</span>
        </span>
      </div>
    </div>
  );
}
