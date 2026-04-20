import { useState } from 'react';
import { Search, Fingerprint, ShieldAlert, Clock, Database, Download, ArrowRight, AlertTriangle, Share2, Link2 } from 'lucide-react';

interface ScanResult {
  input: string;
  detected_type: 'phone' | 'email' | 'upi' | 'crypto' | 'domain' | 'ip' | 'aadhaar_masked' | 'handle' | 'bank_account';
  first_seen: string;
  last_seen: string;
  mention_count: number;
  risk_score: number;
  risk_factors: { name: string; weight: number }[];
  platforms: { name: string; count: number; color: string; first: string; last: string }[];
  linked_entities: { type: string; value: string; relation: string; confidence: number }[];
  related_identities: { similar: string; reason: string }[];
  sample_posts: { platform: string; timestamp: string; snippet: string }[];
}

const RESULTS: Record<string, ScanResult> = {
  phone: {
    input: '+91-9876-5432-11',
    detected_type: 'phone',
    first_seen: '2025-11-14T08:22Z',
    last_seen: '2026-04-20T08:47Z',
    mention_count: 347,
    risk_score: 0.84,
    risk_factors: [
      { name: 'Appears in 3 fraud patterns', weight: 0.28 },
      { name: 'Linked to flagged UPI ID',     weight: 0.22 },
      { name: 'Cross-platform rapid spread', weight: 0.18 },
      { name: 'Carrier: prepaid throwaway',  weight: 0.10 },
      { name: 'Low social proof',            weight: 0.06 },
    ],
    platforms: [
      { name: 'Twitter',  count: 147, color: '#00f0ff', first: '2025-11-14', last: '2026-04-20' },
      { name: 'Telegram', count: 112, color: '#00ff88', first: '2025-12-02', last: '2026-04-20' },
      { name: 'Facebook', count: 48,  color: '#3b82f6', first: '2026-01-08', last: '2026-04-19' },
      { name: 'Reddit',   count: 22,  color: '#ff6b00', first: '2026-01-22', last: '2026-04-18' },
      { name: 'WhatsApp', count: 18,  color: '#22c55e', first: '2026-02-11', last: '2026-04-19' },
    ],
    linked_entities: [
      { type: 'UPI',      value: 'quick.money@ybl',           relation: 'financial_link', confidence: 0.96 },
      { type: 'UPI',      value: 'lucky.prize@paytm',         relation: 'financial_link', confidence: 0.89 },
      { type: 'Domain',   value: 'pm-kisan-check.com',        relation: 'co_mentioned',   confidence: 0.91 },
      { type: 'Handle',   value: '@farmer_help_official',     relation: 'posted_by',      confidence: 0.98 },
      { type: 'Crypto',   value: 'bc1qw508d6qejxtdg4y5r3za…', relation: 'co_mentioned',   confidence: 0.73 },
      { type: 'Person',   value: 'Rajesh Kumar',              relation: 'claimed_owner',  confidence: 0.64 },
    ],
    related_identities: [
      { similar: '+91-9876-5432-10', reason: 'Consecutive number · same carrier · same SIM batch' },
      { similar: '+91-9876-5432-12', reason: 'Consecutive number · same carrier · same SIM batch' },
      { similar: '+91-9876-8732-11', reason: 'Same last-4 · used in similar fraud template' },
    ],
    sample_posts: [
      { platform: 'twitter',  timestamp: '2026-04-20 08:47Z', snippet: 'PM Kisan ₹6000 refund delayed — claim at pm-kisan-check.com or call 91-9876-5432-11' },
      { platform: 'telegram', timestamp: '2026-04-20 08:12Z', snippet: 'सरकारी योजना: कॉल 9876543211 पे तुरंत लाभ उठाएं' },
      { platform: 'facebook', timestamp: '2026-04-19 18:03Z', snippet: 'कृषि कल्याण मंत्रालय से verified नंबर : +919876543211' },
    ],
  },
  upi: {
    input: 'fraud.alert@upi',
    detected_type: 'upi',
    first_seen: '2026-01-03T12:48Z',
    last_seen: '2026-04-20T08:01Z',
    mention_count: 184,
    risk_score: 0.91,
    risk_factors: [
      { name: 'Flagged by NPCI fraud bureau', weight: 0.35 },
      { name: 'Linked to 7 mule accounts',    weight: 0.28 },
      { name: 'High-velocity transactions',   weight: 0.14 },
      { name: 'Handle mismatch (claims bank)', weight: 0.09 },
      { name: 'Appears in scam templates',    weight: 0.05 },
    ],
    platforms: [
      { name: 'Telegram', count: 94, color: '#00ff88', first: '2026-01-03', last: '2026-04-20' },
      { name: 'Twitter',  count: 52, color: '#00f0ff', first: '2026-02-11', last: '2026-04-19' },
      { name: 'WhatsApp', count: 24, color: '#22c55e', first: '2026-02-24', last: '2026-04-18' },
      { name: 'Reddit',   count: 14, color: '#ff6b00', first: '2026-03-04', last: '2026-04-14' },
    ],
    linked_entities: [
      { type: 'Phone',    value: '+91-9876543211',           relation: 'financial_link', confidence: 0.96 },
      { type: 'UPI',      value: 'claim.prize@gpay',         relation: 'same_device',    confidence: 0.88 },
      { type: 'Bank A/C', value: 'HDFC-XXXXX-***4821',       relation: 'settles_to',     confidence: 0.92 },
      { type: 'Domain',   value: 'pm-kisan-check.com',       relation: 'payout_url',     confidence: 0.84 },
    ],
    related_identities: [
      { similar: 'fraud.alert@okhdfcbank', reason: 'Same prefix · sibling handle · same IP session' },
      { similar: 'fraud_alert.official@ybl', reason: 'Typo-squat · spelled similar · registered within 48h' },
    ],
    sample_posts: [
      { platform: 'telegram', timestamp: '2026-04-20 08:01Z', snippet: 'Send Rs 500 to fraud.alert@upi and get Rs 5000 back in 24 hours — govt approved' },
      { platform: 'twitter',  timestamp: '2026-04-19 16:40Z', snippet: 'KYC verify via fraud.alert@upi — tested by officials' },
    ],
  },
  domain: {
    input: 'pm-kisan-check.com',
    detected_type: 'domain',
    first_seen: '2026-02-14T04:12Z',
    last_seen: '2026-04-20T08:47Z',
    mention_count: 92,
    risk_score: 0.95,
    risk_factors: [
      { name: 'Lookalike of pmkisan.gov.in',   weight: 0.38 },
      { name: 'Registered < 90 days ago',      weight: 0.22 },
      { name: 'Privacy-protected WHOIS',       weight: 0.14 },
      { name: 'Hosted on known bulletproof ASN', weight: 0.12 },
      { name: 'Phishing kit detected',         weight: 0.09 },
    ],
    platforms: [
      { name: 'Twitter',  count: 45, color: '#00f0ff', first: '2026-02-14', last: '2026-04-20' },
      { name: 'Telegram', count: 28, color: '#00ff88', first: '2026-02-18', last: '2026-04-20' },
      { name: 'Facebook', count: 12, color: '#3b82f6', first: '2026-03-01', last: '2026-04-12' },
      { name: 'WhatsApp', count: 7,  color: '#22c55e', first: '2026-03-12', last: '2026-04-10' },
    ],
    linked_entities: [
      { type: 'IP',       value: '103.178.42.17', relation: 'hosted_on', confidence: 0.99 },
      { type: 'UPI',      value: 'fraud.alert@upi',           relation: 'payout_processor', confidence: 0.88 },
      { type: 'Phone',    value: '+91-9876543211',             relation: 'contact_advertised', confidence: 0.92 },
      { type: 'Org',      value: 'Terror Watch Network (impersonated)', relation: 'impersonates', confidence: 0.71 },
    ],
    related_identities: [
      { similar: 'pm-kisan-verify.in', reason: 'Lookalike · same registrar · different TLD · same IP range' },
      { similar: 'pmkisan-check.in',   reason: 'Hyphen variation · same kit fingerprint' },
    ],
    sample_posts: [
      { platform: 'twitter',  timestamp: '2026-04-20 08:47Z', snippet: 'PM Kisan refund status — check at pm-kisan-check.com' },
      { platform: 'telegram', timestamp: '2026-04-20 07:22Z', snippet: 'किसान भाइयों: pm-kisan-check.com पर तुरंत KYC करें' },
    ],
  },
};

