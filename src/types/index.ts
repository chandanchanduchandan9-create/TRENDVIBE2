export type Role = 'customer' | 'seller' | 'admin';

export interface VoiceProfile {
  isEnrolled: boolean;
  voiceprintId: string;
  enrolledAt: string;
  confidence: number;
}

export interface User {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: Role;
  password?: string;
  storeName?: string;
  storeDescription?: string;
  isApprovedSeller?: boolean;
  avatarUrl?: string;
  addresses?: Address[];
  voiceProfile?: VoiceProfile;
  createdAt: string;
}

export interface Address {
  id: string;
  name: string;
  phone: string;
  street: string;
  city: string;
  state: string;
  pincode: string;
  landmark?: string;
  isDefault?: boolean;
}

export type CategorySlug = 
  | 'medicines-healthcare'
  | 'cosmetics-personal-care'
  | 'laptops'
  | 'mobiles'
  | 'food'
  | 'shoes-footwear'
  | 'clothes-apparel'
  | 'other-store-products';

export interface CategoryInfo {
  id: string;
  slug: CategorySlug;
  name: string;
  kannadaName: string;
  icon: string;
  description: string;
  subcategories: string[];
  supportsExpress30Min: boolean;
}

export interface ProductVariant {
  id: string;
  name: string; // e.g., '128GB - Teal', 'Size 9 - White', 'Pack of 4'
  sku: string;
  price: number;
  mrp: number;
  stock: number;
  attributes: Record<string, string>;
}

export interface ProductDeliveryConfig {
  supportsExpress30Min: boolean;
  preparationMinutes: number;
  standardDeliveryDays: number;
  shippingFee: number;
  deliveryFee?: number;
  freeShippingAbove: number;
  returnPolicyDays: number;
  serviceablePincodes: string[];
  locationBasedSellingEnabled?: boolean;
  serviceCity?: string;
  deliverySpeed?: 'standard' | 'express_sameday' | 'quick_30min' | 'all';
  quickDeliveryCharge?: number;
}

