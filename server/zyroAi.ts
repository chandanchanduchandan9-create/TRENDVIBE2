import { GoogleGenAI } from '@google/genai';
import { db } from './db.ts';
import { Product } from '../src/types/index.ts';
import { isProductExpress30MinEligible } from './delivery.ts';

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    },
  },
});

export type ZyroIntent =
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
  | 'OTHER';

export interface ZyroChatInput {
  message: string;
  history?: { role: 'user' | 'model'; parts: { text: string }[] }[];
  productId?: string;
  category?: string;
  language?: 'en' | 'kn' | 'auto';
  customerId?: string;
  customerName?: string;
  customerPhone?: string;
  isCallingSession?: boolean;
}

export interface ZyroChatResponse {
  reply: string;
  kannadaReply?: string;
  languageDetected: 'en' | 'kn';
  citations: string[];
  intent?: ZyroIntent;
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
}

/**
 * Sanitize PDF or extracted document text so that raw binary, control codes,
 * or corrupted unreadable characters never reach the customer.
 */
export function sanitizeExtractedDocText(raw?: string): string {
  if (!raw) return '';
  // Remove non-printable control characters (except common whitespace)
  const clean = raw.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F-\x9F]/g, ' ').trim();
  // If text looks like corrupted garbage (excessive replacement characters or low ascii ratio)
  if (clean.length > 20) {
    const printableCount = (clean.match(/[\w\s.,!?:;'"()\/-]/g) || []).length;
    if (printableCount / clean.length < 0.6) {
      return ''; // Consider corrupted/unreadable
    }
  }
  return clean;
}

/**
 * Intent Classifier: strictly classifies customer input into one primary intent.
 */
export function classifyCustomerIntent(message: string, hasPendingOrderProposal = false): ZyroIntent {
  const q = message.toLowerCase().trim();

  // 1. Order Confirmation (only when explicitly confirming a presented proposal)
  if (
    hasPendingOrderProposal &&
    (/^(yes|confirm|place it|proceed|ok|sure|go ahead|yes please|ಹೌದು|ಖಚಿತಪಡಿಸಿ)$/i.test(q) ||
      q.includes('confirm order') ||
      q.includes('place the order') ||
      q.includes('confirm it'))
  ) {
    return 'ORDER_CONFIRMATION';
  }

  // 2. Add to Cart (explicit customer instruction to add item to cart)
  if (
    /^(add to cart|add this to cart|add it to my cart|add to bag|put in cart|put this in cart|add item|ಕಾರ್ಟ್‌ಗೆ ಸೇರಿಸಿ|ಕಾರ್ಟ್)/i.test(
      q
    ) ||
    ((q.includes('add') || q.includes('put')) && (q.includes('cart') || q.includes('bag') || q.includes('basket')))
  ) {
    return 'ADD_TO_CART';
  }

  // 3. Minimum Order Quantity (check BEFORE general order keywords!)
  if (
    q.includes('minimum order') ||
    q.includes('min order') ||
    q.includes('minimum quantity') ||
    q.includes('moq') ||
    q.includes('min qty') ||
    q.includes('least quantity') ||
    q.includes('ಕನಿಷ್ಠ ಆರ್ಡರ್') ||
    q.includes('ಕನಿಷ್ಠ ಪ್ರಮಾಣ')
  ) {
    return 'MINIMUM_ORDER';
  }

  // 4. Place Order / Buy instruction
  if (
    q.includes('place order') ||
    q.includes('i want to order') ||
    q.includes('order this') ||
    q.includes('buy this now') ||
    q.includes('book this now') ||
    q.includes('order now') ||
    q.includes('ಖರೀದಿಸಿ') ||
    q.includes('ಆರ್ಡರ್ ಮಾಡಿ')
  ) {
    return 'PLACE_ORDER';
  }

  // 5. Stock / Inventory inquiry
  if (
    q.includes('how many units') ||
    q.includes('how much stock') ||
    q.includes('available units') ||
    q.includes('in stock') ||
    q.includes('out of stock') ||
    q.includes('stock available') ||
    q.includes('available count') ||
    q.includes('units left') ||
    q.includes('ಸ್ಟಾಕ್') ||
    q.includes('ಎಷ್ಟು ಲಭ್ಯವಿದೆ')
  ) {
    return 'STOCK';
  }

  // 6. Price inquiry
  if (
    q.includes('price') ||
    q.includes('how much is') ||
    q.includes('how much does it cost') ||
    q.includes('cost of') ||
    q.includes('mrp') ||
    q.includes('rate') ||
    q.includes('discount') ||
    q.includes('ಬೆಲೆ') ||
    q.includes('ದರ')
  ) {
    return 'PRICE';
  }

  // 7. Specifications / Technical / Dosage / Ingredients inquiry
  if (
    q.includes('specification') ||
    q.includes('specs') ||
    q.includes('technical details') ||
    q.includes('features') ||
    q.includes('ingredients') ||
    q.includes('dosage') ||
    q.includes('composition') ||
    q.includes('dimensions') ||
    q.includes('material') ||
    q.includes('battery') ||
    q.includes('processor') ||
    q.includes('ram') ||
    q.includes('gpu') ||
    q.includes('ವಿವರಣೆ') ||
    q.includes('ಗುಣಲಕ್ಷಣ')
  ) {
    return 'SPECIFICATIONS';
  }

  // 8. Customization inquiry
  if (
    q.includes('customize') ||
    q.includes('customise') ||
    q.includes('customization') ||
    q.includes('custom printing') ||
    q.includes('personalize') ||
    q.includes('engraving') ||
    q.includes('ಕಸ್ಟಮೈಸ್')
  ) {
    return 'CUSTOMIZATION';
  }

  // 9. Delivery / Shipping / Express inquiry
  if (
    q.includes('delivery') ||
    q.includes('deliver') ||
    q.includes('when will it arrive') ||
    q.includes('shipping') ||
    q.includes('courier') ||
    q.includes('pincode') ||
    q.includes('pin code') ||
    q.includes('30 min') ||
    q.includes('express') ||
    q.includes('ಡೆಲಿವರಿ')
  ) {
    return 'DELIVERY';
  }

  // 10. Return Policy inquiry
  if (
    q.includes('return') ||
    q.includes('refund') ||
    q.includes('exchange') ||
    q.includes('replacement') ||
    q.includes('warranty') ||
    q.includes('ವಾಪಸ್')
  ) {
    return 'RETURN_POLICY';
  }

  // 11. Product Overview / Introduction
  if (
    q.includes('tell me about') ||
    q.includes('what is this') ||
    q.includes('overview') ||
    q.includes('explain') ||
    q.includes('describe') ||
    q.includes('ಉತ್ಪನ್ನದ ಬಗ್ಗೆ')
  ) {
    return 'PRODUCT_OVERVIEW';
  }

  return 'OTHER';
}

/**
 * Trained Knowledge Engine:
 * Implements strict 1–3 short sentence answers, domain knowledge, and order safety.
 */
function trainedKnowledgeGuidance(
  message: string,
  currentProduct?: Product,
  customerName?: string
): ZyroChatResponse {
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
      if (q.includes('vivobook') && pName.includes('vivobook')) return true;
      if (q.includes('inspiron') && pName.includes('inspiron')) return true;
      if (q.includes('lenovo') && pName.includes('lenovo')) return true;
      if (q.includes('niacinamide') && pName.includes('niacinamide')) return true;
      if (q.includes('cetaphil') && pName.includes('cetaphil')) return true;
      if (q.includes('sunscreen') && pName.includes('sunscreen')) return true;
      if (q.includes('lipstick') && pName.includes('lipstick')) return true;
      if (q.includes('nike') && pName.includes('nike')) return true;
      if (q.includes('adidas') && pName.includes('adidas')) return true;

      return false;
    });
  }

  // Conversation ending / thank you check
  const isEndingIntent =
    /^(thank you|thanks|bye|goodbye|that's all|that's it|done|no more|dhanyavada|ಧನ್ಯವಾದ|ಸಾಕು)/i.test(q) ||
    q.includes('thank you') ||
    q.includes('thanks') ||
    q.includes('goodbye');

  if (isEndingIntent) {
    return {
      reply: `You're most welcome! Thank you for choosing TrendVibe Store. Have a wonderful day ahead!`,
      kannadaReply: `ನಿಮಗೆ ಸ್ವಾಗತ! ಟ್ರೆಂಡ್‌ವೈಬ್ ಸ್ಟೋರ್ ಅನ್ನು ಸಂಪರ್ಕಿಸಿದ್ದಕ್ಕಾಗಿ ತುಂಬಾ ಧನ್ಯವಾದಗಳು. ನಿಮ್ಮ ದಿನ ಶುಭವಾಗಿರಲಿ!`,
      languageDetected: /[\u0C80-\u0CFF]/.test(message) ? 'kn' : 'en',
      citations: ['TrendVibe Store Support'],
      intent: 'OTHER',
      isEnding: true,
    };
  }

  const intent = classifyCustomerIntent(message);

  // If a product is in context, handle specific factual intents immediately (1-3 sentences rule)
  if (targetProduct) {
    citations.push(`TrendVibe Store: ${targetProduct.name} (SKU: ${targetProduct.sku})`);
    if (targetProduct.pdfDocName) {
      citations.push(`${targetProduct.pdfDocName} (Verified Documentation)`);
    }

    const sellingUnit = targetProduct.sellingUnit || 'piece';
    const minOrderQty = targetProduct.minOrderQuantity || 1;
    const isExpress = isProductExpress30MinEligible(targetProduct);

    // INTENT: MINIMUM_ORDER (Crucial: do NOT create order/cart)
    if (intent === 'MINIMUM_ORDER') {
      return {
        reply: `The minimum order quantity for ${targetProduct.name} is ${minOrderQty} ${sellingUnit}. You can purchase this exact quantity or more as per your requirement.`,
        kannadaReply: `${targetProduct.name} ಗೆ ಕನಿಷ್ಠ ಆರ್ಡರ್ ಪ್ರಮಾಣ ${minOrderQty} ${sellingUnit} ಆಗಿದೆ.`,
        languageDetected: /[\u0C80-\u0CFF]/.test(message) ? 'kn' : 'en',
        citations,
        intent: 'MINIMUM_ORDER',
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

    // INTENT: PRICE
    if (intent === 'PRICE') {
      const discountText = targetProduct.discountPercent > 0 ? ` (${targetProduct.discountPercent}% off MRP ₹${targetProduct.mrp})` : '';
      return {
        reply: `The price for ${targetProduct.name} is ₹${targetProduct.price.toLocaleString('en-IN')} per ${sellingUnit}${discountText}. All prices include applicable taxes.`,
        kannadaReply: `${targetProduct.name} ನ ಬೆಲೆ ಪ್ರತಿ ${sellingUnit}ಗೆ ₹${targetProduct.price} ಆಗಿದೆ.`,
        languageDetected: /[\u0C80-\u0CFF]/.test(message) ? 'kn' : 'en',
        citations,
        intent: 'PRICE',
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

    // INTENT: STOCK
    if (intent === 'STOCK') {
      const avail = targetProduct.stock.available;
      const stockMsg =
        avail > 0
          ? `We currently have ${avail} ${sellingUnit}s available in stock.`
          : `Currently, ${targetProduct.name} is out of stock.`;
      return {
        reply: stockMsg,
        kannadaReply: avail > 0 ? `ಪ್ರಸ್ತುತ ${avail} ${sellingUnit}ಗಳು ಸ್ಟಾಕ್‌ನಲ್ಲಿ ಲಭ್ಯವಿದೆ.` : `ಸದ್ಯಕ್ಕೆ ಇದು ಸ್ಟಾಕ್‌ನಲ್ಲಿಲ್ಲ.`,
        languageDetected: /[\u0C80-\u0CFF]/.test(message) ? 'kn' : 'en',
        citations,
        intent: 'STOCK',
        productContext: {
          id: targetProduct.id,
          name: targetProduct.name,
          price: targetProduct.price,
          availableStock: avail,
          category: targetProduct.category,
          isExpress30Min: isExpress,
        },
      };
    }

    // INTENT: DELIVERY
    if (intent === 'DELIVERY') {
      let deliveryMsg = '';
      if (isExpress) {
        deliveryMsg = `${targetProduct.name} is eligible for ⚡ 30-Minute Hyper-Local Express Delivery in Bangalore serviceable pin codes. Standard delivery takes 2 to 4 business days.`;
      } else {
        const fee = targetProduct.deliveryConfig.shippingFee > 0 ? ` Flat ₹${targetProduct.deliveryConfig.shippingFee} shipping fee applies.` : ' Free delivery applies.';
        deliveryMsg = `Standard delivery takes 2 to 4 business days across India.${fee} 30-minute express delivery is not available for this item.`;
      }
      return {
        reply: deliveryMsg,
        kannadaReply: isExpress ? `ಇದು ಬೆಂಗಳೂರಿನಲ್ಲಿ 30 ನಿಮಿಷಗಳ ಎಕ್ಸ್‌ಪ್ರೆಸ್ ಡೆಲಿವರಿಗೆ ಲಭ್ಯವಿದೆ.` : `ಇದು 2 ರಿಂದ 4 ದಿನಗಳಲ್ಲಿ ತಲುಪಲಿದೆ.`,
        languageDetected: /[\u0C80-\u0CFF]/.test(message) ? 'kn' : 'en',
        citations,
        intent: 'DELIVERY',
        productContext: {
          id: targetProduct.id,
          name: targetProduct.name,
          price: targetProduct.price,
          availableStock: targetProduct.stock.available,
          category: targetProduct.category,
          isExpress30Min: isExpress,
        },
      };
    }

    // INTENT: RETURN_POLICY
    if (intent === 'RETURN_POLICY') {
      const returnDays = targetProduct.deliveryConfig.returnPolicyDays || 0;
      const returnMsg =
        returnDays > 0
          ? `${targetProduct.name} comes with a ${returnDays}-day easy replacement and return policy from delivery date.`
          : `${targetProduct.name} is a sealed personal care or consumable item and is non-returnable once opened.`;
      return {
        reply: returnMsg,
        kannadaReply: returnDays > 0 ? `ಇದಕ್ಕೆ ${returnDays} ದಿನಗಳ ರಿಟರ್ನ್ ಪಾಲಿಸಿ ಇದೆ.` : `ಇದಕ್ಕೆ ರಿಟರ್ನ್ ಲಭ್ಯವಿಲ್ಲ.`,
        languageDetected: /[\u0C80-\u0CFF]/.test(message) ? 'kn' : 'en',
        citations,
        intent: 'RETURN_POLICY',
      };
    }

    // INTENT: CUSTOMIZATION
    if (intent === 'CUSTOMIZATION') {
      const customOpts = targetProduct.customizationOptions;
      if (customOpts && (typeof customOpts === 'string' ? customOpts.length > 0 : Object.keys(customOpts).length > 0)) {
        return {
          reply: `Yes, customization is supported for ${targetProduct.name}. Documented options include: ${typeof customOpts === 'string' ? customOpts : JSON.stringify(customOpts)}.`,
          kannadaReply: `ಹೌದು, ಕಸ್ಟಮೈಸೇಶನ್ ಲಭ್ಯವಿದೆ.`,
          languageDetected: /[\u0C80-\u0CFF]/.test(message) ? 'kn' : 'en',
          citations,
          intent: 'CUSTOMIZATION',
        };
      } else {
        return {
          reply: `Customization is not available for ${targetProduct.name}. It is supplied in verified standard manufacturer packaging.`,
          kannadaReply: `ಇದಕ್ಕೆ ಕಸ್ಟಮೈಸೇಶನ್ ಸೌಲಭ್ಯವಿಲ್ಲ.`,
          languageDetected: /[\u0C80-\u0CFF]/.test(message) ? 'kn' : 'en',
          citations,
          intent: 'CUSTOMIZATION',
        };
      }
    }

    // INTENT: SPECIFICATIONS (short bullet list of relevant verified fields)
    if (intent === 'SPECIFICATIONS') {
      const specs = Object.entries(targetProduct.specifications || {});
      const sanitizedDoc = sanitizeExtractedDocText(targetProduct.pdfExtractedText);
      let specBullets = '';
      if (specs.length > 0) {
        specBullets = specs
          .slice(0, 4)
          .map(([k, v]) => `• ${k}: ${v}`)
          .join('\n');
      } else if (sanitizedDoc) {
        specBullets = `• Verified Document: ${sanitizedDoc.slice(0, 150)}...`;
      } else {
        specBullets = 'Detailed technical specifications are not listed in the verified product information.';
      }

      return {
        reply: `Here are the verified specifications for ${targetProduct.name}:\n${specBullets}`,
        kannadaReply: `${targetProduct.name} ನ ಮುಖ್ಯ ವಿವರಣೆಗಳು:\n${specBullets}`,
        languageDetected: /[\u0C80-\u0CFF]/.test(message) ? 'kn' : 'en',
        citations,
        intent: 'SPECIFICATIONS',
        productContext: {
          id: targetProduct.id,
          name: targetProduct.name,
          price: targetProduct.price,
          availableStock: targetProduct.stock.available,
          category: targetProduct.category,
          isExpress30Min: isExpress,
        },
      };
    }

    // INTENT: PRODUCT_OVERVIEW
    if (intent === 'PRODUCT_OVERVIEW') {
      const desc = targetProduct.shortDescription || targetProduct.description;
      return {
        reply: `${targetProduct.name} by ${targetProduct.brand}: ${desc.slice(0, 160)}. Current price is ₹${targetProduct.price.toLocaleString('en-IN')}.`,
        kannadaReply: `${targetProduct.name}: ${desc.slice(0, 120)}. ಬೆಲೆ ₹${targetProduct.price}.`,
        languageDetected: /[\u0C80-\u0CFF]/.test(message) ? 'kn' : 'en',
        citations,
        intent: 'PRODUCT_OVERVIEW',
        productContext: {
          id: targetProduct.id,
          name: targetProduct.name,
          price: targetProduct.price,
          availableStock: targetProduct.stock.available,
          category: targetProduct.category,
          isExpress30Min: isExpress,
        },
      };
    }

    // INTENT: ADD_TO_CART (explicit instruction)
    if (intent === 'ADD_TO_CART') {
      const qtyMatch = message.match(/\b([1-9]|10)\b/);
      const qty = qtyMatch ? parseInt(qtyMatch[1], 10) : minOrderQty;

      return {
        reply: `I have added ${qty}x "${targetProduct.name}" to your cart at ₹${targetProduct.price.toLocaleString('en-IN')} each.`,
        kannadaReply: `ನಾನು ${qty}x "${targetProduct.name}" ಅನ್ನು ನಿಮ್ಮ ಕಾರ್ಟ್‌ಗೆ ಸೇರಿಸಿದ್ದೇನೆ.`,
        languageDetected: /[\u0C80-\u0CFF]/.test(message) ? 'kn' : 'en',
        citations,
        intent: 'ADD_TO_CART',
        cartAction: {
          type: 'ADD_TO_CART',
          productId: targetProduct.id,
          productName: targetProduct.name,
          quantity: qty,
          price: targetProduct.price,
          product: targetProduct,
        },
        productContext: {
          id: targetProduct.id,
          name: targetProduct.name,
          price: targetProduct.price,
          availableStock: targetProduct.stock.available,
          category: targetProduct.category,
          isExpress30Min: isExpress,
        },
      };
    }

    // INTENT: PLACE_ORDER (explicit instruction to buy/order)
    if (intent === 'PLACE_ORDER') {
      const qtyMatch = message.match(/\b([1-9]|10)\b/);
      const qty = qtyMatch ? parseInt(qtyMatch[1], 10) : minOrderQty;
      const subtotal = targetProduct.price * qty;
      const tax = Math.round(subtotal * 0.05);
      const shippingFee = subtotal > 499 ? 0 : 25;
      const totalAmount = subtotal + tax + shippingFee;

      const orderProposal = {
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
        paymentMethod: 'COD' as const,
      };

      const speedText = isExpress ? '30-minute express delivery' : 'standard 2-4 day delivery';
      return {
        reply: `I've prepared an order for ${qty}x "${targetProduct.name}" totaling ₹${totalAmount.toLocaleString('en-IN')} with ${speedText} to Bangalore 560103. Would you like me to confirm this order?`,
        kannadaReply: `${qty}x "${targetProduct.name}" ಗೆ ಒಟ್ಟು ₹${totalAmount} ಆಗಿದೆ. ನಾನು ಆರ್ಡರ್ ದೃಢೀಕರಿಸಲೇ?`,
        languageDetected: /[\u0C80-\u0CFF]/.test(message) ? 'kn' : 'en',
        citations,
        intent: 'PLACE_ORDER',
        orderProposal,
      };
    }
  }

  // Generic fallback across categories (1-3 sentences)
  return {
    reply: `Welcome to TrendVibe Store! I can help you with verified specifications, prices, minimum order quantities, and stock across medicines, food, electronics, and fashion. Which product can I help you with?`,
    kannadaReply: `ಟ್ರೆಂಡ್‌ವೈಬ್ ಸ್ಟೋರ್‌ಗೆ ಸ್ವಾಗತ! ನಮ್ಮಲ್ಲಿ ಔಷಧಿಗಳು, ಆಹಾರ ಮತ್ತು ಎಲೆಕ್ಟ್ರಾನಿಕ್ಸ್ ಲಭ್ಯವಿವೆ. ನೀವು ಯಾವ ಉತ್ಪನ್ನದ ಬಗ್ಗೆ ತಿಳಿಯಲು ಬಯಸುತ್ತೀರಿ?`,
    languageDetected: 'en',
    citations: ['TrendVibe Store Catalogue'],
    intent: 'OTHER',
  };
}

// =========================================================================
// MAIN CONVERSATION HANDLER (GEMINI + GOOGLE SEARCH + KNOWLEDGE ENGINE)
// =========================================================================
export async function processZyroConversation(input: ZyroChatInput): Promise<ZyroChatResponse> {
  const currentProduct = input.productId ? db.getProductById(input.productId) : undefined;
  const allProducts = db.getProducts({ status: 'published' });

  // 1. Retrieve Knowledge Base & Documents for RAG
  const relevantDocs = db.searchKnowledgeBase(input.message, input.productId);
  const docCitations: string[] = [];
  let docsContext = '';

  if (relevantDocs.length > 0) {
    docsContext = relevantDocs
      .slice(0, 3)
      .map((d) => {
        docCitations.push(`${d.source} (${d.title})`);
        const cleanContent = sanitizeExtractedDocText(d.content);
        return `[Source: ${d.source} - ${d.title}]\n${cleanContent}`;
      })
      .join('\n\n');
  }

  // 2. Prepare Storefront Context Summary
  const productCatalogueSummary = allProducts.map((p) => ({
    id: p.id,
    name: p.name,
    brand: p.brand,
    category: p.category,
    price: p.price,
    mrp: p.mrp,
    discountPercent: p.discountPercent,
    availableStock: p.stock.available,
    minOrderQuantity: p.minOrderQuantity || 1,
    sellingUnit: p.sellingUnit || 'piece',
    isExpress30Min: isProductExpress30MinEligible(p),
    serviceablePincodes: p.deliveryConfig.serviceablePincodes,
  }));

  // 3. Strict System Instruction matching Turn 10 rules
  const systemInstruction = `
You are Zyro AI, the shopping assistant for TrendVibe Store.
Your job is to understand the customer's intention, retrieve the correct product information from the connected database and uploaded PDF documents, and answer naturally in a SHORT, ACCURATE response.

UNDERSTAND CUSTOMER INTENT FIRST:
Classify each customer message into one primary intent:
- PRODUCT_OVERVIEW: Concise overview of purpose and verified attributes.
- SPECIFICATIONS: Short bullet list of verified specs.
- MINIMUM_ORDER: State verified minimum order quantity and its unit. DO NOT create a cart or order.
- STOCK: State latest verified inventory count and unit (pieces, packs, boxes).
- PRICE: State current store price and selling unit. Mention discount only if relevant.
- CUSTOMIZATION: State documented customization options. If none, say it is not available.
- DELIVERY: State delivery timeline. Only promise 30-minute express if product is verified express eligible.
- RETURN_POLICY: State return policy days.
- ADD_TO_CART: Explicit instruction to add to cart.
- PLACE_ORDER: Explicit instruction to buy/order.
- ORDER_CONFIRMATION: Customer confirms order.
- OTHER: Any other question.

SHORT ANSWER RULE:
- Answer the exact question first!
- Normally use 1–3 short sentences.
- For simple factual questions (price, stock, MOQ, return policy), use ONE sentence.
- For specifications, use a short bullet list of 3-4 relevant fields.
- Do NOT repeat the product introduction, price, discount, stock, or delivery info unless relevant to the question.
- Do NOT add unnecessary sales pitches or repeatedly ask whether the customer wants to place an order.
- If PDF extracted text is unreadable or missing, say clearly: "This detail is not available in the verified product information." Never show raw unreadable characters or code.
- Match customer's language (English or Kannada).

STORE DATABASE CONTEXT:
${JSON.stringify(productCatalogueSummary, null, 2)}

CURRENT PRODUCT IN FOCUS:
${currentProduct ? JSON.stringify({ ...currentProduct, isExpress30Min: isProductExpress30MinEligible(currentProduct) }, null, 2) : 'Browsing entire store catalogue.'}

VERIFIED KNOWLEDGE DOCUMENTS (RAG):
${docsContext || 'Standard manufacturer specifications apply.'}
`.trim();

  // Try Gemini generation
  try {
    const prompt = `Customer: "${input.message}"
Customer Name: ${input.customerName || 'Customer'}
Calling Mode: ${input.isCallingSession ? 'PHONE CALL VOICE DIALOGUE' : 'CHAT'}`;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        systemInstruction,
        temperature: 0.2,
      },
    });

    const replyText = response.text || '';
    if (replyText.trim().length > 5) {
      const intent = classifyCustomerIntent(input.message);

      // Handle Add to Cart action if intent is explicitly ADD_TO_CART
      let cartAction: any = undefined;
      if (intent === 'ADD_TO_CART' && (currentProduct || allProducts.length > 0)) {
        const prod = currentProduct || allProducts[0];
        const qtyMatch = input.message.match(/\b([1-9]|10)\b/);
        const qty = qtyMatch ? parseInt(qtyMatch[1], 10) : (prod.minOrderQuantity || 1);
        cartAction = {
          type: 'ADD_TO_CART' as const,
          productId: prod.id,
          productName: prod.name,
          quantity: qty,
          price: prod.price,
          product: prod,
        };
      }

      // Handle order proposal if intent is explicitly PLACE_ORDER
      let orderProposal: any = undefined;
      if (intent === 'PLACE_ORDER' && (currentProduct || allProducts.length > 0)) {
        const prod = currentProduct || allProducts[0];
        const qtyMatch = input.message.match(/\b([1-9]|10)\b/);
        const qty = qtyMatch ? parseInt(qtyMatch[1], 10) : (prod.minOrderQuantity || 1);
        const subtotal = prod.price * qty;
        const tax = Math.round(subtotal * 0.05);
        const shippingFee = subtotal > 499 ? 0 : 25;
        const totalAmount = subtotal + tax + shippingFee;

        orderProposal = {
          readyToConfirm: true,
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
          paymentMethod: 'COD' as const,
        };
      }

      const isEndingMessage =
        /^(thank|thanks|bye|goodbye|that's all|done|dhanyavada|ಧನ್ಯವಾದ|ಸಾಕು)/i.test(input.message.trim()) ||
        /thank you for choosing|have a wonderful day|ಧನ್ಯವಾದಗಳು/i.test(replyText);

      return {
        reply: replyText.trim(),
        kannadaReply: input.language === 'kn' || /[\u0C80-\u0CFF]/.test(input.message) ? replyText.trim() : undefined,
        languageDetected: /[\u0C80-\u0CFF]/.test(input.message) ? 'kn' : 'en',
        citations: docCitations,
        intent,
        orderProposal,
        cartAction,
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
    console.warn('Gemini API call skipped, utilizing trained knowledge engine:', err.message || err);
  }

  // Fallback to trained knowledge engine
  return trainedKnowledgeGuidance(input.message, currentProduct, input.customerName);
}
