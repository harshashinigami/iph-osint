import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Shield } from 'lucide-react';
import { useAuth } from '../auth/AuthContext';
import { login as apiLogin } from '../api/endpoints';
import toast from 'react-hot-toast';

const DEMO_ACCOUNTS = [
  { username: 'admin', password: 'admin123', role: 'Administrator' },
  { username: 'analyst', password: 'analyst123', role: 'Analyst' },
  { username: 'viewer', password: 'viewer123', role: 'Viewer' },
];

export default function LoginPage() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const { data } = await apiLogin(username, password);
      login(data.access_token, data.user);
      navigate('/');
      toast.success('Welcome back, ' + data.user.display_name);
    } catch {
      setError('Invalid credentials. Please check your username and password.');
    } finally {
      setLoading(false);
    }
  };

  const fillCredentials = (u: string, p: string) => {
    setUsername(u);
    setPassword(p);
    setError('');
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center px-4">
      {/* Logo area */}
      <div className="text-center mb-8">
        <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-blue-600/20 border border-blue-500/30 mb-4 shadow-[0_0_32px_rgba(59,130,246,0.25)]">
          <Shield className="w-10 h-10 text-blue-400" />
        </div>
        <h1 className="text-3xl font-bold text-white tracking-tight">ILA OSINT</h1>
        <p className="text-slate-400 mt-1 text-sm font-medium">Intelligence Platform v0.1.0</p>
        <p className="text-xs text-slate-500 mt-1">Digital Intelligence, Threat &amp; Narrative Monitoring</p>
      </div>

      {/* Login card */}
      <div className="w-full max-w-md">
        <div className="bg-slate-900 rounded-2xl border border-slate-700 shadow-[0_0_48px_rgba(59,130,246,0.08),0_0_0_1px_rgba(99,102,241,0.05)] overflow-hidden">
          <div className="p-8">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm text-slate-400 mb-1.5">Username</label>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => { setUsername(e.target.value); setError(''); }}
                  className="w-full px-4 py-2.5 bg-slate-800 border border-slate-600 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/40 transition-colors"
                  placeholder="Enter username"
                  required
                  autoComplete="username"
                />
              </div>
              <div>
                <label className="block text-sm text-slate-400 mb-1.5">Password</label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => { setPassword(e.target.value); setError(''); }}
                  className="w-full px-4 py-2.5 bg-slate-800 border border-slate-600 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/40 transition-colors"
                  placeholder="Enter password"
                  required
                  autoComplete="current-password"
                />
              </div>

              {error && (
                <p className="text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">
                  {error}
                </p>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full py-2.5 bg-blue-600 hover:bg-blue-500 disabled:bg-blue-800 disabled:cursor-not-allowed text-white rounded-lg font-medium transition-colors shadow-[0_0_16px_rgba(59,130,246,0.3)]"
              >
                {loading ? 'Signing in...' : 'Sign In'}
              </button>

              <p className="text-xs text-slate-500 text-center">
                Authorized personnel only. All activity is logged.
              </p>
            </form>
          </div>

          {/* Demo credentials */}
          <div className="border-t border-slate-700/60 bg-slate-800/40 px-8 py-5">
            <p className="text-xs text-slate-500 font-medium uppercase tracking-wider mb-3">
              Demo Credentials
            </p>
            <div className="flex flex-wrap gap-2">
              {DEMO_ACCOUNTS.map(({ username: u, password: p, role }) => (
                <button
                  key={u}
                  type="button"
                  onClick={() => fillCredentials(u, p)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-slate-700 hover:bg-slate-600 border border-slate-600 hover:border-slate-500 text-xs text-slate-300 hover:text-white transition-colors cursor-pointer"
                >
                  <span className="font-mono font-medium">{u}</span>
                  <span className="text-slate-500">·</span>
                  <span className="text-slate-400">{role}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <p className="mt-8 text-xs text-slate-600">
        Powered by Project Horizon
      </p>
    </div>
  );
}
