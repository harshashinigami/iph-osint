import { useState, useEffect } from 'react';
import { Clock, AlertTriangle, Camera, Database, Shield, CheckCircle2, XCircle, Archive, ArrowRight, Eye } from 'lucide-react';

// ── Mock ephemeral capture data ─────────────────────────────────────────
interface Capture {
  id: string;
  platform: 'instagram' | 'telegram' | 'twitter' | 'facebook' | 'tiktok';
  account: string;
  method: 'api_poll' | 'mtproto_event' | 'browser_playwright';
  content_type: 'story' | 'disappearing_msg' | 'fleet' | 'post';
  text: string;
  captured_at: string;   // ISO
  published_at: string;  // ISO
  expires_at?: string;
  deleted_at?: string;
  content_hash: string;
  view_count?: number;
  threat_score: number;
  coordination_hits?: number;
}

const CAPTURES: Capture[] = [
  {
    id: 'EPH-2026-04-20-0041',
    platform: 'twitter',
    account: '@narrative_hub_07',
    method: 'api_poll',
    content_type: 'post',
    text: 'Tonight at 9 PM — big announcement coming. Everyone must act. #TruthMustCome',
    captured_at: '2026-04-20T08:47:23Z',
    published_at: '2026-04-20T08:45:00Z',
    deleted_at: '2026-04-20T08:52:04Z',
    content_hash: 'a7f3b9c2e1d8f6a4b2c9',
    view_count: 1847,
    threat_score: 0.84,
    coordination_hits: 3,
  },
  {
    id: 'EPH-2026-04-20-0040',
    platform: 'instagram',
    account: '@border_truth_movement',
    method: 'api_poll',
    content_type: 'story',
    text: 'IAF pilots unsafe aircraft exposed — families speak out. Link in bio.',
    captured_at: '2026-04-20T08:32:11Z',
    published_at: '2026-04-20T08:30:00Z',
    expires_at: '2026-04-21T08:30:00Z',
    content_hash: 'b8d2a1f6c4e9b7a3f5e1',
    view_count: 2847,
    threat_score: 0.78,
    coordination_hits: 11,
  },
  {
    id: 'EPH-2026-04-20-0039',
    platform: 'telegram',
    account: 'Border Truth Movement',
    method: 'mtproto_event',
    content_type: 'disappearing_msg',
    text: 'चैनल संदेश [Forwarded] Breaking: सरकार ने पुष्टि की है कि ... [redacted]',
    captured_at: '2026-04-20T07:58:42Z',
    published_at: '2026-04-20T07:58:40Z',
    expires_at: '2026-04-20T08:58:40Z',
    content_hash: '3e9f1c7d8a2b4f6e9c1d',
    view_count: 428,
    threat_score: 0.71,
  },
  {
    id: 'EPH-2026-04-20-0038',
    platform: 'twitter',
    account: '@truth_seeker_192837',
    method: 'api_poll',
    content_type: 'post',
    text: 'URGENT: Join protest tomorrow at India Gate — government lies exposed!',
    captured_at: '2026-04-20T07:45:18Z',
    published_at: '2026-04-20T07:42:00Z',
    deleted_at: '2026-04-20T07:49:33Z',
    content_hash: 'c2d8e3a9f1b5c7d4e9a2',
    view_count: 612,
    threat_score: 0.69,
    coordination_hits: 5,
  },
  {
    id: 'EPH-2026-04-20-0037',
    platform: 'tiktok',
    account: '@jn_updates_247',
    method: 'browser_playwright',
    content_type: 'post',
    text: '[VIDEO + OVERLAY] "Curfew tonight — stay home" — fake advisory circulating',
    captured_at: '2026-04-20T06:32:57Z',
    published_at: '2026-04-20T06:30:12Z',
    content_hash: '4a1c9d7b2e8f3a5d6c1b',
    view_count: 12847,
    threat_score: 0.81,
  },
  {
    id: 'EPH-2026-04-20-0036',
    platform: 'instagram',
    account: '@srinagar_citizen_voice',
    method: 'api_poll',
    content_type: 'story',
    text: '[POLL STICKER] Will the curfew be lifted by morning? [Location: Srinagar]',
    captured_at: '2026-04-20T05:12:04Z',
    published_at: '2026-04-20T05:10:00Z',
    expires_at: '2026-04-21T05:10:00Z',
    content_hash: 'f7e2b9a1d5c3f8e6a2b9',
    view_count: 3104,
    threat_score: 0.52,
  },
  {
    id: 'EPH-2026-04-20-0035',
    platform: 'facebook',
    account: 'Communal Watch Official',
    method: 'api_poll',
    content_type: 'post',
    text: 'Community alert: Suspicious gathering at [landmark] — inform neighbors immediately.',
    captured_at: '2026-04-20T04:48:52Z',
    published_at: '2026-04-20T04:47:10Z',
    deleted_at: '2026-04-20T05:01:20Z',
    content_hash: 'd6a8e3c1b9f4d7a2e8c3',
    view_count: 203,
    threat_score: 0.74,
    coordination_hits: 2,
  },
  {
    id: 'EPH-2026-04-20-0034',
    platform: 'telegram',
    account: 'OSINT India Updates',
    method: 'mtproto_event',
    content_type: 'disappearing_msg',
    text: 'گرفتار افراد کی تعداد بڑھ گئی ہے۔ مزید تفصیلات جلد۔ [auto-delete in 30min]',
    captured_at: '2026-04-20T03:20:11Z',
    published_at: '2026-04-20T03:20:08Z',
    expires_at: '2026-04-20T03:50:08Z',
    content_hash: '2f9b7c1e4a6d8c3f1e7a',
    view_count: 1024,
    threat_score: 0.66,
  },
];

