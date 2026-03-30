import type { RouteCCTV } from '../types';

interface RouteTrackerProps {
  route: RouteCCTV[];
  visible: boolean;
}

export default function RouteTracker({ route, visible }: RouteTrackerProps) {
  if (!visible || route.length === 0) {
    return <div className="route-panel hidden" />;
  }

  const passedCount = route.filter((r) => r.status === 'passed').length;
  const totalCount = route.length;
  const progress = totalCount > 1 ? Math.round((passedCount / (totalCount - 1)) * 100) : 0;

  return (
    <div className="route-panel">
      <div className="route-header">
        <div className="route-title">Route Tracking</div>
        <div className="route-progress-text">
          {passedCount}/{totalCount - 1} segments
        </div>
      </div>
      <div className="route-cctvs">
        {route.map((cctv, index) => (
          <div key={cctv.id} className="route-node">
            <div className={`route-cctv-item ${cctv.status}`}>
              <span>{cctv.id}</span>
            </div>
            {index < route.length - 1 && (
              <span className={`route-arrow ${cctv.status === 'passed' ? 'passed' : ''}`}>
                →
              </span>
            )}
          </div>
        ))}
      </div>
      <div className="route-progress-bar">
        <div className="route-progress-fill" style={{ width: `${progress}%` }} />
      </div>
    </div>
  );
}
