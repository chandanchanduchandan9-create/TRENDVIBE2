import React, { useState } from 'react';
import { Product } from '../types/index.ts';
import { useApp } from '../context/AppContext.tsx';
import {
  Sparkles,
  ShoppingBag,
  ExternalLink,
  Share2,
  Copy,
  MessageSquare,
  Check,
  ShieldCheck,
  Zap,
  Instagram,
  AlertTriangle,
} from 'lucide-react';

interface ProductCardProps {
  product: Product;
}

export const ProductCard: React.FC<ProductCardProps> = ({ product }) => {
  const { addToCart, openProduct, openEnquiryModal, startCallingZyro, showToast } = useApp();
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedEnquiryLink, setCopiedEnquiryLink] = useState(false);
  const [showShareMenu, setShowShareMenu] = useState(false);

  const productUrl = `${window.location.origin}?product=${product.id}`;
  const enquiryUrl = `${window.location.origin}?enquire=${product.id}`;

  const handleCopyProductLink = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(productUrl);
    setCopiedLink(true);
    showToast('Product link copied to clipboard!', 'success');
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const handleCopyEnquiryLink = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(enquiryUrl);
    setCopiedEnquiryLink(true);
    showToast('Product enquiry link copied to clipboard!', 'success');
    setTimeout(() => setCopiedEnquiryLink(false), 2000);
  };

  const handleNativeShare = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (navigator.share) {
      try {
        await navigator.share({
          title: product.name,
          text: `Check out ${product.name} on TrendVibe Store for ₹${product.price}!`,
          url: productUrl,
        });
      } catch (err) {
        // user cancelled or share failed
      }
    } else {
      handleCopyProductLink(e);
    }
  };

  const isLowStock = product.stock.available > 0 && product.stock.available <= product.stock.lowStockThreshold;
  const isOutOfStock = product.stock.available <= 0;

  return (
    <div
      onClick={() => openProduct(product.id)}
      className="group bg-white rounded-2xl border border-slate-200/90 hover:border-indigo-300 shadow-xs hover:shadow-xl transition-all duration-300 flex flex-col overflow-hidden relative cursor-pointer"
    >
      {/* Image & Badges Container */}
      <div className="relative aspect-square w-full bg-slate-100 overflow-hidden">
        <img
          src={product.images[0] || 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=800&q=80'}
          alt={product.name}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          loading="lazy"
        />

        {/* Discount Badge */}
        {product.discountPercent > 0 && (
          <div className="absolute top-2.5 left-2.5 bg-rose-600 text-white font-extrabold text-[11px] px-2 py-0.5 rounded-full shadow-sm">
            {product.discountPercent}% OFF
          </div>
        )}

        {/* 30-Min Express Badge */}
        {product.deliveryConfig.supportsExpress30Min && (
          <div className="absolute top-2.5 right-2.5 bg-emerald-600 text-white font-bold text-[10px] px-2 py-0.5 rounded-full shadow-sm flex items-center gap-1 border border-emerald-400/40">
            <Zap className="w-2.5 h-2.5 text-amber-300 fill-amber-300" />
            <span>30-Min Express</span>
          </div>
        )}

        {/* Stock Status Badge */}
        <div className="absolute bottom-2.5 left-2.5">
          {isOutOfStock ? (
            <span className="bg-rose-900/90 backdrop-blur-xs text-rose-200 text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
              <AlertTriangle className="w-2.5 h-2.5" /> Out of Stock
            </span>
          ) : isLowStock ? (
            <span className="bg-amber-600/90 backdrop-blur-xs text-amber-100 text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
              Only {product.stock.available} left!
            </span>
          ) : (
            <span className="bg-slate-900/70 backdrop-blur-xs text-emerald-300 text-[10px] font-medium px-2 py-0.5 rounded-full">
              In Stock: {product.stock.available}
            </span>
          )}
        </div>

        {/* Floating Quick Action Share & Instagram */}
        <div className="absolute bottom-2.5 right-2.5 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          {product.instagramUrl && (
            <a
              href={product.instagramUrl}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => e.stopPropagation()}
              className="p-1.5 rounded-full bg-white/90 hover:bg-pink-600 hover:text-white text-pink-600 shadow-md transition-colors"
              title="Open Instagram Story/Post"
            >
              <Instagram className="w-3.5 h-3.5" />
            </a>
          )}
          <button
            onClick={(e) => {
              e.stopPropagation();
              setShowShareMenu(!showShareMenu);
            }}
            className="p-1.5 rounded-full bg-white/90 hover:bg-slate-900 hover:text-white text-slate-700 shadow-md transition-colors cursor-pointer"
            title="Share Product"
          >
            <Share2 className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Share Popup Menu */}
        {showShareMenu && (
          <div
            onClick={(e) => e.stopPropagation()}
            className="absolute right-2 bottom-10 bg-white rounded-xl shadow-xl border border-slate-200 p-1.5 z-20 text-xs w-44 space-y-1 animate-in fade-in"
          >
            <button
              onClick={handleCopyProductLink}
              className="w-full px-2.5 py-1.5 text-left hover:bg-slate-50 rounded-lg flex items-center gap-2 text-slate-700 font-medium cursor-pointer"
            >
              {copiedLink ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5 text-slate-400" />}
              <span>Copy Product Link</span>
            </button>
            <button
              onClick={handleCopyEnquiryLink}
              className="w-full px-2.5 py-1.5 text-left hover:bg-slate-50 rounded-lg flex items-center gap-2 text-slate-700 font-medium cursor-pointer"
            >
              {copiedEnquiryLink ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <MessageSquare className="w-3.5 h-3.5 text-slate-400" />}
              <span>Copy Enquiry Link</span>
            </button>
            <button
              onClick={handleNativeShare}
              className="w-full px-2.5 py-1.5 text-left hover:bg-slate-50 rounded-lg flex items-center gap-2 text-slate-700 font-medium cursor-pointer"
            >
              <ExternalLink className="w-3.5 h-3.5 text-slate-400" />
              <span>Share via Device</span>
            </button>
          </div>
        )}
      </div>

      {/* Product Details Content */}
      <div className="p-4 flex-1 flex flex-col justify-between">
        <div>
          <div className="flex items-center justify-between text-[11px] text-slate-500 mb-1">
            <span className="font-semibold uppercase tracking-wider text-indigo-700">{product.brand}</span>
            {product.isVerifiedInfo && (
              <span className="flex items-center gap-1 text-emerald-600 font-medium" title="Verified manufacturer specifications">
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>Verified</span>
              </span>
            )}
          </div>

          <h3 className="font-bold text-slate-900 text-sm line-clamp-2 group-hover:text-indigo-600 transition-colors">
            {product.name}
          </h3>

          <p className="text-xs text-slate-600 mt-1.5 line-clamp-2 leading-relaxed">
            {product.shortDescription || product.description}
          </p>
        </div>

        {/* Price & Primary Actions */}
        <div className="mt-4 pt-3 border-t border-slate-100">
          <div className="flex items-baseline gap-2 mb-3">
            <span className="text-lg font-extrabold text-slate-900">₹{product.price.toLocaleString('en-IN')}</span>
            {product.mrp > product.price && (
              <span className="text-xs text-slate-400 line-through">₹{product.mrp.toLocaleString('en-IN')}</span>
            )}
          </div>

          <div className="grid grid-cols-2 gap-2">
            {/* Talk to Zyro AI */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                startCallingZyro(product);
              }}
              className="py-2 px-2 rounded-xl text-xs font-bold bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200/80 flex items-center justify-center gap-1 transition-colors cursor-pointer"
              title="Speak or chat with Zyro AI with verified context"
            >
              <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
              <span>Ask Zyro AI</span>
            </button>

            {/* Add to Cart */}
            <button
              disabled={isOutOfStock}
              onClick={(e) => {
                e.stopPropagation();
                addToCart(product, 1);
              }}
              className="py-2 px-2 rounded-xl text-xs font-bold bg-slate-900 hover:bg-slate-800 disabled:bg-slate-300 disabled:cursor-not-allowed text-white shadow-xs flex items-center justify-center gap-1 transition-colors cursor-pointer"
            >
              <ShoppingBag className="w-3.5 h-3.5" />
              <span>Add to Cart</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
