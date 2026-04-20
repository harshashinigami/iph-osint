import { useEffect, useState, useMemo } from 'react';
import { MapContainer, TileLayer, CircleMarker, Tooltip, LayersControl } from 'react-leaflet';
import { Activity, AlertTriangle, Users, Radio, Layers, Shield, Globe, Radar, Wifi, Eye } from 'lucide-react';
import { getGeoData, getStats, getThreatLevel, getRecentAlerts, getTopEntities } from '../api/endpoints';
import type { GeoData, DashboardStats, ThreatLevel, AlertItem, EntityItem } from '../types';

// ─── Marker color by signal count (relative to max) ──────────────────────────
function bucket(count: number, sorted: number[]): 'critical' | 'high' | 'medium' | 'low' {
  if (sorted.length === 0) return 'low';
  const rank = sorted.indexOf(count) / Math.max(1, sorted.length - 1);
  if (rank <= 0.15) return 'critical';
  if (rank <= 0.40) return 'high';
  if (rank <= 0.70) return 'medium';
  return 'low';
}

const COLOR: Record<string, string> = {
  critical: '#ff3355',
  high:     '#ff6b00',
  medium:   '#ffaa00',
  low:      '#00ff88',
};

function FragmentMarkers({ lat, lon, color, radius, label, count, level }: {
  lat: number; lon: number; color: string; radius: number; label: string; count: number; level: string;
}) {
  return (
    <>
      <CircleMarker
        center={[lat, lon]}
        radius={radius + 10}
        pathOptions={{ color, fillColor: color, fillOpacity: 0.08, weight: 0 }}
      />
      <CircleMarker
        center={[lat, lon]}
        radius={radius}
        pathOptions={{ color, fillColor: color, fillOpacity: 0.65, weight: 1.5 }}
      >
        <Tooltip direction="top" offset={[0, -4]} opacity={0.95}>
          <div style={{ fontFamily: 'monospace', fontSize: '11px', lineHeight: '1.6', background: '#0a0a1a', padding: '4px 0' }}>
            <strong style={{ display: 'block', marginBottom: '2px', color: '#00f0ff' }}>{label}</strong>
            <span style={{ color: '#4a5568' }}>SIGNALS: </span>
            <span style={{ fontWeight: 700, color }}>{count.toLocaleString()}</span>
            <div style={{ color, fontSize: '10px', textTransform: 'uppercase', marginTop: '2px' }}>{level}</div>
          </div>
        </Tooltip>
      </CircleMarker>
    </>
  );
}

function SeverityDot({ level }: { level: 'critical' | 'high' | 'medium' | 'low' }) {
  return (
    <span
      className="inline-block w-2 h-2 rounded-full mr-2"
      style={{ background: COLOR[level], boxShadow: `0 0 6px ${COLOR[level]}` }}
    />
  );
}

function SeverityBadge({ severity }: { severity: string }) {
  const colors: Record<string, string> = {
    critical: 'bg-red-500/15 text-red-400 border-red-500/40',
    high:     'bg-orange-500/15 text-orange-400 border-orange-500/40',
    medium:   'bg-yellow-500/15 text-yellow-400 border-yellow-500/40',
    low:      'bg-cyan-500/15 text-cyan-400 border-cyan-500/40',
    info:     'bg-slate-500/15 text-slate-400 border-slate-500/30',
  };
  return (
    <span className={`px-1.5 py-0.5 rounded text-[9px] font-mono font-medium border uppercase tracking-wider ${colors[severity] || colors.info}`}>
      {severity}
    </span>
  );
}

