import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext.tsx';
import { api } from '../services/api.ts';
import { User, Product, CategoryInfo } from '../types/index.ts';
import {
  ShieldCheck,
  Users,
  Store,
  Layers,
  CheckCircle2,
  XCircle,
  Settings,
  AlertTriangle,
  Zap,
  Database,
  RefreshCw,
} from 'lucide-react';

export const AdminDashboard: React.FC = () => {
  const { user, categories, showToast } = useApp();
  const [users, setUsers] = useState<User[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        const [switchUsers, prods] = await Promise.all([
          api.getSwitchUsers(),
          api.getProducts({ status: 'all' }),
        ]);
        setUsers(switchUsers);
        setProducts(prods);
      } catch (e: any) {
        showToast(e.message, 'error');
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  const totalSellers = users.filter((u) => u.role === 'seller').length;
  const totalCustomers = users.filter((u) => u.role === 'customer').length;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-in fade-in space-y-8">
      {/* Admin Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 rounded-3xl p-6 sm:p-8 text-white shadow-xl flex items-center justify-between">
        <div>
          <span className="bg-amber-500/20 text-amber-300 text-xs font-bold px-3 py-1 rounded-full border border-amber-400/30">
            Platform Super-Admin Mode
          </span>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight mt-2">
            TrendVibe Store Governance & Moderation
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Global monitoring of multi-vendor onboarding, 8 product categories, and system policies.
          </p>
        </div>

        <ShieldCheck className="w-12 h-12 text-amber-400 hidden sm:block shrink-0" />
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-xs">
          <span className="text-xs font-semibold text-slate-500">Total Accounts</span>
          <div className="text-2xl font-extrabold text-slate-900 mt-1">{users.length}</div>
          <span className="text-[11px] text-indigo-600 font-bold mt-1 inline-block">
            {totalCustomers} Customers
          </span>
        </div>

        <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-xs">
          <span className="text-xs font-semibold text-slate-500">Active Sellers</span>
          <div className="text-2xl font-extrabold text-violet-600 mt-1">{totalSellers}</div>
          <span className="text-[11px] text-emerald-600 font-bold mt-1 inline-block">100% Approved</span>
        </div>

        <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-xs">
          <span className="text-xs font-semibold text-slate-500">Total Catalog Items</span>
          <div className="text-2xl font-extrabold text-slate-900 mt-1">{products.length}</div>
          <span className="text-[11px] text-slate-400 mt-1 inline-block">Across 8 Categories</span>
        </div>

        <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-xs">
          <span className="text-xs font-semibold text-slate-500">Zyro AI Grounding</span>
          <div className="text-2xl font-extrabold text-emerald-600 mt-1">Active</div>
          <span className="text-[11px] text-slate-400 mt-1 inline-block">Gemini 3.8 Flash</span>
        </div>
      </div>

      {/* Supabase Cloud Infrastructure Card */}
      <div className="bg-white rounded-3xl border border-emerald-200/80 p-6 shadow-xs space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold border border-emerald-200">
              <Database className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-extrabold text-slate-900 text-sm">Supabase PostgreSQL Cloud Database</h3>
                <span className="bg-emerald-100 text-emerald-800 text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                  Active & Authenticated
                </span>
              </div>
              <p className="text-xs text-slate-500 font-mono mt-0.5">
                Project ID: <strong className="text-slate-900">ovdgiwothbuxthjczrkp</strong> • REST API: https://ovdgiwothbuxthjczrkp.supabase.co
              </p>
            </div>
          </div>

          <button
            onClick={async () => {
              try {
                const res = await api.syncSupabase();
                showToast(`Supabase synchronized with ${res.productsCount} products and ${res.ordersCount} orders!`, 'success');
              } catch (e: any) {
                showToast(e.message, 'error');
              }
            }}
            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition-all shadow-xs flex items-center justify-center gap-1.5 cursor-pointer shrink-0"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Sync Cloud Database</span>
          </button>
        </div>
        <p className="text-xs text-slate-600 leading-relaxed border-t border-slate-100 pt-3">
          Configured with publishable client credential. Supports cloud persistence, multi-vendor product catalogs, and transactional order records alongside atomic server-side inventory locking.
        </p>
      </div>

      {/* Category Management Overview */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-xs p-6 space-y-4">
        <h3 className="font-extrabold text-slate-900 text-sm">
          Platform Product Categories & 30-Min Express Rules
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
          {categories.map((c) => (
            <div key={c.id} className="p-3.5 rounded-2xl border border-slate-200 bg-slate-50 space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="font-bold text-slate-900">{c.name}</span>
                {c.supportsExpress30Min ? (
                  <span className="bg-emerald-100 text-emerald-800 text-[10px] font-bold px-1.5 py-0.5 rounded flex items-center gap-0.5">
                    <Zap className="w-2.5 h-2.5" /> Express
                  </span>
                ) : (
                  <span className="text-slate-400 text-[10px]">Standard</span>
                )}
              </div>
              <p className="text-slate-500 text-[11px] font-['Noto_Sans_Kannada',sans-serif]">
                {c.kannadaName}
              </p>
              <p className="text-slate-600 text-[11px] line-clamp-2">{c.description}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Sellers List & Moderation */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-4 border-b border-slate-100">
          <h3 className="font-extrabold text-slate-900 text-sm">Registered Sellers & Verification Status</h3>
        </div>
        <div className="divide-y divide-slate-100 text-xs">
          {users
            .filter((u) => u.role === 'seller')
            .map((s) => (
              <div key={s.id} className="p-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <img
                    src={s.avatarUrl || 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=100'}
                    alt={s.name}
                    className="w-10 h-10 rounded-xl object-cover bg-slate-100 border border-slate-200"
                  />
                  <div>
                    <div className="font-bold text-slate-900">{s.name}</div>
                    <div className="text-slate-500 font-semibold">{s.storeName}</div>
                    <div className="text-[11px] text-slate-400">{s.email} • {s.phone}</div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span className="bg-emerald-100 text-emerald-800 font-bold px-2.5 py-1 rounded-xl text-[11px] flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                    Verified & Approved Seller
                  </span>
                </div>
              </div>
            ))}
        </div>
      </div>
    </div>
  );
};
