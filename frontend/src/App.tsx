import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';

import { LanguageProvider } from './context/LanguageContext';
import { GoogleTranslateWrapper } from './context/GoogleTranslateWrapper';

import { LandingPage } from './components/landing/LandingPage';
import { ChargesCalculator } from './components/landing/ChargesCalculator';
import { RegulationsPage } from './components/landing/RegulationsPage';
import { AuthPages } from './components/auth/AuthPages';
import { DashboardLayout } from './components/layout/DashboardLayout';
import { ConsumerDashboard } from './components/dashboard/ConsumerDashboard';
import { SupplierDashboard } from './components/dashboard/SupplierDashboard';
import { AdminDashboard } from './components/dashboard/AdminDashboard';

const AppContent: React.FC = () => {
  const { user, token, loading, logout } = useAuth();

  const [viewState, setViewState] = useState<'LANDING' | 'REGULATIONS' | 'CALCULATOR' | 'AUTH' | 'DASHBOARD'>('LANDING');
  const [authRoleHint, setAuthRoleHint] = useState<'CONSUMER' | 'SUPPLIER'>('CONSUMER');
  const [authInitialView, setAuthInitialView] = useState<'login' | 'register'>('login');

  // Dashboard Tab state
  const [activeTab, setActiveTab] = useState<string>('dashboard');

  const startRegistration = (role: 'CONSUMER' | 'SUPPLIER') => {
    setAuthRoleHint(role);
    setAuthInitialView('register');
    setViewState('AUTH');
  };

  const startLogin = () => {
    setAuthInitialView('login');
    setViewState('AUTH');
  };

  const handleAuthSuccess = () => {
    setActiveTab('dashboard');
    setViewState('DASHBOARD');
  };

  // When auth state initializes, if user is present navigate to dashboard
  useEffect(() => {
    if (!loading && user && token) {
      const isPortalUser = user.role !== 'ADMIN';
      const needsApproval = user.status !== 'VERIFIED';

      if (isPortalUser && needsApproval) {
        logout();
        setViewState('AUTH');
        return;
      }

      setViewState('DASHBOARD');
    }
  }, [loading, user, token, logout]);

  // Show loading placeholder until auth is initialized
  if (loading) return null;

  // If user is logged in and selected dashboard view, show Dashboard
  if (user && token && viewState === 'DASHBOARD') {
    return (
      <DashboardLayout currentTab={activeTab} setTab={setActiveTab}>
        {user.role === 'CONSUMER' && (
          <ConsumerDashboard activeTab={activeTab} setTab={setActiveTab} />
        )}
        {user.role === 'SUPPLIER' && (
          <SupplierDashboard activeTab={activeTab} setTab={setActiveTab} />
        )}
        {user.role === 'ADMIN' && (
          <AdminDashboard activeTab={activeTab} setTab={setActiveTab} />
        )}
      </DashboardLayout>
    );
  }

  // Auth pages view
  if (viewState === 'AUTH') {
    return (
      <AuthPages
        initialRole={authRoleHint}
        initialView={authInitialView}
        onBackToLanding={() => setViewState('LANDING')}
        onSuccess={handleAuthSuccess}
      />
    );
  }

  if (viewState === 'REGULATIONS') {
    return (
      <RegulationsPage
        onBackToLanding={() => setViewState('LANDING')}
        onOpenCalculator={() => setViewState('CALCULATOR')}
        onLogin={startLogin}
      />
    );
  }

  if (viewState === 'CALCULATOR') {
    return (
      <ChargesCalculator
        onBackToLanding={() => setViewState('LANDING')}
        onOpenRegulations={() => setViewState('REGULATIONS')}
        onLogin={startLogin}
      />
    );
  }

  // Landing page view
  return (
    <LandingPage
      onStartAuth={startRegistration}
      onLogin={startLogin}
      onOpenRegulations={() => setViewState('REGULATIONS')}
      onOpenCalculator={() => setViewState('CALCULATOR')}
    />
  );
};


function App() {
  return (
    <AuthProvider>
      <LanguageProvider>
        <GoogleTranslateWrapper>
          <AppContent />
        </GoogleTranslateWrapper>
      </LanguageProvider>
    </AuthProvider>
  );
}

export default App;
