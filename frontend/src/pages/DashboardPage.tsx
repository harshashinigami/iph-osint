import { useEffect, useState, useRef, useCallback } from 'react';
import { Activity, Users, AlertTriangle, Radio, TrendingUp, RefreshCw } from 'lucide-react';
import { getStats, getPlatformBreakdown, getSentimentOverview, getThreatLevel, getTopEntities, getRecentAlerts, getTrendingTopics, getGeoData, getVolumeTimeline } from '../api/endpoints';
import type { DashboardStats, PlatformData, SentimentData, ThreatLevel, EntityItem, AlertItem, TopicData, GeoData, VolumeData } from '../types';
import GeoMap from '../components/dashboard/GeoMap';

const PLATFORM_COLORS: Record<string, string> = {
  rss: '#00f0ff',
  telegram: '#00ff88',
  twitter: '#bf5fff',
  reddit: '#ffaa00',
  default: '#4a5568',
};

// neon glow class per stat card type
const STAT_GLOW: Record<string, { icon: string; glow: string; border: string }> = {
  blue:    { icon: 'bg-cyan-500/15 border border-cyan-500/30',  glow: 'glow-cyan',  border: 'border-cyan-500/20' },
  emerald: { icon: 'bg-green-500/15 border border-green-500/30', glow: 'glow-green', border: 'border-green-500/20' },
  purple:  { icon: 'bg-purple-500/15 border border-purple-500/30', glow: '',         border: 'border-purple-500/20' },
  red:     { icon: 'bg-red-500/15 border border-red-500/30',    glow: 'glow-red',   border: 'border-red-500/20' },
  amber:   { icon: 'bg-amber-500/15 border border-amber-500/30', glow: 'glow-amber', border: 'border-amber-500/20' },
};

function StatCard({ label, value, icon: Icon, colorKey }: { label: string; value: number | string; icon: React.ElementType; colorKey: string }) {
  const theme = STAT_GLOW[colorKey] || STAT_GLOW.blue;
  return (
    <div className={`cyber-card rounded-xl p-4 ${theme.glow} transition-all duration-300 hover:scale-[1.02]`}>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-[10px] text-cyan-400/70 uppercase tracking-widest font-mono">{label}</p>
          <p className="text-2xl font-bold text-white mt-1 font-mono tracking-tight">
            {typeof value === 'number' ? value.toLocaleString() : value}
          </p>
        </div>
        <div className={`p-3 rounded-lg ${theme.icon}`}>
          <Icon className="w-5 h-5 text-cyan-300" />
        </div>
      </div>
    </div>
  );
}

function SeverityBadge({ severity }: { severity: string }) {
  const colors: Record<string, string> = {
    critical: 'bg-red-500/15 text-red-400 border-red-500/40 shadow-[0_0_8px_rgba(255,51,85,0.3)]',
    high:     'bg-orange-500/15 text-orange-400 border-orange-500/40',
    medium:   'bg-yellow-500/15 text-yellow-400 border-yellow-500/40',
    low:      'bg-cyan-500/15 text-cyan-400 border-cyan-500/40',
    info:     'bg-slate-500/15 text-slate-400 border-slate-500/30',
  };
  return (
    <span className={`px-2 py-0.5 rounded text-xs font-mono font-medium border ${colors[severity] || colors.info}`}>
      {severity}
    </span>
  );
}

