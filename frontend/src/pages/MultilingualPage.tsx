import { useState } from 'react';
import { Languages, Type, FileText, AlertTriangle, CheckCircle2, Globe } from 'lucide-react';

interface Sample {
  id: string;
  platform: string;
  original: string;
  scripts: string[];
  languages: { code: string; name: string; conf: number }[];
  transliteration?: string;
  translation: string;
  entities: { type: string; value: string; conf: number; ner_lang: string }[];
  sentiment: { label: string; score: number };
  threat: number;
  code_mixed?: boolean;
}

const SAMPLES: Sample[] = [
  {
    id: 'ML-001',
    platform: 'twitter',
    original: 'कश्मीर में आज फिर से कर्फ्यू लगा है। @raeesu_kashmiri  ने बताया कि 91-99xx-xx-4521 पर call करो जल्दी। Aadhaar details verify करवाओ!',
    scripts: ['DEVANAGARI', 'LATIN'],
    languages: [
      { code: 'hi', name: 'Hindi', conf: 0.72 },
      { code: 'en', name: 'English', conf: 0.28 },
    ],
    code_mixed: true,
    transliteration: 'kashmir mein aaj phir se curfew laga hai. @raeesu_kashmiri ne bataya ki 91-99xx-xx-4521 par call karo jaldi. Aadhaar details verify karwao!',
    translation: 'Curfew again in Kashmir today. @raeesu_kashmiri says call 91-99xx-xx-4521 quickly. Get your Aadhaar details verified!',
    entities: [
      { type: 'location',  value: 'Kashmir / कश्मीर',      conf: 0.98, ner_lang: 'hi' },
      { type: 'handle',    value: '@raeesu_kashmiri',      conf: 1.00, ner_lang: 'en' },
      { type: 'phone',     value: '+91-99xx-xx-4521',      conf: 0.94, ner_lang: 'multi' },
      { type: 'doc_id',    value: 'Aadhaar (reference)',   conf: 0.81, ner_lang: 'en' },
      { type: 'keyword',   value: 'curfew / कर्फ्यू',       conf: 0.96, ner_lang: 'hi' },
    ],
    sentiment: { label: 'negative', score: -0.68 },
    threat: 0.81,
  },
  {
    id: 'ML-002',
    platform: 'telegram',
    original: 'سرینگر میں آج رات 8 بجے سے 6 بجے تک کرفیو۔ تمام لوگوں سے اپیل ہے کہ گھر میں رہیں۔ ذمہ دار: ملٹری انٹیلیجنس',
    scripts: ['ARABIC (Urdu)'],
    languages: [{ code: 'ur', name: 'Urdu', conf: 0.97 }],
    translation: 'Curfew in Srinagar tonight from 8pm to 6am. All people are requested to stay at home. Responsible: Military Intelligence.',
    entities: [
      { type: 'location', value: 'Srinagar / سرینگر',      conf: 0.99, ner_lang: 'ur' },
      { type: 'time',     value: '8pm - 6am',              conf: 0.92, ner_lang: 'ur' },
      { type: 'keyword',  value: 'curfew / کرفیو',           conf: 0.96, ner_lang: 'ur' },
      { type: 'org',      value: 'Military Intelligence',   conf: 0.88, ner_lang: 'ur' },
    ],
    sentiment: { label: 'very_negative', score: -0.81 },
    threat: 0.87,
  },
  {
    id: 'ML-003',
    platform: 'reddit',
    original: 'మా దగ్గర డ్రోన్‌లు దొరికాయి rajesh.kumar@paytm కి ₹10,000 పంపండి. verified scheme, government approved!!',
    scripts: ['TELUGU', 'LATIN'],
    languages: [
      { code: 'te', name: 'Telugu', conf: 0.68 },
      { code: 'en', name: 'English', conf: 0.32 },
    ],
    code_mixed: true,
    transliteration: 'ma daggara drones dorikaayi. rajesh.kumar@paytm ki ₹10,000 pampandi. verified scheme, government approved!!',
    translation: 'Drones have been found with us. Send ₹10,000 to rajesh.kumar@paytm. Verified scheme, government approved!!',
    entities: [
      { type: 'upi',     value: 'rajesh.kumar@paytm', conf: 0.99, ner_lang: 'en' },
      { type: 'money',   value: '₹10,000',             conf: 1.00, ner_lang: 'multi' },
      { type: 'keyword', value: 'drones / డ్రోన్‌లు',   conf: 0.95, ner_lang: 'te' },
    ],
    sentiment: { label: 'neutral', score: 0.02 },
    threat: 0.78,
  },
  {
    id: 'ML-004',
    platform: 'twitter',
    original: 'வெடிகுண்டு மிரட்டல்: Chennai central station evacuate! Police chase கதை சரியா? Verify from @cbi_india',
    scripts: ['TAMIL', 'LATIN'],
    languages: [
      { code: 'ta', name: 'Tamil',   conf: 0.64 },
      { code: 'en', name: 'English', conf: 0.36 },
    ],
    code_mixed: true,
    translation: 'Bomb threat: Chennai central station evacuated! Police chase — is the story real? Verify from @cbi_india',
    entities: [
      { type: 'keyword',  value: 'bomb threat / வெடிகுண்டு மிரட்டல்', conf: 0.97, ner_lang: 'ta' },
      { type: 'location', value: 'Chennai central station',            conf: 0.99, ner_lang: 'en' },
      { type: 'org',      value: 'Police',                              conf: 0.85, ner_lang: 'en' },
      { type: 'handle',   value: '@cbi_india',                          conf: 1.00, ner_lang: 'en' },
    ],
    sentiment: { label: 'negative', score: -0.72 },
    threat: 0.91,
  },
  {
    id: 'ML-005',
    platform: 'facebook',
    original: 'बंगाल मधे नवीन recruitment drive सुरु झाली! सर्व तरुण lucky.prize@ybl ला contact करा!',
    scripts: ['DEVANAGARI', 'LATIN'],
    languages: [
      { code: 'mr', name: 'Marathi', conf: 0.71 },
      { code: 'en', name: 'English', conf: 0.29 },
    ],
    code_mixed: true,
    translation: 'New recruitment drive started in Bengal! All youth contact lucky.prize@ybl!',
    entities: [
      { type: 'location', value: 'Bengal / बंगाल',   conf: 0.97, ner_lang: 'mr' },
      { type: 'upi',      value: 'lucky.prize@ybl',  conf: 0.99, ner_lang: 'en' },
      { type: 'keyword',  value: 'recruitment drive', conf: 0.89, ner_lang: 'multi' },
    ],
    sentiment: { label: 'neutral', score: 0.12 },
    threat: 0.63,
  },
  {
    id: 'ML-006',
    platform: 'youtube',
    original: 'বাংলাদেশ সীমান্তে নতুন অনুপ্রবেশ, চোরাকারবারিদের গ্রেপ্তার করা হয়েছে। Contact: +91-9876543210',
    scripts: ['BENGALI', 'LATIN'],
    languages: [
      { code: 'bn', name: 'Bengali', conf: 0.89 },
      { code: 'en', name: 'English', conf: 0.11 },
    ],
    translation: 'New infiltration at Bangladesh border, smugglers have been arrested. Contact: +91-9876543210',
    entities: [
      { type: 'location', value: 'Bangladesh border / বাংলাদেশ সীমান্ত', conf: 0.99, ner_lang: 'bn' },
      { type: 'keyword',  value: 'infiltration / অনুপ্রবেশ',               conf: 0.95, ner_lang: 'bn' },
      { type: 'phone',    value: '+91-9876543210',                        conf: 1.00, ner_lang: 'en' },
    ],
    sentiment: { label: 'negative', score: -0.54 },
    threat: 0.74,
  },
];

