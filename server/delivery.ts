import { Product } from '../src/types/index.ts';

/**
 * Server-side Authoritative 30-Minute Express Delivery Eligibility Checker
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

  // 5. If customer delivery PIN code is provided, validate serviceability
  if (customerPincode && customerPincode.trim()) {
    const cleanPin = customerPincode.trim();
    const serviceable = config.serviceablePincodes || [];
    if (!serviceable.includes('*') && !serviceable.includes(cleanPin)) {
      return false;
    }
  }

  return true;
}
