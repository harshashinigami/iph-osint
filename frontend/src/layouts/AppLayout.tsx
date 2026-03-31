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
      className="relative p-2 text-slate-400 hover:text-slate-200 transition-colors"
      aria-label="View alerts"
    >
      <Bell className="w-5 h-5" />
      {unread > 0 && (
        <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] flex items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white px-1 leading-none">
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
    <div className="flex min-h-screen bg-slate-950">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top header bar */}
        <header className="h-12 bg-slate-900 border-b border-slate-700 flex items-center justify-end px-6 shrink-0">
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
