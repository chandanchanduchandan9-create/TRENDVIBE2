import { GoogleGenAI } from '@google/genai';
import { db } from './db.ts';

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    },
  },
});

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
  productContext?: {
    id: string;
    name: string;
    price: number;
    availableStock: number;
    category: string;
    isExpress30Min: boolean;
  };
}

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
        return `[Source: ${d.source} - ${d.title}]\n${d.content}`;
      })
      .join('\n\n');
  }

  // 2. Prepare Storefront Context
  const productCatalogueSummary = allProducts.map((p) => ({
    id: p.id,
    name: p.name,
    kannadaName: p.kannadaName,
    category: p.category,
    price: p.price,
    mrp: p.mrp,
    discountPercent: p.discountPercent,
    availableStock: p.stock.available,
    isExpress30Min: p.deliveryConfig.supportsExpress30Min,
    serviceablePincodes: p.deliveryConfig.serviceablePincodes,
  }));

  // 3. System Instruction for Zyro AI
  const systemInstruction = `
You are Zyro AI, the bilingual intelligent shopping assistant and AI calling agent for "TrendVibe Store".
You are deeply knowledgeable, friendly, polite, and fluent in both English and Kannada (ಕನ್ನಡ).

STORE & INVENTORY CONTEXT:
${JSON.stringify(productCatalogueSummary, null, 2)}

CURRENT PRODUCT IN FOCUS (if any):
${currentProduct ? JSON.stringify(currentProduct, null, 2) : 'No single product selected; browsing storefront.'}

SELLER UPLOADED KNOWLEDGE DOCUMENTS & RAG CITATIONS:
${docsContext || 'No specific PDF technical document excerpts matched this query.'}

OPERATIONAL EVIDENCE RULES (CRITICAL):
1. Use verified store database for prices, discounts, stock, variants, delivery windows, and return policies.
2. For medicines (Dolo 650, Calpol 500, Electral, Moov, MenthoPlus) and foods (Ragi Idli, Veg Idli, Protein Ladoo, Pancakes, Smoothies), emphasize 30-minute hyper-local express delivery when in serviceable areas (e.g. Bangalore pincodes like 560001, 560038, 560103, 560068, 560034).
3. For tech items (Laptops, Mobiles), provide exact verified specs and state that delivery takes 1-2 business days with standard courier tracking.
4. If a fact cannot be verified, state honestly that the detail is unverified and offer seller support. NEVER hallucinate specs or promises.
5. If the user writes or speaks in Kannada (e.g., "ನಮಸ್ಕಾರ", "ಬೆಲೆ ಎಷ್ಟು", "ಆರ್ಡರ್ ಮಾಡಿ"), respond warmly in Kannada, or provide both English and Kannada when appropriate.
6. ORDER ASSISTANCE WORKFLOW:
   - If the user indicates an intent to buy or order (e.g., "I want to buy 2 Dolo 650", "Order 1 Ragi Idli to Bangalore 560103", "ದಯವಿಟ್ಟು ಆರ್ಡರ್ ಮಾಡಿ"), extract:
     - product ID & name
     - quantity (default to 1 if unspecified)
     - delivery address & pincode
     - payment method (COD or Online)
   - Read back the complete order summary clearly: item, quantity, price breakdown (subtotal + tax + shipping fee = total), delivery time, and address.
   - Ask for explicit user consent: "Would you like me to confirm and place this order now?"
   - When order intent is detected, format the structured order proposal in your response.

OUTPUT FORMAT:
Return a strictly valid JSON object matching this schema:
{
  "reply": "Your conversational response in English",
  "kannadaReply": "Your conversational response in Kannada (ಕನ್ನಡ) script (required if user spoke in Kannada or for phone call transcript)",
  "languageDetected": "en" | "kn",
  "citations": ["list of cited documents or verified official source URLs"],
  "orderProposal": null or {
    "readyToConfirm": boolean (true if user provided address and confirmed, false if still gathering details),
    "productId": string,
    "productName": string,
    "quantity": number,
    "unitPrice": number,
    "subtotal": number,
    "tax": number,
    "shippingFee": number,
    "totalAmount": number,
    "isExpress30Min": boolean,
    "deliveryAddress": string,
    "pincode": string,
    "paymentMethod": "COD" | "ONLINE_RAZORPAY"
  }
}
`.trim();

  try {
    const prompt = `Customer Message: "${input.message}"
Customer Name: ${input.customerName || 'Shopper'}
Language Preference: ${input.language || 'auto'}
Calling Mode: ${input.isCallingSession ? 'ACTIVE PHONE CALL' : 'CHAT'}`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: prompt,
      config: {
        systemInstruction,
        responseMimeType: 'application/json',
        temperature: 0.2,
      },
    });

    const text = response.text || '{}';
    const parsed = JSON.parse(text);

    return {
      reply: parsed.reply || "I'm Zyro AI, how can I assist your shopping today at TrendVibe Store?",
      kannadaReply: parsed.kannadaReply || parsed.reply,
      languageDetected: parsed.languageDetected === 'kn' ? 'kn' : 'en',
      citations: Array.isArray(parsed.citations) ? parsed.citations : docCitations,
      orderProposal: parsed.orderProposal || undefined,
      productContext: currentProduct
        ? {
            id: currentProduct.id,
            name: currentProduct.name,
            price: currentProduct.price,
            availableStock: currentProduct.stock.available,
            category: currentProduct.category,
            isExpress30Min: currentProduct.deliveryConfig.supportsExpress30Min,
          }
        : undefined,
    };
  } catch (err: any) {
    console.error('Error generating Zyro AI content:', err);

    // Fallback response with verified store info if API or network is unavailable
    const isKannada = /[\u0C80-\u0CFF]/.test(input.message) || input.language === 'kn';
    const fallbackReply = currentProduct
      ? `The ${currentProduct.name} is currently available for ₹${currentProduct.price} (MRP: ₹${currentProduct.mrp}, ${currentProduct.discountPercent}% OFF). In stock: ${currentProduct.stock.available} units. Delivery: ${currentProduct.deliveryConfig.supportsExpress30Min ? '30-Minute Express' : '1-2 Days Standard'}. Would you like to place an order?`
      : `Welcome to TrendVibe Store! We have over 29 verified products across 8 categories including Healthcare, Food, Mobiles, and Laptops. How can I help you?`;

    const fallbackKannada = currentProduct
      ? `ಟ್ರೆಂಡ್‌ವೈಬ್ ಸ್ಟೋರ್‌ಗೆ ಸ್ವಾಗತ! ${currentProduct.kannadaName || currentProduct.name} ಪ್ರಸ್ತುತ ₹${currentProduct.price} ಗೆ ಲಭ್ಯವಿದೆ. ದಾಸ್ತಾನು: ${currentProduct.stock.available} ಯೂನಿಟ್‌ಗಳು.`
      : `ಟ್ರೆಂಡ್‌ವೈಬ್ ಸ್ಟೋರ್‌ಗೆ ಸ್ವಾಗತ! ಜೈರೋ AI ನೊಂದಿಗೆ ನಿಮಗೆ ಹೇಗೆ ಸಹಾಯ ಮಾಡಬಹುದು?`;

    return {
      reply: fallbackReply,
      kannadaReply: fallbackKannada,
      languageDetected: isKannada ? 'kn' : 'en',
      citations: docCitations,
      productContext: currentProduct
        ? {
            id: currentProduct.id,
            name: currentProduct.name,
            price: currentProduct.price,
            availableStock: currentProduct.stock.available,
            category: currentProduct.category,
            isExpress30Min: currentProduct.deliveryConfig.supportsExpress30Min,
          }
        : undefined,
    };
  }
}
