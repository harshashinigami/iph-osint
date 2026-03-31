import { useEffect, useState, useRef, useCallback } from 'react';
import { Activity, Users, AlertTriangle, Radio, TrendingUp, RefreshCw } from 'lucide-react';
import { getStats, getPlatformBreakdown, getSentimentOverview, getThreatLevel, getTopEntities, getRecentAlerts, getTrendingTopics, getGeoData, getVolumeTimeline } from '../api/endpoints';
import type { DashboardStats, PlatformData, SentimentData, ThreatLevel, EntityItem, AlertItem, TopicData, GeoData, VolumeData } from '../types';
import GeoMap from '../components/dashboard/GeoMap';

const PLATFORM_COLORS: Record<string, string> = {
  rss: '#3b82f6',
  telegram: '#06b6d4',
  twitter: '#8b5cf6',
  reddit: '#f97316',
  default: '#6b7280',
};

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

function VolumeTimeline({ data }: { data: VolumeData[] }) {
  if (!data.length) {
    return <div className="h-32 flex items-center justify-center text-slate-500 text-sm">No volume data available</div>;
  }

  // Group by day, collect platforms
  const dayMap = new Map<string, Record<string, number>>();
  const platformSet = new Set<string>();

  for (const item of data) {
    platformSet.add(item.platform);
    if (!dayMap.has(item.day)) dayMap.set(item.day, {});
    dayMap.get(item.day)![item.platform] = item.count;
  }

  const days = Array.from(dayMap.entries()).sort(([a], [b]) => a.localeCompare(b));
  const platforms = Array.from(platformSet);

  // Find max total per day for scaling
  const maxTotal = Math.max(...days.map(([, counts]) => Object.values(counts).reduce((a, b) => a + b, 0)));

  return (
    <div>
      {/* Legend */}
      <div className="flex items-center gap-4 mb-3">
        {platforms.map((p) => (
          <div key={p} className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded-sm" style={{ backgroundColor: PLATFORM_COLORS[p] || PLATFORM_COLORS.default }} />
            <span className="text-xs text-slate-400 capitalize">{p}</span>
          </div>
        ))}
      </div>

      {/* Bar chart */}
      <div className="flex items-end gap-1 h-28 overflow-x-auto pb-5 relative">
        {days.map(([day, counts]) => {
          const total = Object.values(counts).reduce((a, b) => a + b, 0);
          const heightPct = maxTotal ? (total / maxTotal) * 100 : 0;
          const label = day.slice(5); // MM-DD

          return (
            <div key={day} className="flex flex-col items-center flex-1 min-w-[24px] group relative">
              {/* Tooltip */}
              <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 bg-slate-800 border border-slate-600 rounded px-2 py-1 text-xs text-white whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity z-10 pointer-events-none">
                <div className="font-medium mb-0.5">{day}</div>
                {platforms.map((p) => counts[p] ? (
                  <div key={p} className="flex items-center gap-1">
                    <div className="w-2 h-2 rounded-sm" style={{ backgroundColor: PLATFORM_COLORS[p] || PLATFORM_COLORS.default }} />
                    <span className="capitalize">{p}: {counts[p]}</span>
                  </div>
                ) : null)}
                <div className="text-slate-400 border-t border-slate-700 mt-0.5 pt-0.5">Total: {total}</div>
              </div>

              {/* Stacked bar */}
              <div className="w-full flex flex-col-reverse rounded-sm overflow-hidden" style={{ height: `${Math.max(heightPct, 2)}%`, minHeight: '2px' }}>
                {platforms.map((p) => {
                  const pct = total ? ((counts[p] || 0) / total) * 100 : 0;
                  return pct > 0 ? (
                    <div
                      key={p}
                      style={{ height: `${pct}%`, backgroundColor: PLATFORM_COLORS[p] || PLATFORM_COLORS.default }}
                    />
                  ) : null;
                })}
              </div>

              {/* Day label — show every 5th */}
              <span className="text-slate-600 text-[9px] mt-1 absolute -bottom-4">{days.indexOf(days.find(([d]) => d === day)!) % 5 === 0 ? label : ''}</span>
            </div>
          );
        })}
      </div>
    </div>
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
  const [geoData, setGeoData] = useState<GeoData[]>([]);
  const [volumeData, setVolumeData] = useState<VolumeData[]>([]);
  const [loading, setLoading] = useState(true);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const fetchAll = useCallback(() => {
    Promise.all([
      getStats(), getPlatformBreakdown(), getSentimentOverview(),
      getThreatLevel(), getTopEntities(), getRecentAlerts(10), getTrendingTopics(), getGeoData(), getVolumeTimeline(30),
    ]).then(([s, p, sent, t, e, a, top, geo, vol]) => {
      setStats(s.data);
      setPlatforms(p.data);
      setSentiment(sent.data);
      setThreat(t.data);
      setTopEntities(e.data);
      setAlerts(a.data);
      setTopics(top.data);
      setGeoData(geo.data);
      setVolumeData(vol.data);
      setLastUpdated(new Date());
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  useEffect(() => {
    if (autoRefresh) {
      intervalRef.current = setInterval(fetchAll, 30_000);
    } else if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [autoRefresh, fetchAll]);

  if (loading) {
    return <div className="flex items-center justify-center h-96"><div className="text-slate-400">Loading intelligence data...</div></div>;
  }

  const totalSentiment = sentiment.reduce((a, b) => a + b.count, 0);
  const threatColor = (threat?.average_threat_score || 0) > 0.5 ? 'text-red-400' : (threat?.average_threat_score || 0) > 0.3 ? 'text-yellow-400' : 'text-green-400';

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-white">Intelligence Dashboard</h1>
        <div className="flex items-center gap-4">
          <button
            onClick={() => setAutoRefresh((v) => !v)}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
              autoRefresh
                ? 'bg-emerald-600/20 border-emerald-600/40 text-emerald-400 hover:bg-emerald-600/30'
                : 'bg-slate-800 border-slate-700 text-slate-400 hover:bg-slate-700'
            }`}
          >
            <RefreshCw className={`w-3 h-3 ${autoRefresh ? 'animate-spin' : ''}`} style={autoRefresh ? { animationDuration: '3s' } : {}} />
            Auto-refresh: {autoRefresh ? 'ON' : 'OFF'}
          </button>
          <span className="text-xs text-slate-500">Last updated: {lastUpdated.toLocaleString()}</span>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-5 gap-4">
        <StatCard label="Total Posts" value={stats?.total_posts || 0} icon={Activity} color="bg-blue-600" />
        <StatCard label="Posts (24h)" value={stats?.posts_24h || 0} icon={TrendingUp} color="bg-emerald-600" />
        <StatCard label="Entities Tracked" value={stats?.total_entities || 0} icon={Users} color="bg-purple-600" />
        <StatCard label="Active Alerts" value={stats?.active_alerts || 0} icon={AlertTriangle} color="bg-red-600" />
        <StatCard label="Active Sources" value={stats?.active_sources || 0} icon={Radio} color="bg-amber-600" />
      </div>

      {/* Volume Timeline */}
      <div className="bg-slate-900 rounded-xl p-5 border border-slate-700">
        <h3 className="text-sm text-slate-400 uppercase tracking-wider mb-4">Post Volume — Last 30 Days</h3>
        <VolumeTimeline data={volumeData} />
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

      {/* Geo Intelligence Map */}
      <div className="grid grid-cols-2 gap-6">
        <div className="col-span-2 bg-slate-900 rounded-xl p-5 border border-slate-700">
          <h3 className="text-sm text-slate-400 uppercase tracking-wider mb-4">Geo Intelligence - India Threat Map</h3>
          <GeoMap data={geoData} />
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
