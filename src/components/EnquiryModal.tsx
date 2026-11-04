import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext.tsx';
import { api } from '../services/api.ts';
import { Product } from '../types/index.ts';
import {
  MessageSquare,
  Send,
  Copy,
  Check,
  CheckCircle2,
  HelpCircle,
  ShoppingBag,
  ShieldCheck,
  Sparkles,
} from 'lucide-react';
import { VoiceAssistantModal } from './VoiceAssistantModal.tsx';

export const EnquiryModal: React.FC = () => {
  const {
    selectedEnquiryProductId,
    closeEnquiryModal,
    user,
    showToast,
    addToCart,
    setActiveTab,
  } = useApp();

  const [customerName, setCustomerName] = useState(user?.name || 'Chandan Kumar');
  const [customerPhone, setCustomerPhone] = useState(user?.phone || '+91 98450 12345');
  const [customerEmail, setCustomerEmail] = useState(user?.email || 'chandanchanduchandan9@gmail.com');
  const [question, setQuestion] = useState('');
  const [loading, setLoading] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [submittedMessage, setSubmittedMessage] = useState(false);
  const [submittedEnquiryId, setSubmittedEnquiryId] = useState<string | undefined>(undefined);
  const [isVoiceAssistantOpen, setIsVoiceAssistantOpen] = useState(false);
  const [product, setProduct] = useState<Product | null>(null);

  useEffect(() => {
    if (!selectedEnquiryProductId) {
      setProduct(null);
      setSubmittedMessage(false);
      return;
    }

    async function load() {
      try {
        const prod = await api.getProductById(selectedEnquiryProductId!);
        setProduct(prod);
      } catch (e) {
        console.error(e);
      }
    }
    load();
  }, [selectedEnquiryProductId]);

  if (!selectedEnquiryProductId || !product) return null;

  // Shareable enquiry link
  const enquiryUrl = `${window.location.origin}?enquire=${encodeURIComponent(product.id)}&sellerId=${encodeURIComponent(product.sellerId || '')}`;

  const handleCopy = () => {
    navigator.clipboard.writeText(enquiryUrl);
    setCopiedLink(true);
    showToast('Product Enquiry Link Copied!', 'success');
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const handleSubmitEnquiry = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!question.trim() || loading) return;

    setLoading(true);
    try {
      const created = await api.createEnquiry({
        productId: product.id,
        productName: product.name,
        sellerId: product.sellerId,
        customerName,
        customerPhone,
        customerEmail,
        question,
      });

      setSubmittedEnquiryId(created?.id);
      setSubmittedMessage(true);
      showToast('Enquiry successfully delivered to seller!', 'success');
    } catch (err: any) {
      showToast(`Failed to send enquiry: ${err.message}`, 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in">
      <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-4 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold">
              <MessageSquare className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-extrabold text-slate-900 text-sm">Product Enquiry</h3>
              <p className="text-[11px] text-slate-400">Send a direct message to the seller</p>
            </div>
          </div>
          <button
            onClick={closeEnquiryModal}
            className="text-slate-400 hover:text-slate-600 font-bold text-sm cursor-pointer"
          >
            ✕
          </button>
        </div>

        {/* Product Summary Header */}
        <div className="p-3 bg-slate-50 border border-slate-200/80 rounded-2xl flex items-center gap-3">
          <img
            src={product.images[0] || 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=200&q=80'}
            alt={product.name}
            className="w-12 h-12 rounded-xl object-cover border border-slate-200"
          />
          <div className="flex-1 min-w-0">
            <h4 className="font-extrabold text-slate-900 text-xs truncate">{product.name}</h4>
            <div className="flex items-center gap-2 text-[11px] text-slate-500 mt-0.5">
              <span className="font-bold text-indigo-700">₹{product.price.toLocaleString('en-IN')}</span>
              <span>•</span>
              <span className="truncate">Seller: {product.sellerName || 'Verified Merchant'}</span>
            </div>
          </div>
        </div>

        {/* Shareable Enquiry Link Bar */}
        <div className="p-3 bg-indigo-50/70 border border-indigo-100 rounded-xl space-y-1.5">
          <div className="flex items-center justify-between text-[11px]">
            <span className="font-bold text-indigo-900">Shareable Product Link:</span>
            <span className="text-[10px] text-indigo-600">Preserves Seller ID</span>
          </div>
          <div className="flex items-center gap-2 bg-white p-1.5 rounded-lg border border-indigo-200">
            <input
              type="text"
              readOnly
              value={enquiryUrl}
              className="flex-1 text-[11px] font-mono text-slate-600 outline-none truncate bg-transparent"
            />
            <button
              onClick={handleCopy}
              className="px-2.5 py-1 bg-indigo-600 hover:bg-indigo-700 text-white rounded-md text-[11px] font-bold flex items-center gap-1 cursor-pointer"
            >
              {copiedLink ? <Check className="w-3 h-3 text-emerald-300" /> : <Copy className="w-3 h-3" />}
              <span>{copiedLink ? 'Copied' : 'Copy'}</span>
            </button>
          </div>
        </div>

        {/* Form Body or Success Confirmation */}
        {submittedMessage ? (
          <div className="p-6 bg-emerald-50 border border-emerald-200 rounded-2xl text-center space-y-3">
            <CheckCircle2 className="w-10 h-10 text-emerald-600 mx-auto" />
            <h4 className="font-extrabold text-slate-900 text-base">Enquiry Sent to Seller!</h4>
            <p className="text-xs text-slate-600 leading-relaxed max-w-sm mx-auto">
              Your inquiry has been logged in the merchant's seller dashboard. The seller will review your question and follow up directly.
            </p>

            <div className="p-3 bg-white/80 rounded-xl border border-emerald-100 text-[11px] text-slate-600">
              Need immediate answers? Speak directly with our voice assistant in English, Hindi, or Kannada.
            </div>

            {/* AI Website Voice Assistant Button */}
            <div className="pt-1">
              <button
                type="button"
                onClick={() => setIsVoiceAssistantOpen(true)}
                className="w-full py-3 px-4 bg-gradient-to-r from-indigo-600 via-indigo-700 to-violet-700 hover:from-indigo-500 hover:to-violet-600 text-white font-extrabold text-xs sm:text-sm rounded-2xl shadow-lg shadow-indigo-500/25 flex items-center justify-center gap-2.5 transition-all transform hover:-translate-y-0.5 cursor-pointer"
              >
                <Sparkles className="w-4 h-4 text-indigo-200" />
                <span>Talk to Our AI Shopping Assistant</span>
              </button>
            </div>

            <div className="pt-2 flex justify-center gap-2">
              <button
                onClick={() => {
                  addToCart(product, 1);
                  closeEnquiryModal();
                  setActiveTab('cart');
                }}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl flex items-center gap-1.5 cursor-pointer shadow-md"
              >
                <ShoppingBag className="w-3.5 h-3.5" />
                <span>Add to Cart & Checkout</span>
              </button>

              <button
                onClick={closeEnquiryModal}
                className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 text-xs font-bold rounded-xl cursor-pointer"
              >
                Close Window
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmitEnquiry} className="space-y-3">
            <div>
              <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">Your Full Name:</label>
              <input
                type="text"
                required
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                placeholder="e.g. Chandan Kumar"
                className="w-full bg-slate-50 border border-slate-300 text-xs text-slate-900 p-2.5 rounded-xl focus:border-indigo-500 focus:outline-none"
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">Phone Number:</label>
                <input
                  type="tel"
                  required
                  value={customerPhone}
                  onChange={(e) => setCustomerPhone(e.target.value)}
                  placeholder="+91 98450 12345"
                  className="w-full bg-slate-50 border border-slate-300 text-xs text-slate-900 p-2.5 rounded-xl focus:border-indigo-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">Email Address:</label>
                <input
                  type="email"
                  required
                  value={customerEmail}
                  onChange={(e) => setCustomerEmail(e.target.value)}
                  placeholder="yourname@gmail.com"
                  className="w-full bg-slate-50 border border-slate-300 text-xs text-slate-900 p-2.5 rounded-xl focus:border-indigo-500 focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                Your Question / Requirement for Seller:
              </label>
              <textarea
                required
                rows={3}
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
                placeholder={`Ask about availability, specifications, dosage, bulk order discount, or delivery time for ${product.name}...`}
                className="w-full bg-slate-50 border border-slate-300 text-xs text-slate-900 p-2.5 rounded-xl focus:border-indigo-500 focus:outline-none"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-300 text-white font-extrabold text-xs rounded-xl shadow-md flex items-center justify-center gap-2 cursor-pointer transition-all"
            >
              {loading ? (
                <span>Submitting Enquiry...</span>
              ) : (
                <>
                  <Send className="w-3.5 h-3.5" />
                  <span>Submit Product Enquiry to Seller</span>
                </>
              )}
            </button>
          </form>
        )}

        {/* Reusable Voice Assistant Modal */}
        <VoiceAssistantModal
          isOpen={isVoiceAssistantOpen}
          onClose={() => setIsVoiceAssistantOpen(false)}
          context={{
            enquiryId: submittedEnquiryId,
            productId: product.id,
            productName: product.name,
            productDetails: {
              name: product.name,
              brand: product.brand,
              price: product.price,
              mrp: product.mrp,
              category: product.category,
              inStock: (product.stock?.available ?? 0) > 0,
              availableStock: product.stock?.available ?? 0,
              express30Min: Boolean(product.deliveryConfig?.supportsExpress30Min),
              kannadaName: product.kannadaName || '',
              description: product.description || product.shortDescription || '',
            },
            customerName,
            customerPhone,
          }}
        />
      </div>
    </div>
  );
};
