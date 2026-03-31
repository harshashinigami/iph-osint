import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Shield } from 'lucide-react';
import { useAuth } from '../auth/AuthContext';
import { login as apiLogin } from '../api/endpoints';
import toast from 'react-hot-toast';

const DEMO_ACCOUNTS = [
  { username: 'admin',   password: 'admin123',   role: 'Administrator', chipStyle: { color: '#ff3355', border: 'rgba(255,51,85,0.4)',  bg: 'rgba(255,51,85,0.08)'  } },
  { username: 'analyst', password: 'analyst123', role: 'Analyst',       chipStyle: { color: '#00f0ff', border: 'rgba(0,240,255,0.4)', bg: 'rgba(0,240,255,0.06)' } },
  { username: 'viewer',  password: 'viewer123',  role: 'Viewer',        chipStyle: { color: '#00ff88', border: 'rgba(0,255,136,0.4)', bg: 'rgba(0,255,136,0.06)' } },
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
    <div
      className="min-h-screen matrix-bg flex flex-col items-center justify-center px-4"
      style={{ background: '#050510' }}
    >
      {/* Logo area */}
      <div className="text-center mb-8">
        <div
          className="inline-flex items-center justify-center w-20 h-20 rounded-2xl mb-4 relative scan-line overflow-hidden"
          style={{
            background: 'rgba(0,240,255,0.07)',
            border: '1px solid rgba(0,240,255,0.30)',
            boxShadow: '0 0 32px rgba(0,240,255,0.25), 0 0 64px rgba(0,240,255,0.08)',
          }}
        >
          <Shield
            className="w-10 h-10 relative z-10"
            style={{ color: '#00f0ff', filter: 'drop-shadow(0 0 8px rgba(0,240,255,0.8))' }}
          />
        </div>
        <h1
          className="text-3xl font-bold tracking-tight"
          style={{ color: '#ffffff', textShadow: '0 0 20px rgba(0,240,255,0.3)' }}
        >
          ILA OSINT
        </h1>
        <p
          className="mt-1 text-sm font-mono font-medium"
          style={{ color: 'rgba(0,240,255,0.6)' }}
        >
          Intelligence Platform v0.1.0
        </p>
        <p className="text-xs mt-1 font-mono" style={{ color: 'rgba(0,240,255,0.3)' }}>
          Digital Intelligence · Threat &amp; Narrative Monitoring
        </p>
      </div>

      {/* Login card */}
      <div className="w-full max-w-md">
        <div
          className="rounded-2xl overflow-hidden"
          style={{
            background: 'rgba(0,0,0,0.55)',
            border: '1px solid rgba(0,240,255,0.20)',
            boxShadow: '0 0 48px rgba(0,240,255,0.07), 0 0 0 1px rgba(0,240,255,0.05)',
            backdropFilter: 'blur(16px)',
          }}
        >
          <div className="p-8">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs text-cyan-400/60 mb-1.5 font-mono uppercase tracking-widest">
                  Username
                </label>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => { setUsername(e.target.value); setError(''); }}
                  className="w-full px-4 py-2.5 rounded-lg text-white placeholder-cyan-500/30 focus:outline-none transition-all font-mono"
                  style={{
                    background: 'rgba(0,240,255,0.04)',
                    border: '1px solid rgba(0,240,255,0.18)',
                  }}
                  onFocus={(e) => {
                    e.currentTarget.style.borderColor = 'rgba(0,240,255,0.5)';
                    e.currentTarget.style.boxShadow = '0 0 12px rgba(0,240,255,0.15)';
                  }}
                  onBlur={(e) => {
                    e.currentTarget.style.borderColor = 'rgba(0,240,255,0.18)';
                    e.currentTarget.style.boxShadow = 'none';
                  }}
                  placeholder="Enter username"
                  required
                  autoComplete="username"
                />
              </div>
              <div>
                <label className="block text-xs text-cyan-400/60 mb-1.5 font-mono uppercase tracking-widest">
                  Password
                </label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => { setPassword(e.target.value); setError(''); }}
                  className="w-full px-4 py-2.5 rounded-lg text-white placeholder-cyan-500/30 focus:outline-none transition-all font-mono"
                  style={{
                    background: 'rgba(0,240,255,0.04)',
                    border: '1px solid rgba(0,240,255,0.18)',
                  }}
                  onFocus={(e) => {
                    e.currentTarget.style.borderColor = 'rgba(0,240,255,0.5)';
                    e.currentTarget.style.boxShadow = '0 0 12px rgba(0,240,255,0.15)';
                  }}
                  onBlur={(e) => {
                    e.currentTarget.style.borderColor = 'rgba(0,240,255,0.18)';
                    e.currentTarget.style.boxShadow = 'none';
                  }}
                  placeholder="Enter password"
                  required
                  autoComplete="current-password"
                />
              </div>

              {error && (
                <p className="text-sm text-red-400 bg-red-500/10 border border-red-500/25 rounded-lg px-3 py-2 font-mono">
                  {error}
                </p>
              )}

              <button
                type="submit"
                disabled={loading}
                className="btn-cyber w-full py-2.5 rounded-lg font-mono font-semibold tracking-widest uppercase text-sm"
              >
                {loading ? 'AUTHENTICATING...' : 'SIGN IN'}
              </button>

              <p className="text-[10px] text-cyan-500/30 text-center font-mono uppercase tracking-widest">
                Authorized personnel only · All activity is logged
              </p>
            </form>
          </div>

          {/* Demo credentials */}
          <div
            className="px-8 py-5"
            style={{
              borderTop: '1px solid rgba(0,240,255,0.10)',
              background: 'rgba(0,240,255,0.02)',
            }}
          >
            <p className="text-[10px] text-cyan-500/40 font-mono uppercase tracking-widest mb-3">
              Demo Credentials
            </p>
            <div className="flex flex-wrap gap-2">
              {DEMO_ACCOUNTS.map(({ username: u, password: p, role, chipStyle }) => (
                <button
                  key={u}
                  type="button"
                  onClick={() => fillCredentials(u, p)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs cursor-pointer transition-all hover:scale-105"
                  style={{
                    color: chipStyle.color,
                    border: `1px solid ${chipStyle.border}`,
                    background: chipStyle.bg,
                    fontFamily: 'monospace',
                  }}
                  onMouseEnter={(e) => {
                    (e.currentTarget as HTMLButtonElement).style.boxShadow = `0 0 10px ${chipStyle.border}`;
                  }}
                  onMouseLeave={(e) => {
                    (e.currentTarget as HTMLButtonElement).style.boxShadow = 'none';
                  }}
                >
                  <span className="font-bold">{u}</span>
                  <span style={{ opacity: 0.4 }}>·</span>
                  <span style={{ opacity: 0.7 }}>{role}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <p className="mt-8 text-[10px] font-mono uppercase tracking-widest" style={{ color: 'rgba(0,240,255,0.2)' }}>
        Powered by Project Horizon
      </p>
    </div>
  );
}
