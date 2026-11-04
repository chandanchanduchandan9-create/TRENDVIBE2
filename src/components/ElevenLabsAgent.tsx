import React, { useCallback, useState } from 'react';
import { ConversationProvider, useConversation } from '@elevenlabs/react';
import { Mic, PhoneOff, Sparkles, Loader2, AlertCircle, Volume2 } from 'lucide-react';

/**
 * ElevenLabsAgent Component
 * Initializes a high-fidelity voice session with a specific agent ID.
 * Reads Agent ID from import.meta.env.VITE_ELEVENLABS_AGENT_ID.
 */
const ElevenLabsAgentInner: React.FC = () => {
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
  });

  const startSession = useCallback(async () => {
    try {
      setError(null);
      
      // Get Agent ID from environment variables
      const agentId = import.meta.env.VITE_ELEVENLABS_AGENT_ID || 'agent_9401m63qfb47fe3atajs7ccv9xsb';
      
      if (!agentId) {
        throw new Error('ElevenLabs Agent ID is not configured in environment variables.');
      }

      // Request microphone permission explicitly
      await navigator.mediaDevices.getUserMedia({ audio: true });

      // Start the voice session
      await conversation.startSession({
        agentId,
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
  const isSpeaking = conversation.isSpeaking;

  return (
    <div className="bg-white rounded-3xl border border-slate-200 shadow-xl p-6 flex flex-col items-center gap-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex items-center gap-3 self-start w-full border-b border-slate-100 pb-4">
        <div className="bg-indigo-600 p-2 rounded-xl text-white shadow-lg shadow-indigo-200">
          <Volume2 className="w-5 h-5" />
        </div>
        <div>
          <h3 className="font-bold text-slate-900 text-sm">ElevenLabs Voice AI</h3>
          <p className="text-[10px] text-emerald-600 font-semibold flex items-center gap-1">
            <span className={`w-1.5 h-1.5 rounded-full ${isActive ? 'bg-emerald-500 animate-pulse' : 'bg-slate-300'}`} />
            {isActive ? 'Live & Connected' : isConnecting ? 'Establishing Link...' : 'Real-time Assistant'}
          </p>
        </div>
      </div>

      <div className="relative flex items-center justify-center py-4">
        {isActive && (
          <div className="absolute w-32 h-32 bg-indigo-500/10 rounded-full animate-ping" />
        )}
        
        <div className={`w-20 h-20 rounded-full flex items-center justify-center transition-all duration-300 shadow-lg ${
          isActive 
            ? 'bg-emerald-500 text-white ring-4 ring-emerald-100 scale-110' 
            : isConnecting
            ? 'bg-amber-500 text-white animate-pulse'
            : 'bg-indigo-600 text-white hover:scale-105'
        }`}>
          {isConnecting ? (
            <Loader2 className="w-8 h-8 animate-spin" />
          ) : isActive ? (
            <div className="flex items-center gap-1">
               <span className={`w-1.5 bg-white rounded-full transition-all duration-150 ${isSpeaking ? 'h-6' : 'h-2 opacity-50'}`} />
               <span className={`w-1.5 bg-white rounded-full transition-all duration-150 ${isSpeaking ? 'h-10' : 'h-3 opacity-50'}`} />
               <span className={`w-1.5 bg-white rounded-full transition-all duration-150 ${isSpeaking ? 'h-6' : 'h-2 opacity-50'}`} />
            </div>
          ) : (
            <Mic className="w-8 h-8" />
          )}
        </div>
      </div>

      <div className="w-full space-y-4">
        {error && (
          <div className="bg-rose-50 text-rose-600 p-3 rounded-2xl flex items-start gap-2 border border-rose-100 animate-in shake duration-500">
            <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
            <p className="text-[11px] font-medium leading-relaxed">{error}</p>
          </div>
        )}

        <div className="flex flex-col gap-2">
          {isActive ? (
            <button
              onClick={endSession}
              className="w-full bg-rose-500 hover:bg-rose-600 text-white py-3 rounded-2xl font-bold flex items-center justify-center gap-2 transition-all active:scale-95 shadow-lg shadow-rose-200 text-sm"
            >
              <PhoneOff className="w-4 h-4" />
              <span>End AI Session</span>
            </button>
          ) : (
            <button
              onClick={startSession}
              disabled={isConnecting}
              className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-300 text-white py-3 rounded-2xl font-bold flex items-center justify-center gap-2 transition-all active:scale-95 shadow-lg shadow-indigo-200 text-sm"
            >
              {isConnecting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Connecting...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  <span>Talk to Customer Support</span>
                </>
              )}
            </button>
          )}
        </div>
        
        <p className="text-[9px] text-center text-slate-400 uppercase tracking-widest font-black opacity-60">
          Powered by ElevenLabs Conversational AI
        </p>
      </div>
    </div>
  );
};

export const ElevenLabsAgent: React.FC = () => {
  return (
    <ConversationProvider>
      <ElevenLabsAgentInner />
    </ConversationProvider>
  );
};
