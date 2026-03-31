import { useEffect, useRef, useState } from 'react';
import { getAlerts, acknowledgeAlert, getAlertStats } from '../api/endpoints';
import type { AlertItem } from '../types';
import toast from 'react-hot-toast';

const API_URL = import.meta.env.VITE_API_URL || '';

// Neon severity: badge classes + inline glow
const SEVERITY_STYLES: Record<string, { cls: string; glow: string }> = {
  critical: {
    cls:  'bg-red-500/15 text-red-400 border-red-500/50',
    glow: '0 0 10px rgba(255,51,85,0.5), 0 0 20px rgba(255,51,85,0.2)',
  },
  high: {
    cls:  'bg-orange-500/15 text-orange-400 border-orange-500/40',
    glow: '0 0 8px rgba(255,120,0,0.4)',
  },
  medium: {
    cls:  'bg-yellow-500/15 text-yellow-400 border-yellow-500/40',
    glow: '0 0 8px rgba(255,200,0,0.3)',
  },
  low: {
    cls:  'bg-cyan-500/15 text-cyan-400 border-cyan-500/40',
    glow: '0 0 8px rgba(0,240,255,0.3)',
  },
  info: {
    cls:  'bg-slate-500/15 text-slate-400 border-slate-500/30',
    glow: 'none',
  },
};

function SeverityBadge({ severity }: { severity: string }) {
  const s = SEVERITY_STYLES[severity] || SEVERITY_STYLES.info;
  return (
    <span
      className={`px-2 py-0.5 rounded text-xs font-mono font-medium border ${s.cls}`}
      style={{ boxShadow: s.glow }}
    >
      {severity}
    </span>
  );
}

