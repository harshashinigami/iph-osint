import { useState } from 'react';
import { Radar, TrendingUp, Bot, GitBranch, Clock, ArrowRight, Zap } from 'lucide-react';

// ── Mock cluster data ───────────────────────────────────────────────────

interface Cluster {
  id: string;
  name: string;
  status: 'active' | 'monitoring' | 'disrupted';
  accounts: number;
  bots: number;
  platforms: string[];
  window_min: number;
  semantic_sim: number;
  confidence: number;
  peak_reach: number;
  narrative: string;
  original_post: string;
  mutations: string[];
  first_seen: string;
  hub_account: string;
  attribution_confidence: number;
  prior_ops?: string;
}

const CLUSTERS: Cluster[] = [
  {
    id: 'COORD-2026-04-20-0003',
    name: 'Operation Border Shield',
    status: 'active',
    accounts: 23,
    bots: 18,
    platforms: ['twitter', 'facebook', 'telegram'],
    window_min: 4,
    semantic_sim: 0.92,
    confidence: 0.96,
    peak_reach: 184700,
    narrative: 'IAF aircraft safety — coordinated disinformation targeting military morale',
    original_post: 'IAF pilots unsafe aircraft exposed — families speak out #TruthMustCome',
    mutations: [
      'IAF families speak against unsafe aircraft fleet',
      'Exposed: IAF pilots forced to fly compromised jets — families tell all',
      'आईएएफ परिवार आगे आए: खतरनाक विमानों का सच #सच_सामने_आएगा',
    ],
    first_seen: '2026-04-20T08:14Z',
    hub_account: '@narrative_hub_07',
    attribution_confidence: 0.65,
    prior_ops: 'Operation Narrative Shield (Jan 2026)',
  },
  {
    id: 'COORD-2026-04-20-0002',
    name: 'Op. UPI Refund Scam Burst',
    status: 'active',
    accounts: 41,
    bots: 35,
    platforms: ['twitter', 'telegram'],
    window_min: 7,
    semantic_sim: 0.88,
    confidence: 0.91,
    peak_reach: 62400,
    narrative: 'Fraud: fake UPI refund portal — hijack legit gov-scheme hashtags',
    original_post: 'PM Kisan ₹6000 refund delayed — claim instantly at pm-kisan-check[.]com',
    mutations: [
      '₹6000 Kisan refund — verify now at pm-kisan-check[.]com',
      'पीएम किसान रिफंड देर से: तुरंत यहां दावा करें',
    ],
    first_seen: '2026-04-20T05:38Z',
    hub_account: '@farmer_help_official',
    attribution_confidence: 0.71,
  },
  {
    id: 'COORD-2026-04-19-0007',
    name: 'Srinagar Curfew Rumor Swarm',
    status: 'disrupted',
    accounts: 14,
    bots: 9,
    platforms: ['telegram', 'instagram', 'tiktok'],
    window_min: 12,
    semantic_sim: 0.79,
    confidence: 0.83,
    peak_reach: 38200,
    narrative: 'False curfew advisory targeting Srinagar — AI-voice fake',
    original_post: '[AUDIO] Collector announces curfew tonight 8pm-6am — stay indoors',
    mutations: [
      'Curfew reinstated in Srinagar after incident',
      'सनगर में कर्फ्यू: आज रात 8 से सुबह 6 बजे तक',
    ],
    first_seen: '2026-04-19T19:02Z',
    hub_account: 'srinagar_citizen_voice (TG)',
    attribution_confidence: 0.58,
  },
  {
    id: 'COORD-2026-04-19-0006',
    name: 'Anti-ADC Recruitment Drive',
    status: 'monitoring',
    accounts: 8,
    bots: 3,
    platforms: ['twitter', 'reddit'],
    window_min: 22,
    semantic_sim: 0.71,
    confidence: 0.74,
    peak_reach: 9800,
    narrative: 'Recruitment probe for anti-Armoured Drone Corps messaging',
    original_post: 'DRDO ADC program quietly scaled back — insider report',
    mutations: [
      'DRDO cancels armoured drone program',
      'ADC program failures revealed by whistleblower',
    ],
    first_seen: '2026-04-19T14:47Z',
    hub_account: '@defence_observer_in',
    attribution_confidence: 0.42,
  },
];

