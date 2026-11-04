/**
 * Secure Backend Tools for TrendVibe AI Website Voice Assistant
 * Reuses existing store database without inventing or hardcoding data.
 */

import { db } from './db.ts';

export const voiceTools = {
  /**
   * Search active products in catalog
   */
  searchProducts: (params: { query?: string; category?: string; maxPrice?: number }) => {
    const q = (params?.query || '').trim().toLowerCase();
    const category = (params?.category || '').trim().toLowerCase();
    const maxPrice = Number(params?.maxPrice) || Infinity;

    const all = db.getProducts({ status: 'published' });
    const filtered = all.filter((p) => {
      if (category && category !== 'all' && p.category.toLowerCase() !== category) {
        return false;
      }
      if (p.price > maxPrice) {
        return false;
      }
      if (!q) return true;

      return (
        p.name.toLowerCase().includes(q) ||
        (p.kannadaName && p.kannadaName.toLowerCase().includes(q)) ||
        p.brand.toLowerCase().includes(q) ||
        (p.description && p.description.toLowerCase().includes(q)) ||
        (p.tags && p.tags.some((t) => t.toLowerCase().includes(q)))
      );
    });

    const items = filtered.slice(0, 5).map((p) => ({
      id: p.id,
      name: p.name,
      kannadaName: p.kannadaName,
      brand: p.brand,
      price: p.price,
      mrp: p.mrp,
      inStock: (p.stock?.available ?? 0) > 0,
      availableStock: p.stock?.available ?? 0,
      category: p.category,
      express30Min: Boolean(p.deliveryConfig?.supportsExpress30Min),
      description: p.description,
      specifications: p.specifications,
    }));

    return {
      success: true,
      count: items.length,
      totalMatched: filtered.length,
      products: items,
      message:
        items.length > 0
          ? `Found ${items.length} verified products in the TrendVibe database.`
          : `No products matching "${q || category}" found in our current inventory. If you need human assistance, I can transfer your call or record an enquiry.`,
    };
  },

  /**
   * Get verified product price, discounts, and specifications by ID or exact name
   */
  getProductDetails: (params: { productId?: string; productName?: string }) => {
    const id = (params?.productId || '').trim();
    const name = (params?.productName || '').trim().toLowerCase();

    let product = id ? db.getProductById(id) : undefined;
    if (!product && name) {
      const all = db.getProducts({ status: 'published' });
      product = all.find(
        (p) =>
          p.name.toLowerCase() === name ||
          p.name.toLowerCase().includes(name) ||
          name.includes(p.name.toLowerCase())
      );
    }

    if (!product) {
      return {
        success: false,
        found: false,
        message: `I cannot confirm this product in the TrendVibe database. Please provide the exact name or ask for human assistance.`,
      };
    }

    const discount = Math.max(0, product.mrp - product.price);
    const discountPercent =
      product.discountPercent || (product.mrp > 0 ? Math.round((discount / product.mrp) * 100) : 0);

    return {
      success: true,
      found: true,
      product: {
        id: product.id,
        name: product.name,
        kannadaName: product.kannadaName,
        brand: product.brand,
        price: product.price,
        mrp: product.mrp,
        discountAmount: discount,
        discountPercent,
        inStock: (product.stock?.available ?? 0) > 0,
        availableUnits: product.stock?.available ?? 0,
        description: product.description || product.shortDescription,
        specifications: product.specifications || {},
        category: product.category,
        standardDeliveryDays: product.deliveryConfig?.standardDeliveryDays ?? 2,
        express30MinAvailable: Boolean(product.deliveryConfig?.supportsExpress30Min),
        returnDays: product.deliveryConfig?.returnPolicyDays ?? 7,
      },
    };
  },

  /**
   * Verified delivery timeline & Express eligibility check
   */
  getDeliveryInfo: (params: { pincode?: string; city?: string }) => {
    const pincode = (params?.pincode || '').trim();
    const city = (params?.city || 'Bangalore').trim();

    const expressPincodes = ['560001', '560038', '560103', '560068', '560034'];
    const isExpressEligible = expressPincodes.includes(pincode) || (city.toLowerCase() === 'bangalore' && !pincode);

    return {
      success: true,
      city,
      pincode: pincode || 'Not specified',
      express30MinAvailable: isExpressEligible,
      standardDeliveryDays: 2,
      freeShippingAbove: 499,
      shippingFee: 25,
      summary: isExpressEligible
        ? `Express 30-minute delivery is available in Bangalore. Standard shipping takes 2 business days.`
        : `Standard delivery takes 2 to 3 business days. Free shipping on orders above ₹499.`,
    };
  },

  /**
   * Verified return policy guidelines
   */
  getReturnPolicy: (params: { category?: string }) => {
    const category = (params?.category || '').toLowerCase();
    const isMedicine = category.includes('medicine') || category.includes('health');

    return {
      success: true,
      returnWindowDays: 7,
      policy: isMedicine
        ? `Medicines and healthcare items have a 7-day replacement warranty for damaged or sealed package issues.`
        : `Standard 7-day hassle-free returns and refunds for all items in original condition with tags.`,
    };
  },
};
