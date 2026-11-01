import React, { useState, useEffect, useRef } from 'react';
import { useApp } from '../context/AppContext.tsx';
import { Order, OrderStatus } from '../types/index.ts';
import { api } from '../services/api.ts';
import { OrderTrackerModal } from './OrderTrackerModal.tsx';
import {
  Package,
  Clock,
  MapPin,
  CheckCircle2,
  AlertCircle,
  Truck,
  Sparkles,
  Phone,
  RotateCcw,
  XCircle,
  ChevronRight,
  ShieldCheck,
  User,
  Zap,
  RefreshCw,
  FileText,
  Navigation,
  Play,
  Pause,
  MessageSquare,
  Printer,
  Compass,
  PhoneCall,
  Copy,
  Check,
} from 'lucide-react';

export const CustomerDashboard: React.FC = () => {
  const { user, showToast, setActiveTab, startCallingBot, openCallingGateway } = useApp();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastSyncTime, setLastSyncTime] = useState<Date>(new Date());
  const [copiedRiderPhone, setCopiedRiderPhone] = useState(false);

  const handleCopyRiderPhone = (phoneNum = '90193 63368') => {
    navigator.clipboard.writeText(phoneNum.replace(/\s+/g, ''));
    setCopiedRiderPhone(true);
    showToast(`Delivery Agent phone number copied: ${phoneNum}`, 'success');
    setTimeout(() => setCopiedRiderPhone(false), 2000);
  };
  
  // Tracking Modal State
  const [activeTrackingOrderId, setActiveTrackingOrderId] = useState<string | null>(null);
  
  // Real-time Simulation mode toggle for live order progress demo
  const [autoSimulate, setAutoSimulate] = useState(false);
  const [showInvoiceModal, setShowInvoiceModal] = useState(false);

  // Live countdown timer state (for Express 30-min orders)
  const [countdownSeconds, setCountdownSeconds] = useState<number>(18 * 60 + 45); // 18 mins default

  const stages: OrderStatus[] = [
    'ORDER_PLACED',
    'ACCEPTED',
    'PREPARING',
    'READY_FOR_DISPATCH',
    'SHIPPED',
    'OUT_FOR_DELIVERY',
    'DELIVERED',
  ];

  const fetchOrders = async (silent = false) => {
    if (!silent) setIsRefreshing(true);
    try {
      const data = await api.getOrders();
      setOrders(data);
      setLastSyncTime(new Date());
      if (data.length > 0 && (!selectedOrderId || !data.some((o) => o.id === selectedOrderId))) {
        setSelectedOrderId(data[0].id);
      }
    } catch (err: any) {
      if (!silent) showToast(`Failed to load orders: ${err.message}`, 'error');
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  };

  // 1. Live Polling Effect: Auto-refresh order status every 4 seconds
  useEffect(() => {
    fetchOrders(true);
    const interval = setInterval(() => {
      fetchOrders(true);
    }, 4000);
    return () => clearInterval(interval);
  }, [user]);

  // 2. Express Delivery Countdown Timer
  useEffect(() => {
    const timer = setInterval(() => {
      setCountdownSeconds((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // 3. Auto-Simulate Live Progress (Advances order stage every 8 seconds when enabled)
  useEffect(() => {
    if (!autoSimulate || !selectedOrderId) return;

    const simInterval = setInterval(async () => {
      const currentOrder = orders.find((o) => o.id === selectedOrderId);
      if (!currentOrder || currentOrder.orderStatus === 'DELIVERED' || currentOrder.orderStatus === 'CANCELLED') {
        setAutoSimulate(false);
        return;
      }

      const currentIndex = stages.indexOf(currentOrder.orderStatus);
      if (currentIndex >= 0 && currentIndex < stages.length - 1) {
        const nextStage = stages[currentIndex + 1];
        try {
          await api.updateOrderStatus(
            selectedOrderId,
            nextStage,
            `Live Automated Order Dispatch System: Status updated to ${nextStage.replace(/_/g, ' ')}`
          );
          showToast(`Live Update: Order status is now ${nextStage.replace(/_/g, ' ')}!`, 'info');
          fetchOrders(true);
        } catch (e) {
          setAutoSimulate(false);
        }
      } else {
        setAutoSimulate(false);
      }
    }, 8000);

    return () => clearInterval(simInterval);
  }, [autoSimulate, selectedOrderId, orders]);

  const handleCancelOrder = async (orderId: string) => {
    if (!confirm('Are you sure you want to cancel this order? Reserved stock will be immediately restocked to the catalogue.')) {
      return;
    }
    try {
      await api.updateOrderStatus(orderId, 'CANCELLED', 'Order cancelled by customer. Stock restored to inventory.');
      showToast('Order cancelled and inventory restored.', 'info');
      fetchOrders();
    } catch (err: any) {
      showToast(`Cancellation error: ${err.message}`, 'error');
    }
  };

  const handleAdvanceStage = async () => {
    if (!selectedOrder) return;
    const currentIndex = stages.indexOf(selectedOrder.orderStatus);
    if (currentIndex >= 0 && currentIndex < stages.length - 1) {
      const nextStage = stages[currentIndex + 1];
      try {
        await api.updateOrderStatus(
          selectedOrder.id,
          nextStage,
          `Customer Dashboard Simulator: Advanced order to ${nextStage.replace(/_/g, ' ')}`
        );
        showToast(`Order status updated to ${nextStage.replace(/_/g, ' ')}`, 'success');
        fetchOrders();
      } catch (err: any) {
        showToast(`Failed to update status: ${err.message}`, 'error');
      }
    }
  };

  const selectedOrder = orders.find((o) => o.id === selectedOrderId);

  const getStageIndex = (status: OrderStatus) => stages.indexOf(status);
  const currentStageIdx = selectedOrder ? getStageIndex(selectedOrder.orderStatus) : 0;
  const progressPercent = selectedOrder
    ? selectedOrder.orderStatus === 'CANCELLED'
      ? 0
      : Math.min(100, Math.round(((currentStageIdx + 1) / stages.length) * 100))
    : 0;

  // Format countdown mm:ss
  const formatCountdown = (totalSecs: number) => {
    const mins = Math.floor(totalSecs / 60);
    const secs = totalSecs % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-in fade-in">
      {/* Top Real-time Header */}
      <div className="bg-white rounded-3xl border border-slate-200 p-6 mb-8 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-indigo-600 text-white font-extrabold text-xl flex items-center justify-center shadow-lg shadow-indigo-600/20">
            {user?.name ? user.name.slice(0, 1) : 'C'}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-extrabold text-slate-900">{user?.name || 'Valued Customer'}</h1>
              <span className="bg-indigo-100 text-indigo-700 text-[10px] font-bold px-2 py-0.5 rounded-full">
                Real-Time Order Tracking Active
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              {user?.email} • {user?.phone}
            </p>
          </div>
        </div>

        {/* Sync Status Badge & Refresh Controls */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2 bg-emerald-50 border border-emerald-200 px-3 py-1.5 rounded-xl text-xs text-emerald-800 font-semibold">
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
            </span>
            <span>Live Sync ({lastSyncTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })})</span>
          </div>

          <button
            onClick={() => fetchOrders()}
            disabled={isRefreshing}
            className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl border border-slate-200 flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-slate-600 ${isRefreshing ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>

          <button
            onClick={() => setActiveTab('storefront')}
            className="px-4 py-1.5 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl shadow-xs transition-colors cursor-pointer"
          >
            Explore Catalogue
          </button>
        </div>
      </div>

      {loading ? (
        <div className="p-16 text-center text-slate-500 text-sm flex items-center justify-center gap-2">
          <RefreshCw className="w-5 h-5 text-indigo-600 animate-spin" />
          <span>Fetching real-time order tracking data...</span>
        </div>
      ) : orders.length === 0 ? (
        <div className="bg-white rounded-3xl border border-slate-200 p-12 text-center shadow-xs">
          <Package className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <h3 className="text-lg font-bold text-slate-900">No Orders Placed Yet</h3>
          <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
            You haven't placed any orders yet. Select a product or talk to Enquiry Bot to place your first order with real-time tracking!
          </p>
          <button
            onClick={() => setActiveTab('storefront')}
            className="mt-4 px-4 py-2 bg-indigo-600 text-white font-bold text-xs rounded-xl cursor-pointer shadow-lg shadow-indigo-600/30"
          >
            Start Shopping Now
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Left Column: Orders History List */}
          <div className="lg:col-span-4 space-y-3">
            <div className="flex items-center justify-between px-1">
              <h2 className="text-xs font-extrabold uppercase tracking-wider text-slate-500">
                Your Orders ({orders.length})
              </h2>
              <span className="text-[10px] text-indigo-600 font-bold">Auto-Polling Active</span>
            </div>

            <div className="space-y-3">
              {orders.map((ord) => {
                const isSelected = ord.id === selectedOrderId;
                const isCancelled = ord.orderStatus === 'CANCELLED';
                const isDelivered = ord.orderStatus === 'DELIVERED';

                return (
                  <div
                    key={ord.id}
                    onClick={() => setSelectedOrderId(ord.id)}
                    className={`p-4 rounded-2xl border transition-all cursor-pointer ${
                      isSelected
                        ? 'border-indigo-600 bg-indigo-50/50 shadow-md ring-2 ring-indigo-500/20'
                        : 'border-slate-200 bg-white hover:border-slate-300 shadow-xs'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-extrabold text-xs text-slate-900 font-mono flex items-center gap-1">
                        <Package className="w-3.5 h-3.5 text-indigo-600" />
                        #{ord.orderNumber}
                      </span>
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wide ${
                          isCancelled
                            ? 'bg-rose-100 text-rose-800'
                            : isDelivered
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-indigo-100 text-indigo-800 animate-pulse'
                        }`}
                      >
                        {ord.orderStatus.replace(/_/g, ' ')}
                      </span>
                    </div>

                    <div className="text-xs text-slate-600 space-y-1">
                      <div className="font-semibold text-slate-900 truncate">
                        {ord.items.map((it) => `${it.quantity}x ${it.productName}`).join(', ')}
                      </div>
                      <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1">
                        <span>Total: ₹{ord.totalAmount.toLocaleString('en-IN')}</span>
                        <span>{new Date(ord.createdAt).toLocaleDateString()}</span>
                      </div>
                    </div>

                    {ord.isExpress30Min && (
                      <div className="mt-2.5 flex items-center justify-between text-[10px] font-bold text-emerald-800 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200/80">
                        <span className="flex items-center gap-1">
                          <Zap className="w-3 h-3 text-emerald-600 fill-emerald-600" />
                          30-Min Express Delivery
                        </span>
                        <span>{ord.orderStatus === 'DELIVERED' ? 'Fulfilled' : 'In Transit'}</span>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Right Column: Interactive Real-Time Tracking Dashboard */}
          <div className="lg:col-span-8">
            {selectedOrder ? (
              <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-xs space-y-6">
                {/* Order Header & Action Bar */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-5">
                  <div>
                    <div className="flex items-center gap-2">
                      <h2 className="text-xl font-extrabold text-slate-900 font-mono">
                        Order #{selectedOrder.orderNumber}
                      </h2>
                      {selectedOrder.aiAssisted && (
                        <span className="bg-indigo-100 text-indigo-800 text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
                          <Sparkles className="w-3 h-3 text-indigo-600" />
                          Enquiry Bot Order
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-500 mt-1">
                      Placed on {new Date(selectedOrder.createdAt).toLocaleString()} • ID: {selectedOrder.id}
                    </p>
                  </div>

                  {/* Actions Bar */}
                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      onClick={() => setShowInvoiceModal(true)}
                      className="px-3 py-1.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-bold transition-colors cursor-pointer flex items-center gap-1.5"
                    >
                      <Printer className="w-3.5 h-3.5 text-slate-500" />
                      <span>Invoice</span>
                    </button>
                    <button
                      onClick={() => {
                        const firstItem = selectedOrder.items[0];
                        if (firstItem) {
                          startCallingBot({
                            id: firstItem.productId,
                            name: firstItem.productName,
                            category: firstItem.category,
                          } as any);
                        }
                      }}
                      className="px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition-colors cursor-pointer flex items-center gap-1.5 shadow-md shadow-indigo-600/20"
                    >
                      <MessageSquare className="w-3.5 h-3.5" />
                      <span>Ask Enquiry Bot</span>
                    </button>
                    <button
                      onClick={() => setActiveTrackingOrderId(selectedOrder.id)}
                      className="px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition-colors cursor-pointer flex items-center gap-1.5 shadow-md shadow-indigo-600/20"
                      title="View live AWB tracking & courier partner progress"
                    >
                      <Truck className="w-3.5 h-3.5" />
                      <span>Track Shipment</span>
                    </button>

                    <button
                      onClick={() => {
                        openCallingGateway({
                          customerPhone: selectedOrder.customerPhone || user?.phone,
                          customerName: selectedOrder.customerName || user?.name,
                          callReason: 'delivery_tracking',
                          orderId: selectedOrder.id,
                        });
                      }}
                      className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition-colors cursor-pointer flex items-center gap-1.5 shadow-md shadow-emerald-600/20"
                      title="Request a live phone call to your mobile number via Twilio Gateway"
                    >
                      <PhoneCall className="w-3.5 h-3.5" />
                      <span>Request AI Call</span>
                    </button>

                    {selectedOrder.orderStatus !== 'DELIVERED' &&
                      selectedOrder.orderStatus !== 'CANCELLED' && (
                        <button
                          onClick={() => handleCancelOrder(selectedOrder.id)}
                          className="px-3 py-1.5 rounded-xl border border-rose-200 text-rose-600 hover:bg-rose-50 text-xs font-bold transition-colors cursor-pointer flex items-center gap-1"
                        >
                          <XCircle className="w-3.5 h-3.5" />
                          <span>Cancel</span>
                        </button>
                      )}
                  </div>
                </div>

                {/* Real-time Order Progress Bar & Live Status Hero */}
                <div className="bg-slate-900 text-white p-6 rounded-3xl relative overflow-hidden shadow-xl">
                  {/* Subtle Background Glow */}
                  <div className="absolute -right-12 -top-12 w-48 h-48 bg-indigo-500/20 rounded-full blur-2xl pointer-events-none" />
                  <div className="absolute -left-12 -bottom-12 w-48 h-48 bg-emerald-500/20 rounded-full blur-2xl pointer-events-none" />

                  <div className="relative z-10 space-y-5">
                    {/* Top Status & ETA row */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-4">
                      <div>
                        <span className="text-[10px] uppercase font-bold tracking-widest text-indigo-400">
                          Current Live Status
                        </span>
                        <h3 className="text-2xl font-black text-white flex items-center gap-2 mt-0.5">
                          <span>{selectedOrder.orderStatus.replace(/_/g, ' ')}</span>
                          {selectedOrder.orderStatus !== 'DELIVERED' && selectedOrder.orderStatus !== 'CANCELLED' && (
                            <span className="w-3 h-3 rounded-full bg-emerald-400 animate-ping" />
                          )}
                        </h3>
                      </div>

                      {/* Dynamic ETA Widget */}
                      <div className="bg-slate-800/80 border border-slate-700/80 px-4 py-2.5 rounded-2xl flex items-center gap-3">
                        <Clock className="w-6 h-6 text-emerald-400 animate-bounce" />
                        <div>
                          <div className="text-[10px] uppercase tracking-wider text-slate-400 font-bold">
                            Estimated Arrival
                          </div>
                          <div className="text-sm font-extrabold text-white font-mono">
                            {selectedOrder.orderStatus === 'DELIVERED' ? (
                              <span className="text-emerald-400">Delivered Successfully!</span>
                            ) : selectedOrder.orderStatus === 'CANCELLED' ? (
                              <span className="text-rose-400">Order Cancelled</span>
                            ) : selectedOrder.isExpress30Min ? (
                              <span className="text-emerald-300 font-black">
                                Arriving in {formatCountdown(countdownSeconds)}
                              </span>
                            ) : (
                              selectedOrder.estimatedDeliveryTime
                            )}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Progress Bar */}
                    <div>
                      <div className="flex items-center justify-between text-xs text-slate-400 mb-2 font-medium">
                        <span>Overall Fulfilment Progress</span>
                        <span className="font-mono font-bold text-indigo-300">{progressPercent}% Completed</span>
                      </div>
                      <div className="w-full bg-slate-800 rounded-full h-3 p-0.5 overflow-hidden border border-slate-700">
                        <div
                          className={`h-full rounded-full transition-all duration-700 ${
                            selectedOrder.orderStatus === 'CANCELLED'
                              ? 'bg-rose-500'
                              : selectedOrder.orderStatus === 'DELIVERED'
                              ? 'bg-emerald-500'
                              : 'bg-gradient-to-r from-indigo-500 via-purple-500 to-emerald-400'
                          }`}
                          style={{ width: `${progressPercent}%` }}
                        />
                      </div>
                    </div>

                    {/* Stage Step Dots */}
                    <div className="grid grid-cols-7 gap-1 text-center pt-2">
                      {stages.map((stg, i) => {
                        const isDone = i <= currentStageIdx && selectedOrder.orderStatus !== 'CANCELLED';
                        const isCurrent = i === currentStageIdx && selectedOrder.orderStatus !== 'CANCELLED';

                        return (
                          <div key={stg} className="flex flex-col items-center gap-1">
                            <div
                              className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold border transition-all ${
                                isCurrent
                                  ? 'bg-emerald-500 text-slate-950 border-emerald-300 ring-2 ring-emerald-400/50 scale-110'
                                  : isDone
                                  ? 'bg-indigo-600 text-white border-indigo-500'
                                  : 'bg-slate-800 text-slate-500 border-slate-700'
                              }`}
                            >
                              {i + 1}
                            </div>
                            <span className="text-[9px] font-bold uppercase tracking-tight hidden sm:block truncate w-full text-slate-400">
                              {stg.split('_')[0]}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>

                {/* Simulation Control Bar for Demonstration */}
                <div className="bg-indigo-50 border border-indigo-200 p-4 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
                  <div className="flex items-center gap-2">
                    <Compass className="w-4 h-4 text-indigo-600 shrink-0" />
                    <div>
                      <span className="font-extrabold text-indigo-950 block">Real-Time Delivery Simulation Tool</span>
                      <span className="text-indigo-700">Advance order stages in real time to test customer live updates.</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 w-full sm:w-auto">
                    <button
                      onClick={handleAdvanceStage}
                      disabled={selectedOrder.orderStatus === 'DELIVERED' || selectedOrder.orderStatus === 'CANCELLED'}
                      className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-300 text-white font-bold text-xs rounded-xl shadow-xs transition-colors cursor-pointer flex-1 sm:flex-none text-center"
                    >
                      Next Stage ➔
                    </button>

                    <button
                      onClick={() => setAutoSimulate(!autoSimulate)}
                      disabled={selectedOrder.orderStatus === 'DELIVERED' || selectedOrder.orderStatus === 'CANCELLED'}
                      className={`px-3 py-1.5 font-bold text-xs rounded-xl border flex items-center gap-1.5 transition-colors cursor-pointer flex-1 sm:flex-none justify-center ${
                        autoSimulate
                          ? 'bg-amber-600 text-white border-amber-500 animate-pulse'
                          : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50'
                      }`}
                    >
                      {autoSimulate ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
                      <span>{autoSimulate ? 'Stop Auto-Run' : 'Auto-Advance'}</span>
                    </button>
                  </div>
                </div>

                {/* Interactive Simulated Live Map & Rider Tracking Widget */}
                {selectedOrder.orderStatus !== 'CANCELLED' && (
                  <div className="bg-slate-50 border border-slate-200 rounded-3xl p-5 space-y-4">
                    <div className="flex items-center justify-between">
                      <h3 className="font-extrabold text-slate-900 text-sm flex items-center gap-2">
                        <Navigation className="w-4 h-4 text-indigo-600" />
                        <span>Live Delivery Route & Map</span>
                      </h3>
                      <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full">
                        GPS Live Tracking Active
                      </span>
                    </div>

                    {/* Map Visual Canvas */}
                    <div className="relative h-44 bg-slate-900 rounded-2xl overflow-hidden border border-slate-800 shadow-inner flex flex-col justify-between p-4">
                      {/* Grid Pattern overlay */}
                      <div className="absolute inset-0 opacity-20 bg-[radial-gradient(#6366f1_1px,transparent_1px)] [background-size:16px_16px]" />

                      {/* Route Line */}
                      <div className="absolute top-1/2 left-10 right-10 h-1 bg-indigo-500/40 -translate-y-1/2 border-t border-dashed border-indigo-400" />

                      {/* Store Marker */}
                      <div className="absolute top-1/2 left-8 -translate-y-1/2 flex flex-col items-center gap-1 z-10">
                        <div className="w-9 h-9 rounded-full bg-indigo-600 text-white flex items-center justify-center font-bold shadow-lg ring-4 ring-indigo-900">
                          <Package className="w-4 h-4" />
                        </div>
                        <span className="text-[10px] font-extrabold text-white bg-slate-950/80 px-2 py-0.5 rounded border border-slate-800">
                          TrendVibe Hub
                        </span>
                      </div>

                      {/* Rider Marker (Moves based on stage) */}
                      <div
                        className="absolute top-1/2 -translate-y-1/2 flex flex-col items-center gap-1 z-20 transition-all duration-1000"
                        style={{
                          left: `${Math.min(85, Math.max(15, progressPercent - 5))}%`,
                        }}
                      >
                        <div className="w-10 h-10 rounded-full bg-emerald-500 text-slate-950 flex items-center justify-center font-bold shadow-xl ring-4 ring-emerald-950 animate-bounce">
                          <Truck className="w-5 h-5" />
                        </div>
                        <span className="text-[10px] font-bold text-emerald-300 bg-slate-950/90 px-2 py-0.5 rounded border border-emerald-900 flex items-center gap-1">
                          <Zap className="w-3 h-3 text-emerald-400" />
                          Rider En Route
                        </span>
                      </div>

                      {/* Customer Destination Marker */}
                      <div className="absolute top-1/2 right-8 -translate-y-1/2 flex flex-col items-center gap-1 z-10">
                        <div className="w-9 h-9 rounded-full bg-rose-600 text-white flex items-center justify-center font-bold shadow-lg ring-4 ring-rose-900">
                          <MapPin className="w-4 h-4" />
                        </div>
                        <span className="text-[10px] font-extrabold text-white bg-slate-950/80 px-2 py-0.5 rounded border border-slate-800">
                          Your Doorstep
                        </span>
                      </div>
                    </div>

                    {/* Delivery Partner Info Bar - High Visibility Delivery Agent Number */}
                    <div className="bg-white p-5 rounded-2xl border-2 border-emerald-400 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                      <div className="flex items-start sm:items-center gap-3.5">
                        <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-800 font-black flex items-center justify-center shrink-0 border border-emerald-200">
                          <User className="w-6 h-6" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2 flex-wrap">
                            <h4 className="font-black text-slate-900 text-sm">Ramesh Kumar</h4>
                            <span className="text-[11px] font-extrabold bg-amber-100 text-amber-800 px-2 py-0.5 rounded-md border border-amber-300">
                              ★ 4.9 Rating
                            </span>
                            <span className="text-[10px] font-bold bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full border border-emerald-300">
                              Assigned Express Rider
                            </span>
                          </div>
                          <p className="text-xs text-slate-600 font-medium mt-0.5">
                            TrendVibe Hyperlocal Express Rider • Scooter <strong className="text-slate-900 font-bold">KA 01 EV 4821</strong>
                          </p>
                          
                          {/* Dedicated, High-Contrast Delivery Agent Number Display */}
                          <div className="mt-2.5 flex items-center gap-2.5 flex-wrap">
                            <span className="text-xs font-black text-slate-700 uppercase tracking-wide flex items-center gap-1">
                              <Phone className="w-3.5 h-3.5 text-emerald-600" />
                              <span>Delivery Agent Number:</span>
                            </span>
                            <span className="text-base font-black font-mono text-emerald-950 bg-emerald-100 px-3 py-1 rounded-lg border-2 border-emerald-300 tracking-wider shadow-inner">
                              90193 63368
                            </span>
                            <span className="text-xs font-mono font-bold text-slate-600">
                              (+91 90193 63368)
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Prominent Call & Copy Actions */}
                      <div className="flex items-center gap-2 w-full md:w-auto shrink-0 pt-2 md:pt-0">
                        <button
                          type="button"
                          onClick={() => handleCopyRiderPhone('90193 63368')}
                          className="px-3.5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs rounded-xl transition-colors flex items-center justify-center gap-1.5 cursor-pointer border border-slate-300 shadow-xs"
                          title="Copy Delivery Agent Number"
                        >
                          {copiedRiderPhone ? (
                            <>
                              <Check className="w-4 h-4 text-emerald-600" />
                              <span className="text-emerald-700 font-bold">Copied!</span>
                            </>
                          ) : (
                            <>
                              <Copy className="w-4 h-4 text-slate-600" />
                              <span>Copy Number</span>
                            </>
                          )}
                        </button>

                        <a
                          href="tel:+919019363368"
                          className="flex-1 md:flex-none px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-xs sm:text-sm rounded-xl shadow-md shadow-emerald-600/30 transition-all flex items-center justify-center gap-2 cursor-pointer"
                        >
                          <Phone className="w-4 h-4" />
                          <span>Call 90193 63368</span>
                        </a>
                      </div>
                    </div>
                  </div>
                )}

                {/* Timeline History Feed */}
                <div className="space-y-4 pt-2">
                  <h3 className="font-extrabold text-slate-900 text-sm flex items-center gap-1.5">
                    <Clock className="w-4 h-4 text-indigo-600" />
                    <span>Real-Time Event Timeline</span>
                  </h3>

                  <div className="relative pl-6 space-y-5 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200">
                    {selectedOrder.timeline.map((evt, idx) => {
                      const isLatest = idx === selectedOrder.timeline.length - 1;
                      return (
                        <div key={idx} className="relative">
                          <span
                            className={`absolute -left-6 top-1 w-3.5 h-3.5 rounded-full border-2 bg-white ${
                              isLatest
                                ? 'border-indigo-600 bg-indigo-600 ring-4 ring-indigo-100'
                                : 'border-emerald-500 bg-emerald-500'
                            }`}
                          />
                          <div className="text-xs bg-slate-50 p-3 rounded-2xl border border-slate-200">
                            <div className="flex items-center justify-between mb-1">
                              <span className="font-extrabold text-slate-900 uppercase tracking-wide">
                                {evt.status.replace(/_/g, ' ')}
                              </span>
                              <span className="text-[11px] text-slate-400 font-mono">
                                {new Date(evt.timestamp).toLocaleTimeString([], {
                                  hour: '2-digit',
                                  minute: '2-digit',
                                })}
                              </span>
                            </div>
                            <p className="text-slate-700">{evt.note}</p>
                            <span className="text-[10px] text-slate-400 block mt-1 font-medium">By: {evt.actor}</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Items Purchased List */}
                <div className="space-y-3 pt-4 border-t border-slate-100">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                    Items in Order ({selectedOrder.items.length})
                  </h4>
                  <div className="divide-y divide-slate-100">
                    {selectedOrder.items.map((it, i) => (
                      <div key={i} className="py-2.5 flex items-center justify-between text-xs">
                        <div className="flex items-center gap-3">
                          <img
                            src={it.image}
                            alt={it.productName}
                            className="w-12 h-12 rounded-xl object-cover bg-slate-100 border border-slate-200"
                          />
                          <div>
                            <div className="font-bold text-slate-900">{it.productName}</div>
                            <div className="text-slate-500">
                              Qty: {it.quantity} × ₹{it.price}
                            </div>
                          </div>
                        </div>
                        <div className="font-bold text-slate-900 font-mono">
                          ₹{(it.quantity * it.price).toLocaleString('en-IN')}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Shipping, Delivery Partner & Payment Summary */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 pt-4 border-t border-slate-100 text-xs">
                  <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200">
                    <span className="font-bold text-slate-700 block mb-1">Delivery Destination:</span>
                    <p className="text-slate-900 font-semibold">{selectedOrder.shippingAddress.name}</p>
                    <p className="text-slate-600">{selectedOrder.shippingAddress.street}</p>
                    <p className="text-slate-600">
                      {selectedOrder.shippingAddress.city}, {selectedOrder.shippingAddress.pincode}
                    </p>
                    <p className="text-slate-500 mt-1 font-mono">Customer: {selectedOrder.customerPhone}</p>
                  </div>

                  {/* Dedicated Delivery Agent Card */}
                  <div className="bg-emerald-50/70 p-4 rounded-2xl border-2 border-emerald-300 space-y-1.5 flex flex-col justify-between shadow-xs">
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-bold text-emerald-950 flex items-center gap-1.5">
                          <Truck className="w-3.5 h-3.5 text-emerald-700" />
                          <span>Assigned Delivery Agent:</span>
                        </span>
                        <span className="text-[10px] font-bold bg-amber-100 text-amber-800 px-1.5 py-0.2 rounded border border-amber-300">
                          ★ 4.9
                        </span>
                      </div>
                      <p className="text-slate-900 font-extrabold text-sm">Ramesh Kumar</p>
                      <p className="text-slate-600 text-[11px]">TrendVibe Hyperlocal Express • Scooter KA 01 EV 4821</p>
                      
                      <div className="mt-2.5 bg-white p-2.5 rounded-xl border border-emerald-200 flex items-center justify-between gap-2">
                        <div>
                          <span className="text-[10px] uppercase font-bold text-slate-500 block">Agent Phone Number:</span>
                          <span className="text-sm font-black font-mono text-emerald-900">90193 63368</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => handleCopyRiderPhone('90193 63368')}
                            className="p-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg border border-slate-200 transition-colors"
                            title="Copy Agent Phone Number"
                          >
                            <Copy className="w-3.5 h-3.5" />
                          </button>
                          <a
                            href="tel:+919019363368"
                            className="px-2.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-lg shadow-xs flex items-center gap-1"
                          >
                            <Phone className="w-3 h-3" />
                            <span>Call</span>
                          </a>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-1.5">
                    <span className="font-bold text-slate-700 block mb-1">Payment & Charges:</span>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Method:</span>
                      <span className="font-bold text-slate-900">
                        {selectedOrder.paymentMethod === 'ONLINE_RAZORPAY' ? 'Razorpay Online' : selectedOrder.paymentMethod}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Status:</span>
                      <span className={`font-bold ${selectedOrder.paymentStatus === 'PAID' ? 'text-emerald-600' : 'text-amber-600'}`}>
                        {selectedOrder.paymentStatus}
                      </span>
                    </div>
                    {selectedOrder.paymentId && (
                      <div className="flex justify-between text-[11px]">
                        <span className="text-slate-500">Payment Ref:</span>
                        <span className="font-mono text-slate-700 truncate max-w-[150px]">{selectedOrder.paymentId}</span>
                      </div>
                    )}
                    <div className="flex justify-between border-t border-slate-200 pt-1 font-bold text-sm">
                      <span>Total Paid:</span>
                      <span className="text-indigo-600 font-mono">
                        ₹{selectedOrder.totalAmount.toLocaleString('en-IN')}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            ) : null}
          </div>
        </div>
      )}

      {/* Tax Invoice Modal Popup */}
      {showInvoiceModal && selectedOrder && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 space-y-5 shadow-2xl border border-slate-200 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-indigo-600" />
                <h3 className="font-extrabold text-slate-900 text-base">TAX INVOICE & RECEIPT</h3>
              </div>
              <button
                onClick={() => setShowInvoiceModal(false)}
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 flex items-center justify-center font-bold cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="text-xs space-y-4">
              <div className="flex justify-between border-b border-slate-100 pb-3">
                <div>
                  <h4 className="font-bold text-slate-900">TrendVibe Store Pvt Ltd</h4>
                  <p className="text-slate-500">GSTIN: 29AABCT1330R1ZM</p>
                  <p className="text-slate-500">Bangalore Hub, Karnataka 560038</p>
                </div>
                <div className="text-right">
                  <p className="font-mono font-bold text-indigo-600">#{selectedOrder.orderNumber}</p>
                  <p className="text-slate-500">{new Date(selectedOrder.createdAt).toLocaleDateString()}</p>
                </div>
              </div>

              <div>
                <span className="font-bold text-slate-700 block mb-1">Customer Billed To:</span>
                <p className="font-bold text-slate-900">{selectedOrder.customerName}</p>
                <p className="text-slate-600">{selectedOrder.customerEmail} • {selectedOrder.customerPhone}</p>
                <p className="text-slate-600">{selectedOrder.shippingAddress.street}, {selectedOrder.shippingAddress.city} {selectedOrder.shippingAddress.pincode}</p>
              </div>

              <table className="w-full text-left border-collapse border-t border-b border-slate-200 py-2">
                <thead>
                  <tr className="text-slate-400 font-bold border-b border-slate-200">
                    <th className="py-2">Item</th>
                    <th className="py-2 text-center">Qty</th>
                    <th className="py-2 text-right">Price</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {selectedOrder.items.map((it, idx) => (
                    <tr key={idx}>
                      <td className="py-2 font-semibold text-slate-900">{it.productName}</td>
                      <td className="py-2 text-center">{it.quantity}</td>
                      <td className="py-2 text-right font-mono">₹{(it.quantity * it.price).toLocaleString('en-IN')}</td>
                    </tr>
                  ))}
                </tbody>
              </table>

              <div className="space-y-1.5 text-slate-600 pt-2 border-t border-slate-100">
                <div className="flex justify-between">
                  <span>Subtotal:</span>
                  <span className="font-mono">₹{selectedOrder.subtotal.toLocaleString('en-IN')}</span>
                </div>
                <div className="flex justify-between">
                  <span>GST (5%):</span>
                  <span className="font-mono">₹{selectedOrder.tax.toLocaleString('en-IN')}</span>
                </div>
                <div className="flex justify-between">
                  <span>Shipping Fee:</span>
                  <span className="font-mono">{selectedOrder.shippingFee === 0 ? 'FREE' : `₹${selectedOrder.shippingFee}`}</span>
                </div>
                <div className="flex justify-between font-extrabold text-sm text-slate-900 border-t border-slate-200 pt-2">
                  <span>Total Amount Paid:</span>
                  <span className="text-indigo-600 font-mono">₹{selectedOrder.totalAmount.toLocaleString('en-IN')}</span>
                </div>
              </div>
            </div>

            <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
              <span className="text-[10px] text-slate-400">Authentic Computer Generated Invoice</span>
              <button
                onClick={() => window.print()}
                className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl cursor-pointer flex items-center gap-1.5"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Print Invoice</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Live Courier Order Tracking Modal */}
      {activeTrackingOrderId && (
        <OrderTrackerModal
          orderId={activeTrackingOrderId}
          onClose={() => setActiveTrackingOrderId(null)}
        />
      )}
    </div>
  );
};
