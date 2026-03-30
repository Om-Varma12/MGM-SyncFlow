import type { LogEntry } from '../types';

interface EventLogProps {
  logs: LogEntry[];
  visible: boolean;
}

export default function EventLog({ logs, visible }: EventLogProps) {
  if (!visible) {
    return <div className="event-log hidden" />;
  }

  return (
    <div className="event-log">
      <div className="event-log-header">
        <div className="event-log-title">Event Logs</div>
        <div className="event-log-count">{logs.length}</div>
      </div>
      <div className="event-log-list">
        {[...logs].reverse().map((log) => (
          <div key={log.id} className="event-log-item">
            <span className="event-log-time">[{log.time}]</span>
            <span className="event-log-message">{log.message}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
