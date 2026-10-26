import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext.tsx';
import { Order, OrderStatus } from '../types/index.ts';
import { api } from '../services/api.ts';
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
} from 'lucide-react';

export const CustomerDashboard: React.FC = () => {
  const { user, showToast, setActiveTab } = useApp();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);

  const fetchOrders = async () => {
    try {
      const data = await api.getOrders();
      setOrders(data);
      if (data.length > 0 && !selectedOrderId) {
        setSelectedOrderId(data[0].id);
      }
    } catch (err: any) {
      showToast(`Failed to load orders: ${err.message}`, 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, [user]);

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

  const selectedOrder = orders.find((o) => o.id === selectedOrderId);

  // Status step progression helper
  const stages: OrderStatus[] = [
    'ORDER_PLACED',
    'ACCEPTED',
    'PREPARING',
    'READY_FOR_DISPATCH',
    'SHIPPED',
    'OUT_FOR_DELIVERY',
    'DELIVERED',
  ];

  const getStageIndex = (status: OrderStatus) => stages.indexOf(status);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-in fade-in">
      {/* Customer Header */}
      <div className="bg-white rounded-3xl border border-slate-200 p-6 mb-8 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-indigo-600 text-white font-extrabold text-xl flex items-center justify-center shadow-lg shadow-indigo-600/20">
            {user?.name.slice(0, 1)}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-extrabold text-slate-900">{user?.name}</h1>
              <span className="bg-indigo-100 text-indigo-700 text-[10px] font-bold px-2 py-0.5 rounded-full">
                Customer Account
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              {user?.email} • {user?.phone}
            </p>
          </div>
        </div>

        <button
          onClick={() => setActiveTab('storefront')}
          className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl shadow-xs transition-colors cursor-pointer"
        >
          Explore Catalog
        </button>
      </div>

      {loading ? (
        <div className="p-16 text-center text-slate-500 text-sm">Loading your orders...</div>
      ) : orders.length === 0 ? (
        <div className="bg-white rounded-3xl border border-slate-200 p-12 text-center shadow-xs">
          <Package className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <h3 className="text-lg font-bold text-slate-900">No Orders Placed Yet</h3>
          <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
            You haven't placed any orders yet. Try talking to Zyro AI or browse our 8 starter categories!
          </p>
          <button
            onClick={() => setActiveTab('storefront')}
            className="mt-4 px-4 py-2 bg-indigo-600 text-white font-bold text-xs rounded-xl cursor-pointer"
          >
            Start Shopping
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Left Column: Orders List */}
          <div className="lg:col-span-5 space-y-3">
            <h2 className="text-sm font-extrabold uppercase tracking-wider text-slate-500 px-1">
              Order History ({orders.length})
            </h2>

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
                      <span className="font-extrabold text-xs text-slate-900 font-mono">
                        #{ord.orderNumber}
                      </span>
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                          isCancelled
                            ? 'bg-rose-100 text-rose-800'
                            : isDelivered
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-indigo-100 text-indigo-800'
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
                      <div className="mt-2 flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200/60">
                        <Zap className="w-3 h-3 text-emerald-600" />
                        <span>30-Minute Express Fulfilment</span>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Right Column: Live Tracking & Detailed Order Information */}
          <div className="lg:col-span-7">
            {selectedOrder ? (
              <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-xs space-y-6">
                {/* Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-4">
                  <div>
                    <div className="flex items-center gap-2">
                      <h2 className="text-lg font-extrabold text-slate-900 font-mono">
                        Order #{selectedOrder.orderNumber}
                      </h2>
                      {selectedOrder.aiAssisted && (
                        <span className="bg-indigo-100 text-indigo-800 text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
                          <Sparkles className="w-3 h-3" />
                          Zyro AI Assisted
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Placed on {new Date(selectedOrder.createdAt).toLocaleString()}
                    </p>
                  </div>

                  {selectedOrder.orderStatus !== 'DELIVERED' &&
                    selectedOrder.orderStatus !== 'CANCELLED' && (
                      <button
                        onClick={() => handleCancelOrder(selectedOrder.id)}
                        className="px-3 py-1.5 rounded-xl border border-rose-200 text-rose-600 hover:bg-rose-50 text-xs font-bold transition-colors cursor-pointer flex items-center gap-1"
                      >
                        <XCircle className="w-3.5 h-3.5" />
                        <span>Cancel Order</span>
                      </button>
                    )}
                </div>

                {/* Live Delivery Status Timeline Tracker */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="font-extrabold text-slate-900 text-sm flex items-center gap-1.5">
                      <Truck className="w-4 h-4 text-indigo-600" />
                      Live Delivery Tracking Timeline
                    </h3>
                    {selectedOrder.isExpress30Min && (
                      <span className="text-xs font-bold text-emerald-600 flex items-center gap-1">
                        <Zap className="w-3 h-3" />
                        Target: Under 30 mins
                      </span>
                    )}
                  </div>

                  {/* Visual Stepper */}
                  <div className="relative pl-6 space-y-6 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200">
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
                          <div className="text-xs">
                            <div className="flex items-center justify-between">
                              <span className="font-extrabold text-slate-900 uppercase">
                                {evt.status.replace(/_/g, ' ')}
                              </span>
                              <span className="text-[11px] text-slate-400">
                                {new Date(evt.timestamp).toLocaleTimeString([], {
                                  hour: '2-digit',
                                  minute: '2-digit',
                                })}
                              </span>
                            </div>
                            <p className="text-slate-600 mt-0.5">{evt.note}</p>
                            <span className="text-[10px] text-slate-400">By: {evt.actor}</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Items Purchased */}
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
                            className="w-12 h-12 rounded-xl object-cover bg-slate-100"
                          />
                          <div>
                            <div className="font-bold text-slate-900">{it.productName}</div>
                            <div className="text-slate-500">
                              Qty: {it.quantity} × ₹{it.price}
                            </div>
                          </div>
                        </div>
                        <div className="font-bold text-slate-900">
                          ₹{(it.quantity * it.price).toLocaleString('en-IN')}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Delivery Address & Billing Summary */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4 border-t border-slate-100 text-xs">
                  <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200">
                    <span className="font-bold text-slate-700 block mb-1">Destination Address:</span>
                    <p className="text-slate-900 font-semibold">{selectedOrder.shippingAddress.name}</p>
                    <p className="text-slate-600">{selectedOrder.shippingAddress.street}</p>
                    <p className="text-slate-600">
                      {selectedOrder.shippingAddress.city}, {selectedOrder.shippingAddress.pincode}
                    </p>
                    <p className="text-slate-500 mt-1">Phone: {selectedOrder.customerPhone}</p>
                  </div>

                  <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-1.5">
                    <span className="font-bold text-slate-700 block mb-1">Payment & Charges:</span>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Method:</span>
                      <span className="font-bold text-slate-900">{selectedOrder.paymentMethod}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Status:</span>
                      <span className="font-bold text-emerald-600">{selectedOrder.paymentStatus}</span>
                    </div>
                    <div className="flex justify-between border-t border-slate-200 pt-1 font-bold text-sm">
                      <span>Total Paid:</span>
                      <span className="text-indigo-600">
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
    </div>
  );
};
