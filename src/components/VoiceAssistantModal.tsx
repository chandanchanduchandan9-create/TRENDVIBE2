import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useConversation, ConversationProvider } from '@elevenlabs/react';
import {
  Mic,
  MicOff,
  PhoneOff,
  Sparkles,
  X,
  Volume2,
  AlertTriangle,
  Clock,
  MessageSquare,
  Languages,
  RotateCcw,
  ShieldCheck,
  Info,
  Smartphone,
  Radio,
} from 'lucide-react';
import { api } from '../services/api.ts';
import { useApp } from '../context/AppContext.tsx';

export interface EnvironmentDiagnostics {
  isSecureContext: boolean;
  hasMediaDevices: boolean;
  hasGetUserMedia: boolean;
  permissionState: 'granted' | 'denied' | 'prompt' | 'unsupported';
  isIframe: boolean;
  isAndroid: boolean;
  isChrome: boolean;
}

export async function checkEnvironmentDiagnostics(): Promise<EnvironmentDiagnostics> {
  const isSecure = typeof window !== 'undefined' && Boolean(window.isSecureContext);
  const hasMediaDevices = typeof navigator !== 'undefined' && Boolean(navigator.mediaDevices);
  const hasGetUserMedia = typeof navigator !== 'undefined' && Boolean(navigator.mediaDevices?.getUserMedia);
  const isIframe = typeof window !== 'undefined' && window.self !== window.top;

  const ua = typeof navigator !== 'undefined' ? navigator.userAgent.toLowerCase() : '';
  const isAndroid = ua.includes('android');
  const isChrome = ua.includes('chrome') || ua.includes('crios');

  let permissionState: 'granted' | 'denied' | 'prompt' | 'unsupported' = 'unsupported';

  if (typeof navigator !== 'undefined' && (navigator as any).permissions?.query) {
    try {
      const result = await (navigator as any).permissions.query({ name: 'microphone' });
      if (result?.state) {
        permissionState = result.state as 'granted' | 'denied' | 'prompt';
      }
    } catch (e) {
      permissionState = 'unsupported';
    }
  }

  return {
    isSecureContext: isSecure,
    hasMediaDevices,
    hasGetUserMedia,
    permissionState,
    isIframe,
    isAndroid,
    isChrome,
  };
}

export interface VoiceAssistantProductDetails {
  name: string;
  brand?: string;
  price?: number;
  mrp?: number;
  category?: string;
  inStock?: boolean;
  availableStock?: number;
  express30Min?: boolean;
  kannadaName?: string;
  description?: string;
}

export interface VoiceAssistantModalProps {
  isOpen: boolean;
  onClose: () => void;
  autoStart?: boolean;
  context?: {
    leadId?: string;
    enquiryId?: string;
    productName?: string;
    productId?: string;
    productDetails?: VoiceAssistantProductDetails;
    customerName?: string;
    customerPhone?: string;
  };
}

interface TranscriptTurn {
  id: string;
  role: 'assistant' | 'user' | 'system';
  text: string;
  timestamp: string;
}

