import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext.tsx';
import { ProductCard } from './ProductCard.tsx';
import { Product, User } from '../types/index.ts';
import { api } from '../services/api.ts';
import { isProductExpress30MinEligible } from '../utils/delivery.ts';
import {
  Sparkles,
  Zap,
  Filter,
  ArrowUpDown,
  Search,
  PackageCheck,
  Layers,
  Store,
  MapPin,
  Info,
  ChevronLeft
} from 'lucide-react';

interface SellerStorefrontViewProps {
  sellerId: string;
}

export const SellerStorefrontView: React.FC<SellerStorefrontViewProps> = ({ sellerId }) => {
  const { setActiveTab, showToast } = useApp();

  const [seller, setSeller] = useState<User | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'newest' | 'rating' | 'price-asc' | 'price-desc'>('newest');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [expressOnly, setExpressOnly] = useState(false);

  useEffect(() => {
    const loadSellerData = async () => {
      setLoading(true);
      try {
        // Fetch all products for this seller
        const allProducts = await api.getProducts({ sellerId });
        setProducts(allProducts);

        // Try to find the seller info from the products or a separate API if available
        // For now, we use the seller info from the first product
        if (allProducts.length > 0) {
          setSeller({
            id: allProducts[0].sellerId,
            name: allProducts[0].sellerName,
            role: 'seller',
            storeName: allProducts[0].sellerName,
            createdAt: new Date().toISOString(),
            email: '',
            phone: ''
          } as User);
        }
      } catch (err: any) {
        showToast(`Failed to load store: ${err.message}`, 'error');
      } finally {
        setLoading(false);
      }
    };

    if (sellerId) {
      loadSellerData();
    }
  }, [sellerId]);

  const filteredProducts = products.filter((p) => {
    if (selectedCategory !== 'all' && p.category !== selectedCategory) return false;
    if (expressOnly && !isProductExpress30MinEligible(p)) return false;
    if (searchQuery && !p.name.toLowerCase().includes(searchQuery.toLowerCase()) && !p.description.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    return true;
  });

  const categories = ['all', ...Array.from(new Set(products.map((p) => p.category)))];

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
        <div className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
        <p className="text-slate-500 font-medium">Loading store experience...</p>
      </div>
    );
  }

  if (!seller && products.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-6 px-4 text-center">
        <div className="bg-slate-100 p-6 rounded-full">
          <Store className="w-12 h-12 text-slate-400" />
        </div>
        <div className="space-y-2">
          <h2 className="text-2xl font-bold text-slate-800">Store Not Found</h2>
          <p className="text-slate-500 max-w-md">This seller might not have any published products or the link is incorrect.</p>
        </div>
        <button
          onClick={() => setActiveTab('storefront')}
          className="px-6 py-2.5 bg-indigo-600 text-white font-bold rounded-xl shadow-lg hover:bg-indigo-700 transition-all"
        >
          Return to Marketplace
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in pb-16">
      {/* Back Button */}
      <div className="px-4 sm:px-6 lg:px-8 pt-4">
        <button
          onClick={() => setActiveTab('storefront')}
          className="flex items-center gap-2 text-slate-500 hover:text-indigo-600 font-bold text-xs transition-colors cursor-pointer group"
        >
          <ChevronLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
          Back to Marketplace
        </button>
      </div>

      {/* Seller Store Banner */}
      <div className="relative overflow-hidden bg-gradient-to-br from-indigo-900 via-slate-900 to-indigo-950 text-white rounded-3xl mx-4 sm:mx-6 lg:mx-8 p-6 sm:p-10 lg:p-12 shadow-2xl border border-indigo-800/30">
        <div className="absolute top-0 right-0 w-80 h-80 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20"></div>
        
        <div className="relative z-10 flex flex-col md:flex-row gap-8 items-start md:items-center justify-between">
          <div className="space-y-4">
            <div className="inline-flex items-center gap-2 bg-emerald-500/20 text-emerald-300 text-[10px] font-black px-3 py-1 rounded-full border border-emerald-500/30 uppercase tracking-widest">
              <PackageCheck className="w-3 h-3" />
              <span>Verified Seller Store</span>
            </div>

            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight leading-tight flex items-center gap-3">
              <Store className="w-8 h-8 sm:w-12 sm:h-12 text-indigo-400" />
              {seller?.storeName || seller?.name || 'Seller Store'}
            </h1>

            <p className="text-slate-300 text-xs sm:text-sm leading-relaxed max-w-xl italic font-medium opacity-80">
              "{seller?.storeDescription || 'Providing curated quality products with verified excellence.'}"
            </p>

            <div className="flex flex-wrap gap-4 text-xs font-bold text-slate-400 pt-2">
              <div className="flex items-center gap-1.5">
                <MapPin className="w-4 h-4 text-indigo-500" />
                <span>Shipping from Bangalore Hub</span>
              </div>
              <div className="flex items-center gap-1.5 text-emerald-400">
                <Zap className="w-4 h-4" />
                <span>30-Min Delivery Eligible</span>
              </div>
            </div>
          </div>

          <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-6 flex flex-col items-center justify-center space-y-2 min-w-[200px]">
            <div className="text-3xl font-black text-white">{products.length}</div>
            <div className="text-[10px] uppercase font-bold text-slate-400 tracking-tighter">Total Products</div>
            <div className="pt-4 w-full">
               <button 
                onClick={() => setActiveTab('ai-shopping')}
                className="w-full py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-[10px] font-black uppercase tracking-widest transition-all shadow-lg shadow-indigo-900/40"
               >
                 Ask AI about this store
               </button>
            </div>
          </div>
        </div>
      </div>

      {/* Product Filters & Search */}
      <div className="px-4 sm:px-6 lg:px-8">
        <div className="bg-white border border-slate-200 rounded-3xl p-4 sm:p-6 shadow-xl space-y-6">
          <div className="flex flex-col lg:flex-row gap-4 justify-between items-start lg:items-center">
            {/* Search */}
            <div className="relative w-full lg:max-w-md group">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-indigo-600 transition-colors" />
              <input
                type="text"
                placeholder="Search products in this store..."
                className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-sm font-medium"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>

            {/* Sorting & Express Toggle */}
            <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto">
              <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 px-3 py-2 rounded-2xl">
                <ArrowUpDown className="w-4 h-4 text-slate-400" />
                <select
                  className="bg-transparent text-sm font-bold text-slate-700 focus:outline-none cursor-pointer"
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as any)}
                >
                  <option value="newest">Newest First</option>
                  <option value="rating">Top Rated</option>
                  <option value="price-asc">Price: Low to High</option>
                  <option value="price-desc">Price: High to Low</option>
                </select>
              </div>

              <button
                onClick={() => setExpressOnly(!expressOnly)}
                className={`flex items-center gap-2 px-4 py-2 rounded-2xl border transition-all font-bold text-sm cursor-pointer ${
                  expressOnly
                    ? 'bg-emerald-50 border-emerald-200 text-emerald-700 shadow-sm shadow-emerald-100'
                    : 'bg-white border-slate-200 text-slate-600 hover:border-indigo-200'
                }`}
              >
                <Zap className={`w-4 h-4 ${expressOnly ? 'fill-emerald-500' : ''}`} />
                <span>30-Min Delivery</span>
              </button>
            </div>
          </div>

          {/* Category Quick Filter Chips */}
          <div className="flex items-center gap-3 overflow-x-auto pb-2 scrollbar-none">
            <div className="flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-widest pr-2 border-r border-slate-200 h-6">
              <Layers className="w-3.5 h-3.5" />
              <span>Categories:</span>
            </div>
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest whitespace-nowrap transition-all cursor-pointer ${
                  selectedCategory === cat
                    ? 'bg-indigo-600 text-white shadow-md shadow-indigo-100'
                    : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
                }`}
              >
                {cat === 'all' ? 'View All' : cat.replace(/-/g, ' ')}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Product Grid */}
      <div className="px-4 sm:px-6 lg:px-8">
        {filteredProducts.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 sm:gap-8">
            {filteredProducts.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-20 bg-white rounded-3xl border border-slate-200 border-dashed space-y-4 shadow-sm">
            <div className="p-4 bg-slate-50 rounded-full">
              <Filter className="w-10 h-10 text-slate-300" />
            </div>
            <div className="text-center space-y-1">
              <p className="text-lg font-bold text-slate-700">No products match your criteria</p>
              <p className="text-sm text-slate-400 max-w-xs">Try clearing your filters or searching for something else in this store.</p>
            </div>
            <button
              onClick={() => {
                setSearchQuery('');
                setSelectedCategory('all');
                setExpressOnly(false);
              }}
              className="text-indigo-600 font-bold text-sm hover:underline"
            >
              Clear all filters
            </button>
          </div>
        )}
      </div>

      {/* Info Section */}
      <div className="px-4 sm:px-6 lg:px-8">
        <div className="bg-indigo-50/50 border border-indigo-100 rounded-3xl p-6 flex flex-col sm:flex-row gap-6 items-center">
          <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center shadow-sm shrink-0">
            <Info className="w-6 h-6 text-indigo-500" />
          </div>
          <div className="space-y-1 text-center sm:text-left flex-1">
            <h4 className="font-bold text-indigo-950">About {seller?.storeName || 'This Store'}</h4>
            <p className="text-xs text-indigo-900/70 font-medium leading-relaxed">
              All products in this store are quality-checked and fulfilled by TrendVibe Logistics. 
              Orders placed here are eligible for 100% buyer protection and express hyper-local shipping within Bangalore.
            </p>
          </div>
          <div className="shrink-0 flex gap-2">
             <button className="px-4 py-2 bg-white text-indigo-600 font-bold text-xs rounded-xl border border-indigo-200 hover:bg-indigo-50 transition-colors">
               Contact Support
             </button>
          </div>
        </div>
      </div>
    </div>
  );
};
