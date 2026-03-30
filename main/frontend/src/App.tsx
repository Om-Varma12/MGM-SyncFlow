import { useState, useEffect, useCallback } from 'react';
import Header from './components/Header';
import CCTVGrid from './components/CCTVGrid';
import SidePanel from './components/SidePanel';
import type { AppState, CCTV, RequestInfo, RouteCCTV, LogEntry, CCTVStatus } from './types';
import './index.css';

// Generate 16 CCTV nodes
const generateCCTVs = (): CCTV[] => {
  const sectors = ['S1', 'S2', 'S3', 'S4', 'S5', 'S6', 'S7', 'S8', 'S9', 'S10', 'S11', 'S12', 'S13', 'S14', 'S15', 'S16'];
  return sectors.map((sector, i) => ({
    id: sector,
    location: `Sector ${i + 1}`,
    status: 'normal' as CCTVStatus,
  }));
};

// Generate route CCTV nodes
const generateRoute = (): RouteCCTV[] => [
  { id: 'S3', status: 'pending' },
  { id: 'S7', status: 'pending' },
  { id: 'S9', status: 'pending' },
  { id: 'S12', status: 'pending' },
];

// Get current time string
const getTimeString = () => {
  const now = new Date();
  return now.toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit' });
};

function App() {
  const [appState, setAppState] = useState<AppState>('normal');
  const [aiEnabled, setAiEnabled] = useState(true);
  const [cctvs, setCCTVs] = useState<CCTV[]>(generateCCTVs());
  const [emergencyCCTV, setEmergencyCCTV] = useState<string | null>(null);
  const [requestInfo, setRequestInfo] = useState<RequestInfo | null>(null);
  const [route, setRoute] = useState<RouteCCTV[]>(generateRoute());
  const [currentRouteIndex, setCurrentRouteIndex] = useState(0);
  const [logs, setLogs] = useState<LogEntry[]>([]);

  // Add a log entry
  const addLog = useCallback((message: string) => {
    const newLog: LogEntry = {
      id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      time: getTimeString(),
      message,
    };
    setLogs((prev) => [...prev, newLog]);
  }, []);

  // AI Toggle
  const handleAiToggle = () => {
    setAiEnabled((prev) => !prev);
  };

  // Trigger Request - State 2
  const handleTriggerRequest = () => {
    if (appState !== 'normal') return;

    setAppState('request_received');
    setRequestInfo({
      from: 'Hospital B',
      to: 'Hospital A',
      type: 'ORGAN TRANSFER',
      ambulance: 'A1',
      status: 'active',
    });
    setRoute(generateRoute());
    setCurrentRouteIndex(0);
    addLog('Request initiated');
    addLog('Route calculated');
  };

  // Simulate Ambulance - State 3
  const handleSimulateAmbulance = () => {
    if (appState !== 'request_received') return;

    setAppState('ambulance_detected');
    setEmergencyCCTV('S3');
    setCCTVs((prev) =>
      prev.map((c) => (c.id === 'S3' ? { ...c, status: 'emergency' } : c))
    );
    setRoute((prev) =>
      prev.map((r, i) => (i === 0 ? { ...r, status: 'current' } : r))
    );
    addLog('Ambulance detected at S3');
    addLog('Corridor activated');
  };

  // Route Deviation - State 4 (Movement)
  const handleRouteDeviation = () => {
    if (appState !== 'movement') return;

    if (currentRouteIndex < route.length - 1) {
      const newIndex = currentRouteIndex + 1;
      setCurrentRouteIndex(newIndex);

      setRoute((prev) =>
        prev.map((r, i) => {
          if (i < newIndex) return { ...r, status: 'passed' };
          if (i === newIndex) return { ...r, status: 'current' };
          if (i === newIndex + 1) return { ...r, status: 'next' };
          return { ...r, status: 'pending' };
        })
      );

      // Update emergency CCTV to current
      const currentCCTV = route[newIndex].id;
      const prevCCTV = route[newIndex - 1].id;
      setEmergencyCCTV(currentCCTV);
      setCCTVs((prev) =>
        prev.map((c) => {
          if (c.id === prevCCTV) return { ...c, status: 'normal' };
          if (c.id === currentCCTV) return { ...c, status: 'emergency' };
          return c;
        })
      );

      addLog(`Passed ${prevCCTV} → ${currentCCTV} active`);

      if (newIndex === route.length - 1) {
        setTimeout(() => {
          setAppState('completed');
          setCCTVs((prev) =>
            prev.map((c) => ({ ...c, status: 'normal' as CCTVStatus }))
          );
          setRequestInfo((prev) => prev ? { ...prev, status: 'completed' } : null);
          addLog('Corridor Completed');
        }, 1500);
      }
    }
  };

  // Start movement when ambulance is detected
  useEffect(() => {
    if (appState === 'ambulance_detected') {
      const timer = setTimeout(() => {
        setAppState('movement');
      }, 1500);
      return () => clearTimeout(timer);
    }
  }, [appState]);

  // Auto-progress route if AI is enabled
  useEffect(() => {
    if (appState === 'movement' && aiEnabled) {
      const interval = setInterval(() => {
        handleRouteDeviation();
      }, 2500);
      return () => clearInterval(interval);
    }
  }, [appState, aiEnabled, currentRouteIndex, route]);

  // Reset to normal
  const handleReset = () => {
    setAppState('normal');
    setCCTVs(generateCCTVs());
    setEmergencyCCTV(null);
    setRequestInfo(null);
    setRoute(generateRoute());
    setCurrentRouteIndex(0);
    setLogs([]);
  };

  return (
    <div className="app">
      <Header
        appState={appState}
        aiEnabled={aiEnabled}
        onAiToggle={handleAiToggle}
        cctvStats={{
          total: cctvs.length,
          normal: cctvs.filter((c) => c.status === 'normal').length,
          emergency: cctvs.filter((c) => c.status === 'emergency').length,
        }}
      />
      <main className="main-layout">
        <CCTVGrid cctvs={cctvs} emergencyCCTV={emergencyCCTV} route={route} />
        <SidePanel
          appState={appState}
          requestInfo={requestInfo}
          route={route}
          logs={logs}
          onTriggerRequest={handleTriggerRequest}
          onSimulateAmbulance={handleSimulateAmbulance}
          onRouteDeviation={handleRouteDeviation}
        />
      </main>
      {appState === 'completed' && (
        <button className="reset-system-btn" onClick={handleReset}>
          ↺ Reset System
        </button>
      )}
    </div>
  );
}

export default App;
