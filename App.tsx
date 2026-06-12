import React, { useState } from 'react';
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import { WardrobeProvider, useWardrobe } from './context/WardrobeContext';
import Navigation from './components/Navigation';
import ProfileSetup from './components/ProfileSetup';
import LoadingScreen from './components/LoadingScreen';
import ClosetPage from './pages/ClosetPage';
import UploadPage from './pages/UploadPage';

import HomePage from './pages/HomePage';
import SettingsPage from './pages/SettingsPage';
import LandingPage from './pages/LandingPage';
import CalendarPage from './pages/CalendarPage';
import StylistPage from './pages/StylistPage';

// ── Inner App (has access to WardrobeContext) ────────────────────────────────

const AppContent: React.FC = () => {
  const { profile, loading } = useWardrobe();
  const [authMode, setAuthMode] = useState<'signup' | 'login' | null>(null);
  const [isSidebarExpanded, setIsSidebarExpanded] = useState(true);

  // ── Loading State ──────────────────────────────────────────────────────────
  if (loading) {
    return <LoadingScreen message="Loading Wardrobe..." />;
  }

  // ── Gate 1: No profile + no auth flow → Show Landing Page ─────────────────
  if (!profile && !authMode) {
    return (
      <LandingPage
        onSignup={() => setAuthMode('signup')}
        onLogin={() => setAuthMode('login')}
      />
    );
  }

  // ── Gate 2: No profile + auth flow active → Show Setup/Login Form ──────────
  if (!profile && authMode) {
    return <ProfileSetup mode={authMode} onBack={() => setAuthMode(null)} />;
  }

  // ── Gate 3: Profile exists → Render Main App ───────────────────────────────
  return (
    <div className="min-h-screen bg-p_cream text-white">
      <Navigation
        isExpanded={isSidebarExpanded}
        toggleSidebar={() => setIsSidebarExpanded((prev) => !prev)}
      />

      <main
        className={`transition-all duration-300 ease-in-out md:pl-32 min-h-screen pt-20 md:pt-0 pb-28 md:pb-0`}
      >
        <Routes>
          <Route path="/"           element={<Navigate to="/dashboard" replace />} />
          <Route path="/dashboard"  element={<HomePage />} />
          <Route path="/closet"     element={<ClosetPage />} />
          <Route path="/upload"     element={<UploadPage />} />

          <Route path="/calendar"   element={<CalendarPage />} />
          <Route path="/stylist"    element={<StylistPage />} />
          <Route path="/settings"   element={<SettingsPage />} />
          {/* Catch-all: redirect unknown routes to dashboard */}
          <Route path="*"           element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </main>
    </div>
  );
};

// ── Root App (provides all context at the top level) ─────────────────────────

const App: React.FC = () => (
  <WardrobeProvider>
    <HashRouter>
      <AppContent />
    </HashRouter>
  </WardrobeProvider>
);

export default App;
