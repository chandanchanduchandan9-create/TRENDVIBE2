import React, { useState, useEffect, useRef } from 'react';
import { useApp } from '../context/AppContext.tsx';
import { api } from '../services/api.ts';
import {
  Phone,
  PhoneOff,
  Mic,
  MicOff,
  Volume2,
  VolumeX,
  Sparkles,
  Send,
  FileText,
  CheckCircle2,
  Clock,
  MapPin,
  ShieldCheck,
  AlertCircle,
} from 'lucide-react';
import confetti from 'canvas-confetti';

interface TranscriptItem {
  id: string;
  sender: 'customer' | 'zyro_ai';
  text: string;
  kannadaText?: string;
  citations?: string[];
  orderProposal?: any;
}

export const ZyroCallingModal: React.FC = () => {
  const {
    isCallingOpen,
    endCallingZyro,
    activeCallingProduct,
    user,
    showToast,
    setActiveTab,
  } = useApp();

  const [callStatus, setCallStatus] = useState<'connecting' | 'active' | 'ended'>('connecting');
  const [callDuration, setCallDuration] = useState(0);
  const [isMuted, setIsMuted] = useState(false);
  const [isSpeakerOn, setIsSpeakerOn] = useState(true);
  const [inputText, setInputText] = useState('');
  const [isAiThinking, setIsAiThinking] = useState(false);
  const [selectedLanguage, setSelectedLanguage] = useState<'auto' | 'en' | 'kn'>('auto');

  const [transcript, setTranscript] = useState<TranscriptItem[]>([]);
  const transcriptEndRef = useRef<HTMLDivElement>(null);

  // Initialize call timer and greeting
  useEffect(() => {
    if (!isCallingOpen) return;

    setCallStatus('connecting');
    setCallDuration(0);

    const connectTimer = setTimeout(() => {
      setCallStatus('active');

      const greetingText = activeCallingProduct
        ? `Namaskara! I am Zyro AI, calling from TrendVibe Store regarding ${activeCallingProduct.name}. How can I assist you with this product today?`
        : `Namaskara! Welcome to TrendVibe Store AI Voice Hub. I can assist you in English or ಕನ್ನಡ (Kannada) with 30-minute express deliveries, medicine dosages, tech specs, or instant orders. What would you like to explore?`;

      const greetingKannada = activeCallingProduct
        ? `ನಮಸ್ಕಾರ! ನಾನು ಟ್ರೆಂಡ್‌ವೈಬ್ ಸ್ಟೋರ್‌ನಿಂದ ಜೈರೋ AI. ${activeCallingProduct.kannadaName || activeCallingProduct.name} ಕುರಿತು ನಿಮಗೆ ಹೇಗೆ ಸಹಾಯ ಮಾಡಬಹುದು?`
        : `ನಮಸ್ಕಾರ! ಟ್ರೆಂಡ್‌ವೈಬ್ ಸ್ಟೋರ್ AI ಕರೆಗೆ ಸ್ವಾಗತ. ಕನ್ನಡ ಮತ್ತು ಇಂಗ್ಲಿಷ್‌ನಲ್ಲಿ ನಿಮಗೆ ಸಹಾಯ ಮಾಡಲು ನಾನು ಸಿದ್ಧನಿದ್ದೇನೆ.`;

      const initialItem: TranscriptItem = {
        id: `t-${Date.now()}`,
        sender: 'zyro_ai',
        text: greetingText,
        kannadaText: greetingKannada,
      };

      setTranscript([initialItem]);
      speakOutLoud(greetingText, greetingKannada);
    }, 1200);

    return () => clearTimeout(connectTimer);
  }, [isCallingOpen, activeCallingProduct]);

  // Duration counter
  useEffect(() => {
    if (callStatus !== 'active') return;
    const interval = setInterval(() => {
      setCallDuration((prev) => prev + 1);
    }, 1000);
    return () => clearInterval(interval);
  }, [callStatus]);

  // Auto-scroll transcript
  useEffect(() => {
    transcriptEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [transcript, isAiThinking]);

  // Text-to-Speech function
  const speakOutLoud = (englishText: string, kannadaText?: string) => {
    if (!isSpeakerOn || !window.speechSynthesis) return;

    window.speechSynthesis.cancel();
    const textToSpeak = selectedLanguage === 'kn' && kannadaText ? kannadaText : englishText;
    const utterance = new SpeechSynthesisUtterance(textToSpeak);
    utterance.rate = 1.0;
    utterance.pitch = 1.0;

    // Pick appropriate voice
    const voices = window.speechSynthesis.getVoices();
    if (selectedLanguage === 'kn') {
      const knVoice = voices.find((v) => v.lang.startsWith('kn') || v.lang.includes('IN'));
      if (knVoice) utterance.voice = knVoice;
    } else {
      const inVoice = voices.find((v) => v.lang.includes('en-IN') || v.lang.includes('en-GB') || v.lang.includes('en-US'));
      if (inVoice) utterance.voice = inVoice;
    }

    window.speechSynthesis.speak(utterance);
  };

  const handleSendMessage = async (msgOverride?: string) => {
    const textToSend = msgOverride || inputText;
    if (!textToSend.trim() || isAiThinking) return;

    setInputText('');
    const customerMsg: TranscriptItem = {
      id: `cust-${Date.now()}`,
      sender: 'customer',
      text: textToSend,
    };
    setTranscript((prev) => [...prev, customerMsg]);
    setIsAiThinking(true);

    try {
      const res = await api.chatWithZyro({
        message: textToSend,
        productId: activeCallingProduct?.id,
        language: selectedLanguage,
        isCallingSession: true,
      });

      const aiMsg: TranscriptItem = {
        id: `ai-${Date.now()}`,
        sender: 'zyro_ai',
        text: res.reply,
        kannadaText: res.kannadaReply,
        citations: res.citations,
        orderProposal: res.orderProposal,
      };

      setTranscript((prev) => [...prev, aiMsg]);
      speakOutLoud(res.reply, res.kannadaReply);
    } catch (err: any) {
      console.error('Call speech error:', err);
      const errorMsg: TranscriptItem = {
        id: `err-${Date.now()}`,
        sender: 'zyro_ai',
        text: 'I apologize, my audio connection had a brief flutter. Could you please repeat that?',
        kannadaText: 'ಕ್ಷಮಿಸಿ, ಧ್ವನಿ ಸಂಪರ್ಕದಲ್ಲಿ ತೊಂದರೆ ಉಂಟಾಗಿದೆ. ದಯವಿಟ್ಟು ಮತ್ತೊಮ್ಮೆ ಹೇಳಬಹುದೇ?',
      };
      setTranscript((prev) => [...prev, errorMsg]);
    } finally {
      setIsAiThinking(false);
    }
  };

  const handleConfirmOrderFromCall = async (proposal: any) => {
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
        aiConversationSummary: `Confirmed via Zyro AI Calling Agent session (${formatTime(callDuration)})`,
      });

      confetti({ particleCount: 80, spread: 60, origin: { y: 0.6 } });
      showToast(`Order #${newOrder.orderNumber} successfully placed via Zyro AI!`, 'success');

      const confirmSpeech = `Wonderful! Your order number ${newOrder.orderNumber} for ${proposal.quantity} unit of ${proposal.productName} has been confirmed. ${
        proposal.isExpress30Min ? 'Our express rider will deliver it in 30 minutes.' : 'It will be dispatched today.'
      } You can track the live delivery in your orders dashboard.`;

      const confirmKannada = `ಅತ್ಯುತ್ತಮ! ನಿಮ್ಮ ಆರ್ಡರ್ ${newOrder.orderNumber} ದೃಢಪಟ್ಟಿದೆ. ${
        proposal.isExpress30Min ? 'ನಮ್ಮ ಎಕ್ಸ್‌ಪ್ರೆಸ್ ರೈಡರ್ 30 ನಿಮಿಷಗಳಲ್ಲಿ ತಲುಪಿಸುತ್ತಾರೆ.' : 'ಇಂದು ರವಾನೆಯಾಗಲಿದೆ.'
      }`;

      setTranscript((prev) => [
        ...prev,
        {
          id: `order-ok-${Date.now()}`,
          sender: 'zyro_ai',
          text: confirmSpeech,
          kannadaText: confirmKannada,
        },
      ]);

      speakOutLoud(confirmSpeech, confirmKannada);
    } catch (err: any) {
      showToast(`Order failed: ${err.message}`, 'error');
    }
  };

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60)
      .toString()
      .padStart(2, '0');
    const s = (secs % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  if (!isCallingOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in">
      <div className="w-full max-w-xl bg-slate-900 border border-slate-700/80 rounded-3xl shadow-2xl flex flex-col overflow-hidden max-h-[92vh]">
        {/* Call Header */}
        <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 p-4 border-b border-slate-800 flex items-center justify-between text-white">
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-indigo-500 to-violet-500 flex items-center justify-center text-white shadow-lg shadow-indigo-500/30">
                <Sparkles className="w-6 h-6 animate-spin-slow" />
              </div>
              {callStatus === 'active' && (
                <span className="absolute -bottom-1 -right-1 w-3.5 h-3.5 rounded-full bg-emerald-500 border-2 border-slate-900"></span>
              )}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-base tracking-tight">Zyro AI Voice Agent</h3>
                <span className="bg-emerald-500/20 text-emerald-300 text-[10px] font-semibold px-2 py-0.5 rounded-full border border-emerald-500/30">
                  Bilingual EN / KN
                </span>
              </div>
              <p className="text-xs text-slate-400 flex items-center gap-1.5 mt-0.5">
                {callStatus === 'connecting' && <span className="text-amber-400">Connecting to TrendVibe Voice Hub...</span>}
                {callStatus === 'active' && (
                  <>
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                    <span className="text-emerald-400 font-mono font-medium">
                      Call Active • {formatTime(callDuration)}
                    </span>
                  </>
                )}
              </p>
            </div>
          </div>

          {/* Language Preference */}
          <div className="flex items-center gap-1 bg-slate-800/80 p-1 rounded-xl border border-slate-700 text-xs">
            <button
              onClick={() => setSelectedLanguage('auto')}
              className={`px-2 py-1 rounded-lg font-medium transition-colors cursor-pointer ${
                selectedLanguage === 'auto' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'
              }`}
            >
              Auto
            </button>
            <button
              onClick={() => setSelectedLanguage('en')}
              className={`px-2 py-1 rounded-lg font-medium transition-colors cursor-pointer ${
                selectedLanguage === 'en' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'
              }`}
            >
              English
            </button>
            <button
              onClick={() => setSelectedLanguage('kn')}
              className={`px-2 py-1 rounded-lg font-medium transition-colors cursor-pointer ${
                selectedLanguage === 'kn' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'
              }`}
            >
              ಕನ್ನಡ
            </button>
          </div>
        </div>

        {/* Product In Focus Pill (if opened from product card) */}
        {activeCallingProduct && (
          <div className="bg-slate-800/60 px-4 py-2 border-b border-slate-800/80 flex items-center justify-between text-xs text-slate-300">
            <div className="flex items-center gap-2 truncate">
              <span className="text-indigo-400 font-semibold">Active Product Context:</span>
              <span className="truncate text-white font-medium">{activeCallingProduct.name}</span>
            </div>
            <div className="shrink-0 font-bold text-emerald-400">₹{activeCallingProduct.price}</div>
          </div>
        )}

        {/* Audio Waveform Visualization Bar */}
        <div className="bg-slate-950/60 py-3 px-6 flex items-center justify-center gap-1.5 border-b border-slate-800">
          <div className="text-[11px] text-slate-400 mr-3 flex items-center gap-1.5">
            <Volume2 className="w-3.5 h-3.5 text-indigo-400" />
            <span>AI Voice Stream:</span>
          </div>
          <div className="flex items-center gap-1 h-8">
            <span className="w-1 bg-indigo-500 rounded-full animate-wave-1"></span>
            <span className="w-1 bg-violet-500 rounded-full animate-wave-2"></span>
            <span className="w-1 bg-indigo-400 rounded-full animate-wave-3"></span>
            <span className="w-1 bg-emerald-400 rounded-full animate-wave-4"></span>
            <span className="w-1 bg-violet-400 rounded-full animate-wave-5"></span>
            <span className="w-1 bg-indigo-500 rounded-full animate-wave-2"></span>
            <span className="w-1 bg-violet-500 rounded-full animate-wave-1"></span>
          </div>
        </div>

        {/* Call Transcript Conversation Scroll */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 min-h-[260px] max-h-[380px] bg-slate-900/50">
          {transcript.map((item) => {
            const isZyro = item.sender === 'zyro_ai';
            return (
              <div
                key={item.id}
                className={`flex flex-col ${isZyro ? 'items-start' : 'items-end'}`}
              >
                <div className="text-[10px] text-slate-500 font-medium mb-1 px-1">
                  {isZyro ? 'Zyro AI' : user?.name || 'You'}
                </div>
                <div
                  className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-xs sm:text-sm leading-relaxed ${
                    isZyro
                      ? 'bg-slate-800 text-slate-100 border border-slate-700/80 shadow-md'
                      : 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20'
                  }`}
                >
                  <p>{item.text}</p>

                  {/* Kannada Script Translation if provided */}
                  {item.kannadaText && item.kannadaText !== item.text && (
                    <div className="mt-2 pt-2 border-t border-slate-700/60 text-xs text-amber-200/90 font-medium leading-relaxed font-['Noto_Sans_Kannada',sans-serif]">
                      <span className="text-[10px] uppercase font-bold text-amber-400 block mb-0.5">
                        ಕನ್ನಡ ಪ್ರತಿಲೇಖನ (Kannada Transcript):
                      </span>
                      {item.kannadaText}
                    </div>
                  )}

                  {/* Citations from seller uploaded documents / verified sources */}
                  {item.citations && item.citations.length > 0 && (
                    <div className="mt-2 pt-1.5 border-t border-slate-700/60 flex flex-wrap gap-1.5">
                      <span className="text-[10px] text-slate-400 flex items-center gap-1">
                        <FileText className="w-3 h-3 text-indigo-400" />
                        Verified Source:
                      </span>
                      {item.citations.map((cite, i) => (
                        <span
                          key={i}
                          className="bg-slate-900/80 text-indigo-300 text-[10px] px-2 py-0.5 rounded border border-indigo-500/30"
                        >
                          {cite}
                        </span>
                      ))}
                    </div>
                  )}

                  {/* Interactive Order Proposal Card Embedded In Call */}
                  {item.orderProposal && (
                    <div className="mt-3 p-3 bg-slate-950/90 border border-emerald-500/40 rounded-xl text-slate-200 space-y-2">
                      <div className="flex items-center justify-between border-b border-slate-800 pb-1.5">
                        <span className="text-xs font-bold text-emerald-400 flex items-center gap-1.5">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                          Order Readback Summary
                        </span>
                        {item.orderProposal.isExpress30Min && (
                          <span className="bg-amber-400/20 text-amber-300 text-[10px] font-bold px-1.5 py-0.5 rounded border border-amber-400/30">
                            ⚡ 30-Min Delivery
                          </span>
                        )}
                      </div>
                      <div className="text-xs space-y-1">
                        <div className="flex justify-between">
                          <span className="text-slate-400">Item:</span>
                          <span className="font-semibold text-white">{item.orderProposal.productName}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-400">Qty & Price:</span>
                          <span>
                            {item.orderProposal.quantity} × ₹{item.orderProposal.unitPrice}
                          </span>
                        </div>
                        <div className="flex justify-between border-t border-slate-800 pt-1 font-bold">
                          <span className="text-slate-300">Total Payable:</span>
                          <span className="text-emerald-400 text-sm">₹{item.orderProposal.totalAmount}</span>
                        </div>
                        <div className="text-[11px] text-slate-400 flex items-center gap-1 mt-1">
                          <MapPin className="w-3 h-3 text-indigo-400" />
                          <span>Delivering to Bangalore {item.orderProposal.pincode || '560103'}</span>
                        </div>
                      </div>

                      <button
                        onClick={() => handleConfirmOrderFromCall(item.orderProposal)}
                        className="w-full mt-2 py-2 px-3 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-xs rounded-lg shadow-md transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                      >
                        <ShieldCheck className="w-4 h-4" />
                        <span>Confirm & Place Order Now</span>
                      </button>
                    </div>
                  )}
                </div>
              </div>
            );
          })}

          {isAiThinking && (
            <div className="flex items-center gap-2 text-indigo-400 text-xs px-2 animate-pulse">
              <Sparkles className="w-3.5 h-3.5 animate-spin" />
              <span>Zyro AI is reviewing catalogue & knowledge base...</span>
            </div>
          )}
          <div ref={transcriptEndRef} />
        </div>

        {/* Quick Voice / Prompt Chips */}
        <div className="bg-slate-950/80 px-4 py-2 border-t border-slate-800 overflow-x-auto scrollbar-none flex items-center gap-2 text-xs">
          <span className="text-[10px] uppercase font-bold text-slate-500 shrink-0">Quick Prompts:</span>
          <button
            onClick={() => handleSendMessage('Is 30-min express delivery available for Bangalore 560103?')}
            className="shrink-0 bg-slate-800 hover:bg-slate-700 text-slate-300 px-2.5 py-1 rounded-lg border border-slate-700 text-[11px] cursor-pointer"
          >
            ⚡ 30-Min Delivery Check
          </button>
          <button
            onClick={() => handleSendMessage('ದಯವಿಟ್ಟು 2 ರಾಗಿ ಇಡ್ಲಿ ಆರ್ಡರ್ ಮಾಡಿ')}
            className="shrink-0 bg-indigo-950 hover:bg-indigo-900 text-indigo-300 px-2.5 py-1 rounded-lg border border-indigo-700/60 text-[11px] cursor-pointer font-['Noto_Sans_Kannada',sans-serif]"
          >
            ಇಡ್ಲಿ ಆರ್ಡರ್ ಮಾಡಿ (Order Idli)
          </button>
          <button
            onClick={() => handleSendMessage('What is the recommended adult dosage for Dolo 650?')}
            className="shrink-0 bg-slate-800 hover:bg-slate-700 text-slate-300 px-2.5 py-1 rounded-lg border border-slate-700 text-[11px] cursor-pointer"
          >
            💊 Dolo 650 Dosage
          </button>
          <button
            onClick={() => handleSendMessage('Does ASUS TUF Gaming F15 have expandable RAM and SSD?')}
            className="shrink-0 bg-slate-800 hover:bg-slate-700 text-slate-300 px-2.5 py-1 rounded-lg border border-slate-700 text-[11px] cursor-pointer"
          >
            💻 Laptop Upgradeability
          </button>
        </div>

        {/* Input & Call Controls */}
        <div className="p-4 bg-slate-900 border-t border-slate-800 flex flex-col gap-3">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSendMessage();
            }}
            className="flex items-center gap-2"
          >
            <input
              type="text"
              placeholder="Speak or type a question in English or ಕನ್ನಡ..."
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              disabled={callStatus !== 'active' || isAiThinking}
              className="flex-1 bg-slate-950 text-white placeholder:text-slate-500 text-xs sm:text-sm px-4 py-2.5 rounded-xl border border-slate-700 focus:outline-none focus:border-indigo-500"
            />
            <button
              type="submit"
              disabled={!inputText.trim() || isAiThinking}
              className="p-2.5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 text-white rounded-xl transition-colors cursor-pointer"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>

          {/* Action Row: Mute, Speaker, End Call */}
          <div className="flex items-center justify-around pt-1">
            <button
              onClick={() => setIsMuted(!isMuted)}
              className={`flex flex-col items-center gap-1 text-[11px] cursor-pointer ${
                isMuted ? 'text-rose-400' : 'text-slate-400 hover:text-white'
              }`}
            >
              <div
                className={`w-10 h-10 rounded-full flex items-center justify-center ${
                  isMuted ? 'bg-rose-500/20 border border-rose-500' : 'bg-slate-800 border border-slate-700'
                }`}
              >
                {isMuted ? <MicOff className="w-5 h-5 text-rose-400" /> : <Mic className="w-5 h-5 text-slate-300" />}
              </div>
              <span>{isMuted ? 'Muted' : 'Mute'}</span>
            </button>

            <button
              onClick={() => setIsSpeakerOn(!isSpeakerOn)}
              className={`flex flex-col items-center gap-1 text-[11px] cursor-pointer ${
                !isSpeakerOn ? 'text-rose-400' : 'text-slate-400 hover:text-white'
              }`}
            >
              <div
                className={`w-10 h-10 rounded-full flex items-center justify-center ${
                  !isSpeakerOn ? 'bg-rose-500/20 border border-rose-500' : 'bg-slate-800 border border-slate-700'
                }`}
              >
                {!isSpeakerOn ? (
                  <VolumeX className="w-5 h-5 text-rose-400" />
                ) : (
                  <Volume2 className="w-5 h-5 text-indigo-400" />
                )}
              </div>
              <span>{isSpeakerOn ? 'Speaker On' : 'Speaker Off'}</span>
            </button>

            <button
              onClick={() => {
                window.speechSynthesis?.cancel();
                setCallStatus('ended');
                setTimeout(() => endCallingZyro(), 300);
              }}
              className="flex flex-col items-center gap-1 text-[11px] text-rose-400 hover:text-rose-300 cursor-pointer"
            >
              <div className="w-12 h-12 rounded-full bg-rose-600 hover:bg-rose-500 text-white flex items-center justify-center shadow-lg shadow-rose-600/30">
                <PhoneOff className="w-6 h-6" />
              </div>
              <span className="font-bold">End Call</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
