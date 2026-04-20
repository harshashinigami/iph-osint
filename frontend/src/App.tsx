import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from './auth/AuthContext';
import AppLayout from './layouts/AppLayout';
import LoginPage from './pages/LoginPage';
import GeoIntelPage from './pages/GeoIntelPage';
import DashboardPage from './pages/DashboardPage';
import SourcesPage from './pages/SourcesPage';
import KeywordsPage from './pages/KeywordsPage';
import EntityGraphPage from './pages/EntityGraphPage';
import AlertsPage from './pages/AlertsPage';
import ReportsPage from './pages/ReportsPage';
import SettingsPage from './pages/SettingsPage';
import SearchPage from './pages/SearchPage';
import EphemeralPage from './pages/EphemeralPage';
import CoordinatedNarrativesPage from './pages/CoordinatedNarrativesPage';
import InvestigationModePage from './pages/InvestigationModePage';
import MultilingualPage from './pages/MultilingualPage';
import IdScanPage from './pages/IdScanPage';
import CredibilityPage from './pages/CredibilityPage';
import ResiliencePage from './pages/ResiliencePage';

/** Catch-all: send unauthenticated users to /login, authenticated to /. */
function CatchAll() {
  const { isAuthenticated } = useAuth();
  return <Navigate to={isAuthenticated ? '/' : '/login'} replace />;
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route element={<AppLayout />}>
            <Route path="/" element={<GeoIntelPage />} />
            <Route path="/dashboard" element={<DashboardPage />} />
            <Route path="/ephemeral" element={<EphemeralPage />} />
            <Route path="/narratives" element={<CoordinatedNarrativesPage />} />
            <Route path="/investigation" element={<InvestigationModePage />} />
            <Route path="/multilingual" element={<MultilingualPage />} />
            <Route path="/id-scan" element={<IdScanPage />} />
            <Route path="/credibility" element={<CredibilityPage />} />
            <Route path="/resilience" element={<ResiliencePage />} />
            <Route path="/search" element={<SearchPage />} />
            <Route path="/sources" element={<SourcesPage />} />
            <Route path="/keywords" element={<KeywordsPage />} />
            <Route path="/graph" element={<EntityGraphPage />} />
            <Route path="/alerts" element={<AlertsPage />} />
            <Route path="/reports" element={<ReportsPage />} />
            <Route path="/settings" element={<SettingsPage />} />
          </Route>
          <Route path="*" element={<CatchAll />} />
        </Routes>
      </BrowserRouter>
      <Toaster
        position="top-right"
        toastOptions={{
          style: { background: '#1e293b', color: '#f1f5f9', border: '1px solid #334155' },
        }}
      />
    </AuthProvider>
  );
}
