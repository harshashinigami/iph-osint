import { useEffect, useState } from 'react';
import { getSources, toggleSource, runSeed } from '../api/endpoints';
import api from '../api/client';
import type { SourceItem } from '../types';
import toast from 'react-hot-toast';

const PLATFORM_BADGE: Record<string, string> = {
  rss:      'bg-cyan-400/10 text-cyan-400 border border-cyan-400/20',
  telegram: 'bg-blue-400/10 text-blue-400 border border-blue-400/20',
  twitter:  'bg-violet-400/10 text-violet-400 border border-violet-400/20',
  reddit:   'bg-orange-400/10 text-orange-400 border border-orange-400/20',
};

export default function SourcesPage() {
  const [sources, setSources] = useState<SourceItem[]>([]);
  const [seeding, setSeeding] = useState(false);
  const [collecting, setCollecting] = useState(false);
  const [posts, setPosts] = useState<any[]>([]);

  const load = () => getSources().then(({ data }) => setSources(data));
  const loadPosts = () => api.get('/api/v1/ingestion/posts?limit=20').then(({ data }) => setPosts(data));
  useEffect(() => { load(); loadPosts(); }, []);

  const handleToggle = async (id: string, active: boolean) => {
    await toggleSource(id, !active);
    toast.success(active ? 'Source disabled' : 'Source enabled');
    load();
  };

  const handleSeed = async () => {
    setSeeding(true);
    toast.loading('Generating synthetic data...', { id: 'seed' });
    try {
      const { data } = await runSeed();
      toast.success(`Seeded: ${data.counts.raw_posts} posts, ${data.counts.entities} entities, ${data.counts.alerts} alerts`, { id: 'seed' });
      load();
    } catch {
      toast.error('Seed failed', { id: 'seed' });
    }
    setSeeding(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-white">Data Sources</h1>
        <div className="flex gap-3">
          <button
            onClick={async () => { setCollecting(true); try { const { data } = await api.post('/api/v1/ingestion/collect/rss'); toast.success(`Collected ${data.new_posts} new articles from RSS feeds`); load(); } catch { toast.error('RSS collection failed'); } setCollecting(false); }}
            disabled={collecting}
            className="px-4 py-2 bg-emerald-400/10 hover:bg-emerald-400/20 disabled:opacity-50 border border-emerald-400/30 hover:border-emerald-400/50 text-emerald-400 rounded-lg text-sm font-medium transition-all"
          >
            {collecting ? 'Collecting...' : 'Fetch Live News (RSS)'}
          </button>
          <button
            onClick={handleSeed}
            disabled={seeding}
            className="btn-cyber px-4 py-2 text-sm font-medium disabled:opacity-50"
          >
            {seeding ? 'Seeding...' : 'Generate Demo Data'}
          </button>
        </div>
      </div>

      <div className="bg-[rgba(0,240,255,0.03)] border border-[rgba(0,240,255,0.12)] rounded-xl overflow-hidden" style={{ backdropFilter: 'blur(4px)' }}>
        <table className="w-full">
          <thead>
            <tr className="border-b border-[rgba(0,240,255,0.12)]">
              <th className="text-left font-mono text-xs uppercase tracking-widest text-cyan-400/50 p-3">Source</th>
              <th className="text-left font-mono text-xs uppercase tracking-widest text-cyan-400/50 p-3">Platform</th>
              <th className="text-left font-mono text-xs uppercase tracking-widest text-cyan-400/50 p-3">Status</th>
              <th className="text-left font-mono text-xs uppercase tracking-widest text-cyan-400/50 p-3">Posts</th>
              <th className="text-left font-mono text-xs uppercase tracking-widest text-cyan-400/50 p-3">Last Fetch</th>
              <th className="text-left font-mono text-xs uppercase tracking-widest text-cyan-400/50 p-3">Active</th>
            </tr>
          </thead>
          <tbody>
            {sources.map((s) => (
              <tr key={s.id} className="border-b border-[rgba(0,240,255,0.06)] hover:bg-[rgba(0,240,255,0.03)] transition-colors">
                <td className="p-3 text-sm text-white font-medium">{s.name}</td>
                <td className="p-3">
                  <span className={`px-2 py-0.5 rounded text-xs capitalize ${PLATFORM_BADGE[s.platform] || 'bg-slate-500/20 text-slate-400 border border-slate-500/20'}`}>
                    {s.platform}
                  </span>
                </td>
                <td className="p-3">
                  <span className={`px-2 py-0.5 rounded text-xs font-mono border ${
                    s.status === 'running' ? 'bg-emerald-400/10 text-emerald-400 border-emerald-400/20' :
                    s.status === 'error' ? 'bg-[rgba(255,51,85,0.1)] text-[#ff3355] border-[#ff3355]/20' :
                    'bg-amber-400/10 text-amber-400 border-amber-400/20'
                  }`}>{s.status}</span>
                </td>
                <td className="p-3 text-sm text-slate-300 font-mono">{s.post_count.toLocaleString()}</td>
                <td className="p-3 text-xs text-slate-500 font-mono">{s.last_fetched_at ? new Date(s.last_fetched_at).toLocaleString() : 'Never'}</td>
                <td className="p-3">
                  <button
                    onClick={() => handleToggle(s.id, s.is_active)}
                    className={`w-10 h-5 rounded-full transition-all ${s.is_active ? 'bg-emerald-400/40 border border-emerald-400/50' : 'bg-slate-700 border border-slate-600'}`}
                  >
                    <div className={`w-4 h-4 rounded-full transition-transform ${s.is_active ? 'bg-emerald-400 translate-x-5 shadow-[0_0_6px_rgba(0,255,136,0.6)]' : 'bg-slate-400 translate-x-0.5'}`} />
                  </button>
                </td>
              </tr>
            ))}
            {sources.length === 0 && (
              <tr><td colSpan={6} className="p-8 text-center text-slate-500 font-mono text-sm">No sources configured. Click "Generate Demo Data" to create sample sources.</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Recent Posts */}
      <div className="bg-[rgba(0,240,255,0.03)] border border-[rgba(0,240,255,0.12)] rounded-xl overflow-hidden" style={{ backdropFilter: 'blur(4px)' }}>
        <div className="p-4 border-b border-[rgba(0,240,255,0.12)] flex items-center justify-between">
          <h3 className="font-mono text-xs uppercase tracking-widest text-cyan-400/70">Recent Ingested Posts</h3>
          <button onClick={loadPosts} className="text-xs text-cyan-400 hover:text-cyan-300 font-mono transition-colors">Refresh</button>
        </div>
        <div className="max-h-96 overflow-y-auto">
          {posts.map((p) => (
            <div key={p.id} className="p-3 border-b border-[rgba(0,240,255,0.06)] hover:bg-[rgba(0,240,255,0.03)] transition-colors">
              <div className="flex items-center gap-2 mb-1">
                <span className={`text-xs px-2 py-0.5 rounded capitalize ${PLATFORM_BADGE[p.platform] || 'bg-slate-700 text-slate-300 border border-slate-600'}`}>{p.platform}</span>
                <span className="text-xs text-slate-400">{p.author_name}</span>
                <span className="text-xs text-slate-600 font-mono">{new Date(p.collected_at).toLocaleString()}</span>
              </div>
              <p className="text-sm text-slate-300">{p.content}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
