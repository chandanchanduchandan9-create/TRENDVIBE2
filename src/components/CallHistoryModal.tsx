import React, { useState, useEffect } from 'react';
import { api } from '../services/api.ts';
import {
  PhoneCall,
  X,
  Clock,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
  PhoneForwarded,
  FileText,
  User,
  Search,
  Filter,
} from 'lucide-react';

interface CallHistoryModalProps {
  onClose: () => void;
}

export const CallHistoryModal: React.FC<CallHistoryModalProps> = ({ onClose }) => {
  const [calls, setCalls] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedCall, setSelectedCall] = useState<any | null>(null);

  const fetchCalls = async () => {
    try {
      const data = await api.getCallHistory();
      setCalls(data || []);
      if (data && data.length > 0 && !selectedCall) {
        setSelectedCall(data[0]);
      }
    } catch (e: any) {
      console.warn('Failed to fetch call history:', e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCalls();
    const interval = setInterval(fetchCalls, 5000);
    return () => clearInterval(interval);
  }, []);

  const filteredCalls = calls.filter((c) => {
    const matchesStatus =
      filterStatus === 'all'
        ? true
        : filterStatus === 'in-progress'
        ? c.status === 'in-progress' || c.status === 'initiated' || c.status === 'ringing'
        : filterStatus === 'completed'
        ? c.status === 'completed'
        : filterStatus === 'failed'
        ? c.status === 'failed' || c.status === 'busy' || c.status === 'no-answer'
        : true;

    const matchesSearch =
      !searchQuery ||
      c.to?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.from?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.callSid?.toLowerCase().includes(searchQuery.toLowerCase());

    return matchesStatus && matchesSearch;
  });

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl shadow-2xl max-w-5xl w-full max-h-[90vh] flex flex-col overflow-hidden border border-slate-200">
        {/* Modal Header */}
        <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 p-6 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-indigo-500/20 text-indigo-300 flex items-center justify-center border border-indigo-400/30">
              <PhoneCall className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-black tracking-tight">Real-Time AI Call History & Status Logs</h2>
              <p className="text-xs text-slate-300">Live telemetry from Twilio Telephony & ElevenLabs / Gemini AI Agent</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={fetchCalls}
              className="px-3 py-1.5 bg-white/10 hover:bg-white/20 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition cursor-pointer"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Refresh</span>
            </button>
            <button
              onClick={onClose}
              className="w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Filters & Search Toolbar */}
        <div className="p-4 bg-slate-50 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2 flex-1 min-w-[240px]">
            <Search className="w-4 h-4 text-slate-400 ml-1" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by phone number or Call SID..."
              className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-indigo-500"
            />
          </div>

          <div className="flex items-center gap-2">
            <Filter className="w-3.5 h-3.5 text-slate-400" />
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs font-semibold text-slate-700 focus:outline-none focus:border-indigo-500"
            >
              <option value="all">All Statuses ({calls.length})</option>
              <option value="in-progress">Active / Initiated</option>
              <option value="completed">Completed Successfully</option>
              <option value="failed">Failed / Busy / No-Answer</option>
            </select>
          </div>
        </div>

        {/* Modal Body: Split Call List & Transcript Panel */}
        <div className="flex-1 overflow-hidden grid grid-cols-1 md:grid-cols-12 divide-y md:divide-y-0 md:divide-x divide-slate-200 bg-white">
          {/* Left: Call List */}
          <div className="md:col-span-5 overflow-y-auto p-4 space-y-2.5 max-h-[60vh] md:max-h-none">
            {loading ? (
              <div className="py-12 text-center text-slate-400 text-xs flex items-center justify-center gap-2">
                <RefreshCw className="w-4 h-4 animate-spin text-indigo-600" />
                <span>Loading live call logs...</span>
              </div>
            ) : filteredCalls.length === 0 ? (
              <div className="py-12 text-center text-slate-400 text-xs space-y-2">
                <PhoneCall className="w-8 h-8 mx-auto text-slate-300" />
                <p>No call logs found matching your filters.</p>
              </div>
            ) : (
              filteredCalls.map((call) => {
                const isSelected = selectedCall?.callSid === call.callSid;
                const status = call.status || 'initiated';
                const isCompleted = status === 'completed';
                const isActive = status === 'in-progress' || status === 'initiated' || status === 'ringing';

                return (
                  <div
                    key={call.callSid || call.id}
                    onClick={() => setSelectedCall(call)}
                    className={`p-3.5 rounded-2xl border transition-all cursor-pointer space-y-2 ${
                      isSelected
                        ? 'border-indigo-600 bg-indigo-50/70 shadow-sm ring-2 ring-indigo-500/20'
                        : 'border-slate-200 bg-slate-50/50 hover:bg-slate-100/80'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-mono font-bold text-slate-900 text-xs flex items-center gap-1.5">
                        <PhoneForwarded className="w-3.5 h-3.5 text-indigo-600" />
                        {call.to || call.from}
                      </span>
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wide ${
                          isCompleted
                            ? 'bg-emerald-100 text-emerald-800'
                            : isActive
                            ? 'bg-amber-100 text-amber-800 animate-pulse'
                            : 'bg-rose-100 text-rose-800'
                        }`}
                      >
                        {status}
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-[11px] text-slate-500">
                      <span>{new Date(call.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                      <span className="font-mono">{call.duration ? `${call.duration}s` : 'Active'} • {call.turnCount || 1} Turn(s)</span>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Right: Selected Call Transcript & Details */}
          <div className="md:col-span-7 overflow-y-auto p-5 space-y-5 bg-slate-900 text-white max-h-[60vh] md:max-h-none flex flex-col justify-between">
            {selectedCall ? (
              <div className="space-y-4">
                <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                  <div>
                    <h3 className="font-mono font-bold text-sm text-white">Call SID: {selectedCall.callSid}</h3>
                    <p className="text-xs text-slate-400 mt-0.5">
                      Target: {selectedCall.to} • From: {selectedCall.from}
                    </p>
                  </div>
                  <span className="text-[10px] font-bold uppercase px-2.5 py-1 rounded-lg bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                    {selectedCall.status}
                  </span>
                </div>

                <div className="space-y-3">
                  <h4 className="text-[11px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                    <FileText className="w-3.5 h-3.5 text-indigo-400" />
                    <span>Turn-by-Turn Conversation Transcript ({selectedCall.transcripts?.length || 0})</span>
                  </h4>

                  <div className="space-y-2.5 max-h-[300px] overflow-y-auto pr-2">
                    {selectedCall.transcripts?.map((t: any, idx: number) => (
                      <div
                        key={idx}
                        className={`p-3 rounded-2xl text-xs space-y-1 ${
                          t.sender === 'customer'
                            ? 'bg-slate-800 text-slate-200 border border-slate-700'
                            : 'bg-indigo-950/80 border border-indigo-800/60 text-indigo-100'
                        }`}
                      >
                        <div className="flex items-center justify-between text-[10px] text-slate-400">
                          <span className="font-bold uppercase tracking-wider text-indigo-300">
                            {t.sender === 'customer' ? '🗣️ Customer' : '🤖 Zyro AI Assistant'}
                          </span>
                          <span className="font-mono">{new Date(t.timestamp).toLocaleTimeString()}</span>
                        </div>
                        <p className="leading-relaxed">{t.text}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <div className="py-24 text-center text-slate-500 text-xs">
                Select a call log from the left to inspect conversation transcripts and telemetry details.
              </div>
            )}

            <div className="pt-4 border-t border-slate-800 text-[11px] text-slate-400 flex items-center justify-between">
              <span>Twilio Webhooks & Persistent MongoDB Log Synced</span>
              <span>Secure Telephony Gateway</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