const PLATFORM_COLOR: Record<string, string> = {
  twitter: '#00f0ff',
  instagram: '#bf5fff',
  telegram: '#00ff88',
  facebook: '#3b82f6',
  tiktok: '#ffaa00',
};

const METHOD_LABEL: Record<string, string> = {
  api_poll: 'API Poll · 5min interval',
  mtproto_event: 'Telethon MTProto · Event Handler',
  browser_playwright: 'Playwright Headless · Visual Capture',
};

function deltaSec(a: string, b: string): number {
  return Math.abs(new Date(a).getTime() - new Date(b).getTime()) / 1000;
}

function formatDelta(sec: number): string {
  if (sec < 60) return `${Math.round(sec)}s`;
  if (sec < 3600) return `${Math.round(sec / 60)}m`;
  return `${Math.round(sec / 3600)}h`;
}

function ttlLeft(iso?: string): string | null {
  if (!iso) return null;
  const sec = (new Date(iso).getTime() - Date.now()) / 1000;
  if (sec <= 0) return null;
  return formatDelta(sec);
}

export default function EphemeralPage() {
  const [filter, setFilter] = useState<'all' | 'deleted' | 'expiring'>('all');
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  const filtered = CAPTURES.filter(c => {
    if (filter === 'deleted') return !!c.deleted_at;
    if (filter === 'expiring') return !!c.expires_at && new Date(c.expires_at).getTime() > Date.now();
    return true;
  });

  const kpi = {
    total: CAPTURES.length,
    rapid_deletion: CAPTURES.filter(c => c.deleted_at && deltaSec(c.published_at, c.deleted_at) < 900).length,
    active_poll: CAPTURES.filter(c => c.expires_at && new Date(c.expires_at) > now).length,
    platforms: new Set(CAPTURES.map(c => c.platform)).size,
  };

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2.5 mb-0.5">
            <Camera className="w-5 h-5 text-cyan-400" style={{ filter: 'drop-shadow(0 0 6px rgba(0,240,255,0.7))' }} />
            <h1 className="text-2xl font-bold tracking-tight">
              <span className="text-cyan-400 text-glow-cyan">EPHEMERAL</span>{' '}
              <span className="text-white">CONTENT CAPTURE</span>
            </h1>
          </div>
          <p className="text-[11px] font-mono uppercase tracking-[0.2em] text-cyan-500/60 ml-7">
            Real-time capture of stories, disappearing messages, rapid-delete posts
          </p>
        </div>
        <div className="flex items-center gap-2 text-[10px] font-mono uppercase tracking-widest">
          <span className="text-cyan-500/50">Monitored Accounts:</span>
          <span className="text-white font-bold">1,247</span>
          <span className="text-cyan-500/40 mx-2">·</span>
          <span className="text-cyan-500/50">Capture Latency:</span>
          <span className="text-green-400 font-bold">&lt; 5 min</span>
        </div>
      </div>

      {/* KPI Strip */}
      <div className="grid grid-cols-4 gap-4">
        <div className="cyber-card rounded-lg p-4 glow-cyan">
          <div className="flex items-center justify-between mb-1">
            <span className="text-[10px] font-mono text-cyan-400/70 uppercase tracking-widest">Captures 24h</span>
            <Archive className="w-4 h-4 text-cyan-400" />
          </div>
          <p className="text-2xl font-bold text-white font-mono">3,842</p>
          <p className="text-[10px] font-mono text-cyan-500/50 mt-0.5">Across {kpi.platforms} platforms</p>
        </div>
        <div className="cyber-card rounded-lg p-4 glow-red">
          <div className="flex items-center justify-between mb-1">
            <span className="text-[10px] font-mono text-red-400/80 uppercase tracking-widest">Rapid Deletions</span>
            <XCircle className="w-4 h-4 text-red-400" style={{ filter: 'drop-shadow(0 0 4px rgba(255,51,85,0.5))' }} />
          </div>
          <p className="text-2xl font-bold font-mono" style={{ color: '#ff3355', textShadow: '0 0 8px rgba(255,51,85,0.4)' }}>47</p>
          <p className="text-[10px] font-mono text-red-400/60 mt-0.5">Deleted within 15 min</p>
        </div>
        <div className="cyber-card rounded-lg p-4 glow-amber">
          <div className="flex items-center justify-between mb-1">
            <span className="text-[10px] font-mono text-amber-400/80 uppercase tracking-widest">Expiring Soon</span>
            <Clock className="w-4 h-4 text-amber-400" />
          </div>
          <p className="text-2xl font-bold font-mono text-amber-300">{kpi.active_poll}</p>
          <p className="text-[10px] font-mono text-amber-400/60 mt-0.5">TTL &lt; 24h, polling active</p>
        </div>
        <div className="cyber-card rounded-lg p-4 glow-green">
          <div className="flex items-center justify-between mb-1">
            <span className="text-[10px] font-mono text-green-400/80 uppercase tracking-widest">Integrity Score</span>
            <Shield className="w-4 h-4 text-green-400" />
          </div>
          <p className="text-2xl font-bold font-mono text-green-400">99.7%</p>
          <p className="text-[10px] font-mono text-green-500/60 mt-0.5">Chain-of-custody verified</p>
        </div>
      </div>

      {/* Capture Architecture Legend */}
      <div className="cyber-card rounded-lg p-3 flex items-center gap-6">
        <span className="text-[10px] font-mono text-cyan-400/70 uppercase tracking-widest">Capture Methods:</span>
        {[
          { k: 'API Polling', desc: '5-15 min · Instagram/Facebook/Reddit', color: '#00f0ff' },
          { k: 'MTProto Events', desc: 'Real-time · Telegram', color: '#00ff88' },
          { k: 'Playwright Browser', desc: '10 min · TikTok / forums', color: '#ffaa00' },
        ].map(m => (
          <div key={m.k} className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full" style={{ background: m.color, boxShadow: `0 0 4px ${m.color}` }} />
            <span className="text-[11px] font-mono text-white/80">{m.k}</span>
            <span className="text-[10px] font-mono text-cyan-500/50">{m.desc}</span>
          </div>
        ))}
      </div>

      {/* Filter chips */}
      <div className="flex items-center gap-2">
        {(['all', 'deleted', 'expiring'] as const).map(f => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className="px-3 py-1 rounded-full text-[10px] font-mono font-bold uppercase tracking-widest transition-all"
            style={{
              background: filter === f ? 'rgba(0,240,255,0.15)' : 'rgba(0,240,255,0.04)',
              border: `1px solid ${filter === f ? 'rgba(0,240,255,0.5)' : 'rgba(0,240,255,0.15)'}`,
              color: filter === f ? '#00f0ff' : 'rgba(255,255,255,0.5)',
              boxShadow: filter === f ? '0 0 8px rgba(0,240,255,0.25)' : 'none',
            }}
          >
            {f === 'all' ? 'All Captures' : f === 'deleted' ? `Deleted (${CAPTURES.filter(c=>c.deleted_at).length})` : `Expiring Now`}
          </button>
        ))}
      </div>

      {/* Capture Cards */}
      <div className="grid grid-cols-2 gap-4">
        {filtered.map(c => {
          const ttl = c.expires_at && !c.deleted_at ? ttlLeft(c.expires_at) : null;
          const deleted = !!c.deleted_at;
          const rapidDelete = deleted && deltaSec(c.published_at, c.deleted_at!) < 900;
          const accent = deleted ? '#ff3355' : ttl ? '#ffaa00' : PLATFORM_COLOR[c.platform];

          return (
            <div
              key={c.id}
              className="cyber-card rounded-lg p-4"
              style={{
                borderLeft: `3px solid ${accent}`,
                boxShadow: rapidDelete ? '0 0 20px rgba(255,51,85,0.2)' : 'none',
              }}
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-2">
                  <span
                    className="px-2 py-0.5 rounded text-[9px] font-mono uppercase tracking-widest font-bold"
                    style={{ color: PLATFORM_COLOR[c.platform], background: `${PLATFORM_COLOR[c.platform]}15`, border: `1px solid ${PLATFORM_COLOR[c.platform]}40` }}
                  >
                    {c.platform}
                  </span>
                  <span className="text-[10px] font-mono text-cyan-500/60 uppercase">{c.content_type.replace('_', ' ')}</span>
                  <span className="text-[10px] font-mono text-white/80">· {c.account}</span>
                </div>
                <div className="flex items-center gap-2">
                  {rapidDelete && (
                    <span className="px-1.5 py-0.5 rounded text-[9px] font-mono font-bold bg-red-500/15 text-red-400 border border-red-500/40 uppercase tracking-wider">
                      RAPID_DELETION · {formatDelta(deltaSec(c.published_at, c.deleted_at!))}
                    </span>
                  )}
                  {deleted && !rapidDelete && (
                    <span className="px-1.5 py-0.5 rounded text-[9px] font-mono font-bold bg-red-500/15 text-red-400 border border-red-500/40 uppercase">
                      Deleted
                    </span>
                  )}
                  {ttl && (
                    <span className="px-1.5 py-0.5 rounded text-[9px] font-mono font-bold bg-amber-500/15 text-amber-400 border border-amber-500/40 uppercase tracking-wider">
                      TTL {ttl}
                    </span>
                  )}
                </div>
              </div>

              <p className="text-[12px] text-white/90 leading-relaxed mb-3 font-mono">
                {c.text}
              </p>

              <div className="grid grid-cols-2 gap-y-1.5 gap-x-4 text-[10px] font-mono">
                <div><span className="text-cyan-500/50 uppercase tracking-wider">Published:</span> <span className="text-white/80">{c.published_at.replace('T', ' ').slice(0, 16)}Z</span></div>
                <div><span className="text-cyan-500/50 uppercase tracking-wider">Captured:</span> <span className="text-white/80">+{formatDelta(deltaSec(c.published_at, c.captured_at))}</span></div>
                {c.deleted_at && (
                  <div><span className="text-red-400/70 uppercase tracking-wider">Deleted at:</span> <span className="text-red-400">{c.deleted_at.replace('T', ' ').slice(11, 19)}Z</span></div>
                )}
                {c.view_count && (
                  <div><span className="text-cyan-500/50 uppercase tracking-wider">Views:</span> <span className="text-white/80">{c.view_count.toLocaleString()}</span></div>
                )}
                <div><span className="text-cyan-500/50 uppercase tracking-wider">Hash:</span> <span className="text-white/60 tracking-tighter">{c.content_hash}</span></div>
                <div><span className="text-cyan-500/50 uppercase tracking-wider">Threat:</span>
                  <span className="ml-1 font-bold" style={{ color: c.threat_score > 0.7 ? '#ff3355' : c.threat_score > 0.4 ? '#ffaa00' : '#00ff88' }}>
                    {(c.threat_score * 100).toFixed(0)}
                  </span>
                </div>
              </div>

              <div className="mt-3 pt-2.5 border-t border-cyan-500/10 flex items-center justify-between">
                <div className="flex items-center gap-2 text-[10px] font-mono">
                  <Database className="w-3 h-3 text-cyan-500/50" />
                  <span className="text-cyan-500/60">{METHOD_LABEL[c.method]}</span>
                </div>
                {c.coordination_hits && (
                  <span className="text-[10px] font-mono text-purple-400 flex items-center gap-1">
                    <AlertTriangle className="w-3 h-3" />
                    {c.coordination_hits} coord-pattern matches
                  </span>
                )}
              </div>

              <div className="mt-2 flex items-center gap-2">
                <button className="text-[10px] font-mono uppercase tracking-widest text-cyan-400 hover:text-cyan-300 flex items-center gap-1">
                  <Eye className="w-3 h-3" /> View Archive <ArrowRight className="w-3 h-3" />
                </button>
                <span className="text-cyan-500/20 mx-1">|</span>
                <button className="text-[10px] font-mono uppercase tracking-widest text-cyan-500/60 hover:text-cyan-300 flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3" /> Chain-of-Custody
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
