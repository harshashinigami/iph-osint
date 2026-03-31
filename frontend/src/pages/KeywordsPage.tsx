import { useEffect, useState } from 'react';
import api from '../api/client';
import toast from 'react-hot-toast';

interface Keyword { id: string; keyword: string; category: string; is_active: boolean; match_count: number; }

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

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-white">Keyword Management</h1>

      {/* Add keyword */}
      <div className="flex gap-3">
        <input value={newKw} onChange={(e) => setNewKw(e.target.value)} placeholder="Enter keyword..."
          className="flex-1 px-4 py-2 bg-slate-800 border border-slate-600 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
          onKeyDown={(e) => e.key === 'Enter' && handleAdd()} />
        <select value={newCat} onChange={(e) => setNewCat(e.target.value)}
          className="px-3 py-2 bg-slate-800 border border-slate-600 rounded-lg text-sm text-white">
          <option value="threat">Threat</option>
          <option value="fraud">Fraud</option>
          <option value="cyber">Cyber</option>
          <option value="political">Political</option>
          <option value="extremism">Extremism</option>
        </select>
        <button onClick={handleAdd}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors">
          Add Keyword
        </button>
      </div>

      {/* Keywords table */}
      <div className="bg-slate-900 rounded-xl border border-slate-700 overflow-hidden">
        <table className="w-full">
          <thead><tr className="border-b border-slate-700">
            <th className="text-left text-xs text-slate-400 uppercase p-3">Keyword</th>
            <th className="text-left text-xs text-slate-400 uppercase p-3">Category</th>
            <th className="text-left text-xs text-slate-400 uppercase p-3">Status</th>
            <th className="text-left text-xs text-slate-400 uppercase p-3">Matches</th>
          </tr></thead>
          <tbody>
            {keywords.map((k) => (
              <tr key={k.id} className="border-b border-slate-800 hover:bg-slate-800/50">
                <td className="p-3 text-sm text-white font-medium">{k.keyword}</td>
                <td className="p-3"><span className="px-2 py-0.5 rounded text-xs bg-slate-700 text-slate-300 capitalize">{k.category}</span></td>
                <td className="p-3"><span className={`px-2 py-0.5 rounded text-xs ${k.is_active ? 'bg-green-500/20 text-green-400' : 'bg-slate-500/20 text-slate-400'}`}>{k.is_active ? 'Active' : 'Paused'}</span></td>
                <td className="p-3 text-sm text-slate-300">{k.match_count.toLocaleString()}</td>
              </tr>
            ))}
            {keywords.length === 0 && (
              <tr><td colSpan={4} className="p-8 text-center text-slate-500">No keywords. Generate demo data from Sources page or add keywords above.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
