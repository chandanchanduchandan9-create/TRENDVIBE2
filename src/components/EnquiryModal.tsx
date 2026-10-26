import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext.tsx';
import { api } from '../services/api.ts';
import { Product } from '../types/index.ts';
import {
  MessageSquare,
  Sparkles,
  Send,
  Copy,
  Check,
  CheckCircle2,
  HelpCircle,
} from 'lucide-react';

export const EnquiryModal: React.FC = () => {
  const {
    selectedEnquiryProductId,
    closeEnquiryModal,
    user,
    showToast,
    startCallingZyro,
  } = useApp();

  const [product, setProduct] = useState<Product | null>(null);
  const [question, setQuestion] = useState('');
  const [loading, setLoading] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [submittedMessage, setSubmittedMessage] = useState(false);

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

  const enquiryUrl = `${window.location.origin}?enquire=${product.id}`;

  const handleCopy = () => {
    navigator.clipboard.writeText(enquiryUrl);
    setCopiedLink(true);
    showToast('Enquiry Link Copied!', 'success');
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const handleSubmitEnquiry = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!question.trim() || loading) return;

    setLoading(true);
    try {
      await api.createEnquiry({
        productId: product.id,
        productName: product.name,
        sellerId: product.sellerId,
        text: question,
      });

      setSubmittedMessage(true);
      showToast('Enquiry delivered to seller & Zyro AI assistant!', 'success');
    } catch (err: any) {
      showToast(`Failed to send enquiry: ${err.message}`, 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in">
      <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold">
              <MessageSquare className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-extrabold text-slate-900 text-sm">Product Enquiry Hub</h3>
              <p className="text-[11px] text-slate-400">Verified seller communication & AI answering</p>
            </div>
          </div>
          <button
            onClick={closeEnquiryModal}
            className="text-slate-400 hover:text-slate-600 font-bold text-sm cursor-pointer"
          >
            ✕
          </button>
        </div>

        {/* Product Card Snippet */}
        <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200/80 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 truncate">
            <img
              src={product.images[0]}
              alt={product.name}
              className="w-12 h-12 rounded-xl object-cover bg-white shrink-0 border border-slate-200"
            />
            <div className="truncate">
              <div className="font-bold text-xs text-slate-900 truncate">{product.name}</div>
              <div className="text-[10px] text-slate-500 font-semibold">
                ₹{product.price} • In Stock: {product.stock.available}
              </div>
            </div>
          </div>
          <button
            onClick={handleCopy}
            className="shrink-0 p-2 text-slate-500 hover:text-indigo-600 bg-white rounded-xl border border-slate-200 hover:border-indigo-300 transition-colors cursor-pointer"
            title="Copy Enquiry Link"
          >
            {copiedLink ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
          </button>
        </div>

        {/* Instant Answer via Zyro AI Option */}
        <div className="p-3 bg-indigo-50/70 rounded-2xl border border-indigo-100 flex items-center justify-between gap-2">
          <div className="text-xs text-indigo-900">
            <span className="font-bold block">Need an instant answer?</span>
            <span className="text-[11px] text-indigo-700">
              Zyro AI has access to manufacturer documents and stock rules.
            </span>
          </div>
          <button
            onClick={() => {
              closeEnquiryModal();
              startCallingZyro(product);
            }}
            className="shrink-0 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded-xl shadow-xs transition-colors flex items-center gap-1 cursor-pointer"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Ask Zyro AI</span>
          </button>
        </div>

        {/* Message Form or Success State */}
        {submittedMessage ? (
          <div className="py-6 text-center space-y-2">
            <CheckCircle2 className="w-12 h-12 text-emerald-600 mx-auto" />
            <h4 className="font-bold text-slate-900 text-sm">Enquiry Successfully Dispatched!</h4>
            <p className="text-xs text-slate-500 max-w-xs mx-auto">
              The seller and Zyro AI have received your question. You can follow updates in your customer account.
            </p>
            <button
              onClick={closeEnquiryModal}
              className="mt-2 px-5 py-2 bg-slate-900 text-white text-xs font-bold rounded-xl cursor-pointer"
            >
              Close
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmitEnquiry} className="space-y-3 text-xs">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Your Question for {product.sellerName}
              </label>
              <textarea
                rows={3}
                required
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
                placeholder="Ask about batch expiry, express delivery feasibility, size recommendations, bulk pricing..."
                className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-slate-900 font-medium focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={closeEnquiryModal}
                className="px-4 py-2 border border-slate-200 rounded-xl font-bold text-slate-600 hover:bg-slate-100 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading || !question.trim()}
                className="px-5 py-2 bg-slate-900 hover:bg-slate-800 disabled:opacity-50 text-white font-bold rounded-xl shadow-md transition-colors flex items-center gap-1.5 cursor-pointer"
              >
                <Send className="w-3.5 h-3.5" />
                <span>Submit Question</span>
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
