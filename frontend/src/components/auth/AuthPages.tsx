import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Mail, Lock,  ArrowLeft, CheckCircle, Eye, EyeOff, Shield } from 'lucide-react';

interface AuthPagesProps {
  initialRole?: 'CONSUMER' | 'SUPPLIER';
  initialView?: 'login' | 'register';
  onBackToLanding: () => void;
  onSuccess: () => void;
}

export const AuthPages: React.FC<AuthPagesProps> = ({ 
  initialRole = 'CONSUMER', 
  initialView = 'login',
  onBackToLanding, 
  onSuccess 
}) => {
  const { login } = useAuth();
  const [loginError, setLoginError] = useState('');
  const [registerError, setRegisterError] = useState('');
  const [registerSuccess, setRegisterSuccess] = useState('');
  
  const [isLoginView, setIsLoginView] = useState(initialView === 'login');
  
  // Registration flow states
  const [kNumber, setKNumber] = useState('');
  const [kNumberVerified, setKNumberVerified] = useState(false);
  const [kNumberData, setKNumberData] = useState<any>(null);
  const [isVerifyingKNumber, setIsVerifyingKNumber] = useState(false);
  const [selectedRole, setSelectedRole] = useState<'CONSUMER' | 'SUPPLIER'>('CONSUMER');
  
  // Common registration fields
  const [regEmail, setRegEmail] = useState('');
  const [regPass, setRegPass] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [passwordError, setPasswordError] = useState('');
  
  const [selectedDiscom, setSelectedDiscom] = useState('');
  const [discomVerified, setDiscomVerified] = useState(false);
  
  // Login states
  const [loginKNumber, setLoginKNumber] = useState('');
  const [loginKNumberVerified, setLoginKNumberVerified] = useState(false);
  const [loginKNumberData, setLoginKNumberData] = useState<any>(null);
  const [isVerifyingLoginKNumber, setIsVerifyingLoginKNumber] = useState(false);
  const [useOtp, setUseOtp] = useState(false);
  const [otpCode, setOtpCode] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [otpTimer, setOtpTimer] = useState(0);
  const [isLoadingOtp, setIsLoadingOtp] = useState(false);
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPass, setLoginPass] = useState('');

  const DISCOM_OPTIONS = [
    { value: 'JVVNL', label: 'Jaipur Vidyut Vitran Nigam Limited (JVVNL)' },
    { value: 'AVVNL', label: 'Ajmer Vidyut Vitran Nigam Limited (AVVNL)' },
    { value: 'DVVNL', label: 'Jodhpur Vidyut Vitran Nigam Limited (DVVNL)' },
    { value: 'JDVVNL', label: 'Kota Vidyut Vitran Nigam Limited (JDVVNL)' },
  ];
  
  const API_BASE = (import.meta as any)?.env?.VITE_API_URL || 'http://localhost:5000';

  // Timer for OTP resend
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (otpTimer > 0) {
      interval = setInterval(() => {
        setOtpTimer((prev) => prev - 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [otpTimer]);

  // ==================== LOGIN FUNCTIONS ====================
  
  const verifyKNumberForLogin = async () => {
    if (!loginKNumber.trim()) {
      setLoginError('Please enter your K number');
      return;
    }
    
    setIsVerifyingLoginKNumber(true);
    setLoginError('');
    
    try {
      const response = await fetch(`${API_BASE}/api/auth/validate-knumber`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ k_number: loginKNumber.trim() })
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        setLoginError(data.error || 'Invalid K number');
        setIsVerifyingLoginKNumber(false);
        return;
      }
      
      setLoginKNumberData(data.consumer);
      setLoginEmail(data.consumer.email || '');
      setLoginKNumberVerified(true);
      setLoginError('');
      
    } catch (err) {
      setLoginError('Network error. Please check your connection.');
    } finally {
      setIsVerifyingLoginKNumber(false);
    }
  };

  const sendOtp = async () => {
    if (!loginEmail.trim()) {
      setLoginError('Please enter your email address');
      return;
    }
    
    setIsLoadingOtp(true);
    setLoginError('');
    
    try {
      const response = await fetch(`${API_BASE}/api/auth/send-email-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: loginEmail.trim() })
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        setLoginError(data.error || 'Failed to send OTP');
        setIsLoadingOtp(false);
        return;
      }
      
      setOtpSent(true);
      setOtpTimer(60);
      setLoginError('');
      
    } catch (err) {
      setLoginError('Network error. Please try again.');
    } finally {
      setIsLoadingOtp(false);
    }
  };

  const verifyOtpAndLogin = async () => {
    if (!otpCode || otpCode.length !== 6) {
      setLoginError('Please enter a valid 6-digit OTP');
      return;
    }
    
    setIsLoadingOtp(true);
    setLoginError('');
    
    try {
      const response = await fetch(`${API_BASE}/api/auth/verify-email-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: loginEmail.trim(), otp: otpCode })
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        setLoginError(data.error || 'Invalid OTP');
        setIsLoadingOtp(false);
        return;
      }
      
      login(data.token, data.user);
      onSuccess();
      
    } catch (err) {
      setLoginError('Network error. Please try again.');
    } finally {
      setIsLoadingOtp(false);
    }
  };

  const handlePasswordLogin = async () => {
    setLoginError('');
    try {
      const res = await fetch(`${API_BASE}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: loginEmail.trim(), password: loginPass })
      });
      const data = await res.json();
      if (!res.ok) {
        setLoginError(res.status === 403 ? (data.error || 'Login not permitted') : (data.error || 'Login failed'));
        return;
      }
      
      login(data.token, data.user);
      onSuccess();
      
    } catch (err) {
      setLoginError('Network error — please check the backend');
    }
  };

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!loginKNumberVerified) {
      await verifyKNumberForLogin();
    } else if (useOtp) {
      if (!otpSent) {
        await sendOtp();
      } else {
        await verifyOtpAndLogin();
      }
    } else {
      await handlePasswordLogin();
    }
  };

  const resetLoginState = () => {
    setLoginKNumberVerified(false);
    setLoginKNumberData(null);
    setLoginKNumber('');
    setLoginEmail('');
    setLoginPass('');
    setUseOtp(false);
    setOtpSent(false);
    setOtpCode('');
    setLoginError('');
  };

  const verifyKNumberForRegistration = async () => {
    if (!kNumber.trim()) {
      setRegisterError('Please enter your K number');
      return;
    }
    
    setIsVerifyingKNumber(true);
    setRegisterError('');
    
    try {
      const response = await fetch(`${API_BASE}/api/auth/validate-knumber-for-registration`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ k_number: kNumber.trim() })
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        setRegisterError(data.error || 'Invalid K number');
        setIsVerifyingKNumber(false);
        return;
      }
      
      setKNumberData({
        name: data.consumer.name,
        email: data.consumer.email,
        mobile_number: data.consumer.mobile_number,
        connection_type: data.consumer.connection_type || 'Industrial',
        discom: data.consumer.discom || 'JVVNL'
      });
      
      setRegEmail(data.consumer.email || '');
      setKNumberVerified(true);
      setRegisterError('');
      
    } catch (err) {
      setRegisterError('Network error. Please check your connection.');
    } finally {
      setIsVerifyingKNumber(false);
    }
  };

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setRegisterError('');
    setRegisterSuccess('');
    setPasswordError('');

    if (regPass.length < 8) {
      setPasswordError('Password must be at least 8 characters');
      setRegisterError('Please use a password with at least 8 characters.');
      return;
    }
    
    if (regPass !== confirmPassword) {
      setPasswordError('Passwords do not match');
      setRegisterError('Please make sure your passwords match.');
      return;
    }

    try {
      if (selectedRole === 'CONSUMER') {
        const response = await fetch(`${API_BASE}/api/auth/register-with-knumber`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            k_number: kNumber,
            email: regEmail.trim(),
            password: regPass
          })
        });
        
        const data = await response.json();
        
        if (!response.ok) {
          setRegisterError(data.error || 'Registration failed');
          return;
        }
        
        const userData = {
          id: data.user.id,
          email: data.user.email,
          name: data.user.name,
          role: 'CONSUMER',
          phoneNumber: data.user.phoneNumber,
          k_number: data.user.k_number,
          connection_type: data.user.connection_type,
        };
        
        localStorage.setItem('goar_token', data.token);
        localStorage.setItem('goar_user', JSON.stringify(userData));
        
        login(data.token, userData);
        onSuccess();
        
      } else {
        if (!selectedDiscom) {
          setRegisterError('Please select a DISCOM');
          return;
        }

        const payload = {
          email: regEmail.trim(),
          password: regPass,
          name: kNumberData?.name,
          role: 'SUPPLIER',
          phoneNumber: kNumberData?.mobile_number,
          k_number: kNumber,
          connection_type: kNumberData?.connection_type || 'Industrial',
          discom: selectedDiscom,
          state: 'Rajasthan',
          injectionPoint: 'Grid Injection Point',
          renewableType: 'Solar'
        };

        const res = await fetch(`${API_BASE}/api/auth/register`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
        
        const data = await res.json();
        
        if (!res.ok) {
          setRegisterError(data.error || 'Registration failed');
          return;
        }

        setRegisterSuccess('Registration submitted successfully. Admin will review your account.');
        
        setTimeout(() => {
          setIsLoginView(true);
          resetRegistration();
        }, 2000);
      }
      
    } catch (err) {
      setRegisterError('Network error — please check the backend');
    }
  };

  const resetRegistration = () => {
    setKNumberVerified(false);
    setKNumberData(null);
    setKNumber('');
    setSelectedRole('CONSUMER');
    setRegEmail('');
    setRegPass('');
    setConfirmPassword('');
    setSelectedDiscom('');
    setDiscomVerified(false);
    setRegisterError('');
    setPasswordError('');
  };

  const toggleAuthView = () => {
    setIsLoginView(!isLoginView);
    resetRegistration();
    resetLoginState();
  };

  const verifyDiscom = async () => {
    if (!selectedDiscom) {
      setRegisterError('Please select your DISCOM');
      return;
    }
    
    setIsVerifyingKNumber(true);
    setRegisterError('');
    
    try {
      if (selectedDiscom !== kNumberData?.discom) {
        setRegisterError(`This K-number does not belong to ${selectedDiscom}. It belongs to ${kNumberData?.discom}. Please select the correct DISCOM.`);
        setIsVerifyingKNumber(false);
        return;
      }
      
      const response = await fetch(`${API_BASE}/api/auth/validate-knumber-for-registration`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          k_number: kNumber.trim(),
          discom: selectedDiscom 
        })
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        setRegisterError(data.error);
        setIsVerifyingKNumber(false);
        return;
      }
      
      setDiscomVerified(true);
      setRegisterError('');
      
    } catch (err) {
      setRegisterError('Network error. Please check your connection.');
    } finally {
      setIsVerifyingKNumber(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#f4f7f5] text-gray-900 flex flex-col justify-center items-center p-6 relative font-dm">
      <button 
        onClick={() => {
          resetLoginState();
          onBackToLanding();
        }}
        className="absolute top-8 left-8 text-sm font-semibold text-gray-600 hover:text-green-dark flex items-center space-x-2 bg-white border border-[#e0e8e4] px-4 py-2 rounded-[8px] shadow-sm transition-all"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>Return to Home</span>
      </button>

      <div className="w-full max-w-lg form-card shadow-md">
        <div className="text-center mb-8">
          <div className="w-14 h-14 rounded-2xl bg-green-pale flex items-center justify-center mx-auto mb-4">
            <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" className="w-7 h-7 fill-green-dark">
              <path d="M12 2L4 7v5c0 5.25 3.4 10.15 8 11.35C16.6 22.15 20 17.25 20 12V7l-8-5z"/>
              <path d="M9 12l2 2 4-4" stroke="rgba(255,255,255,0.8)" strokeWidth="1.5" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
          <h3 className="font-sora text-[22px] font-bold text-gray-900 mb-2">
            {isLoginView ? 'Sign in to your account' : 'Register for Open Access'}
          </h3>
        </div>

        {isLoginView ? (
          <form onSubmit={handleLoginSubmit} className="space-y-5">
            {loginError && <div className="alert alert-error">{loginError}</div>}

            {!loginKNumberVerified ? (
              <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  K Number <span className="text-red-500">*</span>
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={loginKNumber}
                    onChange={(e) => setLoginKNumber(e.target.value.toUpperCase())}
                    placeholder="320223020282"
                    className="form-control flex-1 font-mono"
                    autoFocus
                  />
                  <button
                    type="button"
                    onClick={verifyKNumberForLogin}
                    disabled={isVerifyingLoginKNumber}
                    className="px-4 py-2 bg-green-dark text-white rounded-lg text-[13px] font-semibold hover:bg-green-mid disabled:opacity-50 whitespace-nowrap"
                  >
                    {isVerifyingLoginKNumber ? 'Verifying...' : 'Verify'}
                  </button>
                </div>
                <p className="text-[11px] text-gray-500 mt-2">Enter the K number from your electricity bill</p>
              </div>
            ) : (
              <>
                <div className="bg-green-50 border border-green-200 rounded-xl p-4 mb-4">
                  <div className="flex items-center gap-2 mb-2">
                    <CheckCircle className="w-4 h-4 text-green-dark" />
                    <span className="text-sm font-semibold text-green-dark">K Number Verified!</span>
                  </div>
                  <div className="text-[12px] text-gray-600 space-y-1">
                    <p><span className="font-semibold">Name:</span> {loginKNumberData?.name}</p>
                    <p><span className="font-semibold">Mobile:</span> {loginKNumberData?.mobile_number}</p>
                  </div>
                </div>

                <div className="form-group">
                  <label>Email Address</label>
                  <div className="relative">
                    <Mail className="absolute left-3.5 top-3.5 text-gray-400 w-[18px] h-[18px]" />
                    <input
                      type="email"
                      value={loginEmail}
                      onChange={(e) => setLoginEmail(e.target.value)}
                      disabled={otpSent}
                      required
                      className="form-control pl-10"
                    />
                  </div>
                </div>

                {!useOtp && (
                  <div className="form-group">
                    <label>Password</label>
                    <div className="relative">
                      <Lock className="absolute left-3.5 top-3.5 text-gray-400 w-[18px] h-[18px]" />
                      <input
                        type={showPassword ? 'text' : 'password'}
                        value={loginPass}
                        onChange={(e) => setLoginPass(e.target.value)}
                        required
                        className="form-control pl-10 pr-10"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400"
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>
                )}

                {useOtp && (
                  <>
                    {!otpSent ? (
                      <div className="alert alert-info">
                        <span>📧</span>
                        <div>Click "Send OTP" to receive a code to your email.</div>
                      </div>
                    ) : (
                      <div className="form-group animate-fadeIn">
                        <label>Enter OTP</label>
                        <div className="relative">
                          <Shield className="absolute left-3.5 top-3.5 text-gray-400 w-[18px] h-[18px]" />
                          <input
                            type="text"
                            placeholder="Enter 6-digit OTP"
                            value={otpCode}
                            onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                            maxLength={6}
                            className="form-control pl-10 text-center text-lg font-mono"
                          />
                        </div>
                        {otpTimer > 0 ? (
                          <p className="text-[12px] text-gray-500 mt-2">Resend OTP in {otpTimer} seconds</p>
                        ) : (
                          <button type="button" onClick={sendOtp} className="text-[12px] text-green-dark mt-2 font-semibold">Resend OTP</button>
                        )}
                      </div>
                    )}
                  </>
                )}

                <button type="submit" className="w-full btn-green py-3" disabled={isLoadingOtp}>
                  {isLoadingOtp ? 'Processing...' : (useOtp && !otpSent ? 'Send OTP' : useOtp && otpSent ? 'Verify & Login' : 'Sign In')}
                </button>

                <div className="text-center">
                  <button type="button" onClick={() => setUseOtp(!useOtp)} className="text-[13px] text-green-dark font-semibold">
                    {useOtp ? '← Back to Password Login' : 'Login with OTP instead'}
                  </button>
                </div>
              </>
            )}
          </form>
        ) : (
          /* REGISTRATION VIEW - Single Page Flow */
          <form onSubmit={handleRegisterSubmit} className="space-y-5">
            {registerSuccess && <div className="alert alert-success">{registerSuccess}</div>}
            {registerError && <div className="alert alert-error">{registerError}</div>}

            {!discomVerified ? (
              <div className="space-y-4">
                {/* K Number Verification Section */}
                <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    K Number <span className="text-red-500">*</span>
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={kNumber}
                      onChange={(e) => setKNumber(e.target.value.toUpperCase())}
                      placeholder="320223020282"
                      className="form-control flex-1 font-mono"
                      disabled={kNumberVerified}
                    />
                    {!kNumberVerified ? (
                      <button
                        type="button"
                        onClick={verifyKNumberForRegistration}
                        disabled={isVerifyingKNumber}
                        className="px-4 py-2 bg-green-dark text-white rounded-lg text-[13px] font-semibold hover:bg-green-mid disabled:opacity-50 whitespace-nowrap"
                      >
                        {isVerifyingKNumber ? 'Verifying...' : 'Verify'}
                      </button>
                    ) : (
                      <div className="px-4 py-2 bg-green-100 text-green-dark rounded-lg text-[13px] font-semibold flex items-center gap-2">
                        <CheckCircle className="w-4 h-4" />
                        Verified
                      </div>
                    )}
                  </div>
                  <p className="text-[11px] text-gray-500 mt-2">Enter the K number from your electricity bill</p>
                </div>

                {/* DISCOM Selection Section */}
                {kNumberVerified && (
                  <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 animate-fadeIn">
                    <div className="bg-green-50 border border-green-200 rounded-xl p-3 mb-4">
                      <div className="flex items-center gap-2">
                        <CheckCircle className="w-4 h-4 text-green-dark" />
                        <p className="text-[12px] font-semibold text-green-dark">
                          ✓ K Number Verified: {kNumberData?.name}
                        </p>
                      </div>
                    </div>
                    
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Select Your DISCOM to Verify <span className="text-red-500">*</span>
                    </label>
                    <select
                      value={selectedDiscom}
                      onChange={(e) => setSelectedDiscom(e.target.value)}
                      className="form-control mb-3"
                    >
                      <option value="">— Select DISCOM —</option>
                      <option value="JVVNL">Jaipur Vidyut Vitran Nigam Limited (JVVNL)</option>
                      <option value="AVVNL">Ajmer Vidyut Vitran Nigam Limited (AVVNL)</option>
                      <option value="DVVNL">Jodhpur Vidyut Vitran Nigam Limited (DVVNL)</option>
                      <option value="JDVVNL">Kota Vidyut Vitran Nigam Limited (JDVVNL)</option>
                    </select>
                    
                    <button
                      type="button"
                      onClick={verifyDiscom}
                      disabled={!selectedDiscom || isVerifyingKNumber}
                      className="w-full btn-green py-2 text-[13px] font-semibold"
                    >
                      {isVerifyingKNumber ? 'Verifying...' : 'Verify DISCOM'}
                    </button>
                    
                    <button
                      type="button"
                      onClick={() => {
                        setKNumberVerified(false);
                        setKNumber('');
                        setSelectedDiscom('');
                        setKNumberData(null);
                      }}
                      className="text-[12px] text-gray-500 hover:text-green-dark mt-3 text-center w-full"
                    >
                      ← Use different K number
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <>
                <div className="bg-green-50 border border-green-200 rounded-xl p-4 mb-4">
                  <div className="flex items-center gap-2 mb-2">
                    <CheckCircle className="w-4 h-4 text-green-dark" />
                    <span className="text-sm font-semibold text-green-dark">Verification Complete!</span>
                  </div>
                  <div className="text-[12px] text-gray-600 space-y-1">
                    <p><span className="font-semibold">K Number:</span> {kNumber}</p>
                    <p><span className="font-semibold">Name:</span> {kNumberData?.name}</p>
                    <p><span className="font-semibold">Mobile:</span> {kNumberData?.mobile_number}</p>
                    <p><span className="font-semibold">DISCOM:</span> {selectedDiscom} ✓ Verified</p>
                  </div>
                </div>

                <div className="form-group">
                  <label className="required">Register as</label>
                  <select
                    value={selectedRole}
                    onChange={(e) => setSelectedRole(e.target.value as 'CONSUMER' | 'SUPPLIER')}
                    className="form-control"
                  >
                    <option value="CONSUMER">Consumer (Green Energy Open Access)</option>
                    <option value="SUPPLIER">Supplier (Renewable Energy Generator)</option>
                  </select>
                </div>

                <div className="form-group">
                  <label className="required">Email Address</label>
                  <div className="relative">
                    <Mail className="absolute left-3.5 top-3.5 text-gray-400 w-[18px] h-[18px]" />
                    <input
                      type="email"
                      value={regEmail}
                      onChange={(e) => setRegEmail(e.target.value)}
                      required
                      className="form-control pl-10"
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label className="required">Create Password</label>
                  <div className="relative">
                    <Lock className="absolute left-3.5 top-3.5 text-gray-400 w-[18px] h-[18px]" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      placeholder="Minimum 8 characters"
                      value={regPass}
                      onChange={(e) => setRegPass(e.target.value)}
                      required
                      className="form-control pl-10 pr-10"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <div className="form-group">
                  <label className="required">Confirm Password</label>
                  <div className="relative">
                    <Lock className="absolute left-3.5 top-3.5 text-gray-400 w-[18px] h-[18px]" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      required
                      className="form-control pl-10"
                    />
                  </div>
                </div>

                {passwordError && <p className="text-[12px] text-red-600">{passwordError}</p>}

                <button type="submit" className="w-full btn-green py-3 mt-2">
                  Register as {selectedRole === 'CONSUMER' ? 'Consumer' : 'Supplier'}
                </button>

              </>
            )}
          </form>
        )}

        <div className="text-center pt-6 mt-6 border-t border-[#f0f4f2]">
          <button
            type="button"
            onClick={toggleAuthView}
            className="text-[13px] font-semibold text-green-dark hover:text-green-mid"
          >
            {isLoginView ? "Don't have an account? Register here" : "Already registered? Sign in"}
          </button>
        </div>
      </div>
    </div>
  );
};
