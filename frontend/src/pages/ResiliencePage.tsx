import { Shield, Globe, RefreshCw, Wifi, CheckCircle2, AlertCircle, TrendingUp, Lock, Zap } from 'lucide-react';

interface Block {
  time: string;
  platform: string;
  block_type: string;
  severity: 'low' | 'medium' | 'high';
  detection: string;
  recovery_action: string;
  status: 'recovered' | 'mitigating' | 'failed';
  recovery_time: string;
}

const BLOCKS: Block[] = [
  { time: '2026-04-20 08:52Z', platform: 'Twitter/X',   block_type: 'Rate limit exceeded (v2 recent)',       severity: 'medium', detection: '429 response · 50 req/15min',         recovery_action: 'Token rotation · backoff 2m',      status: 'recovered',   recovery_time: '2m 14s' },
  { time: '2026-04-20 08:47Z', platform: 'Instagram',   block_type: 'IP-based block (graph endpoint)',       severity: 'high',   detection: '403 + challenge redirect',            recovery_action: 'VPN failover → IN-exit-04',        status: 'recovered',   recovery_time: '38s' },
  { time: '2026-04-20 08:42Z', platform: 'Telegram',    block_type: 'FLOOD_WAIT (28s)',                      severity: 'low',    detection: 'FloodWaitError',                      recovery_action: 'async sleep · resume',              status: 'recovered',   recovery_time: '28s' },
  { time: '2026-04-20 08:38Z', platform: 'Facebook',    block_type: 'Graph API deprecation (v16 → v18)',     severity: 'high',   detection: 'Schema validation failed',            recovery_action: 'Hot-swap to v18 connector',        status: 'recovered',   recovery_time: '4m 12s' },
  { time: '2026-04-20 08:31Z', platform: 'Reddit',      block_type: 'User-agent fingerprint ban',            severity: 'medium', detection: 'HTTP 403 with cloudflare banner',    recovery_action: 'UA rotation + new session',        status: 'recovered',   recovery_time: '1m 47s' },
  { time: '2026-04-20 08:22Z', platform: 'TikTok',      block_type: 'Anti-bot captcha wall',                 severity: 'medium', detection: 'Browser detected · captcha served',  recovery_action: 'Playwright fingerprint rotation',  status: 'recovered',   recovery_time: '3m 22s' },
  { time: '2026-04-20 08:14Z', platform: 'Twitter/X',   block_type: 'IP range block (scrape endpoint)',      severity: 'high',   detection: '407 + Cloudflare challenge',          recovery_action: 'Residential proxy pool',            status: 'recovered',   recovery_time: '2m 01s' },
  { time: '2026-04-20 07:58Z', platform: 'Facebook',    block_type: 'Token invalidation',                    severity: 'medium', detection: 'OAuth token expired',                 recovery_action: 'Refresh + re-auth (automated)',    status: 'recovered',   recovery_time: '58s' },
  { time: '2026-04-20 07:52Z', platform: 'Twitter/X',   block_type: 'Rate limit exceeded',                   severity: 'low',    detection: '429 response',                        recovery_action: 'Token rotation',                    status: 'recovered',   recovery_time: '48s' },
  { time: '2026-04-20 07:47Z', platform: 'Instagram',   block_type: 'Story graph endpoint intermittent',     severity: 'low',    detection: '502 bad gateway',                    recovery_action: 'Retry with jitter',                 status: 'recovered',   recovery_time: '12s' },
];

interface VPN {
  name: string;
  country: string;
  flag: string;
  ip_cidr: string;
  load: number;
  latency_ms: number;
  status: 'healthy' | 'throttled' | 'degraded' | 'offline';
}

