import type { CCTV, RouteCCTV } from '../types';
import CCTVCard from './CCTVCard';

interface CCTVGridProps {
  cctvs: CCTV[];
  emergencyCCTV: string | null;
  route: RouteCCTV[];
}

export default function CCTVGrid({ cctvs, emergencyCCTV, route }: CCTVGridProps) {
  // Build a map of CCTV id -> route status
  const routeStatusMap = new Map<string, RouteCCTV['status']>();
  for (const r of route) {
    routeStatusMap.set(r.id, r.status);
  }

  return (
    <div className="cctv-grid-container">
      <div className="cctv-grid-header">
        <span className="cctv-grid-title">Live Camera Feeds</span>
        <span className="cctv-grid-subtitle">16 nodes active</span>
      </div>
      <div className="cctv-grid" style={{ padding: '0 20px 20px' }}>
        {cctvs.map((cctv) => (
          <CCTVCard
            key={cctv.id}
            cctv={cctv}
            isEmergency={cctv.id === emergencyCCTV}
            routeStatus={routeStatusMap.get(cctv.id) ?? null}
          />
        ))}
      </div>
    </div>
  );
}
