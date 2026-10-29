import React, { useState } from 'react';
import { useApp } from '../context/AppContext.tsx';
import { api } from '../services/api.ts';
import { isProductExpress30MinEligible } from '../utils/delivery.ts';
import {
  ShoppingBag,
  Trash2,
  Plus,
  Minus,
  ArrowRight,
  ShieldCheck,
  Zap,
  MapPin,
  CreditCard,
  Banknote,
  CheckCircle2,
  Clock,
  ArrowLeft,
} from 'lucide-react';
import confetti from 'canvas-confetti';

export const CartCheckoutView: React.FC = () => {
  const {
    cart,
    removeFromCart,
    updateCartQuantity,
    clearCart,
    cartTotals,
    user,
    setActiveTab,
    showToast,
    checkExpressServiceability,
  } = useApp();

  const [step, setStep] = useState<'cart' | 'checkout' | 'payment-simulation'>('cart');
  const [submitting, setSubmitting] = useState(false);

  // Address state
  const defaultAddress = user?.addresses?.[0] || {
    name: user?.name || 'Chandan Kumar',
    phone: user?.phone || '+91 98450 12345',
    street: 'Flat 402, Green Glen Heights, Bellandur Outer Ring Road',
    city: 'Bangalore',
    state: 'Karnataka',
    pincode: '560103',
    landmark: 'Near EcoSpace Tech Park',
  };

  const [address, setAddress] = useState(defaultAddress);
  const [paymentMethod, setPaymentMethod] = useState<'COD' | 'ONLINE_RAZORPAY'>('ONLINE_RAZORPAY');

  // Check if all items in cart qualify for 30-min express delivery to current customer pincode
  const isExpressEligible =
    cart.length > 0 &&
    cart.every((it) => isProductExpress30MinEligible(it.product, address.pincode));

  const handleProceedToCheckout = () => {
    if (cart.length === 0) return;
    setStep('checkout');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handlePlaceOrder = async () => {
    setSubmitting(true);
    try {
      const orderPayload = {
        items: cart.map((it) => ({
          productId: it.product.id,
          quantity: it.quantity,
          variantId: it.variantId,
        })),
        shippingAddress: address,
        paymentMethod,
        isExpress30Min: isExpressEligible,
      };

      const newOrder = await api.checkout(orderPayload);

      // If user chose Razorpay Online Payment, initiate official Razorpay flow
      if (paymentMethod === 'ONLINE_RAZORPAY') {
        try {
          const rzpOrderRes = await api.createRazorpayOrder({
            orderId: newOrder.id,
            amount: newOrder.totalAmount,
          });

          // Check if Razorpay script is loaded in window
          if (typeof (window as any).Razorpay !== 'undefined') {
            const options = {
              key: rzpOrderRes.keyId || 'rzp_test_TtkEQU3nkvP1Lf',
              amount: rzpOrderRes.amount,
              currency: rzpOrderRes.currency || 'INR',
              name: 'TrendVibe Store',
              description: `Payment for Order #${newOrder.orderNumber}`,
              order_id: rzpOrderRes.razorpayOrderId,
              prefill: {
                name: address.name,
                email: user?.email || 'customer@trendvibe.in',
                contact: address.phone || '9845012345',
              },
              theme: {
                color: '#4f46e5',
              },
              handler: async function (response: any) {
                try {
                  showToast('Verifying Razorpay payment signature...', 'info');
                  await api.verifyRazorpayPayment({
                    orderId: newOrder.id,
                    razorpay_order_id: response.razorpay_order_id,
                    razorpay_payment_id: response.razorpay_payment_id,
                    razorpay_signature: response.razorpay_signature,
                  });

                  confetti({ particleCount: 90, spread: 70, origin: { y: 0.6 } });
                  clearCart();
                  showToast(
                    `Payment of ₹${newOrder.totalAmount} verified! Order #${newOrder.orderNumber} confirmed.`,
                    'success'
                  );
                  setActiveTab('customer-orders');
                } catch (verifyErr: any) {
                  showToast(`Payment verification error: ${verifyErr.message}`, 'error');
                  setActiveTab('customer-orders');
                }
              },
              modal: {
                ondismiss: function () {
                  showToast(
                    `Checkout closed. Order #${newOrder.orderNumber} is saved with payment pending.`,
                    'info'
                  );
                  clearCart();
                  setActiveTab('customer-orders');
                },
              },
            };

            const rzp = new (window as any).Razorpay(options);
            rzp.on('payment.failed', function (resp: any) {
              showToast(`Razorpay payment failed: ${resp.error?.description || 'Declined'}`, 'error');
            });
            rzp.open();
            setSubmitting(false);
            return;
          } else {
            // Fallback if Razorpay checkout.js script was blocked by browser
            showToast('Razorpay script not ready, confirming order in sandbox mode', 'info');
          }
        } catch (rzpErr: any) {
          console.warn('Razorpay order creation fallback:', rzpErr.message);
          showToast(`Razorpay payment notice: ${rzpErr.message}`, 'info');
        }
      }

      // COD or fallback flow
      confetti({ particleCount: 90, spread: 70, origin: { y: 0.6 } });
      clearCart();
      showToast(`Order #${newOrder.orderNumber} successfully placed!`, 'success');

      // Navigate to customer orders
      setActiveTab('customer-orders');
    } catch (err: any) {
      showToast(`Checkout failed: ${err.message}`, 'error');
    } finally {
      setSubmitting(false);
    }
  };

  if (cart.length === 0) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16 text-center animate-in fade-in">
        <div className="w-20 h-20 bg-slate-100 rounded-3xl mx-auto flex items-center justify-center text-slate-400 mb-4">
          <ShoppingBag className="w-10 h-10" />
        </div>
        <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight">Your Cart is Empty</h2>
        <p className="text-sm text-slate-500 mt-2 max-w-sm mx-auto">
          Explore TrendVibe's 8 verified categories with 30-minute express delivery on medicines & foods.
        </p>
        <button
          onClick={() => setActiveTab('storefront')}
          className="mt-6 px-6 py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-sm rounded-xl shadow-md transition-all cursor-pointer"
        >
          Explore Catalogue
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-in fade-in">
      {/* Checkout Steps Navigation */}
      <div className="flex items-center justify-between mb-8 pb-4 border-b border-slate-200">
        <div className="flex items-center gap-3">
          <button
            onClick={() => (step === 'checkout' ? setStep('cart') : setActiveTab('storefront'))}
            className="p-2 rounded-xl text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
              {step === 'cart' ? 'Shopping Cart' : 'Secure Checkout'}
            </h1>
            <p className="text-xs text-slate-500">
              {step === 'cart'
                ? `Review your ${cart.length} selected items`
                : 'Enter delivery destination and select payment mode'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 text-xs font-semibold">
          <span
            className={`px-3 py-1 rounded-full ${
              step === 'cart' ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-600'
            }`}
          >
            1. Cart
          </span>
          <ArrowRight className="w-3.5 h-3.5 text-slate-300" />
          <span
            className={`px-3 py-1 rounded-full ${
              step === 'checkout' ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-600'
            }`}
          >
            2. Payment & Delivery
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column: Cart items or Address & Payment */}
        <div className="lg:col-span-8 space-y-6">
          {step === 'cart' ? (
            /* Cart Items Table */
            <div className="bg-white rounded-3xl border border-slate-200 shadow-xs overflow-hidden divide-y divide-slate-100">
              {cart.map((item) => (
                <div key={`${item.product.id}-${item.variantId || 'std'}`} className="p-4 sm:p-6 flex gap-4">
                  <img
                    src={item.product.images[0]}
                    alt={item.product.name}
                    className="w-20 h-20 rounded-2xl object-cover bg-slate-100 shrink-0 border border-slate-200"
                  />
                  <div className="flex-1 flex flex-col justify-between">
                    <div>
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-600">
                            {item.product.brand}
                          </span>
                          <h4 className="font-bold text-slate-900 text-sm">{item.product.name}</h4>
                          {item.variantId && item.product.variants && (
                            <span className="text-xs text-slate-500 font-medium">
                              Variant:{' '}
                              {item.product.variants.find((v) => v.id === item.variantId)?.name}
                            </span>
                          )}
                        </div>
                        <button
                          onClick={() => removeFromCart(item.product.id, item.variantId)}
                          className="text-slate-400 hover:text-rose-600 transition-colors p-1 cursor-pointer"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>

                      {item.product.deliveryConfig.supportsExpress30Min && (
                        <div className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full mt-1 border border-emerald-200/60">
                          <Zap className="w-3 h-3 text-emerald-600" />
                          <span>30-Min Express Item</span>
                        </div>
                      )}
                    </div>

                    <div className="flex items-center justify-between mt-3 pt-2 border-t border-slate-100">
                      <div className="flex items-center border border-slate-200 rounded-xl bg-slate-50 p-0.5">
                        <button
                          onClick={() =>
                            updateCartQuantity(item.product.id, item.quantity - 1, item.variantId)
                          }
                          className="w-7 h-7 flex items-center justify-center font-bold text-slate-600 hover:bg-white rounded-lg transition-colors cursor-pointer"
                        >
                          <Minus className="w-3.5 h-3.5" />
                        </button>
                        <span className="w-8 text-center text-xs font-bold text-slate-900">
                          {item.quantity}
                        </span>
                        <button
                          onClick={() =>
                            updateCartQuantity(item.product.id, item.quantity + 1, item.variantId)
                          }
                          className="w-7 h-7 flex items-center justify-center font-bold text-slate-600 hover:bg-white rounded-lg transition-colors cursor-pointer"
                        >
                          <Plus className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      <div className="text-right">
                        <div className="text-sm font-extrabold text-slate-900">
                          ₹{(item.product.price * item.quantity).toLocaleString('en-IN')}
                        </div>
                        <div className="text-[11px] text-slate-400">
                          ₹{item.product.price} each
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            /* Checkout Details: Address & Payment Selection */
            <div className="space-y-6">
              {/* Delivery Address Box */}
              <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-xs space-y-4">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <h3 className="font-extrabold text-slate-900 text-sm flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-indigo-600" />
                    Delivery Destination & Area Serviceability
                  </h3>
                  {isExpressEligible ? (
                    <span className="bg-emerald-100 text-emerald-800 text-[11px] font-bold px-2.5 py-0.5 rounded-full flex items-center gap-1 border border-emerald-300">
                      <Zap className="w-3 h-3 text-amber-500 fill-amber-500" />
                      30-Min Express Active
                    </span>
                  ) : (
                    <span className="bg-slate-100 text-slate-600 text-[11px] font-semibold px-2 py-0.5 rounded-full">
                      Standard Courier (1-2 Days)
                    </span>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Full Name</label>
                    <input
                      type="text"
                      value={address.name}
                      onChange={(e) => setAddress({ ...address, name: e.target.value })}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-900 font-medium"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Phone Number</label>
                    <input
                      type="text"
                      value={address.phone}
                      onChange={(e) => setAddress({ ...address, phone: e.target.value })}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-900 font-medium"
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="block font-semibold text-slate-700 mb-1">Street Address</label>
                    <input
                      type="text"
                      value={address.street}
                      onChange={(e) => setAddress({ ...address, street: e.target.value })}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-900 font-medium"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">City</label>
                    <input
                      type="text"
                      value={address.city}
                      onChange={(e) => setAddress({ ...address, city: e.target.value })}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-900 font-medium"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">PIN Code (e.g. 560103)</label>
                    <input
                      type="text"
                      value={address.pincode}
                      onChange={(e) => setAddress({ ...address, pincode: e.target.value })}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-900 font-bold"
                    />
                  </div>
                </div>

                {isExpressEligible && (
                  <p className="text-xs text-emerald-700 bg-emerald-50 p-2.5 rounded-xl border border-emerald-200 font-medium">
                    ⚡ Great news! Bangalore PIN code {address.pincode} qualifies for direct 30-minute hyper-local delivery for healthcare and kitchen products!
                  </p>
                )}
              </div>

              {/* Payment Method Selection */}
              <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-xs space-y-4">
                <h3 className="font-extrabold text-slate-900 text-sm flex items-center gap-2 border-b border-slate-100 pb-3">
                  <CreditCard className="w-4 h-4 text-indigo-600" />
                  Select Payment Gateway
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Razorpay Online */}
                  <div
                    onClick={() => setPaymentMethod('ONLINE_RAZORPAY')}
                    className={`p-4 rounded-2xl border-2 cursor-pointer transition-all ${
                      paymentMethod === 'ONLINE_RAZORPAY'
                        ? 'border-indigo-600 bg-indigo-50/50 shadow-xs'
                        : 'border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-900 text-sm">Online Payment</span>
                        <span className="bg-indigo-600 text-white font-extrabold text-[10px] px-2 py-0.5 rounded-full shadow-2xs">
                          Razorpay
                        </span>
                      </div>
                      <CreditCard className="w-5 h-5 text-indigo-600" />
                    </div>
                    <p className="text-xs text-slate-500 leading-relaxed">
                      UPI, Credit/Debit Cards, NetBanking via official Razorpay test gateway with cryptographic signature verification.
                    </p>
                    <div className="mt-3 flex items-center justify-between text-[10px]">
                      <span className="text-emerald-600 font-semibold flex items-center gap-1">
                        <ShieldCheck className="w-3.5 h-3.5" /> Zero fees
                      </span>
                      <span className="text-slate-400 font-mono">Key: rzp_test_...vP1Lf</span>
                    </div>
                  </div>

                  {/* Cash on Delivery */}
                  <div
                    onClick={() => setPaymentMethod('COD')}
                    className={`p-4 rounded-2xl border-2 cursor-pointer transition-all ${
                      paymentMethod === 'COD'
                        ? 'border-indigo-600 bg-indigo-50/50 shadow-xs'
                        : 'border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-bold text-slate-900 text-sm">Cash on Delivery (COD)</span>
                      <Banknote className="w-5 h-5 text-emerald-600" />
                    </div>
                    <p className="text-xs text-slate-500 leading-relaxed">
                      Pay cash or UPI directly to our delivery executive upon arrival at your doorstep.
                    </p>
                    <div className="mt-3 flex items-center gap-1.5 text-[10px] text-slate-500 font-semibold">
                      <span>OTP verification at delivery</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Right Column: Order Summary Card */}
        <div className="lg:col-span-4">
          <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-xs sticky top-24 space-y-4">
            <h3 className="font-extrabold text-slate-900 text-base">Order Price Breakdown</h3>

            <div className="space-y-2 text-xs text-slate-600 divide-y divide-slate-100">
              <div className="flex justify-between pb-2">
                <span>Subtotal ({cart.length} items)</span>
                <span className="font-bold text-slate-900">₹{cartTotals.subtotal.toLocaleString('en-IN')}</span>
              </div>
              {cartTotals.discount > 0 && (
                <div className="flex justify-between py-2 text-emerald-600 font-bold">
                  <span>Special TrendVibe Discount</span>
                  <span>- ₹{cartTotals.discount}</span>
                </div>
              )}
              <div className="flex justify-between py-2">
                <span>Estimated Taxes (GST 5%)</span>
                <span>₹{cartTotals.tax}</span>
              </div>
              <div className="flex justify-between py-2">
                <span>Delivery Fee</span>
                <span>{cartTotals.shippingFee === 0 ? <span className="text-emerald-600 font-bold">FREE</span> : `₹${cartTotals.shippingFee}`}</span>
              </div>
              <div className="flex justify-between pt-3 text-base font-extrabold text-slate-900">
                <span>Total Amount</span>
                <span className="text-indigo-600 text-lg">₹{cartTotals.total.toLocaleString('en-IN')}</span>
              </div>
            </div>

            {/* CTA Button */}
            {step === 'cart' ? (
              <button
                onClick={handleProceedToCheckout}
                className="w-full py-3.5 px-4 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-sm rounded-2xl shadow-lg shadow-indigo-600/20 transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <span>Proceed to Checkout</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            ) : (
              <button
                disabled={submitting}
                onClick={handlePlaceOrder}
                className="w-full py-3.5 px-4 bg-slate-900 hover:bg-slate-800 disabled:bg-slate-400 text-white font-extrabold text-sm rounded-2xl shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                {submitting ? (
                  <span>Securing Order & Inventory...</span>
                ) : (
                  <>
                    <ShieldCheck className="w-4 h-4 text-emerald-400" />
                    <span>Confirm Order (₹{cartTotals.total.toLocaleString('en-IN')})</span>
                  </>
                )}
              </button>
            )}

            <div className="pt-2 text-center text-[11px] text-slate-400 space-y-1">
              <p className="flex items-center justify-center gap-1 font-medium text-slate-500">
                <ShieldCheck className="w-3.5 h-3.5 text-indigo-500" />
                Atomic Stock Reservation & Zero Overselling Guarantee
              </p>
              <p>Prices snapshotted at time of checkout.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
