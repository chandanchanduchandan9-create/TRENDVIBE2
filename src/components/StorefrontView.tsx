import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext.tsx';
import { ProductCard } from './ProductCard.tsx';
import { Product } from '../types/index.ts';
import { api } from '../services/api.ts';
import { isProductExpress30MinEligible } from '../utils/delivery.ts';
import {
  Sparkles,
  PhoneCall,
  Zap,
  Filter,
  ArrowUpDown,
  Search,
  CheckCircle2,
  PackageCheck,
  Layers,
} from 'lucide-react';

interface StorefrontViewProps {
  searchQuery: string;
  setSearchQuery: (q: string) => void;
  selectedCategory: string;
  setSelectedCategory: (c: string) => void;
}

export const StorefrontView: React.FC<StorefrontViewProps> = ({
  searchQuery,
  setSearchQuery,
  selectedCategory,
  setSelectedCategory,
}) => {
  const { categories, startCallingZyro, setActiveTab, showToast, activeTab } = useApp();

  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [sortBy, setSortBy] = useState<'newest' | 'rating' | 'price-asc' | 'price-desc'>('newest');
  const [selectedBrand, setSelectedBrand] = useState<string>('all');
  const [expressOnly, setExpressOnly] = useState(false);

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const data = await api.getProducts({
        category: selectedCategory !== 'all' ? selectedCategory : undefined,
        search: searchQuery || undefined,
        sortBy,
      });
      setProducts(data);
    } catch (err: any) {
      showToast(`Failed to load products: ${err.message}`, 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, [selectedCategory, searchQuery, sortBy, activeTab]);

  // Extract unique brands
  const brands = ['all', ...Array.from(new Set(products.map((p) => p.brand)))];

  const filteredProducts = products.filter((p) => {
    if (selectedBrand !== 'all' && p.brand !== selectedBrand) return false;
    if (expressOnly && !isProductExpress30MinEligible(p)) return false;
    return true;
  });

  const activeCategoryInfo = categories.find((c) => c.slug === selectedCategory);

  return (
    <div className="space-y-8 animate-in fade-in pb-16">
      {/* Hero Banner */}
      <div className="relative overflow-hidden bg-gradient-to-br from-slate-950 via-indigo-950 to-slate-900 text-white rounded-3xl mx-4 sm:mx-6 lg:mx-8 p-6 sm:p-10 lg:p-12 shadow-2xl border border-indigo-900/30">
        <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20"></div>
        <div className="absolute bottom-0 left-1/3 w-80 h-80 bg-violet-500/10 rounded-full blur-3xl pointer-events-none"></div>

        <div className="relative z-10 max-w-3xl space-y-4">
          <div className="inline-flex items-center gap-2 bg-indigo-500/20 text-indigo-300 text-xs font-bold px-3 py-1 rounded-full border border-indigo-400/30">
            <Sparkles className="w-3.5 h-3.5 text-indigo-400 animate-spin-slow" />
            <span>Next-Gen E-Commerce Powered by Zyro AI</span>
          </div>

          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight leading-tight">
            Curated Shopping, Elevated by{' '}
            <span className="bg-gradient-to-r from-indigo-300 via-indigo-100 to-violet-300 bg-clip-text text-transparent">
              AI Voice Calling
            </span>
          </h1>

          <p className="text-slate-300 text-xs sm:text-base leading-relaxed max-w-2xl">
            Explore 8 certified product categories from healthcare & fresh food to flagship 5G smartphones and gaming laptops. Speak with Zyro AI for instant verified recommendations, price drop tracking, and 30-minute express deliveries.
          </p>

          <div className="flex flex-wrap items-center gap-3 pt-2">
            <button
              onClick={() => startCallingZyro()}
              className="px-6 py-3 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-extrabold text-xs sm:text-sm rounded-2xl shadow-lg shadow-emerald-500/20 flex items-center gap-2 transition-all transform hover:scale-105 cursor-pointer"
            >
              <PhoneCall className="w-4 h-4" />
              <span>Call Zyro AI Voice Assistant</span>
            </button>

            <button
              onClick={() => setActiveTab('ai-shopping')}
              className="px-6 py-3 bg-white/10 hover:bg-white/20 text-white font-bold text-xs sm:text-sm rounded-2xl border border-white/20 transition-all flex items-center gap-2 cursor-pointer"
            >
              <Sparkles className="w-4 h-4 text-indigo-400" />
              <span>Explore AI Shopping</span>
            </button>
          </div>
        </div>
      </div>

      {/* 8 Categories Visual Grid */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-base sm:text-lg font-extrabold text-slate-900 tracking-tight">
              Featured Categories
            </h2>
            <p className="text-xs text-slate-500">
              Select any of the 8 main categories with verified specifications and stock
            </p>
          </div>
          {selectedCategory !== 'all' && (
            <button
              onClick={() => setSelectedCategory('all')}
              className="text-xs text-indigo-600 hover:text-indigo-800 font-bold cursor-pointer"
            >
              Reset to All
            </button>
          )}
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2.5">
          {categories.map((cat) => {
            const isSelected = selectedCategory === cat.slug;
            return (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.slug)}
                className={`p-3 rounded-2xl border text-left transition-all flex flex-col justify-between cursor-pointer ${
                  isSelected
                    ? 'border-indigo-600 bg-indigo-50/80 shadow-md ring-2 ring-indigo-500/20'
                    : 'border-slate-200/90 bg-white hover:border-slate-300 hover:shadow-xs'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-lg">
                      {cat.slug === 'medicines-healthcare' ? '💊' :
                       cat.slug === 'food' ? '🍲' :
                       cat.slug === 'laptops' ? '💻' :
                       cat.slug === 'mobiles' ? '📱' :
                       cat.slug === 'cosmetics-personal-care' ? '✨' :
                       cat.slug === 'shoes-footwear' ? '👟' :
                       cat.slug === 'clothes-apparel' ? '👕' : '📦'}
                    </span>
                    {cat.supportsExpress30Min && (
                      <span className="text-amber-500 font-extrabold text-[10px]" title="30-Min Express eligible">
                        ⚡ 30m
                      </span>
                    )}
                  </div>
                  <div className="font-extrabold text-xs text-slate-900 line-clamp-1">{cat.name.split(' ')[0]}</div>
                  <div className="text-[10px] text-slate-400 font-medium line-clamp-1 mt-0.5">
                    {cat.name.split(' ').slice(1).join(' ') || 'Catalog'}
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Filter and Sorting Toolbar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-bold text-slate-700 flex items-center gap-1 text-[11px] uppercase tracking-wider">
              <Filter className="w-3.5 h-3.5 text-slate-500" />
              Filter By:
            </span>

            {/* 30-Min Express Toggle */}
            <button
              onClick={() => setExpressOnly(!expressOnly)}
              className={`px-3 py-1.5 rounded-xl font-bold flex items-center gap-1.5 transition-colors cursor-pointer ${
                expressOnly
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'bg-emerald-50 text-emerald-800 hover:bg-emerald-100 border border-emerald-200'
              }`}
            >
              <Zap className="w-3.5 h-3.5 text-amber-300" />
              <span>30-Min Express Only</span>
            </button>

            {/* Brand Filter */}
            {brands.length > 2 && (
              <select
                value={selectedBrand}
                onChange={(e) => setSelectedBrand(e.target.value)}
                className="bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1.5 text-slate-700 font-semibold cursor-pointer"
              >
                <option value="all">All Brands ({brands.length - 1})</option>
                {brands.filter((b) => b !== 'all').map((b) => (
                  <option key={b} value={b}>
                    {b}
                  </option>
                ))}
              </select>
            )}
          </div>

          {/* Sort By */}
          <div className="flex items-center gap-2">
            <span className="text-slate-400 font-medium flex items-center gap-1">
              <ArrowUpDown className="w-3.5 h-3.5" />
              Sort:
            </span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1.5 text-slate-700 font-bold cursor-pointer"
            >
              <option value="rating">Top Rated & Verified</option>
              <option value="price-asc">Price: Low to High</option>
              <option value="price-desc">Price: High to Low</option>
              <option value="newest">New Arrivals</option>
            </select>
          </div>
        </div>
      </div>

      {/* Products Grid */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between mb-4">
          <div className="text-xs text-slate-500 font-medium">
            Showing <strong className="text-slate-900">{filteredProducts.length}</strong> products
            {selectedCategory !== 'all' && (
              <span> in <strong className="text-indigo-600">{activeCategoryInfo?.name}</strong></span>
            )}
            {searchQuery && (
              <span> matching "<strong className="text-indigo-600">{searchQuery}</strong>"</span>
            )}
          </div>
        </div>

        {loading ? (
          <div className="py-20 flex flex-col items-center justify-center">
            <div className="w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
            <p className="text-xs text-slate-500 font-medium mt-3">Loading products...</p>
          </div>
        ) : filteredProducts.length === 0 ? (
          <div className="bg-white rounded-3xl border border-slate-200 p-12 text-center shadow-xs">
            <Search className="w-10 h-10 text-slate-300 mx-auto mb-3" />
            <h3 className="text-base font-bold text-slate-900">No matching products found</h3>
            <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
              Try adjusting your search query, clearing filters, or asking Zyro AI to look up the item.
            </p>
            <button
              onClick={() => {
                setSearchQuery('');
                setSelectedCategory('all');
                setSelectedBrand('all');
                setExpressOnly(false);
              }}
              className="mt-4 px-4 py-2 bg-indigo-600 text-white font-bold text-xs rounded-xl cursor-pointer"
            >
              Reset All Filters
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {filteredProducts.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
