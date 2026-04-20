import { useState } from 'react';
import { ShieldCheck, ShieldAlert, ShieldX, BarChart3, Link2, History, Award, Flag } from 'lucide-react';

interface Source {
  id: string;
  url: string;
  name: string;
  type: 'news_site' | 'social_handle' | 'telegram_channel' | 'blog';
  verdict: 'HIGHLY_CREDIBLE' | 'CREDIBLE' | 'QUESTIONABLE' | 'LOW_CREDIBILITY';
  score: number;
  first_seen: string;
  factors: { name: string; score: number; weight: number }[];
  timeline: number[]; // 90 days
  fact_checks: { headline: string; verdict: string; org: string; date: string }[];
  network_trust: { links_in: number; from_trusted: number; from_known_bad: number };
  comparative: { name: string; score: number; delta: number }[];
}

const SOURCES: Source[] = [
  {
    id: 'SRC-0089',
    url: 'thehindu.com',
    name: 'The Hindu',
    type: 'news_site',
    verdict: 'HIGHLY_CREDIBLE',
    score: 88,
    first_seen: '2010-01-14',
    factors: [
      { name: 'Publisher reputation',   score: 94, weight: 0.25 },
      { name: 'Fact-check track record', score: 91, weight: 0.22 },
      { name: 'Content quality signals', score: 88, weight: 0.18 },
      { name: 'Network trust inbound',   score: 86, weight: 0.15 },
      { name: 'Posting pattern consistency', score: 90, weight: 0.12 },
      { name: 'Editorial transparency',  score: 78, weight: 0.08 },
    ],
    timeline: [87,87,88,88,87,88,89,88,89,88,88,89,88,88,87,88,89,89,89,88,88,89,89,89,88,88,88,89,89,89,88,89,89,90,89,89,89,88,89,89,89,89,89,89,90,89,90,89,89,90,89,89,89,88,88,89,89,89,89,89,89,88,89,89,89,89,88,89,88,89,89,89,89,89,88,89,89,89,89,88,88,89,88,89,89,88,89,88,89,88],
    fact_checks: [
      { headline: 'Story on Kargil drone incident corroborated', verdict: 'TRUE',  org: 'AltNews',       date: '2026-04-12' },
      { headline: 'Election data used correctly attributed',    verdict: 'TRUE',  org: 'Fact-Check India', date: '2026-03-24' },
      { headline: 'One opinion piece mischaracterized study',   verdict: 'MIXED', org: 'BoomLive',       date: '2026-02-18' },
    ],
    network_trust: { links_in: 18420, from_trusted: 15220, from_known_bad: 42 },
    comparative: [
      { name: 'Reuters',        score: 95, delta: +7 },
      { name: 'BBC',            score: 93, delta: +5 },
      { name: 'The Hindu',      score: 88, delta:  0 },
      { name: 'NDTV',           score: 84, delta: -4 },
      { name: 'Republic World', score: 58, delta: -30 },
      { name: 'OpIndia',        score: 41, delta: -47 },
    ],
  },
  {
    id: 'SRC-0143',
    url: '@narrative_hub_07',
    name: 'Narrative Hub',
    type: 'social_handle',
    verdict: 'LOW_CREDIBILITY',
    score: 18,
    first_seen: '2026-04-04',
    factors: [
      { name: 'Publisher reputation',   score: 8,  weight: 0.25 },
      { name: 'Fact-check track record', score: 14, weight: 0.22 },
      { name: 'Content quality signals', score: 28, weight: 0.18 },
      { name: 'Network trust inbound',   score: 11, weight: 0.15 },
      { name: 'Posting pattern consistency', score: 24, weight: 0.12 },
      { name: 'Editorial transparency',  score: 5,  weight: 0.08 },
    ],
    timeline: [82,80,78,79,75,74,72,73,68,65,62,60,58,52,48,47,42,40,38,35,32,28,25,23,22,24,26,28,29,30,26,22,19,18,17,16,18,19,18,17,16,15,18,19,22,24,26,28,25,22,20,18,17,16,18,19,22,24,21,18,19,22,18,16,15,14,13,15,18,20,21,18,16,15,14,13,14,16,18,17,16,18,19,17,16,18,17,16,18,18],
    fact_checks: [
      { headline: 'False: "IAF grounded pilots refused to fly"', verdict: 'FALSE',       org: 'AltNews',       date: '2026-04-18' },
      { headline: 'Misleading: drone video from Gaza claimed as India', verdict: 'FALSE',   org: 'BoomLive',      date: '2026-04-14' },
      { headline: 'Unverified: curfew notice in Srinagar (AI-generated audio)', verdict: 'FALSE', org: 'Fact-Check India', date: '2026-04-09' },
      { headline: 'False: fake PM Kisan scheme page', verdict: 'FALSE', org: 'Webqoof',        date: '2026-04-02' },
    ],
    network_trust: { links_in: 340, from_trusted: 12, from_known_bad: 238 },
    comparative: [
      { name: 'Narrative Hub',  score: 18, delta:   0 },
      { name: 'Truth Seeker 192', score: 22, delta: +4 },
      { name: 'Reality India',  score: 31, delta: +13 },
      { name: 'Avg news site',  score: 72, delta: +54 },
      { name: 'Reuters',        score: 95, delta: +77 },
    ],
  },
];

