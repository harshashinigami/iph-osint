import { useEffect, useState } from 'react';
import { getAlerts, acknowledgeAlert, getAlertStats } from '../api/endpoints';
import type { AlertItem } from '../types';
import toast from 'react-hot-toast';

const SEVERITY_COLORS: Record<string, string> = {
  critical: 'bg-red-500/20 text-red-400 border-red-500/30',
  high: 'bg-orange-500/20 text-orange-400 border-orange-500/30',
  medium: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
  low: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
  info: 'bg-slate-500/20 text-slate-400 border-slate-500/30',
};

export default function AlertsPage() {
  const [alerts, setAlerts] = useState<AlertItem[]>([]);
  const [filter, setFilter] = useState({ severity: '', alert_type: '' });
  const [stats, setStats] = useState<{ total: number; unread: number; by_severity: Record<string, number> } | null>(null);
  const [selected, setSelected] = useState<AlertItem | null>(null);

  const loadAlerts = () => {
    const params: Record<string, unknown> = { limit: 50 };
    if (filter.severity) params.severity = filter.severity;
    if (filter.alert_type) params.alert_type = filter.alert_type;
    getAlerts(params).then(({ data }) => setAlerts(data));
    getAlertStats().then(({ data }) => setStats(data));
  };

  useEffect(() => { loadAlerts(); }, [filter]);

  const handleAcknowledge = async (id: string) => {
    await acknowledgeAlert(id);
    toast.success('Alert acknowledged');
    loadAlerts();
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-white">Alert Management</h1>
        {stats && (
          <div className="flex gap-4 text-sm">
            <span className="text-slate-400">Total: <span className="text-white font-medium">{stats.total}</span></span>
            <span className="text-red-400">Unread: <span className="font-medium">{stats.unread}</span></span>
            {Object.entries(stats.by_severity || {}).map(([sev, count]) => (
              <span key={sev} className="text-slate-400 capitalize">{sev}: <span className="text-white">{count}</span></span>
            ))}
          </div>
        )}
      </div>

      {/* Filters */}
      <div className="flex gap-3">
        <select value={filter.severity} onChange={(e) => setFilter({ ...filter, severity: e.target.value })}
          className="px-3 py-2 bg-slate-800 border border-slate-600 rounded-lg text-sm text-white">
          <option value="">All Severities</option>
          {['critical', 'high', 'medium', 'low', 'info'].map((s) => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>
        <select value={filter.alert_type} onChange={(e) => setFilter({ ...filter, alert_type: e.target.value })}
          className="px-3 py-2 bg-slate-800 border border-slate-600 rounded-lg text-sm text-white">
          <option value="">All Types</option>
          {['spike', 'threat', 'entity', 'keyword', 'anomaly', 'fraud', 'coordination'].map((t) => (
            <option key={t} value={t}>{t}</option>
          ))}
        </select>
      </div>

      <div className="flex gap-4">
        {/* Alert Table */}
        <div className="flex-1 bg-slate-900 rounded-xl border border-slate-700 overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-700">
                <th className="text-left text-xs text-slate-400 uppercase p-3">Severity</th>
                <th className="text-left text-xs text-slate-400 uppercase p-3">Title</th>
                <th className="text-left text-xs text-slate-400 uppercase p-3">Type</th>
                <th className="text-left text-xs text-slate-400 uppercase p-3">Time</th>
                <th className="text-left text-xs text-slate-400 uppercase p-3">Action</th>
              </tr>
            </thead>
            <tbody>
              {alerts.map((a) => (
                <tr key={a.id}
                  onClick={() => setSelected(a)}
                  className={`border-b border-slate-800 hover:bg-slate-800/50 cursor-pointer ${!a.is_read ? 'bg-slate-800/30' : ''} ${selected?.id === a.id ? 'bg-blue-900/20' : ''}`}>
                  <td className="p-3">
                    <span className={`px-2 py-0.5 rounded text-xs font-medium border ${SEVERITY_COLORS[a.severity] || ''}`}>
                      {a.severity}
                    </span>
                  </td>
                  <td className="p-3 text-sm text-white max-w-md truncate">{a.title}</td>
                  <td className="p-3 text-xs text-slate-400 capitalize">{a.alert_type}</td>
                  <td className="p-3 text-xs text-slate-500">{new Date(a.created_at).toLocaleString()}</td>
                  <td className="p-3">
                    {!a.is_acknowledged && (
                      <button onClick={(e) => { e.stopPropagation(); handleAcknowledge(a.id); }}
                        className="text-xs px-2 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded transition-colors">
                        ACK
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Detail Panel */}
        {selected && (
          <div className="w-96 bg-slate-900 rounded-xl border border-slate-700 p-5 space-y-4">
            <div className="flex items-center gap-2">
              <span className={`px-2 py-0.5 rounded text-xs font-medium border ${SEVERITY_COLORS[selected.severity] || ''}`}>{selected.severity}</span>
              <span className="text-xs text-slate-400 capitalize">{selected.alert_type}</span>
            </div>
            <h3 className="text-lg font-semibold text-white">{selected.title}</h3>
            <p className="text-sm text-slate-300">{selected.description}</p>
            <div className="text-xs text-slate-500">
              <p>Created: {new Date(selected.created_at).toLocaleString()}</p>
              <p>Status: {selected.is_acknowledged ? 'Acknowledged' : 'Pending'}</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
