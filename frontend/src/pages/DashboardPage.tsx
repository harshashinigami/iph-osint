import { useEffect, useState } from 'react';
import { Activity, Users, AlertTriangle, Radio, TrendingUp } from 'lucide-react';
import { getStats, getPlatformBreakdown, getSentimentOverview, getThreatLevel, getTopEntities, getRecentAlerts, getTrendingTopics } from '../api/endpoints';
import type { DashboardStats, PlatformData, SentimentData, ThreatLevel, EntityItem, AlertItem, TopicData } from '../types';

function StatCard({ label, value, icon: Icon, color }: { label: string; value: number | string; icon: React.ElementType; color: string }) {
  return (
    <div className="bg-slate-900 rounded-xl p-4 border border-slate-700">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs text-slate-400 uppercase tracking-wider">{label}</p>
          <p className="text-2xl font-bold text-white mt-1">{typeof value === 'number' ? value.toLocaleString() : value}</p>
        </div>
        <div className={`p-3 rounded-lg ${color}`}>
          <Icon className="w-5 h-5 text-white" />
        </div>
      </div>
    </div>
  );
}

function SeverityBadge({ severity }: { severity: string }) {
  const colors: Record<string, string> = {
    critical: 'bg-red-500/20 text-red-400',
    high: 'bg-orange-500/20 text-orange-400',
    medium: 'bg-yellow-500/20 text-yellow-400',
    low: 'bg-blue-500/20 text-blue-400',
    info: 'bg-slate-500/20 text-slate-400',
  };
  return (
    <span className={`px-2 py-0.5 rounded text-xs font-medium ${colors[severity] || colors.info}`}>
      {severity}
    </span>
  );
}

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [platforms, setPlatforms] = useState<PlatformData[]>([]);
  const [sentiment, setSentiment] = useState<SentimentData[]>([]);
  const [threat, setThreat] = useState<ThreatLevel | null>(null);
  const [topEntities, setTopEntities] = useState<EntityItem[]>([]);
  const [alerts, setAlerts] = useState<AlertItem[]>([]);
  const [topics, setTopics] = useState<TopicData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      getStats(), getPlatformBreakdown(), getSentimentOverview(),
      getThreatLevel(), getTopEntities(), getRecentAlerts(10), getTrendingTopics(),
    ]).then(([s, p, sent, t, e, a, top]) => {
      setStats(s.data);
      setPlatforms(p.data);
      setSentiment(sent.data);
      setThreat(t.data);
      setTopEntities(e.data);
      setAlerts(a.data);
      setTopics(top.data);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  if (loading) {
    return <div className="flex items-center justify-center h-96"><div className="text-slate-400">Loading intelligence data...</div></div>;
  }

  const totalSentiment = sentiment.reduce((a, b) => a + b.count, 0);
  const threatColor = (threat?.average_threat_score || 0) > 0.5 ? 'text-red-400' : (threat?.average_threat_score || 0) > 0.3 ? 'text-yellow-400' : 'text-green-400';

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-white">Intelligence Dashboard</h1>
        <span className="text-xs text-slate-500">Last updated: {new Date().toLocaleString()}</span>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-5 gap-4">
        <StatCard label="Total Posts" value={stats?.total_posts || 0} icon={Activity} color="bg-blue-600" />
        <StatCard label="Posts (24h)" value={stats?.posts_24h || 0} icon={TrendingUp} color="bg-emerald-600" />
        <StatCard label="Entities Tracked" value={stats?.total_entities || 0} icon={Users} color="bg-purple-600" />
        <StatCard label="Active Alerts" value={stats?.active_alerts || 0} icon={AlertTriangle} color="bg-red-600" />
        <StatCard label="Active Sources" value={stats?.active_sources || 0} icon={Radio} color="bg-amber-600" />
      </div>

      <div className="grid grid-cols-3 gap-6">
        {/* Threat Level */}
        <div className="bg-slate-900 rounded-xl p-5 border border-slate-700">
          <h3 className="text-sm text-slate-400 uppercase tracking-wider mb-4">Threat Level</h3>
          <div className="text-center">
            <p className={`text-5xl font-bold ${threatColor}`}>
              {((threat?.average_threat_score || 0) * 100).toFixed(0)}
            </p>
            <p className="text-xs text-slate-500 mt-1">Average Threat Score</p>
            <p className="text-sm text-red-400 mt-3">{threat?.high_threat_posts || 0} high-threat posts</p>
          </div>
        </div>

        {/* Platform Breakdown */}
        <div className="bg-slate-900 rounded-xl p-5 border border-slate-700">
          <h3 className="text-sm text-slate-400 uppercase tracking-wider mb-4">Platform Distribution</h3>
          <div className="space-y-2">
            {platforms.slice(0, 6).map((p) => {
              const total = platforms.reduce((a, b) => a + b.count, 0);
              const pct = total ? ((p.count / total) * 100).toFixed(0) : 0;
              return (
                <div key={p.platform} className="flex items-center gap-3">
                  <span className="text-xs text-slate-400 w-20 capitalize">{p.platform}</span>
                  <div className="flex-1 h-2 bg-slate-800 rounded-full overflow-hidden">
                    <div className="h-full bg-blue-500 rounded-full" style={{ width: `${pct}%` }} />
                  </div>
                  <span className="text-xs text-slate-300 w-12 text-right">{p.count.toLocaleString()}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Sentiment Overview */}
        <div className="bg-slate-900 rounded-xl p-5 border border-slate-700">
          <h3 className="text-sm text-slate-400 uppercase tracking-wider mb-4">Sentiment Analysis</h3>
          <div className="space-y-3">
            {sentiment.map((s) => {
              const pct = totalSentiment ? ((s.count / totalSentiment) * 100).toFixed(0) : 0;
              const color = s.label.includes('positive') ? 'bg-green-500' : s.label.includes('negative') ? 'bg-red-500' : 'bg-slate-500';
              return (
                <div key={s.label} className="flex items-center gap-3">
                  <span className="text-xs text-slate-400 w-24 capitalize">{s.label.replace('_', ' ')}</span>
                  <div className="flex-1 h-2 bg-slate-800 rounded-full overflow-hidden">
                    <div className={`h-full rounded-full ${color}`} style={{ width: `${pct}%` }} />
                  </div>
                  <span className="text-xs text-slate-300 w-10 text-right">{pct}%</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-6">
        {/* Top Entities */}
        <div className="bg-slate-900 rounded-xl p-5 border border-slate-700">
          <h3 className="text-sm text-slate-400 uppercase tracking-wider mb-4">Top Entities</h3>
          <div className="space-y-2">
            {topEntities.map((e) => (
              <div key={e.id} className="flex items-center justify-between py-1.5 border-b border-slate-800 last:border-0">
                <div className="flex items-center gap-3">
                  <span className="text-xs px-2 py-0.5 rounded bg-slate-800 text-slate-300 capitalize">{e.entity_type}</span>
                  <span className="text-sm text-white">{e.display_name || e.value}</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-xs text-slate-400">{e.mention_count} mentions</span>
                  <div className={`w-2 h-2 rounded-full ${e.risk_score > 0.7 ? 'bg-red-500' : e.risk_score > 0.4 ? 'bg-yellow-500' : 'bg-green-500'}`} />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Alerts */}
        <div className="bg-slate-900 rounded-xl p-5 border border-slate-700">
          <h3 className="text-sm text-slate-400 uppercase tracking-wider mb-4">Recent Alerts</h3>
          <div className="space-y-2">
            {alerts.map((a) => (
              <div key={a.id} className="flex items-start gap-3 py-2 border-b border-slate-800 last:border-0">
                <SeverityBadge severity={a.severity} />
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-white truncate">{a.title}</p>
                  <p className="text-xs text-slate-500">{new Date(a.created_at).toLocaleString()}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Trending Topics */}
      <div className="bg-slate-900 rounded-xl p-5 border border-slate-700">
        <h3 className="text-sm text-slate-400 uppercase tracking-wider mb-4">Trending Topics</h3>
        <div className="flex flex-wrap gap-2">
          {topics.map((t) => (
            <span key={t.topic} className="px-3 py-1.5 bg-slate-800 rounded-full text-sm text-slate-300 hover:bg-slate-700 cursor-pointer transition-colors">
              {t.topic} <span className="text-slate-500 ml-1">{t.count}</span>
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