const PLATFORM_COLOR: Record<string, string> = {
  twitter: '#00f0ff',
  telegram: '#00ff88',
  facebook: '#3b82f6',
  instagram: '#bf5fff',
  reddit: '#ff6b00',
  tiktok: '#ffaa00',
};

// Temporal bursts: 24 bars representing last 24 hours, height = posts count
const TEMPORAL_BURSTS = [2,1,0,1,3,2,1,2,4,15,38,22,8,3,2,1,4,2,6,12,9,4,2,1];

// Semantic similarity matrix 6x6 for the top cluster
const SEM_MATRIX = [
  [1.00, 0.96, 0.92, 0.91, 0.89, 0.88],
  [0.96, 1.00, 0.94, 0.92, 0.90, 0.87],
  [0.92, 0.94, 1.00, 0.95, 0.91, 0.89],
  [0.91, 0.92, 0.95, 1.00, 0.93, 0.90],
  [0.89, 0.90, 0.91, 0.93, 1.00, 0.92],
  [0.88, 0.87, 0.89, 0.90, 0.92, 1.00],
];

const MATRIX_ACCOUNTS = ['@hub_07', '@truth_192', '@seeker_38', '@voice_in', '@reality_IN', '@exposed_hq'];

function SeverityPill({ status }: { status: string }) {
  const styles: Record<string, string> = {
    active: 'bg-red-500/15 text-red-400 border-red-500/40',
    monitoring: 'bg-amber-500/15 text-amber-400 border-amber-500/40',
    disrupted: 'bg-green-500/15 text-green-400 border-green-500/40',
  };
  return (
    <span className={`px-2 py-0.5 rounded text-[9px] font-mono font-bold border uppercase tracking-widest ${styles[status]}`}>
      {status}
    </span>
  );
}

// Hub-and-spoke mini graph rendered as SVG
function HubSpokeMini({ accounts, hub, color }: { accounts: number; hub: string; color: string }) {
  const size = 160;
  const cx = size / 2;
  const cy = size / 2;
  const nodes = Math.min(accounts, 20);
  const spokes = Array.from({ length: nodes }, (_, i) => {
    const angle = (i / nodes) * Math.PI * 2;
    const r = 58 + ((i % 3) * 6);
    return { x: cx + Math.cos(angle) * r, y: cy + Math.sin(angle) * r };
  });
  return (
    <svg width={size} height={size} style={{ overflow: 'visible' }}>
      {spokes.map((s, i) => (
        <line key={i} x1={cx} y1={cy} x2={s.x} y2={s.y} stroke={color} strokeOpacity={0.25} strokeWidth={0.8} />
      ))}
      {spokes.map((s, i) => (
        <circle key={i} cx={s.x} cy={s.y} r={3} fill={color} fillOpacity={0.7} />
      ))}
      <circle cx={cx} cy={cy} r={16} fill={color} fillOpacity={0.9} stroke={color} strokeWidth={2}
        style={{ filter: `drop-shadow(0 0 6px ${color})` }} />
      <text x={cx} y={cy + 4} textAnchor="middle" fill="#050510" fontSize="10" fontWeight="bold" fontFamily="monospace">HUB</text>
      <text x={cx} y={size - 4} textAnchor="middle" fill={color} fontSize="9" fontFamily="monospace">{hub.slice(0, 18)}</text>
    </svg>
  );
}