function Gauge({ score }: { score: number }) {
  const size = 180;
  const cx = size / 2;
  const cy = size / 2;
  const r = 68;
  const startAngle = -210;
  const endAngle = 30;
  const clampedAngle = startAngle + ((endAngle - startAngle) * score) / 100;

  // color based on score
  const color = score >= 80 ? '#00ff88' : score >= 60 ? '#00f0ff' : score >= 40 ? '#ffaa00' : '#ff3355';

  const toXY = (deg: number) => [cx + r * Math.cos((deg * Math.PI) / 180), cy + r * Math.sin((deg * Math.PI) / 180)];
  const [sx, sy] = toXY(startAngle);
  const [ex, ey] = toXY(endAngle);
  const [px, py] = toXY(clampedAngle);

  const largeArc = clampedAngle - startAngle > 180 ? 1 : 0;

  return (
    <svg width={size} height={size}>
      {/* base arc */}
      <path d={`M ${sx} ${sy} A ${r} ${r} 0 1 1 ${ex} ${ey}`} stroke="rgba(255,255,255,0.08)" strokeWidth={14} fill="none" strokeLinecap="round" />
      {/* value arc */}
      <path d={`M ${sx} ${sy} A ${r} ${r} 0 ${largeArc} 1 ${px} ${py}`} stroke={color} strokeWidth={14} fill="none" strokeLinecap="round"
        style={{ filter: `drop-shadow(0 0 8px ${color})` }}
      />
      {/* score text */}
      <text x={cx} y={cy + 4} textAnchor="middle" fill="white" fontSize="36" fontWeight="bold" fontFamily="monospace"
        style={{ textShadow: `0 0 12px ${color}` }}
      >
        {score}
      </text>
      <text x={cx} y={cy + 22} textAnchor="middle" fill={color} fontSize="9" fontFamily="monospace" letterSpacing="2">CRED INDEX</text>
      {/* ticks */}
      {[0, 25, 50, 75, 100].map(t => {
        const a = startAngle + ((endAngle - startAngle) * t) / 100;
        const [tx, ty] = toXY(a);
        return <text key={t} x={tx} y={ty + (a > -90 ? 16 : -6)} textAnchor="middle" fill="rgba(255,255,255,0.3)" fontSize="8" fontFamily="monospace">{t}</text>;
      })}
    </svg>
  );
}

function Sparkline({ data, color }: { data: number[]; color: string }) {
  const w = 600;
  const h = 100;
  const max = Math.max(...data);
  const min = Math.min(...data);
  const pts = data.map((v, i) => {
    const x = (i / (data.length - 1)) * w;
    const y = h - ((v - min) / (max - min || 1)) * h;
    return `${x},${y}`;
  }).join(' ');

  // area fill path
  const area = `M 0 ${h} L ${pts.split(' ').join(' L ')} L ${w} ${h} Z`;

  return (
    <svg width="100%" height={h} viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="none">
      <defs>
        <linearGradient id="spark-grad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.35" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={area} fill="url(#spark-grad)" />
      <polyline points={pts} fill="none" stroke={color} strokeWidth={1.5} style={{ filter: `drop-shadow(0 0 4px ${color})` }} />
    </svg>
  );
}

const VERDICT_STYLE: Record<string, { color: string; label: string; icon: React.ElementType; bg: string }> = {
  HIGHLY_CREDIBLE: { color: '#00ff88', label: 'HIGHLY CREDIBLE', icon: ShieldCheck, bg: 'rgba(0,255,136,0.08)' },
  CREDIBLE:        { color: '#00f0ff', label: 'CREDIBLE',        icon: ShieldCheck, bg: 'rgba(0,240,255,0.08)' },
  QUESTIONABLE:    { color: '#ffaa00', label: 'QUESTIONABLE',    icon: ShieldAlert, bg: 'rgba(255,170,0,0.08)' },
  LOW_CREDIBILITY: { color: '#ff3355', label: 'LOW CREDIBILITY', icon: ShieldX,     bg: 'rgba(255,51,85,0.08)' },
};

