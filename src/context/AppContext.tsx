import React, { createContext, useContext, useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { User, Product, CategoryInfo, OrderItem } from '../types/index.ts';
import { api, setStoredToken, getStoredToken } from '../services/api.ts';
import { isProductExpress30MinEligible } from '../utils/delivery.ts';

export interface CartItem {
  product: Product;
  quantity: number;
  variantId?: string;
  variantName?: string;
}

interface ToastInfo {
  id: string;
  text: string;
  type: 'success' | 'error' | 'info';
}

interface AppContextType {
  user: User | null;
  setUser: (user: User | null) => void;
  switchPersona: (userId: string) => Promise<void>;
  availableUsers: User[];
  
  categories: CategoryInfo[];
  refreshCategories: () => Promise<void>;

  cart: CartItem[];
  addToCart: (product: Product, quantity?: number, variantId?: string) => void;
  removeFromCart: (productId: string, variantId?: string) => void;
  updateCartQuantity: (productId: string, quantity: number, variantId?: string) => void;
  clearCart: () => void;
  cartCount: number;
  cartTotals: {
    subtotal: number;
    discount: number;
    tax: number;
    shippingFee: number;
    total: number;
    hasExpressEligibleItems: boolean;
  };

  activeTab: 'storefront' | 'product-detail' | 'cart' | 'customer-orders' | 'seller-dashboard' | 'admin-dashboard' | 'lead-acquisition' | 'seller-store';
  setActiveTab: (tab: any) => void;
  selectedProductId: string | null;
  openProduct: (id: string) => void;
  selectedSellerId: string | null;
  openSellerStore: (sellerId: string) => void;
  selectedEnquiryProductId: string | null;
  openEnquiryModal: (productId: string) => void;
  closeEnquiryModal: () => void;

  toasts: ToastInfo[];
  showToast: (text: string, type?: 'success' | 'error' | 'info') => void;

  expressPincodes: string[];
  checkExpressServiceability: (pincode: string) => boolean;

  // Secure Role-Based Login Modal
  isLoginModalOpen: boolean;
  loginModalDefaultRole: 'customer' | 'seller' | 'admin';
  openLoginModal: (role?: 'customer' | 'seller' | 'admin') => void;
  closeLoginModal: () => void;
  handleLogin: (credentials: { email?: string; phone?: string; password: string; role?: string }) => Promise<void>;
  handleRegister: (data: {
    name: string;
    email: string;
    phone: string;
    password?: string;
    role: 'customer' | 'seller';
    storeName?: string;
    storeDescription?: string;
  }) => Promise<void>;
  logout: () => void;
  calibrateUserVoiceProfile: () => Promise<void>;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

const EXPRESS_PINCODES = ['560001', '560038', '560103', '560068', '560034', '560008', '560025', '560095'];

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [availableUsers, setAvailableUsers] = useState<User[]>([]);
  const [categories, setCategories] = useState<CategoryInfo[]>([]);
  const [cart, setCart] = useState<CartItem[]>(() => {
    try {
      const saved = localStorage.getItem('trendvibe_cart');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [activeTab, setActiveTab] = useState<'storefront' | 'product-detail' | 'cart' | 'customer-orders' | 'seller-dashboard' | 'admin-dashboard' | 'lead-acquisition' | 'seller-store'>(() => {
    try {
      const params = new URLSearchParams(window.location.search);
      const viewParam = params.get('view');
      const isLeadParam = params.get('lead') !== null || viewParam === 'lead-acquisition' || window.location.pathname.includes('/lead-capture');
      if (isLeadParam) {
        return 'lead-acquisition';
      }
      if (viewParam && ['storefront', 'cart', 'customer-orders', 'seller-dashboard', 'admin-dashboard', 'lead-acquisition', 'seller-store'].includes(viewParam)) {
        return viewParam as any;
      }
      if (params.get('product') || params.get('productId')) {
        return 'product-detail';
      }
      if (params.get('seller') || params.get('sellerId')) {
        return 'seller-store';
      }
    } catch {}
    return 'storefront';
  });
  const [selectedProductId, setSelectedProductId] = useState<string | null>(null);
  const [selectedSellerId, setSelectedSellerId] = useState<string | null>(() => {
    try {
      const params = new URLSearchParams(window.location.search);
      return params.get('seller') || params.get('sellerId');
    } catch {
      return null;
    }
  });
  const [selectedEnquiryProductId, setSelectedEnquiryProductId] = useState<string | null>(null);

  const [toasts, setToasts] = useState<ToastInfo[]>([]);

  // Persist cart
  useEffect(() => {
    localStorage.setItem('trendvibe_cart', JSON.stringify(cart));
  }, [cart]);

  // Handle URL query parameters for persistent shareable URLs: ?product=... or ?enquire=... or ?view=lead-acquisition
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const prodParam = params.get('product') || params.get('productId');
    const sellerParam = params.get('seller') || params.get('sellerId');
    const enquireParam = params.get('enquire');
    const viewParam = params.get('view');
    const isLeadParam = params.get('lead') !== null || viewParam === 'lead-acquisition';

    if (isLeadParam) {
      setActiveTab('lead-acquisition');
    } else if (prodParam) {
      setSelectedProductId(prodParam);
      setActiveTab('product-detail');
    } else if (sellerParam) {
      setSelectedSellerId(sellerParam);
      setActiveTab('seller-store');
    }

    if (enquireParam) {
      setSelectedEnquiryProductId(enquireParam);
    }
    if (viewParam && ['storefront', 'cart', 'customer-orders', 'seller-dashboard', 'admin-dashboard', 'lead-acquisition', 'seller-store'].includes(viewParam)) {
      setActiveTab(viewParam as any);
    }
  }, []);

  // Sync browser URL without full reload
  const updateUrlParam = useCallback((key: string, value: string | null) => {
    const url = new URL(window.location.href);
    if (value) {
      url.searchParams.set(key, value);
    } else {
      url.searchParams.delete(key);
    }
    window.history.replaceState({}, '', url.toString());
  }, []);

  const showToast = useCallback((text: string, type: 'success' | 'error' | 'info' = 'info') => {
    const id = `${Date.now()}-${Math.random()}`;
    setToasts((prev) => [...prev, { id, text, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
  }, []);

  // Load initial session and switchable users
  useEffect(() => {
    async function init() {
      try {
        const [meRes, switchRes, catsRes] = await Promise.all([
          api.getCurrentUser(),
          api.getSwitchUsers(),
          api.getCategories(),
        ]);
        if (meRes?.user) setUser(meRes.user);
        if (switchRes) setAvailableUsers(switchRes);
        if (catsRes) setCategories(catsRes);
      } catch (err) {
        console.error('Initialization error:', err);
      }
    }
    init();
  }, []);

  const refreshCategories = useCallback(async () => {
    try {
      const cats = await api.getCategories();
      setCategories(cats);
    } catch (e) {
      console.error(e);
    }
  }, []);

  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [loginModalDefaultRole, setLoginModalDefaultRole] = useState<'customer' | 'seller' | 'admin'>('customer');

  const openLoginModal = useCallback((role?: 'customer' | 'seller' | 'admin') => {
    if (role) setLoginModalDefaultRole(role);
    setIsLoginModalOpen(true);
  }, []);

  const closeLoginModal = useCallback(() => {
    setIsLoginModalOpen(false);
  }, []);

  const handleLogin = useCallback(async (credentials: { email?: string; phone?: string; password: string; role?: string }) => {
    try {
      const res = await api.login(credentials);
      if (res?.user && res?.token) {
        setStoredToken(res.token);
        setUser(res.user);
        setIsLoginModalOpen(false);
        showToast(`Authenticated as ${res.user.name} (${res.user.role.toUpperCase()})`, 'success');

        // Automatic redirect based on authenticated role
        if (res.user.role === 'seller') {
          setActiveTab('seller-dashboard');
        } else if (res.user.role === 'admin') {
          setActiveTab('admin-dashboard');
        } else {
          setActiveTab('storefront');
        }
      }
    } catch (err: any) {
      showToast(err.message || 'Login failed', 'error');
      throw err;
    }
  }, [showToast]);

  const handleRegister = useCallback(async (data: {
    name: string;
    email: string;
    phone: string;
    password?: string;
    role: 'customer' | 'seller';
    storeName?: string;
    storeDescription?: string;
  }) => {
    try {
      const res = await api.register(data);
      if (res?.user && res?.token) {
        setStoredToken(res.token);
        setUser(res.user);
        setIsLoginModalOpen(false);
        showToast(`Account created! Welcome, ${res.user.name} (${res.user.role.toUpperCase()})`, 'success');

        // Refresh switch personas list
        api.getSwitchUsers().then((users) => {
          if (users) setAvailableUsers(users);
        }).catch(() => {});

        // Automatic redirect based on authenticated role
        if (res.user.role === 'seller') {
          setActiveTab('seller-dashboard');
        } else {
          setActiveTab('storefront');
        }
      }
    } catch (err: any) {
      showToast(err.message || 'Registration failed', 'error');
      throw err;
    }
  }, [showToast]);

  const logout = useCallback(() => {
    setStoredToken('');
    // Revert to null or guest
    setUser(null);
    showToast('Signed out successfully.', 'info');
    setActiveTab('storefront');
  }, [showToast]);

  const calibrateUserVoiceProfile = useCallback(async () => {
    try {
      const res = await api.calibrateVoiceProfile();
      if (res.user) {
        setUser(res.user);
        showToast('Acoustic voice print calibrated and saved to your profile!', 'success');
      }
    } catch (err: any) {
      showToast(`Voice calibration notice: ${err.message}`, 'info');
    }
  }, [showToast]);

  const availableUsersRef = useRef<User[]>(availableUsers);
  availableUsersRef.current = availableUsers;

  const switchPersona = useCallback(async (userId: string) => {
    const target = availableUsersRef.current.find((u) => u.id === userId);
    if (target) {
      setStoredToken(target.id);
      setUser(target);
      showToast(`Switched account to ${target.name} (${target.role.toUpperCase()})`, 'success');
      // If switching to seller, navigate to seller dashboard; if customer, storefront
      if (target.role === 'seller') {
        setActiveTab('seller-dashboard');
      } else if (target.role === 'admin') {
        setActiveTab('admin-dashboard');
      } else {
        setActiveTab('storefront');
      }
    }
  }, [showToast]);

  const addToCart = useCallback((product: Product, quantity = 1, variantId?: string) => {
    // Check available stock
    const available = product.stock.available;
    if (available <= 0) {
      showToast(`Sorry, "${product.name}" is currently out of stock.`, 'error');
      return;
    }

    setCart((prev) => {
      const existingIdx = prev.findIndex(
        (it) => it.product.id === product.id && it.variantId === variantId
      );
      if (existingIdx > -1) {
        const newQty = prev[existingIdx].quantity + quantity;
        if (newQty > available) {
          showToast(`Cannot add more than ${available} available units.`, 'error');
          return prev;
        }
        const updated = [...prev];
        updated[existingIdx] = { ...updated[existingIdx], quantity: newQty };
        showToast(`Updated "${product.name}" quantity to ${newQty}`, 'success');
        return updated;
      } else {
        showToast(`Added "${product.name}" to cart`, 'success');
        return [...prev, { product, quantity, variantId }];
      }
    });
  }, [showToast]);

  const removeFromCart = useCallback((productId: string, variantId?: string) => {
    setCart((prev) => prev.filter((it) => !(it.product.id === productId && it.variantId === variantId)));
    showToast('Item removed from cart', 'info');
  }, [showToast]);

  const updateCartQuantity = useCallback((productId: string, quantity: number, variantId?: string) => {
    if (quantity <= 0) {
      removeFromCart(productId, variantId);
      return;
    }
    setCart((prev) =>
      prev.map((it) => {
        if (it.product.id === productId && it.variantId === variantId) {
          if (quantity > it.product.stock.available) {
            showToast(`Only ${it.product.stock.available} units available in stock.`, 'error');
            return { ...it, quantity: it.product.stock.available };
          }
          return { ...it, quantity };
        }
        return it;
      })
    );
  }, [removeFromCart, showToast]);

  const clearCart = useCallback(() => setCart([]), []);

  const cartCount = cart.reduce((sum, it) => sum + it.quantity, 0);

  const cartTotals = React.useMemo(() => {
    const subtotal = cart.reduce((sum, it) => sum + it.product.price * it.quantity, 0);
    const discount = subtotal > 1500 ? 100 : 0;
    const tax = Math.round(subtotal * 0.05);
    const hasExpressEligibleItems = cart.some(
      (it) => isProductExpress30MinEligible(it.product)
    );
    const shippingFee = subtotal > 499 || subtotal === 0 ? 0 : 25;
    const total = subtotal - discount + tax + shippingFee;

    return {
      subtotal,
      discount,
      tax,
      shippingFee,
      total,
      hasExpressEligibleItems,
    };
  }, [cart]);

  const openProduct = useCallback((id: string) => {
    setSelectedProductId(id);
    setActiveTab('product-detail');
    updateUrlParam('product', id);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [updateUrlParam]);

  const openSellerStore = useCallback((sellerId: string) => {
    setSelectedSellerId(sellerId);
    setActiveTab('seller-store');
    updateUrlParam('seller', sellerId);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [updateUrlParam]);

  const openEnquiryModal = useCallback((productId: string) => {
    setSelectedEnquiryProductId(productId);
    updateUrlParam('enquire', productId);
  }, [updateUrlParam]);

  const closeEnquiryModal = useCallback(() => {
    setSelectedEnquiryProductId(null);
    updateUrlParam('enquire', null);
  }, [updateUrlParam]);

  const checkExpressServiceability = useCallback((pincode: string) => {
    const cleanPin = pincode.trim();
    return EXPRESS_PINCODES.includes(cleanPin);
  }, []);

  const setActiveTabAndSync = useCallback((tab: any) => {
    setActiveTab(tab);
    if (tab !== 'product-detail') {
      updateUrlParam('product', null);
    }
    updateUrlParam('view', tab);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [updateUrlParam]);

  const contextValue = useMemo<AppContextType>(() => ({
    user,
    setUser,
    switchPersona,
    availableUsers,
    categories,
    refreshCategories,
    cart,
    addToCart,
    removeFromCart,
    updateCartQuantity,
    clearCart,
    cartCount,
    cartTotals,
    activeTab,
    setActiveTab: setActiveTabAndSync,
    selectedProductId,
    openProduct,
    selectedSellerId,
    openSellerStore,
    selectedEnquiryProductId,
    openEnquiryModal,
    closeEnquiryModal,
    toasts,
    showToast,
    expressPincodes: EXPRESS_PINCODES,
    checkExpressServiceability,
    isLoginModalOpen,
    loginModalDefaultRole,
    openLoginModal,
    closeLoginModal,
    handleLogin,
    handleRegister,
    logout,
    calibrateUserVoiceProfile,
  }), [
    user,
    switchPersona,
    availableUsers,
    categories,
    refreshCategories,
    cart,
    addToCart,
    removeFromCart,
    updateCartQuantity,
    clearCart,
    cartCount,
    cartTotals,
    activeTab,
    setActiveTabAndSync,
    selectedProductId,
    openProduct,
    selectedSellerId,
    openSellerStore,
    selectedEnquiryProductId,
    openEnquiryModal,
    closeEnquiryModal,
    toasts,
    showToast,
    checkExpressServiceability,
    isLoginModalOpen,
    loginModalDefaultRole,
    openLoginModal,
    closeLoginModal,
    handleLogin,
    handleRegister,
    logout,
    calibrateUserVoiceProfile,
  ]);

  return (
    <AppContext.Provider value={contextValue}>
      {children}
    </AppContext.Provider>
  );
};

export function useApp() {
  const context = useContext(AppContext);
  if (!context) throw new Error('useApp must be used within an AppProvider');
  return context;
}
