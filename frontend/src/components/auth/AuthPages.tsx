import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Mail, Lock, Building, MapPin, ArrowLeft, Phone } from 'lucide-react';

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
  const [activeTab, setActiveTab] = useState<'CONSUMER' | 'SUPPLIER'>(initialRole);
  
  // Login form states
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPass, setLoginPass] = useState('');

  // Register form states
  const [compName, setCompName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPass, setRegPass] = useState('');
  const [regState, setRegState] = useState('Rajasthan');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [drawalNode, setDrawalNode] = useState('400kV Jajpur Substation');
  const [injectNode, setInjectNode] = useState('765kV Bhadla Pooling Station');
  const [renewableType, setRenewableType] = useState('');
  const [phoneError, setPhoneError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [passwordStrength, setPasswordStrength] = useState<'Weak' | 'Fair' | 'Good' | 'Strong'>('Weak');

  const RENEWABLE_TYPES = ['Solar', 'Wind', 'Hydro', 'Biomass', 'Mixed'] as const;

  const API_BASE = (import.meta as any)?.env?.VITE_API_URL || 'http://localhost:5000';

  const evaluatePasswordStrength = (value: string) => {
    const normalized = value.toLowerCase();
    const score = [/[a-z]/, /[A-Z]/, /\d/, /[^A-Za-z0-9]/].reduce((count, regex) => count + Number(regex.test(value)), 0);
    const commonPatterns = ['password', 'password123', 'qwerty', '123456', 'admin', 'letmein', 'welcome'];
    if (commonPatterns.some((pattern) => normalized.includes(pattern))) {
      return 'Weak' as const;
    }
    if (score <= 1 || value.length < 12) return 'Weak' as const;
    if (score === 2) return 'Fair' as const;
    if (score === 3) return 'Good' as const;
    return 'Strong' as const;
  };

  const clearRegisterInputs = () => {
    setCompName('');
    setRegEmail('');
    setRegPass('');
    setRegState('Rajasthan');
    setPhoneNumber('');
    setDrawalNode('');
    setInjectNode('');
    setRenewableType('');
    setPhoneError('');
    setPasswordError('');
    setPasswordStrength('Weak');
  };

  const resetRegisterFields = () => {
    clearRegisterInputs();
    setRegisterError('');
    setRegisterSuccess('');
  };

  const switchRegistrationTab = (tab: 'CONSUMER' | 'SUPPLIER') => {
    setActiveTab(tab);
    resetRegisterFields();
  };

  const toggleAuthView = () => {
    setIsLoginView((prev) => {
      const nextView = !prev;
      if (!nextView) {
        resetRegisterFields();
      } else {
        setRegisterError('');
        setRegisterSuccess('');
        setPhoneError('');
        setPasswordError('');
      }
      return nextView;
    });
  };

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
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

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setRegisterError('');
    setRegisterSuccess('');
    setPhoneError('');
    setPasswordError('');

    const digitsPhone = phoneNumber.trim();
    const trimmedPassword = regPass;
    const phoneValid = digitsPhone.length === 10;

    if (!phoneValid) {
      setPhoneError('Enter exactly 10 digits after the +91 prefix.');
      setRegisterError('Please enter a valid phone number before registering.');
      return;
    }

    if (trimmedPassword.length < 12 || trimmedPassword.length > 32) {
      setPasswordError('Password must be at least 12 characters and no more than 32.');
      setRegisterError('Please use a password with at least 12 characters.');
      return;
    }

    const hasUpper = /[A-Z]/.test(trimmedPassword);
    const hasLower = /[a-z]/.test(trimmedPassword);
    const hasNumber = /\d/.test(trimmedPassword);
    const hasSymbol = /[^A-Za-z0-9]/.test(trimmedPassword);
    const lowerPassword = trimmedPassword.toLowerCase();
    const prohibitedPatterns = ['password', 'password123', 'qwerty', '123456', 'admin', 'letmein', 'welcome'];

    if (!hasUpper || !hasLower || !hasNumber || !hasSymbol) {
      setPasswordError('Use uppercase, lowercase, numbers, and symbols.');
      setRegisterError('Please make your password stronger before registering.');
      return;
    }

    if (prohibitedPatterns.some((pattern) => lowerPassword.includes(pattern))) {
      setPasswordError('Avoid common patterns such as password123 or qwerty.');
      setRegisterError('Please choose a stronger password.');
      return;
    }

    const localEmail = regEmail.trim().split('@')[0].toLowerCase();
    const normalizedCompName = compName.trim().toLowerCase().replace(/\s+/g, '');
    if (localEmail && lowerPassword.includes(localEmail)) {
      setPasswordError('Do not include your email username in the password.');
      setRegisterError('Please choose a password without personal info.');
      return;
    }
    if (normalizedCompName && lowerPassword.includes(normalizedCompName)) {
      setPasswordError('Do not include your company name in the password.');
      setRegisterError('Please choose a password without personal info.');
      return;
    }

    try {
      const payload: any = {
        email: regEmail.trim(),
        password: trimmedPassword,
        name: compName.trim(),
        role: activeTab,
        state: regState.trim(),
        phoneNumber: `+91${digitsPhone}`
      };

      if (activeTab === 'CONSUMER') {
        payload.drawalPoint = drawalNode.trim();
      } else {
        payload.injectionPoint = injectNode.trim();
        payload.renewableType = renewableType;
      }

      const res = await fetch(`${API_BASE}/api/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (!res.ok) {
        const backendError = data.error || 'Registration failed';
        if (/email.*already.*exists|email.*taken|duplicate.*email/i.test(backendError)) {
          setRegisterError('This email is already registered. Please sign in or use another email.');
        } else if (/phone.*already.*exists|phone.*taken|duplicate.*phone/i.test(backendError)) {
          setRegisterError('This phone number is already registered. Please use a different number.');
        } else {
          setRegisterError(backendError);
        }
        return;
      }

      const successMessage = data.message || 'Registration submitted. An administrator will review your account.';
      clearRegisterInputs();
      setRegisterSuccess(successMessage);
      setLoginEmail(regEmail.trim());
      setIsLoginView(true);
    } catch (err) {
      setRegisterError('Network error — please check the backend');
    }
  };


  return (
    <div className="min-h-screen bg-[#f4f7f5] text-gray-900 flex flex-col justify-center items-center p-6 relative font-dm">
      {/* Back button */}
      <button 
        onClick={onBackToLanding}
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
          <p className="text-sm text-gray-500">
            {isLoginView ? 'Enter your credentials to access the portal' : 'Enroll your enterprise in the GEOA registry'}
          </p>
        </div>

        <>
            {/* View Switch tabs */}
            {!isLoginView && (
              <div className="flex bg-gray-100 p-1.5 rounded-lg mb-6">
                <button
                  type="button"
                  onClick={() => switchRegistrationTab('CONSUMER')}
                  className={`flex-1 py-2 text-[13px] rounded-md font-semibold transition-all ${
                    activeTab === 'CONSUMER' ? 'bg-white text-green-dark shadow-sm' : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  Consumer
                </button>
                <button
                  type="button"
                  onClick={() => switchRegistrationTab('SUPPLIER')}
                  className={`flex-1 py-2 text-[13px] rounded-md font-semibold transition-all ${
                    activeTab === 'SUPPLIER' ? 'bg-white text-green-dark shadow-sm' : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  Supplier
                </button>
              </div>
            )}

            {isLoginView ? (
              /* LOGIN VIEW */
              <form onSubmit={handleLoginSubmit} className="space-y-5">
                {registerSuccess && (
                  <div className="alert alert-success">
                    {registerSuccess}
                  </div>
                )}
                {loginError && (
                  <div className="alert alert-error">
                    {loginError}
                  </div>
                )}

                <div className="form-group">
                  <label>Email Address</label>
                  <div className="relative">
                    <Mail className="absolute left-3.5 top-3.5 text-gray-400 w-[18px] h-[18px]" />
                    <input
                      type="email"
                      placeholder="e.g. contact@company.com"
                      value={loginEmail}
                      onChange={(e) => setLoginEmail(e.target.value)}
                      required
                      className="form-control pl-10"
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label>Password</label>
                  <div className="relative">
                    <Lock className="absolute left-3.5 top-3.5 text-gray-400 w-[18px] h-[18px]" />
                    <input
                      type="password"
                      placeholder="••••••••"
                      value={loginPass}
                      onChange={(e) => setLoginPass(e.target.value)}
                      required
                      className="form-control pl-10"
                    />
                  </div>
                </div>

                <div className="alert alert-info">
                  <span className="text-[18px]">💡</span>
                  <div>
                    Your account role is assigned by registration and enforced by the backend. Only the correct portal will load after you sign in.
                  </div>
                </div>

                <button type="submit" className="w-full btn-green py-3 text-[15px]">
                  Sign In
                </button>
              </form>
            ) : (
              /* REGISTER VIEW */
              <form onSubmit={handleRegisterSubmit} className="space-y-5">
                {registerSuccess && (
                  <div className="alert alert-success">
                    {registerSuccess}
                  </div>
                )}
                {registerError && (
                  <div className="alert alert-error">
                    {registerError}
                  </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="form-group">
                    <label className="required">Company Name</label>
                    <div className="relative">
                      <Building className="absolute left-3.5 top-3.5 text-gray-400 w-[18px] h-[18px]" />
                      <input
                        type="text"
                        placeholder="Company Ltd"
                        value={compName}
                        onChange={(e) => setCompName(e.target.value)}
                        required
                        className="form-control pl-10"
                      />
                    </div>
                  </div>

                  <div className="form-group">
                    <label className="required">Email Address</label>
                    <div className="relative">
                      <Mail className="absolute left-3.5 top-3.5 text-gray-400 w-[18px] h-[18px]" />
                      <input
                        type="email"
                        placeholder="contact@company.com"
                        value={regEmail}
                        onChange={(e) => setRegEmail(e.target.value)}
                        required
                        className="form-control pl-10"
                      />
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="form-group">
                    <label className="required">Password</label>
                    <div className="relative">
                      <Lock className="absolute left-3.5 top-3.5 text-gray-400 w-[18px] h-[18px]" />
                      <input
                        type="password"
                        placeholder="Enter Password"
                        minLength={12}
                        maxLength={20}
                        value={regPass}
                        onChange={(e) => {
                          const value = e.target.value;
                          setRegPass(value);
                          setPasswordStrength(evaluatePasswordStrength(value));
                        }}
                        required
                        className="form-control pl-10"
                      />
                    </div>
                    <div className="mt-2 flex items-center justify-between gap-3">
                      <div className="h-2 w-full rounded-full bg-[#e5e7eb] overflow-hidden">
                        <div
                          className={`h-full ${passwordStrength === 'Weak' ? 'w-1/4 bg-red-500' : passwordStrength === 'Fair' ? 'w-1/2 bg-orange-400' : passwordStrength === 'Good' ? 'w-3/4 bg-amber-400' : 'w-full bg-emerald-500'}`}
                        />
                      </div>
                      <span className="text-[12px] font-semibold text-gray-700">{passwordStrength}</span>
                    </div>
                    {passwordError && <p className="text-[12px] text-red-600 mt-1.5">{passwordError}</p>}
                  </div>

                  <div className="form-group">
                    <label className="required">State Jurisdiction</label>
                    <div className="relative">
                      <MapPin className="absolute left-3.5 top-3.5 text-gray-400 w-[18px] h-[18px]" />
                      <input
                        type="text"
                        placeholder="Rajasthan"
                        value={regState}
                        onChange={(e) => setRegState(e.target.value)}
                        required
                        className="form-control pl-10"
                      />
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t border-[#f0f4f2]">
                  <div className="form-group">
                    <label className="required">Phone Number</label>
                    <div className="relative">
                      <Phone className="absolute left-3.5 top-3.5 text-gray-400 w-[18px] h-[18px]" />
                      <input
                        type="tel"
                        placeholder="+91 98765 43210"
                        value={phoneNumber}
                        onChange={(e) => setPhoneNumber(e.target.value.replace(/[^+\d\s]/g, ''))}
                        required
                        className="form-control pl-10"
                      />
                    </div>
                    {phoneError && <p className="text-[12px] text-red-600 mt-1.5">{phoneError}</p>}
                  </div>

                  {activeTab === 'CONSUMER' ? (
                    <div className="form-group">
                      <label className="required">Drawal Substation</label>
                      <input
                        type="text"
                        value={drawalNode}
                        onChange={(e) => setDrawalNode(e.target.value)}
                        required
                        className="form-control"
                      />
                    </div>
                  ) : (
                    <div className="form-group">
                      <label className="required">Injection Point</label>
                      <input
                        type="text"
                        value={injectNode}
                        onChange={(e) => setInjectNode(e.target.value)}
                        required
                        className="form-control"
                      />
                    </div>
                  )}
                </div>

                {activeTab === 'SUPPLIER' && (
                  <div className="form-group">
                    <label className="required">Renewable energy type</label>
                    <select
                      value={renewableType}
                      onChange={(e) => setRenewableType(e.target.value)}
                      required
                      className="form-control"
                    >
                      <option value="" disabled>
                        Select generation type…
                      </option>
                      {RENEWABLE_TYPES.map((type) => (
                        <option key={type} value={type}>
                          {type}
                        </option>
                      ))}
                    </select>
                    <p className="text-[12px] text-gray-500 mt-1.5">
                      Used for GEOA classification and consumer matching.
                    </p>
                  </div>
                )}

                <button type="submit" className="w-full btn-green py-3 text-[15px] mt-2">
                  Register
                </button>
              </form>
            )}

            {/* Switch Views */}
            <div className="text-center pt-6 mt-6 border-t border-[#f0f4f2]">
              <button
                type="button"
                onClick={toggleAuthView}
                className="text-[13px] font-semibold text-green-dark hover:text-green-mid transition-colors cursor-pointer"
              >
                {isLoginView ? "Don't have an account? Register here" : "Already registered? Sign in"}
              </button>
            </div>
          </>
        
      </div>
    </div>
  );
};