export default function CoordinatedNarrativesPage() {
  const [selected, setSelected] = useState<string>(CLUSTERS[0].id);
  const cluster = CLUSTERS.find(c => c.id === selected)!;
  const maxBurst = Math.max(...TEMPORAL_BURSTS);

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2.5 mb-0.5">
            <Radar className="w-5 h-5 text-cyan-400" style={{ filter: 'drop-shadow(0 0 6px rgba(0,240,255,0.7))' }} />
            <h1 className="text-2xl font-bold tracking-tight">
              <span className="text-cyan-400 text-glow-cyan">COORDINATED</span>{' '}
              <span className="text-white">NARRATIVE DETECTION</span>
            </h1>
          </div>
          <p className="text-[11px] font-mono uppercase tracking-[0.2em] text-cyan-500/60 ml-7">
            Cross-platform bot swarm + influence operation detection
          </p>
        </div>
        <div className="text-[10px] font-mono text-cyan-500/50 uppercase tracking-widest">
          <span>Detection Engine:</span> <span className="text-white">MinHash + HDBSCAN + LLM semantic clustering</span>
        </div>
      </div>

      {/* KPI Strip */}
      <div className="grid grid-cols-4 gap-4">
        <div className="cyber-card rounded-lg p-4 glow-red">
          <div className="flex items-center justify-between mb-1">
            <span className="text-[10px] font-mono text-red-400/80 uppercase tracking-widest">Active Clusters</span>
            <Radar className="w-4 h-4 text-red-400" />
          </div>
          <p className="text-2xl font-bold font-mono" style={{ color: '#ff3355', textShadow: '0 0 8px rgba(255,51,85,0.4)' }}>
            {CLUSTERS.filter(c => c.status === 'active').length}
          </p>
          <p className="text-[10px] font-mono text-red-400/60 mt-0.5">HIGH-confidence detections</p>
        </div>
        <div className="cyber-card rounded-lg p-4 glow-cyan">
          <div className="flex items-center justify-between mb-1">
            <span className="text-[10px] font-mono text-cyan-400/70 uppercase tracking-widest">Bot Accounts</span>
            <Bot className="w-4 h-4 text-cyan-400" />
          </div>
          <p className="text-2xl font-bold text-white font-mono">{CLUSTERS.reduce((a, c) => a + c.bots, 0)}</p>
          <p className="text-[10px] font-mono text-cyan-500/50 mt-0.5">Bot score &gt; 0.7</p>
        </div>
        <div className="cyber-card rounded-lg p-4 glow-amber">
          <div className="flex items-center justify-between mb-1">
            <span className="text-[10px] font-mono text-amber-400/80 uppercase tracking-widest">Cross-Platform</span>
            <GitBranch className="w-4 h-4 text-amber-400" />
          </div>
          <p className="text-2xl font-bold text-amber-300 font-mono">3.0</p>
          <p className="text-[10px] font-mono text-amber-400/60 mt-0.5">Avg. platforms per cluster</p>
        </div>
        <div className="cyber-card rounded-lg p-4 glow-green">
          <div className="flex items-center justify-between mb-1">
            <span className="text-[10px] font-mono text-green-400/80 uppercase tracking-widest">Disrupted 7d</span>
            <Zap className="w-4 h-4 text-green-400" />
          </div>
          <p className="text-2xl font-bold text-green-400 font-mono">14</p>
          <p className="text-[10px] font-mono text-green-500/60 mt-0.5">Neutralized before mainstream</p>
        </div>
      </div>

      <div className="grid grid-cols-12 gap-4">
        {/* Cluster list */}
        <div className="col-span-5 space-y-3">
          <h3 className="text-[10px] font-mono text-cyan-400/70 uppercase tracking-widest">Active Clusters</h3>
          {CLUSTERS.map(c => {
            const isSel = c.id === selected;
            return (
              <button
                key={c.id}
                onClick={() => setSelected(c.id)}
                className="w-full text-left cyber-card rounded-lg p-3 transition-all"
                style={{
                  borderColor: isSel ? 'rgba(0,240,255,0.55)' : 'rgba(0,240,255,0.12)',
                  boxShadow: isSel ? '0 0 18px rgba(0,240,255,0.2)' : 'none',
                  background: isSel ? 'rgba(0,240,255,0.05)' : 'rgba(0,240,255,0.02)',
                }}
              >
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <p className="text-[12px] font-bold text-white tracking-tight">{c.name}</p>
                    <p className="text-[9px] font-mono text-cyan-500/50 mt-0.5">{c.id}</p>
                  </div>
                  <SeverityPill status={c.status} />
                </div>
                <p className="text-[11px] text-white/70 mb-2 leading-snug">{c.narrative}</p>
                <div className="grid grid-cols-3 gap-2 text-[10px] font-mono">
                  <div><span className="text-cyan-500/50">Accounts:</span> <span className="text-white font-bold">{c.accounts}</span></div>
                  <div><span className="text-cyan-500/50">Bots:</span> <span className="text-red-400 font-bold">{c.bots}</span></div>
                  <div><span className="text-cyan-500/50">Window:</span> <span className="text-white">{c.window_min}m</span></div>
                  <div><span className="text-cyan-500/50">Sem-Sim:</span> <span className="text-amber-400 font-bold">{(c.semantic_sim * 100).toFixed(0)}%</span></div>
                  <div><span className="text-cyan-500/50">Confidence:</span> <span className="text-green-400 font-bold">{(c.confidence * 100).toFixed(0)}%</span></div>
                  <div><span className="text-cyan-500/50">Reach:</span> <span className="text-white">{(c.peak_reach / 1000).toFixed(0)}K</span></div>
                </div>
                <div className="mt-2 flex items-center gap-1">
                  {c.platforms.map(p => (
                    <span key={p}
                      className="px-1.5 py-0.5 rounded text-[8px] font-mono uppercase tracking-wider font-bold"
                      style={{ color: PLATFORM_COLOR[p], background: `${PLATFORM_COLOR[p]}15`, border: `1px solid ${PLATFORM_COLOR[p]}40` }}
                    >{p}</span>
                  ))}
                </div>
              </button>
            );
          })}
        </div>

        {/* Detail panel */}
        <div className="col-span-7 space-y-4">
          {/* Selected cluster header */}
          <div className="cyber-card rounded-lg p-4">
            <div className="flex items-start justify-between mb-3">
              <div>
                <p className="text-[10px] font-mono text-cyan-400/70 uppercase tracking-widest mb-0.5">Cluster Detail · {cluster.id}</p>
                <h3 className="text-lg font-bold text-white">{cluster.name}</h3>
              </div>
              <button className="px-3 py-1.5 rounded-lg text-[10px] font-mono font-bold uppercase tracking-widest bg-red-500/15 border border-red-500/40 text-red-400 hover:bg-red-500/25 transition-all">
                Activate Investigation <ArrowRight className="w-3 h-3 inline ml-1" />
              </button>
            </div>
            <div className="flex items-center gap-4 text-[10px] font-mono mb-3">
              <div><span className="text-cyan-500/50 uppercase tracking-wider">Hub:</span> <span className="text-cyan-300">{cluster.hub_account}</span></div>
              <div><span className="text-cyan-500/50 uppercase tracking-wider">First Seen:</span> <span className="text-white">{cluster.first_seen}</span></div>
              <div><span className="text-cyan-500/50 uppercase tracking-wider">Attribution:</span>
                <span className="text-amber-400 font-bold ml-1">{(cluster.attribution_confidence * 100).toFixed(0)}%</span>
              </div>
            </div>
            <div className="flex items-start gap-4">
              <HubSpokeMini accounts={cluster.accounts} hub={cluster.hub_account} color="#ff3355" />
              <div className="flex-1 space-y-2">
                <div>
                  <p className="text-[9px] font-mono text-cyan-400/70 uppercase tracking-widest mb-1">Original Seed</p>
                  <p className="text-[11px] text-white/90 font-mono bg-red-500/5 border border-red-500/20 rounded p-2">
                    "{cluster.original_post}"
                  </p>
                </div>
                <div>
                  <p className="text-[9px] font-mono text-cyan-400/70 uppercase tracking-widest mb-1">
                    Narrative Mutations (semantic sim ≥ 0.85)
                  </p>
                  {cluster.mutations.map((m, i) => (
                    <p key={i} className="text-[10px] text-amber-300/90 font-mono bg-amber-500/5 border-l-2 border-amber-500/40 pl-2 py-0.5 mb-0.5">
                      "{m}"
                    </p>
                  ))}
                </div>
                {cluster.prior_ops && (
                  <div>
                    <p className="text-[9px] font-mono text-purple-400/70 uppercase tracking-widest">
                      Prior Attribution:
                    </p>
                    <p className="text-[10px] text-purple-300">{cluster.prior_ops} · 12/23 accounts match</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Temporal burst strip */}
          <div className="cyber-card rounded-lg p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-cyan-400" />
                <span className="text-[10px] font-mono text-cyan-400/70 uppercase tracking-widest">
                  Temporal Clustering — Last 24h (posts/hour)
                </span>
              </div>
              <span className="text-[9px] font-mono text-red-400">
                Burst detected: 08:00-10:00Z · {TEMPORAL_BURSTS.slice(8, 12).reduce((a, b) => a + b, 0)} posts in 4m window
              </span>
            </div>
            <div className="flex items-end gap-1 h-20">
              {TEMPORAL_BURSTS.map((v, i) => {
                const h = (v / maxBurst) * 100;
                const burst = i >= 9 && i <= 11;
                const color = burst ? '#ff3355' : '#00f0ff';
                return (
                  <div key={i} className="flex-1 flex flex-col items-center">
                    <div
                      className="w-full rounded-sm"
                      style={{
                        height: `${Math.max(h, 2)}%`,
                        background: color,
                        opacity: burst ? 0.9 : 0.35,
                        boxShadow: burst ? `0 0 8px ${color}` : 'none',
                      }}
                    />
                    <span className="text-[8px] font-mono text-cyan-500/40 mt-0.5">{i.toString().padStart(2, '0')}</span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Semantic similarity matrix */}
          <div className="cyber-card rounded-lg p-4">
            <div className="flex items-center gap-2 mb-3">
              <TrendingUp className="w-4 h-4 text-cyan-400" />
              <span className="text-[10px] font-mono text-cyan-400/70 uppercase tracking-widest">
                Semantic Similarity Matrix (top 6 accounts)
              </span>
            </div>
            <table className="text-[10px] font-mono w-full">
              <thead>
                <tr>
                  <th className="text-left text-cyan-500/50 font-normal p-1"></th>
                  {MATRIX_ACCOUNTS.map(a => (
                    <th key={a} className="text-cyan-500/50 font-normal p-1 text-center">{a}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {SEM_MATRIX.map((row, i) => (
                  <tr key={i}>
                    <td className="text-cyan-500/50 p-1">{MATRIX_ACCOUNTS[i]}</td>
                    {row.map((v, j) => {
                      const isDiag = i === j;
                      const bg = isDiag ? 'rgba(0,240,255,0.25)'
                        : v >= 0.95 ? 'rgba(255,51,85,0.85)'
                        : v >= 0.90 ? 'rgba(255,107,0,0.65)'
                        : v >= 0.85 ? 'rgba(255,170,0,0.45)'
                        : 'rgba(0,255,136,0.25)';
                      return (
                        <td key={j} className="p-0">
                          <div
                            className="text-center py-1.5 font-bold text-white"
                            style={{ background: bg, textShadow: '0 0 4px rgba(0,0,0,0.8)' }}
                          >
                            {v.toFixed(2)}
                          </div>
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
            <div className="flex items-center gap-4 mt-2 text-[9px] font-mono">
              <span className="text-cyan-500/50 uppercase tracking-wider">Threshold:</span>
              <span className="text-red-400">≥0.95 coordination-proof</span>
              <span className="text-amber-400">≥0.85 suspected</span>
              <span className="text-green-400">&lt;0.85 ambient</span>
            </div>
          </div>

          {/* Cross-platform spread */}
          <div className="cyber-card rounded-lg p-4">
            <div className="flex items-center gap-2 mb-3">
              <GitBranch className="w-4 h-4 text-cyan-400" />
              <span className="text-[10px] font-mono text-cyan-400/70 uppercase tracking-widest">
                Cross-Platform Spread (T+0 → T+6h)
              </span>
            </div>
            <div className="flex items-center justify-between">
              {['Twitter (seed)', 'Facebook (amplify)', 'Telegram (persist)'].map((p, i) => {
                const colors = ['#00f0ff', '#3b82f6', '#00ff88'];
                const times = ['T+0m', 'T+42m', 'T+2h14m'];
                const counts = ['23 posts', '87 posts', '2,440 forwards'];
                return (
                  <div key={p} className="flex-1 flex items-center">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="w-2 h-2 rounded-full" style={{ background: colors[i], boxShadow: `0 0 6px ${colors[i]}` }} />
                        <span className="text-[11px] font-mono font-bold" style={{ color: colors[i] }}>{p}</span>
                      </div>
                      <p className="text-[10px] font-mono text-white/70 ml-4">{times[i]} · {counts[i]}</p>
                    </div>
                    {i < 2 && <ArrowRight className="w-4 h-4 text-cyan-500/30 mx-2" />}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