export interface Product {
  id: string;
  name: string;
  kannadaName?: string;
  slug: string;
  brand: string;
  category: CategorySlug;
  subcategory: string;
  description: string;
  shortDescription: string;
  mrp: number;
  price: number;
  discountPercent: number;
  costPrice: number; // for seller COGS & profit computation
  sku: string;
  images: string[];
  variants?: ProductVariant[];
  specifications: Record<string, string>;
  minOrderQuantity?: number;
  sellingUnit?: string;
  customizationOptions?: any;
  tags: string[];
  stock: {
    onHand: number;
    reserved: number;
    available: number; // onHand - reserved
    lowStockThreshold: number;
  };
  sellerId: string;
  sellerName: string;
  instagramUrl?: string;
  officialSourceUrl?: string;
  pdfDocName?: string;
  pdfDocUrl?: string;
  pdfExtractedText?: string;
  lastVerifiedDate?: string;
  isVerifiedInfo: boolean;
  deliveryConfig: ProductDeliveryConfig;
  status: 'published' | 'draft' | 'archived';
  rating: number;
  reviewCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface SellerDocument {
  id: string;
  sellerId: string;
  productId?: string;
  productName?: string;
  category?: CategorySlug;
  fileName: string;
  fileSizeBytes: number;
  fileType: string;
  extractedText: string;
  sections: {
    title: string;
    content: string;
  }[];
  uploadedAt: string;
  status: 'indexed' | 'processing' | 'failed';
}

export interface InventoryMovement {
  id: string;
  productId: string;
  productName: string;
  sku: string;
  type: 
    | 'INITIAL_STOCK'
    | 'RESERVATION_HOLD'
    | 'RESERVATION_RELEASE'
    | 'ORDER_COMMITTED'
    | 'ORDER_CANCELLED_RESTOCKED'
    | 'MANUAL_RESTOCK'
    | 'INVENTORY_ADJUSTMENT';
  delta: number;
  previousAvailable: number;
  newAvailable: number;
  timestamp: string;
  actor: string;
  orderId?: string;
  note?: string;
}

export interface OrderItem {
  productId: string;
  productName: string;
  variantId?: string;
  variantName?: string;
  sku: string;
  price: number;
  mrp: number;
  quantity: number;
  image: string;
  category: CategorySlug;
  sellerId: string;
  sellerName: string;
}

export type OrderStatus =
  | 'ORDER_PLACED'
  | 'ACCEPTED'
  | 'PREPARING'
  | 'READY_FOR_DISPATCH'
  | 'SHIPPED'
  | 'OUT_FOR_DELIVERY'
  | 'DELIVERED'
  | 'CANCELLED'
  | 'RETURN_REQUESTED'
  | 'RETURNED';

export interface OrderTimelineEvent {
  status: OrderStatus;
  timestamp: string;
  note: string;
  actor: string;
}

export interface Order {
  id: string;
  orderNumber: string;
  customerId: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  shippingAddress: Address;
  items: OrderItem[];
  subtotal: number;
  discount: number;
  tax: number;
  shippingFee: number;
  totalAmount: number;
  paymentMethod: 'COD' | 'ONLINE_RAZORPAY';
  paymentStatus: 'PENDING' | 'PAID' | 'FAILED' | 'REFUNDED';
  paymentId?: string;
  razorpayOrderId?: string;
  razorpaySignature?: string;
  orderStatus: OrderStatus;
  isExpress30Min: boolean;
  estimatedDeliveryTime?: string;
  aiAssisted: boolean;
  aiConversationSummary?: string;
  timeline: OrderTimelineEvent[];
  cancellationReason?: string;
  returnReason?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ProductEnquiry {
  id: string;
  productId: string;
  productName: string;
  sellerId: string;
  customerId: string;
  customerName: string;
  customerPhone?: string;
  customerEmail?: string;
  question?: string;
  preferredCallback?: 'INSTANT_AI_CALL' | 'SCHEDULED_CALL' | 'TEXT_ONLY';
  callStatus?: 'PENDING' | 'CALLING' | 'COMPLETED' | 'FAILED';
  callSummary?: string;
  interestLevel?: 'HIGH' | 'MEDIUM' | 'LOW' | 'UNSURE';
  customerQuestions?: string[];
  customerObjections?: string[];
  followupRequired?: string;
  calledAt?: string;
  callDuration?: number;
  callSid?: string;
  hasConsent?: boolean;
  consentTimestamp?: string;
  googleSheetsSynced?: boolean;
  googleSheetsRowUrl?: string;
  humanTransferRequested?: boolean;
  transferReason?: string;
  transcript?: { speaker: string; text: string; timestamp: string }[];
  status: 'OPEN' | 'RESOLVED';
  channel: 'WEB_CHAT' | 'BOT_CALL' | 'FORM_ENQUIRY';
  lastMessageSnippet: string;
  messages: {
    id: string;
    sender: 'customer' | 'seller' | 'enquiry_bot';
    senderName: string;
    text: string;
    kannadaText?: string;
    citations?: string[];
    timestamp: string;
  }[];
  createdAt: string;
  updatedAt: string;
}

export interface DemandFunnelMetrics {
  impressions: number;
  instagramClicks: number;
  enquiriesStarted: number;
  aiConversationsCompleted: number;
  qualifiedLeads: number;
  addToCartEvents: number;
  checkoutStarts: number;
  ordersPlaced: number;
  ordersPaidOrConfirmed: number;
  ordersDelivered: number;
  topEnquiredProducts: {
    productId: string;
    productName: string;
    count: number;
    category: string;
  }[];
  commonObjections: {
    reason: string;
    count: number;
    resolvedCount: number;
  }[];
  lowStockItems: {
    productId: string;
    productName: string;
    sku: string;
    available: number;
    threshold: number;
  }[];
  conversionRates: {
    visitToCart: number;
    cartToCheckout: number;
    checkoutToOrder: number;
    overallConversion: number;
  };
}

export interface SellerFinanceMetrics {
  grossMerchandiseSales: number; // GMV
  sellerDiscounts: number;
  refundsAndCancellations: number;
  netSales: number; // GMV - discounts - refunds
  deliveryChargesCollected: number;
  taxCollected: number;
  paymentGatewayFees: number; // e.g. 2% on online payments
  costOfGoodsSold: number; // COGS
  estimatedGrossProfit: number; // Net Sales - COGS
  platformCommissionAndExpenses: number;
  estimatedNetProfit: number;
  codCollected: number;
  codPendingSettlement: number;
  onlineSettled: number;
  onlinePendingSettlement: number;
  outstandingRefunds: number;
}

export interface PriceDropAlert {
  id: string;
  productId: string;
  productName: string;
  userEmail: string;
  targetPrice: number;
  currentPrice: number;
  createdAt: string;
  status: 'active' | 'triggered';
}

export type HumanSupportPhoneStatus = 'NOT_CONFIGURED' | 'CONFIGURED' | 'TEST_FAILED';

export interface PlatformSettings {
  humanSupportPhone?: string;
  humanSupportPhoneStatus?: HumanSupportPhoneStatus;
  updatedAt?: string;
  updatedBy?: string;
}

export interface CallTransferLog {
  id: string;
  callSid: string;
  fromPhone: string;
  transferredToNumber: string;
  requestedAt: string;
  status: 'SUCCESS' | 'FAILED_UNCONFIGURED' | 'FAILED_BUSY' | 'FAILED_NO_ANSWER' | 'FAILED_INVALID_NUMBER';
  reason?: string;
}

export interface CustomerLead {
  id: string;
  name: string;
  mobile: string;
  email: string;
  productInterest: string;
  productId?: string;
  productName?: string;
  sellerId?: string;
  notes?: string;
  hasConsent: boolean;
  consentTimestamp: string;
  source: string;
  status: 'NEW' | 'CONTACTED' | 'QUALIFIED' | 'CONVERTED' | 'DISQUALIFIED';
  callStatus?: 'NOT_CALLED' | 'CALLING' | 'COMPLETED' | 'FAILED';
  callSummary?: string;
  createdAt: string;
  updatedAt: string;
}

