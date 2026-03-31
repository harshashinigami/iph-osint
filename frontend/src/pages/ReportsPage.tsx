import { useEffect, useState } from 'react';
import { getReports, generateReport } from '../api/endpoints';
import type { ReportItem } from '../types';
import toast from 'react-hot-toast';

export default function ReportsPage() {
  const [reports, setReports] = useState<ReportItem[]>([]);
  const [generating, setGenerating] = useState(false);
  const [reportType, setReportType] = useState('sitrep');
  const [format, setFormat] = useState('pdf');

  const load = () => getReports().then(({ data }) => setReports(data));
  useEffect(() => { load(); }, []);

  const handleGenerate = async () => {
    setGenerating(true);
    try {
      await generateReport({
        title: `E-SitRep — ${new Date().toLocaleDateString()}`,
        report_type: reportType,
        format,
        parameters: { date_range: '7d' },
      });
      toast.success('Report generation started');
      load();
    } catch {
      toast.error('Failed to generate report');
    }
    setGenerating(false);
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-white">E-SitRep Generator</h1>

      {/* Generator */}
      <div className="bg-slate-900 rounded-xl border border-slate-700 p-6 space-y-4">
        <h3 className="text-lg font-semibold text-white">Generate Intelligence Report</h3>
        <div className="grid grid-cols-3 gap-4">
          <div>
            <label className="block text-sm text-slate-400 mb-1">Report Type</label>
            <select value={reportType} onChange={(e) => setReportType(e.target.value)}
              className="w-full px-3 py-2 bg-slate-800 border border-slate-600 rounded-lg text-sm text-white">
              <option value="sitrep">E-SitRep (Situation Report)</option>
              <option value="weekly">Weekly Analysis</option>
              <option value="threat">Threat Assessment</option>
              <option value="fraud">Financial Fraud Report</option>
            </select>
          </div>
          <div>
            <label className="block text-sm text-slate-400 mb-1">Format</label>
            <select value={format} onChange={(e) => setFormat(e.target.value)}
              className="w-full px-3 py-2 bg-slate-800 border border-slate-600 rounded-lg text-sm text-white">
              <option value="pdf">PDF</option>
              <option value="docx">Word (DOCX)</option>
              <option value="xlsx">Excel (XLSX)</option>
            </select>
          </div>
          <div className="flex items-end">
            <button onClick={handleGenerate} disabled={generating}
              className="w-full px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-800 text-white rounded-lg text-sm font-medium transition-colors">
              {generating ? 'Generating...' : 'Generate Report'}
            </button>
          </div>
        </div>
      </div>

      {/* Reports list */}
      <div className="bg-slate-900 rounded-xl border border-slate-700 overflow-hidden">
        <table className="w-full">
          <thead><tr className="border-b border-slate-700">
            <th className="text-left text-xs text-slate-400 uppercase p-3">Title</th>
            <th className="text-left text-xs text-slate-400 uppercase p-3">Type</th>
            <th className="text-left text-xs text-slate-400 uppercase p-3">Format</th>
            <th className="text-left text-xs text-slate-400 uppercase p-3">Generated</th>
          </tr></thead>
          <tbody>
            {reports.map((r) => (
              <tr key={r.id} className="border-b border-slate-800 hover:bg-slate-800/50">
                <td className="p-3 text-sm text-white">{r.title}</td>
                <td className="p-3 text-xs text-slate-400 capitalize">{r.report_type}</td>
                <td className="p-3 text-xs text-slate-300 uppercase">{r.file_format}</td>
                <td className="p-3 text-xs text-slate-500">{new Date(r.created_at).toLocaleString()}</td>
              </tr>
            ))}
            {reports.length === 0 && (
              <tr><td colSpan={4} className="p-8 text-center text-slate-500">No reports generated yet.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