const VPNS: VPN[] = [
  { name: 'IN-exit-01', country: 'India',       flag: '🇮🇳', ip_cidr: '103.22.200.0/24', load: 42, latency_ms: 28,  status: 'healthy' },
  { name: 'IN-exit-02', country: 'India',       flag: '🇮🇳', ip_cidr: '103.22.201.0/24', load: 58, latency_ms: 34,  status: 'healthy' },
  { name: 'IN-exit-03', country: 'India',       flag: '🇮🇳', ip_cidr: '103.22.202.0/24', load: 72, latency_ms: 41,  status: 'throttled' },
  { name: 'IN-exit-04', country: 'India',       flag: '🇮🇳', ip_cidr: '103.22.203.0/24', load: 31, latency_ms: 26,  status: 'healthy' },
  { name: 'SG-exit-01', country: 'Singapore',   flag: '🇸🇬', ip_cidr: '172.65.80.0/24',  load: 44, latency_ms: 78,  status: 'healthy' },
  { name: 'SG-exit-02', country: 'Singapore',   flag: '🇸🇬', ip_cidr: '172.65.81.0/24',  load: 68, latency_ms: 82,  status: 'healthy' },
  { name: 'DE-exit-01', country: 'Germany',     flag: '🇩🇪', ip_cidr: '185.220.100.0/24', load: 18, latency_ms: 168, status: 'healthy' },
  { name: 'US-exit-01', country: 'USA',         flag: '🇺🇸', ip_cidr: '104.21.18.0/24',  load: 54, latency_ms: 214, status: 'healthy' },
  { name: 'US-exit-02', country: 'USA',         flag: '🇺🇸', ip_cidr: '104.21.19.0/24',  load: 88, latency_ms: 298, status: 'degraded' },
  { name: 'NL-exit-01', country: 'Netherlands', flag: '🇳🇱', ip_cidr: '195.85.159.0/24', load: 36, latency_ms: 184, status: 'healthy' },
  { name: 'JP-exit-01', country: 'Japan',       flag: '🇯🇵', ip_cidr: '133.242.0.0/24',  load: 22, latency_ms: 122, status: 'healthy' },
  { name: 'AU-exit-01', country: 'Australia',   flag: '🇦🇺', ip_cidr: '203.29.48.0/24',  load: 0,  latency_ms: 0,   status: 'offline' },
];

// 7-day recovery-vs-block trend (simulated)
const TREND = [
  { day: 'Mon', blocks: 47, recovered: 47 },
  { day: 'Tue', blocks: 52, recovered: 51 },
  { day: 'Wed', blocks: 38, recovered: 38 },
  { day: 'Thu', blocks: 64, recovered: 62 },
  { day: 'Fri', blocks: 72, recovered: 71 },
  { day: 'Sat', blocks: 41, recovered: 41 },
  { day: 'Sun', blocks: 58, recovered: 58 },
];

function SeverityPill({ s }: { s: string }) {
  const styles: Record<string, string> = {
    low:    'bg-cyan-500/15 text-cyan-400 border-cyan-500/40',
    medium: 'bg-amber-500/15 text-amber-400 border-amber-500/40',
    high:   'bg-red-500/15 text-red-400 border-red-500/40',
  };
  return <span className={`px-1.5 py-0.5 rounded text-[9px] font-mono font-bold border uppercase tracking-widest ${styles[s]}`}>{s}</span>;
}

function StatusPill({ s }: { s: string }) {
  const styles: Record<string, string> = {
    recovered:  'bg-green-500/15 text-green-400 border-green-500/40',
    mitigating: 'bg-amber-500/15 text-amber-400 border-amber-500/40',
    failed:     'bg-red-500/15 text-red-400 border-red-500/40',
    healthy:    'bg-green-500/15 text-green-400 border-green-500/40',
    throttled:  'bg-amber-500/15 text-amber-400 border-amber-500/40',
    degraded:   'bg-orange-500/15 text-orange-400 border-orange-500/40',
    offline:    'bg-red-500/15 text-red-400 border-red-500/40',
  };
  return <span className={`px-1.5 py-0.5 rounded text-[9px] font-mono font-bold border uppercase tracking-widest ${styles[s]}`}>{s}</span>;
}