export default function AlertsPage() {
  const [alerts, setAlerts] = useState<AlertItem[]>([]);
  const [filter, setFilter] = useState({ severity: '', alert_type: '' });
  const [stats, setStats] = useState<{ total: number; unread: number; by_severity: Record<string, number> } | null>(null);
  const [selected, setSelected] = useState<AlertItem | null>(null);
  const [liveConnected, setLiveConnected] = useState(false);
  const esRef = useRef<EventSource | null>(null);
  const reconnectTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const loadAlerts = () => {
    const params: Record<string, unknown> = { limit: 50 };
    if (filter.severity) params.severity = filter.severity;
    if (filter.alert_type) params.alert_type = filter.alert_type;
    getAlerts(params).then(({ data }) => setAlerts(data));
    getAlertStats().then(({ data }) => setStats(data));
  };

  const connectSSE = () => {
    if (esRef.current) esRef.current.close();
    const es = new EventSource(`${API_URL}/api/v1/alerts/stream`);
    esRef.current = es;

    es.addEventListener('alert', (e: MessageEvent) => {
      try {
        const alert: AlertItem = JSON.parse(e.data);
        setAlerts((prev) => [alert, ...prev]);
        const s = SEVERITY_STYLES[alert.severity] || SEVERITY_STYLES.info;
        toast.custom(
          () => (
            <div
              className={`px-4 py-3 rounded-lg border text-sm font-mono font-medium ${s.cls}`}
              style={{ boxShadow: s.glow }}
            >
              <span className="font-bold uppercase mr-2">[{alert.severity}]</span>
              {alert.title}
            </div>
          ),
          { duration: 5000 }
        );
      } catch {
        // ignore malformed
      }
    });

    es.onopen = () => {
      setLiveConnected(true);
      if (reconnectTimer.current) { clearTimeout(reconnectTimer.current); reconnectTimer.current = null; }
    };
    es.onerror = () => {
      setLiveConnected(false);
      es.close();
      esRef.current = null;
      reconnectTimer.current = setTimeout(connectSSE, 5000);
    };
  };

  useEffect(() => {
    connectSSE();
    return () => {
      if (esRef.current) esRef.current.close();
      if (reconnectTimer.current) clearTimeout(reconnectTimer.current);
    };
  }, []);

  useEffect(() => { loadAlerts(); }, [filter]);

  const handleAcknowledge = async (id: string) => {
    await acknowledgeAlert(id);
    toast.success('Alert acknowledged');
    loadAlerts();
  };

  const selectStyle = {
    background: 'rgba(0,240,255,0.04)',
    border: '1px solid rgba(0,240,255,0.18)',
    color: '#e2f0ff',
    borderRadius: '0.5rem',
    padding: '0.5rem 0.75rem',
    fontSize: '0.8rem',
    fontFamily: 'monospace',
    outline: 'none',
  } as React.CSSProperties;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-bold text-white tracking-tight">
            <span className="text-cyan-400 text-glow-cyan">ALERT</span> MANAGEMENT
          </h1>
          {liveConnected ? (
            <div
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-full"
              style={{
                background: 'rgba(0,255,136,0.08)',
                border: '1px solid rgba(0,255,136,0.35)',
                boxShadow: '0 0 10px rgba(0,255,136,0.15)',
              }}
            >
              <span className="w-2 h-2 rounded-full bg-green-400 pulse-dot-green" />
              <span className="text-[10px] font-mono font-bold" style={{ color: '#00ff88' }}>LIVE</span>
            </div>
          ) : (
            <div
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-full"
              style={{
                background: 'rgba(100,100,120,0.15)',
                border: '1px solid rgba(100,100,120,0.3)',
              }}
            >
              <span className="w-2 h-2 rounded-full bg-slate-500" />
              <span className="text-[10px] font-mono font-bold text-slate-500">DISCONNECTED</span>
            </div>
          )}
        </div>
        {stats && (
          <div className="flex gap-4 text-xs font-mono">
            <span className="text-cyan-400/50">
              TOTAL: <span className="text-white font-bold">{stats.total}</span>
            </span>
            <span className="text-red-400">
              UNREAD: <span className="font-bold">{stats.unread}</span>
            </span>
            {Object.entries(stats.by_severity || {}).map(([sev, count]) => {
              const s = SEVERITY_STYLES[sev] || SEVERITY_STYLES.info;
              return (
                <span key={sev} className={`capitalize ${s.cls.split(' ').find(c => c.startsWith('text-')) || 'text-slate-400'}`}>
                  {sev}: <span className="font-bold">{count}</span>
                </span>
              );
            })}
          </div>
        )}
      </div>

      {/* Filters */}
      <div className="flex gap-3">
        <select
          value={filter.severity}
          onChange={(e) => setFilter({ ...filter, severity: e.target.value })}
          style={selectStyle}
        >
          <option value="">All Severities</option>
          {['critical', 'high', 'medium', 'low', 'info'].map((s) => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>
        <select
          value={filter.alert_type}
          onChange={(e) => setFilter({ ...filter, alert_type: e.target.value })}
          style={selectStyle}
        >
          <option value="">All Types</option>
          {['spike', 'threat', 'entity', 'keyword', 'anomaly', 'fraud', 'coordination'].map((t) => (
            <option key={t} value={t}>{t}</option>
          ))}
        </select>
      </div>

      <div className="flex gap-4">
        {/* Alert Table */}
        <div
          className="flex-1 rounded-xl overflow-hidden"
          style={{
            background: 'rgba(0,0,0,0.40)',
            border: '1px solid rgba(0,240,255,0.12)',
            backdropFilter: 'blur(8px)',
          }}
        >
          <table className="w-full">
            <thead>
              <tr style={{ borderBottom: '1px solid rgba(0,240,255,0.10)' }}>
                {['Severity', 'Title', 'Type', 'Time', 'Action'].map((h) => (
                  <th key={h} className="text-left p-3">
                    <span className="text-[10px] text-cyan-400/50 uppercase font-mono tracking-widest">{h}</span>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {alerts.map((a) => {
                const isSelected = selected?.id === a.id;
                return (
                  <tr
                    key={a.id}
                    onClick={() => setSelected(a)}
                    className="cursor-pointer transition-colors"
                    style={{
                      borderBottom: '1px solid rgba(0,240,255,0.05)',
                      background: isSelected
                        ? 'rgba(0,240,255,0.07)'
                        : !a.is_read
                          ? 'rgba(0,240,255,0.03)'
                          : 'transparent',
                    }}
                    onMouseEnter={(e) => {
                      if (!isSelected) (e.currentTarget as HTMLTableRowElement).style.background = 'rgba(0,240,255,0.04)';
                    }}
                    onMouseLeave={(e) => {
                      if (!isSelected) (e.currentTarget as HTMLTableRowElement).style.background = !a.is_read ? 'rgba(0,240,255,0.03)' : 'transparent';
                    }}
                  >
                    <td className="p-3">
                      <SeverityBadge severity={a.severity} />
                    </td>
                    <td className="p-3 text-sm text-white/90 max-w-md truncate">{a.title}</td>
                    <td className="p-3 text-xs text-cyan-400/50 capitalize font-mono">{a.alert_type}</td>
                    <td className="p-3 text-xs text-cyan-500/40 font-mono">{new Date(a.created_at).toLocaleString()}</td>
                    <td className="p-3">
                      {!a.is_acknowledged && (
                        <button
                          onClick={(e) => { e.stopPropagation(); handleAcknowledge(a.id); }}
                          className="text-[10px] px-2 py-1 rounded font-mono font-bold tracking-widest transition-all hover:scale-105"
                          style={{
                            background: 'rgba(0,240,255,0.10)',
                            border: '1px solid rgba(0,240,255,0.35)',
                            color: '#00f0ff',
                          }}
                          onMouseEnter={(e) => {
                            (e.currentTarget as HTMLButtonElement).style.boxShadow = '0 0 8px rgba(0,240,255,0.4)';
                          }}
                          onMouseLeave={(e) => {
                            (e.currentTarget as HTMLButtonElement).style.boxShadow = 'none';
                          }}
                        >
                          ACK
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Detail Panel */}
        {selected && (
          <div
            className="w-96 rounded-xl p-5 space-y-4"
            style={{
              background: 'rgba(0,0,0,0.50)',
              border: '1px solid rgba(0,240,255,0.18)',
              backdropFilter: 'blur(8px)',
            }}
          >
            <div className="flex items-center gap-2">
              <SeverityBadge severity={selected.severity} />
              <span className="text-xs text-cyan-400/50 capitalize font-mono">{selected.alert_type}</span>
            </div>
            <h3 className="text-base font-semibold text-white/95 leading-snug">{selected.title}</h3>
            <p className="text-sm text-cyan-200/70 leading-relaxed">{selected.description}</p>
            <div className="text-[10px] font-mono space-y-1" style={{ color: 'rgba(0,240,255,0.35)' }}>
              <p>CREATED: {new Date(selected.created_at).toLocaleString()}</p>
              <p>STATUS: {selected.is_acknowledged
                ? <span style={{ color: '#00ff88' }}>ACKNOWLEDGED</span>
                : <span style={{ color: '#ffaa00' }}>PENDING</span>}
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