const SUPPORTED_LANG = [
  { code: 'hi', name: 'Hindi', script: 'Devanagari', accuracy: 94.2 },
  { code: 'ur', name: 'Urdu', script: 'Perso-Arabic', accuracy: 92.1 },
  { code: 'te', name: 'Telugu', script: 'Telugu', accuracy: 91.5 },
  { code: 'ta', name: 'Tamil', script: 'Tamil', accuracy: 92.8 },
  { code: 'bn', name: 'Bengali', script: 'Bengali', accuracy: 93.4 },
  { code: 'mr', name: 'Marathi', script: 'Devanagari', accuracy: 90.7 },
  { code: 'pa', name: 'Punjabi', script: 'Gurmukhi', accuracy: 88.9 },
  { code: 'ml', name: 'Malayalam', script: 'Malayalam', accuracy: 89.6 },
  { code: 'kn', name: 'Kannada', script: 'Kannada', accuracy: 90.2 },
  { code: 'gu', name: 'Gujarati', script: 'Gujarati', accuracy: 91.0 },
  { code: 'as', name: 'Assamese', script: 'Bengali', accuracy: 85.4 },
  { code: 'en', name: 'English', script: 'Latin', accuracy: 97.8 },
];

const ENTITY_COLOR: Record<string, string> = {
  location: '#bf5fff',
  handle:   '#00f0ff',
  phone:    '#00ff88',
  upi:      '#ffaa00',
  money:    '#ffaa00',
  doc_id:   '#ff6b00',
  keyword:  '#ff3355',
  time:     '#3b82f6',
  org:      '#ff6b00',
};

