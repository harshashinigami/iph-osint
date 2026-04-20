import { useState, useEffect } from 'react';
import { Play, Target, Zap, Clock, Download, History, Plus, CheckCircle2, Loader2, Radio, AlertCircle } from 'lucide-react';

interface MonitoredEntity {
  entity: string;
  type: 'account' | 'keyword' | 'location' | 'phone' | 'domain' | 'channel';
  platform: string;
  poll_interval: string;
  status: 'active' | 'queued' | 'fetching' | 'error';
  last_fetch: string;
  new_since_last: number;
}

const MONITORED: MonitoredEntity[] = [
  { entity: '@narrative_hub_07',       type: 'account', platform: 'twitter',   poll_interval: '5 min',   status: 'active',   last_fetch: '38s ago',  new_since_last: 2 },
  { entity: '@truth_seeker_192837',    type: 'account', platform: 'twitter',   poll_interval: '5 min',   status: 'fetching', last_fetch: 'now',      new_since_last: 0 },
  { entity: 'Border Truth Movement',   type: 'channel', platform: 'telegram',  poll_interval: 'real-time', status: 'active', last_fetch: '4s ago',   new_since_last: 1 },
  { entity: 'suspicious_fb_group_4421',type: 'channel', platform: 'facebook',  poll_interval: '15 min',  status: 'queued',   last_fetch: '12m ago',  new_since_last: 7 },
  { entity: '+91-9876-5432-11',        type: 'phone',   platform: 'multi',     poll_interval: '1 hr',    status: 'active',   last_fetch: '42m ago',  new_since_last: 0 },
  { entity: 'pm-kisan-check.com',      type: 'domain',  platform: 'web',       poll_interval: '15 min',  status: 'active',   last_fetch: '3m ago',   new_since_last: 1 },
  { entity: 'IAF aircraft safety',     type: 'keyword', platform: 'multi',     poll_interval: '5 min',   status: 'active',   last_fetch: '47s ago',  new_since_last: 11 },
  { entity: 'Srinagar curfew',         type: 'keyword', platform: 'multi',     poll_interval: '5 min',   status: 'active',   last_fetch: '1m 2s ago',new_since_last: 3 },
  { entity: '@border_truth_movement',  type: 'account', platform: 'instagram', poll_interval: '5 min',   status: 'active',   last_fetch: '2m ago',   new_since_last: 1 },
  { entity: '@defence_observer_in',    type: 'account', platform: 'twitter',   poll_interval: '15 min',  status: 'error',    last_fetch: '18m ago',  new_since_last: 0 },
  { entity: 'pm-kisan-verify.in',      type: 'domain',  platform: 'web',       poll_interval: '1 hr',    status: 'active',   last_fetch: '31m ago',  new_since_last: 0 },
  { entity: 'OSINT India Updates',     type: 'channel', platform: 'telegram',  poll_interval: 'real-time', status: 'active', last_fetch: '11s ago',  new_since_last: 4 },
];

interface FetchLog {
  time: string;
  analyst: string;
  action: string;
  target: string;
  result: string;
  duration: string;
}

const FETCH_LOG: FetchLog[] = [
  { time: '08:47:04Z', analyst: 'SHARMA, S',  action: 'MANUAL FETCH',       target: '@narrative_hub_07 (Twitter)',    result: '23 posts retrieved', duration: '2.1s' },
  { time: '08:45:12Z', analyst: 'KUMAR, D',   action: 'HISTORICAL',         target: '@truth_seeker_192837 (14d)',     result: '847 posts retrieved · queued',  duration: '—' },
  { time: '08:42:58Z', analyst: 'SHARMA, S',  action: 'POLL INTERVAL CHG',  target: 'Border Truth Movement → 5min',   result: 'schedule updated',   duration: '0.1s' },
  { time: '08:39:22Z', analyst: 'SYSTEM',     action: 'AUTO-EXPAND',        target: 'Keyword "IAF aircraft safety"',  result: '+2 related handles added', duration: '0.4s' },
  { time: '08:35:10Z', analyst: 'SHARMA, S',  action: 'ENTITY ADD',         target: '@defence_observer_in',           result: 'monitoring enabled', duration: '0.2s' },
  { time: '08:30:47Z', analyst: 'KUMAR, D',   action: 'MANUAL FETCH',       target: 'suspicious_fb_group_4421',       result: '87 posts · 4 new alerts', duration: '4.8s' },
  { time: '08:24:05Z', analyst: 'SYSTEM',     action: 'FAILOVER',           target: 'Twitter API (region-1 → region-2)', result: 'VPN rotated · recovered', duration: '12.3s' },
  { time: '08:18:39Z', analyst: 'SHARMA, S',  action: 'INVESTIGATION ACT',  target: 'INV-2026-04-20-0003',            result: 'queue created, 23 entities monitored', duration: '1.2s' },
];

