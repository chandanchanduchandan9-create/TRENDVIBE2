import React, { useState, useRef, useEffect } from 'react';
import { useApp } from '../context/AppContext.tsx';
import { api } from '../services/api.ts';
import {
  Sparkles,
  Send,
  PhoneCall,
  FileText,
  CheckCircle2,
  MapPin,
  ShieldCheck,
  Bot,
  User as UserIcon,
  ShoppingBag,
  Zap,
} from 'lucide-react';
import confetti from 'canvas-confetti';

interface ChatMessage {
  id: string;
  sender: 'user' | 'zyro_ai';
  text: string;
  kannadaText?: string;
  citations?: string[];
  orderProposal?: any;
  productContext?: any;
  timestamp: string;
}

export const AIShoppingView: React.FC = () => {
  const { user, startCallingZyro, showToast, setActiveTab, openProduct } = useApp();

  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome',
      sender: 'zyro_ai',
      text: "Namaskara! I am Zyro AI, your bilingual intelligent shopping assistant at TrendVibe Store. I can help you verify certified medicines (like Dolo 650 & Electral), explore high-protein foods, compare laptops, check 30-minute hyper-local delivery in Bangalore, or even place an order directly via conversational voice/chat in English or ಕನ್ನಡ (Kannada). How can I assist you today?",
      kannadaText: "ನಮಸ್ಕಾರ! ನಾನು ಟ್ರೆಂಡ್‌ವೈಬ್ ಸ್ಟೋರ್‌ನ ಜೈರೋ AI ಶಾಪಿಂಗ್ ಅಸಿಸ್ಟೆಂಟ್. ಔಷಧಿಗಳು, ಲ್ಯಾಪ್‌ಟಾಪ್‌ಗಳು, ಆಹಾರ ಪದಾರ್ಥಗಳು ಮತ್ತು 30 ನಿಮಿಷಗಳ ಎಕ್ಸ್‌ಪ್ರೆಸ್ ಡೆಲಿವರಿ ಬಗ್ಗೆ ನಿಮಗೆ ಕನ್ನಡದಲ್ಲಿ ಸಹಾಯ ಮಾಡಲು ನಾನು ಸಿದ್ಧನಿದ್ದೇನೆ.",
      citations: ['TrendVibe Store Catalogue & Verified Seller Knowledge Base'],
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    },
  ]);

  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [selectedLanguage, setSelectedLanguage] = useState<'auto' | 'en' | 'kn'>('auto');
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  const handleSend = async (textToSend?: string) => {
    const q = (textToSend || input).trim();
    if (!q || loading) return;

    setInput('');
    const userMsg: ChatMessage = {
      id: `usr-${Date.now()}`,
      sender: 'user',
      text: q,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMsg]);
    setLoading(true);

    try {
      const res = await api.chatWithZyro({
        message: q,
        language: selectedLanguage,
      });

      const aiMsg: ChatMessage = {
        id: `ai-${Date.now()}`,
        sender: 'zyro_ai',
        text: res.reply,
        kannadaText: res.kannadaReply,
        citations: res.citations,
        orderProposal: res.orderProposal,
        productContext: res.productContext,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };

      setMessages((prev) => [...prev, aiMsg]);
    } catch (err: any) {
      showToast(`Error from Zyro AI: ${err.message}`, 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmOrder = async (proposal: any) => {
    try {
      const primaryAddress = user?.addresses?.[0] || {
        street: 'Flat 402, Green Glen Heights, Bellandur ORR',
        city: 'Bangalore',
        state: 'Karnataka',
        pincode: proposal.pincode || '560103',
        phone: user?.phone || '+91 98450 12345',
      };

      const newOrder = await api.checkout({
        items: [{ productId: proposal.productId, quantity: proposal.quantity }],
        shippingAddress: primaryAddress,
        paymentMethod: proposal.paymentMethod || 'COD',
        isExpress30Min: proposal.isExpress30Min,
        aiAssisted: true,
        aiConversationSummary: `Confirmed via Zyro AI Dedicated Shopping Page dialogue`,
      });

      confetti({ particleCount: 70, spread: 50 });
      showToast(`Order #${newOrder.orderNumber} successfully booked!`, 'success');

      setMessages((prev) => [
        ...prev,
        {
          id: `order-ok-${Date.now()}`,
          sender: 'zyro_ai',
          text: `🎉 Order #${newOrder.orderNumber} is confirmed! Total ₹${newOrder.totalAmount} payable via ${newOrder.paymentMethod}. ${
            newOrder.isExpress30Min
              ? '⚡ Our express rider will reach you in approximately 25-30 minutes.'
              : 'Dispatched with tracked courier standard delivery.'
          }`,
          kannadaText: `🎉 ನಿಮ್ಮ ಆರ್ಡರ್ #${newOrder.orderNumber} ಯಶಸ್ವಿಯಾಗಿ ದೃಢಪಟ್ಟಿದೆ! ಒಟ್ಟು ಮೊತ್ತ ₹${newOrder.totalAmount}.`,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        },
      ]);
    } catch (err: any) {
      showToast(`Order booking failed: ${err.message}`, 'error');
    }
  };

  return (
    <div className="max-w-5xl mx-auto px-4 py-8 animate-in fade-in">
      {/* Top AI Calling Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 rounded-3xl p-6 text-white mb-6 shadow-xl border border-indigo-900/40 flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="space-y-2 text-center md:text-left">
          <div className="inline-flex items-center gap-2 bg-indigo-500/20 text-indigo-300 text-xs font-bold px-3 py-1 rounded-full border border-indigo-400/30">
            <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
            <span>Zyro AI 24/7 Intelligent Shopping & Calling Agent</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            Conversational Shopping in English & ಕನ್ನಡ
          </h1>
          <p className="text-slate-300 text-xs sm:text-sm max-w-xl leading-relaxed">
            Query manufacturer specifications, verify medicine dosages, ask about RAG-indexed PDF manuals, or order with 30-minute express delivery using voice or text.
          </p>
        </div>

        <button
          onClick={() => startCallingZyro()}
          className="shrink-0 px-6 py-3.5 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-extrabold text-sm rounded-2xl shadow-lg shadow-emerald-500/20 flex items-center gap-2.5 transition-all transform hover:scale-105 cursor-pointer"
        >
          <PhoneCall className="w-4 h-4 animate-bounce" />
          <span>Launch AI Voice Call</span>
        </button>
      </div>

      {/* Main Chat Interface Card */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-xl overflow-hidden flex flex-col h-[650px]">
        {/* Chat Header */}
        <div className="px-6 py-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-indigo-600 text-white flex items-center justify-center font-bold shadow-md shadow-indigo-600/20">
              <Bot className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-slate-900 text-sm">Zyro AI Assistant</h3>
                <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                <span className="text-[11px] text-emerald-600 font-semibold">Online & Grounded</span>
              </div>
              <p className="text-[11px] text-slate-500">Powered by Gemini 3.8 Flash + RAG Knowledge Base</p>
            </div>
          </div>

          {/* Language Selector */}
          <div className="flex items-center gap-1 bg-slate-200/80 p-1 rounded-xl text-xs font-semibold">
            <button
              onClick={() => setSelectedLanguage('auto')}
              className={`px-2.5 py-1 rounded-lg transition-colors cursor-pointer ${
                selectedLanguage === 'auto' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600'
              }`}
            >
              Auto Detect
            </button>
            <button
              onClick={() => setSelectedLanguage('en')}
              className={`px-2.5 py-1 rounded-lg transition-colors cursor-pointer ${
                selectedLanguage === 'en' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600'
              }`}
            >
              English
            </button>
            <button
              onClick={() => setSelectedLanguage('kn')}
              className={`px-2.5 py-1 rounded-lg transition-colors cursor-pointer font-['Noto_Sans_Kannada',sans-serif] ${
                selectedLanguage === 'kn' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600'
              }`}
            >
              ಕನ್ನಡ
            </button>
          </div>
        </div>

        {/* Message Stream */}
        <div className="flex-1 overflow-y-auto p-6 space-y-5 bg-slate-50/50">
          {messages.map((m) => {
            const isAi = m.sender === 'zyro_ai';
            return (
              <div key={m.id} className={`flex gap-3 ${isAi ? 'items-start' : 'items-start flex-row-reverse'}`}>
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 text-white text-xs ${
                    isAi ? 'bg-indigo-600' : 'bg-slate-900'
                  }`}
                >
                  {isAi ? <Bot className="w-4 h-4" /> : <UserIcon className="w-4 h-4" />}
                </div>

                <div className={`space-y-1.5 max-w-[85%] ${isAi ? 'text-left' : 'text-right'}`}>
                  <div
                    className={`rounded-2xl p-4 text-sm leading-relaxed ${
                      isAi
                        ? 'bg-white text-slate-800 border border-slate-200/80 shadow-xs'
                        : 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20'
                    }`}
                  >
                    <p className="whitespace-pre-wrap">{m.text}</p>

                    {/* Kannada Script Translation */}
                    {m.kannadaText && m.kannadaText !== m.text && (
                      <div className="mt-2.5 pt-2 border-t border-slate-100 text-xs text-indigo-950 font-medium font-['Noto_Sans_Kannada',sans-serif] bg-amber-50/50 p-2.5 rounded-xl border border-amber-200/60">
                        <span className="text-[10px] font-bold text-amber-800 uppercase block mb-0.5">
                          ಕನ್ನಡ ವಿವರಣೆ (Kannada Response):
                        </span>
                        {m.kannadaText}
                      </div>
                    )}

                    {/* Citations from seller uploaded documents / verified sources */}
                    {m.citations && m.citations.length > 0 && (
                      <div className="mt-3 pt-2 border-t border-slate-100 flex flex-wrap gap-1.5 items-center">
                        <span className="text-[10px] text-slate-400 font-bold flex items-center gap-1">
                          <FileText className="w-3 h-3 text-indigo-500" />
                          Document Citation:
                        </span>
                        {m.citations.map((cite, i) => (
                          <span
                            key={i}
                            className="text-[10px] bg-slate-100 text-slate-700 px-2 py-0.5 rounded font-mono font-medium"
                          >
                            {cite}
                          </span>
                        ))}
                      </div>
                    )}

                    {/* Interactive Order Proposal Card */}
                    {m.orderProposal && (
                      <div className="mt-3 p-3.5 bg-slate-900 text-white rounded-2xl border border-indigo-400/30 space-y-2.5 text-xs text-left shadow-lg">
                        <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                          <span className="font-extrabold text-emerald-400 flex items-center gap-1.5">
                            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                            Readback Order Proposal
                          </span>
                          {m.orderProposal.isExpress30Min && (
                            <span className="bg-emerald-500/20 text-emerald-300 text-[10px] font-bold px-2 py-0.5 rounded-full border border-emerald-500/30">
                              ⚡ 30-Min Delivery
                            </span>
                          )}
                        </div>

                        <div className="space-y-1 text-slate-300">
                          <div className="flex justify-between">
                            <span className="text-slate-400">Product:</span>
                            <span className="font-bold text-white">{m.orderProposal.productName}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-slate-400">Quantity & Price:</span>
                            <span>
                              {m.orderProposal.quantity} × ₹{m.orderProposal.unitPrice} = ₹{m.orderProposal.subtotal}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-slate-400">Taxes & Delivery Fee:</span>
                            <span>
                              ₹{m.orderProposal.tax} (Tax) + ₹{m.orderProposal.shippingFee} (Shipping)
                            </span>
                          </div>
                          <div className="flex justify-between border-t border-slate-800 pt-1.5 font-bold text-sm">
                            <span className="text-slate-200">Total Payable:</span>
                            <span className="text-emerald-400">₹{m.orderProposal.totalAmount}</span>
                          </div>
                          <div className="text-[11px] text-slate-400 flex items-center gap-1 pt-1">
                            <MapPin className="w-3.5 h-3.5 text-indigo-400" />
                            <span>Destination: Bangalore {m.orderProposal.pincode || '560103'}</span>
                          </div>
                        </div>

                        <button
                          onClick={() => handleConfirmOrder(m.orderProposal)}
                          className="w-full py-2.5 px-4 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-extrabold rounded-xl transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer"
                        >
                          <ShieldCheck className="w-4 h-4" />
                          <span>Authorize & Place Order</span>
                        </button>
                      </div>
                    )}
                  </div>

                  <span className="text-[10px] text-slate-400 px-2">{m.timestamp}</span>
                </div>
              </div>
            );
          })}

          {loading && (
            <div className="flex items-center gap-2 text-indigo-600 text-xs px-2 animate-pulse">
              <Sparkles className="w-4 h-4 animate-spin" />
              <span>Zyro AI is querying catalogue, PDF documents & inventory...</span>
            </div>
          )}
          <div ref={chatEndRef} />
        </div>

        {/* Quick Suggestion Chips */}
        <div className="p-3 bg-white border-t border-slate-200 flex items-center gap-2 overflow-x-auto scrollbar-none text-xs">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider shrink-0">Try asking:</span>
          <button
            onClick={() => handleSend('Check 30-minute express delivery eligibility for Bangalore 560103')}
            className="shrink-0 bg-slate-100 hover:bg-slate-200 text-slate-700 px-3 py-1.5 rounded-xl border border-slate-200 transition-colors cursor-pointer"
          >
            ⚡ Express Pincode Check
          </button>
          <button
            onClick={() => handleSend('ವೈರಲ್ ಜ್ವರಕ್ಕೆ ಡೋಲೋ 650 ಮಾತ್ರೆಯನ್ನು ಹೇಗೆ ತೆಗೆದುಕೊಳ್ಳಬೇಕು?')}
            className="shrink-0 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 px-3 py-1.5 rounded-xl border border-indigo-200 transition-colors cursor-pointer font-['Noto_Sans_Kannada',sans-serif]"
          >
            ಡೋಲೋ 650 ಪ್ರಮಾಣ (Dolo Dosage)
          </button>
          <button
            onClick={() => handleSend('Compare ASUS TUF Gaming F15 with Dell Inspiron 15')}
            className="shrink-0 bg-slate-100 hover:bg-slate-200 text-slate-700 px-3 py-1.5 rounded-xl border border-slate-200 transition-colors cursor-pointer"
          >
            💻 Compare Laptops
          </button>
          <button
            onClick={() => handleSend('Order 2 Dolo 650 Tablets to Bangalore 560103')}
            className="shrink-0 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 px-3 py-1.5 rounded-xl border border-emerald-200 transition-colors cursor-pointer font-semibold"
          >
            🛒 Order Dolo 650 via AI
          </button>
        </div>

        {/* Chat Input */}
        <div className="p-4 bg-slate-50 border-t border-slate-200">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSend();
            }}
            className="flex items-center gap-3"
          >
            <input
              type="text"
              placeholder="Ask anything about medicines, laptops, organic food in English or ಕನ್ನಡ..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              disabled={loading}
              className="flex-1 bg-white text-slate-900 placeholder:text-slate-400 text-sm px-4 py-3 rounded-2xl border border-slate-300 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
            />
            <button
              type="submit"
              disabled={!input.trim() || loading}
              className="p-3 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-40 text-white rounded-2xl transition-all shadow-md cursor-pointer"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
