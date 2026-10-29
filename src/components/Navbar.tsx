import React, { useState } from 'react';
import { useApp } from '../context/AppContext.tsx';
import {
  ShoppingBag,
  Sparkles,
  PhoneCall,
  User as UserIcon,
  Search,
  Store,
  ShieldCheck,
  CheckCircle2,
  ChevronDown,
  Layers,
  ArrowRight,
  Lock,
  LogIn,
  LogOut,
  Shield,
} from 'lucide-react';

interface NavbarProps {
  searchQuery: string;
  setSearchQuery: (q: string) => void;
  selectedCategory: string;
  setSelectedCategory: (c: string) => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  searchQuery,
  setSearchQuery,
  selectedCategory,
  setSelectedCategory,
}) => {
  const {
    user,
    availableUsers,
    switchPersona,
    cartCount,
    activeTab,
    setActiveTab,
    startCallingZyro,
    categories,
    openLoginModal,
    logout,
  } = useApp();

  const [showPersonaDropdown, setShowPersonaDropdown] = useState(false);

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200 shadow-xs">
      {/* Top Notification / Express Banner */}
      <div className="bg-gradient-to-r from-indigo-900 via-indigo-800 to-violet-900 text-white text-xs py-1.5 px-4 font-medium">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="bg-emerald-500/20 text-emerald-300 text-[11px] font-bold px-2 py-0.5 rounded-full border border-emerald-400/30 flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
              ⚡ 30-MIN EXPRESS
            </span>
            <span className="hidden sm:inline text-slate-200">
              Instant delivery on certified Medicines & Fresh Health Kitchen in serviceable Bangalore pin codes!
            </span>
          </div>
          <div className="flex items-center gap-4 text-[11px] text-slate-300">
            <span className="hidden md:inline">24/7 AI Voice Shopping Assistant</span>
            <button
              onClick={() => startCallingZyro()}
              className="inline-flex items-center gap-1.5 bg-white/10 hover:bg-white/20 text-white px-2.5 py-0.5 rounded-full transition-colors cursor-pointer border border-white/15"
            >
              <PhoneCall className="w-3 h-3 text-emerald-400" />
              <span>Call Zyro AI</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Nav Bar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-4">
          {/* Logo & Brand */}
          <div className="flex items-center gap-6">
            <button
              onClick={() => setActiveTab('storefront')}
              className="flex items-center gap-2.5 group text-left cursor-pointer"
            >
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 via-violet-600 to-indigo-500 flex items-center justify-center text-white shadow-md shadow-indigo-500/20 group-hover:scale-105 transition-transform">
                <Store className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <span className="text-xl font-extrabold tracking-tight bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-800 bg-clip-text text-transparent">
                    TrendVibe
                  </span>
                  <span className="bg-indigo-100 text-indigo-700 text-[10px] font-bold px-1.5 py-0.5 rounded border border-indigo-200 flex items-center gap-0.5">
                    <Sparkles className="w-2.5 h-2.5" />
                    Zyro AI
                  </span>
                </div>
                <p className="text-[10px] text-slate-500 font-medium tracking-wide">
                  Curated Multi-Vendor Store & AI Voice Agent
                </p>
              </div>
            </button>
          </div>

          {/* Search Input */}
          <div className="flex-1 max-w-md hidden md:block">
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                placeholder="Search medicines, gadgets, food, apparel, specifications..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-slate-100/80 hover:bg-slate-100 focus:bg-white text-sm text-slate-900 pl-10 pr-4 py-2 rounded-xl border border-transparent focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all placeholder:text-slate-400"
              />
            </div>
          </div>

          {/* Navigation Action Buttons */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Zyro AI Shopping Button */}
            <button
              onClick={() => setActiveTab('ai-shopping')}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                activeTab === 'ai-shopping'
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20'
                  : 'bg-indigo-50 text-indigo-700 hover:bg-indigo-100 border border-indigo-200/60'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">AI Shopping</span>
            </button>

            {/* Calling Agent Trigger Button */}
            <button
              onClick={() => startCallingZyro()}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200/80 transition-all cursor-pointer"
              title="Launch bilingual AI Calling Agent (English & Kannada)"
            >
              <PhoneCall className="w-3.5 h-3.5 text-emerald-600 animate-pulse" />
              <span className="hidden sm:inline">Voice Agent</span>
            </button>

            {/* Customer Orders */}
            {user?.role === 'customer' && (
              <button
                onClick={() => setActiveTab('customer-orders')}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                  activeTab === 'customer-orders'
                    ? 'bg-slate-900 text-white'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                <span>My Orders</span>
              </button>
            )}

            {/* Seller Hub */}
            {(user?.role === 'seller' || user?.role === 'admin') && (
              <button
                onClick={() => setActiveTab('seller-dashboard')}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                  activeTab === 'seller-dashboard'
                    ? 'bg-violet-700 text-white shadow-md'
                    : 'bg-violet-50 text-violet-700 hover:bg-violet-100 border border-violet-200/70'
                }`}
              >
                <Layers className="w-3.5 h-3.5" />
                <span className="hidden md:inline">Seller Hub</span>
              </button>
            )}

            {/* Admin Dashboard */}
            {user?.role === 'admin' && (
              <button
                onClick={() => setActiveTab('admin-dashboard')}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                  activeTab === 'admin-dashboard'
                    ? 'bg-slate-900 text-white'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                <ShieldCheck className="w-3.5 h-3.5 text-amber-500" />
                <span className="hidden md:inline">Admin</span>
              </button>
            )}

            {/* Cart Button */}
            <button
              onClick={() => setActiveTab('cart')}
              className={`relative flex items-center justify-center p-2 sm:px-3 sm:py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                activeTab === 'cart'
                  ? 'bg-indigo-600 text-white'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              <ShoppingBag className="w-4 h-4" />
              <span className="hidden sm:inline ml-1.5">Cart</span>
              {cartCount > 0 && (
                <span className="absolute -top-1.5 -right-1.5 bg-rose-500 text-white text-[10px] font-bold w-5 h-5 rounded-full flex items-center justify-center shadow-xs">
                  {cartCount}
                </span>
              )}
            </button>

            {/* Secure Sign In Action Button */}
            <button
              onClick={() => openLoginModal(user?.role || 'customer')}
              className="hidden sm:inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-500 text-white shadow-xs transition-colors cursor-pointer"
            >
              <Lock className="w-3.5 h-3.5 text-indigo-200" />
              <span>{user ? 'Switch Role' : 'Sign In'}</span>
            </button>

            {/* Persona Switcher Dropdown */}
            <div className="relative">
              <button
                onClick={() => setShowPersonaDropdown(!showPersonaDropdown)}
                className="flex items-center gap-2 p-1.5 sm:px-3 sm:py-1.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 transition-colors text-xs font-medium cursor-pointer"
              >
                <div className="w-6 h-6 rounded-full bg-slate-200 overflow-hidden flex items-center justify-center text-slate-700">
                  {user?.avatarUrl ? (
                    <img src={user.avatarUrl} alt={user.name} className="w-full h-full object-cover" />
                  ) : (
                    <UserIcon className="w-3.5 h-3.5" />
                  )}
                </div>
                <div className="text-left hidden lg:block leading-tight">
                  <div className="font-semibold text-slate-900 truncate max-w-[100px]">
                    {user?.name.split(' ')[0] || 'Guest'}
                  </div>
                  <div className="text-[10px] text-indigo-600 capitalize font-medium">
                    {user?.role || 'Sign In'}
                  </div>
                </div>
                <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
              </button>

              {showPersonaDropdown && (
                <div className="absolute right-0 mt-2 w-80 bg-white rounded-2xl shadow-2xl border border-slate-200 py-2 z-50 animate-in fade-in zoom-in-95">
                  {/* Secure Login by Role Triggers */}
                  <div className="px-4 py-2.5 border-b border-slate-100 bg-slate-50/70">
                    <p className="text-[11px] font-extrabold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                      <Lock className="w-3.5 h-3.5 text-indigo-600" />
                      <span>Secure Role-Based Sign In</span>
                    </p>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      Enter Gmail, mobile number & password:
                    </p>
                    <div className="grid grid-cols-3 gap-1.5 mt-2">
                      <button
                        onClick={() => {
                          setShowPersonaDropdown(false);
                          openLoginModal('customer');
                        }}
                        className="py-1.5 px-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-lg text-[10px] font-bold border border-indigo-200/80 cursor-pointer text-center"
                      >
                        User / Customer
                      </button>
                      <button
                        onClick={() => {
                          setShowPersonaDropdown(false);
                          openLoginModal('seller');
                        }}
                        className="py-1.5 px-2 bg-amber-50 hover:bg-amber-100 text-amber-800 rounded-lg text-[10px] font-bold border border-amber-200/80 cursor-pointer text-center"
                      >
                        Seller Hub
                      </button>
                      <button
                        onClick={() => {
                          setShowPersonaDropdown(false);
                          openLoginModal('admin');
                        }}
                        className="py-1.5 px-2 bg-purple-50 hover:bg-purple-100 text-purple-800 rounded-lg text-[10px] font-bold border border-purple-200/80 cursor-pointer text-center"
                      >
                        Platform Admin
                      </button>
                    </div>
                  </div>

                  {/* Account Shortcuts */}
                  <div className="py-1 px-2 space-y-1">
                    {user?.role === 'customer' && (
                      <button
                        onClick={() => {
                          setActiveTab('customer-orders');
                          setShowPersonaDropdown(false);
                        }}
                        className="w-full px-3 py-2 text-left hover:bg-slate-50 text-slate-700 rounded-xl text-xs font-semibold flex items-center gap-2 transition-colors cursor-pointer"
                      >
                        <UserIcon className="w-3.5 h-3.5 text-indigo-600" />
                        <span>My Orders & Profile</span>
                      </button>
                    )}

                    {(user?.role === 'seller' || user?.role === 'admin') && (
                      <button
                        onClick={() => {
                          setActiveTab('seller-dashboard');
                          setShowPersonaDropdown(false);
                        }}
                        className="w-full px-3 py-2 text-left hover:bg-amber-50 text-amber-900 rounded-xl text-xs font-semibold flex items-center gap-2 transition-colors cursor-pointer"
                      >
                        <Store className="w-3.5 h-3.5 text-amber-600" />
                        <span>Seller Dashboard</span>
                      </button>
                    )}

                    {user?.role === 'admin' && (
                      <button
                        onClick={() => {
                          setActiveTab('admin-dashboard');
                          setShowPersonaDropdown(false);
                        }}
                        className="w-full px-3 py-2 text-left hover:bg-purple-50 text-purple-900 rounded-xl text-xs font-semibold flex items-center gap-2 transition-colors cursor-pointer"
                      >
                        <Shield className="w-3.5 h-3.5 text-purple-600" />
                        <span>Admin Console</span>
                      </button>
                    )}
                  </div>

                  {/* Sign Out Option */}
                  {user && (
                    <div className="pt-1.5 border-t border-slate-100 px-2">
                      <button
                        onClick={() => {
                          logout();
                          setShowPersonaDropdown(false);
                        }}
                        className="w-full px-3 py-2 text-left hover:bg-rose-50 text-rose-600 rounded-xl text-xs font-bold flex items-center gap-2 transition-colors cursor-pointer"
                      >
                        <LogOut className="w-3.5 h-3.5" />
                        <span>Sign Out ({user.name.split(' ')[0]})</span>
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Category Horizontal Filter Bar */}
        {activeTab === 'storefront' && (
          <div className="flex items-center gap-2 overflow-x-auto py-2.5 scrollbar-none border-t border-slate-100 text-xs">
            <button
              onClick={() => setSelectedCategory('all')}
              className={`shrink-0 px-3.5 py-1.5 rounded-full font-semibold transition-all cursor-pointer ${
                selectedCategory === 'all'
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              All Categories (8)
            </button>
            {categories.map((cat) => {
              const isSelected = selectedCategory === cat.slug;
              return (
                <button
                  key={cat.id}
                  onClick={() => setSelectedCategory(cat.slug)}
                  className={`shrink-0 px-3 py-1.5 rounded-full font-semibold transition-all flex items-center gap-1.5 cursor-pointer ${
                    isSelected
                      ? 'bg-indigo-600 text-white shadow-xs'
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                  }`}
                >
                  {cat.supportsExpress30Min && (
                    <span className="text-amber-400 font-bold">⚡</span>
                  )}
                  <span>{cat.name}</span>
                </button>
              );
            })}
          </div>
        )}
      </div>
    </header>
  );
};