const INPUT_TYPE_PATTERNS: { type: ScanResult['detected_type']; re: RegExp; label: string; color: string }[] = [
  { type: 'phone', re: /^\+?[\d\-\s()]{8,}$/, label: 'PHONE',  color: '#00ff88' },
  { type: 'email', re: /^[^\s@]+@[^\s@]+\.[^\s@]+$/, label: 'EMAIL', color: '#bf5fff' },
  { type: 'upi',   re: /^[\w.\-]+@(ybl|paytm|okaxis|okhdfcbank|oksbi|gpay|upi)$/i, label: 'UPI', color: '#ffaa00' },
  { type: 'crypto',re: /^(bc1|0x|[1-9A-HJ-NP-Za-km-z])[a-zA-Z0-9]{26,}$/, label: 'CRYPTO WALLET', color: '#eab308' },
  { type: 'domain',re: /^[\w-]+(\.[\w-]+)+$/, label: 'DOMAIN', color: '#ff6b00' },
  { type: 'ip',    re: /^\d+\.\d+\.\d+\.\d+$/, label: 'IP', color: '#6366f1' },
];

function EgoGraph({ center, connections }: { center: string; connections: { label: string; type: string; confidence: number }[] }) {
  const size = 400;
  const cx = size / 2;
  const cy = size / 2;
  const N = connections.length;
  const radius = 140;

  const colors: Record<string, string> = {
    UPI: '#ffaa00', Phone: '#00ff88', Domain: '#ff6b00', Handle: '#00f0ff', Crypto: '#eab308',
    Person: '#3b82f6', 'Bank A/C': '#22c55e', IP: '#6366f1', Org: '#a855f7',
  };

  return (
    <svg width={size} height={size}>
      <defs>
        <radialGradient id="centerGlow">
          <stop offset="0%" stopColor="#00f0ff" stopOpacity="1" />
          <stop offset="100%" stopColor="#00f0ff" stopOpacity="0.2" />
        </radialGradient>
      </defs>
      {connections.map((c, i) => {
        const angle = (i / N) * Math.PI * 2 - Math.PI / 2;
        const x = cx + Math.cos(angle) * radius;
        const y = cy + Math.sin(angle) * radius;
        const color = colors[c.type] || '#94a3b8';
        return (
          <g key={i}>
            <line x1={cx} y1={cy} x2={x} y2={y} stroke={color} strokeOpacity={0.4 + c.confidence * 0.4} strokeWidth={1 + c.confidence * 2} />
            <circle cx={x} cy={y} r={12 + c.confidence * 6} fill={color} fillOpacity={0.4} stroke={color} strokeWidth={1.5}
              style={{ filter: `drop-shadow(0 0 6px ${color})` }} />
            <text x={x} y={y + 32} textAnchor="middle" fill={color} fontSize="9" fontFamily="monospace">{c.type}</text>
            <text x={x} y={y + 44} textAnchor="middle" fill="white" fontSize="8" fontFamily="monospace" opacity={0.7}>
              {c.label.length > 18 ? c.label.slice(0, 18) + '…' : c.label}
            </text>
          </g>
        );
      })}
      <circle cx={cx} cy={cy} r={34} fill="url(#centerGlow)" stroke="#00f0ff" strokeWidth={2}
        style={{ filter: 'drop-shadow(0 0 12px #00f0ff)' }} />
      <text x={cx} y={cy - 2} textAnchor="middle" fill="white" fontSize="9" fontFamily="monospace" fontWeight="bold">QUERY</text>
      <text x={cx} y={cy + 10} textAnchor="middle" fill="white" fontSize="8" fontFamily="monospace" opacity={0.8}>{center.slice(0, 16)}</text>
    </svg>
  );
}

