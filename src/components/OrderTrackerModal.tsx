import React, { useState, useEffect } from 'react';
import { api } from '../services/api.ts';
import { Order } from '../types/index.ts';
import { useApp } from '../context/AppContext.tsx';
import {
  X,
  Truck,
  MapPin,
  Clock,
  PhoneCall,
  CheckCircle2,
  Copy,
  ExternalLink,
  MessageSquare,
  ShieldCheck,
  Zap,
  Phone,
} from 'lucide-react';

interface OrderTrackerModalProps {
  orderId: string;
  onClose: () => void;
}

export const OrderTrackerModal: React.FC<OrderTrackerModalProps> = ({ orderId, onClose }) => {
  const { showToast, openCallingGateway } = useApp();
  const [loading, setLoading] = useState(true);
  const [order, setOrder] = useState<Order | null>(null);
  const [tracking, setTracking] = useState<any | null>(null);
  const [copiedLink, setCopiedLink] = useState(false);
  const [sendingSms, setSendingSms] = useState(false);

  useEffect(() => {
    async function loadTrackingData() {
      setLoading(true);
      try {
        const res = await api.trackOrder(orderId);
        if (res?.order && res?.trackingInfo) {
          setOrder(res.order);
          setTracking(res.trackingInfo);
        }
      } catch (err: any) {
        showToast(`Tracking error: ${err.message}`, 'error');
      } finally {
        setLoading(false);
      }
    }
    loadTrackingData();
  }, [orderId]);

  const handleSendSmsTracking = async () => {
    if (!order) return;
    setSendingSms(true);
    try {
      const res = await api.sendTrackingLinkSms(order.id);
      showToast(`Tracking link dispatched via SMS to ${res.recipientPhone}!`, 'success');
    } catch (err: any) {
      showToast(`SMS dispatch note: ${err.message}`, 'error');
    } finally {
      setSendingSms(false);
    }
  };

  const handleCopyLink = () => {
    if (!tracking?.trackingUrl) return;
    navigator.clipboard.writeText(tracking.trackingUrl);
    setCopiedLink(true);
    showToast('Tracking URL copied to clipboard!', 'success');
    setTimeout(() => setCopiedLink(false), 2500);
  };

  if (loading) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-md p-4">
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-8 max-w-md w-full text-center space-y-4 shadow-2xl">
          <Truck className="w-12 h-12 text-indigo-400 mx-auto animate-bounce" />
          <p className="text-slate-200 font-semibold text-lg">Connecting to Courier Partner API...</p>
          <p className="text-slate-400 text-xs">Retrieving live GPS milestones & courier status...</p>
        </div>
      </div>
    );
  }

  if (!order || !tracking) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-md p-4">
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 max-w-md w-full text-center space-y-4">
          <p className="text-rose-400 font-bold">Unable to locate shipment details.</p>
          <button
            onClick={onClose}
            className="px-6 py-2 bg-slate-800 text-white rounded-xl text-xs font-semibold cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/85 backdrop-blur-md p-4 overflow-y-auto animate-in fade-in">
      <div className="bg-slate-900 border border-indigo-900/50 rounded-3xl max-w-2xl w-full p-6 sm:p-8 space-y-6 shadow-2xl relative text-white my-8">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-indigo-500/20 text-indigo-400 rounded-2xl border border-indigo-500/30">
              <Truck className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-black text-white">Live Courier Tracking</h2>
                <span className="text-xs bg-indigo-500/20 text-indigo-300 font-bold px-2.5 py-0.5 rounded-full border border-indigo-500/30">
                  {tracking.courierPartner}
                </span>
              </div>
              <p className="text-xs text-slate-400">Order #{tracking.orderNumber} • AWB: {tracking.awbTrackingNumber}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-full transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Live Status Card */}
        <div className="bg-gradient-to-br from-indigo-950/80 via-slate-900 to-slate-900 border border-indigo-800/40 rounded-2xl p-5 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <span className="text-xs text-slate-400 uppercase tracking-wider font-bold">Current Status</span>
              <h3 className="text-lg font-black text-emerald-400 flex items-center gap-2 mt-0.5">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping"></span>
                {tracking.statusLabel}
              </h3>
            </div>
            <div className="text-right">
              <span className="text-xs text-slate-400 uppercase tracking-wider font-bold">Estimated Arrival</span>
              <p className="text-sm font-extrabold text-white mt-0.5">{tracking.estimatedDeliveryDate}</p>
              <p className="text-xs text-indigo-300">{tracking.estimatedDeliveryTimeWindow}</p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 text-xs border-t border-indigo-900/30">
            <div className="flex items-center gap-2 text-slate-300">
              <MapPin className="w-4 h-4 text-rose-400 shrink-0" />
              <span className="truncate">Location: <strong>{tracking.currentLocation}</strong></span>
            </div>
            <div className="flex items-center justify-between gap-2 text-slate-300">
              <div className="flex items-center gap-2 truncate">
                <Phone className="w-4 h-4 text-sky-400 shrink-0" />
                <span className="truncate">Partner: <strong>{tracking.riderName}</strong></span>
              </div>
              {tracking.carrierPhone && (
                <a
                  href={`tel:${tracking.carrierPhone.replace(/\s+/g, '')}`}
                  className="px-2.5 py-1 bg-emerald-600/30 border border-emerald-500/40 hover:bg-emerald-600 text-emerald-300 hover:text-white rounded-lg text-[11px] font-mono font-bold shrink-0 transition flex items-center gap-1"
                >
                  <Phone className="w-3 h-3" />
                  <span>Call {tracking.carrierPhone}</span>
                </a>
              )}
            </div>
          </div>
        </div>

        {/* Milestone Timeline */}
        <div className="space-y-3">
          <h4 className="text-xs font-extrabold uppercase tracking-wider text-slate-400">Shipment Milestone Progress</h4>
          <div className="space-y-4 pl-2">
            {tracking.milestones?.map((m: any, idx: number) => (
              <div key={idx} className="flex gap-4 relative">
                {idx < tracking.milestones.length - 1 && (
                  <div className={`absolute left-3.5 top-6 bottom-0 w-0.5 ${m.completed ? 'bg-emerald-500' : 'bg-slate-800'}`}></div>
                )}
                <div className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 z-10 ${m.completed ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40' : 'bg-slate-800 text-slate-600 border border-slate-700'}`}>
                  <CheckCircle2 className="w-4 h-4" />
                </div>
                <div className="space-y-0.5 pb-2">
                  <div className="flex items-center gap-2">
                    <p className={`text-xs sm:text-sm font-bold ${m.completed ? 'text-white' : 'text-slate-500'}`}>{m.title}</p>
                    {m.timestamp && <span className="text-[10px] text-slate-400">({new Date(m.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })})</span>}
                  </div>
                  <p className="text-xs text-slate-400">{m.description}</p>
                  <p className="text-[11px] text-indigo-300 font-medium">📍 {m.location}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-4 border-t border-slate-800">
          <div className="flex items-center gap-2">
            <button
              onClick={handleCopyLink}
              className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-xs rounded-xl flex items-center gap-1.5 transition cursor-pointer"
            >
              {copiedLink ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copiedLink ? 'Copied Link!' : 'Copy Link'}</span>
            </button>
            <button
              onClick={handleSendSmsTracking}
              disabled={sendingSms}
              className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-xs rounded-xl flex items-center gap-1.5 transition cursor-pointer"
            >
              <MessageSquare className="w-3.5 h-3.5 text-sky-400" />
              <span>{sendingSms ? 'Sending SMS...' : 'Send SMS Link'}</span>
            </button>
          </div>

          <button
            onClick={() => {
              onClose();
              openCallingGateway({
                customerName: order.shippingAddress?.name || order.customerName || 'Customer',
                customerPhone: order.shippingAddress?.phone || order.customerPhone || '+91 98450 12345',
                callReason: 'delivery_tracking',
                orderId: order.id,
              });
            }}
            className="px-5 py-2.5 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-extrabold text-xs sm:text-sm rounded-xl flex items-center gap-2 shadow-lg shadow-emerald-500/20 transition cursor-pointer"
          >
            <PhoneCall className="w-4 h-4" />
            <span>Ask Enquiry Bot for Voice Update</span>
          </button>
        </div>
      </div>
    </div>
  );
};
