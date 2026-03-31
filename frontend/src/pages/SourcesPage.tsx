import { useEffect, useState } from 'react';
import { getSources, toggleSource, runSeed } from '../api/endpoints';
import api from '../api/client';
import type { SourceItem } from '../types';
import toast from 'react-hot-toast';

export default function SourcesPage() {
  const [sources, setSources] = useState<SourceItem[]>([]);
  const [seeding, setSeeding] = useState(false);
  const [collecting, setCollecting] = useState(false);

  const load = () => getSources().then(({ data }) => setSources(data));
  useEffect(() => { load(); }, []);

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
            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-800 text-white rounded-lg text-sm font-medium transition-colors"
          >
            {collecting ? 'Collecting...' : 'Fetch Live News (RSS)'}
          </button>
          <button
            onClick={handleSeed}
            disabled={seeding}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-800 text-white rounded-lg text-sm font-medium transition-colors"
          >
            {seeding ? 'Seeding...' : 'Generate Demo Data'}
          </button>
        </div>
      </div>

      <div className="bg-slate-900 rounded-xl border border-slate-700 overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-slate-700">
              <th className="text-left text-xs text-slate-400 uppercase p-3">Source</th>
              <th className="text-left text-xs text-slate-400 uppercase p-3">Platform</th>
              <th className="text-left text-xs text-slate-400 uppercase p-3">Status</th>
              <th className="text-left text-xs text-slate-400 uppercase p-3">Posts</th>
              <th className="text-left text-xs text-slate-400 uppercase p-3">Last Fetch</th>
              <th className="text-left text-xs text-slate-400 uppercase p-3">Active</th>
            </tr>
          </thead>
          <tbody>
            {sources.map((s) => (
              <tr key={s.id} className="border-b border-slate-800 hover:bg-slate-800/50">
                <td className="p-3 text-sm text-white font-medium">{s.name}</td>
                <td className="p-3 text-sm text-slate-300 capitalize">{s.platform}</td>
                <td className="p-3">
                  <span className={`px-2 py-0.5 rounded text-xs ${
                    s.status === 'running' ? 'bg-green-500/20 text-green-400' :
                    s.status === 'error' ? 'bg-red-500/20 text-red-400' :
                    'bg-slate-500/20 text-slate-400'
                  }`}>{s.status}</span>
                </td>
                <td className="p-3 text-sm text-slate-300">{s.post_count.toLocaleString()}</td>
                <td className="p-3 text-xs text-slate-500">{s.last_fetched_at ? new Date(s.last_fetched_at).toLocaleString() : 'Never'}</td>
                <td className="p-3">
                  <button
                    onClick={() => handleToggle(s.id, s.is_active)}
                    className={`w-10 h-5 rounded-full transition-colors ${s.is_active ? 'bg-green-600' : 'bg-slate-600'}`}
                  >
                    <div className={`w-4 h-4 bg-white rounded-full transition-transform ${s.is_active ? 'translate-x-5' : 'translate-x-0.5'}`} />
                  </button>
                </td>
              </tr>
            ))}
            {sources.length === 0 && (
              <tr><td colSpan={6} className="p-8 text-center text-slate-500">No sources configured. Click "Generate Demo Data" to create sample sources.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
