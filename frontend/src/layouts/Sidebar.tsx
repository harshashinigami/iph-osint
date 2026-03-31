import { NavLink, useLocation } from 'react-router-dom';
import {
  LayoutDashboard, Search, Network, Bell, FileText, Settings, LogOut, Shield, SlidersHorizontal, Database
} from 'lucide-react';
import { useAuth } from '../auth/AuthContext';

const navItems = [
  { to: '/', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/search', icon: Search, label: 'Search' },
  { to: '/sources', icon: Database, label: 'Sources' },
  { to: '/keywords', icon: Settings, label: 'Keywords' },
  { to: '/graph', icon: Network, label: 'Entity Graph' },
  { to: '/alerts', icon: Bell, label: 'Alerts' },
  { to: '/reports', icon: FileText, label: 'Reports' },
  { to: '/settings', icon: SlidersHorizontal, label: 'Settings' },
];

export default function Sidebar() {
  const { user, logout } = useAuth();
  const location = useLocation();

  return (
    <aside className="w-64 bg-slate-900 border-r border-slate-700 flex flex-col h-screen sticky top-0">
      {/* Logo / Branding */}
      <div className="p-5 border-b border-slate-700">
        <div className="flex items-center gap-3">
          <div className="flex-shrink-0 w-9 h-9 rounded-lg bg-blue-600/20 border border-blue-500/30 flex items-center justify-center">
            <Shield className="w-5 h-5 text-blue-400" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base font-bold text-white tracking-tight leading-none">ILA</h1>
              <span className="text-[10px] font-medium text-blue-400 bg-blue-500/10 border border-blue-500/20 rounded px-1.5 py-0.5 leading-none">
                v0.1
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">OSINT Intelligence Platform</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-3 space-y-0.5">
        {navItems.map(({ to, icon: Icon, label }) => {
          const isActive = to === '/'
            ? location.pathname === '/'
            : location.pathname.startsWith(to);
          return (
            <NavLink
              key={to}
              to={to}
              end={to === '/'}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors ${
                isActive
                  ? 'bg-slate-700 text-white font-medium'
                  : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'
              }`}
            >
              <Icon className={`w-5 h-5 flex-shrink-0 ${isActive ? 'text-blue-400' : ''}`} />
              {label}
            </NavLink>
          );
        })}
      </nav>

      {/* User */}
      <div className="p-4 border-t border-slate-700">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-white">{user?.display_name}</p>
            <p className="text-xs text-slate-400 capitalize">{user?.role}</p>
          </div>
          <button onClick={logout} className="p-2 text-slate-400 hover:text-red-400 transition-colors">
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </aside>
  );
}
