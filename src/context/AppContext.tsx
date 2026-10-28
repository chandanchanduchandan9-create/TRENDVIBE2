import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, Product, CategoryInfo, OrderItem } from '../types/index.ts';
import { api, setStoredToken, getStoredToken } from '../services/api.ts';

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

  activeTab: 'storefront' | 'product-detail' | 'ai-shopping' | 'cart' | 'customer-orders' | 'seller-dashboard' | 'admin-dashboard';
  setActiveTab: (tab: any) => void;
  selectedProductId: string | null;
  openProduct: (id: string) => void;
  selectedEnquiryProductId: string | null;
  openEnquiryModal: (productId: string) => void;
  closeEnquiryModal: () => void;

  isCallingOpen: boolean;
  activeCallingProduct: Product | null;
  startCallingZyro: (product?: Product) => void;
  endCallingZyro: () => void;

  toasts: ToastInfo[];
  showToast: (text: string, type?: 'success' | 'error' | 'info') => void;

  expressPincodes: string[];
  checkExpressServiceability: (pincode: string) => boolean;

  // Secure Role-Based Login Modal
  isLoginModalOpen: boolean;
  loginModalDefaultRole: 'customer' | 'seller' | 'admin';
  openLoginModal: (role?: 'customer' | 'seller' | 'admin') => void;
  closeLoginModal: () => void;
  handleLogin: (credentials: { email: string; phone: string; password: string; role?: string }) => Promise<void>;
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

  const [activeTab, setActiveTab] = useState<'storefront' | 'product-detail' | 'ai-shopping' | 'cart' | 'customer-orders' | 'seller-dashboard' | 'admin-dashboard'>('storefront');
  const [selectedProductId, setSelectedProductId] = useState<string | null>(null);
  const [selectedEnquiryProductId, setSelectedEnquiryProductId] = useState<string | null>(null);

  const [isCallingOpen, setIsCallingOpen] = useState(false);
  const [activeCallingProduct, setActiveCallingProduct] = useState<Product | null>(null);

  const [toasts, setToasts] = useState<ToastInfo[]>([]);

  // Persist cart
  useEffect(() => {
    localStorage.setItem('trendvibe_cart', JSON.stringify(cart));
  }, [cart]);

  // Handle URL query parameters for persistent shareable URLs: ?product=... or ?enquire=...
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const prodParam = params.get('product') || params.get('productId');
    const enquireParam = params.get('enquire') || params.get('enquiryId');
    const viewParam = params.get('view');

    if (prodParam) {
      setSelectedProductId(prodParam);
      setActiveTab('product-detail');
    }
    if (enquireParam) {
      setSelectedEnquiryProductId(enquireParam);
    }
    if (viewParam && ['storefront', 'ai-shopping', 'cart', 'customer-orders', 'seller-dashboard', 'admin-dashboard'].includes(viewParam)) {
      setActiveTab(viewParam as any);
    }
  }, []);

  // Sync browser URL without full reload
  const updateUrlParam = (key: string, value: string | null) => {
    const url = new URL(window.location.href);
    if (value) {
      url.searchParams.set(key, value);
    } else {
      url.searchParams.delete(key);
    }
    window.history.replaceState({}, '', url.toString());
  };

  const showToast = (text: string, type: 'success' | 'error' | 'info' = 'info') => {
    const id = `${Date.now()}-${Math.random()}`;
    setToasts((prev) => [...prev, { id, text, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
  };

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

  const refreshCategories = async () => {
    try {
      const cats = await api.getCategories();
      setCategories(cats);
    } catch (e) {
      console.error(e);
    }
  };

  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [loginModalDefaultRole, setLoginModalDefaultRole] = useState<'customer' | 'seller' | 'admin'>('customer');

  const openLoginModal = (role?: 'customer' | 'seller' | 'admin') => {
    if (role) setLoginModalDefaultRole(role);
    setIsLoginModalOpen(true);
  };

  const closeLoginModal = () => {
    setIsLoginModalOpen(false);
  };

  const handleLogin = async (credentials: { email: string; phone: string; password: string; role?: string }) => {
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
  };

  const handleRegister = async (data: {
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
  };

  const logout = () => {
    setStoredToken('');
    // Revert to null or guest
    setUser(null);
    showToast('Signed out successfully.', 'info');
    setActiveTab('storefront');
  };

  const calibrateUserVoiceProfile = async () => {
    try {
      const res = await api.calibrateVoiceProfile();
      if (res.user) {
        setUser(res.user);
        showToast('Acoustic voice print calibrated and saved to your profile!', 'success');
      }
    } catch (err: any) {
      showToast(`Voice calibration notice: ${err.message}`, 'info');
    }
  };

  const switchPersona = async (userId: string) => {
    const target = availableUsers.find((u) => u.id === userId);
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
  };

  const addToCart = (product: Product, quantity = 1, variantId?: string) => {
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
        updated[existingIdx].quantity = newQty;
        showToast(`Updated "${product.name}" quantity to ${newQty}`, 'success');
        return updated;
      } else {
        showToast(`Added "${product.name}" to cart`, 'success');
        return [...prev, { product, quantity, variantId }];
      }
    });
  };

  const removeFromCart = (productId: string, variantId?: string) => {
    setCart((prev) => prev.filter((it) => !(it.product.id === productId && it.variantId === variantId)));
    showToast('Item removed from cart', 'info');
  };

  const updateCartQuantity = (productId: string, quantity: number, variantId?: string) => {
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
  };

  const clearCart = () => setCart([]);

  const cartCount = cart.reduce((sum, it) => sum + it.quantity, 0);

  const cartTotals = React.useMemo(() => {
    const subtotal = cart.reduce((sum, it) => sum + it.product.price * it.quantity, 0);
    const discount = subtotal > 1500 ? 100 : 0;
    const tax = Math.round(subtotal * 0.05);
    const hasExpressEligibleItems = cart.some(
      (it) => it.product.category === 'medicines-healthcare' || it.product.category === 'food'
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

  const openProduct = (id: string) => {
    setSelectedProductId(id);
    setActiveTab('product-detail');
    updateUrlParam('product', id);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const openEnquiryModal = (productId: string) => {
    setSelectedEnquiryProductId(productId);
    updateUrlParam('enquire', productId);
  };

  const closeEnquiryModal = () => {
    setSelectedEnquiryProductId(null);
    updateUrlParam('enquire', null);
  };

  const startCallingZyro = (product?: Product) => {
    setActiveCallingProduct(product || null);
    setIsCallingOpen(true);
  };

  const endCallingZyro = () => {
    setIsCallingOpen(false);
  };

  const checkExpressServiceability = (pincode: string) => {
    const cleanPin = pincode.trim();
    return EXPRESS_PINCODES.includes(cleanPin);
  };

  return (
    <AppContext.Provider
      value={{
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
        setActiveTab: (tab) => {
          setActiveTab(tab);
          if (tab !== 'product-detail') {
            updateUrlParam('product', null);
          }
          updateUrlParam('view', tab);
          window.scrollTo({ top: 0, behavior: 'smooth' });
        },
        selectedProductId,
        openProduct,
        selectedEnquiryProductId,
        openEnquiryModal,
        closeEnquiryModal,
        isCallingOpen,
        activeCallingProduct,
        startCallingZyro,
        endCallingZyro,
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
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export function useApp() {
  const context = useContext(AppContext);
  if (!context) throw new Error('useApp must be used within an AppProvider');
  return context;
}
