import { Outlet, Navigate, useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { Bell } from 'lucide-react';
import { useAuth } from '../auth/AuthContext';
import { getAlertStats } from '../api/endpoints';
import Sidebar from './Sidebar';

function NotificationBell() {
  const navigate = useNavigate();
  const [unread, setUnread] = useState(0);

  const fetchUnread = () => {
    getAlertStats()
      .then(({ data }) => setUnread(data?.unread ?? 0))
      .catch(() => {});
  };

  useEffect(() => {
    fetchUnread();
    const interval = setInterval(fetchUnread, 30_000);
    return () => clearInterval(interval);
  }, []);

  return (
    <button
      onClick={() => navigate('/alerts')}
      className="relative p-2 transition-colors"
      style={{ color: unread > 0 ? '#00f0ff' : 'rgba(0,240,255,0.35)' }}
      aria-label="View alerts"
    >
      <Bell
        className="w-5 h-5"
        style={unread > 0 ? { filter: 'drop-shadow(0 0 5px rgba(0,240,255,0.7))' } : {}}
      />
      {unread > 0 && (
        <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] flex items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white px-1 leading-none shadow-[0_0_8px_rgba(255,51,85,0.6)]">
          {unread > 99 ? '99+' : unread}
        </span>
      )}
    </button>
  );
}

export default function AppLayout() {
  const { isAuthenticated } = useAuth();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return (
    <div className="flex min-h-screen" style={{ background: '#050510' }}>
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top header bar */}
        <header
          className="h-12 flex items-center justify-end px-6 shrink-0"
          style={{
            background: 'rgba(0,0,0,0.50)',
            backdropFilter: 'blur(8px)',
            borderBottom: '1px solid rgba(0,240,255,0.08)',
          }}
        >
          <NotificationBell />
        </header>
        <main className="flex-1 overflow-auto">
          <div className="p-6">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}
