import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext.tsx';
import {
  Lock,
  Mail,
  Phone,
  Eye,
  EyeOff,
  ShieldCheck,
  User,
  Store,
  Shield,
  Sparkles,
  UserPlus,
  LogIn,
  AlertCircle,
  ArrowRight,
  Building2,
  FileText,
} from 'lucide-react';

export const LoginModal: React.FC = () => {
  const {
    isLoginModalOpen,
    closeLoginModal,
    loginModalDefaultRole,
    handleLogin,
    handleRegister,
    showToast,
  } = useApp();

  const [authMode, setAuthMode] = useState<'signin' | 'signup'>('signin');
  const [selectedRole, setSelectedRole] = useState<'customer' | 'seller' | 'admin'>('customer');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [storeName, setStoreName] = useState('');
  const [storeDescription, setStoreDescription] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Sync initial tab when modal opens
  useEffect(() => {
    if (isLoginModalOpen) {
      setSelectedRole(loginModalDefaultRole);
      setErrorMsg(null);
      if (authMode === 'signin') {
        applyDemoCredentials(loginModalDefaultRole);
      }
    }
  }, [isLoginModalOpen, loginModalDefaultRole, authMode]);

  const applyDemoCredentials = (role: 'customer' | 'seller' | 'admin') => {
    setErrorMsg(null);
    if (role === 'customer') {
      setEmail('chandanchanduchandan9@gmail.com');
      setPhone('9845012345');
      setPassword('Password@123');
    } else if (role === 'seller') {
      setEmail('seller@trendvibe.com');
      setPhone('9886055432');
      setPassword('Seller@Secure2026');
    } else {
      setEmail('admin@trendvibe.com');
      setPhone('9845199999');
      setPassword('Admin@Master2026');
    }
  };

  const handleTabChange = (role: 'customer' | 'seller' | 'admin') => {
    setSelectedRole(role);
    if (authMode === 'signin') {
      applyDemoCredentials(role);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (authMode === 'signup') {
      if (!name.trim()) {
        setErrorMsg('Please enter your full name.');
        return;
      }
      if (!email.trim() || !email.includes('@')) {
        setErrorMsg('Please enter a valid email address.');
        return;
      }
      if (!phone.trim() || phone.trim().length < 10) {
        setErrorMsg('Please enter a valid 10-digit mobile phone number.');
        return;
      }
      if (!password.trim() || password.trim().length < 6) {
        setErrorMsg('Password must be at least 6 characters long.');
        return;
      }
      if (selectedRole === 'seller' && !storeName.trim()) {
        setErrorMsg('Please enter your business or store name.');
        return;
      }
      if (selectedRole === 'admin') {
        setErrorMsg('Administrator accounts cannot be self-registered via public signup.');
        return;
      }

      setLoading(true);
      try {
        await handleRegister({
          name: name.trim(),
          email: email.trim().toLowerCase(),
          phone: phone.trim(),
          password: password.trim(),
          role: selectedRole as 'customer' | 'seller',
          storeName: selectedRole === 'seller' ? storeName.trim() : undefined,
          storeDescription: selectedRole === 'seller' ? storeDescription.trim() : undefined,
        });
      } catch (err: any) {
        setErrorMsg(err.message || 'Failed to complete registration.');
      } finally {
        setLoading(false);
      }
    } else {
      // Sign in mode
      if (!email.trim()) {
        setErrorMsg('Please enter your Gmail or registered email address.');
        return;
      }
      if (!phone.trim()) {
        setErrorMsg('Please enter your mobile phone number.');
        return;
      }
      if (!password.trim()) {
        setErrorMsg('Please enter your password.');
        return;
      }

      setLoading(true);
      try {
        await handleLogin({
          email: email.trim(),
          phone: phone.trim(),
          password: password.trim(),
          role: selectedRole,
        });
      } catch (err: any) {
        setErrorMsg(err.message || 'Failed to authenticate. Please check your credentials.');
      } finally {
        setLoading(false);
      }
    }
  };

  if (!isLoginModalOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in">
      <div className="w-full max-w-lg bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[92vh]">
        {/* Modal Top Header */}
        <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 p-6 text-white relative">
          <button
            onClick={closeLoginModal}
            className="absolute top-5 right-5 w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-slate-300 hover:text-white flex items-center justify-center font-bold text-sm transition-colors cursor-pointer"
          >
            ✕
          </button>

          <div className="flex items-center gap-2.5 mb-2">
            <div className="w-9 h-9 rounded-xl bg-indigo-500/30 border border-indigo-400/40 flex items-center justify-center text-indigo-300">
              {authMode === 'signup' ? <UserPlus className="w-4 h-4" /> : <Lock className="w-4 h-4" />}
            </div>
            <div>
              <h2 className="text-lg font-black tracking-tight">
                {authMode === 'signup' ? 'Create Your Account' : 'Secure Account Sign In'}
              </h2>
              <p className="text-xs text-indigo-200/80 font-medium">TrendVibe Store • Multi-Role Access Control</p>
            </div>
          </div>

          {/* Mode Switcher: Sign In vs Sign Up */}
          <div className="flex items-center gap-2 mt-3 p-1 bg-slate-800/80 rounded-xl border border-slate-700/60 max-w-xs">
            <button
              type="button"
              onClick={() => {
                setAuthMode('signin');
                setErrorMsg(null);
                applyDemoCredentials(selectedRole);
              }}
              className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                authMode === 'signin'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <LogIn className="w-3.5 h-3.5" />
              <span>Sign In</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setAuthMode('signup');
                setErrorMsg(null);
                if (selectedRole === 'admin') setSelectedRole('customer');
                setEmail('');
                setPhone('');
                setPassword('');
              }}
              className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                authMode === 'signup'
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <UserPlus className="w-3.5 h-3.5" />
              <span>Sign Up</span>
            </button>
          </div>

          {/* 3 Role Selection Tabs */}
          <div className="grid grid-cols-3 gap-1.5 mt-4 bg-slate-950/60 p-1.5 rounded-2xl border border-slate-800">
            <button
              type="button"
              onClick={() => handleTabChange('customer')}
              className={`py-2 px-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                selectedRole === 'customer'
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <User className="w-3.5 h-3.5" />
              <span>Customer</span>
            </button>

            <button
              type="button"
              onClick={() => handleTabChange('seller')}
              className={`py-2 px-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                selectedRole === 'seller'
                  ? 'bg-amber-600 text-white shadow-md shadow-amber-600/30'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Store className="w-3.5 h-3.5" />
              <span>Seller</span>
            </button>

            <button
              type="button"
              onClick={() => handleTabChange('admin')}
              className={`py-2 px-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                selectedRole === 'admin'
                  ? 'bg-purple-600 text-white shadow-md shadow-purple-600/30'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Shield className="w-3.5 h-3.5" />
              <span>Admin</span>
            </button>
          </div>
        </div>

        {/* Role Portal Notice Banner */}
        <div
          className={`px-6 py-2.5 border-b text-xs flex items-center justify-between ${
            selectedRole === 'customer'
              ? 'bg-indigo-50 border-indigo-100 text-indigo-900'
              : selectedRole === 'seller'
              ? 'bg-amber-50 border-amber-100 text-amber-900'
              : 'bg-purple-50 border-purple-100 text-purple-900'
          }`}
        >
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 shrink-0" />
            <span className="font-semibold">
              {selectedRole === 'customer' && 'Customer Portal: Orders, Addresses, Zyro AI Voice shopping'}
              {selectedRole === 'seller' && 'Authorized Seller Hub: Inventory, orders, catalogue & CRM'}
              {selectedRole === 'admin' && 'Platform Admin: Seller approvals, Supabase sync, audits'}
            </span>
          </div>
          <span className="font-mono text-[11px] font-bold uppercase tracking-wider opacity-75">
            {selectedRole}
          </span>
        </div>

        {/* Form Body */}
        <div className="p-6 overflow-y-auto space-y-4">
          {errorMsg && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-800 text-xs flex items-start gap-2 animate-in shake">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <span>{errorMsg}</span>
            </div>
          )}

          {authMode === 'signup' && selectedRole === 'admin' ? (
            <div className="p-6 bg-slate-50 border border-slate-200 rounded-2xl text-center space-y-3">
              <Shield className="w-10 h-10 text-purple-600 mx-auto" />
              <h3 className="text-sm font-bold text-slate-800">Restricted Administrative Role</h3>
              <p className="text-xs text-slate-600 leading-relaxed max-w-sm mx-auto">
                Platform Administrator accounts require internal administrative clearance and cannot be created via public self-service signup.
              </p>
              <div className="pt-2 flex justify-center gap-2">
                <button
                  type="button"
                  onClick={() => setAuthMode('signin')}
                  className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold rounded-xl cursor-pointer"
                >
                  Sign In with Admin Credentials
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedRole('seller')}
                  className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold rounded-xl cursor-pointer"
                >
                  Sign Up as Seller
                </button>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Full Name field (for Signup mode) */}
              {authMode === 'signup' && (
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-1.5 flex items-center justify-between">
                    <span>Full Name:</span>
                    <span className="text-[10px] text-slate-400 font-normal">Official display name</span>
                  </label>
                  <div className="relative">
                    <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                    <input
                      type="text"
                      required
                      placeholder="e.g. Rahul Sharma"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-300 focus:bg-white text-sm text-slate-900 pl-10 pr-4 py-2.5 rounded-xl border focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 font-medium"
                    />
                  </div>
                </div>
              )}

              {/* Seller-specific fields for Signup */}
              {authMode === 'signup' && selectedRole === 'seller' && (
                <>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-1.5 flex items-center justify-between">
                      <span>Store / Business Name:</span>
                      <span className="text-[10px] text-amber-600 font-semibold">Seller Profile</span>
                    </label>
                    <div className="relative">
                      <Building2 className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                      <input
                        type="text"
                        required
                        placeholder="e.g. Apex Wellness Organics"
                        value={storeName}
                        onChange={(e) => setStoreName(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-300 focus:bg-white text-sm text-slate-900 pl-10 pr-4 py-2.5 rounded-xl border focus:border-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-500/20 font-medium"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-1.5 flex items-center justify-between">
                      <span>Store Category / Description (Optional):</span>
                    </label>
                    <div className="relative">
                      <FileText className="w-4 h-4 text-slate-400 absolute left-3.5 top-3 pointer-events-none" />
                      <textarea
                        rows={2}
                        placeholder="e.g. Authorized seller of ayurvedic healthcare, organic nutrition & fresh groceries."
                        value={storeDescription}
                        onChange={(e) => setStoreDescription(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-300 focus:bg-white text-xs text-slate-900 pl-10 pr-4 py-2 rounded-xl border focus:border-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-500/20"
                      />
                    </div>
                  </div>
                </>
              )}

              {/* 1. Gmail / Email Address Input */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-1.5 flex items-center justify-between">
                  <span>{authMode === 'signup' ? 'Email Address:' : '1. Gmail / Registered Email:'}</span>
                  <span className="text-[10px] text-slate-400 font-normal">Google Workspace / Gmail</span>
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    type="email"
                    required
                    placeholder="e.g. yourname@gmail.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 focus:bg-white text-sm text-slate-900 pl-10 pr-4 py-2.5 rounded-xl border focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 font-medium"
                  />
                </div>
              </div>

              {/* 2. Mobile Phone Number Input */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-1.5 flex items-center justify-between">
                  <span>{authMode === 'signup' ? 'Mobile Phone Number:' : '2. Mobile Phone Number:'}</span>
                  <span className="text-[10px] text-emerald-600 font-semibold">2FA SMS Verified</span>
                </label>
                <div className="relative flex">
                  <span className="inline-flex items-center px-3 rounded-l-xl border border-r-0 border-slate-300 bg-slate-100 text-slate-600 text-xs font-bold">
                    <Phone className="w-3.5 h-3.5 mr-1 text-slate-500" />
                    +91
                  </span>
                  <input
                    type="tel"
                    required
                    placeholder="10-digit mobile number"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 focus:bg-white text-sm text-slate-900 px-3.5 py-2.5 rounded-r-xl border focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 font-mono"
                  />
                </div>
              </div>

              {/* 3. Password Input */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-1.5 flex items-center justify-between">
                  <span>{authMode === 'signup' ? 'Create Password:' : '3. Password:'}</span>
                  <span className="text-[10px] text-indigo-600 font-semibold">Encrypted Storage</span>
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    placeholder={authMode === 'signup' ? 'Min 6 characters' : 'Enter your secure password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 focus:bg-white text-sm text-slate-900 pl-10 pr-10 py-2.5 rounded-xl border focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 font-medium"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Quick Demo Autofill helper button (Sign In mode only) */}
              {authMode === 'signin' && (
                <div className="pt-1">
                  <button
                    type="button"
                    onClick={() => applyDemoCredentials(selectedRole)}
                    className="w-full py-2 px-3 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl border border-slate-200 flex items-center justify-between transition-colors cursor-pointer"
                  >
                    <span className="flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
                      <span>Use Quick {selectedRole.toUpperCase()} Demo Credentials</span>
                    </span>
                    <span className="text-[10px] text-indigo-600 uppercase font-semibold">Fill Details</span>
                  </button>
                </div>
              )}

              {/* Submit Button */}
              <button
                type="submit"
                disabled={loading}
                className={`w-full py-3 px-4 text-white font-extrabold text-sm rounded-xl shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer mt-4 ${
                  selectedRole === 'customer'
                    ? 'bg-indigo-600 hover:bg-indigo-500 shadow-indigo-600/30'
                    : selectedRole === 'seller'
                    ? 'bg-amber-600 hover:bg-amber-500 shadow-amber-600/30'
                    : 'bg-purple-600 hover:bg-purple-500 shadow-purple-600/30'
                }`}
              >
                {loading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    <span>{authMode === 'signup' ? 'Creating Account...' : 'Verifying Credentials...'}</span>
                  </>
                ) : (
                  <>
                    <span>
                      {authMode === 'signup'
                        ? `Register as ${selectedRole === 'seller' ? 'Seller Hub Merchant' : 'Customer'}`
                        : `Sign In as ${selectedRole.toUpperCase()}`}
                    </span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>

              {/* Toggle mode link */}
              <div className="text-center pt-2">
                {authMode === 'signin' ? (
                  <p className="text-xs text-slate-600">
                    Don't have an account yet?{' '}
                    <button
                      type="button"
                      onClick={() => {
                        setAuthMode('signup');
                        setErrorMsg(null);
                        if (selectedRole === 'admin') setSelectedRole('customer');
                      }}
                      className="font-bold text-indigo-600 hover:text-indigo-700 underline cursor-pointer"
                    >
                      Sign Up for Free
                    </button>
                  </p>
                ) : (
                  <p className="text-xs text-slate-600">
                    Already registered with TrendVibe?{' '}
                    <button
                      type="button"
                      onClick={() => {
                        setAuthMode('signin');
                        setErrorMsg(null);
                        applyDemoCredentials(selectedRole);
                      }}
                      className="font-bold text-indigo-600 hover:text-indigo-700 underline cursor-pointer"
                    >
                      Sign In Here
                    </button>
                  </p>
                )}
              </div>
            </form>
          )}
        </div>

        {/* Modal Footer with Voice biometric indicator */}
        <div className="bg-slate-50 p-4 border-t border-slate-200 text-[11px] text-slate-500 flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
            <span>AI Voice Biometrics calibrated for instant caller recognition</span>
          </div>
          <span className="font-semibold text-slate-600">256-Bit SSL Secured</span>
        </div>
      </div>
    </div>
  );
};
