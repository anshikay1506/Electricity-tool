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
    // REMOVED: setActiveTab('dashboard'); - This was causing issues
    setViewState('DASHBOARD');
  };

  // When auth state initializes, if user is present navigate to dashboard
  useEffect(() => {
    if (!loading && user && token) {
      // REMOVED the status check since your User interface doesn't have status field
      // Just check if user exists and has valid role
      if (user && user.role) {
        setViewState('DASHBOARD');
        setActiveTab('dashboard'); // Set activeTab to dashboard when user logs in
      }
    }
  }, [loading, user, token]);

  // Show loading placeholder until auth is initialized
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-green-dark border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  // If user is logged in and selected dashboard view, show Dashboard
  if (user && token && viewState === 'DASHBOARD') {
    console.log('Rendering dashboard for role:', user.role, 'with activeTab:', activeTab);
    
    // Ensure activeTab is always 'dashboard' for consumer
    const finalActiveTab = user.role === 'CONSUMER' && activeTab === '' ? 'dashboard' : activeTab;
    
    return (
      <DashboardLayout currentTab={finalActiveTab} setTab={setActiveTab}>
        {user.role === 'CONSUMER' && (
          <ConsumerDashboard activeTab={finalActiveTab} setTab={setActiveTab} />
        )}
        {user.role === 'SUPPLIER' && (
          <SupplierDashboard activeTab={finalActiveTab} setTab={setActiveTab} />
        )}
        {user.role === 'ADMIN' && (
          <AdminDashboard activeTab={finalActiveTab} setTab={setActiveTab} />
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
