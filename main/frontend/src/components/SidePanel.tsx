import type { AppState, RequestInfo as RequestInfoType, RouteCCTV, LogEntry } from '../types';
import RequestInfo from './RequestInfo';
import RouteTracker from './RouteTracker';
import EventLog from './EventLog';

interface SidePanelProps {
  appState: AppState;
  requestInfo: RequestInfoType | null;
  route: RouteCCTV[];
  logs: LogEntry[];
  onTriggerRequest: () => void;
  onSimulateAmbulance: () => void;
  onRouteDeviation: () => void;
}

export default function SidePanel({
  appState,
  requestInfo,
  route,
  logs,
  onTriggerRequest,
  onSimulateAmbulance,
  onRouteDeviation,
}: SidePanelProps) {
  const showRequest = appState !== 'normal' && appState !== 'completed';
  const showRoute = appState === 'request_received' || appState === 'ambulance_detected' || appState === 'movement';
  const showLogs = appState !== 'normal';
  const showCompletion = appState === 'completed';

  return (
    <aside className="side-panel">
      <div className="control-buttons">
        <button
          className="control-btn primary"
          onClick={onTriggerRequest}
          disabled={appState !== 'normal'}
        >
          <span className="control-btn-icon">⚡</span>
          <span className="control-btn-label">Trigger Request</span>
        </button>
        <button
          className="control-btn"
          onClick={onSimulateAmbulance}
          disabled={appState !== 'request_received'}
        >
          <span className="control-btn-icon">🚑</span>
          <span className="control-btn-label">Simulate Ambulance</span>
        </button>
        <button
          className="control-btn danger"
          onClick={onRouteDeviation}
          disabled={appState !== 'movement'}
        >
          <span className="control-btn-icon">🛤️</span>
          <span className="control-btn-label">Route Deviation</span>
        </button>
      </div>

      <RequestInfo info={requestInfo} visible={showRequest} />
      <RouteTracker route={route} visible={showRoute} />
      <EventLog logs={logs} visible={showLogs} />

      <div className={`completion-banner ${!showCompletion ? 'hidden' : ''}`}>
        <div className="completion-icon">✓</div>
        <div className="completion-text">Corridor Completed</div>
        <div className="completion-sub">All segments cleared — systems nominal</div>
      </div>
    </aside>
  );
}