export default function ResiliencePage() {
  const maxTrend = Math.max(...TREND.map(t => t.blocks));
  const totalBlocks24h = 47;
  const totalRecovered = 46;
  const recoveryRate = ((totalRecovered / totalBlocks24h) * 100).toFixed(1);

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2.5 mb-0.5">
            <Shield className="w-5 h-5 text-cyan-400" style={{ filter: 'drop-shadow(0 0 6px rgba(0,240,255,0.7))' }} />
            <h1 className="text-2xl font-bold tracking-tight">
              <span className="text-cyan-400 text-glow-cyan">CRAWLER</span>{' '}
              <span className="text-white">RESILIENCE CENTER</span>
            </h1>
          </div>
          <p className="text-[11px] font-mono uppercase tracking-[0.2em] text-cyan-500/60 ml-7">
            Block detection · auto-failover · proxy pool · rate-limit orchestration
          </p>
        </div>
        <div className="flex items-center gap-3 text-[10px] font-mono uppercase tracking-widest">
          <span className="text-cyan-500/50">Recovery Rate 24h:</span>
          <span className="text-green-400 font-bold text-xs">{recoveryRate}%</span>
          <span className="text-cyan-500/30 mx-1">·</span>
          <span className="text-cyan-500/50">Avg MTTR:</span>
          <span className="text-green-400 font-bold text-xs">1m 42s</span>
        </div>
      </div>

      {/* KPI Strip */}
      <div className="grid grid-cols-5 gap-3">
        <div className="cyber-card rounded-lg p-3 glow-red">
          <div className="flex items-center justify-between mb-1">
            <span className="text-[9px] font-mono text-red-400/80 uppercase tracking-widest">Blocks 24h</span>
            <AlertCircle className="w-4 h-4 text-red-400" />
          </div>
          <p className="text-2xl font-bold font-mono" style={{ color: '#ff3355' }}>{totalBlocks24h}</p>
          <p className="text-[9px] font-mono text-red-400/60">Across 6 platforms</p>
        </div>
        <div className="cyber-card rounded-lg p-3 glow-green">
          <div className="flex items-center justify-between mb-1">
            <span className="text-[9px] font-mono text-green-400/80 uppercase tracking-widest">Auto-Recovered</span>
            <CheckCircle2 className="w-4 h-4 text-green-400" />
          </div>
          <p className="text-2xl font-bold font-mono text-green-400">{totalRecovered}</p>
          <p className="text-[9px] font-mono text-green-400/60">{recoveryRate}% success rate</p>
        </div>
        <div className="cyber-card rounded-lg p-3 glow-cyan">
          <div className="flex items-center justify-between mb-1">
            <span className="text-[9px] font-mono text-cyan-400/70 uppercase tracking-widest">VPN Pool</span>
            <Globe className="w-4 h-4 text-cyan-400" />
          </div>
          <p className="text-2xl font-bold font-mono text-white">{VPNS.filter(v => v.status === 'healthy').length}/{VPNS.length}</p>
          <p className="text-[9px] font-mono text-cyan-500/60">Healthy exit nodes</p>
        </div>
        <div className="cyber-card rounded-lg p-3 glow-amber">
          <div className="flex items-center justify-between mb-1">
            <span className="text-[9px] font-mono text-amber-400/80 uppercase tracking-widest">UA Rotation</span>
            <RefreshCw className="w-4 h-4 text-amber-400" />
          </div>
          <p className="text-2xl font-bold font-mono text-amber-300">1,247</p>
          <p className="text-[9px] font-mono text-amber-400/60">Rotations in 24h</p>
        </div>
        <div className="cyber-card rounded-lg p-3">
          <div className="flex items-center justify-between mb-1">
            <span className="text-[9px] font-mono text-cyan-400/70 uppercase tracking-widest">API Adapters</span>
            <Zap className="w-4 h-4 text-cyan-400" />
          </div>
          <p className="text-2xl font-bold font-mono text-white">14</p>
          <p className="text-[9px] font-mono text-cyan-500/50">Active connectors</p>
        </div>
      </div>

      {/* Block types breakdown */}
      <div className="cyber-card rounded-lg p-4">
        <div className="flex items-center gap-2 mb-3">
          <Lock className="w-4 h-4 text-cyan-400" />
          <span className="text-[10px] font-mono text-cyan-400/70 uppercase tracking-widest">
            Block Type Distribution (24h) · Platform-specific mitigation
          </span>
        </div>
        <div className="grid grid-cols-4 gap-3">
          {[
            { type: 'Rate Limit (HTTP 429)',         count: 18, color: '#00f0ff', pct: 38, mitigation: 'Token rotation + exponential backoff' },
            { type: 'IP Block (403/CF challenge)',   count: 11, color: '#ff6b00', pct: 23, mitigation: 'VPN failover + residential proxy' },
            { type: 'FLOOD_WAIT (Telegram)',         count: 8,  color: '#00ff88', pct: 17, mitigation: 'Async sleep + resume' },
            { type: 'Bot detection (captcha)',       count: 5,  color: '#ffaa00', pct: 11, mitigation: 'Playwright fingerprint rotation' },
            { type: 'OAuth token expiry',            count: 3,  color: '#bf5fff', pct: 6,  mitigation: 'Automated refresh' },
            { type: 'API schema change',             count: 1,  color: '#ff3355', pct: 2,  mitigation: 'Hot-swap adapter · version pinning' },
            { type: 'UA fingerprint ban',            count: 1,  color: '#eab308', pct: 2,  mitigation: 'UA rotation + session reset' },
          ].map(b => (
            <div key={b.type} className="rounded p-2 text-[10px] font-mono"
              style={{ background: 'rgba(0,240,255,0.03)', borderLeft: `3px solid ${b.color}` }}>
              <div className="flex items-center justify-between">
                <span className="text-white/85">{b.type}</span>
                <span className="font-bold" style={{ color: b.color }}>{b.count} · {b.pct}%</span>
              </div>
              <p className="text-cyan-500/50 text-[9px] mt-0.5">→ {b.mitigation}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-12 gap-4">
        {/* Trend chart */}
        <div className="col-span-5 cyber-card rounded-lg p-4">
          <div className="flex items-center gap-2 mb-3">
            <TrendingUp className="w-4 h-4 text-cyan-400" />
            <span className="text-[10px] font-mono text-cyan-400/70 uppercase tracking-widest">
              Block vs Recovery — 7d
            </span>
          </div>
          <div className="flex items-end gap-2 h-40">
            {TREND.map(t => {
              const bh = (t.blocks / maxTrend) * 100;
              const rh = (t.recovered / maxTrend) * 100;
              return (
                <div key={t.day} className="flex-1 flex flex-col items-center gap-0.5">
                  <div className="relative w-full" style={{ height: '85%' }}>
                    <div className="absolute bottom-0 w-full rounded-sm"
                      style={{ height: `${bh}%`, background: '#ff3355', opacity: 0.3, boxShadow: '0 0 4px #ff3355' }} />
                    <div className="absolute bottom-0 w-full rounded-sm"
                      style={{ height: `${rh}%`, background: '#00ff88', opacity: 0.7, boxShadow: '0 0 4px #00ff88' }} />
                  </div>
                  <span className="text-[9px] font-mono text-cyan-500/50">{t.day}</span>
                  <span className="text-[8px] font-mono text-white/60">{t.recovered}/{t.blocks}</span>
                </div>
              );
            })}
          </div>
          <div className="flex items-center gap-3 text-[9px] font-mono mt-2">
            <span className="flex items-center gap-1"><span className="w-2 h-2 bg-red-500 rounded-sm opacity-50" /> <span className="text-red-400/80">Blocks</span></span>
            <span className="flex items-center gap-1"><span className="w-2 h-2 bg-green-500 rounded-sm opacity-80" /> <span className="text-green-400/80">Recovered</span></span>
          </div>
        </div>

        {/* VPN Pool */}
        <div className="col-span-7 cyber-card rounded-lg p-4">
          <div className="flex items-center gap-2 mb-3">
            <Wifi className="w-4 h-4 text-cyan-400" />
            <span className="text-[10px] font-mono text-cyan-400/70 uppercase tracking-widest">
              VPN / Proxy Exit-Node Pool · {VPNS.length} nodes · 6 regions
            </span>
          </div>
          <div className="grid grid-cols-3 gap-2">
            {VPNS.map(v => (
              <div key={v.name} className="rounded p-2.5"
                style={{
                  background: 'rgba(0,240,255,0.03)',
                  border: '1px solid',
                  borderColor: v.status === 'offline' ? 'rgba(255,51,85,0.35)'
                    : v.status === 'degraded' ? 'rgba(255,107,0,0.35)'
                    : v.status === 'throttled' ? 'rgba(255,170,0,0.35)'
                    : 'rgba(0,255,136,0.25)',
                }}>
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-1.5">
                    <span className="text-sm">{v.flag}</span>
                    <span className="text-[11px] font-mono font-bold text-white">{v.name}</span>
                  </div>
                  <StatusPill s={v.status} />
                </div>
                <p className="text-[9px] font-mono text-cyan-500/50 mb-1.5">{v.ip_cidr}</p>
                <div className="flex items-center gap-3 text-[9px] font-mono">
                  <span><span className="text-cyan-500/60">Load:</span> <span className="font-bold"
                    style={{ color: v.load > 80 ? '#ff3355' : v.load > 60 ? '#ffaa00' : '#00ff88' }}>{v.load}%</span></span>
                  <span><span className="text-cyan-500/60">Lat:</span> <span className="text-white/85">{v.latency_ms}ms</span></span>
                </div>
                <div className="h-1 mt-1.5 bg-white/5 rounded-full overflow-hidden">
                  <div className="h-full rounded-full"
                    style={{
                      width: `${v.load}%`,
                      background: v.load > 80 ? '#ff3355' : v.load > 60 ? '#ffaa00' : '#00ff88',
                    }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Block detection log */}
      <div className="cyber-card rounded-lg overflow-hidden">
        <div className="px-4 py-3 border-b border-cyan-500/15 flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-red-400" />
          <span className="text-[10px] font-mono text-red-400/80 uppercase tracking-widest">
            Block Detection Log · Real-time recovery chain
          </span>
        </div>
        <table className="w-full text-[11px] font-mono">
          <thead>
            <tr style={{ background: 'rgba(0,240,255,0.03)' }}>
              <th className="text-left p-2 text-cyan-500/60 text-[9px] uppercase tracking-widest font-normal">Time</th>
              <th className="text-left p-2 text-cyan-500/60 text-[9px] uppercase tracking-widest font-normal">Platform</th>
              <th className="text-left p-2 text-cyan-500/60 text-[9px] uppercase tracking-widest font-normal">Block Type</th>
              <th className="text-left p-2 text-cyan-500/60 text-[9px] uppercase tracking-widest font-normal">Severity</th>
              <th className="text-left p-2 text-cyan-500/60 text-[9px] uppercase tracking-widest font-normal">Detection</th>
              <th className="text-left p-2 text-cyan-500/60 text-[9px] uppercase tracking-widest font-normal">Recovery Action</th>
              <th className="text-left p-2 text-cyan-500/60 text-[9px] uppercase tracking-widest font-normal">Status</th>
              <th className="text-right p-2 text-cyan-500/60 text-[9px] uppercase tracking-widest font-normal">MTTR</th>
            </tr>
          </thead>
          <tbody>
            {BLOCKS.map((b, i) => (
              <tr key={i} className="border-t border-cyan-500/5 hover:bg-cyan-500/5">
                <td className="p-2 text-cyan-500/70 text-[10px]">{b.time}</td>
                <td className="p-2 text-white/85 font-bold">{b.platform}</td>
                <td className="p-2 text-white/80">{b.block_type}</td>
                <td className="p-2"><SeverityPill s={b.severity} /></td>
                <td className="p-2 text-cyan-500/60 text-[10px]">{b.detection}</td>
                <td className="p-2 text-amber-300 text-[10px]">{b.recovery_action}</td>
                <td className="p-2"><StatusPill s={b.status} /></td>
                <td className="p-2 text-right text-green-400 font-bold">{b.recovery_time}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
