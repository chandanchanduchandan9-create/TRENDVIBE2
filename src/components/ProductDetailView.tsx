import React, { useState, useEffect } from 'react';
import { Product, SellerDocument } from '../types/index.ts';
import { useApp } from '../context/AppContext.tsx';
import { api } from '../services/api.ts';
import {
  ArrowLeft,
  Sparkles,
  ShoppingBag,
  Zap,
  ShieldCheck,
  Instagram,
  Copy,
  Check,
  Share2,
  FileText,
  Clock,
  RotateCcw,
  Truck,
  AlertCircle,
  ExternalLink,
  MessageSquare,
  Bell,
  Mail,
  Send,
} from 'lucide-react';

interface ProductDetailViewProps {
  productId: string;
  onBack: () => void;
}

export const ProductDetailView: React.FC<ProductDetailViewProps> = ({ productId, onBack }) => {
  const { user, addToCart, startCallingZyro, openEnquiryModal, showToast, setActiveTab } = useApp();

  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedImage, setSelectedImage] = useState<string>('');
  const [selectedVariantId, setSelectedVariantId] = useState<string | undefined>();
  const [quantity, setQuantity] = useState(1);
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedEnquiry, setCopiedEnquiry] = useState(false);
  const [attachedDocs, setAttachedDocs] = useState<SellerDocument[]>([]);
  const [selectedDocPreview, setSelectedDocPreview] = useState<SellerDocument | null>(null);

  // Price Drop Alert State
  const [showPriceAlertModal, setShowPriceAlertModal] = useState(false);
  const [targetPrice, setTargetPrice] = useState<number>(0);
  const [alertEmail, setAlertEmail] = useState<string>(user?.email || 'customer@trendvibe.in');
  const [isSettingAlert, setIsSettingAlert] = useState(false);
  const [simulatedEmail, setSimulatedEmail] = useState<{
    to: string;
    subject: string;
    body: string;
    sentAt: string;
    status: string;
  } | null>(null);
  const [triggeredSimulatedAlert, setTriggeredSimulatedAlert] = useState<boolean>(false);

  useEffect(() => {
    async function loadProduct() {
      setLoading(true);
      try {
        const prod = await api.getProductById(productId);
        setProduct(prod);
        setSelectedImage(prod.images[0] || '');
        if (prod.variants && prod.variants.length > 0) {
          setSelectedVariantId(prod.variants[0].id);
        }

        // Fetch seller documents related to this product or category
        const allDocs = await api.getSellerDocuments();
        const relevant = allDocs.filter(
          (d) => d.productId === prod.id || (d.category && d.category === prod.category)
        );

        if (prod.pdfDocName && prod.pdfExtractedText) {
          const directDoc: SellerDocument = {
            id: `doc-${prod.id}`,
            sellerId: prod.sellerId,
            productId: prod.id,
            productName: prod.name,
            fileName: prod.pdfDocName,
            fileSizeBytes: prod.pdfExtractedText.length * 2,
            fileType: 'application/pdf',
            extractedText: prod.pdfExtractedText,
            sections: [
              {
                title: `${prod.name} Verified Specification & PDF Record`,
                content: prod.pdfExtractedText,
              },
            ],
            uploadedAt: prod.createdAt,
            status: 'indexed',
          };
          if (!relevant.some((d) => d.fileName === prod.pdfDocName)) {
            relevant.unshift(directDoc);
          }
        }

        setAttachedDocs(relevant);
      } catch (err: any) {
        showToast(`Failed to load product: ${err.message}`, 'error');
      } finally {
        setLoading(false);
      }
    }
    loadProduct();
  }, [productId]);

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-16 flex flex-col items-center justify-center min-h-[50vh]">
        <div className="w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
        <p className="mt-4 text-slate-500 font-medium text-sm">Loading verified product details...</p>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-16 text-center">
        <h2 className="text-xl font-bold text-slate-900">Product Not Found</h2>
        <p className="text-sm text-slate-500 mt-2">The requested product could not be located in our catalog.</p>
        <button
          onClick={onBack}
          className="mt-4 px-4 py-2 bg-indigo-600 text-white rounded-xl text-sm font-semibold cursor-pointer"
        >
          Return to Storefront
        </button>
      </div>
    );
  }

  const productUrl = `${window.location.origin}?product=${product.id}`;
  const enquiryUrl = `${window.location.origin}?enquire=${product.id}`;

  const handleCopyLink = () => {
    navigator.clipboard.writeText(productUrl);
    setCopiedLink(true);
    showToast('Product link copied!', 'success');
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const handleCopyEnquiry = () => {
    navigator.clipboard.writeText(enquiryUrl);
    setCopiedEnquiry(true);
    showToast('Product enquiry link copied!', 'success');
    setTimeout(() => setCopiedEnquiry(false), 2000);
  };

  const handleBuyNow = () => {
    addToCart(product, quantity, selectedVariantId);
    setActiveTab('cart');
  };

  const handleCreatePriceAlert = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!product || !alertEmail || targetPrice <= 0) {
      showToast('Please provide a valid target price and email address.', 'error');
      return;
    }
    setIsSettingAlert(true);
    try {
      const res = await api.createPriceAlert({
        productId: product.id,
        productName: product.name,
        userEmail: alertEmail,
        targetPrice: Number(targetPrice),
        currentPrice,
      });
      setSimulatedEmail(res.emailSimulation);
      showToast('Price drop alert registered & simulated email dispatched!', 'success');
    } catch (err: any) {
      showToast(`Failed to register alert: ${err.message}`, 'error');
    } finally {
      setIsSettingAlert(false);
    }
  };

  const handleSimulateDropTrigger = () => {
    setTriggeredSimulatedAlert(true);
    showToast('Simulated price drop event triggered! Notification email dispatched.', 'success');
  };

  const selectedVariant = product.variants?.find((v) => v.id === selectedVariantId);
  const currentPrice = selectedVariant ? selectedVariant.price : product.price;
  const currentMrp = selectedVariant ? selectedVariant.mrp : product.mrp;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-in fade-in">
      {/* Back button & Breadcrumb */}
      <div className="flex items-center justify-between mb-6">
        <button
          onClick={onBack}
          className="inline-flex items-center gap-2 text-sm font-semibold text-slate-600 hover:text-slate-900 transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Catalog</span>
        </button>

        {/* Share actions */}
        <div className="flex items-center gap-2">
          {product.instagramUrl && (
            <a
              href={product.instagramUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-pink-50 text-pink-700 hover:bg-pink-100 border border-pink-200"
            >
              <Instagram className="w-3.5 h-3.5" />
              <span>Instagram Post</span>
            </a>
          )}
          <button
            onClick={handleCopyLink}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors cursor-pointer"
          >
            {copiedLink ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
            <span>Copy Link</span>
          </button>
          <button
            onClick={handleCopyEnquiry}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 transition-colors cursor-pointer"
          >
            {copiedEnquiry ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <MessageSquare className="w-3.5 h-3.5" />}
            <span>Copy Enquiry Link</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12">
        {/* Left: Product Images */}
        <div className="lg:col-span-6 space-y-4">
          <div className="aspect-square w-full bg-slate-100 rounded-3xl overflow-hidden border border-slate-200/90 shadow-xs relative">
            <img
              src={selectedImage || product.images[0]}
              alt={product.name}
              className="w-full h-full object-cover"
            />
            {product.discountPercent > 0 && (
              <span className="absolute top-4 left-4 bg-rose-600 text-white font-extrabold text-xs px-3 py-1 rounded-full shadow-md">
                {product.discountPercent}% OFF
              </span>
            )}
            {product.deliveryConfig.supportsExpress30Min && (
              <span className="absolute top-4 right-4 bg-emerald-600 text-white font-bold text-xs px-3 py-1 rounded-full shadow-md flex items-center gap-1.5 border border-emerald-400/40">
                <Zap className="w-3 h-3 text-amber-300 fill-amber-300" />
                ⚡ 30-Min Express
              </span>
            )}
          </div>

          {/* Thumbnails */}
          {product.images.length > 1 && (
            <div className="flex items-center gap-3 overflow-x-auto pb-2">
              {product.images.map((img, i) => (
                <button
                  key={i}
                  onClick={() => setSelectedImage(img)}
                  className={`w-20 h-20 rounded-xl overflow-hidden border-2 shrink-0 transition-all cursor-pointer ${
                    selectedImage === img ? 'border-indigo-600 ring-2 ring-indigo-500/20' : 'border-slate-200 opacity-70 hover:opacity-100'
                  }`}
                >
                  <img src={img} alt={`${product.name} thumb ${i}`} className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          )}

          {/* Official Verification Box */}
          <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 text-xs space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-bold text-slate-900 flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                Manufacturer & Specification Verification
              </span>
              <span className="text-[11px] text-slate-500">
                Verified: {product.lastVerifiedDate || '2026-03-01'}
              </span>
            </div>
            <p className="text-slate-600 leading-relaxed">
              Technical attributes, dosage formulations, and compatibility benchmarks for this product are sourced directly from verified manufacturer documentation.
            </p>
            {product.officialSourceUrl && (
              <a
                href={product.officialSourceUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-indigo-600 hover:text-indigo-800 font-semibold"
              >
                <span>View Official Manufacturer Record</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            )}
          </div>
        </div>

        {/* Right: Product Purchase & Details */}
        <div className="lg:col-span-6 flex flex-col justify-between space-y-6">
          <div className="space-y-4">
            <div>
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-indigo-600 mb-1">
                <span>{product.brand}</span>
                <span>•</span>
                <span className="text-slate-500 capitalize">{product.category.replace('-', ' ')}</span>
                <span>•</span>
                <span className="text-slate-400 font-mono">SKU: {product.sku}</span>
              </div>

              <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight leading-tight">
                {product.name}
              </h1>
            </div>

            {/* Price Box & Price Drop Alert Trigger */}
            <div className="bg-slate-50/90 p-4 rounded-2xl border border-slate-200/90 space-y-3">
              <div className="flex flex-wrap items-baseline gap-3">
                <span className="text-3xl font-extrabold text-slate-900">₹{currentPrice.toLocaleString('en-IN')}</span>
                {currentMrp > currentPrice && (
                  <span className="text-base text-slate-400 line-through">₹{currentMrp.toLocaleString('en-IN')}</span>
                )}
                {product.discountPercent > 0 && (
                  <span className="bg-emerald-100 text-emerald-800 text-xs font-bold px-2 py-0.5 rounded-full">
                    Save {product.discountPercent}%
                  </span>
                )}
                <span className="text-xs text-slate-500 ml-auto font-medium">Inclusive of all taxes</span>
              </div>

              {/* Price Drop Alert Trigger Button */}
              <div className="pt-2 border-t border-slate-200/70 flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => {
                    setTargetPrice(Math.round(currentPrice * 0.9));
                    setSimulatedEmail(null);
                    setTriggeredSimulatedAlert(false);
                    setShowPriceAlertModal(true);
                  }}
                  className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-200/90 text-xs font-bold transition-all shadow-2xs hover:shadow-xs cursor-pointer group"
                >
                  <Bell className="w-3.5 h-3.5 text-amber-600 group-hover:rotate-12 transition-transform" />
                  <span>Notify me when price drops</span>
                  <span className="bg-amber-200/70 text-amber-950 text-[10px] px-1.5 py-0.5 rounded-md font-semibold">
                    Instant Simulation
                  </span>
                </button>
                <span className="text-[11px] text-slate-400">Target price alerts via simulated email</span>
              </div>
            </div>

            {/* Stock & Delivery Alerts */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs p-3 bg-white border border-slate-200 rounded-xl">
                <span className="text-slate-600 font-medium">Real-Time Inventory Status:</span>
                {product.stock.available > 0 ? (
                  <span className="font-bold text-emerald-600 flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                    Available to sell: {product.stock.available} units (On-hand: {product.stock.onHand})
                  </span>
                ) : (
                  <span className="font-bold text-rose-600">Currently Out of Stock</span>
                )}
              </div>

              {product.deliveryConfig.supportsExpress30Min && (
                <div className="p-3 bg-emerald-50/80 border border-emerald-200 rounded-xl text-xs text-emerald-900 flex items-start gap-2.5">
                  <Zap className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold">⚡ 30-Minute Hyper-Local Express Delivery Eligible!</span>
                    <p className="text-emerald-700 mt-0.5">
                      Dispatched instantly from local fulfillment hub for Bangalore pin codes (560001, 560038, 560103, 560068, 560034, 560008).
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Variants Selector */}
            {product.variants && product.variants.length > 0 && (
              <div className="space-y-2">
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide">
                  Select Variant:
                </label>
                <div className="flex flex-wrap gap-2">
                  {product.variants.map((v) => (
                    <button
                      key={v.id}
                      onClick={() => setSelectedVariantId(v.id)}
                      className={`px-3 py-2 rounded-xl text-xs font-semibold border transition-all cursor-pointer ${
                        selectedVariantId === v.id
                          ? 'border-indigo-600 bg-indigo-50 text-indigo-700 ring-2 ring-indigo-500/20'
                          : 'border-slate-200 hover:border-slate-300 text-slate-700'
                      }`}
                    >
                      <div>{v.name}</div>
                      <div className="text-[11px] font-bold text-slate-900 mt-0.5">₹{v.price}</div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Description */}
            <div className="space-y-1">
              <h4 className="text-xs font-bold uppercase tracking-wide text-slate-500">Product Overview</h4>
              <p className="text-sm text-slate-700 leading-relaxed">{product.description}</p>
            </div>

            {/* Specifications Table */}
            {Object.keys(product.specifications).length > 0 && (
              <div className="space-y-2">
                <h4 className="text-xs font-bold uppercase tracking-wide text-slate-500">Key Specifications</h4>
                <div className="border border-slate-200 rounded-xl overflow-hidden divide-y divide-slate-100 text-xs">
                  {Object.entries(product.specifications).map(([key, val]) => (
                    <div key={key} className="grid grid-cols-3 p-2.5 bg-white">
                      <span className="font-semibold text-slate-500">{key}</span>
                      <span className="col-span-2 text-slate-900 font-medium">{val}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Seller PDF Knowledge Base & RAG Attachments */}
            {attachedDocs.length > 0 && (
              <div className="space-y-2 pt-2">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold uppercase tracking-wide text-indigo-700 flex items-center gap-1.5">
                    <FileText className="w-3.5 h-3.5" />
                    Seller Knowledge Base & PDF Manuals ({attachedDocs.length})
                  </h4>
                  <span className="text-[10px] text-slate-400">Indexed for Zyro AI</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {attachedDocs.map((doc) => (
                    <div
                      key={doc.id}
                      onClick={() => setSelectedDocPreview(doc)}
                      className="p-2.5 rounded-xl border border-indigo-100 bg-indigo-50/40 hover:bg-indigo-50 transition-colors flex items-center justify-between cursor-pointer"
                    >
                      <div className="truncate">
                        <div className="text-xs font-bold text-slate-900 truncate">{doc.fileName}</div>
                        <div className="text-[10px] text-slate-500">{Math.round(doc.fileSizeBytes / 1024)} KB • {doc.sections.length} Sections</div>
                      </div>
                      <span className="text-[10px] font-bold text-indigo-600 bg-white px-2 py-0.5 rounded shadow-2xs">View RAG</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Action Row & Quantity */}
          <div className="space-y-3 pt-4 border-t border-slate-200">
            <div className="flex items-center gap-3">
              <div className="flex items-center border border-slate-200 rounded-xl bg-white p-1">
                <button
                  disabled={quantity <= 1}
                  onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                  className="w-8 h-8 flex items-center justify-center font-bold text-slate-600 hover:bg-slate-100 rounded-lg disabled:opacity-30 cursor-pointer"
                >
                  -
                </button>
                <span className="w-10 text-center font-bold text-sm text-slate-900">{quantity}</span>
                <button
                  disabled={quantity >= product.stock.available}
                  onClick={() => setQuantity((q) => q + 1)}
                  className="w-8 h-8 flex items-center justify-center font-bold text-slate-600 hover:bg-slate-100 rounded-lg disabled:opacity-30 cursor-pointer"
                >
                  +
                </button>
              </div>

              <button
                disabled={product.stock.available <= 0}
                onClick={() => addToCart(product, quantity, selectedVariantId)}
                className="flex-1 py-3 px-4 bg-slate-900 hover:bg-slate-800 disabled:bg-slate-300 text-white font-bold text-sm rounded-xl transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer"
              >
                <ShoppingBag className="w-4 h-4" />
                <span>Add {quantity} to Cart</span>
              </button>

              <button
                disabled={product.stock.available <= 0}
                onClick={handleBuyNow}
                className="py-3 px-5 bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-300 text-white font-bold text-sm rounded-xl transition-all shadow-md cursor-pointer"
              >
                Buy Now
              </button>
            </div>

            {/* Talk to Zyro AI & Enquire Options */}
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => startCallingZyro(product)}
                className="py-2.5 px-3 bg-gradient-to-r from-indigo-50 to-violet-50 hover:from-indigo-100 hover:to-violet-100 text-indigo-700 border border-indigo-200/80 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer"
              >
                <Sparkles className="w-4 h-4 text-indigo-600" />
                <span>Talk to Zyro AI Assistant</span>
              </button>

              <button
                onClick={() => openEnquiryModal(product.id)}
                className="py-2.5 px-3 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
              >
                <MessageSquare className="w-4 h-4 text-slate-600" />
                <span>Ask Seller a Question</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* RAG Knowledge Document Preview Modal */}
      {selectedDocPreview && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-6 shadow-2xl border border-slate-200 space-y-4 max-h-[85vh] flex flex-col">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-indigo-600" />
                <div>
                  <h3 className="font-bold text-slate-900 text-sm">{selectedDocPreview.fileName}</h3>
                  <span className="text-[11px] text-slate-400">Indexed for Zyro AI Evidence Retrieval</span>
                </div>
              </div>
              <button
                onClick={() => setSelectedDocPreview(null)}
                className="text-slate-400 hover:text-slate-600 font-bold text-sm cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="flex-1 overflow-y-auto space-y-3 text-xs leading-relaxed text-slate-700 pr-2">
              <div className="bg-indigo-50/60 p-3 rounded-xl border border-indigo-100">
                <span className="font-bold text-indigo-900 block mb-1">Full Extracted Content:</span>
                <p className="whitespace-pre-wrap">{selectedDocPreview.extractedText}</p>
              </div>

              {selectedDocPreview.sections.map((sec, idx) => (
                <div key={idx} className="p-3 border border-slate-200 rounded-xl bg-slate-50">
                  <h5 className="font-bold text-slate-900 mb-1">{sec.title}</h5>
                  <p className="text-slate-600">{sec.content}</p>
                </div>
              ))}
            </div>

            <div className="pt-2 flex justify-end">
              <button
                onClick={() => setSelectedDocPreview(null)}
                className="px-4 py-2 bg-slate-900 text-white font-semibold text-xs rounded-xl cursor-pointer"
              >
                Close Preview
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Price Drop Alert & Email Notification Simulation Modal */}
      {showPriceAlertModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-xl w-full p-6 shadow-2xl border border-slate-200 space-y-4 max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-2xl bg-amber-100 text-amber-700 flex items-center justify-center shadow-xs">
                  <Bell className="w-5 h-5 text-amber-600" />
                </div>
                <div>
                  <h3 className="font-extrabold text-slate-900 text-base">Price Drop Alert</h3>
                  <p className="text-xs text-slate-500">Live email notification simulation for {product.name}</p>
                </div>
              </div>
              <button
                onClick={() => setShowPriceAlertModal(false)}
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-800 flex items-center justify-center font-bold text-sm cursor-pointer transition-colors"
              >
                ✕
              </button>
            </div>

            {/* Current Price Reference */}
            <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200/80 flex items-center justify-between text-xs">
              <div>
                <span className="text-slate-500 font-medium">Current Store Price:</span>
                <span className="ml-2 font-extrabold text-slate-900 text-base">₹{currentPrice.toLocaleString('en-IN')}</span>
              </div>
              <span className="bg-emerald-100 text-emerald-800 text-[11px] font-bold px-2 py-0.5 rounded-full">
                Active Catalog Price
              </span>
            </div>

            {/* Alert Setup Form */}
            {!simulatedEmail ? (
              <form onSubmit={handleCreatePriceAlert} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-1.5">
                    Target Price (₹):
                  </label>
                  <div className="relative">
                    <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-sm">₹</span>
                    <input
                      type="number"
                      required
                      min={1}
                      max={currentPrice - 1}
                      value={targetPrice}
                      onChange={(e) => setTargetPrice(Number(e.target.value))}
                      className="w-full pl-8 pr-4 py-2.5 bg-white border border-slate-300 rounded-xl text-sm font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500/30 focus:border-amber-500"
                    />
                  </div>

                  {/* Preset Discount Chips */}
                  <div className="flex items-center gap-2 mt-2">
                    <span className="text-[11px] text-slate-400 font-medium">Quick suggestions:</span>
                    <button
                      type="button"
                      onClick={() => setTargetPrice(Math.round(currentPrice * 0.95))}
                      className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-amber-100 text-slate-700 hover:text-amber-800 text-xs font-semibold cursor-pointer border border-slate-200 transition-colors"
                    >
                      5% drop (₹{Math.round(currentPrice * 0.95)})
                    </button>
                    <button
                      type="button"
                      onClick={() => setTargetPrice(Math.round(currentPrice * 0.9))}
                      className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-amber-100 text-slate-700 hover:text-amber-800 text-xs font-semibold cursor-pointer border border-slate-200 transition-colors"
                    >
                      10% drop (₹{Math.round(currentPrice * 0.9)})
                    </button>
                    <button
                      type="button"
                      onClick={() => setTargetPrice(Math.round(currentPrice * 0.8))}
                      className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-amber-100 text-slate-700 hover:text-amber-800 text-xs font-semibold cursor-pointer border border-slate-200 transition-colors"
                    >
                      20% drop (₹{Math.round(currentPrice * 0.8)})
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-1.5">
                    Your Notification Email:
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
                    <input
                      type="email"
                      required
                      placeholder="you@domain.com"
                      value={alertEmail}
                      onChange={(e) => setAlertEmail(e.target.value)}
                      className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-300 rounded-xl text-sm font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500/30 focus:border-amber-500"
                    />
                  </div>
                  <p className="text-[11px] text-slate-400 mt-1">
                    An email notification simulation will be dispatched immediately to confirm your watch request.
                  </p>
                </div>

                <div className="pt-2 flex items-center justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setShowPriceAlertModal(false)}
                    className="px-4 py-2.5 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-100 font-semibold text-xs cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSettingAlert}
                    className="px-5 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-500 disabled:opacity-50 text-white font-bold text-xs flex items-center gap-2 shadow-md cursor-pointer transition-all"
                  >
                    {isSettingAlert ? (
                      <>
                        <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        <span>Dispatching Simulation...</span>
                      </>
                    ) : (
                      <>
                        <Send className="w-3.5 h-3.5" />
                        <span>Confirm Price Alert & Send Simulation</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            ) : (
              /* Simulated Email Dispatch Viewer */
              <div className="space-y-4 animate-in fade-in">
                <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-center justify-between">
                  <div className="flex items-center gap-2 text-emerald-900 font-bold text-xs">
                    <Check className="w-4 h-4 text-emerald-600" />
                    <span>Price Drop Watcher Registered & Email Simulated</span>
                  </div>
                  <span className="bg-emerald-600 text-white text-[10px] font-extrabold px-2 py-0.5 rounded-full uppercase tracking-wider">
                    {simulatedEmail.status}
                  </span>
                </div>

                {/* Simulated Email Envelope Card */}
                <div className="border border-slate-200 rounded-2xl overflow-hidden bg-white shadow-sm text-xs">
                  <div className="bg-slate-100 px-4 py-2.5 border-b border-slate-200 space-y-1">
                    <div className="flex justify-between text-slate-600">
                      <span className="font-semibold text-slate-500">From:</span>
                      <span className="font-mono text-slate-800">alerts@trendvibe.com (TrendVibe Watcher)</span>
                    </div>
                    <div className="flex justify-between text-slate-600">
                      <span className="font-semibold text-slate-500">To:</span>
                      <span className="font-mono text-indigo-700 font-bold">{simulatedEmail.to}</span>
                    </div>
                    <div className="flex justify-between text-slate-600">
                      <span className="font-semibold text-slate-500">Subject:</span>
                      <span className="font-semibold text-slate-900">{simulatedEmail.subject}</span>
                    </div>
                    <div className="flex justify-between text-slate-400 text-[11px]">
                      <span>Dispatched At:</span>
                      <span>{new Date(simulatedEmail.sentAt).toLocaleString()}</span>
                    </div>
                  </div>

                  <div className="p-4 space-y-3 bg-white text-slate-700 leading-relaxed font-sans">
                    <div className="whitespace-pre-wrap font-mono text-[11px] bg-slate-50 p-3 rounded-xl border border-slate-100 text-slate-800">
                      {simulatedEmail.body}
                    </div>

                    {/* Test Instant Trigger Simulation */}
                    <div className="pt-2 border-t border-slate-100">
                      {!triggeredSimulatedAlert ? (
                        <div className="bg-amber-50/70 p-3 rounded-xl border border-amber-200 text-xs space-y-2">
                          <span className="font-bold text-amber-900 block">
                            Want to test the price drop trigger right now?
                          </span>
                          <p className="text-amber-800 text-[11px]">
                            Simulate the supplier dropping the price below ₹{targetPrice} to see how the notification fires in real-time.
                          </p>
                          <button
                            type="button"
                            onClick={handleSimulateDropTrigger}
                            className="px-3.5 py-1.5 bg-amber-600 hover:bg-amber-500 text-white font-bold rounded-lg text-xs cursor-pointer transition-colors inline-flex items-center gap-1.5"
                          >
                            <Bell className="w-3.5 h-3.5" />
                            <span>Simulate Instant Price Drop Trigger</span>
                          </button>
                        </div>
                      ) : (
                        <div className="bg-emerald-50 p-3.5 rounded-xl border border-emerald-300 space-y-2 animate-in zoom-in-95">
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-emerald-900 text-xs flex items-center gap-1.5">
                              <Bell className="w-4 h-4 text-emerald-600 animate-bounce" />
                              🎉 Simulated Trigger Fired: Price dropped to ₹{targetPrice - 50}!
                            </span>
                            <span className="text-[10px] bg-emerald-600 text-white font-bold px-2 py-0.5 rounded-full">
                              TRIGGER DISPATCHED
                            </span>
                          </div>
                          <p className="text-[11px] text-emerald-800">
                            Second simulated notification dispatched to <strong>{alertEmail}</strong>: "Hooray! {product.name} is now ₹{targetPrice - 50}. Grab it before stock is exhausted!"
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Modal Footer */}
                <div className="pt-2 flex items-center justify-between">
                  <button
                    type="button"
                    onClick={() => {
                      setSimulatedEmail(null);
                      setTriggeredSimulatedAlert(false);
                    }}
                    className="text-xs text-indigo-600 hover:text-indigo-800 font-bold cursor-pointer"
                  >
                    ← Edit Target Price
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowPriceAlertModal(false)}
                    className="px-5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs cursor-pointer shadow-md"
                  >
                    Done
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
