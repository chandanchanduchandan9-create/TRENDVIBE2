import React from "react";
import { Mic, Sparkles } from "lucide-react";
import { useApp } from "../context/AppContext.tsx";

export const RetellVoiceWidget: React.FC = () => {
  const { startCallingZyro, isCallingOpen } = useApp();

  if (isCallingOpen) return null;

  return (
    <div className="fixed bottom-6 right-6 z-40">
      <button
        onClick={() => startCallingZyro()}
        className="group relative px-5 py-3.5 bg-gradient-to-r from-indigo-600 via-indigo-700 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white rounded-2xl shadow-2xl shadow-indigo-600/40 font-extrabold text-sm flex items-center gap-3 transition-all duration-300 transform hover:scale-105 active:scale-95 cursor-pointer border border-white/20"
        title="Speak directly with Zyro AI Voice Assistant (English & ಕನ್ನಡ)"
        aria-label="Talk to Zyro AI"
      >
        {/* Animated pulse and mic icon */}
        <div className="relative flex items-center justify-center w-8 h-8 rounded-xl bg-white/20 text-indigo-100 group-hover:bg-white/30 transition-colors">
          <Mic className="w-4 h-4 text-white animate-pulse" />
          <span className="absolute -top-1 -right-1 flex h-2.5 w-2.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
          </span>
        </div>

        <div className="text-left leading-tight">
          <div className="flex items-center gap-1.5 font-bold">
            <span>Talk to Zyro AI</span>
            <span className="bg-indigo-400/30 text-[10px] px-1.5 py-0.5 rounded text-indigo-100 font-semibold border border-indigo-300/30 flex items-center gap-0.5">
              <Sparkles className="w-2.5 h-2.5 text-amber-300" />
              Voice
            </span>
          </div>
          <div className="text-[11px] text-indigo-200 font-medium flex items-center gap-1">
            <span>English & ಕನ್ನಡ</span>
            <span className="text-emerald-300 text-[10px]">● Live</span>
          </div>
        </div>
      </button>
    </div>
  );
};
