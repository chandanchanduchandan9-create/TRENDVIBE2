import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext.tsx';
import { api } from '../services/api.ts';
import { Product } from '../types/index.ts';
import {
  UserCheck,
  Send,
  Copy,
  Check,
  Share2,
  CheckCircle2,
  Sparkles,
  Phone,
  Mail,
  User,
  ShoppingBag,
  ShieldCheck,
  ArrowRight,
  FileText,
} from 'lucide-react';
import { VoiceAssistantModal } from './VoiceAssistantModal.tsx';

export const LeadAcquisitionView: React.FC = () => {
  const { user, showToast } = useApp();

  const [products, setProducts] = useState<Product[]>([]);
  const [selectedProductId, setSelectedProductId] = useState<string>('');
  const [productInterest, setProductInterest] = useState<string>('');
  const [customerName, setCustomerName] = useState(user?.name || '');
  const [customerPhone, setCustomerPhone] = useState(user?.phone || '');
  const [customerEmail, setCustomerEmail] = useState(user?.email || '');
  const [notes, setNotes] = useState('');
  const [hasConsent, setHasConsent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [submittedLead, setSubmittedLead] = useState<any | null>(null);
  const [isVoiceAssistantOpen, setIsVoiceAssistantOpen] = useState(false);

  // Load product list for interest dropdown
  useEffect(() => {
    async function fetchProducts() {
      try {
        const prods = await api.getProducts();
        setProducts(prods);

        // Check if URL has a specific productId parameter
        const params = new URLSearchParams(window.location.search);
        const urlProdId = params.get('productId');
        if (urlProdId) {
          const match = prods.find((p) => p.id === urlProdId);
          if (match) {
            setSelectedProductId(match.id);
            setProductInterest(match.name);
          }
        }
      } catch (e) {
        console.error('Failed to load products for lead form:', e);
      }
    }
    fetchProducts();
  }, []);

  const leadUrl = `${window.location.origin}?view=lead-acquisition${selectedProductId ? `&productId=${encodeURIComponent(selectedProductId)}` : ''}`;

  const handleCopyLink = () => {
    navigator.clipboard.writeText(leadUrl);
    setCopiedLink(true);
    showToast('Lead Acquisition Form link copied!', 'success');
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const handleShareLink = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'TrendVibe Product Consultation & Lead Form',
          text: 'Submit your product requirements directly to certified sellers on TrendVibe Store.',
          url: leadUrl,
        });
      } catch {
        handleCopyLink();
      }
    } else {
      handleCopyLink();
    }
  };

  const handleProductSelect = (prodId: string) => {
    setSelectedProductId(prodId);
    const prod = products.find((p) => p.id === prodId);
    if (prod) {
      setProductInterest(prod.name);
    }
  };

  const handleSubmitLead = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loading) return;

    if (!customerName.trim()) {
      showToast('Please enter your full name.', 'error');
      return;
    }

    if (!customerPhone.trim()) {
      showToast('Please enter your mobile phone number.', 'error');
      return;
    }

    if (!customerEmail.trim() || !customerEmail.includes('@')) {
      showToast('Please enter a valid email address.', 'error');
      return;
    }

    if (!productInterest.trim()) {
      showToast('Please select or specify your product interest.', 'error');
      return;
    }

    if (!hasConsent) {
      showToast('Please accept the consent terms to submit your lead information.', 'error');
      return;
    }

    setLoading(true);
    try {
      const selectedProd = products.find((p) => p.id === selectedProductId);
      const res = await api.submitLead({
        name: customerName.trim(),
        mobile: customerPhone.trim(),
        email: customerEmail.trim(),
        productInterest: productInterest.trim(),
        productId: selectedProductId || undefined,
        sellerId: selectedProd?.sellerId || undefined,
        notes: notes.trim() || undefined,
        hasConsent: true,
        consentTimestamp: new Date().toISOString(),
      });

      setSubmittedLead(res.lead);
      setIsVoiceAssistantOpen(true);
      showToast('Lead submitted successfully! Connecting to AI Shopping Assistant...', 'success');
    } catch (err: any) {
      showToast(`Submission failed: ${err.message}`, 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleResetForm = () => {
    setSubmittedLead(null);
    setNotes('');
    setHasConsent(false);
  };

  const selectedProdObj = products.find((p) => p.id === selectedProductId);

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 animate-in fade-in space-y-6">
      {/* Top Banner & Header */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 rounded-3xl p-6 sm:p-8 text-white shadow-xl relative overflow-hidden border border-slate-800">
        <div className="relative z-10 space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/20 text-indigo-300 text-xs font-bold border border-indigo-400/30">
            <UserCheck className="w-3.5 h-3.5" />
            <span>Dedicated Lead Acquisition Module</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            Product Consultation & Lead Acquisition
          </h1>
          <p className="text-sm text-slate-300 max-w-2xl leading-relaxed">
            Submit your commercial requirement, batch specifications, or bulk consultation requests directly to verified merchants.
          </p>

          {/* Action Row: Copy Link & Share Link */}
          <div className="pt-3 flex flex-wrap items-center gap-2.5">
            <button
              onClick={handleCopyLink}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-bold transition-colors cursor-pointer border border-white/15"
            >
              {copiedLink ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copiedLink ? 'Link Copied!' : 'Copy Form Link'}</span>
            </button>

            <button
              onClick={handleShareLink}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition-colors cursor-pointer shadow-sm"
            >
              <Share2 className="w-3.5 h-3.5" />
              <span>Share Lead Form</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Container */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-sm border border-slate-200 space-y-6">
        {/* INLINE SUBMISSION SUCCESS STATE */}
        {submittedLead ? (
          <div className="p-8 bg-emerald-50 border border-emerald-200 rounded-2xl text-center space-y-4 animate-in zoom-in-95">
            <div className="w-14 h-14 bg-emerald-100 rounded-full flex items-center justify-center mx-auto text-emerald-600">
              <CheckCircle2 className="w-8 h-8" />
            </div>

            <div className="space-y-1">
              <h3 className="text-xl font-extrabold text-slate-900">
                Lead Received & Recorded Securely!
              </h3>
              <p className="text-xs text-slate-600 max-w-md mx-auto leading-relaxed">
                Thank you for your interest. Your product consultation details have been recorded in our verified merchant operations registry (Lead ID: <span className="font-mono font-bold text-slate-800">{submittedLead.id}</span>).
              </p>
            </div>

            {/* Lead Summary Card */}
            <div className="bg-white p-4 rounded-xl border border-emerald-200/80 max-w-md mx-auto text-left text-xs space-y-2 text-slate-700">
              <div className="flex justify-between border-b border-slate-100 pb-1.5">
                <span className="text-slate-400 font-medium">Customer:</span>
                <span className="font-bold text-slate-900">{submittedLead.name}</span>
              </div>
              <div className="flex justify-between border-b border-slate-100 pb-1.5">
                <span className="text-slate-400 font-medium">Phone:</span>
                <span className="font-mono font-bold text-slate-900">{submittedLead.mobile}</span>
              </div>
              <div className="flex justify-between border-b border-slate-100 pb-1.5">
                <span className="text-slate-400 font-medium">Product Interest:</span>
                <span className="font-bold text-indigo-700">{submittedLead.productInterest}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400 font-medium">Recorded At:</span>
                <span className="text-slate-500">{new Date(submittedLead.createdAt).toLocaleString()}</span>
              </div>
            </div>

            {/* AI Website Voice Assistant Button */}
            <div className="pt-2 max-w-md mx-auto w-full space-y-2">
              <div className="p-3 bg-indigo-50 border border-indigo-100 rounded-xl text-[11px] text-indigo-900 text-center">
                Want immediate answers about batch availability, bulk pricing, or shipping?
              </div>
              <button
                type="button"
                onClick={() => setIsVoiceAssistantOpen(true)}
                className="w-full py-3.5 px-4 bg-gradient-to-r from-indigo-600 via-indigo-700 to-violet-700 hover:from-indigo-500 hover:to-violet-600 text-white font-extrabold text-xs sm:text-sm rounded-2xl shadow-lg shadow-indigo-500/25 flex items-center justify-center gap-2.5 transition-all transform hover:-translate-y-0.5 cursor-pointer"
              >
                <Sparkles className="w-4 h-4 text-indigo-200" />
                <span>Talk to Our AI Shopping Assistant</span>
              </button>
            </div>

            {/* Actions: Stays on form without redirecting to website */}
            <div className="pt-2 flex flex-wrap justify-center items-center gap-3">
              <button
                onClick={handleResetForm}
                className="px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl cursor-pointer shadow-sm transition-colors"
              >
                Submit Another Consultation
              </button>
            </div>
          </div>
        ) : (
          /* LEAD SUBMISSION FORM */
          <form onSubmit={handleSubmitLead} className="space-y-5">
            {/* Form Introduction */}
            <div className="border-b border-slate-100 pb-4">
              <h2 className="text-base font-extrabold text-slate-900">Commercial Consultation Request</h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Fill out the form below. Leads are stored securely in the merchant database without initiating unsolicited calls.
              </p>
            </div>

            {/* Product Interest Selection */}
            <div className="space-y-2">
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide">
                Product of Interest: <span className="text-rose-500">*</span>
              </label>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <select
                    value={selectedProductId}
                    onChange={(e) => handleProductSelect(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 text-xs text-slate-900 p-2.5 rounded-xl focus:border-indigo-500 focus:outline-none"
                  >
                    <option value="">-- Choose from Store Catalogue --</option>
                    {products.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name} (₹{p.price})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <input
                    type="text"
                    required
                    value={productInterest}
                    onChange={(e) => setProductInterest(e.target.value)}
                    placeholder="Or type specific product interest (e.g. Bulk Dolo 650, ASUS TUF)"
                    className="w-full bg-slate-50 border border-slate-300 text-xs text-slate-900 p-2.5 rounded-xl focus:border-indigo-500 focus:outline-none"
                  />
                </div>
              </div>

              {selectedProdObj && (
                <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex items-center gap-3">
                  <img
                    src={selectedProdObj.images[0] || 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=150&q=80'}
                    alt={selectedProdObj.name}
                    className="w-10 h-10 rounded-lg object-cover border border-slate-200"
                  />
                  <div className="flex-1 min-w-0 text-xs">
                    <span className="font-bold text-slate-900 truncate block">{selectedProdObj.name}</span>
                    <span className="text-slate-500">₹{selectedProdObj.price} • Merchant: {selectedProdObj.sellerName}</span>
                  </div>
                </div>
              )}
            </div>

            {/* Customer Contact Details */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-1">
                  Full Name: <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <User className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-3" />
                  <input
                    type="text"
                    required
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    placeholder="Chandan Kumar"
                    className="w-full pl-8 pr-3 py-2.5 bg-slate-50 border border-slate-300 text-xs text-slate-900 rounded-xl focus:border-indigo-500 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-1">
                  Mobile Number: <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <Phone className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-3" />
                  <input
                    type="tel"
                    required
                    value={customerPhone}
                    onChange={(e) => setCustomerPhone(e.target.value)}
                    placeholder="+91 98450 12345"
                    className="w-full pl-8 pr-3 py-2.5 bg-slate-50 border border-slate-300 text-xs text-slate-900 rounded-xl focus:border-indigo-500 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-1">
                  Email Address: <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <Mail className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-3" />
                  <input
                    type="email"
                    required
                    value={customerEmail}
                    onChange={(e) => setCustomerEmail(e.target.value)}
                    placeholder="you@domain.com"
                    className="w-full pl-8 pr-3 py-2.5 bg-slate-50 border border-slate-300 text-xs text-slate-900 rounded-xl focus:border-indigo-500 focus:outline-none"
                  />
                </div>
              </div>
            </div>

            {/* Requirements / Notes */}
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-1">
                Specific Consultation Requirements / Notes:
              </label>
              <textarea
                rows={3}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Mention expected volume, delivery timelines, specific variant preferences, or tax invoice requirements..."
                className="w-full p-2.5 bg-slate-50 border border-slate-300 text-xs text-slate-900 rounded-xl focus:border-indigo-500 focus:outline-none"
              />
            </div>

            {/* Consent Checkbox */}
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex items-start gap-2.5">
              <input
                type="checkbox"
                id="leadConsentCheckbox"
                required
                checked={hasConsent}
                onChange={(e) => setHasConsent(e.target.checked)}
                className="mt-0.5 rounded text-indigo-600 focus:ring-indigo-500 w-4 h-4 cursor-pointer"
              />
              <label htmlFor="leadConsentCheckbox" className="text-xs text-slate-600 leading-snug cursor-pointer select-none">
                <span className="font-bold text-slate-800">Customer Consent:</span> I consent to TrendVibe Store and authorized seller representatives recording this lead consultation request and following up regarding product availability and commercial pricing.
              </label>
            </div>

            {/* Submit Action */}
            <button
              type="submit"
              disabled={loading || !hasConsent}
              className={`w-full py-3.5 text-white font-extrabold text-xs rounded-xl shadow-md flex items-center justify-center gap-2 transition-all cursor-pointer ${
                hasConsent ? 'bg-indigo-600 hover:bg-indigo-500' : 'bg-slate-300 cursor-not-allowed'
              }`}
            >
              {loading ? (
                <span>Recording Lead...</span>
              ) : (
                <>
                  <Send className="w-4 h-4" />
                  <span>Submit Lead Consultation Request</span>
                </>
              )}
            </button>
          </form>
        )}

        {/* Reusable Voice Assistant Modal */}
        {submittedLead && (
          <VoiceAssistantModal
            isOpen={isVoiceAssistantOpen}
            onClose={() => setIsVoiceAssistantOpen(false)}
            autoStart={true}
            context={{
              leadId: submittedLead.id,
              productName: selectedProdObj?.name || submittedLead.productInterest,
              productId: selectedProdObj?.id,
              productDetails: selectedProdObj
                ? {
                    name: selectedProdObj.name,
                    brand: selectedProdObj.brand,
                    price: selectedProdObj.price,
                    mrp: selectedProdObj.mrp,
                    category: selectedProdObj.category,
                    inStock: (selectedProdObj.stock?.available ?? 0) > 0,
                    availableStock: selectedProdObj.stock?.available ?? 0,
                    express30Min: Boolean(selectedProdObj.deliveryConfig?.supportsExpress30Min),
                    kannadaName: selectedProdObj.kannadaName || '',
                    description: selectedProdObj.description || selectedProdObj.shortDescription || '',
                  }
                : undefined,
              customerName: submittedLead.name,
              customerPhone: submittedLead.mobile,
            }}
          />
        )}
      </div>
    </div>
  );
};
