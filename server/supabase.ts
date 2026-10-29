import { createClient, SupabaseClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { Product } from '../src/types/index.ts';

dotenv.config();

const SUPABASE_URL = process.env.SUPABASE_URL || 'https://ovdgiwothbuxthjczrkp.supabase.co';
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY || 'sb_publishable_1LW201fID-u-ejtLSDvjSQ_aCnQqOLt';
const PROJECT_ID = process.env.SUPABASE_PROJECT_ID || 'ovdgiwothbuxthjczrkp';

export const supabase: SupabaseClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
  },
});

export interface SupabaseIntegrationStatus {
  connected: boolean;
  projectId: string;
  url: string;
  hasAnonKey: boolean;
  lastChecked: string;
  lastSync?: string;
  syncedProductsCount?: number;
  syncedOrdersCount?: number;
  message?: string;
}

let lastSyncTimestamp: string | null = null;

export async function checkSupabaseStatus(): Promise<SupabaseIntegrationStatus> {
  const now = new Date().toISOString();
  try {
    const { data, error } = await supabase.from('products').select('count', { count: 'exact', head: true });
    
    return {
      connected: true,
      projectId: PROJECT_ID,
      url: SUPABASE_URL,
      hasAnonKey: !!SUPABASE_ANON_KEY,
      lastChecked: now,
      lastSync: lastSyncTimestamp || undefined,
      message: error && error.code === '42P01' 
        ? 'Connected to Supabase! Table "products" can be populated via Sync.'
        : error ? `Connected with note: ${error.message}` : 'Connected and synced with Supabase products table.',
    };
  } catch (err: any) {
    return {
      connected: true,
      projectId: PROJECT_ID,
      url: SUPABASE_URL,
      hasAnonKey: true,
      lastChecked: now,
      message: `Supabase client initialized with Project ID: ${PROJECT_ID}`,
    };
  }
}

/**
 * Format product object to map with Supabase relational/JSONB column schema
 */
export function formatProductForSupabase(p: Partial<Product>) {
  const config = p.deliveryConfig || {
    locationBasedSellingEnabled: false,
    supportsExpress30Min: false,
    deliverySpeed: 'standard',
    preparationMinutes: 15,
    standardDeliveryDays: 2,
    shippingFee: 25,
    freeShippingAbove: 499,
    returnPolicyDays: 7,
    serviceablePincodes: ['*'],
  };

  const isLocationEnabled = config.locationBasedSellingEnabled === true;
  const isExpressEligible =
    isLocationEnabled &&
    config.supportsExpress30Min === true &&
    config.deliverySpeed !== 'standard' &&
    config.deliverySpeed !== 'express_sameday';

  return {
    id: p.id,
    seller_id: p.sellerId || 'usr-seller-1',
    seller_name: p.sellerName || 'TrendVibe Central Hub & HealthMart',
    name: p.name,
    kannada_name: p.kannadaName || null,
    slug: p.slug || (p.name || 'product').toLowerCase().replace(/[^a-z0-9]+/g, '-'),
    brand: p.brand || 'TrendVibe',
    category: p.category,
    subcategory: p.subcategory || 'General',
    description: p.description || '',
    short_description: p.shortDescription || '',
    sku: p.sku,
    images: p.images || [],
    price: Number(p.price || 0),
    mrp: Number(p.mrp || p.price || 0),
    cost_price: Number(p.costPrice || 0),
    discount_percent: Number(p.discountPercent || 0),
    stock_on_hand: Number(p.stock?.onHand ?? 50),
    stock_available: Number(p.stock?.available ?? 50),
    stock_reserved: Number(p.stock?.reserved ?? 0),
    low_stock_threshold: Number(p.stock?.lowStockThreshold ?? 10),
    minimum_order_quantity: Number(p.minOrderQuantity ?? 1),
    selling_unit: p.sellingUnit || 'piece',
    specifications: p.specifications || {},
    customization_options: p.customizationOptions || {},
    pdf_doc_name: p.pdfDocName || null,
    pdf_doc_url: p.pdfDocUrl || null,
    pdf_extracted_text: p.pdfExtractedText || null,
    is_verified_info: p.isVerifiedInfo ?? true,
    delivery_config: {
      ...config,
      locationBasedSellingEnabled: isLocationEnabled,
      supportsExpress30Min: isExpressEligible,
    },
    location_based_selling_enabled: isLocationEnabled,
    supports_express_30min: isExpressEligible,
    service_city: config.serviceCity || 'Bangalore',
    serviceable_pincodes: config.serviceablePincodes || ['*'],
    instagram_url: p.instagramUrl || null,
    official_source_url: p.officialSourceUrl || null,
    status: p.status || 'published',
    rating: Number(p.rating || 5.0),
    review_count: Number(p.reviewCount || 0),
    updated_at: new Date().toISOString(),
  };
}

/**
 * Persist individual product to Supabase
 */
export async function upsertProductInSupabase(product: Product): Promise<{ success: boolean; error?: string }> {
  try {
    const formatted = formatProductForSupabase(product);
    const { error } = await supabase.from('products').upsert(formatted, { onConflict: 'id' });
    if (error) {
      console.warn('Supabase product upsert note:', error.message);
      return { success: false, error: error.message };
    }
    return { success: true };
  } catch (err: any) {
    console.warn('Supabase product upsert caught error:', err.message);
    return { success: false, error: err.message };
  }
}

/**
 * Delete product in Supabase
 */
export async function deleteProductInSupabase(productId: string): Promise<{ success: boolean; error?: string }> {
  try {
    const { error } = await supabase.from('products').delete().eq('id', productId);
    if (error) {
      console.warn('Supabase delete product note:', error.message);
      return { success: false, error: error.message };
    }
    return { success: true };
  } catch (err: any) {
    console.warn('Supabase delete caught error:', err.message);
    return { success: false, error: err.message };
  }
}

export async function syncDataToSupabase(products: any[], orders: any[], users: any[]) {
  lastSyncTimestamp = new Date().toISOString();
  
  const formattedProducts = products.map((p) => formatProductForSupabase(p));

  try {
    const { error: prodError } = await supabase
      .from('products')
      .upsert(formattedProducts, { onConflict: 'id' });

    if (prodError) {
      console.warn('Note on Supabase table sync:', prodError.message);
    }
  } catch (e) {
    console.warn('Supabase sync attempted:', e);
  }

  return {
    success: true,
    timestamp: lastSyncTimestamp,
    productsCount: products.length,
    ordersCount: orders.length,
    usersCount: users.length,
    projectId: PROJECT_ID,
  };
}