export default function MultilingualPage() {
  const [sel, setSel] = useState(SAMPLES[0].id);
  const cur = SAMPLES.find(s => s.id === sel)!;

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2.5 mb-0.5">
            <Languages className="w-5 h-5 text-cyan-400" style={{ filter: 'drop-shadow(0 0 6px rgba(0,240,255,0.7))' }} />
            <h1 className="text-2xl font-bold tracking-tight">
              <span className="text-cyan-400 text-glow-cyan">MULTILINGUAL</span>{' '}
              <span className="text-white">INTELLIGENCE</span>
            </h1>
          </div>
          <p className="text-[11px] font-mono uppercase tracking-[0.2em] text-cyan-500/60 ml-7">
            Indian language NLP · script detection · code-mixing · native-script NER
          </p>
        </div>
        <div className="flex items-center gap-2 text-[10px] font-mono uppercase tracking-widest">
          <span className="text-cyan-500/50">Avg. NER accuracy:</span>
          <span className="text-green-400 font-bold">91.3%</span>
          <span className="mx-2 text-cyan-500/30">·</span>
          <span className="text-cyan-500/50">Code-mix handling:</span>
          <span className="text-green-400 font-bold">enabled</span>
        </div>
      </div>

      {/* Supported languages */}
      <div className="cyber-card rounded-lg p-4">
        <div className="flex items-center gap-2 mb-3">
          <Globe className="w-4 h-4 text-cyan-400" />
          <span className="text-[10px] font-mono text-cyan-400/70 uppercase tracking-widest">
            Supported Languages — Indian OSINT Focus
          </span>
        </div>
        <div className="grid grid-cols-6 gap-2">
          {SUPPORTED_LANG.map(l => (
            <div key={l.code}
              className="rounded p-2 flex items-center justify-between"
              style={{
                background: 'rgba(0,240,255,0.03)',
                border: '1px solid rgba(0,240,255,0.15)',
              }}
            >
              <div>
                <p className="text-[11px] font-bold text-white">{l.name}</p>
                <p className="text-[9px] font-mono text-cyan-500/50">{l.script}</p>
              </div>
              <div className="text-right">
                <p className="text-[11px] font-mono font-bold text-green-400">{l.accuracy}%</p>
                <p className="text-[8px] font-mono text-cyan-500/40">NER</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Sample selector */}
      <div className="flex items-center gap-2 flex-wrap">
        <span className="text-[10px] font-mono text-cyan-400/70 uppercase tracking-widest">Sample Cases:</span>
        {SAMPLES.map(s => (
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
            {s.id} · {s.languages.map(l => l.code.toUpperCase()).join('+')} {s.code_mixed ? '· mixed' : ''}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-2 gap-4">
        {/* Left: Original + Processing */}
        <div className="space-y-4">
          {/* Original */}
          <div className="cyber-card rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] font-mono text-cyan-400/70 uppercase tracking-widest">
                Original Post — {cur.platform.toUpperCase()}
              </span>
              <span className="text-[9px] font-mono text-cyan-500/50">{cur.id}</span>
            </div>
            <p className="text-[14px] text-white/95 leading-relaxed font-mono" style={{ direction: cur.languages[0].code === 'ur' ? 'rtl' : 'ltr' }}>
              {cur.original}
            </p>
          </div>

          {/* Detected scripts + languages */}
          <div className="cyber-card rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <Type className="w-4 h-4 text-cyan-400" />
              <span className="text-[10px] font-mono text-cyan-400/70 uppercase tracking-widest">Script & Language Detection</span>
            </div>
            <div className="flex items-center gap-2 mb-3 flex-wrap">
              {cur.scripts.map(s => (
                <span key={s}
                  className="px-2 py-0.5 rounded text-[9px] font-mono font-bold uppercase tracking-wider"
                  style={{
                    background: 'rgba(191,95,255,0.1)',
                    border: '1px solid rgba(191,95,255,0.35)',
                    color: '#bf5fff',
                  }}
                >
                  SCRIPT: {s}
                </span>
              ))}
              {cur.code_mixed && (
                <span className="px-2 py-0.5 rounded text-[9px] font-mono font-bold uppercase tracking-wider bg-amber-500/15 border border-amber-500/40 text-amber-400">
                  CODE-MIXED
                </span>
              )}
            </div>
            {cur.languages.map(l => (
              <div key={l.code} className="flex items-center gap-3 mb-1.5">
                <span className="text-[11px] font-mono text-white/80 w-32">{l.name} [{l.code}]</span>
                <div className="flex-1 h-1.5 bg-white/5 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all"
                    style={{
                      width: `${l.conf * 100}%`,
                      background: 'linear-gradient(90deg, #00f0ff 0%, #bf5fff 100%)',
                      boxShadow: '0 0 6px rgba(0,240,255,0.3)',
                    }}
                  />
                </div>
                <span className="text-[10px] font-mono font-bold text-cyan-300 w-12 text-right">{(l.conf * 100).toFixed(0)}%</span>
              </div>
            ))}
          </div>

          {/* Transliteration */}
          {cur.transliteration && (
            <div className="cyber-card rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-[10px] font-mono text-amber-400/80 uppercase tracking-widest">Transliteration (native → Roman)</span>
              </div>
              <p className="text-[12px] font-mono text-amber-200/90 leading-relaxed">
                {cur.transliteration}
              </p>
            </div>
          )}
        </div>

        {/* Right: Translation + Entities */}
        <div className="space-y-4">
          {/* Translation */}
          <div className="cyber-card rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <FileText className="w-4 h-4 text-green-400" />
              <span className="text-[10px] font-mono text-green-400/80 uppercase tracking-widest">Translation (→ English)</span>
            </div>
            <p className="text-[14px] text-green-100/90 leading-relaxed font-mono">
              {cur.translation}
            </p>
          </div>

          {/* Extracted entities */}
          <div className="cyber-card rounded-lg p-4">
            <div className="flex items-center gap-2 mb-3">
              <AlertTriangle className="w-4 h-4 text-amber-400" />
              <span className="text-[10px] font-mono text-amber-400/80 uppercase tracking-widest">
                Extracted Entities (native-script NER)
              </span>
            </div>
            <div className="space-y-2">
              {cur.entities.map((e, i) => {
                const c = ENTITY_COLOR[e.type] || '#00f0ff';
                return (
                  <div key={i} className="flex items-center gap-2">
                    <span
                      className="px-1.5 py-0.5 rounded text-[9px] font-mono font-bold uppercase tracking-wider w-20 text-center"
                      style={{ color: c, background: `${c}15`, border: `1px solid ${c}40` }}
                    >
                      {e.type}
                    </span>
                    <span className="text-[12px] font-mono text-white/90 flex-1">{e.value}</span>
                    <span className="text-[9px] font-mono text-cyan-500/50">ner:{e.ner_lang}</span>
                    <span className="text-[10px] font-mono font-bold text-cyan-300 w-10 text-right">{(e.conf * 100).toFixed(0)}%</span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Sentiment / Threat */}
          <div className="grid grid-cols-2 gap-4">
            <div className="cyber-card rounded-lg p-3">
              <p className="text-[9px] font-mono text-cyan-400/70 uppercase tracking-widest mb-1">Sentiment (native script)</p>
              <p className="text-lg font-mono font-bold capitalize"
                style={{ color: cur.sentiment.score < -0.4 ? '#ff3355' : cur.sentiment.score > 0.4 ? '#00ff88' : '#ffaa00' }}>
                {cur.sentiment.label.replace('_', ' ')}
              </p>
              <p className="text-[10px] font-mono text-white/70">score: {cur.sentiment.score.toFixed(2)}</p>
            </div>
            <div className="cyber-card rounded-lg p-3">
              <p className="text-[9px] font-mono text-cyan-400/70 uppercase tracking-widest mb-1">Threat Score</p>
              <div className="flex items-center gap-2">
                <p className="text-lg font-mono font-bold"
                  style={{ color: cur.threat > 0.7 ? '#ff3355' : cur.threat > 0.4 ? '#ffaa00' : '#00ff88' }}>
                  {(cur.threat * 100).toFixed(0)}
                </p>
                <span className="text-[10px] font-mono text-cyan-500/50">/ 100</span>
                {cur.threat > 0.7 && <CheckCircle2 className="w-3 h-3 text-red-400 ml-auto" />}
              </div>
              <p className="text-[9px] font-mono text-cyan-500/50">model: IndicBERT + rule-based</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
