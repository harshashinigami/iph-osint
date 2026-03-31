import { useEffect, useState } from 'react';
import { User, Server, Bell, Database, RefreshCw, CheckCircle, XCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '../auth/AuthContext';
import { getAlertRules, createAlertRule } from '../api/endpoints';
import api from '../api/client';
import type { AlertRule } from '../types';

const ROLE_COLORS: Record<string, string> = {
  admin: 'bg-red-500/20 text-red-400 border border-red-500/30',
  analyst: 'bg-blue-500/20 text-blue-400 border border-blue-500/30',
  viewer: 'bg-slate-500/20 text-slate-400 border border-slate-500/30',
};

const API_URL = import.meta.env.VITE_API_URL || window.location.origin;

type HealthStatus = 'checking' | 'ok' | 'error';

interface NewRule {
  name: string;
  rule_type: string;
  severity: string;
  config: string;
}

const RULE_TYPES = ['keyword', 'threat_score', 'entity', 'spike', 'coordination', 'fraud', 'anomaly'];
const SEVERITIES = ['critical', 'high', 'medium', 'low', 'info'];

const SEVERITY_COLORS: Record<string, string> = {
  critical: 'bg-red-500/20 text-red-400 border-red-500/30',
  high: 'bg-orange-500/20 text-orange-400 border-orange-500/30',
  medium: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
  low: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
  info: 'bg-slate-500/20 text-slate-400 border-slate-500/30',
};

export default function SettingsPage() {
  const { user } = useAuth();

  // Section 2: health
  const [healthStatus, setHealthStatus] = useState<HealthStatus>('checking');

  // Section 3: alert rules
  const [rules, setRules] = useState<AlertRule[]>([]);
  const [showNewRule, setShowNewRule] = useState(false);
  const [newRule, setNewRule] = useState<NewRule>({
    name: '',
    rule_type: 'keyword',
    severity: 'medium',
    config: '{}',
  });
  const [savingRule, setSavingRule] = useState(false);

  // Section 4: data management loading states
  const [loadingRss, setLoadingRss] = useState(false);
  const [loadingNlp, setLoadingNlp] = useState(false);
  const [loadingSeed, setLoadingSeed] = useState(false);

  useEffect(() => {
    api.get('/health')
      .then(() => setHealthStatus('ok'))
      .catch(() => setHealthStatus('error'));
    getAlertRules().then(({ data }) => setRules(data)).catch(() => {});
  }, []);

  const handleCreateRule = async () => {
    if (!newRule.name.trim()) { toast.error('Rule name is required'); return; }
    let parsedConfig: Record<string, unknown>;
    try {
      parsedConfig = JSON.parse(newRule.config);
    } catch {
      toast.error('Config must be valid JSON');
      return;
    }
    setSavingRule(true);
    try {
      await createAlertRule({ ...newRule, config: parsedConfig });
      toast.success('Alert rule created');
      const { data } = await getAlertRules();
      setRules(data);
      setShowNewRule(false);
      setNewRule({ name: '', rule_type: 'keyword', severity: 'medium', config: '{}' });
    } catch {
      toast.error('Failed to create rule');
    } finally {
      setSavingRule(false);
    }
  };

  const triggerRss = async () => {
    setLoadingRss(true);
    try {
      const { data } = await api.post('/api/v1/ingestion/collect/rss');
      toast.success(`RSS collection started — ${data?.message || 'OK'}`);
    } catch {
      toast.error('RSS collection failed');
    } finally {
      setLoadingRss(false);
    }
  };

  const triggerNlp = async () => {
    setLoadingNlp(true);
    try {
      const { data } = await api.post('/api/v1/ingestion/process');
      toast.success(`NLP processing started — ${data?.message || 'OK'}`);
    } catch {
      toast.error('NLP processing failed');
    } finally {
      setLoadingNlp(false);
    }
  };

  const triggerSeed = async () => {
    setLoadingSeed(true);
    try {
      const { data } = await api.post('/api/v1/seed/generate');
      toast.success(`Seed complete — ${data?.message || 'OK'}`);
    } catch {
      toast.error('Seed failed');
    } finally {
      setLoadingSeed(false);
    }
  };

  return (
    <div className="space-y-8 max-w-4xl">
      <h1 className="text-2xl font-bold text-white">Settings</h1>

      {/* Section 1: User Profile */}
      <section className="bg-slate-900 rounded-xl border border-slate-700 p-6">
        <div className="flex items-center gap-2 mb-5">
          <User className="w-5 h-5 text-blue-400" />
          <h2 className="text-lg font-semibold text-white">User Profile</h2>
        </div>
        {user ? (
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-xs text-slate-400 uppercase tracking-wide mb-1">Display Name</p>
              <p className="text-white font-medium">{user.display_name}</p>
            </div>
            <div>
              <p className="text-xs text-slate-400 uppercase tracking-wide mb-1">Username</p>
              <p className="text-slate-300">{user.username}</p>
            </div>
            <div>
              <p className="text-xs text-slate-400 uppercase tracking-wide mb-1">User ID</p>
              <p className="text-slate-500 font-mono text-sm">{user.id}</p>
            </div>
            <div>
              <p className="text-xs text-slate-400 uppercase tracking-wide mb-1">Role</p>
              <span className={`inline-block px-2.5 py-0.5 rounded text-xs font-medium capitalize ${ROLE_COLORS[user.role] || ROLE_COLORS.viewer}`}>
                {user.role}
              </span>
            </div>
          </div>
        ) : (
          <p className="text-slate-500 text-sm">No user session found.</p>
        )}
      </section>

      {/* Section 2: System Configuration */}
      <section className="bg-slate-900 rounded-xl border border-slate-700 p-6">
        <div className="flex items-center gap-2 mb-5">
          <Server className="w-5 h-5 text-blue-400" />
          <h2 className="text-lg font-semibold text-white">System Configuration</h2>
        </div>
        <div className="grid grid-cols-3 gap-4">
          <div className="bg-slate-800 rounded-lg border border-slate-700 p-4">
            <p className="text-xs text-slate-400 uppercase tracking-wide mb-2">API Endpoint</p>
            <p className="text-slate-300 text-sm font-mono break-all">{API_URL || '(same origin)'}</p>
          </div>
          <div className="bg-slate-800 rounded-lg border border-slate-700 p-4">
            <p className="text-xs text-slate-400 uppercase tracking-wide mb-2">Database Status</p>
            <div className="flex items-center gap-2">
              {healthStatus === 'checking' && (
                <RefreshCw className="w-4 h-4 text-slate-400 animate-spin" />
              )}
              {healthStatus === 'ok' && (
                <CheckCircle className="w-4 h-4 text-green-400" />
              )}
              {healthStatus === 'error' && (
                <XCircle className="w-4 h-4 text-red-400" />
              )}
              <span className={`text-sm font-medium ${
                healthStatus === 'ok' ? 'text-green-400' :
                healthStatus === 'error' ? 'text-red-400' : 'text-slate-400'
              }`}>
                {healthStatus === 'checking' ? 'Checking…' : healthStatus === 'ok' ? 'Connected' : 'Unreachable'}
              </span>
            </div>
          </div>
          <div className="bg-slate-800 rounded-lg border border-slate-700 p-4">
            <p className="text-xs text-slate-400 uppercase tracking-wide mb-2">Platform Version</p>
            <p className="text-slate-300 text-sm font-medium">ILA OSINT v0.1.0 PoC</p>
          </div>
        </div>
      </section>

      {/* Section 3: Alert Rules */}
      <section className="bg-slate-900 rounded-xl border border-slate-700 p-6">
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-2">
            <Bell className="w-5 h-5 text-blue-400" />
            <h2 className="text-lg font-semibold text-white">Alert Rules</h2>
            <span className="ml-1 text-xs text-slate-400">({rules.length})</span>
          </div>
          <button
            onClick={() => setShowNewRule((v) => !v)}
            className="text-sm px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
          >
            {showNewRule ? 'Cancel' : '+ New Rule'}
          </button>
        </div>

        {showNewRule && (
          <div className="mb-5 bg-slate-800 rounded-lg border border-slate-600 p-4 space-y-4">
            <h3 className="text-sm font-semibold text-slate-200">Create New Rule</h3>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs text-slate-400 mb-1">Rule Name</label>
                <input
                  type="text"
                  value={newRule.name}
                  onChange={(e) => setNewRule({ ...newRule, name: e.target.value })}
                  placeholder="e.g. High threat score spike"
                  className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-sm text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-xs text-slate-400 mb-1">Rule Type</label>
                <select
                  value={newRule.rule_type}
                  onChange={(e) => setNewRule({ ...newRule, rule_type: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-sm text-white focus:outline-none focus:border-blue-500"
                >
                  {RULE_TYPES.map((t) => (
                    <option key={t} value={t}>{t}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs text-slate-400 mb-1">Severity</label>
                <select
                  value={newRule.severity}
                  onChange={(e) => setNewRule({ ...newRule, severity: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-sm text-white focus:outline-none focus:border-blue-500"
                >
                  {SEVERITIES.map((s) => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs text-slate-400 mb-1">Config (JSON)</label>
                <input
                  type="text"
                  value={newRule.config}
                  onChange={(e) => setNewRule({ ...newRule, config: e.target.value })}
                  placeholder='{"threshold": 0.8}'
                  className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-sm text-white font-mono placeholder-slate-500 focus:outline-none focus:border-blue-500"
                />
              </div>
            </div>
            <div className="flex justify-end">
              <button
                onClick={handleCreateRule}
                disabled={savingRule}
                className="text-sm px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-lg transition-colors"
              >
                {savingRule ? 'Saving…' : 'Create Rule'}
              </button>
            </div>
          </div>
        )}

        {rules.length === 0 ? (
          <p className="text-slate-500 text-sm">No alert rules configured.</p>
        ) : (
          <div className="overflow-hidden rounded-lg border border-slate-700">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-700">
                  <th className="text-left text-xs text-slate-400 uppercase p-3">Name</th>
                  <th className="text-left text-xs text-slate-400 uppercase p-3">Type</th>
                  <th className="text-left text-xs text-slate-400 uppercase p-3">Severity</th>
                  <th className="text-left text-xs text-slate-400 uppercase p-3">Status</th>
                </tr>
              </thead>
              <tbody>
                {rules.map((r) => (
                  <tr key={r.id} className="border-b border-slate-800 hover:bg-slate-800/40">
                    <td className="p-3 text-sm text-white">{r.name}</td>
                    <td className="p-3 text-xs text-slate-400 capitalize">{r.rule_type}</td>
                    <td className="p-3">
                      <span className={`px-2 py-0.5 rounded text-xs font-medium border ${SEVERITY_COLORS[r.severity] || ''}`}>
                        {r.severity}
                      </span>
                    </td>
                    <td className="p-3">
                      <span className={`text-xs font-medium ${r.is_active ? 'text-green-400' : 'text-slate-500'}`}>
                        {r.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* Section 4: Data Management */}
      <section className="bg-slate-900 rounded-xl border border-slate-700 p-6">
        <div className="flex items-center gap-2 mb-5">
          <Database className="w-5 h-5 text-blue-400" />
          <h2 className="text-lg font-semibold text-white">Data Management</h2>
        </div>
        <div className="grid grid-cols-3 gap-4">
          <div className="bg-slate-800 rounded-lg border border-slate-700 p-4 space-y-3">
            <div>
              <p className="text-sm font-medium text-white">RSS Collection</p>
              <p className="text-xs text-slate-400 mt-0.5">Fetch latest posts from all active RSS sources.</p>
            </div>
            <button
              onClick={triggerRss}
              disabled={loadingRss}
              className="w-full text-sm px-3 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-lg transition-colors flex items-center justify-center gap-2"
            >
              {loadingRss ? <RefreshCw className="w-4 h-4 animate-spin" /> : null}
              {loadingRss ? 'Running…' : 'Collect RSS'}
            </button>
          </div>
          <div className="bg-slate-800 rounded-lg border border-slate-700 p-4 space-y-3">
            <div>
              <p className="text-sm font-medium text-white">NLP Processing</p>
              <p className="text-xs text-slate-400 mt-0.5">Run sentiment analysis and entity extraction on unprocessed posts.</p>
            </div>
            <button
              onClick={triggerNlp}
              disabled={loadingNlp}
              className="w-full text-sm px-3 py-2 bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white rounded-lg transition-colors flex items-center justify-center gap-2"
            >
              {loadingNlp ? <RefreshCw className="w-4 h-4 animate-spin" /> : null}
              {loadingNlp ? 'Running…' : 'Run NLP'}
            </button>
          </div>
          <div className="bg-slate-800 rounded-lg border border-slate-700 p-4 space-y-3">
            <div>
              <p className="text-sm font-medium text-white">Seed Database</p>
              <p className="text-xs text-slate-400 mt-0.5">Generate synthetic posts, entities, and alerts for demo purposes.</p>
            </div>
            <button
              onClick={triggerSeed}
              disabled={loadingSeed}
              className="w-full text-sm px-3 py-2 bg-amber-600 hover:bg-amber-700 disabled:opacity-50 text-white rounded-lg transition-colors flex items-center justify-center gap-2"
            >
              {loadingSeed ? <RefreshCw className="w-4 h-4 animate-spin" /> : null}
              {loadingSeed ? 'Running…' : 'Seed Database'}
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}
