import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext.tsx';
import {
  Product,
  Order,
  InventoryMovement,
  SellerDocument,
  DemandFunnelMetrics,
  SellerFinanceMetrics,
  OrderStatus,
} from '../types/index.ts';
import { api } from '../services/api.ts';
import { parsePdfFile } from '../services/pdfParser.ts';
import { isProductExpress30MinEligible } from '../utils/delivery.ts';
import {
  Layers,
  Package,
  TrendingUp,
  DollarSign,
  Truck,
  FileText,
  Plus,
  Edit2,
  Trash2,
  RefreshCw,
  AlertTriangle,
  CheckCircle2,
  Copy,
  ExternalLink,
  UploadCloud,
  ChevronRight,
  ShieldAlert,
  ArrowUpRight,
  BarChart2,
  Zap,
  Database,
  Cloud,
  FileCheck,
  X,
  Upload,
  Image as ImageIcon,
  MapPin,
} from 'lucide-react';

export const SellerDashboard: React.FC = () => {
  const { user, categories, showToast } = useApp();

  const [activeSubTab, setActiveSubTab] = useState<'products' | 'inventory' | 'delivery' | 'analytics' | 'finance'>('products');
  const [products, setProducts] = useState<Product[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [movements, setMovements] = useState<InventoryMovement[]>([]);
  const [documents, setDocuments] = useState<SellerDocument[]>([]);
  const [analytics, setAnalytics] = useState<DemandFunnelMetrics | null>(null);
  const [finance, setFinance] = useState<SellerFinanceMetrics | null>(null);
  const [supabaseStatus, setSupabaseStatus] = useState<any>(null);
  const [syncingSupabase, setSyncingSupabase] = useState(false);
  const [loading, setLoading] = useState(true);

  // Modals
  const [isAddProductOpen, setIsAddProductOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [isRestockOpen, setIsRestockOpen] = useState(false);
  const [restockTargetProduct, setRestockTargetProduct] = useState<Product | null>(null);
  const [restockQty, setRestockQty] = useState(25);
  const [restockNote, setRestockNote] = useState('Stock replenishment from warehouse');

  // PDF Document Upload State (Knowledge Base)
  const [isUploadDocOpen, setIsUploadDocOpen] = useState(false);
  const [docFileName, setDocFileName] = useState('');
  const [docText, setDocText] = useState('');
  const [docCategory, setDocCategory] = useState('medicines-healthcare');
  const [docProductId, setDocProductId] = useState('');
  const [docPdfUploading, setDocPdfUploading] = useState(false);
  const [docPdfSuccess, setDocPdfSuccess] = useState<string | null>(null);

  // PDF Attachment State for Add/Edit Product Form
  const [productPdfUploading, setProductPdfUploading] = useState(false);
  const [productPdfSuccess, setProductPdfSuccess] = useState<string | null>(null);

  // Photo Upload State for Add/Edit Product Form
  const [imageUploading, setImageUploading] = useState(false);
  const [newImageUrlInput, setNewImageUrlInput] = useState('');

  // New Product Form State (without Kannada name)
  const initialProductForm: Partial<Product> = {
    name: '',
    brand: user?.storeName || 'TrendVibe',
    category: 'medicines-healthcare',
    subcategory: 'Fever & Cold',
    description: '',
    shortDescription: '',
    mrp: 100,
    price: 85,
    costPrice: 50,
    sku: `SKU-${Date.now().toString().slice(-6)}`,
    images: ['https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?auto=format&fit=crop&w=800&q=80'],
    stock: { onHand: 50, reserved: 0, available: 50, lowStockThreshold: 10 },
    instagramUrl: '',
    officialSourceUrl: '',
    pdfDocName: '',
    pdfDocUrl: '',
    pdfExtractedText: '',
    status: 'published',
    minOrderQuantity: 1,
    sellingUnit: 'piece',
    deliveryConfig: {
      locationBasedSellingEnabled: false,
      supportsExpress30Min: false,
      deliverySpeed: 'standard',
      preparationMinutes: 15,
      standardDeliveryDays: 2,
      shippingFee: 25,
      freeShippingAbove: 499,
      returnPolicyDays: 7,
      serviceablePincodes: ['560001', '560038', '560103', '560068', '560034'],
      serviceCity: 'Bangalore',
      quickDeliveryCharge: 40,
    },
  };
  const [productForm, setProductForm] = useState<Partial<Product>>(initialProductForm);

  // Handle Photo File Upload (JPG, PNG, WebP)
  const handleImageFilesUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setImageUploading(true);
    let successCount = 0;
    try {
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const validTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/jpg'];
        const ext = file.name.split('.').pop()?.toLowerCase();
        if (!validTypes.includes(file.type) && !['jpg', 'jpeg', 'png', 'webp'].includes(ext || '')) {
          showToast(`"${file.name}" skipped: only JPG, PNG, and WebP are supported.`, 'error');
          continue;
        }

        if (file.size > 5 * 1024 * 1024) {
          showToast(`"${file.name}" is larger than 5MB limit.`, 'error');
          continue;
        }

        const reader = new FileReader();
        const base64Data: string = await new Promise((resolve, reject) => {
          reader.onload = () => resolve(reader.result as string);
          reader.onerror = reject;
          reader.readAsDataURL(file);
        });

        const res = await api.uploadProductImage(file.name, base64Data);
        if (res?.imageUrl) {
          setProductForm((prev) => ({
            ...prev,
            images: [
              ...(prev.images || []).filter(
                (img) =>
                  !img.includes('photo-1584308666744-24d5c474f2ae') &&
                  !img.includes('photo-1523275335684-37898b6baf30')
              ),
              res.imageUrl,
            ],
          }));
          successCount++;
        }
      }

      if (successCount > 0) {
        showToast(`Uploaded ${successCount} product photo${successCount > 1 ? 's' : ''}!`, 'success');
      }
    } catch (err: any) {
      showToast(`Image upload note: ${err.message}`, 'error');
    } finally {
      setImageUploading(false);
      e.target.value = '';
    }
  };

  // Handle PDF file selection for Product Add/Edit Form
  const handleProductPdfFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.name.toLowerCase().endsWith('.pdf') && file.type !== 'application/pdf') {
      showToast('Please select a valid PDF file (.pdf format)', 'error');
      return;
    }

    setProductPdfUploading(true);
    try {
      const parsed = await parsePdfFile(file);
      setProductForm((prev) => ({
        ...prev,
        pdfDocName: parsed.fileName,
        pdfDocUrl: parsed.dataUrl,
        pdfExtractedText: parsed.extractedText,
        // Pre-populate description if empty
        description: prev.description?.trim()
          ? prev.description
          : `Verified product specifications from ${parsed.fileName}.\n${parsed.extractedText.slice(0, 300)}...`,
      }));
      setProductPdfSuccess(`Attached: ${parsed.fileName} (${(parsed.fileSizeBytes / 1024).toFixed(1)} KB) - Text extracted for Zyro AI`);
      showToast(`PDF accepted! Extracted ${parsed.extractedText.length} characters of text for Zyro AI.`, 'success');
    } catch (err: any) {
      showToast(err.message || 'Failed to read PDF file', 'error');
    } finally {
      setProductPdfUploading(false);
    }
  };

  // Handle PDF file selection for Knowledge Base Modal
  const handleKnowledgeDocPdfFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.name.toLowerCase().endsWith('.pdf') && file.type !== 'application/pdf') {
      showToast('Please select a valid PDF file (.pdf format)', 'error');
      return;
    }

    setDocPdfUploading(true);
    try {
      const parsed = await parsePdfFile(file);
      setDocFileName(parsed.fileName);
      setDocText(parsed.extractedText);
      setDocPdfSuccess(`Loaded: ${parsed.fileName} (${(parsed.fileSizeBytes / 1024).toFixed(1)} KB)`);
      showToast(`PDF accepted! Extracted ${parsed.extractedText.length} characters of knowledge.`, 'success');
    } catch (err: any) {
      showToast(err.message || 'Failed to parse PDF', 'error');
    } finally {
      setDocPdfUploading(false);
    }
  };

  const loadAllData = async () => {
    setLoading(true);
    try {
      // Fetch products: if seller is active, get seller's products (or all products if customer/admin view)
      const sellerFilter = (user?.role === 'seller' && user?.id !== 'usr-customer-1') ? user.id : undefined;
      const [prodsRes, ordsRes, movsRes, docsRes, anaRes, finRes, supaRes] = await Promise.all([
        api.getProducts({ sellerId: sellerFilter }),
        api.getOrders(),
        api.getInventoryMovements(),
        api.getSellerDocuments(),
        api.getSellerAnalytics(),
        api.getSellerFinance(),
        api.getSupabaseStatus().catch(() => null),
      ]);

      setProducts(prodsRes);
      setOrders(ordsRes);
      setMovements(movsRes);
      setDocuments(docsRes);
      setAnalytics(anaRes);
      setFinance(finRes);
      if (supaRes) setSupabaseStatus(supaRes);
    } catch (err: any) {
      showToast(`Error loading dashboard: ${err.message}`, 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleSyncSupabase = async () => {
    setSyncingSupabase(true);
    try {
      const res = await api.syncSupabase();
      showToast(`Synced ${res.productsCount} products and ${res.ordersCount} orders to Supabase!`, 'success');
      loadAllData();
    } catch (err: any) {
      showToast(`Supabase sync note: ${err.message}`, 'error');
    } finally {
      setSyncingSupabase(false);
    }
  };

  useEffect(() => {
    loadAllData();
  }, [user]);

  const handleSaveProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!productForm.name?.trim()) {
      showToast('Please enter a product title', 'error');
      return;
    }

    try {
      const finalForm: Partial<Product> = {
        ...productForm,
        name: productForm.name.trim(),
        status: 'published',
        brand: productForm.brand || user?.storeName || 'TrendVibe',
        category: productForm.category || 'other-store-products',
        mrp: Number(productForm.mrp || 100),
        price: Number(productForm.price || 85),
        costPrice: Number(productForm.costPrice || 50),
        sku: productForm.sku || `SKU-${Date.now().toString().slice(-6)}`,
        images: productForm.images && productForm.images.length > 0
          ? productForm.images
          : ['https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?auto=format&fit=crop&w=800&q=80'],
        stock: {
          onHand: Number(productForm.stock?.onHand ?? 50),
          reserved: 0,
          available: Number(productForm.stock?.onHand ?? 50),
          lowStockThreshold: 10,
        },
        pdfDocName: productForm.pdfDocName || '',
        pdfDocUrl: productForm.pdfDocUrl || '',
        pdfExtractedText: productForm.pdfExtractedText || '',
        isVerifiedInfo: true,
        minOrderQuantity: Number(productForm.minOrderQuantity || 1),
        sellingUnit: productForm.sellingUnit || 'piece',
        deliveryConfig: {
          locationBasedSellingEnabled: productForm.deliveryConfig?.locationBasedSellingEnabled === true,
          supportsExpress30Min:
            productForm.deliveryConfig?.locationBasedSellingEnabled === true &&
            productForm.deliveryConfig?.supportsExpress30Min === true &&
            productForm.deliveryConfig?.deliverySpeed !== 'standard' &&
            productForm.deliveryConfig?.deliverySpeed !== 'express_sameday',
          deliverySpeed: productForm.deliveryConfig?.deliverySpeed || (productForm.deliveryConfig?.locationBasedSellingEnabled ? 'all' : 'standard'),
          preparationMinutes: productForm.deliveryConfig?.preparationMinutes || 15,
          standardDeliveryDays: productForm.deliveryConfig?.standardDeliveryDays || 2,
          shippingFee: productForm.deliveryConfig?.shippingFee ?? 25,
          freeShippingAbove: productForm.deliveryConfig?.freeShippingAbove ?? 499,
          returnPolicyDays: productForm.deliveryConfig?.returnPolicyDays ?? 7,
          serviceablePincodes: productForm.deliveryConfig?.serviceablePincodes || ['560001', '560038', '560103', '560068', '560034'],
          serviceCity: productForm.deliveryConfig?.serviceCity || 'Bangalore',
          quickDeliveryCharge: productForm.deliveryConfig?.quickDeliveryCharge ?? 40,
        },
      };

      if (editingProduct) {
        await api.updateProduct(editingProduct.id, finalForm);
        showToast(`"${finalForm.name}" updated and live on storefront!`, 'success');
      } else {
        const created = await api.createProduct(finalForm);
        showToast(`"${created.name}" published! It is now immediately listed in the website storefront.`, 'success');
      }

      setIsAddProductOpen(false);
      setEditingProduct(null);
      setProductForm(initialProductForm);
      setProductPdfSuccess(null);
      await loadAllData();
      setActiveSubTab('products');
    } catch (err: any) {
      showToast(`Product save failed: ${err.message}`, 'error');
    }
  };

  const handleDeleteProduct = async (id: string) => {
    if (!confirm('Are you sure you want to delete this product?')) return;
    try {
      await api.deleteProduct(id);
      showToast('Product deleted.', 'info');
      loadAllData();
    } catch (err: any) {
      showToast(`Delete failed: ${err.message}`, 'error');
    }
  };

  const handleRestockSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!restockTargetProduct) return;
    try {
      await api.restockProduct(restockTargetProduct.id, restockQty, restockNote);
      showToast(`Restocked ${restockQty} units to "${restockTargetProduct.name}".`, 'success');
      setIsRestockOpen(false);
      loadAllData();
    } catch (err: any) {
      showToast(`Restock failed: ${err.message}`, 'error');
    }
  };

  const handleOrderStatusChange = async (orderId: string, status: OrderStatus) => {
    try {
      await api.updateOrderStatus(orderId, status, `Seller updated status to ${status}`);
      showToast(`Order status updated to ${status}`, 'success');
      loadAllData();
    } catch (err: any) {
      showToast(`Status update failed: ${err.message}`, 'error');
    }
  };

  const handleUploadDocument = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!docFileName || !docText) {
      showToast('File name and text are required', 'error');
      return;
    }

    try {
      await api.uploadSellerDocument({
        fileName: docFileName.endsWith('.pdf') ? docFileName : `${docFileName}.pdf`,
        extractedText: docText,
        fileSizeBytes: docText.length * 2,
        category: docCategory as any,
        productId: docProductId || undefined,
        sections: [
          {
            title: 'Specifications & Usage Guidance',
            content: docText.slice(0, 800),
          },
        ],
      });

      showToast('Document uploaded and indexed into Zyro AI knowledge base!', 'success');
      setIsUploadDocOpen(false);
      setDocFileName('');
      setDocText('');
      loadAllData();
    } catch (err: any) {
      showToast(`Upload failed: ${err.message}`, 'error');
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-in fade-in">
      {/* Seller Header */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 rounded-3xl p-6 sm:p-8 text-white mb-8 shadow-xl border border-slate-800 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div>
          <div className="flex items-center gap-2">
            <span className="bg-violet-500/20 text-violet-300 text-xs font-bold px-2.5 py-0.5 rounded-full border border-violet-400/30">
              Authorized Seller Hub
            </span>
            <span className="text-slate-400 text-xs">•</span>
            <span className="text-slate-300 text-xs font-mono">Store ID: {user?.id}</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight mt-1">
            {user?.storeName || `${user?.name}'s Fulfillment Center`}
          </h1>
          <p className="text-xs text-slate-400 mt-1 max-w-xl">
            Manage catalogue, real-time atomic inventory ledgers, 30-minute hyper-local dispatches, RAG knowledge documents, and confidential finance metrics.
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={() => {
              setEditingProduct(null);
              setProductForm(initialProductForm);
              setIsAddProductOpen(true);
            }}
            className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded-xl shadow-md transition-all flex items-center gap-1.5 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Add New Product</span>
          </button>
          <button
            onClick={() => setIsUploadDocOpen(true)}
            className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs rounded-xl border border-slate-700 transition-colors flex items-center gap-1.5 cursor-pointer"
          >
            <UploadCloud className="w-4 h-4 text-indigo-400" />
            <span>Upload PDF Manual</span>
          </button>
        </div>
      </div>

      {/* Seller Navigation Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-4 mb-6 border-b border-slate-200 text-xs font-bold">
        <button
          onClick={() => setActiveSubTab('products')}
          className={`px-4 py-2.5 rounded-xl transition-all flex items-center gap-2 cursor-pointer ${
            activeSubTab === 'products'
              ? 'bg-slate-900 text-white shadow-xs'
              : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <Package className="w-4 h-4" />
          <span>Product Catalogue ({products.length})</span>
        </button>

        <button
          onClick={() => setActiveSubTab('inventory')}
          className={`px-4 py-2.5 rounded-xl transition-all flex items-center gap-2 cursor-pointer ${
            activeSubTab === 'inventory'
              ? 'bg-slate-900 text-white shadow-xs'
              : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <RefreshCw className="w-4 h-4" />
          <span>Real-Time Inventory & Ledger</span>
        </button>

        <button
          onClick={() => setActiveSubTab('delivery')}
          className={`px-4 py-2.5 rounded-xl transition-all flex items-center gap-2 cursor-pointer ${
            activeSubTab === 'delivery'
              ? 'bg-slate-900 text-white shadow-xs'
              : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <Truck className="w-4 h-4" />
          <span>Delivery & Dispatch Hub ({orders.length})</span>
        </button>

        <button
          onClick={() => setActiveSubTab('analytics')}
          className={`px-4 py-2.5 rounded-xl transition-all flex items-center gap-2 cursor-pointer ${
            activeSubTab === 'analytics'
              ? 'bg-slate-900 text-white shadow-xs'
              : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <BarChart2 className="w-4 h-4" />
          <span>Demand Funnel Analytics</span>
        </button>

        <button
          onClick={() => setActiveSubTab('finance')}
          className={`px-4 py-2.5 rounded-xl transition-all flex items-center gap-2 cursor-pointer ${
            activeSubTab === 'finance'
              ? 'bg-violet-700 text-white shadow-xs'
              : 'bg-violet-50 text-violet-800 hover:bg-violet-100 border border-violet-200 font-bold'
          }`}
        >
          <DollarSign className="w-4 h-4" />
          <span>Confidential Finance Dashboard</span>
        </button>
      </div>

      {/* TAB 1: PRODUCT CATALOGUE */}
      {activeSubTab === 'products' && (
        <div className="space-y-6">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="p-4 border-b border-slate-100 flex items-center justify-between">
              <h3 className="font-extrabold text-slate-900 text-sm">Active Product Listings</h3>
              <span className="text-xs text-slate-500">
                Rule: Available stock = On-hand minus Reserved
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider font-bold border-b border-slate-200">
                  <tr>
                    <th className="p-3.5">Product & SKU</th>
                    <th className="p-3.5">Category</th>
                    <th className="p-3.5">Price / MRP</th>
                    <th className="p-3.5">Stock (Avail / Res / Total)</th>
                    <th className="p-3.5">Express 30-Min</th>
                    <th className="p-3.5">Links & Share</th>
                    <th className="p-3.5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {products.map((p) => {
                    const isLowStock = p.stock.available <= p.stock.lowStockThreshold;
                    const prodUrl = `${window.location.origin}?product=${p.id}`;
                    const enqUrl = `${window.location.origin}?enquire=${encodeURIComponent(p.id)}&sellerId=${encodeURIComponent(p.sellerId || '')}`;

                    return (
                      <tr key={p.id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="p-3.5">
                          <div className="flex items-center gap-3">
                            <img
                              src={p.images[0]}
                              alt={p.name}
                              className="w-10 h-10 rounded-xl object-cover bg-slate-100 shrink-0 border border-slate-200"
                            />
                            <div>
                              <div className="font-bold text-slate-900 line-clamp-1">{p.name}</div>
                              <div className="text-[10px] text-slate-400 font-mono">
                                {p.sku} • {p.brand}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="p-3.5 capitalize text-slate-600">
                          {p.category.replace('-', ' ')}
                        </td>
                        <td className="p-3.5">
                          <span className="font-bold text-slate-900">₹{p.price}</span>
                          <span className="text-[11px] text-slate-400 line-through ml-1.5">
                            ₹{p.mrp}
                          </span>
                        </td>
                        <td className="p-3.5">
                          <div className="flex items-center gap-2">
                            <span
                              className={`font-bold ${
                                isLowStock ? 'text-rose-600' : 'text-emerald-600'
                              }`}
                            >
                              {p.stock.available} avail
                            </span>
                            <span className="text-slate-400 text-[10px]">
                              ({p.stock.reserved} res / {p.stock.onHand} total)
                            </span>
                          </div>
                        </td>
                        <td className="p-3.5">
                          {isProductExpress30MinEligible(p) ? (
                            <span className="bg-emerald-100 text-emerald-800 text-[10px] font-bold px-2 py-0.5 rounded-full inline-flex items-center gap-1">
                              ⚡ 30-Min Active
                            </span>
                          ) : (
                            <span className="text-slate-500 bg-slate-100 text-[10px] font-medium px-2 py-0.5 rounded-full">
                              Standard
                            </span>
                          )}
                        </td>
                        <td className="p-3.5">
                          <div className="flex items-center gap-1.5">
                            <button
                              onClick={() => {
                                navigator.clipboard.writeText(prodUrl);
                                showToast('Product Link Copied!', 'success');
                              }}
                              className="p-1 hover:bg-slate-100 rounded text-slate-500 hover:text-indigo-600"
                              title="Copy Product Link"
                            >
                              <Copy className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => {
                                navigator.clipboard.writeText(enqUrl);
                                showToast('Product Enquiry Link Copied!', 'success');
                              }}
                              className="p-1 hover:bg-slate-100 rounded text-slate-500 hover:text-indigo-600"
                              title="Copy Enquiry Link"
                            >
                              <ExternalLink className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                        <td className="p-3.5 text-right">
                          <div className="flex items-center justify-end gap-1">
                            <button
                              onClick={() => {
                                setRestockTargetProduct(p);
                                setIsRestockOpen(true);
                              }}
                              className="px-2.5 py-1 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 rounded-lg font-bold text-[11px] transition-colors"
                            >
                              Restock
                            </button>
                            <button
                              onClick={() => {
                                setEditingProduct(p);
                                setProductForm(p);
                                setIsAddProductOpen(true);
                              }}
                              className="p-1.5 text-slate-500 hover:text-indigo-600 hover:bg-slate-100 rounded-lg transition-colors"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => handleDeleteProduct(p.id)}
                              className="p-1.5 text-slate-500 hover:text-rose-600 hover:bg-slate-100 rounded-lg transition-colors"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: INVENTORY & AUDIT LEDGER */}
      {activeSubTab === 'inventory' && (
        <div className="space-y-6">
          {/* Low Stock Alerts */}
          {products.some((p) => p.stock.available <= p.stock.lowStockThreshold) && (
            <div className="bg-amber-50 border border-amber-200 rounded-3xl p-5 text-xs text-amber-900 space-y-2">
              <div className="flex items-center gap-2 font-bold text-sm">
                <AlertTriangle className="w-4 h-4 text-amber-600" />
                <span>Low Stock Threshold Alert</span>
              </div>
              <p>The following items are running low and require restock:</p>
              <div className="flex flex-wrap gap-2">
                {products
                  .filter((p) => p.stock.available <= p.stock.lowStockThreshold)
                  .map((p) => (
                    <span
                      key={p.id}
                      className="bg-white border border-amber-300 px-3 py-1 rounded-xl font-semibold"
                    >
                      {p.name}: {p.stock.available} remaining (Threshold: {p.stock.lowStockThreshold})
                    </span>
                  ))}
              </div>
            </div>
          )}

          {/* Audit Movements Ledger Table */}
          <div className="bg-white rounded-3xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="p-4 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h3 className="font-extrabold text-slate-900 text-sm">
                  Immutable Inventory Movement Audit Ledger
                </h3>
                <p className="text-xs text-slate-500">
                  Logs all initial stock allocations, temporary reservation holds, committed checkouts, and restocks.
                </p>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider font-bold border-b border-slate-200">
                  <tr>
                    <th className="p-3.5">Timestamp</th>
                    <th className="p-3.5">Product & SKU</th>
                    <th className="p-3.5">Event Type</th>
                    <th className="p-3.5">Quantity Delta</th>
                    <th className="p-3.5">New Available</th>
                    <th className="p-3.5">Actor / System</th>
                    <th className="p-3.5">Notes</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {movements.map((mov) => (
                    <tr key={mov.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="p-3.5 text-slate-400 font-mono text-[11px]">
                        {new Date(mov.timestamp).toLocaleString()}
                      </td>
                      <td className="p-3.5">
                        <div className="font-bold text-slate-900">{mov.productName}</div>
                        <div className="text-[10px] text-slate-400 font-mono">{mov.sku}</div>
                      </td>
                      <td className="p-3.5">
                        <span
                          className={`px-2 py-0.5 rounded-full font-bold text-[10px] ${
                            mov.type === 'ORDER_COMMITTED'
                              ? 'bg-rose-100 text-rose-800'
                              : mov.type === 'MANUAL_RESTOCK'
                              ? 'bg-emerald-100 text-emerald-800'
                              : mov.type === 'RESERVATION_HOLD'
                              ? 'bg-amber-100 text-amber-800'
                              : 'bg-indigo-100 text-indigo-800'
                          }`}
                        >
                          {mov.type}
                        </span>
                      </td>
                      <td className="p-3.5 font-bold font-mono">
                        <span className={mov.delta > 0 ? 'text-emerald-600' : 'text-rose-600'}>
                          {mov.delta > 0 ? `+${mov.delta}` : mov.delta}
                        </span>
                      </td>
                      <td className="p-3.5 font-bold text-slate-900">{mov.newAvailable}</td>
                      <td className="p-3.5 text-slate-600 font-medium">{mov.actor}</td>
                      <td className="p-3.5 text-slate-500 text-[11px] max-w-xs truncate">
                        {mov.note}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: DELIVERY & DISPATCH HUB */}
      {activeSubTab === 'delivery' && (
        <div className="space-y-6">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="p-4 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h3 className="font-extrabold text-slate-900 text-sm">
                  Active Orders & Fulfilment Stages
                </h3>
                <p className="text-xs text-slate-500">
                  Update order status transitions. Statuses reflect instantly in the customer's live tracking timeline.
                </p>
              </div>
            </div>

            <div className="divide-y divide-slate-100">
              {orders.map((ord) => (
                <div key={ord.id} className="p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-extrabold text-sm text-slate-900 font-mono">
                        #{ord.orderNumber}
                      </span>
                      <span className="text-slate-400">•</span>
                      <span className="text-xs font-semibold text-slate-700">{ord.customerName}</span>
                      {ord.isExpress30Min && (
                        <span className="bg-emerald-100 text-emerald-800 text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1 border border-emerald-300">
                          <Zap className="w-3 h-3 text-amber-500 fill-amber-500" />
                          30-Min Express
                        </span>
                      )}
                    </div>
                    <div className="text-xs text-slate-600">
                      {ord.items.map((it) => `${it.quantity}x ${it.productName}`).join(', ')}
                    </div>
                    <div className="text-[11px] text-slate-400">
                      Deliver to: {ord.shippingAddress.street}, {ord.shippingAddress.city} - {ord.shippingAddress.pincode}
                    </div>
                  </div>

                  {/* Stage Transition Selector */}
                  <div className="flex items-center gap-3">
                    <select
                      value={ord.orderStatus}
                      onChange={(e) => handleOrderStatusChange(ord.id, e.target.value as OrderStatus)}
                      className="bg-slate-50 border border-slate-300 text-slate-900 font-bold text-xs rounded-xl px-3 py-2 cursor-pointer focus:border-indigo-500"
                    >
                      <option value="ORDER_PLACED">Order Placed</option>
                      <option value="ACCEPTED">Accepted</option>
                      <option value="PREPARING">Preparing</option>
                      <option value="READY_FOR_DISPATCH">Ready For Dispatch</option>
                      <option value="SHIPPED">Shipped / In Transit</option>
                      <option value="OUT_FOR_DELIVERY">Out For Delivery</option>
                      <option value="DELIVERED">Delivered</option>
                      <option value="CANCELLED">Cancelled (Restock)</option>
                    </select>

                    <div className="text-right">
                      <div className="font-extrabold text-sm text-slate-900">
                        ₹{ord.totalAmount.toLocaleString('en-IN')}
                      </div>
                      <div className="text-[10px] text-slate-400 font-semibold">{ord.paymentMethod}</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: DEMAND FUNNEL ANALYTICS */}
      {activeSubTab === 'analytics' && analytics && (
        <div className="space-y-6">
          {/* Key Metrics Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-xs">
              <span className="text-xs text-slate-500 font-semibold">Store Impressions</span>
              <div className="text-2xl font-extrabold text-slate-900 mt-1">
                {analytics.impressions.toLocaleString()}
              </div>
              <span className="text-[11px] text-emerald-600 font-bold mt-1 inline-block">
                +14.2% this week
              </span>
            </div>

            <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-xs">
              <span className="text-xs text-slate-500 font-semibold">Instagram Referrals</span>
              <div className="text-2xl font-extrabold text-pink-600 mt-1">
                {analytics.instagramClicks.toLocaleString()}
              </div>
              <span className="text-[11px] text-slate-400 mt-1 inline-block">Direct Story Clicks</span>
            </div>

            <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-xs">
              <span className="text-xs text-slate-500 font-semibold">AI Chats Completed</span>
              <div className="text-2xl font-extrabold text-indigo-600 mt-1">
                {analytics.aiConversationsCompleted.toLocaleString()}
              </div>
              <span className="text-[11px] text-indigo-600 font-bold mt-1 inline-block">
                {analytics.qualifiedLeads} Qualified Leads
              </span>
            </div>

            <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-xs">
              <span className="text-xs text-slate-500 font-semibold">Confirmed Orders</span>
              <div className="text-2xl font-extrabold text-emerald-600 mt-1">
                {analytics.ordersPaidOrConfirmed}
              </div>
              <span className="text-[11px] text-slate-400 mt-1 inline-block">
                Conversion: {analytics.conversionRates.overallConversion}%
              </span>
            </div>
          </div>

          {/* Conversion Funnel Breakdown */}
          <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs space-y-4">
            <h3 className="font-extrabold text-slate-900 text-sm">
              Multi-Stage Shopping Demand Funnel
            </h3>
            <div className="space-y-3">
              {[
                { label: 'Storefront Impressions', value: analytics.impressions, pct: 100 },
                { label: 'Zyro AI Enquiries Started', value: analytics.enquiriesStarted, pct: 60 },
                { label: 'AI Voice & Text Conversations', value: analytics.aiConversationsCompleted, pct: 45 },
                { label: 'Added to Cart', value: analytics.addToCartEvents, pct: 32 },
                { label: 'Checkouts Started', value: analytics.checkoutStarts, pct: 24 },
                { label: 'Orders Successfully Placed', value: analytics.ordersPlaced, pct: 18 },
                { label: 'Orders Delivered', value: analytics.ordersDelivered, pct: 15 },
              ].map((step, idx) => (
                <div key={idx} className="space-y-1">
                  <div className="flex justify-between text-xs font-semibold">
                    <span className="text-slate-700">{step.label}</span>
                    <span className="font-bold text-slate-900">{step.value}</span>
                  </div>
                  <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-indigo-500 to-violet-600 rounded-full transition-all duration-500"
                      style={{ width: `${step.pct}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Objections & Most Enquired Products */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs space-y-3">
              <h4 className="font-bold text-slate-900 text-sm">Top Enquired Products</h4>
              <div className="divide-y divide-slate-100 text-xs">
                {analytics.topEnquiredProducts.map((p, i) => (
                  <div key={i} className="py-2.5 flex items-center justify-between">
                    <span className="font-semibold text-slate-800">{p.productName}</span>
                    <span className="font-bold text-indigo-600">{p.count} conversations</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs space-y-3">
              <h4 className="font-bold text-slate-900 text-sm">Common Objections & Resolutions</h4>
              <div className="divide-y divide-slate-100 text-xs">
                {analytics.commonObjections.map((obj, i) => (
                  <div key={i} className="py-2.5 flex items-center justify-between">
                    <div>
                      <div className="font-semibold text-slate-800">{obj.reason}</div>
                      <span className="text-[10px] text-slate-400">Total Queries: {obj.count}</span>
                    </div>
                    <span className="text-emerald-700 font-bold bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200">
                      {obj.resolvedCount} Resolved
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 5: CONFIDENTIAL SELLER FINANCE */}
      {activeSubTab === 'finance' && finance && (
        <div className="space-y-6">
          <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 text-xs text-amber-900 flex items-center gap-2">
            <ShieldAlert className="w-4 h-4 text-amber-600 shrink-0" />
            <span>
              <strong>Confidential Business Financial Statement:</strong> Accessible strictly to verified sellers and administrators. All figures calculated using immutable server purchase price snapshots.
            </span>
          </div>

          {/* Summary Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                Gross Merchandise Sales (GMV)
              </span>
              <div className="text-2xl font-extrabold text-slate-900 mt-1">
                ₹{finance.grossMerchandiseSales.toLocaleString('en-IN')}
              </div>
              <p className="text-[11px] text-slate-400 mt-1">Total value of all placed customer orders</p>
            </div>

            <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                Net Sales Revenue
              </span>
              <div className="text-2xl font-extrabold text-indigo-600 mt-1">
                ₹{finance.netSales.toLocaleString('en-IN')}
              </div>
              <p className="text-[11px] text-slate-400 mt-1">GMV minus discounts & refunds</p>
            </div>

            <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                Estimated Net Profit
              </span>
              <div className="text-2xl font-extrabold text-emerald-600 mt-1">
                ₹{finance.estimatedNetProfit.toLocaleString('en-IN')}
              </div>
              <p className="text-[11px] text-slate-400 mt-1">After COGS, platform fee & gateway charges</p>
            </div>
          </div>

          {/* Transparent Accounting Breakdown Table */}
          <div className="bg-white rounded-3xl border border-slate-200 shadow-xs p-6 space-y-4">
            <h3 className="font-extrabold text-slate-900 text-sm">
              Comprehensive Financial Ledger & Settlement Breakdown
            </h3>

            <div className="divide-y divide-slate-100 text-xs">
              <div className="py-2.5 flex justify-between font-medium">
                <span className="text-slate-600">Gross Merchandise Value (GMV)</span>
                <span className="font-bold text-slate-900">
                  ₹{finance.grossMerchandiseSales.toLocaleString('en-IN')}
                </span>
              </div>
              <div className="py-2.5 flex justify-between text-rose-600 font-medium">
                <span>Less: Seller Discounts Given</span>
                <span>- ₹{finance.sellerDiscounts.toLocaleString('en-IN')}</span>
              </div>
              <div className="py-2.5 flex justify-between text-rose-600 font-medium">
                <span>Less: Cancellations & Refunds</span>
                <span>- ₹{finance.refundsAndCancellations.toLocaleString('en-IN')}</span>
              </div>
              <div className="py-2.5 flex justify-between font-bold text-slate-900 border-t border-slate-200 bg-slate-50 px-2 rounded-lg">
                <span>= Net Sales</span>
                <span>₹{finance.netSales.toLocaleString('en-IN')}</span>
              </div>
              <div className="py-2.5 flex justify-between text-slate-600">
                <span>Less: Cost of Goods Sold (COGS)</span>
                <span className="text-rose-600 font-medium">- ₹{finance.costOfGoodsSold.toLocaleString('en-IN')}</span>
              </div>
              <div className="py-2.5 flex justify-between font-bold text-slate-900 bg-emerald-50/50 px-2 rounded-lg">
                <span>= Estimated Gross Profit</span>
                <span className="text-emerald-700">₹{finance.estimatedGrossProfit.toLocaleString('en-IN')}</span>
              </div>
              <div className="py-2.5 flex justify-between text-slate-600">
                <span>Less: Payment Gateway Fees (2% on Online)</span>
                <span className="text-rose-600 font-medium">- ₹{finance.paymentGatewayFees.toLocaleString('en-IN')}</span>
              </div>
              <div className="py-2.5 flex justify-between text-slate-600">
                <span>Less: Marketplace Commission & Operations</span>
                <span className="text-rose-600 font-medium">- ₹{finance.platformCommissionAndExpenses.toLocaleString('en-IN')}</span>
              </div>
              <div className="py-3 flex justify-between text-sm font-extrabold text-emerald-800 bg-emerald-100/60 px-3 rounded-xl border border-emerald-200">
                <span>= Final Estimated Net Profit</span>
                <span>₹{finance.estimatedNetProfit.toLocaleString('en-IN')}</span>
              </div>
            </div>

            {/* Settlements Status */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4 border-t border-slate-200 text-xs">
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-1.5">
                <span className="font-bold text-slate-700 block">Cash on Delivery (COD) Settlements:</span>
                <div className="flex justify-between">
                  <span className="text-slate-500">COD Collected (Delivered):</span>
                  <span className="font-bold text-emerald-600">₹{finance.codCollected.toLocaleString('en-IN')}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">COD Pending Collection:</span>
                  <span className="font-bold text-amber-600">₹{finance.codPendingSettlement.toLocaleString('en-IN')}</span>
                </div>
              </div>

              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-1.5">
                <span className="font-bold text-slate-700 block">Online Razorpay Settlements:</span>
                <div className="flex justify-between">
                  <span className="text-slate-500">Settled to Bank Account:</span>
                  <span className="font-bold text-emerald-600">₹{finance.onlineSettled.toLocaleString('en-IN')}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Pending T+1 Settlement:</span>
                  <span className="font-bold text-indigo-600">₹{finance.onlinePendingSettlement.toLocaleString('en-IN')}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: ADD / EDIT PRODUCT */}
      {isAddProductOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-6 shadow-2xl border border-slate-200 space-y-4 my-8 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-extrabold text-slate-900 text-base">
                {editingProduct ? 'Edit Store Product' : 'Create New Product Listing'}
              </h3>
              <button
                onClick={() => setIsAddProductOpen(false)}
                className="text-slate-400 hover:text-slate-600 font-bold text-base cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveProduct} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="sm:col-span-2">
                  <label className="block font-semibold text-slate-700 mb-1">Product Title</label>
                  <input
                    type="text"
                    required
                    value={productForm.name}
                    onChange={(e) => setProductForm({ ...productForm, name: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-900 font-medium"
                    placeholder="e.g., Dolo 650 Tablet"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Brand Name</label>
                  <input
                    type="text"
                    required
                    value={productForm.brand}
                    onChange={(e) => setProductForm({ ...productForm, brand: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-900 font-medium"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Category</label>
                  <select
                    value={productForm.category}
                    onChange={(e) => setProductForm({ ...productForm, category: e.target.value as any })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-900 font-medium cursor-pointer"
                  >
                    {categories.map((c) => (
                      <option key={c.id} value={c.slug}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">SKU Code</label>
                  <input
                    type="text"
                    required
                    value={productForm.sku}
                    onChange={(e) => setProductForm({ ...productForm, sku: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-900 font-medium font-mono"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Initial On-Hand Stock</label>
                  <input
                    type="number"
                    min="0"
                    value={productForm.stock?.onHand}
                    onChange={(e) =>
                      setProductForm({
                        ...productForm,
                        stock: { ...productForm.stock!, onHand: Number(e.target.value) },
                      })
                    }
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-900 font-bold"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Maximum Retail Price (MRP ₹)</label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={productForm.mrp}
                    onChange={(e) => setProductForm({ ...productForm, mrp: Number(e.target.value) })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-900 font-medium"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Selling Price (₹)</label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={productForm.price}
                    onChange={(e) => setProductForm({ ...productForm, price: Number(e.target.value) })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-900 font-bold text-indigo-700"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block font-semibold text-slate-700 mb-1">Cost Price (COGS ₹ for Profit computation)</label>
                  <input
                    type="number"
                    min="1"
                    value={productForm.costPrice}
                    onChange={(e) => setProductForm({ ...productForm, costPrice: Number(e.target.value) })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-900 font-medium"
                  />
                </div>

                {/* Product Photo Upload Section */}
                <div className="sm:col-span-2 bg-slate-50 border border-slate-200 rounded-2xl p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="font-bold text-slate-900 text-xs flex items-center gap-1.5">
                        <ImageIcon className="w-4 h-4 text-indigo-600" />
                        Product Photos (Upload from Device or paste Image URL)
                      </span>
                      <p className="text-[11px] text-slate-500 mt-0.5">
                        Upload product photos (JPG, PNG, WebP up to 5MB). Set the primary photo or remove photos.
                      </p>
                    </div>
                    <span className="text-[11px] font-bold text-indigo-600">
                      {(productForm.images || []).length} photo{(productForm.images || []).length === 1 ? '' : 's'} attached
                    </span>
                  </div>

                  <input
                    type="file"
                    id="product-photo-upload-input"
                    accept="image/jpeg,image/png,image/webp,image/jpg"
                    multiple
                    className="hidden"
                    onChange={handleImageFilesUpload}
                  />

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <label
                      htmlFor="product-photo-upload-input"
                      className="border-2 border-dashed border-indigo-200 hover:border-indigo-400 bg-white rounded-xl p-3 flex items-center justify-center gap-2 cursor-pointer transition-all hover:bg-indigo-50/20 text-center"
                    >
                      <UploadCloud className="w-4 h-4 text-indigo-600" />
                      <span className="font-bold text-xs text-indigo-900">
                        {imageUploading ? 'Uploading Photos...' : 'Upload Photos from Computer/Phone'}
                      </span>
                    </label>

                    <div className="flex gap-1.5">
                      <input
                        type="url"
                        placeholder="Or paste image URL..."
                        value={newImageUrlInput}
                        onChange={(e) => setNewImageUrlInput(e.target.value)}
                        className="flex-1 bg-white border border-slate-200 rounded-xl px-3 py-1.5 text-xs text-slate-800"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          if (newImageUrlInput.trim()) {
                            setProductForm((prev) => ({
                              ...prev,
                              images: [
                                ...(prev.images || []).filter(
                                  (img) =>
                                    !img.includes('photo-1584308666744-24d5c474f2ae') &&
                                    !img.includes('photo-1523275335684-37898b6baf30')
                                ),
                                newImageUrlInput.trim(),
                              ],
                            }));
                            setNewImageUrlInput('');
                          }
                        }}
                        className="px-3 py-1.5 bg-slate-800 hover:bg-slate-900 text-white font-bold rounded-xl text-xs cursor-pointer"
                      >
                        Add URL
                      </button>
                    </div>
                  </div>

                  {(productForm.images || []).length > 0 && (
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1">
                      {(productForm.images || []).map((imgUrl, idx) => (
                        <div key={idx} className="relative group rounded-xl overflow-hidden border border-slate-200 bg-white aspect-square shadow-xs">
                          <img
                            src={imgUrl}
                            alt={`Product thumbnail ${idx + 1}`}
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              (e.currentTarget as HTMLImageElement).src = 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=800&q=80';
                            }}
                          />
                          {idx === 0 ? (
                            <span className="absolute top-1.5 left-1.5 bg-emerald-600 text-white text-[9px] font-extrabold px-1.5 py-0.5 rounded-md shadow-xs">
                              Primary Photo
                            </span>
                          ) : (
                            <button
                              type="button"
                              onClick={() => {
                                const copy = [...(productForm.images || [])];
                                const [target] = copy.splice(idx, 1);
                                copy.unshift(target);
                                setProductForm({ ...productForm, images: copy });
                              }}
                              className="absolute top-1.5 left-1.5 bg-black/60 hover:bg-black/90 text-white text-[9px] font-bold px-1.5 py-0.5 rounded-md opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                            >
                              Set Primary
                            </button>
                          )}

                          <button
                            type="button"
                            onClick={() => {
                              const updated = (productForm.images || []).filter((_, i) => i !== idx);
                              setProductForm({ ...productForm, images: updated });
                            }}
                            className="absolute top-1.5 right-1.5 w-6 h-6 rounded-full bg-rose-600 text-white flex items-center justify-center opacity-80 hover:opacity-100 transition-opacity shadow-xs cursor-pointer font-bold text-xs"
                            title="Delete this photo"
                          >
                            ✕
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="sm:col-span-2">
                  <label className="block font-semibold text-slate-700 mb-1">Instagram Story/Post URL</label>
                  <input
                    type="url"
                    value={productForm.instagramUrl || ''}
                    onChange={(e) => setProductForm({ ...productForm, instagramUrl: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-900 font-medium"
                    placeholder="https://instagram.com/p/..."
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block font-semibold text-slate-700 mb-1">Full Description</label>
                  <textarea
                    rows={3}
                    value={productForm.description}
                    onChange={(e) => setProductForm({ ...productForm, description: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-900 font-medium"
                    placeholder="Describe key ingredients, specifications, and warranty..."
                  />
                </div>

                {/* PDF Document Attachment Section */}
                <div className="sm:col-span-2 bg-indigo-50/50 border border-indigo-100 rounded-2xl p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="font-bold text-slate-900 text-xs flex items-center gap-1.5">
                        <FileText className="w-4 h-4 text-indigo-600" />
                        Attach Product PDF Specification / Lab Certificate (Optional)
                      </span>
                      <p className="text-[11px] text-slate-500 mt-0.5">
                        Upload a PDF manual, composition sheet, or dosage monograph. Zyro AI will read this to answer shopper questions.
                      </p>
                    </div>
                    {productForm.pdfDocName && (
                      <button
                        type="button"
                        onClick={() => {
                          setProductForm({
                            ...productForm,
                            pdfDocName: '',
                            pdfDocUrl: '',
                            pdfExtractedText: '',
                          });
                          setProductPdfSuccess(null);
                        }}
                        className="text-[11px] text-rose-600 hover:text-rose-800 font-bold flex items-center gap-1 cursor-pointer"
                      >
                        <X className="w-3.5 h-3.5" />
                        Remove PDF
                      </button>
                    )}
                  </div>

                  {/* Hidden File Input */}
                  <input
                    type="file"
                    id="product-pdf-upload-input"
                    accept=".pdf,application/pdf"
                    className="hidden"
                    onChange={handleProductPdfFileChange}
                  />

                  {/* Drag & Drop / Click Zone */}
                  {!productForm.pdfDocName ? (
                    <label
                      htmlFor="product-pdf-upload-input"
                      className="border-2 border-dashed border-indigo-200 hover:border-indigo-400 bg-white rounded-xl p-4 flex flex-col items-center justify-center gap-2 cursor-pointer transition-all hover:bg-indigo-50/30 text-center"
                    >
                      <div className="w-9 h-9 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center">
                        <UploadCloud className="w-5 h-5" />
                      </div>
                      <div>
                        <span className="font-bold text-xs text-indigo-900 block">
                          {productPdfUploading ? 'Extracting PDF Text...' : 'Click to select or drop a PDF document (.pdf)'}
                        </span>
                        <span className="text-[10px] text-slate-400">
                          Supports medicine monographs, test certificates, product guides, and manuals
                        </span>
                      </div>
                    </label>
                  ) : (
                    <div className="bg-white rounded-xl p-3 border border-emerald-200 space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                          <span className="font-bold text-xs text-slate-900">{productForm.pdfDocName}</span>
                        </div>
                        <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                          ✓ PDF Accepted & Text Extracted
                        </span>
                      </div>

                      {productPdfSuccess && (
                        <div className="text-[11px] text-emerald-700 font-medium">
                          {productPdfSuccess}
                        </div>
                      )}

                      {productForm.pdfExtractedText && (
                        <div>
                          <label className="block text-[10px] font-semibold text-slate-500 mb-0.5">
                            Extracted Knowledge Content (Editable for Zyro AI):
                          </label>
                          <textarea
                            rows={3}
                            value={productForm.pdfExtractedText}
                            onChange={(e) => setProductForm({ ...productForm, pdfExtractedText: e.target.value })}
                            className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-[11px] text-slate-800 font-mono"
                          />
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Location-Based Selling & Hyperlocal Quick Delivery Section */}
                <div className="sm:col-span-2 bg-amber-50/50 border border-amber-200/80 rounded-2xl p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <MapPin className="w-4 h-4 text-amber-600" />
                      <div>
                        <span className="font-bold text-slate-900 text-xs">
                          Location-Based Selling & Hyperlocal Delivery Options
                        </span>
                        <p className="text-[11px] text-slate-500">
                          Configure geographic delivery radius, city hub, and PIN codes for 30-minute quick delivery.
                        </p>
                      </div>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={productForm.deliveryConfig?.locationBasedSellingEnabled === true}
                        onChange={(e) => {
                          const isEnabled = e.target.checked;
                          setProductForm({
                            ...productForm,
                            deliveryConfig: {
                              ...(productForm.deliveryConfig || {
                                preparationMinutes: 15,
                                standardDeliveryDays: 2,
                                shippingFee: 25,
                                freeShippingAbove: 499,
                                returnPolicyDays: 7,
                                serviceablePincodes: ['560001', '560038', '560103', '560068', '560034'],
                                serviceCity: 'Bangalore',
                                quickDeliveryCharge: 40,
                                deliverySpeed: 'standard',
                              }),
                              locationBasedSellingEnabled: isEnabled,
                              supportsExpress30Min:
                                isEnabled &&
                                (productForm.deliveryConfig?.deliverySpeed === 'quick_30min' ||
                                  productForm.deliveryConfig?.deliverySpeed === 'all'),
                            },
                          });
                        }}
                        className="sr-only peer"
                      />
                      <div className="w-9 h-5 bg-slate-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-amber-600"></div>
                    </label>
                  </div>

                  {productForm.deliveryConfig?.locationBasedSellingEnabled !== true && (
                    <div className="p-2 bg-slate-100 rounded-xl text-[11px] text-slate-600 flex items-center justify-between font-medium">
                      <span>Status: Hyperlocal disabled — product will use standard delivery without 30-min badge.</span>
                      <span className="text-[10px] bg-slate-200 px-2 py-0.5 rounded-full font-bold">Standard Tracked Only</span>
                    </div>
                  )}

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
                    <div>
                      <label className="block font-semibold text-slate-700 mb-1">Service City / Region</label>
                      <input
                        type="text"
                        value={productForm.deliveryConfig?.serviceCity || 'Bangalore'}
                        onChange={(e) =>
                          setProductForm({
                            ...productForm,
                            deliveryConfig: {
                              ...(productForm.deliveryConfig || {
                                supportsExpress30Min: false,
                                locationBasedSellingEnabled: false,
                                preparationMinutes: 15,
                                standardDeliveryDays: 2,
                                shippingFee: 25,
                                freeShippingAbove: 499,
                                returnPolicyDays: 7,
                                serviceablePincodes: [],
                              }),
                              serviceCity: e.target.value,
                            },
                          })
                        }
                        className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-slate-900 font-medium"
                        placeholder="e.g. Bangalore"
                      />
                    </div>

                    <div>
                      <label className="block font-semibold text-slate-700 mb-1">Delivery Speed Tier</label>
                      <select
                        value={productForm.deliveryConfig?.deliverySpeed || 'all'}
                        onChange={(e) => {
                          const val = e.target.value as any;
                          const isLocEnabled = productForm.deliveryConfig?.locationBasedSellingEnabled === true;
                          setProductForm({
                            ...productForm,
                            deliveryConfig: {
                              ...(productForm.deliveryConfig || {
                                preparationMinutes: 15,
                                standardDeliveryDays: 2,
                                shippingFee: 25,
                                freeShippingAbove: 499,
                                returnPolicyDays: 7,
                                serviceablePincodes: [],
                                locationBasedSellingEnabled: false,
                              }),
                              deliverySpeed: val,
                              supportsExpress30Min: isLocEnabled && (val === 'quick_30min' || val === 'all'),
                            },
                          });
                        }}
                        className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-slate-900 font-medium cursor-pointer"
                      >
                        <option value="all">⚡ 30-Minute Quick Delivery + Standard (All)</option>
                        <option value="quick_30min">⚡ 30-Minute Hyperlocal Only</option>
                        <option value="express_sameday">🚀 Same-Day Express</option>
                        <option value="standard">📦 Standard Delivery (1-3 Days)</option>
                      </select>
                    </div>

                    <div>
                      <label className="block font-semibold text-slate-700 mb-1">Standard Delivery Fee (₹)</label>
                      <input
                        type="number"
                        min="0"
                        value={productForm.deliveryConfig?.shippingFee ?? 25}
                        onChange={(e) =>
                          setProductForm({
                            ...productForm,
                            deliveryConfig: {
                              ...(productForm.deliveryConfig || {
                                supportsExpress30Min: true,
                                preparationMinutes: 15,
                                standardDeliveryDays: 2,
                                freeShippingAbove: 499,
                                returnPolicyDays: 7,
                                serviceablePincodes: [],
                              }),
                              shippingFee: Number(e.target.value),
                            },
                          })
                        }
                        className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-slate-900 font-medium"
                      />
                    </div>

                    <div className="sm:col-span-2">
                      <label className="block font-semibold text-slate-700 mb-1">
                        Serviceable PIN Codes (Comma Separated)
                      </label>
                      <input
                        type="text"
                        value={(productForm.deliveryConfig?.serviceablePincodes || []).join(', ')}
                        onChange={(e) => {
                          const pins = e.target.value
                            .split(',')
                            .map((p) => p.trim())
                            .filter(Boolean);
                          setProductForm({
                            ...productForm,
                            deliveryConfig: {
                              ...(productForm.deliveryConfig || {
                                supportsExpress30Min: true,
                                preparationMinutes: 15,
                                standardDeliveryDays: 2,
                                shippingFee: 25,
                                freeShippingAbove: 499,
                                returnPolicyDays: 7,
                              }),
                              serviceablePincodes: pins,
                            },
                          });
                        }}
                        className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-slate-900 font-mono text-xs"
                        placeholder="e.g. 560001, 560038, 560103, 560068, 560034"
                      />
                      <span className="text-[10px] text-slate-400 mt-1 block">
                        Enter '*' to allow nationwide delivery or specific postal PIN codes for rapid hyperlocal dispatch.
                      </span>
                    </div>

                    <div>
                      <label className="block font-semibold text-slate-700 mb-1">Quick 30-Min Surcharge (₹)</label>
                      <input
                        type="number"
                        min="0"
                        value={productForm.deliveryConfig?.quickDeliveryCharge ?? 40}
                        onChange={(e) =>
                          setProductForm({
                            ...productForm,
                            deliveryConfig: {
                              ...(productForm.deliveryConfig || {
                                supportsExpress30Min: true,
                                preparationMinutes: 15,
                                standardDeliveryDays: 2,
                                shippingFee: 25,
                                freeShippingAbove: 499,
                                returnPolicyDays: 7,
                                serviceablePincodes: [],
                              }),
                              quickDeliveryCharge: Number(e.target.value),
                            },
                          })
                        }
                        className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-slate-900 font-medium"
                      />
                    </div>
                  </div>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsAddProductOpen(false)}
                  className="px-4 py-2 border border-slate-200 rounded-xl font-bold text-slate-600 hover:bg-slate-100 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl shadow-md cursor-pointer"
                >
                  {editingProduct ? 'Save Changes' : 'Publish Product'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: RESTOCK QUANTITY */}
      {isRestockOpen && restockTargetProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <h3 className="font-extrabold text-slate-900 text-sm">
              Restock Inventory: {restockTargetProduct.name}
            </h3>
            <p className="text-xs text-slate-500">
              Current available: {restockTargetProduct.stock.available} units. Adding stock updates the inventory ledger immediately.
            </p>

            <form onSubmit={handleRestockSubmit} className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Units to Add</label>
                <input
                  type="number"
                  min="1"
                  required
                  value={restockQty}
                  onChange={(e) => setRestockQty(Number(e.target.value))}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 font-extrabold text-slate-900 text-sm"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Ledger Audit Note</label>
                <input
                  type="text"
                  value={restockNote}
                  onChange={(e) => setRestockNote(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-900 font-medium"
                />
              </div>

              <div className="pt-3 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsRestockOpen(false)}
                  className="px-4 py-2 border border-slate-200 rounded-xl font-bold text-slate-600 hover:bg-slate-100 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl shadow-md cursor-pointer"
                >
                  Confirm Restock
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: UPLOAD SELLER PDF KNOWLEDGE BASE */}
      {isUploadDocOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-extrabold text-slate-900 text-sm flex items-center gap-2">
                <FileText className="w-4 h-4 text-indigo-600" />
                Upload PDF Manual & Knowledge Base Document
              </h3>
              <button
                onClick={() => setIsUploadDocOpen(false)}
                className="text-slate-400 hover:text-slate-600 font-bold cursor-pointer"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-slate-500 leading-relaxed">
              When uploaded, document text is extracted, isolated per seller, and indexed for Zyro AI retrieval-augmented generation (RAG).
            </p>

            <form onSubmit={handleUploadDocument} className="space-y-3 text-xs">
              {/* PDF File Picker Dropzone */}
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Select PDF File (.pdf)</label>
                <input
                  type="file"
                  id="knowledge-pdf-upload-input"
                  accept=".pdf,application/pdf"
                  className="hidden"
                  onChange={handleKnowledgeDocPdfFileChange}
                />
                <label
                  htmlFor="knowledge-pdf-upload-input"
                  className="border-2 border-dashed border-indigo-200 hover:border-indigo-400 bg-slate-50 hover:bg-indigo-50/30 rounded-xl p-3 flex items-center justify-center gap-2 cursor-pointer transition-colors"
                >
                  <UploadCloud className="w-4 h-4 text-indigo-600" />
                  <span className="font-bold text-xs text-indigo-900">
                    {docPdfUploading ? 'Extracting PDF...' : 'Choose or drop PDF document (.pdf)'}
                  </span>
                </label>
                {docPdfSuccess && (
                  <p className="mt-1 text-[11px] text-emerald-600 font-semibold flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    {docPdfSuccess}
                  </p>
                )}
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Document File Name</label>
                <input
                  type="text"
                  required
                  value={docFileName}
                  onChange={(e) => setDocFileName(e.target.value)}
                  placeholder="e.g. Dolo-650-Dosage-Guide.pdf"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-900 font-medium"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Product Association (Optional)</label>
                <select
                  value={docProductId}
                  onChange={(e) => setDocProductId(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-900 font-medium cursor-pointer"
                >
                  <option value="">Store-wide / Category-wide</option>
                  {products.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Extracted Text Content / Manual Content</label>
                <textarea
                  rows={4}
                  required
                  value={docText}
                  onChange={(e) => setDocText(e.target.value)}
                  placeholder="Paste manual specifications, dosage rules, or warranty policy..."
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-900 font-medium"
                />
              </div>

              <div className="pt-3 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsUploadDocOpen(false)}
                  className="px-4 py-2 border border-slate-200 rounded-xl font-bold text-slate-600 hover:bg-slate-100 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl shadow-md cursor-pointer"
                >
                  Index into Zyro AI
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