const VoiceAssistantModalInner: React.FC<VoiceAssistantModalProps & { initialAgentId: string }> = ({
  isOpen,
  onClose,
  autoStart = false,
  context,
  initialAgentId,
}) => {
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [transcripts, setTranscripts] = useState<TranscriptTurn[]>([]);
  const [callDuration, setCallDuration] = useState<number>(0);
  const [selectedLanguage, setSelectedLanguage] = useState<'English' | 'Hindi' | 'Kannada'>('English');
  const [showDiagnostics, setShowDiagnostics] = useState<boolean>(false);
  const [agentId, setAgentId] = useState<string>(initialAgentId);

  const { showToast } = useApp();
  const [diagnostics, setDiagnostics] = useState<EnvironmentDiagnostics | null>(null);

  const durationTimerRef = useRef<any>(null);
  const transcriptsEndRef = useRef<HTMLDivElement>(null);
  const hasAutoStartedRef = useRef<boolean>(false);

  // ElevenLabs Conversation Hook
  const conversation = useConversation({
    onConnect: () => {
      console.log('[ElevenLabs] Connected');
      setErrorMessage(null);
      showToast('Voice agent connected successfully', 'success');
      
      // Start duration timer
      setCallDuration(0);
      durationTimerRef.current = setInterval(() => {
        setCallDuration((prev) => prev + 1);
      }, 1000);

      setTranscripts((prev) => [
        ...prev,
        {
          id: `sys-${Date.now()}`,
          role: 'system',
          text: `ElevenLabs Voice Agent connected. Conversation active in ${selectedLanguage}.`,
          timestamp: new Date().toLocaleTimeString(),
        },
      ]);
    },
    onDisconnect: () => {
      console.log('[ElevenLabs] Disconnected');
      if (durationTimerRef.current) {
        clearInterval(durationTimerRef.current);
      }
      showToast('Voice session ended', 'info');
    },
    onMessage: (message) => {
      console.log('[ElevenLabs] Message:', message);
      if (message.message) {
        setTranscripts((prev) => [
          ...prev,
          {
            id: `turn-${Date.now()}-${Math.random()}`,
            role: message.source === 'user' ? 'user' : 'assistant',
            text: message.message,
            timestamp: new Date().toLocaleTimeString(),
          },
        ]);
      }
    },
    onError: (error) => {
      console.error('[ElevenLabs] Error:', error);
      const msg = typeof error === 'string' ? error : (error as any).message || 'Unknown ElevenLabs error';
      setErrorMessage(`Connection error: ${msg}`);
      showToast(`Connection failed: ${msg}`, 'error');
    },
  });

  const callStatus = conversation.status;
  const isSpeaking = conversation.isSpeaking;

  // Sync scroll to bottom of transcripts
  useEffect(() => {
    if (transcriptsEndRef.current) {
      transcriptsEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [transcripts]);

  // Run diagnostics & sync ElevenLabs config when modal opens
  useEffect(() => {
    if (!isOpen) return;

    checkEnvironmentDiagnostics().then((diag) => {
      setDiagnostics(diag);
      if (diag.permissionState === 'denied') {
        setErrorMessage(
          diag.isAndroid
            ? 'Microphone permission is blocked on Android Chrome. Tap the lock/tune icon in your address bar, enable Microphone, and tap Retry.'
            : 'Microphone permission is blocked in browser settings. Allow microphone access in your browser address bar and tap Retry.'
        );
      }
    });

    async function loadConfig() {
      try {
        const conf = await api.getVoiceAssistantConfig();
        if (conf.agentId) setAgentId(conf.agentId);
      } catch (e) {
        console.warn('Fallback to default ElevenLabs Agent ID');
      }
    }
    loadConfig();
  }, [isOpen]);

  const handleStartCall = useCallback(async () => {
    try {
      setErrorMessage(null);
      showToast('Connecting to voice assistant...', 'info');

      // 1. Diagnostics Pre-check
      const diag = await checkEnvironmentDiagnostics();
      if (!diag.isSecureContext && !window.location.hostname.includes('localhost')) {
        throw new Error('Browser requires HTTPS for microphone access.');
      }
      if (!diag.hasGetUserMedia) {
        throw new Error('Your browser does not support WebRTC audio (getUserMedia missing).');
      }

      // 2. Request Mic Permission explicitly
      try {
        await navigator.mediaDevices.getUserMedia({ audio: true });
      } catch (e: any) {
        throw new Error('Microphone access was denied. Please enable it in browser settings.');
      }

      // 3. Start ElevenLabs Session
      const dynamicVariables = {
        customer_name: context?.customerName || 'Valued Customer',
        product_name: context?.productDetails?.name || context?.productName || 'our catalog',
        preferred_language: selectedLanguage,
      };

      await conversation.startSession({
        agentId: agentId,
        dynamicVariables,
      });

    } catch (err: any) {
      console.error('[ElevenLabs Session Error]:', err);
      const raw = err?.message || JSON.stringify(err);
      setErrorMessage(`Unable to connect to ElevenLabs: ${raw}`);
      showToast('Connection failed: ' + (err.message || 'Unknown error'), 'error');
    }
  }, [conversation, agentId, selectedLanguage, context, showToast]);

  const handleEndCall = useCallback(async () => {
    try {
      await conversation.endSession();
      
      if (context?.leadId || context?.enquiryId) {
        const turns = transcripts
          .filter((t) => t.role !== 'system')
          .map((t) => `[${t.role.toUpperCase()}]: ${t.text}`)
          .join('\n');
        
        await api.completeVoiceSession({
          leadId: context?.leadId,
          enquiryId: context?.enquiryId,
          summary: `ElevenLabs voice conversation (${callDuration}s, ${selectedLanguage}): ${turns.slice(0, 1000)}`,
          durationSeconds: callDuration,
        });
      }
    } catch (e) {
      console.warn('ElevenLabs cleanup error:', e);
    }
  }, [conversation, transcripts, callDuration, selectedLanguage, context]);

  // Handle auto-start once when modal opens and config is ready
  useEffect(() => {
    if (isOpen && autoStart && !hasAutoStartedRef.current && callStatus === 'disconnected') {
      hasAutoStartedRef.current = true;
      handleStartCall();
    }
  }, [isOpen, autoStart, callStatus, handleStartCall]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white w-full max-w-2xl rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] ring-1 ring-slate-200">
        {/* Header */}
        <div className="bg-gradient-to-r from-indigo-700 via-indigo-600 to-violet-700 px-6 py-5 flex items-center justify-between text-white shadow-lg">
          <div className="flex items-center gap-3">
            <div className="bg-white/20 p-2.5 rounded-2xl backdrop-blur-md border border-white/10 shadow-inner">
              <Radio className={`w-6 h-6 ${callStatus === 'connected' ? 'animate-pulse text-emerald-300' : 'text-indigo-100'}`} />
            </div>
            <div>
              <h2 className="text-xl font-bold tracking-tight">TRENDVIBE AI Voice Assistant</h2>
              <div className="flex items-center gap-2">
                <span className="flex h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
                <span className="text-[10px] uppercase tracking-widest font-black text-indigo-100 opacity-90">
                  ElevenLabs Conversational AI
                </span>
              </div>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white/10 rounded-full transition-colors cursor-pointer"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-8 space-y-6 bg-slate-50/50">
          {/* Active Product Banner */}
          {context?.productName && (
            <div className="bg-indigo-50/80 border border-indigo-100/50 rounded-2xl p-4 flex items-center justify-between shadow-sm animate-in slide-in-from-top duration-500">
              <div className="flex items-center gap-3">
                <div className="bg-white p-2 rounded-xl shadow-sm border border-indigo-50">
                  <Smartphone className="w-5 h-5 text-indigo-600" />
                </div>
                <div>
                  <p className="text-[10px] uppercase font-black text-indigo-400 tracking-wider">Discussing Product</p>
                  <p className="font-bold text-slate-800 leading-tight truncate max-w-[200px] sm:max-w-xs">
                    {context.productDetails?.name || context.productName}
                  </p>
                </div>
              </div>
              {context.productDetails?.price && (
                <div className="text-right">
                  <p className="text-indigo-600 font-black text-lg">₹{context.productDetails.price.toLocaleString()}</p>
                </div>
              )}
            </div>
          )}

          {/* Connection Status Indicator */}
          <div className="flex items-center justify-center">
            <div className="inline-flex items-center gap-2 bg-white px-4 py-2 rounded-full shadow-sm border border-slate-100">
              <div className={`w-2 h-2 rounded-full ${
                callStatus === 'connected' ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.6)]' : 
                callStatus === 'connecting' ? 'bg-amber-500 animate-pulse' : 'bg-slate-300'
              }`} />
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                {callStatus === 'connected' ? 'Session Active' : 
                 callStatus === 'connecting' ? 'Establishing Connection' : 
                 callStatus === 'error' ? 'Connection Issue' : 'Agent Ready'}
              </span>
              <span className="text-[10px] text-slate-300 font-mono">|</span>
              <span className="text-[10px] text-slate-400 font-mono truncate max-w-[120px]">
                ID: {agentId}
              </span>
            </div>
          </div>

          {/* Language Selection */}
          <div className="bg-white border border-slate-100 rounded-3xl p-5 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Languages className="w-4 h-4 text-indigo-500" />
                <h3 className="text-xs font-black text-slate-700 uppercase tracking-wider">Preferred Speaking Language</h3>
              </div>
              <span className="text-[10px] text-slate-400 font-medium italic">Agent responds in chosen language</span>
            </div>
            
            <div className="grid grid-cols-3 gap-3">
              {(['English', 'Hindi', 'Kannada'] as const).map((lang) => (
                <button
                  key={lang}
                  disabled={callStatus === 'connected' || callStatus === 'connecting'}
                  onClick={() => setSelectedLanguage(lang)}
                  className={`py-3 px-2 rounded-2xl text-xs font-bold transition-all border-2 flex flex-col items-center gap-1 ${
                    selectedLanguage === lang
                      ? 'bg-indigo-600 border-indigo-600 text-white shadow-md shadow-indigo-200'
                      : 'bg-white border-slate-100 text-slate-600 hover:border-indigo-200 hover:bg-slate-50'
                  } disabled:opacity-50 disabled:cursor-not-allowed`}
                >
                  <span>{lang === 'Hindi' ? 'हिंदी' : lang === 'Kannada' ? 'ಕನ್ನಡ' : lang}</span>
                  <span className="text-[9px] opacity-70 font-medium italic tracking-normal">
                    {lang === 'English' ? 'Standard' : lang}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Error Message */}
          {errorMessage && (
            <div className="bg-rose-50 border-2 border-rose-100 rounded-3xl p-5 animate-in shake duration-500 shadow-sm overflow-hidden">
              <div className="flex gap-4">
                <div className="bg-white p-2 rounded-2xl shadow-sm h-fit border border-rose-50">
                  <AlertTriangle className="w-6 h-6 text-rose-500" />
                </div>
                <div className="flex-1 space-y-2">
                  <p className="font-extrabold text-rose-950">ElevenLabs Connection Notice</p>
                  <p className="text-sm text-rose-700 leading-relaxed font-medium">
                    {errorMessage}
                  </p>
                  
                  <div className="mt-3 p-3 bg-white/50 rounded-xl border border-rose-100">
                    <p className="text-[10px] font-black text-rose-400 uppercase tracking-widest mb-1">Raw Output:</p>
                    <p className="text-[11px] font-mono text-rose-600 break-all">{errorMessage}</p>
                  </div>
                  
                  <div className="flex justify-end mt-2">
                    <button 
                      onClick={handleStartCall}
                      className="bg-rose-600 hover:bg-rose-700 text-white px-5 py-2.5 rounded-2xl text-xs font-black flex items-center gap-2 transition shadow-lg shadow-rose-200 cursor-pointer active:scale-95"
                    >
                      <RotateCcw className="w-4 h-4" />
                      <span>Retry Connection</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Central Animated Audio Visualizer */}
          <div className="py-4 sm:py-6 flex flex-col items-center justify-center space-y-3">
            <div className="relative flex items-center justify-center">
              {/* Pulsing visual circles when active */}
              {callStatus === 'connected' && (
                <>
                  <div
                    className="absolute w-28 h-28 rounded-full bg-indigo-500/20 animate-ping"
                    style={{ animationDuration: '2s' }}
                  />
                  <div
                    className={`absolute rounded-full bg-emerald-500/20 transition-all duration-300 ${isSpeaking ? 'scale-150 opacity-100' : 'scale-100 opacity-0'}`}
                    style={{ width: '100px', height: '100px' }}
                  />
                </>
              )}

              <button
                type="button"
                disabled={callStatus === 'connecting'}
                onClick={callStatus === 'connected' ? handleEndCall : handleStartCall}
                className={`w-22 h-22 rounded-full flex items-center justify-center transition-all duration-200 shadow-xl cursor-pointer ${
                  callStatus === 'connected'
                    ? isSpeaking
                      ? 'bg-gradient-to-tr from-indigo-600 to-violet-600 text-white shadow-indigo-500/30 ring-4 ring-indigo-200 transform scale-105'
                      : 'bg-gradient-to-tr from-emerald-500 to-teal-500 text-white shadow-emerald-500/30 ring-4 ring-emerald-200'
                    : callStatus === 'connecting'
                    ? 'bg-amber-500 text-white shadow-amber-500/30 animate-pulse cursor-wait'
                    : 'bg-gradient-to-tr from-indigo-600 to-violet-600 text-white shadow-indigo-500/25 hover:scale-105'
                }`}
              >
                {callStatus === 'connected' ? (
                  isSpeaking ? (
                    <Volume2 className="w-9 h-9 animate-pulse" />
                  ) : (
                    <Mic className="w-9 h-9" />
                  )
                ) : callStatus === 'connecting' ? (
                  <RotateCcw className="w-9 h-9 animate-spin" />
                ) : (
                  <Mic className="w-9 h-9" />
                )}
              </button>
            </div>

            <div className="text-center space-y-1">
              <p className="text-xs font-bold text-slate-700">
                {callStatus === 'connected'
                  ? isSpeaking
                    ? 'ElevenLabs Agent is speaking...'
                    : 'Listening to your voice...'
                  : callStatus === 'connecting'
                  ? 'Initializing ElevenLabs Session...'
                  : 'Tap the button above to start a live conversation with ElevenLabs'}
              </p>
              <p className="text-[11px] text-slate-400 max-w-sm mx-auto font-medium">
                High-fidelity conversational AI powered by ElevenLabs.
              </p>
            </div>
          </div>

          {/* System Diagnostics Toggle Banner */}
          <div className="border-t border-slate-100 pt-2">
            <button
              type="button"
              onClick={() => setShowDiagnostics((prev) => !prev)}
              className="text-[10px] font-bold text-slate-500 hover:text-indigo-600 flex items-center gap-1 transition cursor-pointer"
            >
              <Info className="w-3 h-3" />
              <span>{showDiagnostics ? 'Hide Environment Diagnostics' : 'View System & Mic Diagnostics'}</span>
            </button>

            {showDiagnostics && diagnostics && (
              <div className="mt-2 p-3 bg-slate-900 text-slate-200 rounded-xl text-[10px] font-mono space-y-1 animate-in fade-in">
                <div className="flex justify-between border-b border-slate-800 pb-1">
                  <span>HTTPS Secure Context:</span>
                  <span className={diagnostics.isSecureContext ? 'text-emerald-400 font-bold' : 'text-rose-400 font-bold'}>
                    {diagnostics.isSecureContext ? 'Secure (Yes)' : 'Insecure (No)'}
                  </span>
                </div>
                <div className="flex justify-between border-b border-slate-800 pb-1">
                  <span>MediaDevices API:</span>
                  <span className={diagnostics.hasGetUserMedia ? 'text-emerald-400 font-bold' : 'text-rose-400 font-bold'}>
                    {diagnostics.hasGetUserMedia ? 'Available' : 'Missing'}
                  </span>
                </div>
                <div className="flex justify-between border-b border-slate-800 pb-1">
                  <span>Mic Permission State:</span>
                  <span
                    className={
                      diagnostics.permissionState === 'granted'
                        ? 'text-emerald-400 font-bold'
                        : diagnostics.permissionState === 'denied'
                        ? 'text-rose-400 font-bold'
                        : 'text-amber-400 font-bold'
                    }
                  >
                    {diagnostics.permissionState.toUpperCase()}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Platform:</span>
                  <span className="text-slate-400 uppercase">
                    {diagnostics.isAndroid ? 'Android' : 'Desktop/Other'} {diagnostics.isChrome ? '(Chrome)' : ''}
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Transcripts Drawer */}
          <div className="bg-slate-900 rounded-3xl overflow-hidden flex flex-col h-[280px] shadow-2xl border border-slate-800">
            <div className="bg-slate-800/50 px-5 py-3 border-b border-slate-700/50 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <MessageSquare className="w-4 h-4 text-indigo-400" />
                <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest">Live Transcript</span>
              </div>
              {callStatus === 'connected' && (
                <div className="flex items-center gap-2 bg-indigo-500/10 px-2 py-0.5 rounded-lg border border-indigo-500/20">
                  <div className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-pulse" />
                  <span className="text-[9px] font-bold text-indigo-300 uppercase tabular-nums">
                    {Math.floor(callDuration / 60)}:{(callDuration % 60).toString().padStart(2, '0')}
                  </span>
                </div>
              )}
            </div>
            
            <div className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-thin scrollbar-thumb-slate-700">
              {transcripts.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-slate-600 text-center px-6">
                  <div className="bg-slate-800/30 p-3 rounded-full mb-3">
                    <Radio className="w-6 h-6 opacity-20" />
                  </div>
                  <p className="text-[11px] font-medium italic">No activity yet. Connection is required to begin transcription.</p>
                </div>
              ) : (
                transcripts.map((t) => (
                  <div
                    key={t.id}
                    className={`flex flex-col ${t.role === 'user' ? 'items-end' : 'items-start'} animate-in fade-in slide-in-from-bottom-2 duration-300`}
                  >
                    <div className="flex items-center gap-2 mb-1 px-1">
                      <span className="text-[9px] font-black text-slate-500 uppercase tracking-tighter">
                        {t.role === 'user' ? 'You' : t.role === 'assistant' ? 'AI Assistant' : 'System'} • {t.timestamp}
                      </span>
                    </div>
                    <div
                      className={`max-w-[85%] px-4 py-2.5 rounded-2xl text-sm leading-relaxed shadow-sm ${
                        t.role === 'user'
                          ? 'bg-indigo-600 text-white rounded-tr-none font-medium'
                          : t.role === 'assistant'
                          ? 'bg-slate-800 text-slate-200 rounded-tl-none border border-slate-700 font-medium'
                          : 'bg-slate-800/40 text-slate-400 italic border border-slate-800/50 text-[11px]'
                      }`}
                    >
                      {t.text}
                    </div>
                  </div>
                ))
              )}
              <div ref={transcriptsEndRef} />
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-white border-t border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2 text-slate-400">
            <ShieldCheck className="w-4 h-4 text-emerald-500" />
            <span className="text-[10px] font-bold uppercase tracking-tight">ElevenLabs Secure Audio</span>
          </div>
          <div className="flex items-center gap-2">
            {callStatus === 'connected' ? (
              <button
                onClick={handleEndCall}
                className="bg-rose-500 hover:bg-rose-600 text-white px-5 py-2.5 rounded-2xl text-xs font-black flex items-center gap-2 transition shadow-lg shadow-rose-200 cursor-pointer active:scale-95"
              >
                <PhoneOff className="w-4 h-4" />
                <span>End Session</span>
              </button>
            ) : (
              <button
                onClick={handleStartCall}
                disabled={callStatus === 'connecting'}
                className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2.5 rounded-2xl text-xs font-black flex items-center gap-2 transition shadow-lg shadow-indigo-200 cursor-pointer active:scale-95 disabled:opacity-50"
              >
                <Sparkles className="w-4 h-4" />
                <span>Start AI Conversation</span>
              </button>
            )}
            <button
              onClick={onClose}
              className="px-5 py-2.5 text-slate-500 hover:text-slate-700 text-xs font-black transition cursor-pointer"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export const VoiceAssistantModal: React.FC<VoiceAssistantModalProps> = (props) => {
  return (
    <ConversationProvider>
      <VoiceAssistantModalInner {...props} initialAgentId="agent_9401m63qfb47fe3atajs7ccv9xsb" />
    </ConversationProvider>
  );
};
