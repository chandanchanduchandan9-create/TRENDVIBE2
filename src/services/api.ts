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
  CustomerLead,
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

// Persistent Custom Products Storage (survives container scale-down and 5-min idle)
const CUSTOM_PRODUCTS_STORAGE_KEY = 'trendvibe_persistent_custom_products';

export function getLocalCustomProducts(): Product[] {
  try {
    const raw = localStorage.getItem(CUSTOM_PRODUCTS_STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch (err) {
    return [];
  }
}

export function saveLocalCustomProducts(products: Product[]) {
  try {
    localStorage.setItem(CUSTOM_PRODUCTS_STORAGE_KEY, JSON.stringify(products));
  } catch (err) {
    console.warn('Failed to save custom products to localStorage:', err);
  }
}

export function addLocalCustomProduct(product: Product) {
  const existing = getLocalCustomProducts().filter((p) => p.id !== product.id);
  existing.unshift(product);
  saveLocalCustomProducts(existing);
}

export function updateLocalCustomProduct(id: string, updated: Partial<Product>) {
  const existing = getLocalCustomProducts();
  const index = existing.findIndex((p) => p.id === id);
  if (index >= 0) {
    existing[index] = { ...existing[index], ...updated, updatedAt: new Date().toISOString() };
    saveLocalCustomProducts(existing);
  }
}

export function removeLocalCustomProduct(id: string) {
  const existing = getLocalCustomProducts().filter((p) => p.id !== id);
  saveLocalCustomProducts(existing);
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
  login: (credentials: { email?: string; phone?: string; password: string; role?: string }) =>
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
  syncLocalProducts: (products: Product[]) =>
    request<{ success: boolean; count: number }>('/api/products/sync-local', {
      method: 'POST',
      body: JSON.stringify({ products }),
    }),
  getProducts: async (params?: Record<string, any>): Promise<Product[]> => {
    const query = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([k, v]) => {
        if (v !== undefined && v !== null && v !== '') {
          query.set(k, String(v));
        }
      });
    }
    const qs = query.toString();

    let serverProducts: Product[] = [];
    try {
      serverProducts = await request<Product[]>(`/api/products${qs ? `?${qs}` : ''}`);
    } catch (err) {
      console.warn('Could not reach backend /api/products, using local store:', err);
    }

    const localCustoms = getLocalCustomProducts();

    // Re-seed server if it scaled down and lost ephemeral data
    const missingOnServer = localCustoms.filter((lp) => !serverProducts.some((sp) => sp.id === lp.id));
    if (missingOnServer.length > 0) {
      request<{ success: boolean; count: number }>('/api/products/sync-local', {
        method: 'POST',
        body: JSON.stringify({ products: localCustoms }),
      }).catch((e) => console.warn('[ProductSync] sync-local note:', e));
    }

    // Merge: ensure localCustoms are pinned and preserved
    let merged = [...serverProducts];
    for (const lp of localCustoms) {
      const idx = merged.findIndex((p) => p.id === lp.id);
      if (idx >= 0) {
        merged[idx] = { ...merged[idx], ...lp };
      } else {
        // Filter checks for client inclusion
        let match = true;
        if (params?.sellerId && lp.sellerId !== params.sellerId) {
          match = false;
        }
        if (params?.category && params.category !== 'all' && lp.category !== params.category) {
          match = false;
        }
        if (params?.status && params.status !== 'all' && lp.status !== params.status) {
          match = false;
        }
        if (params?.search) {
          const q = String(params.search).toLowerCase();
          const pName = (lp.name || '').toLowerCase();
          const pBrand = (lp.brand || '').toLowerCase();
          const pDesc = (lp.description || '').toLowerCase();
          if (!pName.includes(q) && !pBrand.includes(q) && !pDesc.includes(q)) {
            match = false;
          }
        }
        if (match) {
          merged.unshift(lp);
        }
      }
    }

    return merged;
  },
  getProductById: async (id: string): Promise<Product> => {
    try {
      const p = await request<Product>(`/api/products/${id}`);
      return p;
    } catch (err) {
      const local = getLocalCustomProducts().find((p) => p.id === id);
      if (local) return local;
      throw err;
    }
  },
  createProduct: async (data: Partial<Product>): Promise<Product> => {
    let created: Product;
    try {
      created = await request<Product>('/api/products', {
        method: 'POST',
        body: JSON.stringify(data),
      });
    } catch (err) {
      const localId = `prod-local-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`;
      created = {
        id: localId,
        name: data.name || 'New Product',
        brand: data.brand || 'TrendVibe',
        category: data.category || 'other-store-products',
        subcategory: data.subcategory || 'General',
        description: data.description || '',
        shortDescription: data.shortDescription || '',
        mrp: Number(data.mrp || 100),
        price: Number(data.price || 90),
        costPrice: Number(data.costPrice || 60),
        sku: data.sku || `SKU-${Date.now().toString().slice(-6)}`,
        images: data.images?.length
          ? data.images
          : ['https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=800&q=80'],
        stock: { onHand: data.stock?.onHand ?? 50, reserved: 0, available: data.stock?.onHand ?? 50, lowStockThreshold: 10 },
        sellerId: 'usr-seller-1',
        sellerName: 'Vibe Retailers Pvt Ltd',
        status: 'published',
        rating: 5.0,
        reviewCount: 1,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        ...data,
      } as Product;
    }

    // Always store to persistent browser storage
    addLocalCustomProduct(created);

    // Sync to backend immediately
    request<{ success: boolean }>('/api/products/sync-local', {
      method: 'POST',
      body: JSON.stringify({ products: [created] }),
    }).catch(() => {});

    return created;
  },
  updateProduct: async (id: string, data: Partial<Product>): Promise<Product> => {
    updateLocalCustomProduct(id, data);
    try {
      const res = await request<Product>(`/api/products/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data),
      });
      addLocalCustomProduct(res);
      return res;
    } catch (err) {
      const local = getLocalCustomProducts().find((p) => p.id === id);
      if (local) return local;
      throw err;
    }
  },
  deleteProduct: async (id: string) => {
    removeLocalCustomProduct(id);
    return request<{ success: boolean }>(`/api/products/${id}`, {
      method: 'DELETE',
    });
  },
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

  // Enquiries & AI Voice Calls
  getEnquiries: () => request<ProductEnquiry[]>('/api/enquiries'),
  createEnquiry: (data: {
    productId: string;
    productName?: string;
    sellerId?: string;
    text?: string;
    question?: string;
    customerName?: string;
    customerPhone?: string;
    customerEmail?: string;
    preferredCallback?: 'INSTANT_AI_CALL' | 'SCHEDULED_CALL' | 'TEXT_ONLY';
    hasConsent?: boolean;
    consentTimestamp?: string;
    kannadaText?: string;
    channel?: string;
  }) =>
    request<ProductEnquiry>('/api/enquiries', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  triggerEnquiryCall: (enquiryId: string) =>
    request<{ success: boolean; message: string; enquiry: ProductEnquiry }>(
      `/api/enquiries/${encodeURIComponent(enquiryId)}/trigger-call`,
      { method: 'POST' }
    ),
  transferEnquiryToHuman: (enquiryId: string, reason?: string) =>
    request<{ success: boolean; message: string; enquiry: ProductEnquiry }>(
      `/api/enquiries/${encodeURIComponent(enquiryId)}/transfer-human`,
      {
        method: 'POST',
        body: JSON.stringify({ reason }),
      }
    ),

  // Separate Lead Acquisition Module API
  submitLead: (data: {
    name: string;
    mobile: string;
    email: string;
    productInterest: string;
    productId?: string;
    sellerId?: string;
    notes?: string;
    hasConsent: boolean;
    consentTimestamp?: string;
  }) =>
    request<{ success: boolean; message: string; lead: CustomerLead }>('/api/leads', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  getLeads: () => request<CustomerLead[]>('/api/leads'),
  triggerLeadCall: (leadId: string) =>
    request<{ success: boolean; message: string; lead: CustomerLead }>(
      `/api/leads/${encodeURIComponent(leadId)}/trigger-call`,
      { method: 'POST' }
    ),
  getAiCallingConfig: () =>
    request<{
      secretsStatus: Record<string, boolean>;
      missingSecrets: string[];
      isFullyConfigured: boolean;
      instructions: string;
    }>('/api/admin/ai-calling-config'),
  testAiCall: (toNumber: string, consentVerified: boolean) =>
    request<{
      success: boolean;
      callSid?: string;
      status?: string;
      message?: string;
      error?: string;
      missingSecrets?: string[];
      apiProvider?: string;
      targetNumber?: string;
    }>('/api/admin/test-ai-call', {
      method: 'POST',
      body: JSON.stringify({ toNumber, consentVerified }),
    }),
  syncEnquiriesGoogleSheets: (enquiryId?: string) =>
    request<{
      success: boolean;
      syncedCount: number;
      spreadsheetUrl: string;
      message: string;
    }>('/api/integrations/google-sheets/sync', {
      method: 'POST',
      body: JSON.stringify({ enquiryId }),
    }),
  n8nSubmitEnquiry: (data: any) =>
    request<{ success: boolean; message: string; enquiry: ProductEnquiry }>(
      '/api/webhooks/n8n/enquiry',
      {
        method: 'POST',
        body: JSON.stringify(data),
      }
    ),
  postCallWebhook: (data: any) =>
    request<{ success: boolean; message: string; enquiry: ProductEnquiry }>(
      '/api/webhooks/call-completed',
      {
        method: 'POST',
        body: JSON.stringify(data),
      }
    ),

  // Customer Enquiry Bot
  chatWithBot: (data: {
    message: string;
    productId?: string;
    category?: string;
    language?: 'en' | 'kn' | 'hi' | 'auto';
    isCallingSession?: boolean;
    customerId?: string;
    customerPhone?: string;
  }) =>
    request<{
      reply: string;
      kannadaReply?: string;
      hindiReply?: string;
      languageDetected: 'en' | 'kn' | 'hi';
      citations: string[];
      intent?: string;
      orderProposal?: any;
      trackingDetails?: {
        orderId: string;
        orderNumber: string;
        courierPartner: string;
        trackingNumber: string;
        trackingUrl: string;
        statusLabel: string;
        currentLocation: string;
        estimatedDeliveryDate: string;
        latestMilestone?: string;
      };
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
      razorpayPaymentUrl?: string;
      orderNumber?: string;
      requiresOtpVerification?: boolean;
      otpPhone?: string;
    }>('/api/bot/chat', {
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
  getHumanSupportPhone: () =>
    request<{
      humanSupportPhone: string;
      status: 'NOT_CONFIGURED' | 'CONFIGURED' | 'TEST_FAILED';
      isConfigured: boolean;
      updatedAt?: string;
      updatedBy?: string;
    }>('/api/twilio/support-number'),
  updateHumanSupportPhone: (phone: string) =>
    request<{
      success: boolean;
      message: string;
      phone: string;
      status: 'CONFIGURED' | 'NOT_CONFIGURED';
      isConfigured: boolean;
      updatedAt?: string;
      updatedBy?: string;
    }>('/api/twilio/support-number', {
      method: 'POST',
      body: JSON.stringify({ phone }),
    }),
  testHumanSupportPhone: (phone?: string) =>
    request<{
      success: boolean;
      status: 'CONFIGURED' | 'TEST_FAILED';
      isConfigured: boolean;
      message: string;
      transferredTo?: string;
      twimlSnippet?: string;
      error?: string;
    }>('/api/twilio/support-number/test', {
      method: 'POST',
      body: JSON.stringify({ phone }),
    }),
  performCallTransfer: (data: { callSid?: string; from?: string; reason?: string }) =>
    request<{
      success: boolean;
      status: string;
      message: string;
      transferredTo?: string;
      twiml?: string;
    }>('/api/twilio/calls/transfer-human', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  getCallTransferLogs: () =>
    request<
      Array<{
        id: string;
        callSid: string;
        fromPhone: string;
        transferredToNumber: string;
        requestedAt: string;
        status: 'SUCCESS' | 'FAILED_UNCONFIGURED' | 'FAILED_BUSY' | 'FAILED_NO_ANSWER' | 'FAILED_INVALID_NUMBER';
        reason?: string;
      }>
    >('/api/twilio/transfer-logs'),
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
          sender: 'customer' | 'enquiry_bot';
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

  initiateOutboundCall: (data: {
    to: string;
    customerName?: string;
    callReason: 'order_confirmation' | 'delivery_tracking' | 'product_enquiry' | 'payment_verification' | 'custom_support';
    orderId?: string;
    productId?: string;
    customMessage?: string;
  }) =>
    request<{
      success: boolean;
      callSid: string;
      status: string;
      message: string;
      isLiveTwilio: boolean;
      initialSpeech: string;
    }>('/api/twilio/calls/outbound', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  getCallingCustomers: () =>
    request<
      Array<{
        id: string;
        name: string;
        email: string;
        phone: string;
        ordersCount: number;
        latestOrderId?: string;
        latestOrderNumber?: string;
        latestOrderStatus?: string;
        latestOrderTotal?: number;
        latestItemsSummary?: string;
      }>
    >('/api/twilio/customers'),

  // Live Courier Order Tracking
  trackOrder: (orderId: string) =>
    request<{
      success: boolean;
      order: Order;
      trackingInfo: {
        orderId: string;
        orderNumber: string;
        courierPartner: string;
        awbTrackingNumber: string;
        trackingUrl: string;
        currentStatus: string;
        statusLabel: string;
        currentLocation: string;
        destinationCity: string;
        pincode: string;
        estimatedDeliveryDate: string;
        estimatedDeliveryTimeWindow: string;
        dispatchedAt?: string;
        carrierPhone?: string;
        riderName?: string;
        milestones: Array<{
          title: string;
          description: string;
          timestamp: string;
          completed: boolean;
          location: string;
        }>;
      };
    }>(`/api/orders/track/${encodeURIComponent(orderId)}`),

  // AI Voice Call Analytics & History
  getCallAnalytics: () =>
    request<{
      totalCalls: number;
      activeCalls: number;
      completedCalls: number;
      customerEnquiries: number;
      productsDiscussed: number;
      ordersCreated: number;
      totalCallRevenue: number;
      successfulPayments: number;
      averageDurationSeconds: number;
      satisfactionScore: number;
      humanEscalations: number;
    }>('/api/twilio/calls/analytics'),

  getCallHistory: () =>
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
          sender: 'customer' | 'enquiry_bot';
          text: string;
          timestamp: string;
          sttEngine?: string;
          ttsEngine?: string;
        }>;
      }>
    >('/api/twilio/calls/history'),

  sendPaymentLinkSms: (orderId: string, phone?: string) =>
    request<{ success: boolean; messageSid?: string; recipientPhone: string; bodyText: string }>(
      '/api/sms/send-payment-link',
      {
        method: 'POST',
        body: JSON.stringify({ orderId, phone }),
      }
    ),

  sendTrackingLinkSms: (orderId: string, phone?: string) =>
    request<{ success: boolean; messageSid?: string; recipientPhone: string; bodyText: string }>(
      '/api/sms/send-tracking-link',
      {
        method: 'POST',
        body: JSON.stringify({ orderId, phone }),
      }
    ),

  // OTP Verification
  generateOtp: (phone: string, customerId?: string, orderId?: string) =>
    request<{
      success: boolean;
      phone: string;
      expiresAt: string;
      messageSid?: string;
      simulatedCode?: string;
    }>('/api/otp/generate', {
      method: 'POST',
      body: JSON.stringify({ phone, customerId, orderId }),
    }),

  verifyOtp: (phone: string, code: string) =>
    request<{
      success: boolean;
      message: string;
      authenticatedUntil?: string;
    }>('/api/otp/verify', {
      method: 'POST',
      body: JSON.stringify({ phone, code }),
    }),

  getOtpSessionStatus: (phone: string) =>
    request<{
      phone: string;
      authenticated: boolean;
      authenticatedAt?: string;
      authenticatedUntil?: string;
    }>(`/api/otp/session?phone=${encodeURIComponent(phone)}`),
};
