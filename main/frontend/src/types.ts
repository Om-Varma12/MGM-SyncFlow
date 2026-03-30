export type CCTVStatus = 'normal' | 'high_traffic' | 'emergency';
export type AppState = 'normal' | 'request_received' | 'ambulance_detected' | 'movement' | 'completed';

export interface CCTV {
  id: string;
  location: string;
  status: CCTVStatus;
}

export interface RouteCCTV {
  id: string;
  status: 'passed' | 'current' | 'next' | 'pending';
}

export interface RequestInfo {
  from: string;
  to: string;
  type: string;
  ambulance: string;
  status: 'active' | 'completed';
}

export interface LogEntry {
  id: string;
  time: string;
  message: string;
}

export interface AppStore {
  appState: AppState;
  aiEnabled: boolean;
  cctvs: CCTV[];
  emergencyCCTV: string | null;
  requestInfo: RequestInfo | null;
  route: RouteCCTV[];
  currentRouteIndex: number;
  logs: LogEntry[];
}
