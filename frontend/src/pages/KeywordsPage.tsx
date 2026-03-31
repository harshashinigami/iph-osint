import { useEffect, useState } from 'react';
import api from '../api/client';
import toast from 'react-hot-toast';

interface Keyword { id: string; keyword: string; category: string; is_active: boolean; match_count: number; }

const CATEGORY_COLORS: Record<string, string> = {
  threat:    'bg-[rgba(255,51,85,0.1)] text-[#ff3355] border border-[#ff3355]/20',
  fraud:     'bg-amber-400/10 text-amber-400 border border-amber-400/20',
  cyber:     'bg-cyan-400/10 text-cyan-400 border border-cyan-400/20',
  political: 'bg-violet-400/10 text-violet-400 border border-violet-400/20',
  extremism: 'bg-orange-400/10 text-orange-400 border border-orange-400/20',
};

export default function KeywordsPage() {
  const [keywords, setKeywords] = useState<Keyword[]>([]);
  const [newKw, setNewKw] = useState('');
  const [newCat, setNewCat] = useState('threat');

  const load = () => api.get('/api/v1/keywords').then(({ data }) => setKeywords(data)).catch(() => {});
  useEffect(() => { load(); }, []);

  const handleAdd = async () => {
    if (!newKw.trim()) return;
    await api.post('/api/v1/keywords', { keyword: newKw, category: newCat });
    toast.success('Keyword added');
    setNewKw('');
    load();
  };

  const handleDelete = async (id: string) => {
    await api.delete(`/api/v1/keywords/${id}`).catch(() => {});
    toast.success('Keyword deleted');
    load();
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-white">Keyword Management</h1>

      {/* Add keyword */}
      <div className="flex gap-3">
        <input value={newKw} onChange={(e) => setNewKw(e.target.value)} placeholder="Enter keyword..."
          className="flex-1 px-4 py-2 bg-[rgba(0,0,0,0.3)] border border-[rgba(0,240,255,0.15)] rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400/50 transition-colors"
          onKeyDown={(e) => e.key === 'Enter' && handleAdd()} />
        <select value={newCat} onChange={(e) => setNewCat(e.target.value)}
          className="px-3 py-2 bg-[rgba(0,0,0,0.3)] border border-[rgba(0,240,255,0.15)] rounded-lg text-sm text-white focus:outline-none focus:border-cyan-400/50 transition-colors">
          <option value="threat">Threat</option>
          <option value="fraud">Fraud</option>
          <option value="cyber">Cyber</option>
          <option value="political">Political</option>
          <option value="extremism">Extremism</option>
        </select>
        <button onClick={handleAdd}
          className="btn-cyber px-4 py-2 text-sm font-medium">
          Add Keyword
        </button>
      </div>

      {/* Keywords table */}
      <div className="bg-[rgba(0,240,255,0.03)] border border-[rgba(0,240,255,0.12)] rounded-xl overflow-hidden" style={{ backdropFilter: 'blur(4px)' }}>
        <table className="w-full">
          <thead>
            <tr className="border-b border-[rgba(0,240,255,0.12)]">
              <th className="text-left font-mono text-xs uppercase tracking-widest text-cyan-400/50 p-3">Keyword</th>
              <th className="text-left font-mono text-xs uppercase tracking-widest text-cyan-400/50 p-3">Category</th>
              <th className="text-left font-mono text-xs uppercase tracking-widest text-cyan-400/50 p-3">Status</th>
              <th className="text-left font-mono text-xs uppercase tracking-widest text-cyan-400/50 p-3">Matches</th>
              <th className="text-left font-mono text-xs uppercase tracking-widest text-cyan-400/50 p-3">Action</th>
            </tr>
          </thead>
          <tbody>
            {keywords.map((k) => (
              <tr key={k.id} className="border-b border-[rgba(0,240,255,0.06)] hover:bg-[rgba(0,240,255,0.03)] transition-colors">
                <td className="p-3 text-sm text-white font-medium font-mono">{k.keyword}</td>
                <td className="p-3">
                  <span className={`px-2 py-0.5 rounded text-xs capitalize ${CATEGORY_COLORS[k.category] || 'bg-slate-500/20 text-slate-400 border border-slate-500/20'}`}>
                    {k.category}
                  </span>
                </td>
                <td className="p-3">
                  <span className={`px-2 py-0.5 rounded text-xs font-mono border ${k.is_active ? 'bg-emerald-400/10 text-emerald-400 border-emerald-400/20' : 'bg-slate-500/10 text-slate-400 border-slate-500/20'}`}>
                    {k.is_active ? 'Active' : 'Paused'}
                  </span>
                </td>
                <td className="p-3 text-sm text-slate-300 font-mono">{k.match_count.toLocaleString()}</td>
                <td className="p-3">
                  <button
                    onClick={() => handleDelete(k.id)}
                    className="text-xs px-2 py-1 bg-[rgba(255,51,85,0.1)] border border-[#ff3355]/25 text-[#ff3355] rounded hover:bg-[rgba(255,51,85,0.2)] transition-colors"
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}
            {keywords.length === 0 && (
              <tr><td colSpan={5} className="p-8 text-center text-slate-500 font-mono text-sm">No keywords. Generate demo data from Sources page or add keywords above.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