export default function IdScanPage() {
  const [query, setQuery] = useState('+91-9876-5432-11');
  const [activeKey, setActiveKey] = useState<keyof typeof RESULTS>('phone');

  const result = RESULTS[activeKey];
  const detected = INPUT_TYPE_PATTERNS.find(p => p.re.test(query.trim())) ||
    INPUT_TYPE_PATTERNS[0];

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2.5 mb-0.5">
            <Fingerprint className="w-5 h-5 text-cyan-400" style={{ filter: 'drop-shadow(0 0 6px rgba(0,240,255,0.7))' }} />
            <h1 className="text-2xl font-bold tracking-tight">
              <span className="text-cyan-400 text-glow-cyan">ID SCAN</span>{' '}
              <span className="text-white">MODULE</span>
            </h1>
          </div>
          <p className="text-[11px] font-mono uppercase tracking-[0.2em] text-cyan-500/60 ml-7">
            Entity pivot · cross-platform trace · linked identity expansion
          </p>
        </div>
      </div>

      {/* Search bar */}
      <div className="cyber-card rounded-lg p-4">
        <div className="flex items-center gap-3">
          <Search className="w-5 h-5 text-cyan-400" />
          <input
            type="text"
            value={query}
            onChange={e => setQuery(e.target.value)}
            className="flex-1 bg-transparent text-white text-lg font-mono outline-none"
            placeholder="Phone / Email / UPI / Crypto wallet / Domain / IP / Aadhaar-masked..."
          />
          <span
            className="px-2 py-1 rounded text-[10px] font-mono font-bold uppercase tracking-widest"
            style={{
              color: detected.color, background: `${detected.color}15`, border: `1px solid ${detected.color}40`,
            }}
          >
            DETECTED: {detected.label}
          </span>
          <button
            className="btn-cyber px-4 py-2 rounded-lg text-[11px] font-mono font-bold uppercase tracking-widest"
          >
            Scan Identity
          </button>
        </div>
        <div className="flex items-center gap-2 mt-2">
          <span className="text-[9px] font-mono text-cyan-500/50 uppercase tracking-widest">Try:</span>
          {[
            { key: 'phone',  sample: '+91-9876-5432-11' },
            { key: 'upi',    sample: 'fraud.alert@upi'  },
            { key: 'domain', sample: 'pm-kisan-check.com' },
          ].map(s => (
            <button
              key={s.key}
              onClick={() => { setQuery(s.sample); setActiveKey(s.key as keyof typeof RESULTS); }}
              className="text-[10px] font-mono px-2 py-0.5 rounded"
              style={{
                color: activeKey === s.key ? '#00f0ff' : 'rgba(0,240,255,0.6)',
                background: activeKey === s.key ? 'rgba(0,240,255,0.1)' : 'rgba(0,240,255,0.03)',
                border: `1px solid ${activeKey === s.key ? 'rgba(0,240,255,0.4)' : 'rgba(0,240,255,0.15)'}`,
              }}
            >
              {s.sample}
            </button>
          ))}
        </div>
      </div>

      {/* Result header row */}
      <div className="grid grid-cols-4 gap-4">
        <div className="col-span-2 cyber-card rounded-lg p-4"
          style={{ borderColor: result.risk_score > 0.8 ? 'rgba(255,51,85,0.4)' : 'rgba(0,240,255,0.25)' }}
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] font-mono text-cyan-400/70 uppercase tracking-widest">Entity Profile</span>
            <span className="text-[9px] font-mono text-cyan-500/50">Report: IDSCAN-{result.detected_type.toUpperCase()}-0034</span>
          </div>
          <p className="text-2xl font-bold text-white font-mono tracking-tight">{result.input}</p>
          <div className="flex items-center gap-4 mt-2 text-[11px] font-mono">
            <span><span className="text-cyan-500/50">Type:</span> <span className="uppercase font-bold text-cyan-300">{result.detected_type}</span></span>
            <span><span className="text-cyan-500/50">First Seen:</span> <span className="text-white/80">{result.first_seen}</span></span>
            <span><span className="text-cyan-500/50">Last Seen:</span> <span className="text-white/80">{result.last_seen}</span></span>
            <span><span className="text-cyan-500/50">Mentions:</span> <span className="font-bold text-amber-400">{result.mention_count.toLocaleString()}</span></span>
          </div>
        </div>

        {/* Risk gauge */}
        <div className="cyber-card rounded-lg p-4"
          style={{
            borderColor: result.risk_score > 0.8 ? 'rgba(255,51,85,0.4)' : 'rgba(0,240,255,0.25)',
            boxShadow: result.risk_score > 0.8 ? '0 0 18px rgba(255,51,85,0.15)' : 'none',
          }}
        >
          <p className="text-[10px] font-mono text-red-400/80 uppercase tracking-widest mb-1">Risk Score</p>
          <div className="flex items-end gap-2">
            <p className="text-4xl font-bold font-mono" style={{
              color: result.risk_score > 0.8 ? '#ff3355' : result.risk_score > 0.5 ? '#ffaa00' : '#00ff88',
              textShadow: `0 0 12px ${result.risk_score > 0.8 ? 'rgba(255,51,85,0.4)' : result.risk_score > 0.5 ? 'rgba(255,170,0,0.3)' : 'rgba(0,255,136,0.3)'}`,
            }}>
              {(result.risk_score * 100).toFixed(0)}
            </p>
            <span className="text-[12px] font-mono text-cyan-500/50 mb-1">/100</span>
          </div>
          <div className="h-1.5 bg-white/5 rounded-full overflow-hidden mt-1">
            <div className="h-full rounded-full"
              style={{
                width: `${result.risk_score * 100}%`,
                background: 'linear-gradient(90deg, #00ff88 0%, #ffaa00 50%, #ff3355 100%)',
                boxShadow: '0 0 6px rgba(255,51,85,0.4)',
              }} />
          </div>
        </div>

        {/* Export */}
        <div className="cyber-card rounded-lg p-4">
          <p className="text-[10px] font-mono text-cyan-400/70 uppercase tracking-widest mb-2">Evidence Bundle</p>
          <button className="w-full py-1.5 rounded-lg text-[10px] font-mono font-bold uppercase tracking-widest bg-cyan-500/10 border border-cyan-500/40 text-cyan-400 hover:bg-cyan-500/20 transition-all flex items-center justify-center gap-2 mb-1">
            <Download className="w-3 h-3" /> Export PDF Report
          </button>
          <button className="w-full py-1.5 rounded-lg text-[10px] font-mono font-bold uppercase tracking-widest bg-cyan-500/5 border border-cyan-500/20 text-cyan-500/70 hover:text-white transition-all flex items-center justify-center gap-2">
            <Share2 className="w-3 h-3" /> Push to Case
          </button>
        </div>
      </div>

      <div className="grid grid-cols-12 gap-4">
        {/* Risk factors */}
        <div className="col-span-5 cyber-card rounded-lg p-4">
          <div className="flex items-center gap-2 mb-3">
            <ShieldAlert className="w-4 h-4 text-red-400" />
            <span className="text-[10px] font-mono text-red-400/80 uppercase tracking-widest">Risk Factor Breakdown</span>
          </div>
          {result.risk_factors.map((f, i) => (
            <div key={i} className="mb-2">
              <div className="flex items-center justify-between text-[10px] font-mono mb-0.5">
                <span className="text-white/85">{f.name}</span>
                <span className="text-amber-400 font-bold">+{(f.weight * 100).toFixed(0)}</span>
              </div>
              <div className="h-1 bg-white/5 rounded-full overflow-hidden">
                <div className="h-full rounded-full"
                  style={{ width: `${f.weight * 100 * 2}%`, background: '#ff6b00', boxShadow: '0 0 4px #ff6b00' }} />
              </div>
            </div>
          ))}

          <div className="mt-4 pt-3 border-t border-cyan-500/10">
            <p className="text-[10px] font-mono text-cyan-400/70 uppercase tracking-widest mb-2 flex items-center gap-2">
              <Link2 className="w-3.5 h-3.5" /> Related Identities (similar-match)
            </p>
            {result.related_identities.map((r, i) => (
              <div key={i} className="mb-2 pb-2 border-b border-cyan-500/5 last:border-0 last:mb-0 last:pb-0">
                <p className="text-[11px] font-mono font-bold text-white/90">{r.similar}</p>
                <p className="text-[10px] font-mono text-cyan-500/60 leading-snug">{r.reason}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Ego graph */}
        <div className="col-span-7 cyber-card rounded-lg p-4 flex flex-col items-center">
          <div className="flex items-center gap-2 mb-2 self-start">
            <Database className="w-4 h-4 text-cyan-400" />
            <span className="text-[10px] font-mono text-cyan-400/70 uppercase tracking-widest">
              2-Hop Ego Graph · Linked Identities
            </span>
          </div>
          <EgoGraph
            center={result.input}
            connections={result.linked_entities.map(e => ({ label: e.value, type: e.type, confidence: e.confidence }))}
          />
          <div className="w-full mt-2 space-y-1">
            {result.linked_entities.map((e, i) => (
              <div key={i} className="flex items-center gap-2 text-[10px] font-mono py-0.5">
                <span className="px-1.5 rounded text-[9px] w-16 text-center uppercase font-bold"
                  style={{ color: '#00f0ff', background: 'rgba(0,240,255,0.08)', border: '1px solid rgba(0,240,255,0.25)' }}>
                  {e.type}
                </span>
                <span className="text-white/90 flex-1 truncate">{e.value}</span>
                <span className="text-cyan-500/60 capitalize">{e.relation.replace('_', ' ')}</span>
                <span className="text-amber-400 font-bold w-10 text-right">{(e.confidence * 100).toFixed(0)}%</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Platform occurrences + sample posts */}
      <div className="grid grid-cols-5 gap-4">
        <div className="col-span-2 cyber-card rounded-lg p-4">
          <div className="flex items-center gap-2 mb-3">
            <Clock className="w-4 h-4 text-cyan-400" />
            <span className="text-[10px] font-mono text-cyan-400/70 uppercase tracking-widest">Cross-Platform Occurrences</span>
          </div>
          <table className="w-full text-[10px] font-mono">
            <thead>
              <tr className="text-cyan-500/50">
                <th className="text-left p-1 font-normal uppercase tracking-wider">Platform</th>
                <th className="text-right p-1 font-normal uppercase tracking-wider">Count</th>
                <th className="text-right p-1 font-normal uppercase tracking-wider">First</th>
                <th className="text-right p-1 font-normal uppercase tracking-wider">Last</th>
              </tr>
            </thead>
            <tbody>
              {result.platforms.map(p => (
                <tr key={p.name} className="border-t border-cyan-500/5">
                  <td className="p-1.5">
                    <span className="flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full" style={{ background: p.color, boxShadow: `0 0 4px ${p.color}` }} />
                      <span className="text-white/85 font-bold">{p.name}</span>
                    </span>
                  </td>
                  <td className="p-1.5 text-right text-amber-400 font-bold">{p.count}</td>
                  <td className="p-1.5 text-right text-cyan-500/60 text-[9px]">{p.first}</td>
                  <td className="p-1.5 text-right text-cyan-500/60 text-[9px]">{p.last}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="col-span-3 cyber-card rounded-lg p-4">
          <div className="flex items-center gap-2 mb-3">
            <AlertTriangle className="w-4 h-4 text-amber-400" />
            <span className="text-[10px] font-mono text-amber-400/80 uppercase tracking-widest">Sample Posts (context)</span>
          </div>
          {result.sample_posts.map((s, i) => (
            <div key={i} className="mb-2 pb-2 border-b border-cyan-500/5 last:border-0">
              <div className="flex items-center gap-2 mb-0.5">
                <span className="text-[9px] font-mono uppercase tracking-widest font-bold text-cyan-400">{s.platform}</span>
                <span className="text-[9px] font-mono text-cyan-500/50">{s.timestamp}</span>
              </div>
              <p className="text-[11px] font-mono text-white/90 leading-snug">{s.snippet}</p>
            </div>
          ))}
          <button className="text-[10px] font-mono uppercase tracking-widest text-cyan-400 hover:text-cyan-300 flex items-center gap-1 mt-2">
            View all {result.mention_count} mentions <ArrowRight className="w-3 h-3" />
          </button>
        </div>
      </div>
    </div>
  );
}
