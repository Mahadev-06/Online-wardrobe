
import React, { useState } from 'react';
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import { WardrobeProvider, useWardrobe } from './context/WardrobeContext';
import { ToastProvider } from './context/ToastContext';
import Navigation from './components/Navigation';
import ProfileSetup from './components/ProfileSetup';
import ClosetPage from './pages/ClosetPage';
import UploadPage from './pages/UploadPage';
import MannequinPage from './pages/MannequinPage';
import HomePage from './pages/HomePage';
import SettingsPage from './pages/SettingsPage';
import LandingPage from './pages/LandingPage';

const AppContent: React.FC = () => {
  const { profile, loading } = useWardrobe();
  const [authMode, setAuthMode] = useState<'signup' | 'login' | null>(null);
  const [isSidebarExpanded, setIsSidebarExpanded] = useState(false);

  if (loading) return <div className="h-screen flex items-center justify-center bg-p_cream"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-p_red"></div></div>;

  // 1. If no profile and not interacting with auth, show Landing Page
  if (!profile && !authMode) {
      return <LandingPage onSignup={() => setAuthMode('signup')} onLogin={() => setAuthMode('login')} />;
  }

  // 2. If authenticating, show Setup/Login form
  if (!profile && authMode) {
      return <ProfileSetup mode={authMode} onBack={() => setAuthMode(null)} />;
  }

  // 3. If profile exists, show Main App with Dynamic Layout
  return (
    <div className="min-h-screen bg-p_cream text-p_dark">
      <Navigation 
        isExpanded={isSidebarExpanded} 
        toggleSidebar={() => setIsSidebarExpanded(!isSidebarExpanded)} 
      />
      
      {/* Main Content Wrapper - Adjusts padding based on sidebar state */}
      <main 
        className={`transition-all duration-300 ease-in-out ${isSidebarExpanded ? 'md:pl-64' : 'md:pl-20'} min-h-screen pb-24 md:pb-0`}
      >
        <Routes>
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="/dashboard" element={<HomePage />} />
          <Route path="/closet" element={<ClosetPage />} />
          <Route path="/upload" element={<UploadPage />} />
          <Route path="/mannequin" element={<MannequinPage />} />
          <Route path="/settings" element={<SettingsPage />} />
        </Routes>
      </main>
    </div>
  );
};

const App: React.FC = () => {
  return (
    <ToastProvider>
        <WardrobeProvider>
        <HashRouter>
            <AppContent />
        </HashRouter>
        </WardrobeProvider>
    </ToastProvider>
  );
};

export default App;
