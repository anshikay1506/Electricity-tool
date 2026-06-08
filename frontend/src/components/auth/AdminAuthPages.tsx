import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Mail, Lock, ArrowLeft, Shield, AlertCircle, Eye, EyeOff } from 'lucide-react';

interface AdminAuthPageProps {
  onBackToLanding: () => void;
  onSuccess: () => void;
}

export const AdminAuthPage: React.FC<AdminAuthPageProps> = ({ 
  onBackToLanding, 
  onSuccess 
}) => {
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const API_BASE = (import.meta as any)?.env?.VITE_API_URL || 'http://localhost:5000';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    if (!email.trim() || !password) {
      setError('Email and password are required');
      setIsLoading(false);
      return;
    }

    try {
      console.log('Attempting login with:', { email: email.trim().toLowerCase() });
      
      const response = await fetch(`${API_BASE}/api/auth/admin-login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          email: email.trim().toLowerCase(), 
          password 
        })
      });

      console.log('Response status:', response.status);
      
      const data = await response.json();
      console.log('Response data:', data);

      if (!response.ok) {
        setError(data.error || `Login failed (${response.status})`);
        setIsLoading(false);
        return;
      }

      if (data.user.role !== 'ADMIN') {
        setError('Access denied. Admin privileges required.');
        setIsLoading(false);
        return;
      }

      login(data.token, data.user);
      onSuccess();

    } catch (err: any) {
      console.error('Fetch error:', err);
      setError(`Network error: ${err.message}. Make sure backend is running on port 5000.`);
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 to-gray-800 text-white flex flex-col justify-center items-center p-6 relative font-dm">
      <button 
        onClick={onBackToLanding}
        className="absolute top-8 left-8 text-sm font-semibold text-gray-300 hover:text-white flex items-center space-x-2 bg-white/10 backdrop-blur-sm border border-white/20 px-4 py-2 rounded-[8px] shadow-sm transition-all"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>Back to Main Portal</span>
      </button>

      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center mx-auto mb-4 shadow-lg">
            <Shield className="w-8 h-8 text-white" />
          </div>
          <h1 className="font-sora text-3xl font-bold text-white mb-2">Admin Portal</h1>
          <p className="text-gray-300 text-sm">Secure access for system administrators</p>
        </div>

        <form onSubmit={handleSubmit} className="bg-white/10 backdrop-blur-md rounded-2xl p-8 border border-white/20 shadow-xl">
          {error && (
            <div className="bg-red-500/20 border border-red-500/50 rounded-xl p-3 mb-6 flex items-center gap-2 text-red-200 text-sm">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div className="space-y-5">
            <div className="form-group">
              <label className="block text-sm font-semibold text-gray-200 mb-2">Email Address</label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-3.5 text-gray-400 w-[18px] h-[18px]" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@goar.gov.in"
                  className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-2.5 pl-10 text-white placeholder-gray-400 focus:outline-none focus:border-amber-500 transition-colors"
                  required
                  autoFocus
                />
              </div>
            </div>

            <div className="form-group">
              <label className="block text-sm font-semibold text-gray-200 mb-2">Password</label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-3.5 text-gray-400 w-[18px] h-[18px]" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-2.5 pl-10 pr-10 text-white placeholder-gray-400 focus:outline-none focus:border-amber-500 transition-colors"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-200"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button 
              type="submit" 
              disabled={isLoading}
              className="w-full bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white font-semibold py-3 rounded-lg transition-all mt-6 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span>Authenticating...</span>
                </>
              ) : (
                <>
                  <Shield className="w-4 h-4" />
                  <span>Sign In as Admin</span>
                </>
              )}
            </button>

            <div className="bg-amber-500/10 border border-amber-500/30 rounded-lg p-3 mt-4">
              <p className="text-amber-300 text-xs text-center flex items-center justify-center gap-2">
                <AlertCircle className="w-3 h-3" />
                Demo Admin: admin@goar.gov.in / admin123
              </p>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};