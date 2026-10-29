-- ==============================================================================
-- TRENDVIBE STORE / ZYRO AI — SUPABASE PRODUCTS SCHEMA & ROW LEVEL SECURITY (RLS)
-- ==============================================================================

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. PRODUCTS TABLE
CREATE TABLE IF NOT EXISTS public.products (
  id TEXT PRIMARY KEY,
  seller_id TEXT NOT NULL,
  seller_name TEXT,
  name TEXT NOT NULL,
  kannada_name TEXT,
  slug TEXT NOT NULL,
  brand TEXT NOT NULL,
  category TEXT NOT NULL,
  subcategory TEXT,
  description TEXT,
  short_description TEXT,
  sku TEXT NOT NULL,
  images JSONB NOT NULL DEFAULT '[]'::jsonb,
  price NUMERIC(10, 2) NOT NULL,
  mrp NUMERIC(10, 2) NOT NULL,
  cost_price NUMERIC(10, 2),
  discount_percent NUMERIC(5, 2) DEFAULT 0,
  stock_on_hand INTEGER NOT NULL DEFAULT 50,
  stock_available INTEGER NOT NULL DEFAULT 50,
  stock_reserved INTEGER NOT NULL DEFAULT 0,
  low_stock_threshold INTEGER NOT NULL DEFAULT 10,
  minimum_order_quantity INTEGER NOT NULL DEFAULT 1,
  selling_unit TEXT NOT NULL DEFAULT 'piece',
  specifications JSONB NOT NULL DEFAULT '{}'::jsonb,
  customization_options JSONB NOT NULL DEFAULT '{}'::jsonb,
  pdf_doc_name TEXT,
  pdf_doc_url TEXT,
  pdf_extracted_text TEXT,
  is_verified_info BOOLEAN NOT NULL DEFAULT true,
  delivery_config JSONB NOT NULL DEFAULT '{
    "locationBasedSellingEnabled": false,
    "supportsExpress30Min": false,
    "deliverySpeed": "standard",
    "preparationMinutes": 15,
    "standardDeliveryDays": 2,
    "shippingFee": 25,
    "freeShippingAbove": 499,
    "returnPolicyDays": 7,
    "serviceablePincodes": ["560001", "560038", "560103", "560068", "560034"]
  }'::jsonb,
  location_based_selling_enabled BOOLEAN NOT NULL DEFAULT false,
  supports_express_30min BOOLEAN NOT NULL DEFAULT false,
  delivery_time_minutes INTEGER DEFAULT 30,
  service_city TEXT DEFAULT 'Bangalore',
  serviceable_pincodes TEXT[] DEFAULT ARRAY['560001', '560038', '560103', '560068', '560034'],
  instagram_url TEXT,
  official_source_url TEXT,
  status TEXT NOT NULL DEFAULT 'published',
  rating NUMERIC(3, 2) DEFAULT 5.0,
  review_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. INDEXES FOR PERFORMANCE
CREATE INDEX IF NOT EXISTS idx_products_seller_id ON public.products(seller_id);
CREATE INDEX IF NOT EXISTS idx_products_category ON public.products(category);
CREATE INDEX IF NOT EXISTS idx_products_status ON public.products(status);
CREATE INDEX IF NOT EXISTS idx_products_sku ON public.products(sku);
CREATE INDEX IF NOT EXISTS idx_products_location_selling ON public.products(location_based_selling_enabled);

-- 3. AUTOMATIC UPDATED_AT TRIGGER
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_products_updated_at ON public.products;
CREATE TRIGGER trigger_products_updated_at
  BEFORE UPDATE ON public.products
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- 4. ROW LEVEL SECURITY (RLS) POLICIES
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;

-- Allow public read access to all published products
CREATE POLICY "Public can view published products"
  ON public.products
  FOR SELECT
  USING (status = 'published');

-- Allow authenticated sellers to view all of their own products (including drafts)
CREATE POLICY "Sellers can view own products"
  ON public.products
  FOR SELECT
  USING (auth.uid()::text = seller_id);

-- Allow authenticated sellers to insert their own products
CREATE POLICY "Sellers can insert own products"
  ON public.products
  FOR INSERT
  WITH CHECK (auth.uid()::text = seller_id);

-- Allow authenticated sellers to update their own products
CREATE POLICY "Sellers can update own products"
  ON public.products
  FOR UPDATE
  USING (auth.uid()::text = seller_id)
  WITH CHECK (auth.uid()::text = seller_id);

-- Allow authenticated sellers to delete their own products
CREATE POLICY "Sellers can delete own products"
  ON public.products
  FOR DELETE
  USING (auth.uid()::text = seller_id);