const FACT_CHECK_STYLE: Record<string, string> = {
  TRUE:  'text-green-400 bg-green-500/10 border-green-500/40',
  MIXED: 'text-amber-400 bg-amber-500/10 border-amber-500/40',
  FALSE: 'text-red-400 bg-red-500/10 border-red-500/40',
};

export default function CredibilityPage() {
  const [sel, setSel] = useState(SOURCES[1].id);
  const cur = SOURCES.find(s => s.id === sel)!;
  const V = VERDICT_STYLE[cur.verdict];

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2.5 mb-0.5">
            <Award className="w-5 h-5 text-cyan-400" style={{ filter: 'drop-shadow(0 0 6px rgba(0,240,255,0.7))' }} />
            <h1 className="text-2xl font-bold tracking-tight">
              <span className="text-cyan-400 text-glow-cyan">SOURCE</span>{' '}
              <span className="text-white">CREDIBILITY INTELLIGENCE</span>
            </h1>
          </div>
          <p className="text-[11px] font-mono uppercase tracking-[0.2em] text-cyan-500/60 ml-7">
            Multi-factor scoring · 90-day behavioral baseline · sock-puppet detection
          </p>
        </div>
      </div>

      {/* Selector */}
      <div className="flex items-center gap-2 flex-wrap">
        <span className="text-[10px] font-mono text-cyan-400/70 uppercase tracking-widest">Assessed Sources:</span>
        {SOURCES.map(s => (
          <button
            key={s.id}
            onClick={() => setSel(s.id)}
            className="px-3 py-1 rounded-full text-[10px] font-mono font-bold uppercase tracking-widest transition-all"
            style={{
              background: s.id === sel ? 'rgba(0,240,255,0.15)' : 'rgba(0,240,255,0.04)',
              border: `1px solid ${s.id === sel ? 'rgba(0,240,255,0.5)' : 'rgba(0,240,255,0.15)'}`,
              color: s.id === sel ? '#00f0ff' : 'rgba(255,255,255,0.5)',
            }}
          >
            {s.url} · {s.verdict.replace('_', ' ')}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-12 gap-4">
        {/* Summary card with gauge */}
        <div
          className="col-span-4 cyber-card rounded-lg p-4"
          style={{ background: V.bg, borderColor: `${V.color}40`, boxShadow: `0 0 20px ${V.color}15` }}
        >
          <div className="flex items-center justify-between mb-2">
            <div>
              <p className="text-[10px] font-mono text-cyan-400/70 uppercase tracking-widest">{cur.type.replace('_', ' ')}</p>
              <h3 className="text-xl font-bold text-white tracking-tight">{cur.name}</h3>
              <p className="text-[11px] font-mono text-cyan-300">{cur.url}</p>
            </div>
            <span
              className="px-2 py-1 rounded text-[9px] font-mono font-bold uppercase tracking-widest inline-flex items-center gap-1"
              style={{ color: V.color, background: `${V.color}15`, border: `1px solid ${V.color}50` }}
            >
              <V.icon className="w-3 h-3" /> {V.label}
            </span>
          </div>
          <div className="flex items-center justify-center py-2">
            <Gauge score={cur.score} />
          </div>
          <div className="flex items-center justify-between mt-2 text-[10px] font-mono">
            <span><span className="text-cyan-500/50">First Seen:</span> <span className="text-white">{cur.first_seen}</span></span>
            <span><span className="text-cyan-500/50">Assessments:</span> <span className="text-amber-400 font-bold">24</span></span>
          </div>
        </div>

        {/* Factors */}
        <div className="col-span-8 cyber-card rounded-lg p-4">
          <div className="flex items-center gap-2 mb-3">
            <BarChart3 className="w-4 h-4 text-cyan-400" />
            <span className="text-[10px] font-mono text-cyan-400/70 uppercase tracking-widest">
              Scoring Factor Breakdown (weighted sum = credibility score)
            </span>
          </div>
          {cur.factors.map((f, i) => {
            const c = f.score >= 80 ? '#00ff88' : f.score >= 60 ? '#00f0ff' : f.score >= 40 ? '#ffaa00' : '#ff3355';
            return (
              <div key={i} className="mb-2">
                <div className="flex items-center justify-between text-[10px] font-mono mb-0.5">
                  <span className="text-white/85">{f.name} <span className="text-cyan-500/50 ml-1">w={f.weight.toFixed(2)}</span></span>
                  <span className="font-bold" style={{ color: c }}>{f.score} / 100</span>
                </div>
                <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
                  <div className="h-full rounded-full transition-all duration-500"
                    style={{ width: `${f.score}%`, background: c, boxShadow: `0 0 6px ${c}` }} />
                </div>
              </div>
            );
          })}
        </div>

        {/* Timeline */}
        <div className="col-span-12 cyber-card rounded-lg p-4">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <History className="w-4 h-4 text-cyan-400" />
              <span className="text-[10px] font-mono text-cyan-400/70 uppercase tracking-widest">
                90-Day Credibility Timeline — detects sock-puppet pivot / capture
              </span>
            </div>
            {cur.verdict === 'LOW_CREDIBILITY' && (
              <span className="text-[9px] font-mono text-red-400 flex items-center gap-1">
                <Flag className="w-3 h-3" /> PATTERN SHIFT detected: score dropped 66→18 over 42 days → identity pivoted
              </span>
            )}
          </div>
          <Sparkline data={cur.timeline} color={V.color} />
          <div className="flex items-center justify-between text-[9px] font-mono text-cyan-500/50 mt-1">
            <span>T−90d</span>
            <span>T−60d</span>
            <span>T−30d</span>
            <span>Now</span>
          </div>
        </div>

        {/* Fact-check evidence */}
        <div className="col-span-7 cyber-card rounded-lg p-4">
          <div className="flex items-center gap-2 mb-3">
            <ShieldCheck className="w-4 h-4 text-amber-400" />
            <span className="text-[10px] font-mono text-amber-400/80 uppercase tracking-widest">
              Fact-Check Evidence (last 90d)
            </span>
          </div>
          {cur.fact_checks.map((f, i) => (
            <div key={i} className="mb-2 pb-2 border-b border-cyan-500/5 last:border-0 flex items-start gap-3">
              <span className={`px-1.5 py-0.5 rounded text-[9px] font-mono font-bold border uppercase tracking-widest ${FACT_CHECK_STYLE[f.verdict]}`}>
                {f.verdict}
              </span>
              <div className="flex-1">
                <p className="text-[11px] text-white/90 font-mono">{f.headline}</p>
                <p className="text-[9px] font-mono text-cyan-500/60">by {f.org} · {f.date}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Network trust + comparative */}
        <div className="col-span-5 space-y-4">
          <div className="cyber-card rounded-lg p-4">
            <div className="flex items-center gap-2 mb-3">
              <Link2 className="w-4 h-4 text-cyan-400" />
              <span className="text-[10px] font-mono text-cyan-400/70 uppercase tracking-widest">Network Trust</span>
            </div>
            <div className="space-y-1.5 text-[11px] font-mono">
              <div className="flex items-center justify-between">
                <span className="text-white/80">Total inbound links</span>
                <span className="text-white font-bold">{cur.network_trust.links_in.toLocaleString()}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-green-400/80">From trusted domains</span>
                <span className="text-green-400 font-bold">{cur.network_trust.from_trusted.toLocaleString()} ({((cur.network_trust.from_trusted/cur.network_trust.links_in)*100).toFixed(0)}%)</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-red-400/80">From known-bad sources</span>
                <span className="text-red-400 font-bold">{cur.network_trust.from_known_bad.toLocaleString()} ({((cur.network_trust.from_known_bad/cur.network_trust.links_in)*100).toFixed(1)}%)</span>
              </div>
            </div>
          </div>

          <div className="cyber-card rounded-lg p-4">
            <div className="flex items-center gap-2 mb-3">
              <BarChart3 className="w-4 h-4 text-cyan-400" />
              <span className="text-[10px] font-mono text-cyan-400/70 uppercase tracking-widest">Comparative Benchmark</span>
            </div>
            {cur.comparative.map((c, i) => {
              const is_self = c.name === cur.name;
              return (
                <div key={i} className="mb-1.5">
                  <div className="flex items-center justify-between text-[10px] font-mono mb-0.5">
                    <span className={is_self ? 'text-amber-400 font-bold' : 'text-white/75'}>{c.name} {is_self ? '◀ YOU' : ''}</span>
                    <span className="font-bold" style={{ color: c.score >= 80 ? '#00ff88' : c.score >= 60 ? '#00f0ff' : c.score >= 40 ? '#ffaa00' : '#ff3355' }}>
                      {c.score} {c.delta !== 0 && <span className="text-cyan-500/50 ml-1 text-[9px]">({c.delta > 0 ? '+' : ''}{c.delta})</span>}
                    </span>
                  </div>
                  <div className="h-1 bg-white/5 rounded-full overflow-hidden">
                    <div className="h-full rounded-full"
                      style={{
                        width: `${c.score}%`,
                        background: c.score >= 80 ? '#00ff88' : c.score >= 60 ? '#00f0ff' : c.score >= 40 ? '#ffaa00' : '#ff3355',
                      }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
