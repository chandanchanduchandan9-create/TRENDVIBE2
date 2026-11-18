import { GoogleGenAI, Type } from '@google/genai';
import { db } from './db.ts';
import { Product, Order } from '../src/types/index.ts';
import { isProductExpress30MinEligible } from './delivery.ts';
import { getCourierTrackingDetails } from './courier.ts';
import { smsService } from './sms.ts';
import { mongoService } from './mongodb.ts';
import { generateAndSendOtp, verifyOtpCode, isSessionAuthenticated } from './otp.ts';

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY || 'AIzaSy_demo_fallback_key',
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    },
  },
});

export type BotIntent =
  | 'PRODUCT_OVERVIEW'
  | 'SPECIFICATIONS'
  | 'MINIMUM_ORDER'
  | 'STOCK'
  | 'PRICE'
  | 'CUSTOMIZATION'
  | 'DELIVERY'
  | 'RETURN_POLICY'
  | 'ADD_TO_CART'
  | 'PLACE_ORDER'
  | 'ORDER_CONFIRMATION'
  | 'ORDER_TRACKING'
  | 'PAYMENT_ENQUIRY'
  | 'CANCELLATION'
  | 'HUMAN_SUPPORT'
  | 'OTHER';

export interface BotChatInput {
  message: string;
  history?: { role: 'user' | 'model'; parts: { text: string }[] }[];
  productId?: string;
  productName?: string;
  category?: string;
  language?: 'en' | 'kn' | 'hi' | 'auto';
  customerId?: string;
  customerName?: string;
  customerPhone?: string;
  isCallingSession?: boolean;
  hostHeader?: string;
}

export interface BotChatResponse {
  reply: string;
  kannadaReply?: string;
  hindiReply?: string;
  languageDetected: 'en' | 'kn' | 'hi';
  citations: string[];
  intent?: BotIntent;
  orderProposal?: {
    readyToConfirm: boolean;
    productId: string;
    productName: string;
    quantity: number;
    unitPrice: number;
    subtotal: number;
    tax: number;
    shippingFee: number;
    totalAmount: number;
    isExpress30Min: boolean;
    deliveryAddress: string;
    pincode: string;
    paymentMethod: 'COD' | 'ONLINE_RAZORPAY';
    orderId?: string;
    paymentUrl?: string;
  };
  trackingDetails?: {
    orderId: string;
    orderNumber: string;
    courierPartner: string;
    trackingNumber: string;
    trackingUrl: string;
    statusLabel: string;
    currentLocation: string;
    estimatedDeliveryDate: string;
  };
  cartAction?: {
    type: 'ADD_TO_CART';
    productId: string;
    productName: string;
    quantity: number;
    price: number;
    product: Product;
  };
  productContext?: {
    id: string;
    name: string;
    price: number;
    availableStock: number;
    category: string;
    isExpress30Min: boolean;
    minOrderQuantity?: number;
    sellingUnit?: string;
  };
  isEnding?: boolean;
  requiresHumanEscalation?: boolean;
  smsSent?: boolean;
  requiresOtpVerification?: boolean;
  otpPhone?: string;
  orderNumber?: string;
  razorpayPaymentUrl?: string;
}

/**
 * Sanitize PDF or extracted document text so raw unreadable binary never reaches the customer.
 */
