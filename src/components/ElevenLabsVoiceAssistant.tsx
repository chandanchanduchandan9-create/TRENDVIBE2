import React, { useCallback, useState } from 'react';
import { ConversationProvider, useConversation } from '@elevenlabs/react';
import { Mic, PhoneOff, Sparkles, Loader2, AlertCircle } from 'lucide-react';

/**
 * A standalone component to initialize and manage an ElevenLabs voice session.
 * Reads Agent ID from import.meta.env.VITE_ELEVENLABS_AGENT_ID.
 */
const VoiceSessionInner: React.FC = () => {
  const [error, setError] = useState<string | null>(null);
  
  // Use the ElevenLabs conversation hook
  const conversation = useConversation({
    onConnect: () => {
      console.log('ElevenLabs: Connected');
      setError(null);
    },
    onDisconnect: () => {
      console.log('ElevenLabs: Disconnected');
    },
    onError: (err) => {
      console.error('ElevenLabs Error:', err);
      const msg = typeof err === 'string' ? err : (err as any).message || 'Failed to connect to ElevenLabs';
      setError(msg);
    },
    onMessage: (message) => {
      console.log('ElevenLabs Message:', message);
    },
  });

  const startSession = useCallback(async () => {
    try {
      setError(null);
      
      // Get Agent ID from environment variables
      const agentId = import.meta.env.VITE_ELEVENLABS_AGENT_ID || 'agent_9401m63qfb47fe3atajs7ccv9xsb';
      
      if (!agentId) {
        throw new Error('ElevenLabs Agent ID is not configured in environment variables.');
      }

      // Request microphone permission explicitly to improve UX on mobile
      await navigator.mediaDevices.getUserMedia({ audio: true });

      // Start the voice session
      await conversation.startSession({
        agentId,
        // Optional: dynamicVariables can be passed here if your agent is configured for them
      });
    } catch (err: any) {
      console.error('Start Session Error:', err);
      setError(err.message || 'Could not start voice session');
    }
  }, [conversation]);

  const endSession = useCallback(async () => {
    await conversation.endSession();
  }, [conversation]);

  const isActive = conversation.status === 'connected';
  const isConnecting = conversation.status === 'connecting';

  return (
    <div className="flex flex-col items-center justify-center p-6 space-y-6 bg-white rounded-3xl border border-slate-100 shadow-xl max-w-md mx-auto">
      <div className="text-center space-y-2">
        <h3 className="text-xl font-bold text-slate-800">ElevenLabs AI Assistant</h3>
        <p className="text-sm text-slate-500">
          Experience high-fidelity, low-latency conversational AI.
        </p>
      </div>

      {/* Visual Indicator */}
      <div className="relative flex items-center justify-center">
        {isActive && (
          <div className="absolute w-32 h-32 bg-indigo-500/10 rounded-full animate-ping" />
        )}
        
        <div className={`w-24 h-24 rounded-full flex items-center justify-center transition-all duration-300 shadow-lg ${
          isActive 
            ? 'bg-emerald-500 text-white ring-4 ring-emerald-100 scale-110' 
            : isConnecting
            ? 'bg-amber-500 text-white animate-pulse'
            : 'bg-indigo-600 text-white hover:scale-105'
        }`}>
          {isConnecting ? (
            <Loader2 className="w-10 h-10 animate-spin" />
          ) : isActive ? (
            <div className="flex items-center gap-1">
               <span className="w-1.5 h-6 bg-white rounded-full animate-[bounce_1s_infinite_0ms]" />
               <span className="w-1.5 h-10 bg-white rounded-full animate-[bounce_1s_infinite_200ms]" />
               <span className="w-1.5 h-6 bg-white rounded-full animate-[bounce_1s_infinite_400ms]" />
            </div>
          ) : (
            <Mic className="w-10 h-10" />
          )}
        </div>
      </div>

      {/* Status & Controls */}
      <div className="w-full space-y-4">
        {error && (
          <div className="bg-rose-50 text-rose-600 p-4 rounded-2xl flex items-start gap-3 border border-rose-100 animate-in fade-in slide-in-from-top-2">
            <AlertCircle className="w-5 h-5 mt-0.5 shrink-0" />
            <p className="text-xs font-medium leading-relaxed">{error}</p>
          </div>
        )}

        <div className="flex flex-col gap-3">
          {isActive ? (
            <button
              onClick={endSession}
              className="w-full bg-rose-500 hover:bg-rose-600 text-white py-4 rounded-2xl font-bold flex items-center justify-center gap-3 transition-all active:scale-95 shadow-lg shadow-rose-200"
            >
              <PhoneOff className="w-5 h-5" />
              <span>End AI Session</span>
            </button>
          ) : (
            <button
              onClick={startSession}
              disabled={isConnecting}
              className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-300 text-white py-4 rounded-2xl font-bold flex items-center justify-center gap-3 transition-all active:scale-95 shadow-lg shadow-indigo-200"
            >
              {isConnecting ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span>Connecting...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-5 h-5" />
                  <span>Start AI Conversation</span>
                </>
              )}
            </button>
          )}
        </div>
        
        <p className="text-[10px] text-center text-slate-400 uppercase tracking-widest font-bold">
          Secure End-to-End Encrypted Audio
        </p>
      </div>
    </div>
  );
};

/**
 * Main Export wrapped in ConversationProvider
 */
export const ElevenLabsVoiceAssistant: React.FC = () => {
  return (
    <ConversationProvider>
      <VoiceSessionInner />
    </ConversationProvider>
  );
};
