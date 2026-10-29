import {
  CategoryInfo,
  Product,
  SellerDocument,
  User,
  Order,
  InventoryMovement,
  ProductEnquiry,
  DemandFunnelMetrics,
  SellerFinanceMetrics,
} from '../types/index.ts';

const TOKEN_KEY = 'trendvibe_auth_token';

export function getStoredToken(): string | null {
  return localStorage.getItem(TOKEN_KEY) || 'usr-customer-1';
}

export function setStoredToken(token: string) {
  localStorage.setItem(TOKEN_KEY, token);
}

export function clearStoredToken() {
  localStorage.removeItem(TOKEN_KEY);
}

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const token = getStoredToken();
  const headers = new Headers(options.headers || {});
  headers.set('Content-Type', 'application/json');
  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  const res = await fetch(endpoint, {
    ...options,
    headers,
  });

  if (!res.ok) {
    const errorBody = await res.json().catch(() => ({}));
    throw new Error(errorBody.error || `Request failed with status ${res.status}`);
  }

  return res.json();
}

export const api = {
  // Auth
  getCurrentUser: () => request<{ user: User; token: string }>('/api/auth/me'),
  login: (credentials: { email: string; phone: string; password: string; role?: string }) =>
    request<{ user: User; token: string }>('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify(credentials),
    }),
  register: (data: any) =>
    request<{ user: User; token: string }>('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  calibrateVoiceProfile: (data?: { voiceprintId?: string; confidence?: number }) =>
    request<{ user: User; success: boolean }>('/api/auth/voice-profile', {
      method: 'POST',
      body: JSON.stringify(data || {}),
    }),
  getSwitchUsers: () => request<User[]>('/api/users/switch-list'),

  // Categories & Products
  getCategories: () => request<CategoryInfo[]>('/api/categories'),
  getProducts: (params?: Record<string, any>) => {
    const query = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([k, v]) => {
        if (v !== undefined && v !== null && v !== '') {
          query.set(k, String(v));
        }
      });
    }
    const qs = query.toString();
    return request<Product[]>(`/api/products${qs ? `?${qs}` : ''}`);
  },
  getProductById: (id: string) => request<Product>(`/api/products/${id}`),
  createProduct: (data: Partial<Product>) =>
    request<Product>('/api/products', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  updateProduct: (id: string, data: Partial<Product>) =>
    request<Product>(`/api/products/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
  deleteProduct: (id: string) =>
    request<{ success: boolean }>(`/api/products/${id}`, {
      method: 'DELETE',
    }),
  uploadProductImage: (fileName: string, dataUrl: string) =>
    request<{ imageUrl: string; fileName: string; size: number }>('/api/upload/image', {
      method: 'POST',
      body: JSON.stringify({ fileName, dataUrl }),
    }),

  // Inventory
  getInventoryMovements: (productId?: string) =>
    request<InventoryMovement[]>(
      `/api/inventory/movements${productId ? `?productId=${productId}` : ''}`
    ),
  restockProduct: (productId: string, quantity: number, note?: string) =>
    request<Product>('/api/inventory/restock', {
      method: 'POST',
      body: JSON.stringify({ productId, quantity, note }),
    }),

  // Orders
  getOrders: () => request<Order[]>('/api/orders'),
  getOrderById: (id: string) => request<Order>(`/api/orders/${id}`),
  checkout: (data: {
    items: { productId: string; quantity: number }[];
    shippingAddress: any;
    paymentMethod: 'COD' | 'ONLINE_RAZORPAY';
    isExpress30Min?: boolean;
    aiAssisted?: boolean;
    aiConversationSummary?: string;
  }) =>
    request<Order>('/api/orders/checkout', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  updateOrderStatus: (id: string, status: string, note?: string) =>
    request<Order>(`/api/orders/${id}/status`, {
      method: 'PUT',
      body: JSON.stringify({ status, note }),
    }),
  verifyPayment: (orderId: string, paymentId: string) =>
    request<{ success: boolean; order: Order }>('/api/payments/verify', {
      method: 'POST',
      body: JSON.stringify({ orderId, paymentId }),
    }),

  // Razorpay Gateway Methods
  getRazorpayConfig: () =>
    request<{ keyId: string; isConfigured: boolean }>('/api/razorpay/config'),
  createRazorpayOrder: (data: { orderId: string; amount: number }) =>
    request<{
      success: boolean;
      razorpayOrderId: string;
      amount: number;
      currency: string;
      keyId: string;
    }>('/api/razorpay/create-order', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  verifyRazorpayPayment: (data: {
    orderId: string;
    razorpay_order_id: string;
    razorpay_payment_id: string;
    razorpay_signature: string;
  }) =>
    request<{ success: boolean; message: string; order: Order }>(
      '/api/razorpay/verify-payment',
      {
        method: 'POST',
        body: JSON.stringify(data),
      }
    ),

  // Seller Documents & RAG
  getSellerDocuments: () => request<SellerDocument[]>('/api/seller/documents'),
  uploadSellerDocument: (data: Partial<SellerDocument>) =>
    request<SellerDocument>('/api/seller/documents', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  deleteSellerDocument: (id: string) =>
    request<{ success: boolean }>(`/api/seller/documents/${id}`, {
      method: 'DELETE',
    }),

  // Seller Analytics & Finance
  getSellerAnalytics: () => request<DemandFunnelMetrics>('/api/seller/analytics'),
  getSellerFinance: () => request<SellerFinanceMetrics>('/api/seller/finance'),

  // Enquiries
  getEnquiries: () => request<ProductEnquiry[]>('/api/enquiries'),
  createEnquiry: (data: {
    productId: string;
    productName: string;
    sellerId?: string;
    text: string;
    kannadaText?: string;
    channel?: string;
  }) =>
    request<ProductEnquiry>('/api/enquiries', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  // Zyro AI
  chatWithZyro: (data: {
    message: string;
    productId?: string;
    category?: string;
    language?: 'en' | 'kn' | 'auto';
    isCallingSession?: boolean;
  }) =>
    request<{
      reply: string;
      kannadaReply?: string;
      languageDetected: 'en' | 'kn';
      citations: string[];
      orderProposal?: any;
      cartAction?: {
        type: 'ADD_TO_CART';
        productId: string;
        productName: string;
        quantity: number;
        price: number;
        product: any;
      };
      productContext?: any;
      isEnding?: boolean;
    }>('/api/zyro-ai/chat', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  // Supabase Cloud Integration
  getSupabaseStatus: () =>
    request<{
      connected: boolean;
      projectId: string;
      url: string;
      hasAnonKey: boolean;
      lastChecked: string;
      lastSync?: string;
      message?: string;
    }>('/api/supabase/status'),
  syncSupabase: () =>
    request<{
      success: boolean;
      timestamp: string;
      productsCount: number;
      ordersCount: number;
      usersCount: number;
      projectId: string;
    }>('/api/supabase/sync', {
      method: 'POST',
    }),

  // Price Drop Alerts
  createPriceAlert: (data: {
    productId: string;
    productName: string;
    userEmail: string;
    targetPrice: number;
    currentPrice: number;
  }) =>
    request<{
      alert: any;
      emailSimulation: {
        to: string;
        subject: string;
        body: string;
        sentAt: string;
        status: string;
      };
    }>('/api/price-alerts', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  getPriceAlerts: (email?: string) =>
    request<any[]>(`/api/price-alerts${email ? `?email=${encodeURIComponent(email)}` : ''}`),

  // Deepgram Speech-to-Text Integration
  transcribeAudioWithDeepgram: async (
    audioBlob: Blob,
    language?: 'en' | 'kn' | 'auto'
  ): Promise<{
    success: boolean;
    transcript: string;
    confidence: number;
    detectedLanguage?: string;
    duration?: number;
  }> => {
    const reader = new FileReader();
    const base64Promise = new Promise<string>((resolve, reject) => {
      reader.onloadend = () => {
        const res = reader.result as string;
        const base64 = res.split(',')[1] || res;
        resolve(base64);
      };
      reader.onerror = reject;
    });
    reader.readAsDataURL(audioBlob);
    const audioBase64 = await base64Promise;

    return request('/api/deepgram/transcribe', {
      method: 'POST',
      body: JSON.stringify({
        audioBase64,
        mimeType: audioBlob.type || 'audio/webm',
        language: language || 'auto',
      }),
    });
  },

  // MongoDB Compass Integration
  getMongoStatus: () =>
    request<{
      connected: boolean;
      uri: string;
      dbName: string;
      lastChecked: string;
      productsCount?: number;
      ordersCount?: number;
      usersCount?: number;
      error?: string;
    }>('/api/mongodb/status'),
  connectMongo: (data?: { uri?: string; dbName?: string }) =>
    request<{
      success: boolean;
      status: any;
    }>('/api/mongodb/connect', {
      method: 'POST',
      body: JSON.stringify(data || {}),
    }),
  syncMongo: () =>
    request<{
      success: boolean;
      count: number;
      message: string;
    }>('/api/mongodb/sync', {
      method: 'POST',
    }),

  // ElevenLabs Natural Voice AI Integration
  getElevenLabsConfig: () =>
    request<{
      isConfigured: boolean;
      defaultVoiceId: string;
    }>('/api/elevenlabs/config'),
  updateElevenLabsConfig: (data: { apiKey?: string; defaultVoiceId?: string }) =>
    request<{
      success: boolean;
      isConfigured: boolean;
      defaultVoiceId: string;
    }>('/api/elevenlabs/config', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  getElevenLabsVoices: () =>
    request<
      Array<{
        voice_id: string;
        name: string;
        category?: string;
        description?: string;
        preview_url?: string;
      }>
    >('/api/elevenlabs/voices'),
  synthesizeElevenLabs: (text: string, voiceId?: string) =>
    request<{
      success: boolean;
      audioId: string;
      audioUrl: string;
      audioBase64: string;
      mimeType: string;
    }>('/api/elevenlabs/synthesize', {
      method: 'POST',
      body: JSON.stringify({ text, voiceId }),
    }),

  // Twilio Telephony & Inbound Voice Call Integration
  getTwilioConfig: () =>
    request<{
      accountSid: string;
      authToken: string;
      phoneNumber: string;
      isConfigured: boolean;
      webhookUrl: string;
    }>('/api/twilio/config'),
  updateTwilioConfig: (data: { accountSid?: string; authToken?: string; phoneNumber?: string }) =>
    request<{
      success: boolean;
      config: any;
    }>('/api/twilio/config', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  getTwilioCalls: () =>
    request<
      Array<{
        id: string;
        callSid: string;
        from: string;
        to: string;
        startTime: string;
        endTime?: string;
        duration?: number;
        status: string;
        turnCount: number;
        transcripts: Array<{
          sender: 'customer' | 'zyro_ai';
          text: string;
          timestamp: string;
          sttEngine?: string;
          ttsEngine?: string;
        }>;
      }>
    >('/api/twilio/calls'),
  simulateTwilioCall: (data: {
    action: 'start' | 'speak';
    callSid?: string;
    from?: string;
    speechInput?: string;
  }) =>
    request<{
      success: boolean;
      callSid: string;
      twiml: string;
      message?: string;
    }>('/api/twilio/voice/simulate', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
};