export default function GeoIntelPage() {
  const [geo, setGeo] = useState<GeoData[]>([]);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [threat, setThreat] = useState<ThreatLevel | null>(null);
  const [alerts, setAlerts] = useState<AlertItem[]>([]);
  const [entities, setEntities] = useState<EntityItem[]>([]);
  const [now, setNow] = useState<Date>(new Date());
  const [view3D, setView3D] = useState(false);

  // Active overlay layers (all on by default — visible in the legend panel)
  const [layers, setLayers] = useState({
    threats: true,
    networks: true,
    narratives: true,
    sources: true,
  });

  useEffect(() => {
    Promise.all([
      getGeoData(), getStats(), getThreatLevel(), getRecentAlerts(8), getTopEntities(8),
    ]).then(([g, s, t, a, e]) => {
      setGeo(g.data); setStats(s.data); setThreat(t.data);
      setAlerts(a.data); setEntities(e.data);
    }).catch(() => {});
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  // Aggregate raw geo points by city label (backend returns one row per post)
  const aggregated = useMemo(() => {
    const byCity = new Map<string, { lat: number; lon: number; count: number; label: string }>();
    for (const p of geo) {
      const key = p.label;
      const ex = byCity.get(key);
      if (ex) {
        ex.count += p.count;
        ex.lat = (ex.lat + p.lat) / 2;
        ex.lon = (ex.lon + p.lon) / 2;
      } else {
        byCity.set(key, { lat: p.lat, lon: p.lon, count: p.count, label: p.label });
      }
    }
    return Array.from(byCity.values()).sort((a, b) => b.count - a.count);
  }, [geo]);
  const sortedDesc = useMemo(() => aggregated.map(d => d.count).sort((a, b) => b - a), [aggregated]);
  const maxCount = useMemo(() => aggregated.length ? Math.max(...aggregated.map(d => d.count)) : 0, [aggregated]);
  const threatScore = threat?.average_threat_score || 0;
  const criticalPoints = aggregated.filter(g => bucket(g.count, sortedDesc) === 'critical').length;

  return (
    // break out of AppLayout's p-6
    <div className="-m-6 relative" style={{ height: 'calc(100vh - 48px)', background: '#050510' }}>
      {/* Map */}
      <MapContainer
        center={[22.8, 82]}
        zoom={5}
        style={{ height: '100%', width: '100%', background: '#03030a' }}
        zoomControl={false}
        attributionControl={false}
        worldCopyJump
      >
        <LayersControl position="bottomright">
          <LayersControl.BaseLayer checked={!view3D} name="Dark Tactical">
            <TileLayer
              url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
              subdomains="abcd"
              maxZoom={19}
            />
          </LayersControl.BaseLayer>
          <LayersControl.BaseLayer name="Satellite">
            <TileLayer
              url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
              maxZoom={19}
            />
          </LayersControl.BaseLayer>
        </LayersControl>

        {layers.threats && aggregated.map((p, i) => {
          const level = bucket(p.count, sortedDesc);
          const c = COLOR[level];
          const r = 10 + (maxCount ? (p.count / maxCount) * 18 : 0);
          return (
            <FragmentMarkers
              key={i}
              lat={p.lat} lon={p.lon} color={c} radius={r}
              label={p.label} count={p.count} level={level}
            />
          );
        })}
      </MapContainer>

      {/* ─── TOP BANNER — classification + timestamp ───────────────────────── */}
      <div
        className="absolute top-0 left-0 right-0 flex items-center justify-between px-6 py-2 pointer-events-none z-[1000]"
        style={{
          background: 'linear-gradient(180deg, rgba(5,5,16,0.92) 0%, rgba(5,5,16,0.0) 100%)',
          borderBottom: '1px solid rgba(255,51,85,0.35)',
        }}
      >
        <div className="flex items-center gap-3">
          <Shield className="w-4 h-4" style={{ color: '#ff3355', filter: 'drop-shadow(0 0 6px rgba(255,51,85,0.7))' }} />
          <span className="text-[11px] font-mono font-bold uppercase tracking-[0.2em]" style={{ color: '#ff3355' }}>
            Official Use Only · Classified — Law Enforcement Sensitive
          </span>
        </div>
        <div className="flex items-center gap-4 text-[10px] font-mono uppercase tracking-widest text-cyan-400/70">
          <span>Session: ANL-{now.getTime().toString().slice(-6)}</span>
          <span className="text-cyan-500/40">·</span>
          <span>{now.toISOString().replace('T', ' ').slice(0, 19)} UTC</span>
        </div>
      </div>

      {/* ─── TITLE OVERLAY ─────────────────────────────────────────────────── */}
      <div className="absolute top-12 left-6 z-[999] pointer-events-none">
        <div className="flex items-center gap-2.5 mb-1">
          <Globe className="w-5 h-5" style={{ color: '#00f0ff', filter: 'drop-shadow(0 0 6px rgba(0,240,255,0.7))' }} />
          <h1 className="text-2xl font-bold tracking-tight text-white">
            <span className="text-cyan-400" style={{ textShadow: '0 0 12px rgba(0,240,255,0.6)' }}>GEO-INTEL</span>{' '}
            <span className="text-white/80">COMMAND</span>
          </h1>
        </div>
        <p className="text-[10px] font-mono uppercase tracking-[0.2em] text-cyan-500/60 ml-7">
          India Operating Picture · Threat · Network · Narrative
        </p>
      </div>

      {/* ─── LEFT PANEL — KPI strip + Layers ───────────────────────────────── */}
      <div className="absolute top-28 left-6 z-[999] w-[260px] space-y-3">
        {/* KPI cards */}
        <div className="cyber-card rounded-lg p-3" style={{ background: 'rgba(5,5,16,0.85)' }}>
          <p className="text-[9px] text-cyan-400/60 font-mono uppercase tracking-widest mb-2">Operating Picture</p>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <div className="flex items-center gap-1.5 mb-0.5">
                <Activity className="w-3 h-3 text-cyan-400" />
                <span className="text-[9px] font-mono text-cyan-400/70 uppercase tracking-wider">Posts 24h</span>
              </div>
              <p className="text-lg font-bold font-mono text-white">{(stats?.posts_24h ?? 0).toLocaleString()}</p>
            </div>
            <div>
              <div className="flex items-center gap-1.5 mb-0.5">
                <Users className="w-3 h-3 text-purple-400" />
                <span className="text-[9px] font-mono text-purple-400/70 uppercase tracking-wider">Entities</span>
              </div>
              <p className="text-lg font-bold font-mono text-white">{(stats?.total_entities ?? 0).toLocaleString()}</p>
            </div>
            <div>
              <div className="flex items-center gap-1.5 mb-0.5">
                <AlertTriangle className="w-3 h-3 text-red-400" />
                <span className="text-[9px] font-mono text-red-400/70 uppercase tracking-wider">Active Alerts</span>
              </div>
              <p className="text-lg font-bold font-mono" style={{ color: '#ff3355', textShadow: '0 0 8px rgba(255,51,85,0.5)' }}>
                {(stats?.active_alerts ?? 0).toLocaleString()}
              </p>
            </div>
            <div>
              <div className="flex items-center gap-1.5 mb-0.5">
                <Radio className="w-3 h-3 text-amber-400" />
                <span className="text-[9px] font-mono text-amber-400/70 uppercase tracking-wider">Sources</span>
              </div>
              <p className="text-lg font-bold font-mono text-white">{(stats?.active_sources ?? 0).toLocaleString()}</p>
            </div>
          </div>
          <div className="mt-3 pt-3 border-t border-cyan-500/10">
            <div className="flex items-center justify-between mb-1">
              <span className="text-[9px] font-mono text-cyan-400/60 uppercase tracking-widest">Threat Index</span>
              <span className="text-[9px] font-mono font-bold" style={{
                color: threatScore > 0.5 ? '#ff3355' : threatScore > 0.3 ? '#ffaa00' : '#00ff88',
              }}>
                {(threatScore * 100).toFixed(0)} / 100
              </span>
            </div>
            <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-700"
                style={{
                  width: `${threatScore * 100}%`,
                  background: threatScore > 0.5
                    ? 'linear-gradient(90deg, #ff3355 0%, #ff6b00 100%)'
                    : threatScore > 0.3
                      ? 'linear-gradient(90deg, #ffaa00 0%, #ff6b00 100%)'
                      : 'linear-gradient(90deg, #00ff88 0%, #00f0ff 100%)',
                  boxShadow: `0 0 8px ${threatScore > 0.5 ? '#ff3355' : threatScore > 0.3 ? '#ffaa00' : '#00ff88'}`,
                }}
              />
            </div>
            <p className="text-[9px] font-mono text-red-400/80 mt-1.5">
              {threat?.high_threat_posts ?? 0} HIGH-THREAT POSTS · {criticalPoints} CRITICAL GEO-ZONES
            </p>
          </div>
        </div>

        {/* Layer controls */}
        <div className="cyber-card rounded-lg p-3" style={{ background: 'rgba(5,5,16,0.85)' }}>
          <div className="flex items-center gap-1.5 mb-2">
            <Layers className="w-3 h-3 text-cyan-400" />
            <span className="text-[9px] font-mono text-cyan-400/70 uppercase tracking-widest">Intel Layers</span>
          </div>
          {[
            { key: 'threats',    label: 'Threat Signals',    color: '#ff3355', icon: AlertTriangle },
            { key: 'networks',   label: 'Network Clusters',  color: '#bf5fff', icon: Radar },
            { key: 'narratives', label: 'Narrative Tracks',  color: '#00f0ff', icon: Wifi },
            { key: 'sources',    label: 'Source Footprint',  color: '#00ff88', icon: Eye },
          ].map(({ key, label, color, icon: Icon }) => {
            const on = layers[key as keyof typeof layers];
            return (
              <button
                key={key}
                onClick={() => setLayers(l => ({ ...l, [key]: !l[key as keyof typeof l] }))}
                className="w-full flex items-center justify-between py-1.5 px-1 rounded transition-colors hover:bg-cyan-500/5"
              >
                <div className="flex items-center gap-2">
                  <Icon className="w-3 h-3" style={{ color: on ? color : 'rgba(255,255,255,0.25)', filter: on ? `drop-shadow(0 0 4px ${color})` : 'none' }} />
                  <span className="text-[10px] font-mono" style={{ color: on ? 'rgba(255,255,255,0.85)' : 'rgba(255,255,255,0.3)' }}>
                    {label}
                  </span>
                </div>
                <span
                  className="w-7 h-3.5 rounded-full relative transition-colors"
                  style={{ background: on ? color : 'rgba(255,255,255,0.1)', boxShadow: on ? `0 0 6px ${color}` : 'none' }}
                >
                  <span
                    className="absolute top-0.5 w-2.5 h-2.5 rounded-full bg-white transition-all"
                    style={{ left: on ? '14px' : '2px' }}
                  />
                </span>
              </button>
            );
          })}
        </div>

        {/* 2D/3D toggle */}
        <div className="cyber-card rounded-lg p-2 flex items-center gap-1" style={{ background: 'rgba(5,5,16,0.85)' }}>
          {(['2D', '3D'] as const).map(m => {
            const active = (m === '3D') === view3D;
            return (
              <button
                key={m}
                onClick={() => setView3D(m === '3D')}
                className="flex-1 py-1.5 rounded text-[10px] font-mono font-bold uppercase tracking-widest transition-all"
                style={{
                  background: active ? 'rgba(0,240,255,0.15)' : 'transparent',
                  border: active ? '1px solid rgba(0,240,255,0.5)' : '1px solid transparent',
                  color: active ? '#00f0ff' : 'rgba(255,255,255,0.35)',
                  boxShadow: active ? '0 0 8px rgba(0,240,255,0.25)' : 'none',
                }}
              >
                {m} {m === '3D' && <span className="text-[8px] opacity-60 ml-0.5">· beta</span>}
              </button>
            );
          })}
        </div>
      </div>

      {/* ─── RIGHT PANEL — Live threat feed ────────────────────────────────── */}
      <div
        className="absolute top-12 right-6 z-[999] w-[340px] cyber-card rounded-lg"
        style={{ background: 'rgba(5,5,16,0.88)', maxHeight: 'calc(100vh - 120px)' }}
      >
        <div className="p-3 border-b border-cyan-500/15 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-red-500 pulse-dot-green" style={{ animation: 'pulse-glow 1s ease-in-out infinite', boxShadow: '0 0 6px #ff3355' }} />
            <span className="text-[10px] font-mono font-bold uppercase tracking-widest text-red-400">Live Threat Feed</span>
          </div>
          <span className="text-[9px] font-mono text-cyan-500/50">{alerts.length} active</span>
        </div>
        <div className="p-3 space-y-2 overflow-y-auto" style={{ maxHeight: 'calc(100vh - 170px)' }}>
          {alerts.slice(0, 8).map(a => (
            <div key={a.id} className="pb-2 border-b border-cyan-500/8 last:border-0">
              <div className="flex items-center gap-2 mb-1">
                <SeverityBadge severity={a.severity} />
                <span className="text-[9px] font-mono text-cyan-500/50">
                  {new Date(a.created_at).toLocaleString('en-GB', { hour12: false }).slice(-8)}
                </span>
              </div>
              <p className="text-[11px] text-white/85 leading-snug line-clamp-2">{a.title}</p>
            </div>
          ))}
        </div>
      </div>

      {/* ─── BOTTOM RIGHT — Top entities strip ─────────────────────────────── */}
      <div
        className="absolute bottom-4 right-6 z-[999] w-[340px] cyber-card rounded-lg p-3"
        style={{ background: 'rgba(5,5,16,0.88)' }}
      >
        <div className="flex items-center gap-2 mb-2">
          <Users className="w-3 h-3 text-purple-400" />
          <span className="text-[10px] font-mono font-bold uppercase tracking-widest text-purple-400">Top Surveilled Entities</span>
        </div>
        <div className="space-y-1.5">
          {entities.slice(0, 5).map(e => (
            <div key={e.id} className="flex items-center justify-between">
              <div className="flex items-center gap-2 min-w-0">
                <span className="text-[8px] px-1.5 py-0.5 rounded bg-purple-500/15 border border-purple-500/30 text-purple-300 font-mono uppercase">
                  {e.entity_type}
                </span>
                <span className="text-[10px] text-white/80 truncate font-mono">{e.display_name || e.value}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="text-[9px] font-mono text-cyan-500/60">{e.mention_count}</span>
                <span
                  className="w-1.5 h-1.5 rounded-full"
                  style={{
                    background: e.risk_score > 0.7 ? '#ff3355' : e.risk_score > 0.4 ? '#ffaa00' : '#00ff88',
                    boxShadow: `0 0 4px ${e.risk_score > 0.7 ? '#ff3355' : e.risk_score > 0.4 ? '#ffaa00' : '#00ff88'}`,
                  }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ─── BOTTOM LEFT — Legend ──────────────────────────────────────────── */}
      <div
        className="absolute bottom-4 left-6 z-[999] cyber-card rounded-lg px-3 py-2 flex items-center gap-4"
        style={{ background: 'rgba(5,5,16,0.88)' }}
      >
        <span className="text-[9px] font-mono text-cyan-400/60 uppercase tracking-widest">Severity</span>
        <div className="flex items-center gap-3">
          <span className="text-[10px] font-mono text-white/70 flex items-center"><SeverityDot level="critical" />Critical</span>
          <span className="text-[10px] font-mono text-white/70 flex items-center"><SeverityDot level="high" />High</span>
          <span className="text-[10px] font-mono text-white/70 flex items-center"><SeverityDot level="medium" />Medium</span>
          <span className="text-[10px] font-mono text-white/70 flex items-center"><SeverityDot level="low" />Low</span>
        </div>
      </div>
    </div>
  );
}
