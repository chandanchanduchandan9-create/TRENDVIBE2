import { Product } from '../types/index.ts';

/**
 * Authoritative 30-Minute Express Delivery Eligibility Checker
 *
 * A product is eligible for 30-minute express delivery ONLY when ALL of these conditions are true:
 * 1. Hyperlocal delivery is explicitly enabled by the seller (locationBasedSellingEnabled === true).
 * 2. Product is published and available for sale (stock.available > 0).
 * 3. The delivery speed tier supports 30-minute delivery (supportsExpress30Min === true and speed is 'quick_30min' or 'all').
 * 4. If a customer delivery PIN code is selected/provided, it must be serviceable under the seller's configured PIN codes.
 *
 * If hyperlocal delivery is disabled, missing, null or undefined, the product MUST NOT be considered express-eligible.
 */
export function isProductExpress30MinEligible(
  product: Product | null | undefined,
  customerPincode?: string | null
): boolean {
  if (!product) return false;

  // 1. Must be published and have stock available
  if (product.status && product.status !== 'published') return false;
  if (!product.stock || product.stock.available <= 0) return false;

  const config = product.deliveryConfig;
  if (!config) return false;

  // 2. Hyperlocal delivery MUST be explicitly enabled (never assume true by default)
  if (config.locationBasedSellingEnabled !== true) {
    return false;
  }

  // 3. Must have supportsExpress30Min === true
  if (config.supportsExpress30Min !== true) {
    return false;
  }

  // 4. Delivery speed tier must support 30-minute delivery (not standard-only or express_sameday-only)
  const speed = config.deliverySpeed;
  if (speed === 'standard' || speed === 'express_sameday') {
    return false;
  }

  // 5. If a customer delivery PIN code is provided, validate serviceability
  if (customerPincode && customerPincode.trim()) {
    const cleanPin = customerPincode.trim();
    const serviceable = config.serviceablePincodes || [];
    if (!serviceable.includes('*') && !serviceable.includes(cleanPin)) {
      return false;
    }
  }

  return true;
}

/**
 * Returns human-readable delivery info for a product based on customer PIN code and seller config.
 */
export function getProductDeliveryInfo(
  product: Product | null | undefined,
  customerPincode?: string | null
): {
  isExpress: boolean;
  badgeLabel: string;
  headline: string;
  estimatedTime: string;
  shippingFee: number;
  serviceCity: string;
} {
  if (!product) {
    return {
      isExpress: false,
      badgeLabel: 'Standard Delivery',
      headline: 'Standard Tracked Delivery',
      estimatedTime: '2-3 Business Days',
      shippingFee: 25,
      serviceCity: 'National',
    };
  }

  const isExpress = isProductExpress30MinEligible(product, customerPincode);
  const config = product.deliveryConfig;
  const serviceCity = config?.serviceCity || 'Bangalore';
  const standardFee = config?.shippingFee ?? 25;
  const quickFee = config?.quickDeliveryCharge ?? (standardFee + 15);

  if (isExpress) {
    return {
      isExpress: true,
      badgeLabel: '30-Min Express',
      headline: '⚡ 30-Minute Hyperlocal Express Delivery',
      estimatedTime: 'Within 25-30 Minutes',
      shippingFee: quickFee,
      serviceCity,
    };
  }

  return {
    isExpress: false,
    badgeLabel: 'Standard Delivery',
    headline: 'Standard Tracked Delivery',
    estimatedTime: `${config?.standardDeliveryDays || 2}-3 Business Days`,
    shippingFee: standardFee,
    serviceCity,
  };
}