function StatusBadge({ s }: { s: string }) {
  const styles: Record<string, string> = {
    active:   'bg-green-500/15 text-green-400 border-green-500/40',
    queued:   'bg-amber-500/15 text-amber-400 border-amber-500/40',
    fetching: 'bg-cyan-500/15 text-cyan-300 border-cyan-500/40',
    error:    'bg-red-500/15 text-red-400 border-red-500/40',
  };
  const icon = s === 'fetching' ? Loader2 : s === 'active' ? CheckCircle2 : s === 'error' ? AlertCircle : Clock;
  const Icon = icon;
  return (
    <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] font-mono font-bold border uppercase tracking-widest ${styles[s]}`}>
      <Icon className={`w-2.5 h-2.5 ${s === 'fetching' ? 'animate-spin' : ''}`} />
      {s}
    </span>
  );
}

const TYPE_COLOR: Record<string, string> = {
  account: '#00f0ff',
  keyword: '#ffaa00',
  location: '#bf5fff',
  phone: '#00ff88',
  domain: '#ff6b00',
  channel: '#3b82f6',
};

export default function InvestigationModePage() {
  const [pollInterval, setPollInterval] = useState('5 min');
  const [fetchingId, setFetchingId] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);

  // simulate a historical collection progress
  useEffect(() => {
    const i = setInterval(() => setProgress(p => (p + 1) % 100), 120);
    return () => clearInterval(i);
  }, []);

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2.5 mb-0.5">
            <Target className="w-5 h-5 text-cyan-400" style={{ filter: 'drop-shadow(0 0 6px rgba(0,240,255,0.7))' }} />
            <h1 className="text-2xl font-bold tracking-tight">
              <span className="text-cyan-400 text-glow-cyan">INVESTIGATION</span>{' '}
              <span className="text-white">MODE</span>
            </h1>
          </div>
          <p className="text-[11px] font-mono uppercase tracking-[0.2em] text-cyan-500/60 ml-7">
            Analyst-controlled crawl strategies · dedicated queue · real-time
          </p>
        </div>
      </div>

      {/* Active investigation banner */}
      <div
        className="cyber-card rounded-lg p-4 flex items-center justify-between"
        style={{ background: 'rgba(0,255,136,0.05)', borderColor: 'rgba(0,255,136,0.35)' }}
      >
        <div className="flex items-center gap-4">
          <div
            className="w-3 h-3 rounded-full pulse-dot-green"
            style={{ background: '#00ff88', boxShadow: '0 0 10px #00ff88' }}
          />
          <div>
            <div className="flex items-center gap-2 mb-0.5">
              <span className="text-[9px] font-mono font-bold uppercase tracking-widest text-green-400">Investigation Mode Active</span>
              <span className="text-[9px] font-mono text-cyan-500/60">Session: ANL-284703</span>
            </div>
            <p className="text-sm font-bold text-white">INV-2026-04-20-0003 · Operation Border Shield</p>
            <p className="text-[10px] font-mono text-white/60">Analyst: Senior Analyst Sharma · Approver: Superintendent Kumar · Activated 08:18:39Z</p>
          </div>
        </div>
        <div className="flex items-center gap-2 text-[10px] font-mono">
          <div className="text-right">
            <p className="text-cyan-500/50 uppercase tracking-wider">Dedicated Queue</p>
            <p className="text-white font-bold">inv_20260420_0003 · priority 10</p>
          </div>
          <div className="text-right ml-4">
            <p className="text-cyan-500/50 uppercase tracking-wider">WS Channel</p>
            <p className="text-green-400 font-bold">ws://notifications/inv-0003</p>
          </div>
        </div>
      </div>

      {/* Queue KPI */}
      <div className="grid grid-cols-5 gap-3">
        <div className="cyber-card rounded-lg p-3">
          <p className="text-[9px] font-mono text-cyan-400/70 uppercase tracking-widest mb-1">Queue Depth</p>
          <p className="text-lg font-bold font-mono text-white">47</p>
          <p className="text-[9px] font-mono text-cyan-500/50">tasks queued</p>
        </div>
        <div className="cyber-card rounded-lg p-3">
          <p className="text-[9px] font-mono text-cyan-400/70 uppercase tracking-widest mb-1">In Flight</p>
          <p className="text-lg font-bold font-mono text-cyan-300">8</p>
          <p className="text-[9px] font-mono text-cyan-500/50">workers active</p>
        </div>
        <div className="cyber-card rounded-lg p-3">
          <p className="text-[9px] font-mono text-cyan-400/70 uppercase tracking-widest mb-1">Completed 1h</p>
          <p className="text-lg font-bold font-mono text-green-400">412</p>
          <p className="text-[9px] font-mono text-green-500/50">94.2% success</p>
        </div>
        <div className="cyber-card rounded-lg p-3">
          <p className="text-[9px] font-mono text-cyan-400/70 uppercase tracking-widest mb-1">Avg Task Time</p>
          <p className="text-lg font-bold font-mono text-white">2.4s</p>
          <p className="text-[9px] font-mono text-cyan-500/50">p95: 8.1s</p>
        </div>
        <div className="cyber-card rounded-lg p-3">
          <p className="text-[9px] font-mono text-cyan-400/70 uppercase tracking-widest mb-1">Data Rate</p>
          <p className="text-lg font-bold font-mono text-amber-300">184</p>
          <p className="text-[9px] font-mono text-amber-500/50">posts/min</p>
        </div>
      </div>

      {/* Controls row */}
      <div className="grid grid-cols-3 gap-4">
        {/* Poll interval */}
        <div className="cyber-card rounded-lg p-4">
          <div className="flex items-center gap-2 mb-3">
            <Clock className="w-4 h-4 text-cyan-400" />
            <span className="text-[10px] font-mono text-cyan-400/70 uppercase tracking-widest">Default Polling Interval</span>
          </div>
          <select
            value={pollInterval}
            onChange={e => setPollInterval(e.target.value)}
            className="w-full px-3 py-2 rounded-lg text-sm font-mono text-white"
            style={{ background: 'rgba(0,240,255,0.05)', border: '1px solid rgba(0,240,255,0.3)' }}
          >
            <option>Real-time (MTProto / WS)</option>
            <option>5 min — high priority</option>
            <option>15 min — frequent</option>
            <option>1 hr — standard</option>
            <option>6 hr — low priority</option>
            <option>24 hr — minimal</option>
          </select>
          <p className="text-[9px] font-mono text-cyan-500/50 mt-2">
            Overrides system default for this investigation only.
          </p>
        </div>

        {/* Historical collection */}
        <div className="cyber-card rounded-lg p-4">
          <div className="flex items-center gap-2 mb-3">
            <History className="w-4 h-4 text-amber-400" />
            <span className="text-[10px] font-mono text-amber-400/80 uppercase tracking-widest">Historical Collection</span>
          </div>
          <div className="flex gap-2 mb-2">
            <input
              type="text"
              defaultValue="2026-04-06"
              className="flex-1 px-2 py-1.5 rounded text-[11px] font-mono text-white"
              style={{ background: 'rgba(0,240,255,0.05)', border: '1px solid rgba(0,240,255,0.2)' }}
            />
            <span className="text-cyan-500/50 py-1.5">→</span>
            <input
              type="text"
              defaultValue="2026-04-20"
              className="flex-1 px-2 py-1.5 rounded text-[11px] font-mono text-white"
              style={{ background: 'rgba(0,240,255,0.05)', border: '1px solid rgba(0,240,255,0.2)' }}
            />
          </div>
          <div className="mb-2">
            <div className="flex items-center justify-between text-[9px] font-mono mb-1">
              <span className="text-cyan-500/60">Collecting @truth_seeker_192837 (847 posts)</span>
              <span className="text-amber-400 font-bold">{progress}%</span>
            </div>
            <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
              <div
                className="h-full rounded-full transition-all"
                style={{
                  width: `${progress}%`,
                  background: 'linear-gradient(90deg, #ffaa00 0%, #ff6b00 100%)',
                  boxShadow: '0 0 6px #ffaa00',
                }}
              />
            </div>
            <p className="text-[9px] font-mono text-cyan-500/40 mt-1">ETA 2m 14s</p>
          </div>
        </div>

        {/* Manual fetch */}
        <div className="cyber-card rounded-lg p-4">
          <div className="flex items-center gap-2 mb-3">
            <Zap className="w-4 h-4 text-red-400" />
            <span className="text-[10px] font-mono text-red-400/80 uppercase tracking-widest">Fetch Now</span>
          </div>
          <div className="space-y-2">
            <select
              className="w-full px-3 py-1.5 rounded text-[11px] font-mono text-white"
              style={{ background: 'rgba(0,240,255,0.05)', border: '1px solid rgba(0,240,255,0.2)' }}
            >
              <option>Select entity...</option>
              <option>@narrative_hub_07</option>
              <option>@truth_seeker_192837</option>
              <option>Border Truth Movement</option>
            </select>
            <button
              onClick={() => { setFetchingId('TASK-' + Math.random().toString(36).slice(2, 8).toUpperCase()); setTimeout(() => setFetchingId(null), 3000); }}
              className="w-full py-1.5 rounded-lg text-[10px] font-mono font-bold uppercase tracking-widest bg-red-500/15 border border-red-500/40 text-red-400 hover:bg-red-500/25 transition-all flex items-center justify-center gap-2"
            >
              {fetchingId ? <><Loader2 className="w-3 h-3 animate-spin" /> Fetching... {fetchingId}</> : <><Play className="w-3 h-3" /> Trigger Immediate Fetch</>}
            </button>
            <p className="text-[9px] font-mono text-cyan-500/50">
              High-priority task · bypasses queue · &lt;30s typical completion
            </p>
          </div>
        </div>
      </div>

      {/* Monitored Entities Table */}
      <div className="cyber-card rounded-lg overflow-hidden">
        <div className="px-4 py-3 flex items-center justify-between border-b border-cyan-500/15">
          <div className="flex items-center gap-2">
            <Radio className="w-4 h-4 text-cyan-400" />
            <span className="text-[10px] font-mono text-cyan-400/70 uppercase tracking-widest">
              Monitored Entities · {MONITORED.length} total
            </span>
          </div>
          <button className="text-[10px] font-mono uppercase tracking-widest text-cyan-400 hover:text-cyan-300 flex items-center gap-1">
            <Plus className="w-3 h-3" /> Add Entity
          </button>
        </div>
        <table className="w-full text-[11px] font-mono">
          <thead>
            <tr style={{ background: 'rgba(0,240,255,0.03)' }}>
              <th className="text-left p-2 text-cyan-500/60 uppercase tracking-widest text-[9px] font-normal">Entity</th>
              <th className="text-left p-2 text-cyan-500/60 uppercase tracking-widest text-[9px] font-normal">Type</th>
              <th className="text-left p-2 text-cyan-500/60 uppercase tracking-widest text-[9px] font-normal">Platform</th>
              <th className="text-left p-2 text-cyan-500/60 uppercase tracking-widest text-[9px] font-normal">Poll</th>
              <th className="text-left p-2 text-cyan-500/60 uppercase tracking-widest text-[9px] font-normal">Status</th>
              <th className="text-left p-2 text-cyan-500/60 uppercase tracking-widest text-[9px] font-normal">Last Fetch</th>
              <th className="text-right p-2 text-cyan-500/60 uppercase tracking-widest text-[9px] font-normal">New</th>
              <th className="text-right p-2 text-cyan-500/60 uppercase tracking-widest text-[9px] font-normal">Actions</th>
            </tr>
          </thead>
          <tbody>
            {MONITORED.map((e, i) => (
              <tr key={i} className="border-t border-cyan-500/5 hover:bg-cyan-500/5">
                <td className="p-2 text-white">{e.entity}</td>
                <td className="p-2">
                  <span className="text-[9px] font-mono uppercase tracking-widest font-bold" style={{ color: TYPE_COLOR[e.type] }}>
                    {e.type}
                  </span>
                </td>
                <td className="p-2 text-white/70 capitalize">{e.platform}</td>
                <td className="p-2 text-cyan-300">{e.poll_interval}</td>
                <td className="p-2"><StatusBadge s={e.status} /></td>
                <td className="p-2 text-white/60">{e.last_fetch}</td>
                <td className="p-2 text-right">
                  {e.new_since_last > 0 ? (
                    <span className="text-amber-400 font-bold">+{e.new_since_last}</span>
                  ) : (
                    <span className="text-cyan-500/40">—</span>
                  )}
                </td>
                <td className="p-2 text-right">
                  <button className="text-[10px] uppercase tracking-widest text-cyan-400 hover:text-cyan-300 mr-3">Fetch</button>
                  <button className="text-[10px] uppercase tracking-widest text-cyan-500/60 hover:text-white">Cfg</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Activity log */}
      <div className="cyber-card rounded-lg p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <History className="w-4 h-4 text-cyan-400" />
            <span className="text-[10px] font-mono text-cyan-400/70 uppercase tracking-widest">
              Activity Log — Last 30 min (audit trail)
            </span>
          </div>
          <button className="text-[10px] font-mono uppercase tracking-widest text-cyan-400 hover:text-cyan-300 flex items-center gap-1">
            <Download className="w-3 h-3" /> Export JSONL
          </button>
        </div>
        <div className="space-y-1 text-[10px] font-mono">
          {FETCH_LOG.map((l, i) => (
            <div key={i} className="flex items-center gap-3 py-1 border-b border-cyan-500/5 last:border-0">
              <span className="text-cyan-500/50 w-16">{l.time}</span>
              <span className="text-amber-400 w-20">{l.analyst}</span>
              <span className="text-cyan-400 font-bold w-28 uppercase">{l.action}</span>
              <span className="text-white/80 flex-1 truncate">{l.target}</span>
              <span className="text-green-400/80 w-56 truncate">{l.result}</span>
              <span className="text-cyan-500/40 w-12 text-right">{l.duration}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
