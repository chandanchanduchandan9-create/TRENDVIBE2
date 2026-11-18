import React, { useState, useEffect, useRef } from 'react';
import { api } from '../services/api.ts';
import { Product } from '../types/index.ts';
import {
  Mic,
  MicOff,
  Volume2,
  ShieldCheck,
  Languages,
  Sparkles,
  PhoneCall,
  CheckCircle2,
  Square,
  MessageSquare,
  Radio,
} from 'lucide-react';

interface TalkToAIAssistantProps {
  product?: Product | null;
  productName?: string;
  customerName?: string;
  customerPhone?: string;
  leadId?: string;
  enquiryId?: string;
  onClose: () => void;
  showToast: (msg: string, type: 'success' | 'error' | 'info') => void;
}

export const TalkToAIAssistant: React.FC<TalkToAIAssistantProps> = ({
  product,
  productName = 'Store Product',
  customerName = 'Valued Customer',
  customerPhone = '+91 98450 12345',
  leadId,
  enquiryId,
  onClose,
  showToast,
}) => {
  const [selectedLanguage, setSelectedLanguage] = useState<'English' | 'Hindi' | 'Kannada'>('English');
  const [isConversationActive, setIsConversationActive] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState<Array<{ speaker: string; text: string; time: string }>>([
    {
      speaker: 'AI Assistant',
      text: `Hello ${customerName}! Agent Ready. Tap "Start AI Conversation" below to begin discussing ${product?.name || productName}.`,
      time: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
    },
  ]);
  const [userSpeechInput, setUserSpeechInput] = useState('');
  const [loadingReply, setLoadingReply] = useState(false);

  const audioRef = useRef<HTMLAudioElement | null>(null);

  const targetProductName = product?.name || productName;
  const targetPrice = product?.price ? `₹${product.price.toLocaleString('en-IN')}` : '₹110';

  // Helper to synthesize and play audio using ElevenLabs or SpeechSynthesis
  const speakText = async (textToSpeak: string, lang: 'English' | 'Hindi' | 'Kannada') => {
    setIsSpeaking(true);
    try {
      // Try ElevenLabs TTS API via backend
      const res = await fetch('/api/bot/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: textToSpeak,
          productId: product?.id,
          productName: targetProductName,
          language: lang.toLowerCase(),
          isCallingSession: true,
          customerName,
          customerPhone,
        }),
      });

      const data = await res.json();
      const replyText = data.reply || textToSpeak;

      // Add to transcript
      setTranscript((prev) => [
        ...prev,
        {
          speaker: 'AI Assistant',
          text: replyText,
          time: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
        },
      ]);

      // Use browser SpeechSynthesis for realistic instant voice output
      if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel();
        const utterance = new SpeechSynthesisUtterance(replyText);
        utterance.rate = 1.0;
        utterance.pitch = 1.0;
        if (lang === 'Hindi') utterance.lang = 'hi-IN';
        else if (lang === 'Kannada') utterance.lang = 'kn-IN';
        else utterance.lang = 'en-IN';

        utterance.onend = () => setIsSpeaking(false);
        utterance.onerror = () => setIsSpeaking(false);
        window.speechSynthesis.speak(utterance);
      } else {
        setTimeout(() => setIsSpeaking(false), 2500);
      }
    } catch (err) {
      console.error(err);
      setIsSpeaking(false);
    }
  };

  const handleStartConversation = async () => {
    setIsConversationActive(true);
    setIsListening(true);
    showToast('AI Voice Assistant connected! Agent is live.', 'success');

    let initialPrompt = `Hello ${customerName}! I am Rachel, your TrendVibe AI customer support agent. We are discussing ${targetProductName} priced at ${targetPrice}. How can I help you regarding your enquiry today?`;
    if (selectedLanguage === 'Hindi') {
      initialPrompt = `नमस्ते ${customerName}! मैं राचेल हूँ, आपकी ट्रेंडवाइब एआई ग्राहक सहायता एजेंट। हम ${targetProductName} (${targetPrice}) के बारे में बात कर रहे हैं। आज मैं आपकी क्या सहायता कर सकती हूँ?`;
    } else if (selectedLanguage === 'Kannada') {
      initialPrompt = `ನಮಸ್ಕಾರ ${customerName}! ನಾನು ರಾಚೆಲ್, ನಿಮ್ಮ TrendVibe AI ಗ್ರಾಹಕ ಬೆಂಬಲ ಪ್ರತಿನಿಧಿ. ನಾವು ${targetProductName} (${targetPrice}) ಕುರಿತು ಮಾತನಾಡುತ್ತಿದ್ದೇವೆ. ಇಂದು ನಾನು ನಿಮಗೆ ಹೇಗೆ ಸಹಾಯ ಮಾಡಲಿ?`;
    }

    await speakText(initialPrompt, selectedLanguage);
  };

  const handleStopConversation = () => {
    setIsConversationActive(false);
    setIsListening(false);
    setIsSpeaking(false);
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
    showToast('AI Conversation paused.', 'info');
  };

  const handleUserSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userSpeechInput.trim() || loadingReply) return;

    const question = userSpeechInput.trim();
    setUserSpeechInput('');

    const nowStr = new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
    setTranscript((prev) => [...prev, { speaker: customerName, text: question, time: nowStr }]);

    setLoadingReply(true);
    try {
      const response = await fetch('/api/bot/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: question,
          productId: product?.id,
          productName: targetProductName,
          language: selectedLanguage.toLowerCase(),
          customerName,
          customerPhone,
          isCallingSession: true,
        }),
      });

      const res = await response.json();

      const reply = res.reply || "I've noted your requirement and notified the seller.";
      await speakText(reply, selectedLanguage);
    } catch (err: any) {
      showToast(`AI response error: ${err.message}`, 'error');
    } finally {
      setLoadingReply(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-sm animate-in fade-in">
      <div className="bg-white rounded-3xl w-full max-w-xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[94vh]">
        
        {/* Header - Matches Screenshot */}
        <div className="bg-gradient-to-r from-purple-700 via-indigo-700 to-indigo-900 px-6 py-4 text-white flex items-center justify-between shadow-md">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-white/20 backdrop-blur-md flex items-center justify-center text-white font-bold">
              <Radio className="w-5 h-5 animate-pulse text-emerald-400" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-extrabold text-base tracking-tight">TRENDVIBE AI Voice Assistant</h3>
                <span className="inline-block w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
              </div>
              <p className="text-[11px] text-purple-200 font-medium">SMART NEURAL VOICE • MULTILINGUAL RAG</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white font-bold text-sm cursor-pointer transition-colors"
            title="Close"
          >
            ✕
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-5 overflow-y-auto flex-1">
          
          {/* Discussing Product Banner */}
          <div className="p-4 bg-slate-50 border border-slate-200/90 rounded-2xl flex items-center justify-between gap-3 shadow-xs">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-10 h-10 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center shrink-0 font-bold">
                <Sparkles className="w-5 h-5" />
              </div>
              <div className="min-w-0">
                <div className="text-[10px] font-bold uppercase tracking-wider text-purple-700">Discussing Product</div>
                <h4 className="font-extrabold text-slate-900 text-xs sm:text-sm truncate">{targetProductName}</h4>
              </div>
            </div>
            <div className="text-right shrink-0">
              <span className="font-extrabold text-indigo-700 text-base">{targetPrice}</span>
            </div>
          </div>

          {/* Agent Ready Badge */}
          <div className="flex justify-center">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-slate-100 border border-slate-200 text-slate-700 text-xs font-semibold shadow-2xs">
              <span className={`w-2 h-2 rounded-full ${isConversationActive ? 'bg-emerald-500 animate-pulse' : 'bg-slate-400'}`}></span>
              <span>{isConversationActive ? 'LIVE CONVERSATION ACTIVE' : 'AGENT READY'}</span>
              <span className="text-slate-400 font-mono text-[11px]">| ID: agent_9401m63qfb...</span>
            </div>
          </div>

          {/* Preferred Speaking Language */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="font-extrabold text-slate-700 uppercase flex items-center gap-1.5">
                <Languages className="w-3.5 h-3.5 text-indigo-600" />
                <span>Preferred Speaking Language</span>
              </span>
              <span className="text-[11px] text-slate-400">Agent responds in chosen language</span>
            </div>

            <div className="grid grid-cols-3 gap-2.5">
              {(['English', 'Hindi', 'Kannada'] as const).map((lang) => {
                const isSelected = selectedLanguage === lang;
                return (
                  <button
                    key={lang}
                    type="button"
                    onClick={() => {
                      setSelectedLanguage(lang);
                      showToast(`Language set to ${lang}`, 'info');
                    }}
                    className={`py-3 px-3 rounded-2xl border text-center transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-purple-600 border-purple-600 text-white shadow-md font-extrabold'
                        : 'bg-white border-slate-200 hover:border-purple-300 text-slate-700 font-bold'
                    }`}
                  >
                    <div className="text-xs">{lang === 'English' ? 'English' : lang === 'Hindi' ? 'हिंदी' : 'ಕನ್ನಡ'}</div>
                    <div className={`text-[10px] mt-0.5 ${isSelected ? 'text-purple-200' : 'text-slate-400'}`}>
                      {lang === 'English' ? 'Standard' : lang === 'Hindi' ? 'Hindi' : 'Kannada'}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Center Interactive Mic Section */}
          <div className="py-6 bg-gradient-to-b from-purple-50/50 to-indigo-50/30 rounded-3xl border border-purple-100 flex flex-col items-center justify-center text-center space-y-3 relative overflow-hidden">
            {isSpeaking && (
              <div className="absolute inset-x-0 top-2 flex justify-center items-center gap-1">
                {[...Array(7)].map((_, i) => (
                  <span
                    key={i}
                    className="w-1 bg-purple-600 rounded-full animate-bounce"
                    style={{ height: `${12 + Math.sin(i + Date.now() / 200) * 12}px`, animationDelay: `${i * 100}ms` }}
                  ></span>
                ))}
              </div>
            )}

            <button
              type="button"
              onClick={isConversationActive ? handleStopConversation : handleStartConversation}
              className={`w-20 h-20 rounded-full flex items-center justify-center shadow-xl transition-all cursor-pointer ${
                isConversationActive
                  ? 'bg-rose-600 hover:bg-rose-700 text-white animate-pulse'
                  : 'bg-purple-600 hover:bg-purple-500 text-white hover:scale-105'
              }`}
            >
              {isConversationActive ? <MicOff className="w-8 h-8" /> : <Mic className="w-8 h-8" />}
            </button>

            <div className="space-y-1 px-4">
              <h5 className="font-extrabold text-slate-900 text-sm">
                {isConversationActive ? 'AI Assistant is Listening & Speaking...' : 'Tap the button above to start a live conversation'}
              </h5>
              <p className="text-[11px] text-slate-500">
                {isConversationActive ? 'Speak naturally. AI will respond instantly with product facts & prices.' : 'High-fidelity conversational AI assistant powered by neural speech synthesis.'}
              </p>
            </div>
          </div>

          {/* Live Transcript Log */}
          {isConversationActive && (
            <div className="space-y-2 bg-slate-900 text-slate-100 p-4 rounded-2xl max-h-40 overflow-y-auto text-xs font-mono">
              <div className="text-[10px] uppercase font-bold text-purple-400 tracking-wider mb-1 flex items-center justify-between">
                <span>Live Conversation Transcript</span>
                <span className="text-emerald-400 animate-pulse">● SECURE STREAM</span>
              </div>
              {transcript.map((t, idx) => (
                <div key={idx} className="space-y-0.5 border-b border-slate-800 pb-1">
                  <div className="flex justify-between text-[10px] text-slate-400">
                    <span className="font-bold text-indigo-300">{t.speaker}</span>
                    <span>{t.time}</span>
                  </div>
                  <div className="text-slate-200">{t.text}</div>
                </div>
              ))}
            </div>
          )}

          {/* Text input fallback for voice */}
          {isConversationActive && (
            <form onSubmit={handleUserSendMessage} className="flex gap-2">
              <input
                type="text"
                value={userSpeechInput}
                onChange={(e) => setUserSpeechInput(e.target.value)}
                placeholder="Type your question or speak to AI..."
                className="flex-1 bg-slate-50 border border-slate-300 text-xs text-slate-900 p-2.5 rounded-xl focus:outline-none focus:border-purple-600"
              />
              <button
                type="submit"
                disabled={loadingReply}
                className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-bold cursor-pointer shadow-sm"
              >
                Send
              </button>
            </form>
          )}

        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-1.5 text-[11px] font-bold text-emerald-700">
            <ShieldCheck className="w-4 h-4" />
            <span>ENCRYPTED VOICE LINK</span>
          </div>

          <div className="flex items-center gap-2">
            {!isConversationActive ? (
              <button
                type="button"
                onClick={handleStartConversation}
                className="px-5 py-2.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-extrabold text-xs rounded-xl shadow-md flex items-center gap-1.5 cursor-pointer"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Start AI Conversation</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={handleStopConversation}
                className="px-5 py-2.5 bg-rose-600 hover:bg-rose-700 text-white font-extrabold text-xs rounded-xl shadow-md cursor-pointer"
              >
                End Conversation
              </button>
            )}

            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold text-xs rounded-xl cursor-pointer"
            >
              Close
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
