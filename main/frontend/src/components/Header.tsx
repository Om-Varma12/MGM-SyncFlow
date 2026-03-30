import { useState, useEffect } from 'react';
import type { AppState } from '../types';

interface HeaderProps {
  appState: AppState;
  aiEnabled: boolean;
  onAiToggle: () => void;
  cctvStats?: { normal: number; emergency: number; total: number };
}

export default function Header({ appState, aiEnabled, onAiToggle, cctvStats }: HeaderProps) {
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const isEmergency = appState !== 'normal' && appState !== 'completed';
  const statusText = {
    normal: 'Normal',
    request_received: 'Request Received',
    ambulance_detected: 'Ambulance Detected',
    movement: 'In Transit',
    completed: 'Completed',
  }[appState];

  return (
    <header className="header">
      <div className="header-left">
        <div className="header-brand">
          <div className="header-logo">
            <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
              <circle cx="14" cy="14" r="12" stroke="#58a6ff" strokeWidth="2" fill="none"/>
              <circle cx="14" cy="14" r="6" fill="#58a6ff" opacity="0.3"/>
              <circle cx="14" cy="14" r="3" fill="#58a6ff"/>
              <line x1="14" y1="2" x2="14" y2="6" stroke="#58a6ff" strokeWidth="2"/>
              <line x1="14" y1="22" x2="14" y2="26" stroke="#58a6ff" strokeWidth="2"/>
              <line x1="2" y1="14" x2="6" y2="14" stroke="#58a6ff" strokeWidth="2"/>
              <line x1="22" y1="14" x2="26" y2="14" stroke="#58a6ff" strokeWidth="2"/>
            </svg>
          </div>
          <div className="header-titles">
            <h1 className="project-title">City Traffic Command Center</h1>
            <span className="header-subtitle">Real-time Monitoring System</span>
          </div>
        </div>
        <div className={`status-badge ${isEmergency ? 'emergency' : 'normal'}`}>
          <span className="status-dot" />
          {statusText}
        </div>
      </div>

      <div className="header-center">
        <div className="live-clock">
          <span className="clock-time">
            {time.toLocaleTimeString('en-US', { hour12: false })}
          </span>
          <span className="clock-date">
            {time.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
          </span>
        </div>
      </div>

      <div className="header-right">
        {cctvStats && (
          <div className="cctv-stats">
            <div className="cctv-stat">
              <span className="cctv-stat-value">{cctvStats.total}</span>
              <span className="cctv-stat-label">Total</span>
            </div>
            <div className="cctv-stat cctv-stat-normal">
              <span className="cctv-stat-value">{cctvStats.normal}</span>
              <span className="cctv-stat-label">Normal</span>
            </div>
            <div className="cctv-stat cctv-stat-emergency">
              <span className="cctv-stat-value">{cctvStats.emergency}</span>
              <span className="cctv-stat-label">Alert</span>
            </div>
          </div>
        )}

        <div className="ai-toggle">
          <span className="ai-label">AI MODE</span>
          <div
            className={`toggle-switch ${aiEnabled ? 'active' : ''}`}
            onClick={onAiToggle}
            role="switch"
            aria-checked={aiEnabled}
            tabIndex={0}
            onKeyDown={(e) => e.key === 'Enter' && onAiToggle()}
          />
        </div>
      </div>
    </header>
  );
}
