import React, { useState } from 'react';
import { AppProvider, useApp } from './context/AppContext.tsx';
import { Navbar } from './components/Navbar.tsx';
import { StorefrontView } from './components/StorefrontView.tsx';
import { ProductDetailView } from './components/ProductDetailView.tsx';
import { AIShoppingView } from './components/AIShoppingView.tsx';
import { CartCheckoutView } from './components/CartCheckoutView.tsx';
import { CustomerDashboard } from './components/CustomerDashboard.tsx';
import { SellerDashboard } from './components/SellerDashboard.tsx';
import { AdminDashboard } from './components/AdminDashboard.tsx';
import { ZyroCallingModal } from './components/ZyroCallingModal.tsx';
import { EnquiryModal } from './components/EnquiryModal.tsx';
import { LoginModal } from './components/LoginModal.tsx';
import { RetellVoiceWidget } from './components/RetellVoiceWidget.tsx';
import { Sparkles, PhoneCall, CheckCircle2, AlertCircle, Info } from 'lucide-react';

const MainApp: React.FC = () => {
  const {
    activeTab,
    setActiveTab,
    selectedProductId,
    toasts,
    startCallingZyro,
  } = useApp();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col selection:bg-indigo-500 selection:text-white">
      {/* Top Navbar */}
      <Navbar
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        selectedCategory={selectedCategory}
        setSelectedCategory={setSelectedCategory}
      />

      {/* Main Content Router */}
      <main className="flex-1">
        {activeTab === 'storefront' && (
          <StorefrontView
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
            selectedCategory={selectedCategory}
            setSelectedCategory={setSelectedCategory}
          />
        )}

        {activeTab === 'product-detail' && selectedProductId && (
          <ProductDetailView
            productId={selectedProductId}
            onBack={() => setActiveTab('storefront')}
          />
        )}

        {activeTab === 'ai-shopping' && <AIShoppingView />}

        {activeTab === 'cart' && <CartCheckoutView />}

        {activeTab === 'customer-orders' && <CustomerDashboard />}

        {activeTab === 'seller-dashboard' && <SellerDashboard />}

        {activeTab === 'admin-dashboard' && <AdminDashboard />}
      </main>

      {/* Floating "Talk to Zyro AI" Button Connected to Retell AI Voice Agent */}
      <RetellVoiceWidget />

      {/* Modals & Overlays */}
      <ZyroCallingModal />
      <EnquiryModal />
      <LoginModal />

      {/* Toast Notification Container */}
      <div className="fixed bottom-6 left-6 z-50 flex flex-col gap-2 pointer-events-none max-w-sm">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={`pointer-events-auto p-3.5 rounded-2xl shadow-xl border text-xs font-semibold flex items-center gap-2.5 animate-in slide-in-from-bottom-5 duration-200 ${
              toast.type === 'success'
                ? 'bg-slate-900 text-white border-slate-800'
                : toast.type === 'error'
                ? 'bg-rose-950 text-rose-100 border-rose-800'
                : 'bg-indigo-950 text-indigo-100 border-indigo-800'
            }`}
          >
            {toast.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            ) : toast.type === 'error' ? (
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
            ) : (
              <Info className="w-4 h-4 text-indigo-400 shrink-0" />
            )}
            <span>{toast.text}</span>
          </div>
        ))}
      </div>

      {/* Footer */}
      <footer className="bg-white border-t border-slate-200 py-10 mt-16 text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <span className="font-extrabold text-base text-slate-900 tracking-tight">
                TrendVibe Store
              </span>
              <span className="bg-indigo-100 text-indigo-700 text-[10px] font-bold px-1.5 py-0.5 rounded">
                Zyro AI
              </span>
            </div>
            <p className="text-slate-500 text-xs leading-relaxed">
              Multi-vendor e-commerce platform powered by Zyro AI. Certified medicines, fresh kitchen foods, technology, and apparel with verified 30-minute hyper-local delivery.
            </p>
          </div>

          <div>
            <h4 className="font-bold text-slate-900 uppercase text-[11px] tracking-wider mb-3">
              Starter Categories (8)
            </h4>
            <ul className="space-y-2 text-slate-600">
              <li>Medicines & Healthcare (Dolo 650, Calpol, Electral, Moov)</li>
              <li>Fresh Food (Ragi Idli, Veg Idli, Protein Ladoo, Pancakes)</li>
              <li>Mobiles (iPhone 16, Samsung S25, Pixel 9a, OnePlus 13)</li>
              <li>Laptops (ASUS TUF F15, Vivobook, Dell, Lenovo)</li>
            </ul>
          </div>

          <div>
            <h4 className="font-bold text-slate-900 uppercase text-[11px] tracking-wider mb-3">
              Zyro AI Capabilities
            </h4>
            <ul className="space-y-2 text-slate-600">
              <li>Bilingual Voice Calling in English & ಕನ್ನಡ</li>
              <li>Seller PDF Knowledge Retrieval & Citations (RAG)</li>
              <li>Real-Time Conversational Order Placement</li>
              <li>Atomic Stock & Reservation Verification</li>
            </ul>
          </div>

          <div>
            <h4 className="font-bold text-slate-900 uppercase text-[11px] tracking-wider mb-3">
              Seller & Compliance Hub
            </h4>
            <p className="text-slate-600 mb-2">
              Multi-vendor ready with confidential finance ledgers, GMV & COGS accounting, and tamper-proof batch verification.
            </p>
            <div className="flex items-center gap-2 text-emerald-600 font-bold">
              <span>⚡ 30-Min Bangalore Service Area</span>
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 mt-8 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between text-[11px] text-slate-400 gap-2">
          <p>© 2026 TrendVibe Store & Zyro AI. All rights reserved.</p>
          <p>Designed for production multi-vendor operations with real database persistence.</p>
        </div>
      </footer>
    </div>
  );
};

export default function App() {
  return (
    <AppProvider>
      <MainApp />
    </AppProvider>
  );
}