function VolumeTimeline({ data }: { data: VolumeData[] }) {
  if (!data.length) {
    return <div className="h-32 flex items-center justify-center text-cyan-500/40 text-sm font-mono">NO VOLUME DATA</div>;
  }

  const dayMap = new Map<string, Record<string, number>>();
  const platformSet = new Set<string>();

  for (const item of data) {
    platformSet.add(item.platform);
    if (!dayMap.has(item.day)) dayMap.set(item.day, {});
    dayMap.get(item.day)![item.platform] = item.count;
  }

  const days = Array.from(dayMap.entries()).sort(([a], [b]) => a.localeCompare(b));
  const platforms = Array.from(platformSet);
  const maxTotal = Math.max(...days.map(([, counts]) => Object.values(counts).reduce((a, b) => a + b, 0)));

  return (
    <div>
      {/* Legend */}
      <div className="flex items-center gap-4 mb-3">
        {platforms.map((p) => (
          <div key={p} className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded-sm" style={{ backgroundColor: PLATFORM_COLORS[p] || PLATFORM_COLORS.default }} />
            <span className="text-[10px] text-cyan-400/60 uppercase tracking-wider font-mono">{p}</span>
          </div>
        ))}
      </div>

      {/* Bar chart */}
      <div className="flex items-end gap-1 h-28 overflow-x-auto pb-5 relative">
        {days.map(([day, counts]) => {
          const total = Object.values(counts).reduce((a, b) => a + b, 0);
          const heightPct = maxTotal ? (total / maxTotal) * 100 : 0;
          const label = day.slice(5);

          return (
            <div key={day} className="flex flex-col items-center flex-1 min-w-[24px] group relative">
              {/* Tooltip */}
              <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 bg-black/90 border border-cyan-500/30 rounded px-2 py-1 text-xs text-white whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity z-10 pointer-events-none font-mono">
                <div className="font-medium mb-0.5 text-cyan-400">{day}</div>
                {platforms.map((p) => counts[p] ? (
                  <div key={p} className="flex items-center gap-1">
                    <div className="w-2 h-2 rounded-sm" style={{ backgroundColor: PLATFORM_COLORS[p] || PLATFORM_COLORS.default }} />
                    <span className="capitalize text-slate-300">{p}: {counts[p]}</span>
                  </div>
                ) : null)}
                <div className="text-cyan-400/60 border-t border-cyan-500/20 mt-0.5 pt-0.5">Total: {total}</div>
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

              <span className="text-cyan-600/50 text-[9px] mt-1 absolute -bottom-4 font-mono">
                {days.indexOf(days.find(([d]) => d === day)!) % 5 === 0 ? label : ''}
              </span>
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

  useEffect(() => { fetchAll(); }, [fetchAll]);

  useEffect(() => {
    if (autoRefresh) {
      intervalRef.current = setInterval(fetchAll, 30_000);
    } else if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [autoRefresh, fetchAll]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-cyan-400/60 font-mono text-sm tracking-widest animate-pulse">
          LOADING INTELLIGENCE DATA...
        </div>
      </div>
    );
  }

  const score = threat?.average_threat_score || 0;
  const threatTextClass = score > 0.5
    ? 'text-red-400 text-glow-red'
    : score > 0.3
      ? 'text-amber-400 text-glow-amber'
      : 'text-green-400 text-glow-green';

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-white tracking-tight">
          <span className="text-cyan-400 text-glow-cyan">INTEL</span> DASHBOARD
        </h1>
        <div className="flex items-center gap-4">
          <button
            onClick={() => setAutoRefresh((v) => !v)}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-mono font-medium border transition-all ${
              autoRefresh
                ? 'bg-green-500/10 border-green-500/40 text-green-400 hover:bg-green-500/20 pulse-dot-green shadow-[0_0_12px_rgba(0,255,136,0.2)]'
                : 'bg-black/40 border-cyan-500/20 text-cyan-500/50 hover:border-cyan-500/40'
            }`}
          >
            <RefreshCw className={`w-3 h-3 ${autoRefresh ? 'animate-spin' : ''}`} style={autoRefresh ? { animationDuration: '3s' } : {}} />
            Auto-refresh: {autoRefresh ? 'ON' : 'OFF'}
          </button>
          <span className="text-[10px] text-cyan-500/40 font-mono">
            LAST SYNC: {lastUpdated.toLocaleString()}
          </span>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-5 gap-4">
        <StatCard label="Total Posts"      value={stats?.total_posts || 0}    icon={Activity}      colorKey="blue" />
        <StatCard label="Posts (24h)"      value={stats?.posts_24h || 0}      icon={TrendingUp}    colorKey="emerald" />
        <StatCard label="Entities Tracked" value={stats?.total_entities || 0} icon={Users}         colorKey="purple" />
        <StatCard label="Active Alerts"    value={stats?.active_alerts || 0}  icon={AlertTriangle} colorKey="red" />
        <StatCard label="Active Sources"   value={stats?.active_sources || 0} icon={Radio}         colorKey="amber" />
      </div>

      {/* Volume Timeline */}
      <div className="cyber-card rounded-xl p-5">
        <h3 className="text-[10px] text-cyan-400/70 uppercase tracking-widest mb-4 font-mono">
          Post Volume — Last 30 Days
        </h3>
        <VolumeTimeline data={volumeData} />
      </div>

      <div className="grid grid-cols-3 gap-6">
        {/* Threat Level */}
        <div className="cyber-card rounded-xl p-5">
          <h3 className="text-[10px] text-cyan-400/70 uppercase tracking-widest mb-4 font-mono">Threat Level</h3>
          <div className="text-center">
            <p className={`text-6xl font-bold font-mono ${threatTextClass}`}>
              {((score) * 100).toFixed(0)}
            </p>
            <p className="text-[10px] text-cyan-500/40 mt-1 font-mono uppercase tracking-widest">
              Avg Threat Score
            </p>
            <p className="text-sm text-red-400 mt-3 font-mono">
              {threat?.high_threat_posts || 0}
              <span className="text-red-400/60 ml-1 text-xs">HIGH-THREAT POSTS</span>
            </p>
          </div>
        </div>

        {/* Platform Breakdown */}
        <div className="cyber-card rounded-xl p-5">
          <h3 className="text-[10px] text-cyan-400/70 uppercase tracking-widest mb-4 font-mono">Platform Distribution</h3>
          <div className="space-y-2">
            {platforms.slice(0, 6).map((p) => {
              const total = platforms.reduce((a, b) => a + b.count, 0);
              const pct = total ? ((p.count / total) * 100).toFixed(0) : 0;
              const col = PLATFORM_COLORS[p.platform] || PLATFORM_COLORS.default;
              return (
                <div key={p.platform} className="flex items-center gap-3">
                  <span className="text-[10px] text-cyan-400/60 w-20 capitalize font-mono">{p.platform}</span>
                  <div className="flex-1 h-1.5 bg-white/5 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-700"
                      style={{ width: `${pct}%`, backgroundColor: col, boxShadow: `0 0 6px ${col}` }}
                    />
                  </div>
                  <span className="text-xs text-cyan-300/80 w-12 text-right font-mono">{p.count.toLocaleString()}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Sentiment Overview */}
        <div className="cyber-card rounded-xl p-5">
          <h3 className="text-[10px] text-cyan-400/70 uppercase tracking-widest mb-4 font-mono">Sentiment Analysis</h3>
          <div className="space-y-3">
            {sentiment.map((s) => {
              const pct = (sentiment.reduce((a, b) => a + b.count, 0))
                ? ((s.count / sentiment.reduce((a, b) => a + b.count, 0)) * 100).toFixed(0)
                : 0;
              const isPos = s.label.includes('positive');
              const isNeg = s.label.includes('negative');
              const barColor = isPos ? '#00ff88' : isNeg ? '#ff3355' : '#4a5568';
              const barGlow  = isPos ? '0 0 6px #00ff88' : isNeg ? '0 0 6px #ff3355' : 'none';
              return (
                <div key={s.label} className="flex items-center gap-3">
                  <span className="text-[10px] text-cyan-400/60 w-24 capitalize font-mono">{s.label.replace('_', ' ')}</span>
                  <div className="flex-1 h-1.5 bg-white/5 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-700"
                      style={{ width: `${pct}%`, backgroundColor: barColor, boxShadow: barGlow }}
                    />
                  </div>
                  <span className="text-xs text-cyan-300/80 w-10 text-right font-mono">{pct}%</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-6">
        {/* Top Entities */}
        <div className="cyber-card rounded-xl p-5">
          <h3 className="text-[10px] text-cyan-400/70 uppercase tracking-widest mb-4 font-mono">Top Entities</h3>
          <div className="space-y-2">
            {topEntities.map((e) => (
              <div key={e.id} className="flex items-center justify-between py-1.5 border-b border-cyan-500/8 last:border-0">
                <div className="flex items-center gap-3">
                  <span className="text-[10px] px-2 py-0.5 rounded bg-cyan-500/10 border border-cyan-500/20 text-cyan-400/80 capitalize font-mono">
                    {e.entity_type}
                  </span>
                  <span className="text-sm text-white/90">{e.display_name || e.value}</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-[10px] text-cyan-400/50 font-mono">{e.mention_count} hits</span>
                  <div className={`w-2 h-2 rounded-full ${
                    e.risk_score > 0.7 ? 'bg-red-500 shadow-[0_0_6px_#ff3355]'
                    : e.risk_score > 0.4 ? 'bg-amber-500 shadow-[0_0_6px_#ffaa00]'
                    : 'bg-green-400 shadow-[0_0_6px_#00ff88]'
                  }`} />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Alerts */}
        <div className="cyber-card rounded-xl p-5">
          <h3 className="text-[10px] text-cyan-400/70 uppercase tracking-widest mb-4 font-mono">Recent Alerts</h3>
          <div className="space-y-2">
            {alerts.map((a) => (
              <div key={a.id} className="flex items-start gap-3 py-2 border-b border-cyan-500/8 last:border-0">
                <SeverityBadge severity={a.severity} />
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-white/90 truncate">{a.title}</p>
                  <p className="text-[10px] text-cyan-500/40 font-mono mt-0.5">
                    {new Date(a.created_at).toLocaleString()}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Geo Intelligence Map */}
      <div className="grid grid-cols-2 gap-6">
        <div className="col-span-2 cyber-card rounded-xl p-5">
          <h3 className="text-[10px] text-cyan-400/70 uppercase tracking-widest mb-4 font-mono">
            Geo Intelligence — India Threat Map
          </h3>
          <GeoMap data={geoData} />
        </div>
      </div>

      {/* Trending Topics */}
      <div className="cyber-card rounded-xl p-5">
        <h3 className="text-[10px] text-cyan-400/70 uppercase tracking-widest mb-4 font-mono">Trending Topics</h3>
        <div className="flex flex-wrap gap-2">
          {topics.map((t) => (
            <span
              key={t.topic}
              className="px-3 py-1.5 bg-cyan-500/8 border border-cyan-500/20 rounded-full text-sm text-cyan-300/80 hover:bg-cyan-500/15 hover:border-cyan-500/40 hover:text-cyan-200 cursor-pointer transition-all font-mono"
            >
              {t.topic}
              <span className="text-cyan-500/40 ml-1.5 text-xs">{t.count}</span>
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
