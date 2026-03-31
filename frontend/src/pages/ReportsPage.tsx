import { useEffect, useState } from 'react';
import { Download } from 'lucide-react';
import { getReports, generateReport } from '../api/endpoints';
import type { ReportItem } from '../types';
import toast from 'react-hot-toast';

interface SessionReport {
  id: string;
  title: string;
  report_type: string;
  file_format: string;
  created_at: string;
}

const FORMAT_BADGE: Record<string, string> = {
  pdf:  'bg-[rgba(255,51,85,0.1)] text-[#ff3355] border border-[#ff3355]/20',
  docx: 'bg-cyan-400/10 text-cyan-400 border border-cyan-400/20',
  xlsx: 'bg-emerald-400/10 text-emerald-400 border border-emerald-400/20',
};

export default function ReportsPage() {
  const [reports, setReports] = useState<ReportItem[]>([]);
  const [generating, setGenerating] = useState(false);
  const [reportType, setReportType] = useState('sitrep');
  const [format, setFormat] = useState('pdf');
  const [sessionReports, setSessionReports] = useState<SessionReport[]>([]);

  const load = () => getReports().then(({ data }) => setReports(data));
  useEffect(() => { load(); }, []);

  const handleGenerate = async () => {
    setGenerating(true);
    const title = `E-SitRep — ${new Date().toLocaleDateString()}`;
    try {
      const { data } = await generateReport({
        title,
        report_type: reportType,
        format,
        parameters: { date_range: '7d' },
      });
      toast.success('Report generated successfully');
      const newReport: SessionReport = {
        id: data?.id ?? String(Date.now()),
        title,
        report_type: reportType,
        file_format: format,
        created_at: new Date().toISOString(),
      };
      setSessionReports((prev) => [newReport, ...prev]);
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
      <div className="bg-[rgba(0,240,255,0.03)] border border-[rgba(0,240,255,0.12)] rounded-xl p-6 space-y-4" style={{ backdropFilter: 'blur(4px)' }}>
        <h3 className="text-lg font-semibold text-white">Generate Intelligence Report</h3>
        <div className="grid grid-cols-3 gap-4">
          <div>
            <label className="block font-mono text-xs uppercase tracking-widest text-cyan-400/70 mb-2">Report Type</label>
            <select value={reportType} onChange={(e) => setReportType(e.target.value)}
              className="w-full px-3 py-2 bg-[rgba(0,0,0,0.3)] border border-[rgba(0,240,255,0.15)] rounded-lg text-sm text-white focus:outline-none focus:border-cyan-400/50 transition-colors">
              <option value="sitrep">E-SitRep (Situation Report)</option>
              <option value="weekly">Weekly Analysis</option>
              <option value="threat">Threat Assessment</option>
              <option value="fraud">Financial Fraud Report</option>
            </select>
          </div>
          <div>
            <label className="block font-mono text-xs uppercase tracking-widest text-cyan-400/70 mb-2">Format</label>
            <select value={format} onChange={(e) => setFormat(e.target.value)}
              className="w-full px-3 py-2 bg-[rgba(0,0,0,0.3)] border border-[rgba(0,240,255,0.15)] rounded-lg text-sm text-white focus:outline-none focus:border-cyan-400/50 transition-colors">
              <option value="pdf">PDF</option>
              <option value="docx">Word (DOCX)</option>
              <option value="xlsx">Excel (XLSX)</option>
            </select>
          </div>
          <div className="flex items-end">
            <button onClick={handleGenerate} disabled={generating}
              className="btn-cyber w-full px-4 py-2 text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2">
              {generating && (
                <span className="w-4 h-4 border-2 border-cyan-400/30 border-t-cyan-400 rounded-full animate-spin" />
              )}
              {generating ? 'Generating...' : 'Generate Report'}
            </button>
          </div>
        </div>
      </div>

      {/* Session-generated reports */}
      {sessionReports.length > 0 && (
        <div className="bg-[rgba(0,240,255,0.03)] border border-[rgba(0,240,255,0.12)] rounded-xl overflow-hidden" style={{ backdropFilter: 'blur(4px)' }}>
          <div className="px-4 py-3 border-b border-[rgba(0,240,255,0.12)] flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400 shadow-[0_0_6px_rgba(0,255,136,0.6)]" />
            <h3 className="text-sm font-semibold text-white">Generated This Session</h3>
            <span className="text-xs text-slate-500 font-mono">({sessionReports.length})</span>
          </div>
          <table className="w-full">
            <thead>
              <tr className="border-b border-[rgba(0,240,255,0.12)]">
                <th className="text-left font-mono text-xs uppercase tracking-widest text-cyan-400/50 p-3">Title</th>
                <th className="text-left font-mono text-xs uppercase tracking-widest text-cyan-400/50 p-3">Type</th>
                <th className="text-left font-mono text-xs uppercase tracking-widest text-cyan-400/50 p-3">Format</th>
                <th className="text-left font-mono text-xs uppercase tracking-widest text-cyan-400/50 p-3">Generated</th>
                <th className="text-left font-mono text-xs uppercase tracking-widest text-cyan-400/50 p-3">Download</th>
              </tr>
            </thead>
            <tbody>
              {sessionReports.map((r) => (
                <tr key={r.id} className="border-b border-[rgba(0,240,255,0.06)] hover:bg-[rgba(0,240,255,0.03)] transition-colors">
                  <td className="p-3 text-sm text-white">{r.title}</td>
                  <td className="p-3 text-xs text-slate-400 capitalize font-mono">{r.report_type}</td>
                  <td className="p-3">
                    <span className={`px-2 py-0.5 rounded text-xs uppercase font-mono border ${FORMAT_BADGE[r.file_format] || 'bg-slate-500/20 text-slate-400 border-slate-500/20'}`}>
                      {r.file_format}
                    </span>
                  </td>
                  <td className="p-3 text-xs text-slate-500 font-mono">{new Date(r.created_at).toLocaleString()}</td>
                  <td className="p-3">
                    <a href={`${import.meta.env.VITE_API_URL || ''}/api/v1/reports/${r.id}/download`}
                      className="inline-flex items-center gap-1 text-xs px-2 py-1 bg-emerald-400/10 border border-emerald-400/25 text-emerald-400 rounded hover:bg-emerald-400/20 transition-colors"
                      target="_blank" rel="noopener noreferrer">
                      <Download className="w-3 h-3" />
                      Download
                    </a>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* All reports list */}
      <div className="bg-[rgba(0,240,255,0.03)] border border-[rgba(0,240,255,0.12)] rounded-xl overflow-hidden" style={{ backdropFilter: 'blur(4px)' }}>
        <div className="px-4 py-3 border-b border-[rgba(0,240,255,0.12)]">
          <h3 className="font-mono text-xs uppercase tracking-widest text-cyan-400/70">All Reports</h3>
        </div>
        <table className="w-full">
          <thead>
            <tr className="border-b border-[rgba(0,240,255,0.12)]">
              <th className="text-left font-mono text-xs uppercase tracking-widest text-cyan-400/50 p-3">Title</th>
              <th className="text-left font-mono text-xs uppercase tracking-widest text-cyan-400/50 p-3">Type</th>
              <th className="text-left font-mono text-xs uppercase tracking-widest text-cyan-400/50 p-3">Format</th>
              <th className="text-left font-mono text-xs uppercase tracking-widest text-cyan-400/50 p-3">Generated</th>
              <th className="text-left font-mono text-xs uppercase tracking-widest text-cyan-400/50 p-3">Download</th>
            </tr>
          </thead>
          <tbody>
            {reports.map((r) => (
              <tr key={r.id} className="border-b border-[rgba(0,240,255,0.06)] hover:bg-[rgba(0,240,255,0.03)] transition-colors">
                <td className="p-3 text-sm text-white">{r.title}</td>
                <td className="p-3 text-xs text-slate-400 capitalize font-mono">{r.report_type}</td>
                <td className="p-3">
                  <span className={`px-2 py-0.5 rounded text-xs uppercase font-mono border ${FORMAT_BADGE[r.file_format] || 'bg-slate-500/20 text-slate-400 border-slate-500/20'}`}>
                    {r.file_format}
                  </span>
                </td>
                <td className="p-3 text-xs text-slate-500 font-mono">{new Date(r.created_at).toLocaleString()}</td>
                <td className="p-3">
                  <a href={`${import.meta.env.VITE_API_URL || ''}/api/v1/reports/${r.id}/download`}
                    className="inline-flex items-center gap-1 text-xs px-2 py-1 bg-cyan-400/10 border border-cyan-400/25 text-cyan-400 rounded hover:bg-cyan-400/20 transition-colors"
                    target="_blank" rel="noopener noreferrer">
                    <Download className="w-3 h-3" />
                    Download
                  </a>
                </td>
              </tr>
            ))}
            {reports.length === 0 && (
              <tr><td colSpan={5} className="p-8 text-center text-slate-500 font-mono text-sm">No reports generated yet.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
