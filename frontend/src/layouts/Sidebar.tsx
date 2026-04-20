import { NavLink, useLocation } from 'react-router-dom';
import {
  LayoutDashboard, Search, Network, Bell, FileText, Settings, LogOut, Shield, SlidersHorizontal, Database, Globe,
  Camera, Radar, Target, Languages, Fingerprint, Award
} from 'lucide-react';
import { useAuth } from '../auth/AuthContext';

const navItems: Array<
  | { kind?: 'item'; to: string; icon: React.ElementType; label: string }
  | { kind: 'section'; label: string }
> = [
  { to: '/', icon: Globe, label: 'Geo Intel' },
  { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { kind: 'section', label: 'BEL Capability Modules' },
  { to: '/ephemeral',     icon: Camera,      label: 'Ephemeral Capture' },
  { to: '/narratives',    icon: Radar,       label: 'Coordinated Narr.' },
  { to: '/investigation', icon: Target,      label: 'Investigation' },
  { to: '/multilingual',  icon: Languages,   label: 'Multilingual NLP' },
  { to: '/id-scan',       icon: Fingerprint, label: 'ID Scan' },
  { to: '/credibility',   icon: Award,       label: 'Credibility' },
  { to: '/resilience',    icon: Shield,      label: 'Resilience' },
  { kind: 'section', label: 'Platform' },
  { to: '/search', icon: Search, label: 'Search' },
  { to: '/sources', icon: Database, label: 'Sources' },
  { to: '/keywords', icon: SlidersHorizontal, label: 'Keywords' },
  { to: '/graph', icon: Network, label: 'Entity Graph' },
  { to: '/alerts', icon: Bell, label: 'Alerts' },
  { to: '/reports', icon: FileText, label: 'Reports' },
  { to: '/settings', icon: Settings, label: 'Settings' },
];

export default function Sidebar() {
  const { user, logout } = useAuth();
  const location = useLocation();

  return (
    <aside
      className="w-64 flex flex-col h-screen sticky top-0"
      style={{
        background: 'rgba(0,0,0,0.65)',
        backdropFilter: 'blur(12px)',
        borderRight: '1px solid rgba(0,240,255,0.12)',
        boxShadow: '4px 0 24px rgba(0,240,255,0.04)',
      }}
    >
      {/* Logo / Branding */}
      <div
        className="p-5"
        style={{ borderBottom: '1px solid rgba(0,240,255,0.10)' }}
      >
        <div className="flex items-center gap-3">
          {/* Shield icon with scan line */}
          <div
            className="relative flex-shrink-0 w-9 h-9 rounded-lg flex items-center justify-center scan-line overflow-hidden"
            style={{
              background: 'rgba(0,240,255,0.08)',
              border: '1px solid rgba(0,240,255,0.30)',
              boxShadow: '0 0 16px rgba(0,240,255,0.20)',
            }}
          >
            <Shield className="w-5 h-5 relative z-10" style={{ color: '#00f0ff' }} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1
                className="text-base font-bold tracking-tight leading-none"
                style={{ color: '#00f0ff', textShadow: '0 0 10px rgba(0,240,255,0.6)' }}
              >
                ILA
              </h1>
              <span
                className="text-[10px] font-mono font-medium rounded px-1.5 py-0.5 leading-none"
                style={{
                  color: '#00f0ff',
                  background: 'rgba(0,240,255,0.08)',
                  border: '1px solid rgba(0,240,255,0.25)',
                }}
              >
                v0.1
              </span>
            </div>
            <p className="text-[10px] text-cyan-500/50 mt-0.5 uppercase tracking-widest font-mono">
              OSINT Platform
            </p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-3 space-y-0.5 overflow-y-auto">
        {navItems.map((item, idx) => {
          if ('kind' in item && item.kind === 'section') {
            return (
              <div key={`sec-${idx}`} className="pt-3 pb-1 px-3">
                <p className="text-[9px] font-mono uppercase tracking-[0.2em]" style={{ color: 'rgba(0,240,255,0.4)' }}>
                  {item.label}
                </p>
              </div>
            );
          }
          const { to, icon: Icon, label } = item as { to: string; icon: React.ElementType; label: string };
          const isActive = to === '/'
            ? location.pathname === '/'
            : location.pathname.startsWith(to);
          return (
            <NavLink
              key={to}
              to={to}
              end={to === '/'}
              className={`flex items-center gap-3 px-3 py-2 rounded-lg text-[13px] transition-all duration-150 font-medium ${
                isActive
                  ? 'text-white'
                  : 'text-cyan-500/50 hover:text-cyan-300/80'
              }`}
              style={isActive ? {
                background: 'rgba(0,240,255,0.08)',
                borderLeft: '2px solid #00f0ff',
                paddingLeft: '10px',
                boxShadow: 'inset 0 0 20px rgba(0,240,255,0.05)',
              } : {
                borderLeft: '2px solid transparent',
              }}
            >
              <Icon
                className="w-4 h-4 flex-shrink-0"
                style={isActive ? { color: '#00f0ff', filter: 'drop-shadow(0 0 4px rgba(0,240,255,0.7))' } : {}}
              />
              <span className={isActive ? 'tracking-wide' : ''}>{label}</span>
            </NavLink>
          );
        })}
      </nav>

      {/* User section */}
      <div
        className="p-4"
        style={{ borderTop: '1px solid rgba(0,240,255,0.10)' }}
      >
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-mono font-medium text-white/90 tracking-tight">
              {user?.display_name}
            </p>
            <p
              className="text-[10px] font-mono uppercase tracking-widest mt-0.5"
              style={{ color: '#00f0ff', opacity: 0.5 }}
            >
              {user?.role}
            </p>
          </div>
          <button
            onClick={logout}
            className="p-2 text-cyan-500/40 hover:text-red-400 transition-colors"
            title="Sign out"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </aside>
  );
}
