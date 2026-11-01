import React, { useState } from 'react';
import { useApp } from '../context/AppContext.tsx';
import {
  Store,
  Sparkles,
  Lock,
  Mail,
  Phone,
  Eye,
  EyeOff,
  ShieldCheck,
  User,
  UserPlus,
  ArrowRight,
  CheckCircle2,
  AlertCircle,
  PhoneCall,
  Zap,
} from 'lucide-react';

export const LoginGateView: React.FC = () => {
  const { handleLogin, handleRegister, availableUsers, switchPersona, showToast } = useApp();

  const [authMode, setAuthMode] = useState<'signin' | 'signup'>('signin');
  const [selectedRole, setSelectedRole] = useState<'customer' | 'seller' | 'admin'>('customer');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('chandanchanduchandan9@gmail.com');
  const [phone, setPhone] = useState('+91 98450 12345');
  const [password, setPassword] = useState('password123');
  const [storeName, setStoreName] = useState('');
  const [storeDescription, setStoreDescription] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

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
        setErrorMsg('Please enter your store name.');
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
        showToast('Registration successful! Welcome to TrendVibe.', 'success');
      } catch (err: any) {
        setErrorMsg(err.message || 'Failed to complete registration.');
      } finally {
        setLoading(false);
      }
    } else {
      if (!email.trim()) {
        setErrorMsg('Please enter your Gmail or registered email address.');
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
          password: password.trim(),
          role: selectedRole,
        });
      } catch (err: any) {
        setErrorMsg(err.message || 'Invalid credentials. Please check and try again.');
      } finally {
        setLoading(false);
      }
    }
  };

  const handleDemoPersonaLogin = async (personaUser: any) => {
    try {
      await switchPersona(personaUser.id);
      showToast(`Welcome back, ${personaUser.name} (${personaUser.role.toUpperCase()})!`, 'success');
    } catch (e: any) {
      showToast(`Login note: ${e.message}`, 'info');
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col lg:flex-row items-center justify-center p-4 sm:p-6 lg:p-12 relative overflow-hidden selection:bg-indigo-500 selection:text-white">
      {/* Background glow effects */}
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-indigo-600/15 rounded-full blur-3xl pointer-events-none -mr-40 -mt-40"></div>
      <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-violet-600/15 rounded-full blur-3xl pointer-events-none -ml-40 -mb-40"></div>

      {/* Left Column: Brand & AI Assistant Hero */}
      <div className="w-full lg:w-1/2 max-w-xl space-y-6 lg:pr-12 text-white z-10 mb-8 lg:mb-0">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-indigo-600 via-violet-600 to-indigo-500 flex items-center justify-center text-white shadow-xl shadow-indigo-600/30">
            <Store className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-2xl font-black tracking-tight">TrendVibe Store</span>
              <span className="bg-indigo-500/30 text-indigo-200 text-xs font-bold px-2.5 py-0.5 rounded-full border border-indigo-400/40 flex items-center gap-1">
                <Sparkles className="w-3 h-3 text-amber-300" />
                Enquiry Bot
              </span>
            </div>
            <p className="text-xs text-slate-400 font-medium">Multi-Vendor E-Commerce & AI Voice Gateway</p>
          </div>
        </div>

        <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight leading-tight">
          Secure Multi-Vendor Shopping, Elevated by{' '}
          <span className="bg-gradient-to-r from-indigo-300 via-indigo-100 to-violet-300 bg-clip-text text-transparent">
            AI Voice Calling
          </span>
        </h1>

        <p className="text-slate-300 text-sm sm:text-base leading-relaxed">
          Log in securely to explore 8 certified categories from healthcare & fresh food to flagship 5G smartphones and gaming laptops. Experience real-time Twilio + Gemini voice calls, instant OTP security verification, and 30-minute hyper-local express delivery.
        </p>

        <div className="grid grid-cols-2 gap-3 pt-2">
          <div className="bg-slate-900/80 border border-slate-800 p-3.5 rounded-2xl space-y-1">
            <div className="flex items-center gap-2 text-emerald-400 font-bold text-xs">
              <Zap className="w-4 h-4 text-emerald-400" />
              <span>30-Min Express</span>
            </div>
            <p className="text-[11px] text-slate-400">Certified medicines & fresh kitchen kitchenware.</p>
          </div>
          <div className="bg-slate-900/80 border border-slate-800 p-3.5 rounded-2xl space-y-1">
            <div className="flex items-center gap-2 text-indigo-400 font-bold text-xs">
              <PhoneCall className="w-4 h-4 text-indigo-400" />
              <span>Twilio + Gemini AI</span>
            </div>
            <p className="text-[11px] text-slate-400">Natural voice calls in English, Hindi & Kannada.</p>
          </div>
        </div>

        {/* Quick Demo Personas */}
        {availableUsers && availableUsers.length > 0 && (
          <div className="pt-4 border-t border-slate-800/80 space-y-2">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">
              Instant Demo Persona Login:
            </span>
            <div className="flex flex-wrap gap-2">
              {availableUsers.map((u) => (
                <button
                  key={u.id}
                  type="button"
                  onClick={() => handleDemoPersonaLogin(u)}
                  className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-slate-200 text-xs font-semibold rounded-xl border border-slate-700/80 transition-all flex items-center gap-2 cursor-pointer shadow-sm"
                >
                  <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
                  <span>{u.name} ({u.role.toUpperCase()})</span>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Right Column: Authentication Card */}
      <div className="w-full lg:w-1/2 max-w-md bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl overflow-hidden z-10">
        {/* Card Header */}
        <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 p-6 border-b border-slate-800 text-white">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-indigo-600/30 border border-indigo-500/40 flex items-center justify-center text-indigo-300">
                {authMode === 'signup' ? <UserPlus className="w-4 h-4" /> : <Lock className="w-4 h-4" />}
              </div>
              <div>
                <h3 className="font-extrabold text-base tracking-tight">
                  {authMode === 'signup' ? 'Create Secure Account' : 'Customer & Seller Login'}
                </h3>
                <p className="text-[11px] text-slate-400">Authentication & Role-Based Access</p>
              </div>
            </div>

            {/* Mode Toggle */}
            <div className="flex bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs">
              <button
                type="button"
                onClick={() => setAuthMode('signin')}
                className={`px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer ${
                  authMode === 'signin' ? 'bg-indigo-600 text-white shadow' : 'text-slate-400 hover:text-white'
                }`}
              >
                Sign In
              </button>
              <button
                type="button"
                onClick={() => setAuthMode('signup')}
                className={`px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer ${
                  authMode === 'signup' ? 'bg-indigo-600 text-white shadow' : 'text-slate-400 hover:text-white'
                }`}
              >
                Register
              </button>
            </div>
          </div>

          {/* Role Selector Tabs */}
          <div className="grid grid-cols-3 gap-1.5 bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs">
            <button
              type="button"
              onClick={() => setSelectedRole('customer')}
              className={`py-2 px-3 rounded-lg font-bold transition-all cursor-pointer text-center ${
                selectedRole === 'customer'
                  ? 'bg-gradient-to-r from-indigo-600 to-violet-600 text-white shadow'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Customer
            </button>
            <button
              type="button"
              onClick={() => setSelectedRole('seller')}
              className={`py-2 px-3 rounded-lg font-bold transition-all cursor-pointer text-center ${
                selectedRole === 'seller'
                  ? 'bg-gradient-to-r from-indigo-600 to-violet-600 text-white shadow'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Seller Hub
            </button>
            <button
              type="button"
              onClick={() => setSelectedRole('admin')}
              className={`py-2 px-3 rounded-lg font-bold transition-all cursor-pointer text-center ${
                selectedRole === 'admin'
                  ? 'bg-gradient-to-r from-indigo-600 to-violet-600 text-white shadow'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Admin
            </button>
          </div>
        </div>

        {/* Auth Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {errorMsg && (
            <div className="p-3 bg-rose-950/80 border border-rose-800 rounded-xl text-rose-200 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {authMode === 'signup' && (
            <div>
              <label className="text-xs font-bold text-slate-300 block mb-1.5">Full Name</label>
              <div className="relative">
                <User className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Chandan Kumar"
                  className="w-full bg-slate-950 text-white text-xs pl-10 pr-4 py-2.5 rounded-xl border border-slate-700 focus:border-indigo-500 focus:outline-none"
                  required
                />
              </div>
            </div>
          )}

          <div>
            <label className="text-xs font-bold text-slate-300 block mb-1.5">Gmail / Email Address</label>
            <div className="relative">
              <Mail className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="chandanchanduchandan9@gmail.com"
                className="w-full bg-slate-950 text-white text-xs pl-10 pr-4 py-2.5 rounded-xl border border-slate-700 focus:border-indigo-500 focus:outline-none"
                required
              />
            </div>
          </div>

          {authMode === 'signup' && (
            <div>
              <label className="text-xs font-bold text-slate-300 block mb-1.5">Mobile Phone Number</label>
              <div className="relative">
                <Phone className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+91 98450 12345"
                  className="w-full bg-slate-950 text-white text-xs pl-10 pr-4 py-2.5 rounded-xl border border-slate-700 focus:border-indigo-500 focus:outline-none"
                  required
                />
              </div>
            </div>
          )}

          {authMode === 'signup' && selectedRole === 'seller' && (
            <>
              <div>
                <label className="text-xs font-bold text-slate-300 block mb-1.5">Store / Business Name</label>
                <input
                  type="text"
                  value={storeName}
                  onChange={(e) => setStoreName(e.target.value)}
                  placeholder="Bangalore HealthMart & Fresh Kitchen"
                  className="w-full bg-slate-950 text-white text-xs px-4 py-2.5 rounded-xl border border-slate-700 focus:border-indigo-500 focus:outline-none"
                  required
                />
              </div>
              <div>
                <label className="text-xs font-bold text-slate-300 block mb-1.5">Store Description</label>
                <input
                  type="text"
                  value={storeDescription}
                  onChange={(e) => setStoreDescription(e.target.value)}
                  placeholder="Certified medicines and organic kitchen essentials"
                  className="w-full bg-slate-950 text-white text-xs px-4 py-2.5 rounded-xl border border-slate-700 focus:border-indigo-500 focus:outline-none"
                />
              </div>
            </>
          )}

          <div>
            <label className="text-xs font-bold text-slate-300 block mb-1.5">Password</label>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-slate-950 text-white text-xs pl-10 pr-10 py-2.5 rounded-xl border border-slate-700 focus:border-indigo-500 focus:outline-none"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-gradient-to-r from-indigo-600 via-violet-600 to-indigo-500 hover:from-indigo-500 hover:to-violet-500 text-white font-extrabold text-xs sm:text-sm rounded-xl shadow-lg shadow-indigo-600/30 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 mt-2"
          >
            <span>{loading ? 'Authenticating...' : authMode === 'signup' ? 'Create Account' : `Login as ${selectedRole.toUpperCase()}`}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        {/* Footer Security Notice */}
        <div className="bg-slate-950 px-6 py-3 border-t border-slate-800 text-[11px] text-slate-500 flex items-center justify-between">
          <span className="flex items-center gap-1.5">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            Secure Session & OTP Gateway
          </span>
          <span>TrendVibe v2.5</span>
        </div>
      </div>
    </div>
  );
};
