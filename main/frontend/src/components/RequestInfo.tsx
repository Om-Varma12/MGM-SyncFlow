import type { RequestInfo as RequestInfoType } from '../types';

interface RequestInfoProps {
  info: RequestInfoType | null;
  visible: boolean;
}

export default function RequestInfo({ info, visible }: RequestInfoProps) {
  if (!visible || !info) {
    return <div className="request-info hidden" />;
  }

  return (
    <div className="request-info">
      <div className="request-info-header">
        <span className="request-info-header-icon">🚑</span>
        <span>EMERGENCY REQUEST ACTIVE</span>
      </div>
      <div className="request-route">
        <span className="from">{info.from}</span>
        <span className="arrow">→</span>
        <span className="to">{info.to}</span>
      </div>
      <div className="request-details">
        <div className="request-detail">
          <span className="request-detail-label">Type</span>
          <span className="request-detail-value">{info.type}</span>
        </div>
        <div className="request-detail">
          <span className="request-detail-label">Ambulance</span>
          <span className="request-detail-value highlight">{info.ambulance}</span>
        </div>
        <div className="request-detail">
          <span className="request-detail-label">Status</span>
          <span className="request-detail-value highlight">{info.status.toUpperCase()}</span>
        </div>
      </div>
    </div>
  );
}