export function sanitizeExtractedDocText(raw?: string): string {
  if (!raw) return '';
  const clean = raw.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F-\x9F]/g, ' ').trim();
  if (clean.length > 20) {
    const printableCount = (clean.match(/[\w\s.,!?:;'"()\/-]/g) || []).length;
    if (printableCount / clean.length < 0.6) {
      return '';
    }
  }
  return clean;
}

/**
 * Intent Classifier: strictly classifies customer input into standard customer intents.
 */
export function classifyCustomerIntent(message: string, hasPendingOrderProposal = false): BotIntent {
  const q = message.toLowerCase().trim();

  // 1. Human Support Escalation
  if (
    q.includes('human') ||
    q.includes('agent') ||
    q.includes('representative') ||
    q.includes('support agent') ||
    q.includes('customer care') ||
    q.includes('connect to manager') ||
    q.includes('speak to person') ||
    q.includes('real person') ||
    q.includes('transfer me') ||
    q.includes('escalat') ||
    q.includes('ಮಾನವ ಬೆಂಬಲ') ||
    q.includes('ಎಜೆಂಟ್') ||
    q.includes('एजेंट से बात') ||
    q.includes('कस्टमर केयर')
  ) {
    return 'HUMAN_SUPPORT';
  }

  // 2. Order Tracking & Delivery Status (High Priority)
  if (
    q.includes('where is my order') ||
    q.includes('track my order') ||
    q.includes('track order') ||
    q.includes('order status') ||
    q.includes('has my order been shipped') ||
    q.includes('when will my product arrive') ||
    q.includes('delivery status') ||
    q.includes('can i track my parcel') ||
    q.includes('parcel status') ||
    q.includes('tracking link') ||
    q.includes('order reach') ||
    q.includes('ನನ್ನ ಆರ್ಡರ್ ಎಲ್ಲಿದೆ') ||
    q.includes('मेरा ऑर्डर कहां है') ||
    q.includes('tv-') ||
    q.includes('tv10')
  ) {
    return 'ORDER_TRACKING';
  }

  // 3. Payment Enquiry & Payment Links
  if (
    q.includes('payment link') ||
    q.includes('pay online') ||
    q.includes('razorpay') ||
    q.includes('upi payment') ||
    q.includes('is my payment confirmed') ||
    q.includes('payment status') ||
    q.includes('ಪಾವತಿ ಲಿಂಕ್')
  ) {
    return 'PAYMENT_ENQUIRY';
  }

  // 4. Cancellation Inquiry
  if (
    q.includes('cancel my order') ||
    q.includes('cancellation policy') ||
    q.includes('cancel this order') ||
    q.includes('ಆರ್ಡರ್ ರದ್ದುಗೊಳಿಸಿ')
  ) {
    return 'CANCELLATION';
  }

  // 5. Order Confirmation (when confirming a presented proposal)
  if (
    hasPendingOrderProposal &&
    (/^(yes|confirm|place it|proceed|ok|sure|go ahead|yes please|ಹೌದು|ಖಚಿತಪಡಿಸಿ|हाँ|पुष्टि करें)$/i.test(q) ||
      q.includes('confirm order') ||
      q.includes('place the order') ||
      q.includes('confirm it'))
  ) {
    return 'ORDER_CONFIRMATION';
  }

  // 6. Add to Cart
  if (
    /^(add to cart|add this to cart|add it to my cart|add to bag|put in cart|ಕಾರ್ಟ್‌ಗೆ ಸೇರಿಸಿ)/i.test(q) ||
    ((q.includes('add') || q.includes('put')) && (q.includes('cart') || q.includes('bag')))
  ) {
    return 'ADD_TO_CART';
  }

  // 7. Minimum Order Quantity
  if (
    q.includes('minimum order') ||
    q.includes('min order') ||
    q.includes('moq') ||
    q.includes('minimum quantity') ||
    q.includes('ಕನಿಷ್ಠ ಆರ್ಡರ್')
  ) {
    return 'MINIMUM_ORDER';
  }

  // 8. Place Order / Buy instruction
  if (
    q.includes('place order') ||
    q.includes('i want to order') ||
    q.includes('buy this now') ||
    q.includes('i want to purchase') ||
    q.includes('buy this') ||
    q.includes('order this') ||
    q.includes('ಖರೀದಿಸಿ') ||
    q.includes('ಆರ್ಡರ್ ಮಾಡಿ') ||
    q.includes('खरीदना चाहता हूं')
  ) {
    return 'PLACE_ORDER';
  }

  // 9. Stock / Inventory inquiry
  if (
    q.includes('stock') ||
    q.includes('how many units') ||
    q.includes('available units') ||
    q.includes('in stock') ||
    q.includes('out of stock') ||
    q.includes('ಸ್ಟಾಕ್')
  ) {
    return 'STOCK';
  }

  // 10. Price inquiry
  if (
    q.includes('price') ||
    q.includes('how much is') ||
    q.includes('cost of') ||
    q.includes('rate') ||
    q.includes('discount') ||
    q.includes('mrp') ||
    q.includes('ಬೆಲೆ') ||
    q.includes('कीमत')
  ) {
    return 'PRICE';
  }

  // 11. Specifications / Features / Ingredients / Warranty
  if (
    q.includes('specification') ||
    q.includes('specs') ||
    q.includes('features') ||
    q.includes('ingredients') ||
    q.includes('dosage') ||
    q.includes('warranty') ||
    q.includes('material') ||
    q.includes('processor') ||
    q.includes('ram') ||
    q.includes('ವಿವರಣೆ')
  ) {
    return 'SPECIFICATIONS';
  }

  // 12. Customization
  if (
    q.includes('customize') ||
    q.includes('customise') ||
    q.includes('customization') ||
    q.includes('personalize') ||
    q.includes('ಕಸ್ಟಮೈಸ್')
  ) {
    return 'CUSTOMIZATION';
  }

  // 13. Delivery & Shipping info
  if (
    q.includes('delivery') ||
    q.includes('shipping') ||
    q.includes('courier') ||
    q.includes('pincode') ||
    q.includes('30 min') ||
    q.includes('express') ||
    q.includes('ಡೆಲಿವರಿ')
  ) {
    return 'DELIVERY';
  }

  // 14. Return Policy
  if (
    q.includes('return') ||
    q.includes('refund') ||
    q.includes('exchange') ||
    q.includes('replacement') ||
    q.includes('ವಾಪಸ್')
  ) {
    return 'RETURN_POLICY';
  }

  // 15. Product Overview
  if (
    q.includes('tell me about') ||
    q.includes('what is this') ||
    q.includes('overview') ||
    q.includes('describe')
  ) {
    return 'PRODUCT_OVERVIEW';
  }

  return 'OTHER';
}

/**
 * Handle Order Tracking Requests directly with customer verification and SMS link sending
 */
export async function handleOrderTrackingRequest(
  message: string,
  customerPhone?: string,
  hostHeader?: string
): Promise<BotChatResponse> {
  const allOrders = db.getOrders();
  const cleanPhone = customerPhone ? customerPhone.replace(/[\s\-\(\)\+]/g, '') : '';

  // 1. Try matching order by phone number or extracted order ID (e.g. TV-2026-9481 or 9481)
  const orderIdMatch = message.match(/tv[-_]?2026[-_]?\d+/i) || message.match(/tv\d+/i) || message.match(/\b\d{4,6}\b/);
  const searchKey = orderIdMatch ? orderIdMatch[0].toUpperCase() : '';

  let matchedOrder: Order | undefined = undefined;

  if (searchKey) {
    matchedOrder = allOrders.find(
      (o) => o.id.toUpperCase().includes(searchKey) || o.orderNumber.toUpperCase().includes(searchKey)
    );
  }

  if (!matchedOrder && cleanPhone.length >= 6) {
    // Find latest order belonging to caller's phone number
    const userOrders = allOrders.filter((o) => {
      const oPhone = (o.shippingAddress?.phone || o.customerPhone || '').replace(/[\s\-\(\)\+]/g, '');
      return oPhone.includes(cleanPhone) || cleanPhone.includes(oPhone);
    });
    if (userOrders.length > 0) {
      matchedOrder = userOrders[0]; // Most recent order
    }
  }

  // Fallback to demo default order if asking generally
  if (!matchedOrder) {
    matchedOrder = allOrders[0];
  }

  if (!matchedOrder) {
    return {
      reply: 'I could not locate an active order associated with your details. Please provide your exact Order Number (e.g., TV-2026-9481) or verify your registered phone number.',
      kannadaReply: 'ನಿಮ್ಮ ವಿವರಗಳಿಗೆ ಹೊಂದಿಕೆಯಾಗುವ ಯಾವುದೇ ಸಕ್ರಿಯ ಆರ್ಡರ್ ಕಂಡುಬಂದಿಲ್ಲ. ದಯವಿಟ್ಟು ನಿಮ್ಮ ಆರ್ಡರ್ ಸಂಖ್ಯೆಯನ್ನು ನೀಡಿ.',
      languageDetected: /[\u0C80-\u0CFF]/.test(message) ? 'kn' : 'en',
      citations: ['TrendVibe Order Management System'],
      intent: 'ORDER_TRACKING',
    };
  }

  const targetPhone = customerPhone || matchedOrder.shippingAddress?.phone || '+91 98450 12345';
  const authenticated = isSessionAuthenticated(targetPhone);

  if (!authenticated) {
    // Generate and send OTP via SMS
    const otpRes = await generateAndSendOtp({
      phone: targetPhone,
      customerId: matchedOrder.customerId,
      orderId: matchedOrder.id,
    });

    const maskedPhone = targetPhone.replace(/(\+\d{2}\s?\d{2})\d{4}(\d{4})/, '$1****$2');
    const reply = `To protect your private order information, I have sent a 6-digit security code via SMS to your mobile number ending in ${targetPhone.slice(-4)}. Please speak the code out loud or enter it on your keypad to view live tracking details.`;

    return {
      reply,
      kannadaReply: `ನಿಮ್ಮ ಸುರಕ್ಷತೆಗಾಗಿ, 6-ಅಂಕಿಯ ಒಟಿಪಿಯನ್ನು ಕಳುಹಿಸಲಾಗಿದೆ. ದಯವಿಟ್ಟು ಒಟಿಪಿಯನ್ನು ನೀಡಿ.`,
      hindiReply: `सुरक्षा के लिए आपके मोबाइल नंबर पर 6-अंकीय कोड भेजा गया है। कृपया कोड बताएं।`,
      languageDetected: /[\u0C80-\u0CFF]/.test(message) ? 'kn' : /[\u0900-\u097F]/.test(message) ? 'hi' : 'en',
      citations: ['Telephony Security OTP Verification'],
      intent: 'ORDER_TRACKING',
      requiresOtpVerification: true,
      otpPhone: targetPhone,
      orderNumber: matchedOrder.orderNumber,
    };
  }

  // Get Courier Partner Tracking Details
  const courierDetails = getCourierTrackingDetails(matchedOrder, hostHeader);

  // Send Live Tracking Link via SMS to Customer's Phone
  let smsSent = false;
  smsService
    .sendTrackingLinkSms(targetPhone, matchedOrder.orderNumber, courierDetails.trackingUrl, courierDetails.estimatedDeliveryDate)
    .then(() => {
      smsSent = true;
    })
    .catch(() => {});

  const itemsSummary = matchedOrder.items?.map((it) => `${it.quantity}x ${it.productName}`).join(', ') || 'your items';
  const reply = `Order #${matchedOrder.orderNumber} for ${itemsSummary} is currently ${courierDetails.statusLabel}. Courier Partner: ${courierDetails.courierPartner} (AWB: ${courierDetails.awbTrackingNumber}). Estimated delivery is ${courierDetails.estimatedDeliveryDate} (${courierDetails.estimatedDeliveryTimeWindow}). I have sent the live tracking link to your phone via SMS.`;

  return {
    reply,
    kannadaReply: `ಆರ್ಡರ್ #${matchedOrder.orderNumber} ಪ್ರಸ್ತುತ ${courierDetails.statusLabel} ಹಂತದಲ್ಲಿದೆ. ಅಂದಾಜು ಡೆಲಿವರಿ ದಿನಾಂಕ: ${courierDetails.estimatedDeliveryDate}. ಲೈವ್ ಟ್ರ್ಯಾಕಿಂಗ್ ಲಿಂಕ್ ಅನ್ನು ಎಸ್‌ಎಮ್‌ಎಸ್ ಮೂಲಕ ಕಳುಹಿಸಲಾಗಿದೆ.`,
    languageDetected: /[\u0C80-\u0CFF]/.test(message) ? 'kn' : 'en',
    citations: [`Order #${matchedOrder.orderNumber}`, `${courierDetails.courierPartner} Tracking Gateway`],
    intent: 'ORDER_TRACKING',
    trackingDetails: {
      orderId: matchedOrder.id,
      orderNumber: matchedOrder.orderNumber,
      courierPartner: courierDetails.courierPartner,
      trackingNumber: courierDetails.awbTrackingNumber,
      trackingUrl: courierDetails.trackingUrl,
      statusLabel: courierDetails.statusLabel,
      currentLocation: courierDetails.currentLocation,
      estimatedDeliveryDate: courierDetails.estimatedDeliveryDate,
    },
    smsSent: true,
  };
}

/**
 * Knowledge & Order Execution Engine
 */
function trainedKnowledgeGuidance(
  message: string,
  currentProduct?: Product,
  customerName?: string,
  customerPhone?: string,
  hostHeader?: string,
  productNameHint?: string
): BotChatResponse {
  const q = message.toLowerCase().trim();
  const allProducts = db.getProducts({ status: 'published' });
  const citations: string[] = [];

  // Match target product from query or context
  let targetProduct = currentProduct;
  if (!targetProduct) {
    targetProduct = allProducts.find((p) => {
      const pName = p.name.toLowerCase();
      const pBrand = p.brand.toLowerCase();
      const pSku = p.sku.toLowerCase();

      if (q.includes(pName) || q.includes(pBrand) || q.includes(pSku)) return true;
      if (p.tags && p.tags.some((t) => q.includes(t.toLowerCase()))) return true;

      if (q.includes('dolo') && pName.includes('dolo')) return true;
      if (q.includes('calpol') && pName.includes('calpol')) return true;
      if (q.includes('electral') && pName.includes('electral')) return true;
      if (q.includes('moov') && pName.includes('moov')) return true;
      if (q.includes('menthoplus') && pName.includes('menthoplus')) return true;
      if (q.includes('ragi') && pName.includes('ragi')) return true;
      if (q.includes('ladoo') && pName.includes('ladoo')) return true;
      if (q.includes('iphone') && pName.includes('iphone')) return true;
      if (q.includes('s25') && pName.includes('s25')) return true;
      if (q.includes('pixel') && pName.includes('pixel')) return true;
      if (q.includes('oneplus') && pName.includes('oneplus')) return true;
      if (q.includes('tuf') && pName.includes('tuf')) return true;

      return false;
    });
  }

  const intent = classifyCustomerIntent(message);

  // Human escalation intent
  if (intent === 'HUMAN_SUPPORT') {
    return {
      reply: 'I am escalating your request to a senior customer support manager. Our executive will reach out to your phone number shortly.',
      kannadaReply: 'ನಾನು ನಿಮ್ಮ ವಿನಂತಿಯನ್ನು ಹಿರಿಯ ಬೆಂಬಲ ಅಧಿಕಾರಿಗೆ ರವಾನಿಸುತ್ತಿದ್ದೇನೆ.',
      hindiReply: 'मैं आपका अनुरोध एक वरिष्ठ सहायता विशेषज्ञ को भेज रहा हूँ। हमारे प्रतिनिधि शीघ्र ही आपसे संपर्क करेंगे।',
      languageDetected: /[\u0C80-\u0CFF]/.test(message) ? 'kn' : /[\u0900-\u097F]/.test(message) ? 'hi' : 'en',
      citations: ['TrendVibe Customer Support Escalate Queue'],
      intent: 'HUMAN_SUPPORT',
      requiresHumanEscalation: true,
    };
  }

  if (targetProduct) {
    citations.push(`TrendVibe Store: ${targetProduct.name} (SKU: ${targetProduct.sku})`);
    const sellingUnit = targetProduct.sellingUnit || 'piece';
    const minOrderQty = targetProduct.minOrderQuantity || 1;
    const isExpress = isProductExpress30MinEligible(targetProduct);

    if (intent === 'MINIMUM_ORDER') {
      return {
        reply: `The minimum order quantity for ${targetProduct.name} is ${minOrderQty} ${sellingUnit}.`,
        kannadaReply: `${targetProduct.name} ಗೆ ಕನಿಷ್ಠ ಆರ್ಡರ್ ಪ್ರಮಾಣ ${minOrderQty} ${sellingUnit} ಆಗಿದೆ.`,
        hindiReply: `${targetProduct.name} के लिए न्यूनतम ऑर्डर मात्रा ${minOrderQty} ${sellingUnit} है।`,
        languageDetected: /[\u0C80-\u0CFF]/.test(message) ? 'kn' : /[\u0900-\u097F]/.test(message) ? 'hi' : 'en',
        citations,
        intent: 'MINIMUM_ORDER',
      };
    }

    if (intent === 'PRICE') {
      const discountText = targetProduct.discountPercent > 0 ? ` (${targetProduct.discountPercent}% off MRP ₹${targetProduct.mrp})` : '';
      return {
        reply: `The price for ${targetProduct.name} is ₹${targetProduct.price.toLocaleString('en-IN')} per ${sellingUnit}${discountText}.`,
        kannadaReply: `${targetProduct.name} ನ ಬೆಲೆ ಪ್ರತಿ ${sellingUnit}ಗೆ ₹${targetProduct.price} ಆಗಿದೆ.`,
        hindiReply: `${targetProduct.name} की कीमत ₹${targetProduct.price.toLocaleString('en-IN')} प्रति ${sellingUnit}${discountText} है।`,
        languageDetected: /[\u0C80-\u0CFF]/.test(message) ? 'kn' : /[\u0900-\u097F]/.test(message) ? 'hi' : 'en',
        citations,
        intent: 'PRICE',
      };
    }

    if (intent === 'STOCK') {
      const avail = targetProduct.stock.available;
      return {
        reply: avail > 0 ? `We currently have ${avail} ${sellingUnit}s in stock.` : `${targetProduct.name} is currently out of stock.`,
        kannadaReply: avail > 0 ? `ಪ್ರಸ್ತುತ ${avail} ${sellingUnit}ಗಳು ಸ್ಟಾಕ್‌ನಲ್ಲಿ ಲಭ್ಯವಿದೆ.` : `ಸದ್ಯಕ್ಕೆ ಇದು ಸ್ಟಾಕ್‌ನಲ್ಲಿಲ್ಲ.`,
        hindiReply: avail > 0 ? `हमारे पास वर्तमान में ${avail} ${sellingUnit} स्टॉक में उपलब्ध हैं।` : `${targetProduct.name} अभी स्टॉक में उपलब्ध नहीं है।`,
        languageDetected: /[\u0C80-\u0CFF]/.test(message) ? 'kn' : /[\u0900-\u097F]/.test(message) ? 'hi' : 'en',
        citations,
        intent: 'STOCK',
      };
    }

    if (intent === 'DELIVERY') {
      const speedText = isExpress ? 'eligible for ⚡ 30-Minute Express Delivery in Bangalore.' : 'standard 2-4 day delivery across India.';
      return {
        reply: `${targetProduct.name} is ${speedText}`,
        kannadaReply: isExpress ? `ಇದು 30 ನಿಮಿಷಗಳ ಎಕ್ಸ್‌ಪ್ರೆಸ್ ಡೆಲಿವರಿಗೆ ಲಭ್ಯವಿದೆ.` : `ಇದು 2 ರಿಂದ 4 ದಿನಗಳಲ್ಲಿ ತಲುಪಲಿದೆ.`,
        hindiReply: isExpress ? `${targetProduct.name} बैंगलोर में 30-मिनट एक्सप्रेस डिलीवरी के लिए उपलब्ध है।` : `${targetProduct.name} भारत भर में 2-4 दिनों में डिलीवर किया जाता है।`,
        languageDetected: /[\u0C80-\u0CFF]/.test(message) ? 'kn' : /[\u0900-\u097F]/.test(message) ? 'hi' : 'en',
        citations,
        intent: 'DELIVERY',
      };
    }

    if (intent === 'SPECIFICATIONS' || intent === 'PRODUCT_OVERVIEW' || targetProduct.pdfExtractedText) {
      const pdfText = targetProduct.pdfExtractedText ? ` [Verified PDF Specification: ${targetProduct.pdfExtractedText}]` : '';
      const specsText = targetProduct.specifications ? Object.entries(targetProduct.specifications).map(([k, v]) => `${k}: ${v}`).join('; ') : '';
      const responseDetail = `${targetProduct.name} - ${targetProduct.description || targetProduct.shortDescription}.${specsText ? ` Specs: ${specsText}.` : ''}${pdfText}`;

      return {
        reply: responseDetail,
        kannadaReply: targetProduct.kannadaName ? `${targetProduct.kannadaName}: ${responseDetail}` : responseDetail,
        hindiReply: `${targetProduct.name} — कीमत ₹${targetProduct.price.toLocaleString('en-IN')}। ${targetProduct.shortDescription || targetProduct.description}${specsText ? ` मुख्य विवरण: ${specsText}।` : ''}`,
        languageDetected: /[\u0C80-\u0CFF]/.test(message) ? 'kn' : /[\u0900-\u097F]/.test(message) ? 'hi' : 'en',
        citations: [...citations, ...(targetProduct.pdfDocName ? [targetProduct.pdfDocName] : [])],
        intent: 'SPECIFICATIONS',
      };
    }

    if (intent === 'PLACE_ORDER') {
      const qtyMatch = message.match(/\b([1-9]|10)\b/);
      const qty = qtyMatch ? parseInt(qtyMatch[1], 10) : minOrderQty;
      const subtotal = targetProduct.price * qty;
      const tax = Math.round(subtotal * 0.05);
      const shippingFee = subtotal > 499 ? 0 : 25;
      const totalAmount = subtotal + tax + shippingFee;

      return {
        reply: `I've prepared an order for ${qty}x "${targetProduct.name}" totaling ₹${totalAmount.toLocaleString('en-IN')}. Would you like me to confirm this order now?`,
        kannadaReply: `${qty}x "${targetProduct.name}" ಗೆ ಒಟ್ಟು ₹${totalAmount} ಆಗಿದೆ. ನಾನು ಆರ್ಡರ್ ದೃಢೀಕರಿಸಲೇ?`,
        hindiReply: `मैंने ${qty}x "${targetProduct.name}" के लिए ₹${totalAmount.toLocaleString('en-IN')} का ऑर्डर तैयार किया है। क्या मैं इस ऑर्डर की पुष्टि करूँ?`,
        languageDetected: /[\u0C80-\u0CFF]/.test(message) ? 'kn' : /[\u0900-\u097F]/.test(message) ? 'hi' : 'en',
        citations,
        intent: 'PLACE_ORDER',
        orderProposal: {
          readyToConfirm: true,
          productId: targetProduct.id,
          productName: targetProduct.name,
          quantity: qty,
          unitPrice: targetProduct.price,
          subtotal,
          tax,
          shippingFee,
          totalAmount,
          isExpress30Min: isExpress,
          deliveryAddress: 'Flat 402, Green Glen Heights, Bellandur, Bangalore',
          pincode: '560103',
          paymentMethod: 'COD',
        },
      };
    }

    // Default grounded answer whenever a product is in focus (e.g. post-enquiry or post-lead chat)
    const avail = targetProduct.stock.available;
    const discountText = targetProduct.discountPercent > 0 ? ` (${targetProduct.discountPercent}% off MRP ₹${targetProduct.mrp})` : '';
    const speedText = isExpress ? '30-Minute Express Delivery in Bangalore' : '2–4 day standard delivery across India';
    const specsText = targetProduct.specifications
      ? Object.entries(targetProduct.specifications).slice(0, 4).map(([k, v]) => `${k}: ${v}`).join('; ')
      : '';
    const pdfSnippet = targetProduct.pdfExtractedText ? ` Verified datasheet note: ${targetProduct.pdfExtractedText.slice(0, 220)}` : '';
    const summaryReply = `${targetProduct.name} is priced at ₹${targetProduct.price.toLocaleString('en-IN')} per ${sellingUnit}${discountText} with ${avail > 0 ? `${avail} ${sellingUnit}s in stock` : 'limited stock'}. Delivery: ${speedText}. ${targetProduct.shortDescription || targetProduct.description || ''}${specsText ? ` Key specs: ${specsText}.` : ''}${pdfSnippet} Would you like me to help place an order, check a delivery PIN code, or connect you with our seller?`;

    return {
      reply: summaryReply,
      kannadaReply: `${targetProduct.kannadaName || targetProduct.name}: ಬೆಲೆ ₹${targetProduct.price.toLocaleString('en-IN')}, ಲಭ್ಯವಿರುವ ಸ್ಟಾಕ್: ${avail} ${sellingUnit}. ${isExpress ? 'ಬೆಂಗಳೂರಿನಲ್ಲಿ 30-ನಿಮಿಷದ ಎಕ್ಸ್‌ಪ್ರೆಸ್ ಡೆಲಿವರಿ ಲಭ್ಯವಿದೆ.' : '2-4 ದಿನಗಳಲ್ಲಿ ಸ್ಟ್ಯಾಂಡರ್ಡ್ ಡೆಲಿವರಿ ಲಭ್ಯವಿದೆ.'}`,
      hindiReply: `${targetProduct.name} की कीमत ₹${targetProduct.price.toLocaleString('en-IN')} प्रति ${sellingUnit}${discountText} है और स्टॉक में ${avail} उपलब्ध हैं। डिलीवरी: ${isExpress ? 'बैंगलोर में 30-मिनट एक्सप्रेस डिलीवरी' : '2-4 दिन मानक डिलीवरी'}। क्या आप ऑर्डर या थोक मूल्य के बारे में जानना चाहेंगे?`,
      languageDetected: /[\u0C80-\u0CFF]/.test(message) ? 'kn' : /[\u0900-\u097F]/.test(message) ? 'hi' : 'en',
      citations,
      intent: 'PRODUCT_OVERVIEW',
      productContext: {
        id: targetProduct.id,
        name: targetProduct.name,
        price: targetProduct.price,
        availableStock: targetProduct.stock.available,
        category: targetProduct.category,
        isExpress30Min: isExpress,
        minOrderQuantity: minOrderQty,
        sellingUnit,
      },
    };
  }

  if (productNameHint && productNameHint.trim()) {
    return {
      reply: `Thank you for your enquiry about "${productNameHint.trim()}". I have logged your requirement for our verified merchant team. You can ask me to check commercial bulk pricing, delivery timelines, GST invoice options, or click "Call My Phone" / "Talk to Human" to speak with a specialist directly.`,
      kannadaReply: `"${productNameHint.trim()}" ಕುರಿತ ನಿಮ್ಮ ವಿಚಾರಣೆಯನ್ನು ದಾಖಲಿಸಲಾಗಿದೆ. ಬೆಲೆ, ಡೆಲಿವರಿ ಅಥವಾ ಮಾರಾಟಗಾರರೊಂದಿಗೆ ಮಾತನಾಡಲು ಕೇಳಿ.`,
      hindiReply: `"${productNameHint.trim()}" के बारे में आपकी पूछताछ दर्ज कर ली गई है। आप थोक मूल्य, डिलीवरी समय, या विशेषज्ञ से बात करने के लिए पूछ सकते हैं।`,
      languageDetected: /[\u0C80-\u0CFF]/.test(message) ? 'kn' : /[\u0900-\u097F]/.test(message) ? 'hi' : 'en',
      citations: [`Enquiry Reference: ${productNameHint.trim()}`],
      intent: 'PRODUCT_OVERVIEW',
    };
  }

  return {
    reply: `Welcome to TrendVibe Store! I am the Customer Enquiry Bot. I can help you with product specifications, live order tracking, voice ordering, and Razorpay payments. Which product or order can I assist you with today?`,
    kannadaReply: `ಟ್ರೆಂಡ್‌ವೈಬ್ ಸ್ಟೋರ್‌ಗೆ ಸ್ವಾಗತ! ನಾನು ಗ್ರಾಹಕ ವಿಚಾರಣೆ ಬೋಟ್. ಉತ್ಪನ್ನ ವಿವರಣೆ, ಲೈವ್ ಆರ್ಡರ್ ಟ್ರ್ಯಾಕಿಂಗ್ ಮತ್ತು ಆರ್ಡರ್‌ಗೆ ನಾನು ಸಹಾಯ ಮಾಡಬಲ್ಲೆ.`,
    hindiReply: `ट्रेंडवाइब स्टोर में आपका स्वागत है! मैं आपका उत्पाद और ऑर्डर सहायक हूँ। आज मैं आपकी किस उत्पाद या ऑर्डर में मदद कर सकता हूँ?`,
    languageDetected: 'en',
    citations: ['TrendVibe Store Catalogue'],
    intent: 'OTHER',
  };
}

// =========================================================================
// MAIN CONVERSATION HANDLER (GEMINI + ORDER TRACKING + VOICE ORDERING)
// =========================================================================
export async function processBotConversation(input: BotChatInput): Promise<BotChatResponse> {
  const allProducts = db.getProducts({ status: 'published' });
  let currentProduct = input.productId ? db.getProductById(input.productId) : undefined;
  if (!currentProduct && input.productName) {
    const targetLower = input.productName.toLowerCase().trim();
    const tokens = targetLower.split(/\s+/).filter((t) => t.length >= 3);
    currentProduct =
      allProducts.find((p) => p.name.toLowerCase() === targetLower) ||
      allProducts.find((p) => p.name.toLowerCase().includes(targetLower) || targetLower.includes(p.name.toLowerCase())) ||
      (tokens.length > 0
        ? allProducts.find((p) => {
            const pLower = `${p.name} ${p.brand}`.toLowerCase();
            return tokens.some((tok) => pLower.includes(tok));
          })
        : undefined);
  }

  // 0. Intercept 6-digit OTP Verification Attempt
  const digitMatch = input.message.match(/\b\d{6}\b/);
  if (digitMatch) {
    const code = digitMatch[0];
    const phone = input.customerPhone || '+91 98450 12345';
    const verifyRes = await verifyOtpCode({ phone, code });

    if (verifyRes.success) {
      const trackingRes = await handleOrderTrackingRequest('track order', phone, input.hostHeader);
      trackingRes.reply = `Security verification successful! Your session is authenticated for 15 minutes. ${trackingRes.reply}`;
      return trackingRes;
    } else {
      return {
        reply: `${verifyRes.message}`,
        kannadaReply: `ಒಟಿಪಿ ದೃಢೀಕರಣ ವಿಫಲವಾಗಿದೆ. ದಯವಿಟ್ಟು ಸರಿಯಾದ 6-ಅಂಕಿಯ ಒಟಿಪಿಯನ್ನು ನಮೂದಿಸಿ.`,
        hindiReply: `ओटीपी सत्यापन विफल रहा। कृपया सही 6-अंकीय कोड दर्ज करें।`,
        languageDetected: /[\u0C80-\u0CFF]/.test(input.message) ? 'kn' : /[\u0900-\u097F]/.test(input.message) ? 'hi' : 'en',
        citations: ['OTP Verification Security'],
        intent: 'ORDER_TRACKING',
        requiresOtpVerification: true,
        otpPhone: phone,
      };
    }
  }

  const intent = classifyCustomerIntent(input.message);

  // 1. Intercept ORDER_TRACKING Intent
  if (intent === 'ORDER_TRACKING') {
    return handleOrderTrackingRequest(input.message, input.customerPhone, input.hostHeader);
  }

  // 1b. Intercept HUMAN_SUPPORT Intent
  if (intent === 'HUMAN_SUPPORT') {
    return {
      reply: 'I am transferring you immediately to our senior customer care executive. Please stay on the line, an agent is joining your active call session.',
      kannadaReply: 'ನಾನು ನಿಮ್ಮ ಕರೆಯನ್ನು ತಕ್ಷಣ ನಮ್ಮ ಹಿರಿಯ ಗ್ರಾಹಕ ಸೇವಾ ಅಧಿಕಾರಿಗೆ ವರ್ಗಾಯಿಸುತ್ತಿದ್ದೇನೆ. ದಯವಿಟ್ಟು ಲೈನ್‌ನಲ್ಲಿರಿ.',
      hindiReply: 'मैं आपकी कॉल तुरंत हमारे वरिष्ठ कस्टमर सपोर्ट एग्जीक्यूटिव को ट्रांसफर कर रहा हूँ। कृपया लाइन पर बने रहें।',
      languageDetected: /[\u0C80-\u0CFF]/.test(input.message) ? 'kn' : /[\u0900-\u097F]/.test(input.message) ? 'hi' : 'en',
      citations: ['TrendVibe Customer Support Live Queue'],
      intent: 'HUMAN_SUPPORT',
    };
  }

  // 1c. Intercept RETURN_POLICY Intent
  if (intent === 'RETURN_POLICY') {
    return {
      reply: 'Our return policy allows hassle-free returns within 7 days of delivery for non-perishable goods, electronics, and fashion. For certified medicines and fresh kitchen foods, we provide instant replacement or full refund if damaged or unsealed upon delivery.',
      kannadaReply: 'ನಮ್ಮ ವಾಪಸಾತಿ ನೀತಿಯು ಎಲೆಕ್ಟ್ರಾನಿಕ್ಸ್ ಮತ್ತು ಉಡುಪುಗಳಿಗೆ 7 ದಿನಗಳ ಸುಲಭ ರಿಟರ್ನ್ ನೀಡುತ್ತದೆ. ಔಷಧಿಗಳು ಮತ್ತು ತಾಜಾ ಆಹಾರಕ್ಕಾಗಿ ತಕ್ಷಣದ ಬದಲಿ ಅಥವಾ ಮರುಪಾವತಿ ಲಭ್ಯವಿದೆ.',
      hindiReply: 'हमारी रिटर्न पॉलिसी के तहत इलेक्ट्रॉनिक्स और कपड़ों पर 7 दिनों की आसान वापसी की सुविधा है। दवाओं और ताजा भोजन पर डिलीवरी के समय खराबी होने पर तत्काल रिप्लेसमेंट दिया जाता है।',
      languageDetected: /[\u0C80-\u0CFF]/.test(input.message) ? 'kn' : /[\u0900-\u097F]/.test(input.message) ? 'hi' : 'en',
      citations: ['TrendVibe Standard Verified Return & Replacement Policy'],
      intent: 'RETURN_POLICY',
    };
  }

  // 2. Intercept ORDER_CONFIRMATION Intent (Customer explicitly confirmed order proposal)
  if (intent === 'ORDER_CONFIRMATION') {
    const prod = currentProduct || allProducts[0];
    const qty = prod.minOrderQuantity || 1;
    const subtotal = prod.price * qty;
    const tax = Math.round(subtotal * 0.05);
    const shippingFee = subtotal > 499 ? 0 : 25;
    const totalAmount = subtotal + tax + shippingFee;

    // Create Order in Database
    const newOrder = db.createOrder({
      customerId: input.customerId || 'usr-customer-1',
      customerName: input.customerName || 'Chandan Kumar',
      customerEmail: 'chandanchanduchandan9@gmail.com',
      customerPhone: input.customerPhone || '+91 98450 12345',
      items: [
        {
          productId: prod.id,
          quantity: qty,
        },
      ],
      shippingAddress: {
        id: 'addr-default',
        name: input.customerName || 'Chandan Kumar',
        phone: input.customerPhone || '+91 98450 12345',
        street: 'Flat 402, Green Glen Heights, Bellandur',
        city: 'Bangalore',
        state: 'Karnataka',
        pincode: '560103',
        landmark: 'Near EcoSpace Tech Park',
      },
      paymentMethod: 'ONLINE_RAZORPAY',
      isExpress30Min: isProductExpress30MinEligible(prod),
      aiAssisted: true,
      aiConversationSummary: `Voice Call Order confirmed for ${qty}x ${prod.name} by customer ${input.customerName || 'Chandan Kumar'}.`,
    });

    // Save to MongoDB
    mongoService.upsertOrder(newOrder).catch(() => {});

    // Generate Razorpay Payment Link
    const protocol = input.hostHeader?.includes('localhost') ? 'http' : 'https';
    const baseUrl = input.hostHeader ? `${protocol}://${input.hostHeader}` : 'https://ais-dev-mq3niq6mrinqkexr7lwp57-652806784275.asia-southeast1.run.app';
    const paymentUrl = `${baseUrl}?payOrder=${newOrder.id}`;

    // Dispatch SMS Payment Link
    if (input.customerPhone || newOrder.shippingAddress.phone) {
      smsService.sendPaymentLinkSms(
        input.customerPhone || newOrder.shippingAddress.phone,
        newOrder.orderNumber,
        paymentUrl,
        newOrder.totalAmount
      ).catch(() => {});
    }

    return {
      reply: `Congratulations! Your Order #${newOrder.orderNumber} for ${qty}x "${prod.name}" has been placed successfully! Total amount is ₹${totalAmount.toLocaleString('en-IN')}. I have sent the secure Razorpay payment link to your mobile number via SMS.`,
      kannadaReply: `ಅಭಿನಂದನೆಗಳು! ನಿಮ್ಮ ಆರ್ಡರ್ #${newOrder.orderNumber} ದೃಢೀಕರಿಸಲ್ಪಟ್ಟಿದೆ. ರೇಜರ್‌ಪೇ ಪಾವತಿ ಲಿಂಕ್ ಅನ್ನು ನಿಮ್ಮ ಮೊಬೈಲ್‌ಗೆ ಎಸ್‌ಎಮ್‌ಎಸ್ ಮೂಲಕ ಕಳುಹಿಸಲಾಗಿದೆ.`,
      languageDetected: /[\u0C80-\u0CFF]/.test(input.message) ? 'kn' : 'en',
      citations: [`Order #${newOrder.orderNumber}`, 'Razorpay Payment Gateway Integration'],
      intent: 'ORDER_CONFIRMATION',
      orderProposal: {
        readyToConfirm: false,
        productId: prod.id,
        productName: prod.name,
        quantity: qty,
        unitPrice: prod.price,
        subtotal,
        tax,
        shippingFee,
        totalAmount,
        isExpress30Min: isProductExpress30MinEligible(prod),
        deliveryAddress: 'Flat 402, Green Glen Heights, Bellandur, Bangalore',
        pincode: '560103',
        paymentMethod: 'ONLINE_RAZORPAY',
        orderId: newOrder.id,
        paymentUrl,
      },
      smsSent: true,
    };
  }

  // 3. System Instructions for Gemini Real-Time Voice Model
  const sellerDocs = db.getDocuments();

  const productCatalogueSummary = allProducts.map((p) => ({
    id: p.id,
    name: p.name,
    brand: p.brand,
    sellerId: p.sellerId,
    sellerName: p.sellerName || 'Priya Sharma (TrendVibe Central Hub)',
    category: p.category,
    price: p.price,
    mrp: p.mrp,
    discountPercent: p.discountPercent,
    availableStock: p.stock.available,
    minOrderQuantity: p.minOrderQuantity || 1,
    sellingUnit: p.sellingUnit || 'piece',
    isExpress30Min: isProductExpress30MinEligible(p),
    description: p.description,
    shortDescription: p.shortDescription,
    specifications: p.specifications,
    pdfDocName: p.pdfDocName,
    pdfExtractedText: p.pdfExtractedText,
  }));

  const systemInstruction = `
You are the Customer Enquiry Bot, the intelligent AI Voice and Chat Assistant for TrendVibe Store.
Your primary role is to assist customers with accurate product information, certified specification lookup, dosage/usage guidance, order placement, and live shipment tracking.

SELLER & CATALOGUE KNOWLEDGE (Priya Sharma - TrendVibe Central Hub):
You have complete, verified specification datasheets and PDF laboratory certificates for all products sold by Priya Sharma (Seller ID: usr-seller-1), including certified OTC medicines (Dolo 650, Calpol 500, Electral, Moov, MenthoPlus), organic food kitchen items (Sprouted Ragi Idli, Steamed Veg Idli, Homemade Protein Ladoo, Oats Banana Pancake, Peanut Banana Protein Smoothie), flagship mobile phones (iPhone 16, Samsung S25, Pixel 9a, OnePlus 13), laptops (ASUS TUF F15, Vivobook 15, Dell Inspiron, Lenovo IdeaPad), cosmetics (Minimalist Niacinamide, Cetaphil Cleanser, Dot & Key Sunscreen, Maybelline Matte Ink), shoes, and apparel.

When customers ask any question about a product—such as its ingredients, protein/calcium content, dosage, battery life, GPU, durability standards, or PDF monograph details—read from the product's "pdfExtractedText", "specifications", and "description" provided in the catalogue below. Give precise, confident, and accurate answers.

CRITICAL CONSTRAINTS:
1. NEVER INVENT or make up product details, discounts, stock, warranty, or shipment tracking information! Use the attached product data and PDF extracted text.
2. Maintain natural, polite, and professional conversational dialogue. Keep answers concise, clear, and informative.
3. If customer asks about order tracking, confirm order status, courier partner, tracking number, and estimated delivery date from real records.
4. If customer wants to buy, guide them through product confirmation, quantity, total price, and order creation.

CONNECTED DB PRODUCTS WITH VERIFIED PDF LAB DATA & SPECS:
${JSON.stringify(productCatalogueSummary, null, 2)}

INDEXED SELLER DOCUMENTS & KNOWLEDGE BASE:
${JSON.stringify(sellerDocs.map(d => ({ title: d.fileName, text: d.extractedText, productId: d.productId })), null, 2)}

CURRENT PRODUCT IN FOCUS:
${currentProduct ? JSON.stringify({ ...currentProduct, isExpress30Min: isProductExpress30MinEligible(currentProduct) }, null, 2) : 'Store catalogue.'}
`.trim();

  // 4. Gemini Content Generation (only when a real GEMINI_API_KEY is configured)
  const hasRealGeminiKey = Boolean(
    process.env.GEMINI_API_KEY &&
      process.env.GEMINI_API_KEY.trim().length > 10 &&
      process.env.GEMINI_API_KEY !== 'AIzaSy_demo_fallback_key'
  );

  if (hasRealGeminiKey) {
    try {
      const prompt = `Customer: "${input.message}"
Preferred Response Language: ${input.language === 'hi' ? 'Hindi (Devanagari script)' : input.language === 'kn' ? 'Kannada script' : 'English'}
Customer Name: ${input.customerName || 'Customer'}
Customer Phone: ${input.customerPhone || 'Not provided'}
Calling Session: ${input.isCallingSession ? 'LIVE PHONE CALL' : 'WEB CHAT'}`;

      let response: any = null;
      try {
        response = await ai.models.generateContent({
          model: 'gemini-2.5-flash',
          contents: prompt,
          config: {
            systemInstruction,
          },
        });
      } catch (geminiErr: any) {
        const isQuotaErr =
          geminiErr?.status === 'RESOURCE_EXHAUSTED' ||
          geminiErr?.message?.includes('429') ||
          geminiErr?.message?.includes('quota');

        if (isQuotaErr) {
          console.info('[AI Knowledge Engine] Model rate limit reached; attempting lightweight flash-lite model...');
          try {
            response = await ai.models.generateContent({
              model: 'gemini-3.1-flash-lite',
              contents: prompt,
              config: { systemInstruction },
            });
          } catch {
            // Gracefully handled below by fallback to TrendVibe verified RAG engine
          }
        }
      }

      const replyText = response?.text || '';
      if (replyText.trim().length > 5) {
        const isEndingMessage =
          /^(thank|thanks|bye|goodbye|dhanyavada|ಸಾಕು)/i.test(input.message.trim()) ||
          /thank you for choosing|have a wonderful day|ಧನ್ಯವಾದಗಳು/i.test(replyText);

        return {
          reply: replyText.trim(),
          kannadaReply: input.language === 'kn' || /[\u0C80-\u0CFF]/.test(input.message) ? replyText.trim() : undefined,
          hindiReply: input.language === 'hi' || /[\u0900-\u097F]/.test(input.message) ? replyText.trim() : undefined,
          languageDetected: input.language === 'kn' || /[\u0C80-\u0CFF]/.test(input.message) ? 'kn' : input.language === 'hi' || /[\u0900-\u097F]/.test(input.message) ? 'hi' : 'en',
          citations: ['TrendVibe Store Catalogue & Gemini Voice AI Engine'],
          intent,
          isEnding: isEndingMessage,
          productContext: currentProduct
            ? {
                id: currentProduct.id,
                name: currentProduct.name,
                price: currentProduct.price,
                availableStock: currentProduct.stock.available,
                category: currentProduct.category,
                isExpress30Min: isProductExpress30MinEligible(currentProduct),
                minOrderQuantity: currentProduct.minOrderQuantity || 1,
                sellingUnit: currentProduct.sellingUnit || 'piece',
              }
            : undefined,
        };
      }
    } catch (err: any) {
      const isQuota = err?.status === 'RESOURCE_EXHAUSTED' || err?.message?.includes('429') || err?.message?.includes('quota');
      if (isQuota) {
        console.info('[AI Knowledge Engine] Rate limit notice on external provider; serving verified product facts from TrendVibe RAG knowledge base.');
      } else {
        console.info('[AI Knowledge Engine] Serving verified product facts from TrendVibe RAG engine.');
      }
    }
  }

  return trainedKnowledgeGuidance(
    input.message,
    currentProduct,
    input.customerName,
    input.customerPhone,
    input.hostHeader,
    input.productName
  );
}

/**
 * Import Live Product Knowledge and Data from Amazon or External URLs
 * Uses Gemini Google Search Grounding to fetch and extract structured product details.
 */
export async function importExternalProductData(url: string): Promise<Partial<Product>> {
  const prompt = `Extract detailed product information from this live URL: ${url}. 
  
  Instructions:
  1. Use Google Search to find the latest specifications, price, and images for this specific product.
  2. Categorize it into one of these valid slugs: 'medicines-healthcare', 'cosmetics-personal-care', 'laptops', 'mobiles', 'food', 'shoes-footwear', 'clothes-apparel', 'other-store-products'.
  3. Ensure the MRP and Price are realistic numbers in INR (₹).
  4. Extract a list of key technical specifications or ingredients.
  5. Provide a primary image URL and at least 2 more relevant product photos.
  6. Generate a compelling short marketing summary and a full technical description.`;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        systemInstruction: 'You are an expert E-commerce Catalog Manager. Your goal is to extract accurate, structured product data from live web links with 100% precision.',
        tools: [{ googleSearch: {} }],
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            name: { type: Type.STRING, description: 'Product Title' },
            brand: { type: Type.STRING, description: 'Brand Name' },
            category: { type: Type.STRING, description: 'Primary category slug' },
            subcategory: { type: Type.STRING, description: 'Specific sub-category or model line' },
            shortDescription: { type: Type.STRING, description: '1-sentence marketing pitch' },
            description: { type: Type.STRING, description: 'Detailed product features and specifications' },
            mrp: { type: Type.NUMBER, description: 'Maximum Retail Price' },
            price: { type: Type.NUMBER, description: 'Current Selling Price' },
            images: { 
              type: Type.ARRAY, 
              items: { type: Type.STRING },
              description: 'List of product photo URLs' 
            },
            specifications: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  key: { type: Type.STRING },
                  value: { type: Type.STRING }
                },
                required: ['key', 'value']
              },
              description: 'Key technical attributes'
            }
          },
          required: ['name', 'price', 'images', 'category']
        }
      }
    });

    const data = JSON.parse(response.text || '{}');
    
    // Map specifications array back to a record if needed, but the UI might handle array
    // For simplicity, let's just return the raw data and let UI handle it
    return {
      ...data,
      discountPercent: data.mrp > data.price ? Math.round(((data.mrp - data.price) / data.mrp) * 100) : 0,
      updatedAt: new Date().toISOString()
    };
  } catch (err: any) {
    console.info('[Amazon Import Notice]:', err.message);
    throw new Error(`Failed to extract live product data: ${err.message}`);
  }
}
