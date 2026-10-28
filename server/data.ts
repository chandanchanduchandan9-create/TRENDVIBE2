import { CategoryInfo, Product, SellerDocument, User, Order, InventoryMovement } from '../src/types/index.ts';

export const INITIAL_CATEGORIES: CategoryInfo[] = [
  {
    id: 'cat-med',
    slug: 'medicines-healthcare',
    name: 'Medicines & Healthcare Products',
    kannadaName: 'ಔಷಧಿಗಳು ಮತ್ತು ಆರೋಗ್ಯ ಉತ್ಪನ್ನಗಳು',
    icon: 'Pill',
    description: 'Certified medicines, first aid, OTC relief, and nutritional hydration.',
    subcategories: ['Pain Relief', 'Fever & Cold', 'Hydration & Digestion', 'First Aid'],
    supportsExpress30Min: true,
  },
  {
    id: 'cat-cos',
    slug: 'cosmetics-personal-care',
    name: 'Cosmetics & Personal Care',
    kannadaName: 'ಸೌಂದರ್ಯವರ್ಧಕಗಳು ಮತ್ತು ವೈಯಕ್ತಿಕ ಕಾಳಜಿ',
    icon: 'Sparkles',
    description: 'Dermatologist-tested skincare, sunscreens, cleansers, and cosmetics.',
    subcategories: ['Skincare', 'Sun Protection', 'Face Cleansers', 'Lip Care'],
    supportsExpress30Min: false,
  },
  {
    id: 'cat-lap',
    slug: 'laptops',
    name: 'Laptops',
    kannadaName: 'ಲ್ಯಾಪ್‌ಟಾಪ್‌ಗಳು',
    icon: 'Laptop',
    description: 'High-performance gaming laptops, everyday ultrabooks, and enterprise workstations.',
    subcategories: ['Gaming Laptops', 'Everyday Laptops', 'Thin & Light', 'Business'],
    supportsExpress30Min: false,
  },
  {
    id: 'cat-mob',
    slug: 'mobiles',
    name: 'Mobiles',
    kannadaName: 'ಮೊಬೈಲ್‌ಗಳು',
    icon: 'Smartphone',
    description: 'Latest flagship 5G smartphones with cutting-edge AI cameras and processors.',
    subcategories: ['Flagship 5G', 'Camera Phones', 'Compact Flagship', 'Gaming Phones'],
    supportsExpress30Min: false,
  },
  {
    id: 'cat-foo',
    slug: 'food',
    name: 'Food',
    kannadaName: 'ಆಹಾರ ಮತ್ತು ತಿಂಡಿಗಳು',
    icon: 'Utensils',
    description: 'Freshly steamed wholesome millets, organic protein snacks, and energizing smoothies.',
    subcategories: ['Healthy Breakfast', 'Steamed Delights', 'Protein Snacks', 'Fresh Beverages'],
    supportsExpress30Min: true,
  },
  {
    id: 'cat-sho',
    slug: 'shoes-footwear',
    name: 'Shoes & Footwear',
    kannadaName: 'ಪಾದರಕ್ಷೆಗಳು ಮತ್ತು ಬೂಟುಗಳು',
    icon: 'Footprints',
    description: 'Ergonomic athletic runners, everyday cushioned sneakers, and leather loafers.',
    subcategories: ['Running Shoes', 'Sneakers', 'Casual Loafers', 'Training'],
    supportsExpress30Min: false,
  },
  {
    id: 'cat-clo',
    slug: 'clothes-apparel',
    name: 'Clothes & Apparel',
    kannadaName: 'ಉಡುಪುಗಳು ಮತ್ತು ಫ್ಯಾಷನ್',
    icon: 'Shirt',
    description: 'Premium tailored cotton shirts, stretch denim, ethnic handblock kurtas, and jackets.',
    subcategories: ['Formal Shirts', 'Denim & Jeans', 'Ethnic Kurtas', 'Jackets & Outerwear'],
    supportsExpress30Min: false,
  },
  {
    id: 'cat-oth',
    slug: 'other-store-products',
    name: 'Other Store Products',
    kannadaName: 'ಇತರ ಅಂಗಡಿ ಉತ್ಪನ್ನಗಳು',
    icon: 'Package',
    description: 'Fast GaN chargers, ANC wireless earbuds, memory foam cushions, and thermosteel flasks.',
    subcategories: ['Audio & Earbuds', 'Bottles & Flasks', 'Fast Chargers', 'Ergonomic Living'],
    supportsExpress30Min: false,
  },
];

export const INITIAL_USERS: User[] = [
  {
    id: 'usr-customer-1',
    name: 'Chandan Kumar',
    email: 'chandanchanduchandan9@gmail.com',
    phone: '+91 98450 12345',
    password: 'Password@123',
    role: 'customer',
    avatarUrl: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=200&q=80',
    createdAt: '2026-01-10T10:00:00Z',
    voiceProfile: {
      isEnrolled: true,
      voiceprintId: 'VP-CHANDAN-7721',
      enrolledAt: '2026-02-15T12:00:00Z',
      confidence: 0.986,
    },
    addresses: [
      {
        id: 'addr-1',
        name: 'Chandan Kumar',
        phone: '+91 98450 12345',
        street: 'Flat 402, Green Glen Heights, Bellandur Outer Ring Road',
        city: 'Bangalore',
        state: 'Karnataka',
        pincode: '560103',
        landmark: 'Near EcoSpace Tech Park',
        isDefault: true,
      },
      {
        id: 'addr-2',
        name: 'Chandan Kumar (Office)',
        phone: '+91 98450 12345',
        street: 'Floor 5, TrendVibe Tech Tower, Indiranagar 100ft Road',
        city: 'Bangalore',
        state: 'Karnataka',
        pincode: '560038',
        landmark: 'Opposite Metro Pillar 84',
        isDefault: false,
      },
    ],
  },
  {
    id: 'usr-seller-1',
    name: 'Priya Sharma',
    email: 'seller@trendvibe.com',
    phone: '+91 98860 55432',
    password: 'Seller@Secure2026',
    role: 'seller',
    storeName: 'TrendVibe Central Hub & HealthMart',
    storeDescription: 'Authorised multi-category distributor specializing in certified healthcare, tech gadgets, and fresh health kitchens.',
    isApprovedSeller: true,
    avatarUrl: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=200&q=80',
    createdAt: '2025-11-01T08:00:00Z',
    voiceProfile: {
      isEnrolled: true,
      voiceprintId: 'VP-PRIYA-9942',
      enrolledAt: '2026-02-10T11:00:00Z',
      confidence: 0.991,
    },
  },
  {
    id: 'usr-admin-1',
    name: 'Rajesh Hegde',
    email: 'admin@trendvibe.com',
    phone: '+91 98451 99999',
    password: 'Admin@Master2026',
    role: 'admin',
    avatarUrl: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&w=200&q=80',
    createdAt: '2025-01-01T00:00:00Z',
    voiceProfile: {
      isEnrolled: true,
      voiceprintId: 'VP-ADMIN-0001',
      enrolledAt: '2026-01-01T09:00:00Z',
      confidence: 0.998,
    },
  },
];

export const INITIAL_PRODUCTS: Product[] = [
  // 1. Medicines & Healthcare (6 items)
  {
    id: 'prod-dolo-650',
    name: 'Dolo 650 Tablet (Paracetamol 650mg)',
    kannadaName: 'ಡೋಲೋ 650 ಮಾತ್ರೆ (ಪ್ಯಾರಸಿಟಮಾಲ್ 650 ಮಿ.ಗ್ರಾಂ)',
    slug: 'dolo-650-tablet',
    brand: 'Micro Labs Limited',
    category: 'medicines-healthcare',
    subcategory: 'Fever & Cold',
    description: 'Dolo 650 Tablet contains Paracetamol 650 mg. It is an analgesic (pain reliever) and antipyretic (fever reducer) prescribed widely for headaches, fever, toothaches, and musculoskeletal pains. Fast-acting and gentle on stomach when taken post meals.',
    shortDescription: 'Paracetamol 650mg strip of 15 tablets for fever and mild to moderate pain relief.',
    mrp: 34,
    price: 30,
    discountPercent: 12,
    costPrice: 20,
    sku: 'MED-DOLO-650-15T',
    images: [
      'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1471864190281-a93a3070b6de?auto=format&fit=crop&w=800&q=80'
    ],
    specifications: {
      'Composition': 'Paracetamol IP 650 mg',
      'Pack Size': 'Strip of 15 Tablets',
      'Dosage Form': 'Oral Tablet',
      'Storage': 'Store below 30°C in dry place',
      'Prescription Needed': 'No (OTC)'
    },
    tags: ['fever', 'paracetamol', 'headache', 'cold', 'pain relief'],
    stock: {
      onHand: 150,
      reserved: 5,
      available: 145,
      lowStockThreshold: 20
    },
    sellerId: 'usr-seller-1',
    sellerName: 'TrendVibe Central Hub & HealthMart',
    instagramUrl: 'https://instagram.com/trendvibestore',
    officialSourceUrl: 'https://www.microlabsltd.com',
    lastVerifiedDate: '2026-03-01',
    isVerifiedInfo: true,
    deliveryConfig: {
      supportsExpress30Min: true,
      preparationMinutes: 5,
      standardDeliveryDays: 1,
      shippingFee: 25,
      freeShippingAbove: 299,
      returnPolicyDays: 7,
      serviceablePincodes: ['560001', '560038', '560103', '560068', '560034', '560008']
    },
    status: 'published',
    rating: 4.8,
    reviewCount: 420,
    createdAt: '2026-01-15T10:00:00Z',
    updatedAt: '2026-03-10T12:00:00Z'
  },
  {
    id: 'prod-calpol-500',
    name: 'Calpol 500 Tablet (Paracetamol 500mg)',
    kannadaName: 'ಕಾಲ್ಪಾಲ್ 500 ಮಾತ್ರೆ (ಪ್ಯಾರಸಿಟಮಾಲ್ 500 ಮಿ.ಗ್ರಾಂ)',
    slug: 'calpol-500-tablet',
    brand: 'GlaxoSmithKline (GSK)',
    category: 'medicines-healthcare',
    subcategory: 'Fever & Cold',
    description: 'Calpol 500 Tablet provides rapid relief from fever and mild-to-moderate aches including sore throat, body aches, earache, and toothache. Manufactured under stringent GSK quality standards.',
    shortDescription: 'GlaxoSmithKline Paracetamol 500mg strip of 15 tablets for pediatric and adult antipyretic relief.',
    mrp: 22,
    price: 19,
    discountPercent: 14,
    costPrice: 12,
    sku: 'MED-CALPOL-500-15T',
    images: [
      'https://images.unsplash.com/photo-1587854692152-cbe660dbde88?auto=format&fit=crop&w=800&q=80'
    ],
    specifications: {
      'Composition': 'Paracetamol IP 500 mg',
      'Pack Size': 'Strip of 15 Tablets',
      'Dosage Form': 'Tablet',
      'Manufacturer': 'GlaxoSmithKline Pharmaceuticals'
    },
    tags: ['fever', 'calpol', 'headache', 'body pain'],
    stock: {
      onHand: 110,
      reserved: 2,
      available: 108,
      lowStockThreshold: 15
    },
    sellerId: 'usr-seller-1',
    sellerName: 'TrendVibe Central Hub & HealthMart',
    instagramUrl: 'https://instagram.com/trendvibestore',
    officialSourceUrl: 'https://india-pharma.gsk.com',
    lastVerifiedDate: '2026-03-01',
    isVerifiedInfo: true,
    deliveryConfig: {
      supportsExpress30Min: true,
      preparationMinutes: 5,
      standardDeliveryDays: 1,
      shippingFee: 25,
      freeShippingAbove: 299,
      returnPolicyDays: 7,
      serviceablePincodes: ['560001', '560038', '560103', '560068', '560034', '560008']
    },
    status: 'published',
    rating: 4.7,
    reviewCount: 310,
    createdAt: '2026-01-16T11:00:00Z',
    updatedAt: '2026-03-10T12:00:00Z'
  },
  {
    id: 'prod-electral-ors',
    name: 'Electral WHO-ORS Powder Sachet (21.8g)',
    kannadaName: 'ಎಲೆಕ್ಟ್ರಾಲ್ WHO-ORS ಪುಡಿ ಸ್ಯಾಚೆಟ್ (21.8 ಗ್ರಾಂ)',
    slug: 'electral-who-ors-powder-sachet',
    brand: 'FDC Limited',
    category: 'medicines-healthcare',
    subcategory: 'Hydration & Digestion',
    description: 'Electral is an Oral Rehydration Salt (ORS) formulated according to the World Health Organization (WHO) recommended osmolarity formula. Restores vital body fluids and electrolytes lost due to dehydration, diarrhea, intense heat, or athletic training.',
    shortDescription: 'WHO formula oral rehydration salt for instant electrolytes restoration and heat hydration.',
    mrp: 23,
    price: 21,
    discountPercent: 9,
    costPrice: 14,
    sku: 'MED-ELECTRAL-21G',
    images: [
      'https://images.unsplash.com/photo-1576092768241-dec231879fc3?auto=format&fit=crop&w=800&q=80'
    ],
    specifications: {
      'Formula': 'WHO Recommended Low Osmolarity',
      'Net Weight': '21.8 g (makes 1 Litre solution)',
      'Key Electrolytes': 'Sodium, Potassium, Chloride, Citrate, Dextrose',
      'Flavor': 'Orange / Natural'
    },
    tags: ['ors', 'electrolytes', 'hydration', 'dehydration', 'energy'],
    stock: {
      onHand: 240,
      reserved: 8,
      available: 232,
      lowStockThreshold: 30
    },
    sellerId: 'usr-seller-1',
    sellerName: 'TrendVibe Central Hub & HealthMart',
    instagramUrl: 'https://instagram.com/trendvibestore',
    officialSourceUrl: 'https://fdcindia.com',
    lastVerifiedDate: '2026-03-01',
    isVerifiedInfo: true,
    deliveryConfig: {
      supportsExpress30Min: true,
      preparationMinutes: 5,
      standardDeliveryDays: 1,
      shippingFee: 25,
      freeShippingAbove: 299,
      returnPolicyDays: 7,
      serviceablePincodes: ['560001', '560038', '560103', '560068', '560034', '560008']
    },
    status: 'published',
    rating: 4.9,
    reviewCount: 540,
    createdAt: '2026-01-16T12:00:00Z',
    updatedAt: '2026-03-10T12:00:00Z'
  },
  {
    id: 'prod-moov-cream',
    name: 'Moov Pain Relief Cream (50g)',
    kannadaName: 'ಮೂವ್ ನೋವು ನಿವಾರಕ ಕ್ರೀಮ್ (50 ಗ್ರಾಂ)',
    slug: 'moov-pain-relief-cream-50g',
    brand: 'Reckitt Benckiser',
    category: 'medicines-healthcare',
    subcategory: 'Pain Relief',
    description: 'Moov Pain Relief Cream is a 100% Ayurvedic formulation with active ingredients like Wintergreen oil, Mint extract, Turpentine oil, and Eucalyptus oil. Penetrates deeply to produce soothing warmth and relieve backaches, joint pain, and sprains.',
    shortDescription: '100% Ayurvedic warmth formula for fast backache, muscular pain, and sprain relief.',
    mrp: 195,
    price: 175,
    discountPercent: 10,
    costPrice: 120,
    sku: 'MED-MOOV-CRM-50G',
    images: [
      'https://images.unsplash.com/photo-1556228720-195a672e8a03?auto=format&fit=crop&w=800&q=80'
    ],
    specifications: {
      'Weight': '50 g',
      'Ingredients': 'Nilgiri oil, Pudinah ka phool, Wintergreen oil, Tarpin ka tel',
      'Application': 'Topical massage over affected area',
      'Target Pain': 'Backache, neck ache, joint stiffness'
    },
    tags: ['pain relief', 'ayurvedic', 'backache', 'sprain', 'cream'],
    stock: {
      onHand: 85,
      reserved: 3,
      available: 82,
      lowStockThreshold: 10
    },
    sellerId: 'usr-seller-1',
    sellerName: 'TrendVibe Central Hub & HealthMart',
    instagramUrl: 'https://instagram.com/trendvibestore',
    officialSourceUrl: 'https://www.reckitt.com',
    lastVerifiedDate: '2026-03-01',
    isVerifiedInfo: true,
    deliveryConfig: {
      supportsExpress30Min: true,
      preparationMinutes: 5,
      standardDeliveryDays: 1,
      shippingFee: 25,
      freeShippingAbove: 299,
      returnPolicyDays: 7,
      serviceablePincodes: ['560001', '560038', '560103', '560068', '560034', '560008']
    },
    status: 'published',
    rating: 4.6,
    reviewCount: 280,
    createdAt: '2026-01-17T10:00:00Z',
    updatedAt: '2026-03-10T12:00:00Z'
  },
  {
    id: 'prod-moov-spray',
    name: 'Moov Pain Relief Fast Acting Spray (35g / 50ml)',
    kannadaName: 'ಮೂವ್ ನೋವು ನಿವಾರಕ ಸ್ಪಷ್ಟ ಸ್ಪ್ರೇ (35 ಗ್ರಾಂ)',
    slug: 'moov-pain-relief-spray',
    brand: 'Reckitt Benckiser',
    category: 'medicines-healthcare',
    subcategory: 'Pain Relief',
    description: 'Moov Spray with 4 active ayurvedic herbal oils instantly targets lower backache, neck pain, sport strain, and joint stiffness with zero messy rubbing.',
    shortDescription: 'Quick spray penetration for sports injuries, back pain, and joint cramps.',
    mrp: 160,
    price: 144,
    discountPercent: 10,
    costPrice: 98,
    sku: 'MED-MOOV-SPRY-35G',
    images: [
      'https://images.unsplash.com/photo-1608248597359-59755490bf9e?auto=format&fit=crop&w=800&q=80'
    ],
    specifications: {
      'Volume': '50 ml / 35 g',
      'Format': 'Aerosol Spray',
      'Mechanism': 'Micro-droplet transdermal absorption'
    },
    tags: ['spray', 'moov', 'pain relief', 'sports injury'],
    stock: {
      onHand: 70,
      reserved: 1,
      available: 69,
      lowStockThreshold: 10
    },
    sellerId: 'usr-seller-1',
    sellerName: 'TrendVibe Central Hub & HealthMart',
    instagramUrl: 'https://instagram.com/trendvibestore',
    officialSourceUrl: 'https://www.reckitt.com',
    lastVerifiedDate: '2026-03-01',
    isVerifiedInfo: true,
    deliveryConfig: {
      supportsExpress30Min: true,
      preparationMinutes: 5,
      standardDeliveryDays: 1,
      shippingFee: 25,
      freeShippingAbove: 299,
      returnPolicyDays: 7,
      serviceablePincodes: ['560001', '560038', '560103', '560068', '560034', '560008']
    },
    status: 'published',
    rating: 4.7,
    reviewCount: 195,
    createdAt: '2026-01-17T11:00:00Z',
    updatedAt: '2026-03-10T12:00:00Z'
  },
  {
    id: 'prod-menthoplus-balm',
    name: 'MenthoPlus Cooling Pain Relief Balm (10g)',
    kannadaName: 'ಮೆಂತೋಪ್ಲಸ್ ಕೂಲಿಂಗ್ ಬಾಮ್ (10 ಗ್ರಾಂ)',
    slug: 'menthoplus-balm',
    brand: 'Emami',
    category: 'medicines-healthcare',
    subcategory: 'Pain Relief',
    description: 'Emami MenthoPlus Balm is formulated with cooling menthol, camphor, and clove oil for fast relief from tension headaches, congestion, and forehead throbbing.',
    shortDescription: 'Herbal cooling balm for rapid relief from stress headaches and nasal congestion.',
    mrp: 45,
    price: 40,
    discountPercent: 11,
    costPrice: 26,
    sku: 'MED-MENTHO-10G',
    images: [
      'https://images.unsplash.com/photo-1584017911766-d451b3d0e843?auto=format&fit=crop&w=800&q=80'
    ],
    specifications: {
      'Weight': '10 g',
      'Key Actives': 'Mentha arvensis (Pudina Ka Phool), Karpoor, Clove Oil',
      'Format': 'Soothing Balm'
    },
    tags: ['headache', 'balm', 'menthol', 'emami', 'cold'],
    stock: {
      onHand: 120,
      reserved: 4,
      available: 116,
      lowStockThreshold: 15
    },
    sellerId: 'usr-seller-1',
    sellerName: 'TrendVibe Central Hub & HealthMart',
    instagramUrl: 'https://instagram.com/trendvibestore',
    officialSourceUrl: 'https://www.emamiltd.in',
    lastVerifiedDate: '2026-03-01',
    isVerifiedInfo: true,
    deliveryConfig: {
      supportsExpress30Min: true,
      preparationMinutes: 5,
      standardDeliveryDays: 1,
      shippingFee: 25,
      freeShippingAbove: 299,
      returnPolicyDays: 7,
      serviceablePincodes: ['560001', '560038', '560103', '560068', '560034', '560008']
    },
    status: 'published',
    rating: 4.5,
    reviewCount: 160,
    createdAt: '2026-01-18T09:00:00Z',
    updatedAt: '2026-03-10T12:00:00Z'
  },

  // 2. Food & Kitchen (5 items)
  {
    id: 'prod-ragi-idli',
    name: 'Fresh Ragi Idli (Pack of 4 with Chutney & Sambar)',
    kannadaName: 'ತಾಜಾ ರಾಗಿ ಇಡ್ಲಿ (4 ರ ತುಂಡು ಚಟ್ನಿ ಮತ್ತು ಸಾಂಬಾರ್ ಸಹಿತ)',
    slug: 'ragi-idli-pack-of-4',
    brand: 'TrendVibe Kitchen',
    category: 'food',
    subcategory: 'Healthy Breakfast',
    description: 'Wholesome South Indian idlis made from organic finger millet (Ragi) and urad dal. Rich in dietary fiber, calcium, and iron. Steamed fresh upon order and served with fresh grated coconut chutney and aromatic vegetable sambar.',
    shortDescription: 'Gluten-conscious fiber-rich finger millet steamed idlis with traditional coconut chutney and sambar.',
    mrp: 90,
    price: 79,
    discountPercent: 12,
    costPrice: 42,
    sku: 'FOOD-RAGI-IDLI-4P',
    images: [
      'https://images.unsplash.com/photo-1589301760014-d929f3979dbc?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1626777552726-4a6b54c97e46?auto=format&fit=crop&w=800&q=80'
    ],
    specifications: {
      'Portion': '4 Pieces (approx 240g)',
      'Primary Ingredients': 'Sprouted Ragi Flour, Urad Dal, Fenugreek, Himalayan Salt',
      'Accompaniments': 'Coconut Chutney (50ml) & Drumstick Sambar (100ml)',
      'Nutritional Highlights': 'High Calcium, Low Glycemic Index'
    },
    tags: ['ragi', 'idli', 'south indian', 'breakfast', 'healthy', 'fiber', 'diet'],
    stock: {
      onHand: 40,
      reserved: 2,
      available: 38,
      lowStockThreshold: 10
    },
    sellerId: 'usr-seller-1',
    sellerName: 'TrendVibe Central Hub & HealthMart',
    instagramUrl: 'https://instagram.com/trendvibestore',
    officialSourceUrl: 'https://trendvibe.internal/kitchen/nutrition',
    lastVerifiedDate: '2026-03-15',
    isVerifiedInfo: true,
    deliveryConfig: {
      supportsExpress30Min: true,
      preparationMinutes: 15,
      standardDeliveryDays: 0,
      shippingFee: 30,
      freeShippingAbove: 249,
      returnPolicyDays: 0,
      serviceablePincodes: ['560001', '560038', '560103', '560068', '560034', '560008']
    },
    status: 'published',
    rating: 4.9,
    reviewCount: 380,
    createdAt: '2026-02-01T07:00:00Z',
    updatedAt: '2026-03-15T08:00:00Z'
  },
  {
    id: 'prod-veg-idli',
    name: 'Steamed Vegetable Idli (Pack of 4 with Sambar)',
    kannadaName: 'ತರಕಾರಿ ಇಡ್ಲಿ (4 ರ ತುಂಡು ಸಾಂಬಾರ್ ಸಹಿತ)',
    slug: 'steamed-vegetable-idli',
    brand: 'TrendVibe Kitchen',
    category: 'food',
    subcategory: 'Steamed Delights',
    description: 'Fluffy idlis infused with finely shredded carrots, green peas, curry leaves, and ginger mustard tempering. Served warm with classic lentil sambar and spicy mint coconut chutney.',
    shortDescription: 'Nutritious vegetable-loaded soft steamed idlis with fresh coconut mint dip and hot sambar.',
    mrp: 85,
    price: 75,
    discountPercent: 12,
    costPrice: 38,
    sku: 'FOOD-VEG-IDLI-4P',
    images: [
      'https://images.unsplash.com/photo-1589301760014-d929f3979dbc?auto=format&fit=crop&w=800&q=80'
    ],
    specifications: {
      'Portion': '4 Pieces (approx 220g)',
      'Veggies': 'Carrots, Sweet Corn, Green Peas, Fresh Coriander',
      'Calories': 'Approx 190 kcal per portion'
    },
    tags: ['vegetable', 'idli', 'breakfast', 'steamed', 'low oil'],
    stock: {
      onHand: 45,
      reserved: 3,
      available: 42,
      lowStockThreshold: 10
    },
    sellerId: 'usr-seller-1',
    sellerName: 'TrendVibe Central Hub & HealthMart',
    instagramUrl: 'https://instagram.com/trendvibestore',
    officialSourceUrl: 'https://trendvibe.internal/kitchen/nutrition',
    lastVerifiedDate: '2026-03-15',
    isVerifiedInfo: true,
    deliveryConfig: {
      supportsExpress30Min: true,
      preparationMinutes: 15,
      standardDeliveryDays: 0,
      shippingFee: 30,
      freeShippingAbove: 249,
      returnPolicyDays: 0,
      serviceablePincodes: ['560001', '560038', '560103', '560068', '560034', '560008']
    },
    status: 'published',
    rating: 4.8,
    reviewCount: 290,
    createdAt: '2026-02-01T07:15:00Z',
    updatedAt: '2026-03-15T08:00:00Z'
  },
  {
    id: 'prod-protein-ladoo',
    name: 'Homemade Protein Ladoo (Pack of 6, Dates & Nuts)',
    kannadaName: 'ಮನೆಯಲ್ಲಿ ಮಾಡಿದ ಪ್ರೋಟೀನ್ ಲಾಡು (6 ರ ತುಂಡು)',
    slug: 'homemade-protein-ladoo',
    brand: 'TrendVibe Kitchen',
    category: 'food',
    subcategory: 'Protein Snacks',
    description: '100% natural, zero refined sugar energy bites crafted from Medjool dates, roasted almonds, cashews, chia seeds, flaxseeds, and pure desi cow ghee. 7g natural plant protein per ball.',
    shortDescription: 'Zero refined sugar energy spheres made with dates, roasted dry fruits, and flax seeds.',
    mrp: 180,
    price: 159,
    discountPercent: 12,
    costPrice: 85,
    sku: 'FOOD-PROT-LADOO-6P',
    images: [
      'https://images.unsplash.com/photo-1599488615731-7e5c2823ff28?auto=format&fit=crop&w=800&q=80'
    ],
    specifications: {
      'Pack Size': '6 Ladoos (180g total)',
      'Sweetener': '100% Medjool Dates & Organic Jaggery (Zero White Sugar)',
      'Protein': '7g Protein per Ladoo',
      'Shelf Life': '14 days at room temperature'
    },
    tags: ['protein', 'snack', 'dry fruits', 'sugar free', 'energy'],
    stock: {
      onHand: 60,
      reserved: 2,
      available: 58,
      lowStockThreshold: 12
    },
    sellerId: 'usr-seller-1',
    sellerName: 'TrendVibe Central Hub & HealthMart',
    instagramUrl: 'https://instagram.com/trendvibestore',
    officialSourceUrl: 'https://trendvibe.internal/kitchen/nutrition',
    lastVerifiedDate: '2026-03-15',
    isVerifiedInfo: true,
    deliveryConfig: {
      supportsExpress30Min: true,
      preparationMinutes: 10,
      standardDeliveryDays: 0,
      shippingFee: 30,
      freeShippingAbove: 249,
      returnPolicyDays: 0,
      serviceablePincodes: ['560001', '560038', '560103', '560068', '560034', '560008']
    },
    status: 'published',
    rating: 4.9,
    reviewCount: 410,
    createdAt: '2026-02-02T08:00:00Z',
    updatedAt: '2026-03-15T08:00:00Z'
  },
  {
    id: 'prod-oats-pancake',
    name: 'Oats Banana Pancake (Stack of 3 with Organic Honey)',
    kannadaName: 'ಓಟ್ಸ್ ಬಾಳೆಹಣ್ಣು ಪ್ಯಾನ್‌ಕೇಕ್ (3 ರ ಪ್ಯಾಕ್)',
    slug: 'oats-banana-pancake',
    brand: 'TrendVibe Kitchen',
    category: 'food',
    subcategory: 'Healthy Breakfast',
    description: 'Freshly griddled golden pancakes prepared from rolled oats, ripe bananas, cinnamon, and farm-fresh milk. Served with organic wildflower honey and toasted pumpkin seed garnish.',
    shortDescription: 'Golden rolled oats and banana pancakes accompanied with wildflower honey and crunchy pumpkin seeds.',
    mrp: 140,
    price: 120,
    discountPercent: 14,
    costPrice: 55,
    sku: 'FOOD-OATS-PANCK-3P',
    images: [
      'https://images.unsplash.com/photo-1528207776546-365bb710ee93?auto=format&fit=crop&w=800&q=80'
    ],
    specifications: {
      'Serving': 'Stack of 3 Pancakes (200g)',
      'Flour Base': '100% Whole Rolled Oats (No Maida)',
      'Accompaniments': 'Organic Honey Drizzle (30ml)'
    },
    tags: ['pancake', 'oats', 'banana', 'healthy breakfast', 'no maida'],
    stock: {
      onHand: 35,
      reserved: 1,
      available: 34,
      lowStockThreshold: 8
    },
    sellerId: 'usr-seller-1',
    sellerName: 'TrendVibe Central Hub & HealthMart',
    instagramUrl: 'https://instagram.com/trendvibestore',
    officialSourceUrl: 'https://trendvibe.internal/kitchen/nutrition',
    lastVerifiedDate: '2026-03-15',
    isVerifiedInfo: true,
    deliveryConfig: {
      supportsExpress30Min: true,
      preparationMinutes: 20,
      standardDeliveryDays: 0,
      shippingFee: 30,
      freeShippingAbove: 249,
      returnPolicyDays: 0,
      serviceablePincodes: ['560001', '560038', '560103', '560068', '560034', '560008']
    },
    status: 'published',
    rating: 4.8,
    reviewCount: 220,
    createdAt: '2026-02-03T09:00:00Z',
    updatedAt: '2026-03-15T08:00:00Z'
  },
  {
    id: 'prod-peanut-smoothie',
    name: 'Peanut Banana Protein Smoothie (Fresh 350ml Jar)',
    kannadaName: 'ಕಡಲೆಕಾಯಿ ಬಾಳೆಹಣ್ಣು ಪ್ರೋಟೀನ್ ಸ್ಮೂಥಿ (350 ಮಿ.ಲೀ)',
    slug: 'peanut-banana-smoothie',
    brand: 'TrendVibe Kitchen',
    category: 'food',
    subcategory: 'Fresh Beverages',
    description: 'Thick, creamy chilled smoothie blended with slow-roasted peanut butter, Yelakki bananas, whey isolate, and chilled almond milk. Ideal for pre/post-workout recovery or instant breakfast.',
    shortDescription: 'Velvety roasted peanut butter and Yelakki banana protein shake in a sealed glass jar.',
    mrp: 130,
    price: 110,
    discountPercent: 15,
    costPrice: 50,
    sku: 'FOOD-SMOOTHIE-350ML',
    images: [
      'https://images.unsplash.com/photo-1553530666-ba11a7da3888?auto=format&fit=crop&w=800&q=80'
    ],
    specifications: {
      'Volume': '350 ml Sealed Glass Jar',
      'Protein': '18g Protein',
      'Ingredients': 'Fresh Banana, Roasted Peanut Butter, Almond Milk, Whey Protein, Honey'
    },
    tags: ['smoothie', 'shake', 'peanut butter', 'protein', 'post workout'],
    stock: {
      onHand: 50,
      reserved: 2,
      available: 48,
      lowStockThreshold: 10
    },
    sellerId: 'usr-seller-1',
    sellerName: 'TrendVibe Central Hub & HealthMart',
    instagramUrl: 'https://instagram.com/trendvibestore',
    officialSourceUrl: 'https://trendvibe.internal/kitchen/nutrition',
    lastVerifiedDate: '2026-03-15',
    isVerifiedInfo: true,
    deliveryConfig: {
      supportsExpress30Min: true,
      preparationMinutes: 10,
      standardDeliveryDays: 0,
      shippingFee: 30,
      freeShippingAbove: 249,
      returnPolicyDays: 0,
      serviceablePincodes: ['560001', '560038', '560103', '560068', '560034', '560008']
    },
    status: 'published',
    rating: 4.9,
    reviewCount: 340,
    createdAt: '2026-02-04T10:00:00Z',
    updatedAt: '2026-03-15T08:00:00Z'
  },

  // 3. Mobiles (4 items)
  {
    id: 'prod-iphone-16',
    name: 'Apple iPhone 16 (128GB, Ultramarine / Teal)',
    kannadaName: 'ಆಪಲ್ ಐಫೋನ್ 16 (128GB)',
    slug: 'apple-iphone-16-128gb',
    brand: 'Apple',
    category: 'mobiles',
    subcategory: 'Flagship 5G',
    description: 'The Apple iPhone 16 introduces Camera Control, a 48MP Fusion camera with 2x optical-quality telephoto, Apple Intelligence superpowers, and the lightning-fast A18 chip designed for all-day battery endurance and next-gen gaming.',
    shortDescription: 'A18 chip, Camera Control, 48MP Fusion lens, and Apple Intelligence in stunning aerospace-grade aluminum.',
    mrp: 79900,
    price: 74900,
    discountPercent: 6,
    costPrice: 69000,
    sku: 'MOB-APL-IP16-128-UM',
    images: [
      'https://images.unsplash.com/photo-1695048133142-1a20484d2569?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1510557880182-3d4d3cba35a5?auto=format&fit=crop&w=800&q=80'
    ],
    variants: [
      { id: 'v-ip16-128-teal', name: '128GB - Teal', sku: 'IP16-128-TEA', price: 74900, mrp: 79900, stock: 15, attributes: { storage: '128GB', color: 'Teal' } },
      { id: 'v-ip16-256-ultra', name: '256GB - Ultramarine', sku: 'IP16-256-ULT', price: 84900, mrp: 89900, stock: 10, attributes: { storage: '256GB', color: 'Ultramarine' } },
    ],
    specifications: {
      'Processor': 'Apple A18 Bionic (3nm)',
      'Display': '6.1-inch Super Retina XDR OLED',
      'Camera': '48MP Fusion + 12MP Ultra Wide with Macro',
      'Security': 'Face ID',
      'Connectivity': '5G, Wi-Fi 7, USB-C 2.0',
      'Warranty': '1 Year Apple Official Warranty'
    },
    tags: ['iphone 16', 'apple', 'smartphone', '5g', 'a18', 'camera control'],
    stock: {
      onHand: 25,
      reserved: 1,
      available: 24,
      lowStockThreshold: 5
    },
    sellerId: 'usr-seller-1',
    sellerName: 'TrendVibe Central Hub & HealthMart',
    instagramUrl: 'https://instagram.com/trendvibestore',
    officialSourceUrl: 'https://www.apple.com/in/iphone-16/',
    lastVerifiedDate: '2026-03-01',
    isVerifiedInfo: true,
    deliveryConfig: {
      supportsExpress30Min: false,
      preparationMinutes: 120,
      standardDeliveryDays: 1,
      shippingFee: 0,
      freeShippingAbove: 500,
      returnPolicyDays: 7,
      serviceablePincodes: ['*']
    },
    status: 'published',
    rating: 4.9,
    reviewCount: 520,
    createdAt: '2026-01-20T10:00:00Z',
    updatedAt: '2026-03-10T12:00:00Z'
  },
  {
    id: 'prod-samsung-s25',
    name: 'Samsung Galaxy S25 (256GB, Titanium Gray)',
    kannadaName: 'ಸ್ಯಾಮ್‌ಸಂಗ್ ಗ್ಯಾಲಕ್ಸಿ S25 (256GB)',
    slug: 'samsung-galaxy-s25-256gb',
    brand: 'Samsung',
    category: 'mobiles',
    subcategory: 'Flagship 5G',
    description: 'Samsung Galaxy S25 powered by Qualcomm Snapdragon 8 Elite for Galaxy. Features an edge-to-edge Dynamic AMOLED 2X 120Hz display, ProVisual Engine 50MP triple camera system, and integrated Galaxy AI for live calls and photo studio edits.',
    shortDescription: 'Snapdragon 8 Elite, 50MP ProVisual AI camera, and 7 years of OS upgrades.',
    mrp: 82999,
    price: 77999,
    discountPercent: 6,
    costPrice: 71000,
    sku: 'MOB-SAM-S25-256-TG',
    images: [
      'https://images.unsplash.com/photo-1610945415295-d9bbf067e59c?auto=format&fit=crop&w=800&q=80'
    ],
    specifications: {
      'Processor': 'Snapdragon 8 Elite for Galaxy',
      'RAM & Storage': '12GB LPDDR5X + 256GB UFS 4.0',
      'Display': '6.2" Dynamic AMOLED 2X, 1-120Hz, 2600 nits peak',
      'Camera': '50MP Main (OIS) + 12MP Ultra-wide + 10MP Telephoto (3x)'
    },
    tags: ['samsung', 'galaxy s25', 'snapdragon 8 elite', 'android 15', 'galaxy ai'],
    stock: {
      onHand: 18,
      reserved: 2,
      available: 16,
      lowStockThreshold: 4
    },
    sellerId: 'usr-seller-1',
    sellerName: 'TrendVibe Central Hub & HealthMart',
    instagramUrl: 'https://instagram.com/trendvibestore',
    officialSourceUrl: 'https://www.samsung.com/in/smartphones/galaxy-s25/',
    lastVerifiedDate: '2026-03-01',
    isVerifiedInfo: true,
    deliveryConfig: {
      supportsExpress30Min: false,
      preparationMinutes: 120,
      standardDeliveryDays: 1,
      shippingFee: 0,
      freeShippingAbove: 500,
      returnPolicyDays: 7,
      serviceablePincodes: ['*']
    },
    status: 'published',
    rating: 4.8,
    reviewCount: 390,
    createdAt: '2026-01-22T10:00:00Z',
    updatedAt: '2026-03-10T12:00:00Z'
  },
  {
    id: 'prod-pixel-9a',
    name: 'Google Pixel 9a (128GB, Obsidian Black)',
    kannadaName: 'ಗೂಗಲ್ ಪಿಕ್ಸೆಲ್ 9a (128GB)',
    slug: 'google-pixel-9a-128gb',
    brand: 'Google',
    category: 'mobiles',
    subcategory: 'Camera Phones',
    description: 'Google Pixel 9a brings flagship Google Tensor G4 intelligence to a sleek, durable design. Industry-leading computational photography with Best Take, Audio Magic Eraser, and 7 years of Pixel Feature Drops.',
    shortDescription: 'Google Tensor G4 AI chip, advanced Night Sight photography, and clean Android 15.',
    mrp: 49999,
    price: 44999,
    discountPercent: 10,
    costPrice: 39000,
    sku: 'MOB-GGL-PX9A-128-OB',
    images: [
      'https://images.unsplash.com/photo-1598327105666-5b89351aff97?auto=format&fit=crop&w=800&q=80'
    ],
    specifications: {
      'Chipset': 'Google Tensor G4 with Titan M2 security coprocessor',
      'Display': '6.3" Actua OLED 60-120Hz',
      'Battery': '5000 mAh with 30W Fast Charging',
      'Software': 'Stock Android 15 with 7 years OS and security updates'
    },
    tags: ['google', 'pixel 9a', 'tensor g4', 'camera', 'android'],
    stock: {
      onHand: 22,
      reserved: 1,
      available: 21,
      lowStockThreshold: 5
    },
    sellerId: 'usr-seller-1',
    sellerName: 'TrendVibe Central Hub & HealthMart',
    instagramUrl: 'https://instagram.com/trendvibestore',
    officialSourceUrl: 'https://store.google.com',
    lastVerifiedDate: '2026-03-01',
    isVerifiedInfo: true,
    deliveryConfig: {
      supportsExpress30Min: false,
      preparationMinutes: 120,
      standardDeliveryDays: 1,
      shippingFee: 0,
      freeShippingAbove: 500,
      returnPolicyDays: 7,
      serviceablePincodes: ['*']
    },
    status: 'published',
    rating: 4.7,
    reviewCount: 280,
    createdAt: '2026-01-25T12:00:00Z',
    updatedAt: '2026-03-10T12:00:00Z'
  },
  {
    id: 'prod-oneplus-13',
    name: 'OnePlus 13 (256GB, Midnight Ocean)',
    kannadaName: 'ಒನ್‌ಪ್ಲಸ್ 13 (256GB)',
    slug: 'oneplus-13-256gb',
    brand: 'OnePlus',
    category: 'mobiles',
    subcategory: 'Flagship 5G',
    description: 'OnePlus 13 combines the ferocious power of Snapdragon 8 Elite with Hasselblad Gen 5 color calibration, a 6000mAh Glacier silicon-carbon battery, and 100W SUPERVOOC hyper-fast charging.',
    shortDescription: 'Snapdragon 8 Elite, Hasselblad 50MP triple sensor, 6000mAh battery, and 100W charging.',
    mrp: 69999,
    price: 64999,
    discountPercent: 7,
    costPrice: 58000,
    sku: 'MOB-1P-13-256-MO',
    images: [
      'https://images.unsplash.com/photo-1565849904461-04a58ad377e0?auto=format&fit=crop&w=800&q=80'
    ],
    specifications: {
      'Processor': 'Snapdragon 8 Elite 3nm',
      'Battery & Charging': '6000 mAh Glacier Battery + 100W Wired + 50W Wireless',
      'Camera': '50MP Sony LYT-808 + 50MP 3x Periscope Telephoto + 50MP Ultra-wide'
    },
    tags: ['oneplus 13', 'fast charging', 'hasselblad', 'snapdragon 8 elite'],
    stock: {
      onHand: 16,
      reserved: 1,
      available: 15,
      lowStockThreshold: 4
    },
    sellerId: 'usr-seller-1',
    sellerName: 'TrendVibe Central Hub & HealthMart',
    instagramUrl: 'https://instagram.com/trendvibestore',
    officialSourceUrl: 'https://www.oneplus.in',
    lastVerifiedDate: '2026-03-01',
    isVerifiedInfo: true,
    deliveryConfig: {
      supportsExpress30Min: false,
      preparationMinutes: 120,
      standardDeliveryDays: 1,
      shippingFee: 0,
      freeShippingAbove: 500,
      returnPolicyDays: 7,
      serviceablePincodes: ['*']
    },
    status: 'published',
    rating: 4.8,
    reviewCount: 310,
    createdAt: '2026-01-26T14:00:00Z',
    updatedAt: '2026-03-10T12:00:00Z'
  },

  // 4. Laptops (4 items)
  {
    id: 'prod-asus-tuf-f15',
    name: 'ASUS TUF Gaming F15 (15.6" 144Hz, Core i5 11th Gen, RTX 3050, 16GB / 512GB)',
    kannadaName: 'ಅಸೂಸ್ TUF ಗೇಮಿಂಗ್ F15 (16GB / 512GB SSD)',
    slug: 'asus-tuf-gaming-f15',
    brand: 'ASUS',
    category: 'laptops',
    subcategory: 'Gaming Laptops',
    description: 'Geared for serious gaming and real-world durability, the ASUS TUF Gaming F15 is a fully-loaded Windows 11 gaming laptop. Featuring Intel Core i5-11400H, NVIDIA GeForce RTX 3050 4GB GPU, high-speed 16GB DDR4 RAM, and self-cleaning cooling fans.',
    shortDescription: 'Intel Core i5-11400H, 4GB RTX 3050 graphics, 144Hz IPS display, and military-grade MIL-STD-810H chassis.',
    mrp: 75990,
    price: 58990,
    discountPercent: 22,
    costPrice: 51000,
    sku: 'LAP-ASUS-TUF-F15-RTX3050',
    images: [
      'https://images.unsplash.com/photo-1603302576837-37561b2e2302?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1593642632823-8f785ba67e45?auto=format&fit=crop&w=800&q=80'
    ],
    specifications: {
      'Processor': 'Intel Core i5-11400H (6 cores, 12 threads, up to 4.5 GHz)',
      'Graphics': 'NVIDIA GeForce RTX 3050 4GB GDDR6 (75W TGP)',
      'Memory': '16GB DDR4 3200MHz (expandable to 32GB)',
      'Storage': '512GB PCIe 3.0 NVMe M.2 SSD (dual slot available)',
      'Display': '15.6-inch FHD (1920 x 1080) 144Hz Anti-Glare IPS'
    },
    tags: ['asus', 'tuf gaming', 'rtx 3050', 'gaming laptop', 'intel i5'],
    stock: {
      onHand: 14,
      reserved: 1,
      available: 13,
      lowStockThreshold: 3
    },
    sellerId: 'usr-seller-1',
    sellerName: 'TrendVibe Central Hub & HealthMart',
    instagramUrl: 'https://instagram.com/trendvibestore',
    officialSourceUrl: 'https://www.asus.com/in/laptops/for-gaming/tuf-gaming/2021-asus-tuf-gaming-f15/',
    lastVerifiedDate: '2026-03-01',
    isVerifiedInfo: true,
    deliveryConfig: {
      supportsExpress30Min: false,
      preparationMinutes: 180,
      standardDeliveryDays: 2,
      shippingFee: 0,
      freeShippingAbove: 500,
      returnPolicyDays: 7,
      serviceablePincodes: ['*']
    },
    status: 'published',
    rating: 4.7,
    reviewCount: 380,
    createdAt: '2026-01-18T10:00:00Z',
    updatedAt: '2026-03-10T12:00:00Z'
  },
  {
    id: 'prod-asus-vivobook-15',
    name: 'ASUS Vivobook 15 (15.6" FHD, Core i3 12th Gen, 8GB / 512GB SSD, Thin & Light)',
    kannadaName: 'ಅಸೂಸ್ ವಿವೋಬುಕ್ 15 (8GB / 512GB SSD)',
    slug: 'asus-vivobook-15',
    brand: 'ASUS',
    category: 'laptops',
    subcategory: 'Everyday Laptops',
    description: 'Designed for daily multitasking and classroom tasks, ASUS Vivobook 15 delivers effortless performance with an Intel Core i3-1215U processor, 8GB DDR4 RAM, 180° lay-flat hinge, and physical webcam privacy shield.',
    shortDescription: 'Sleek 1.7kg lightweight laptop with Intel Core i3 12th Gen and vibrant 15.6" NanoEdge display.',
    mrp: 49990,
    price: 36990,
    discountPercent: 26,
    costPrice: 32000,
    sku: 'LAP-ASUS-VIVO-15-I3',
    images: [
      'https://images.unsplash.com/photo-1541807084-5c52b6b3adef?auto=format&fit=crop&w=800&q=80'
    ],
    specifications: {
      'Processor': 'Intel Core i3-1215U (6 cores, 8 threads, up to 4.4 GHz)',
      'Memory': '8GB DDR4 onboard (upgradable to 16GB)',
      'Storage': '512GB M.2 NVMe PCIe 3.0 SSD',
      'Weight': '1.70 kg',
      'OS': 'Windows 11 Home + MS Office Home & Student 2021'
    },
    tags: ['asus vivobook', 'intel i3', 'student laptop', 'thin and light'],
    stock: {
      onHand: 19,
      reserved: 2,
      available: 17,
      lowStockThreshold: 4
    },
    sellerId: 'usr-seller-1',
    sellerName: 'TrendVibe Central Hub & HealthMart',
    instagramUrl: 'https://instagram.com/trendvibestore',
    officialSourceUrl: 'https://www.asus.com/in/',
    lastVerifiedDate: '2026-03-01',
    isVerifiedInfo: true,
    deliveryConfig: {
      supportsExpress30Min: false,
      preparationMinutes: 180,
      standardDeliveryDays: 2,
      shippingFee: 0,
      freeShippingAbove: 500,
      returnPolicyDays: 7,
      serviceablePincodes: ['*']
    },
    status: 'published',
    rating: 4.6,
    reviewCount: 245,
    createdAt: '2026-01-19T10:00:00Z',
    updatedAt: '2026-03-10T12:00:00Z'
  },
  {
    id: 'prod-dell-inspiron-15',
    name: 'Dell Inspiron 15 3520 (15.6" 120Hz, Core i5 12th Gen, 16GB / 512GB SSD)',
    kannadaName: 'ಡೆಲ್ ಇನ್ಸ್‌ಪಿರೋನ್ 15 (16GB RAM / 512GB SSD)',
    slug: 'dell-inspiron-15-3520',
    brand: 'Dell',
    category: 'laptops',
    subcategory: 'Business',
    description: 'Keep connected to what matters most with the Dell Inspiron 15 3520. Boasts a 120Hz FHD WVA anti-glare display, Intel Core i5-1235U processor, lift-hinge ergonomics, and Dell ComfortView software to reduce harmful blue light.',
    shortDescription: 'Intel Core i5-1235U, 16GB RAM, 120Hz smooth display, and Dell ComfortView low blue light certification.',
    mrp: 64990,
    price: 49990,
    discountPercent: 23,
    costPrice: 43000,
    sku: 'LAP-DELL-INSP-3520-I5',
    images: [
      'https://images.unsplash.com/photo-1588872657578-7efd1f1555ed?auto=format&fit=crop&w=800&q=80'
    ],
    specifications: {
      'Processor': 'Intel Core i5-1235U (10 cores, up to 4.40 GHz)',
      'RAM': '16GB DDR4 2666MHz',
      'Storage': '512GB M.2 PCIe NVMe SSD',
      'Display': '15.6" FHD 1920x1080 120Hz WVA Anti-Glare'
    },
    tags: ['dell inspiron', 'intel i5', 'office laptop', '16gb ram'],
    stock: {
      onHand: 15,
      reserved: 1,
      available: 14,
      lowStockThreshold: 3
    },
    sellerId: 'usr-seller-1',
    sellerName: 'TrendVibe Central Hub & HealthMart',
    instagramUrl: 'https://instagram.com/trendvibestore',
    officialSourceUrl: 'https://www.dell.com/en-in',
    lastVerifiedDate: '2026-03-01',
    isVerifiedInfo: true,
    deliveryConfig: {
      supportsExpress30Min: false,
      preparationMinutes: 180,
      standardDeliveryDays: 2,
      shippingFee: 0,
      freeShippingAbove: 500,
      returnPolicyDays: 7,
      serviceablePincodes: ['*']
    },
    status: 'published',
    rating: 4.7,
    reviewCount: 310,
    createdAt: '2026-01-21T10:00:00Z',
    updatedAt: '2026-03-10T12:00:00Z'
  },
  {
    id: 'prod-lenovo-ideapad-slim-3',
    name: 'Lenovo IdeaPad Slim 3 (15.6" FHD, AMD Ryzen 5 7520U, 16GB LPDDR5 / 512GB SSD)',
    kannadaName: 'ಲೆನೊವೊ ಐಡಿಯಾಪ್ಯಾಡ್ ಸ್ಲಿಮ್ 3 (16GB / 512GB SSD)',
    slug: 'lenovo-ideapad-slim-3',
    brand: 'Lenovo',
    category: 'laptops',
    subcategory: 'Thin & Light',
    description: 'Travel light and smart with Lenovo IdeaPad Slim 3. Military grade durability (MIL-STD-810H), AMD Ryzen 5 7520U processor, Dolby Audio dual stereo speakers, and Rapid Charge Boost offering 2 hours battery life in just 15 minutes.',
    shortDescription: 'AMD Ryzen 5 7520U, 16GB ultra-fast LPDDR5 RAM, Dolby Audio, and MIL-STD-810H toughness.',
    mrp: 62990,
    price: 45990,
    discountPercent: 27,
    costPrice: 39000,
    sku: 'LAP-LEN-SLIM3-R5',
    images: [
      'https://images.unsplash.com/photo-1525547719571-a2d4ac8945e2?auto=format&fit=crop&w=800&q=80'
    ],
    specifications: {
      'Processor': 'AMD Ryzen 5 7520U (4C / 8T, 2.8 / 4.3GHz, 2MB L2 / 4MB L3)',
      'Memory': '16GB Soldered LPDDR5-5500',
      'Battery': 'Integrated 47Wh, Rapid Charge Boost',
      'Audio': 'Stereo speakers, 1.5W x2, Dolby Audio'
    },
    tags: ['lenovo', 'ideapad', 'ryzen 5', 'thin and light', 'dolby audio'],
    stock: {
      onHand: 17,
      reserved: 1,
      available: 16,
      lowStockThreshold: 4
    },
    sellerId: 'usr-seller-1',
    sellerName: 'TrendVibe Central Hub & HealthMart',
    instagramUrl: 'https://instagram.com/trendvibestore',
    officialSourceUrl: 'https://www.lenovo.com/in',
    lastVerifiedDate: '2026-03-01',
    isVerifiedInfo: true,
    deliveryConfig: {
      supportsExpress30Min: false,
      preparationMinutes: 180,
      standardDeliveryDays: 2,
      shippingFee: 0,
      freeShippingAbove: 500,
      returnPolicyDays: 7,
      serviceablePincodes: ['*']
    },
    status: 'published',
    rating: 4.8,
    reviewCount: 290,
    createdAt: '2026-01-23T10:00:00Z',
    updatedAt: '2026-03-10T12:00:00Z'
  },

  // 5. Cosmetics & Personal Care (4 items)
  {
    id: 'prod-minimalist-niacinamide',
    name: 'Minimalist 10% Niacinamide Face Serum with Zinc (30ml)',
    kannadaName: 'ಮಿನಿಮಲಿಸ್ಟ್ 10% ನಿಯಾಸಿನಮೈಡ್ ಫೇಸ್ ಸೀರಮ್ (30 ಮಿ.ಲೀ)',
    slug: 'minimalist-10-niacinamide-serum',
    brand: 'Minimalist',
    category: 'cosmetics-personal-care',
    subcategory: 'Skincare',
    description: 'A nourishing, daily serum with pure 10% Niacinamide (Vitamin B3) and 1% Zinc PCA to balance sebum, soothe redness, repair skin barrier, and clear acne blemishes.',
    shortDescription: '10% pure Niacinamide + 1% Zinc PCA for blemish control, pore tightening, and barrier repair.',
    mrp: 599,
    price: 549,
    discountPercent: 8,
    costPrice: 350,
    sku: 'COS-MIN-NIAC-30ML',
    images: [
      'https://images.unsplash.com/photo-1620916566398-39f1143ab7be?auto=format&fit=crop&w=800&q=80'
    ],
    specifications: {
      'Volume': '30 ml',
      'Actives': '10% Niacinamide + 1% Zinc PCA + EUK-134',
      'Skin Type': 'Oily, Combination, Acne-prone',
      'Fragrance': 'Fragrance-free, Essential oil-free'
    },
    tags: ['serum', 'niacinamide', 'skincare', 'minimalist', 'acne control'],
    stock: {
      onHand: 65,
      reserved: 2,
      available: 63,
      lowStockThreshold: 10
    },
    sellerId: 'usr-seller-1',
    sellerName: 'TrendVibe Central Hub & HealthMart',
    instagramUrl: 'https://instagram.com/trendvibestore',
    officialSourceUrl: 'https://beminimalist.co',
    lastVerifiedDate: '2026-03-01',
    isVerifiedInfo: true,
    deliveryConfig: {
      supportsExpress30Min: false,
      preparationMinutes: 60,
      standardDeliveryDays: 2,
      shippingFee: 30,
      freeShippingAbove: 499,
      returnPolicyDays: 7,
      serviceablePincodes: ['*']
    },
    status: 'published',
    rating: 4.8,
    reviewCount: 420,
    createdAt: '2026-01-28T10:00:00Z',
    updatedAt: '2026-03-10T12:00:00Z'
  },
  {
    id: 'prod-cetaphil-cleanser',
    name: 'Cetaphil Gentle Skin Cleanser (125ml)',
    kannadaName: 'ಸೆಟಾಫಿಲ್ ಜೆಂಟಲ್ ಸ್ಕಿನ್ ಕ್ಲೆನ್ಸರ್ (125 ಮಿ.ಲೀ)',
    slug: 'cetaphil-gentle-skin-cleanser',
    brand: 'Cetaphil',
    category: 'cosmetics-personal-care',
    subcategory: 'Face Cleansers',
    description: 'Dermatologist-recommended non-foaming hydrating cleanser with Vitamin B3, Pro-Vitamin B5, and Hydrating Glycerin. Preserves skin barrier against dryness and tightness.',
    shortDescription: 'Gentle, soap-free hydrating formula clinically proven for sensitive skin types.',
    mrp: 333,
    price: 299,
    discountPercent: 10,
    costPrice: 210,
    sku: 'COS-CET-CLNSR-125ML',
    images: [
      'https://images.unsplash.com/photo-1556228720-195a672e8a03?auto=format&fit=crop&w=800&q=80'
    ],
    specifications: {
      'Volume': '125 ml',
      'pH Balance': 'Soap-free, hypoallergenic, non-comedogenic',
      'Target Skin': 'Dry to normal sensitive skin'
    },
    tags: ['cetaphil', 'face wash', 'sensitive skin', 'gentle cleanser'],
    stock: {
      onHand: 80,
      reserved: 3,
      available: 77,
      lowStockThreshold: 12
    },
    sellerId: 'usr-seller-1',
    sellerName: 'TrendVibe Central Hub & HealthMart',
    instagramUrl: 'https://instagram.com/trendvibestore',
    officialSourceUrl: 'https://www.cetaphil-india.com',
    lastVerifiedDate: '2026-03-01',
    isVerifiedInfo: true,
    deliveryConfig: {
      supportsExpress30Min: false,
      preparationMinutes: 60,
      standardDeliveryDays: 2,
      shippingFee: 30,
      freeShippingAbove: 499,
      returnPolicyDays: 7,
      serviceablePincodes: ['*']
    },
    status: 'published',
    rating: 4.9,
    reviewCount: 610,
    createdAt: '2026-01-29T10:00:00Z',
    updatedAt: '2026-03-10T12:00:00Z'
  },
  {
    id: 'prod-dot-key-sunscreen',
    name: 'Dot & Key Watermelon Hyaluronic Sunscreen SPF 50+ PA+++ (50g)',
    kannadaName: 'ಡಾಟ್ & ಕೀ ವಾಟರ್‌ಮೆಲನ್ ಸನ್‌ಸ್ಕ್ರೀನ್ SPF 50+ (50 ಗ್ರಾಂ)',
    slug: 'dot-and-key-watermelon-sunscreen-spf50',
    brand: 'Dot & Key',
    category: 'cosmetics-personal-care',
    subcategory: 'Sun Protection',
    description: 'Weightless water-light fluid sunscreen enriched with Watermelon extract and Hyaluronic acid. Zero white cast, absorbs within 10 seconds, and shields against UVA, UVB, and blue light.',
    shortDescription: 'Zero white cast cooling water-fluid sunscreen with SPF 50+ and Hyaluronic acid.',
    mrp: 495,
    price: 425,
    discountPercent: 14,
    costPrice: 280,
    sku: 'COS-DNK-SUN-50G',
    images: [
      'https://images.unsplash.com/photo-1598440947619-2c35fc9aa908?auto=format&fit=crop&w=800&q=80'
    ],
    specifications: {
      'Weight': '50 g',
      'Protection': 'Broad Spectrum SPF 50+ PA+++',
      'Texture': 'Ultra-light water gel, non-greasy'
    },
    tags: ['sunscreen', 'spf 50', 'dot and key', 'hyaluronic', 'no white cast'],
    stock: {
      onHand: 75,
      reserved: 2,
      available: 73,
      lowStockThreshold: 10
    },
    sellerId: 'usr-seller-1',
    sellerName: 'TrendVibe Central Hub & HealthMart',
    instagramUrl: 'https://instagram.com/trendvibestore',
    officialSourceUrl: 'https://www.dotandkey.com',
    lastVerifiedDate: '2026-03-01',
    isVerifiedInfo: true,
    deliveryConfig: {
      supportsExpress30Min: false,
      preparationMinutes: 60,
      standardDeliveryDays: 2,
      shippingFee: 30,
      freeShippingAbove: 499,
      returnPolicyDays: 7,
      serviceablePincodes: ['*']
    },
    status: 'published',
    rating: 4.7,
    reviewCount: 350,
    createdAt: '2026-01-30T10:00:00Z',
    updatedAt: '2026-03-10T12:00:00Z'
  },
  {
    id: 'prod-maybelline-lipstick',
    name: 'Maybelline SuperStay Matte Ink Liquid Lipstick (5ml - Ruler)',
    kannadaName: 'ಮೇಬೆಲಿನ್ ಸೂಪರ್‌ಸ್ಟೇ ಮ್ಯಾಟ್ ಇಂಕ್ ಲಿಪ್‌ಸ್ಟಿಕ್ (5 ಮಿ.ಲೀ)',
    slug: 'maybelline-superstay-matte-ink-ruler',
    brand: 'Maybelline New York',
    category: 'cosmetics-personal-care',
    subcategory: 'Lip Care',
    description: 'Ink your lips in up to 16 HR saturated liquid matte color. Features a unique arrow applicator for precise application and transfer-resistant all-day smudge proof wear.',
    shortDescription: '16-hour long-lasting transfer-proof liquid matte lipstick in iconic shade Ruler 80.',
    mrp: 699,
    price: 599,
    discountPercent: 14,
    costPrice: 400,
    sku: 'COS-MAYB-INK-RULER',
    images: [
      'https://images.unsplash.com/photo-1586495777744-4413f21062fa?auto=format&fit=crop&w=800&q=80'
    ],
    specifications: {
      'Volume': '5 ml',
      'Shade': '80 Ruler (Deep Rose Plum)',
      'Finish': 'Flawless Matte',
      'Wear Time': 'Up to 16 Hours'
    },
    tags: ['lipstick', 'maybelline', 'matte', 'superstay', 'longwear'],
    stock: {
      onHand: 55,
      reserved: 1,
      available: 54,
      lowStockThreshold: 8
    },
    sellerId: 'usr-seller-1',
    sellerName: 'TrendVibe Central Hub & HealthMart',
    instagramUrl: 'https://instagram.com/trendvibestore',
    officialSourceUrl: 'https://www.maybelline.co.in',
    lastVerifiedDate: '2026-03-01',
    isVerifiedInfo: true,
    deliveryConfig: {
      supportsExpress30Min: false,
      preparationMinutes: 60,
      standardDeliveryDays: 2,
      shippingFee: 30,
      freeShippingAbove: 499,
      returnPolicyDays: 7,
      serviceablePincodes: ['*']
    },
    status: 'published',
    rating: 4.6,
    reviewCount: 480,
    createdAt: '2026-01-31T10:00:00Z',
    updatedAt: '2026-03-10T12:00:00Z'
  },

  // 6. Shoes & Footwear (4 items)
  {
    id: 'prod-nike-air-max-sc',
    name: 'Nike Air Max SC Men\'s Running & Lifestyle Shoes',
    kannadaName: 'ನೈಕ್ ಏರ್ ಮ್ಯಾಕ್ಸ್ SC ಪುರುಷರ ಶೂಗಳು',
    slug: 'nike-air-max-sc-mens-running-shoes',
    brand: 'Nike',
    category: 'shoes-footwear',
    subcategory: 'Running Shoes',
    description: 'With its easy-going lines, heritage track look and visible Air cushioning, the Nike Air Max SC is the ideal finish to any outfit. The rich mixture of materials adds depth while making it durable and lightweight for all-day wear.',
    shortDescription: 'Visible Max Air heel cushioning, breathable mesh upper, and classic waffle rubber outsole.',
    mrp: 5995,
    price: 4995,
    discountPercent: 17,
    costPrice: 3500,
    sku: 'SHO-NIKE-AMSC-WHT',
    images: [
      'https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1595950653106-6c9ebd614d3a?auto=format&fit=crop&w=800&q=80'
    ],
    variants: [
      { id: 'v-nike-uk8', name: 'Size UK 8 / White', sku: 'NIKE-AM-UK8', price: 4995, mrp: 5995, stock: 8, attributes: { size: 'UK 8', color: 'White/Red' } },
      { id: 'v-nike-uk9', name: 'Size UK 9 / White', sku: 'NIKE-AM-UK9', price: 4995, mrp: 5995, stock: 12, attributes: { size: 'UK 9', color: 'White/Red' } },
      { id: 'v-nike-uk10', name: 'Size UK 10 / White', sku: 'NIKE-AM-UK10', price: 4995, mrp: 5995, stock: 6, attributes: { size: 'UK 10', color: 'White/Red' } },
    ],
    specifications: {
      'Cushioning': 'Air Max Gas-Filled Sole Unit',
      'Upper': 'Leather, Textile and Mesh Blend',
      'Closure': 'Lace-Up',
      'Sole Material': 'Waffle Grip Rubber'
    },
    tags: ['nike', 'air max', 'running shoes', 'sneakers', 'sports'],
    stock: {
      onHand: 26,
      reserved: 1,
      available: 25,
      lowStockThreshold: 5
    },
    sellerId: 'usr-seller-1',
    sellerName: 'TrendVibe Central Hub & HealthMart',
    instagramUrl: 'https://instagram.com/trendvibestore',
    officialSourceUrl: 'https://www.nike.com/in',
    lastVerifiedDate: '2026-03-01',
    isVerifiedInfo: true,
    deliveryConfig: {
      supportsExpress30Min: false,
      preparationMinutes: 120,
      standardDeliveryDays: 2,
      shippingFee: 0,
      freeShippingAbove: 500,
      returnPolicyDays: 14,
      serviceablePincodes: ['*']
    },
    status: 'published',
    rating: 4.8,
    reviewCount: 390,
    createdAt: '2026-02-05T10:00:00Z',
    updatedAt: '2026-03-10T12:00:00Z'
  },
  {
    id: 'prod-adidas-ultraboost',
    name: 'Adidas Ultraboost Light Performance Sneaker (Core Black)',
    kannadaName: 'ಅಡೀಡಸ್ ಅಲ್ಟ್ರಾಬೂಸ್ಟ್ ಲೈಟ್ ಸ್ನೀಕರ್',
    slug: 'adidas-ultraboost-light-sneaker',
    brand: 'Adidas',
    category: 'shoes-footwear',
    subcategory: 'Running Shoes',
    description: 'Experience epic energy return with the new generation of Adidas Ultraboost Light. Featuring 30% lighter BOOST foam material and Linear Energy Push system integrated into the sole.',
    shortDescription: 'Light BOOST midsole, Continental rubber grip, and Primeknit+ forged foot-wrap.',
    mrp: 18999,
    price: 15999,
    discountPercent: 16,
    costPrice: 12000,
    sku: 'SHO-ADI-UBL-BLK',
    images: [
      'https://images.unsplash.com/photo-1587563871167-1ee9c731aefb?auto=format&fit=crop&w=800&q=80'
    ],
    specifications: {
      'Midsole': 'Light BOOST cushioning compound',
      'Outsole': 'Continental Better Rubber',
      'Drop': '10 mm (Heel: 30 mm / Forefoot: 20 mm)'
    },
    tags: ['adidas', 'ultraboost', 'marathon', 'running', 'boost'],
    stock: {
      onHand: 16,
      reserved: 1,
      available: 15,
      lowStockThreshold: 4
    },
    sellerId: 'usr-seller-1',
    sellerName: 'TrendVibe Central Hub & HealthMart',
    instagramUrl: 'https://instagram.com/trendvibestore',
    officialSourceUrl: 'https://www.adidas.co.in',
    lastVerifiedDate: '2026-03-01',
    isVerifiedInfo: true,
    deliveryConfig: {
      supportsExpress30Min: false,
      preparationMinutes: 120,
      standardDeliveryDays: 2,
      shippingFee: 0,
      freeShippingAbove: 500,
      returnPolicyDays: 14,
      serviceablePincodes: ['*']
    },
    status: 'published',
    rating: 4.9,
    reviewCount: 310,
    createdAt: '2026-02-06T10:00:00Z',
    updatedAt: '2026-03-10T12:00:00Z'
  },
  {
    id: 'prod-puma-softride-pro',
    name: 'Puma Softride Pro Casual Men\'s Trainers',
    kannadaName: 'ಪೂಮಾ ಸಾಫ್ಟ್‌ರೈಡ್ ಪ್ರೊ ಟ್ರೈನರ್ಸ್',
    slug: 'puma-softride-pro-trainers',
    brand: 'Puma',
    category: 'shoes-footwear',
    subcategory: 'Training',
    description: 'Puma Softride Pro features extreme plush cushioning with SoftFoam+ sockliner. Engineered bootie construction for instant step-in comfort and gym workout flexibility.',
    shortDescription: 'Plush SoftFoam+ footbed with lightweight shock-absorbing EVA compound midsole.',
    mrp: 4499,
    price: 2799,
    discountPercent: 38,
    costPrice: 1900,
    sku: 'SHO-PUMA-SOFTP-NVY',
    images: [
      'https://images.unsplash.com/photo-1608231387042-66d1773070a5?auto=format&fit=crop&w=800&q=80'
    ],
    specifications: {
      'Insole': 'SoftFoam+ optimal comfort',
      'Midsole': 'SOFTRIDE technology for sustained cushioning',
      'Weight': '290g per shoe'
    },
    tags: ['puma', 'softride', 'gym', 'walking shoes'],
    stock: {
      onHand: 30,
      reserved: 2,
      available: 28,
      lowStockThreshold: 6
    },
    sellerId: 'usr-seller-1',
    sellerName: 'TrendVibe Central Hub & HealthMart',
    instagramUrl: 'https://instagram.com/trendvibestore',
    officialSourceUrl: 'https://in.puma.com',
    lastVerifiedDate: '2026-03-01',
    isVerifiedInfo: true,
    deliveryConfig: {
      supportsExpress30Min: false,
      preparationMinutes: 120,
      standardDeliveryDays: 2,
      shippingFee: 0,
      freeShippingAbove: 500,
      returnPolicyDays: 14,
      serviceablePincodes: ['*']
    },
    status: 'published',
    rating: 4.6,
    reviewCount: 220,
    createdAt: '2026-02-07T10:00:00Z',
    updatedAt: '2026-03-10T12:00:00Z'
  },
  {
    id: 'prod-woodland-leather-loafers',
    name: 'Woodland Men\'s Rugged Leather Casual Loafers',
    kannadaName: 'ವುಡ್‌ಲ್ಯಾಂಡ್ ಚರ್ಮದ ಲೋಫರ್‌ಗಳು',
    slug: 'woodland-leather-casual-loafers',
    brand: 'Woodland',
    category: 'shoes-footwear',
    subcategory: 'Casual Loafers',
    description: 'Crafted with premium oiled nubuck leather, genuine hand-stitched moccasin toe, and deep grooved thermoplastic rubber outsoles for exceptional terrain traction.',
    shortDescription: 'Heavy-duty oiled nubuck leather with anti-slip rubber traction tread.',
    mrp: 4295,
    price: 3595,
    discountPercent: 16,
    costPrice: 2400,
    sku: 'SHO-WOOD-LOAF-BRN',
    images: [
      'https://images.unsplash.com/photo-1533867617858-e7b97e060509?auto=format&fit=crop&w=800&q=80'
    ],
    specifications: {
      'Upper Material': '100% Genuine Oiled Nubuck Leather',
      'Lining': 'Breathable Leather & Textile',
      'Sole': 'TPR High-Grip Outsole'
    },
    tags: ['woodland', 'leather', 'loafers', 'outdoor', 'rugged'],
    stock: {
      onHand: 20,
      reserved: 1,
      available: 19,
      lowStockThreshold: 4
    },
    sellerId: 'usr-seller-1',
    sellerName: 'TrendVibe Central Hub & HealthMart',
    instagramUrl: 'https://instagram.com/trendvibestore',
    officialSourceUrl: 'https://www.woodlandworldwide.com',
    lastVerifiedDate: '2026-03-01',
    isVerifiedInfo: true,
    deliveryConfig: {
      supportsExpress30Min: false,
      preparationMinutes: 120,
      standardDeliveryDays: 2,
      shippingFee: 0,
      freeShippingAbove: 500,
      returnPolicyDays: 14,
      serviceablePincodes: ['*']
    },
    status: 'published',
    rating: 4.7,
    reviewCount: 260,
    createdAt: '2026-02-08T10:00:00Z',
    updatedAt: '2026-03-10T12:00:00Z'
  },

  // 7. Clothes & Apparel (4 items)
  {
    id: 'prod-raymond-cotton-shirt',
    name: 'Raymond Tailored Fit Pure Cotton Formal Shirt (Sky Blue)',
    kannadaName: 'ರೇಮಂಡ್ ಪ್ಯೂರ್ ಕಾಟನ್ ಫಾರ್ಮಲ್ ಶರ್ಟ್',
    slug: 'raymond-tailored-fit-pure-cotton-shirt',
    brand: 'Raymond',
    category: 'clothes-apparel',
    subcategory: 'Formal Shirts',
    description: 'Impeccably tailored from 100% long-staple Egyptian cotton yarn with a wrinkle-resistant finish, semi-cutaway collar, and French placket for boardroom elegance.',
    shortDescription: '100% Egyptian cotton long-staple formal shirt with wrinkle-defying treatment.',
    mrp: 2499,
    price: 1899,
    discountPercent: 24,
    costPrice: 1100,
    sku: 'CLO-RAY-SHIRT-BLU-40',
    images: [
      'https://images.unsplash.com/photo-1602810318383-e386cc2a3ccf?auto=format&fit=crop&w=800&q=80'
    ],
    variants: [
      { id: 'v-ray-39', name: 'Size 39 (Slim)', sku: 'RAY-39-BLU', price: 1899, mrp: 2499, stock: 10, attributes: { size: '39 (M)', fit: 'Tailored' } },
      { id: 'v-ray-40', name: 'Size 40 (Regular)', sku: 'RAY-40-BLU', price: 1899, mrp: 2499, stock: 15, attributes: { size: '40 (L)', fit: 'Regular' } },
      { id: 'v-ray-42', name: 'Size 42 (Regular)', sku: 'RAY-42-BLU', price: 1899, mrp: 2499, stock: 8, attributes: { size: '42 (XL)', fit: 'Regular' } },
    ],
    specifications: {
      'Fabric': '100% Combed Compact Cotton',
      'Collar': 'Semi-Cutaway Collar',
      'Sleeve': 'Full Sleeve with Mitered Cuffs'
    },
    tags: ['raymond', 'formal shirt', 'cotton', 'office wear'],
    stock: {
      onHand: 33,
      reserved: 2,
      available: 31,
      lowStockThreshold: 6
    },
    sellerId: 'usr-seller-1',
    sellerName: 'TrendVibe Central Hub & HealthMart',
    instagramUrl: 'https://instagram.com/trendvibestore',
    officialSourceUrl: 'https://myraymond.com',
    lastVerifiedDate: '2026-03-01',
    isVerifiedInfo: true,
    deliveryConfig: {
      supportsExpress30Min: false,
      preparationMinutes: 120,
      standardDeliveryDays: 2,
      shippingFee: 0,
      freeShippingAbove: 500,
      returnPolicyDays: 15,
      serviceablePincodes: ['*']
    },
    status: 'published',
    rating: 4.8,
    reviewCount: 310,
    createdAt: '2026-02-09T10:00:00Z',
    updatedAt: '2026-03-10T12:00:00Z'
  },
  {
    id: 'prod-levis-511-jeans',
    name: 'Levi\'s 511 Slim Fit Stretch Denim Jeans (Dark Indigo)',
    kannadaName: 'ಲೆವೀಸ್ 511 ಸ್ಲಿಮ್ ಫಿಟ್ ಜೀನ್ಸ್',
    slug: 'levis-511-slim-fit-stretch-jeans',
    brand: 'Levi\'s',
    category: 'clothes-apparel',
    subcategory: 'Denim & Jeans',
    description: 'A modern slim with room to move. Added Levi\'s Flex stretch gives maximum mobility and optimum comfort. Sits below the waist with a slim leg from hip to ankle.',
    shortDescription: 'Classic five-pocket styling with Levi\'s Flex progressive stretch technology.',
    mrp: 3999,
    price: 2899,
    discountPercent: 28,
    costPrice: 1750,
    sku: 'CLO-LEV-511-IND-32',
    images: [
      'https://images.unsplash.com/photo-1541099649105-f69ad21f3246?auto=format&fit=crop&w=800&q=80'
    ],
    variants: [
      { id: 'v-lev-32', name: 'Waist 32 / L 32', sku: 'LEV-511-32', price: 2899, mrp: 3999, stock: 12, attributes: { waist: '32', length: '32' } },
      { id: 'v-lev-34', name: 'Waist 34 / L 32', sku: 'LEV-511-34', price: 2899, mrp: 3999, stock: 14, attributes: { waist: '34', length: '32' } },
    ],
    specifications: {
      'Composition': '99% Cotton, 1% Elastane',
      'Fit': 'Slim through seat and thigh',
      'Leg Opening': '14.5 inch'
    },
    tags: ['levis', '511', 'jeans', 'denim', 'stretch'],
    stock: {
      onHand: 26,
      reserved: 1,
      available: 25,
      lowStockThreshold: 5
    },
    sellerId: 'usr-seller-1',
    sellerName: 'TrendVibe Central Hub & HealthMart',
    instagramUrl: 'https://instagram.com/trendvibestore',
    officialSourceUrl: 'https://www.levi.in',
    lastVerifiedDate: '2026-03-01',
    isVerifiedInfo: true,
    deliveryConfig: {
      supportsExpress30Min: false,
      preparationMinutes: 120,
      standardDeliveryDays: 2,
      shippingFee: 0,
      freeShippingAbove: 500,
      returnPolicyDays: 15,
      serviceablePincodes: ['*']
    },
    status: 'published',
    rating: 4.7,
    reviewCount: 420,
    createdAt: '2026-02-10T10:00:00Z',
    updatedAt: '2026-03-10T12:00:00Z'
  },
  {
    id: 'prod-fabindia-kurta',
    name: 'FabIndia Pure Cotton Handblock Printed Long Kurta (Mustard)',
    kannadaName: 'ಫ್ಯಾಬ್‌ಇಂಡಿಯಾ ಪ್ಯೂರ್ ಕಾಟನ್ ಕುರ್ತಾ',
    slug: 'fabindia-pure-cotton-handblock-kurta',
    brand: 'FabIndia',
    category: 'clothes-apparel',
    subcategory: 'Ethnic Kurtas',
    description: 'Handcrafted in fine breathable cotton, this traditional long kurta features artisanal wooden block motifs, mandarin neck, full sleeves, and deep side welt pockets.',
    shortDescription: 'Artisan handblock print on breathable natural cotton with mandarin collar.',
    mrp: 1890,
    price: 1490,
    discountPercent: 21,
    costPrice: 850,
    sku: 'CLO-FAB-KURTA-MST-L',
    images: [
      'https://images.unsplash.com/photo-1596755094514-f87e34085b2c?auto=format&fit=crop&w=800&q=80'
    ],
    specifications: {
      'Fabric': '100% Handloom Cotton',
      'Technique': 'Artisanal Handblock Print',
      'Occasion': 'Festive & Casual Ethnic'
    },
    tags: ['fabindia', 'kurta', 'ethnic', 'handblock', 'cotton'],
    stock: {
      onHand: 24,
      reserved: 1,
      available: 23,
      lowStockThreshold: 5
    },
    sellerId: 'usr-seller-1',
    sellerName: 'TrendVibe Central Hub & HealthMart',
    instagramUrl: 'https://instagram.com/trendvibestore',
    officialSourceUrl: 'https://www.fabindia.com',
    lastVerifiedDate: '2026-03-01',
    isVerifiedInfo: true,
    deliveryConfig: {
      supportsExpress30Min: false,
      preparationMinutes: 120,
      standardDeliveryDays: 2,
      shippingFee: 0,
      freeShippingAbove: 500,
      returnPolicyDays: 15,
      serviceablePincodes: ['*']
    },
    status: 'published',
    rating: 4.8,
    reviewCount: 230,
    createdAt: '2026-02-11T10:00:00Z',
    updatedAt: '2026-03-10T12:00:00Z'
  },
  {
    id: 'prod-zara-bomber-jacket',
    name: 'Zara Oversized Structured Water-Repellent Bomber Jacket',
    kannadaName: 'ಜಾರಾ ಬಾಂಬರ್ ಜಾಕೆಟ್',
    slug: 'zara-oversized-structured-bomber-jacket',
    brand: 'Zara',
    category: 'clothes-apparel',
    subcategory: 'Jackets & Outerwear',
    description: 'Contemporary oversized bomber jacket crafted from technical water-repellent shell with ribbed trims, metallic zip front, and zipped sleeve utility pocket.',
    shortDescription: 'Urban technical water-repellent bomber with tonal ribbed trim and sleeve utility zip.',
    mrp: 6990,
    price: 5290,
    discountPercent: 24,
    costPrice: 3400,
    sku: 'CLO-ZARA-BOMB-OLV-M',
    images: [
      'https://images.unsplash.com/photo-1551028719-00167b16eac5?auto=format&fit=crop&w=800&q=80'
    ],
    specifications: {
      'Shell': 'Technical Poly Shell with Water Repellent Finish',
      'Lining': 'Smooth quilted interior insulation',
      'Pockets': '2 Front Snap Pockets + 1 Sleeve Pocket'
    },
    tags: ['zara', 'bomber jacket', 'outerwear', 'winter', 'streetwear'],
    stock: {
      onHand: 15,
      reserved: 1,
      available: 14,
      lowStockThreshold: 3
    },
    sellerId: 'usr-seller-1',
    sellerName: 'TrendVibe Central Hub & HealthMart',
    instagramUrl: 'https://instagram.com/trendvibestore',
    officialSourceUrl: 'https://www.zara.com/in',
    lastVerifiedDate: '2026-03-01',
    isVerifiedInfo: true,
    deliveryConfig: {
      supportsExpress30Min: false,
      preparationMinutes: 120,
      standardDeliveryDays: 2,
      shippingFee: 0,
      freeShippingAbove: 500,
      returnPolicyDays: 15,
      serviceablePincodes: ['*']
    },
    status: 'published',
    rating: 4.7,
    reviewCount: 180,
    createdAt: '2026-02-12T10:00:00Z',
    updatedAt: '2026-03-10T12:00:00Z'
  },

  // 8. Other Store Products (4 items)
  {
    id: 'prod-boat-airdopes-141',
    name: 'boAt Airdopes 141 ANC True Wireless Earbuds (32dB Hybrid ANC)',
    kannadaName: 'ಬೋಟ್ ಏರ್‌ಡೋಪ್ಸ್ 141 ANC ಇಯರ್‌ಬಡ್ಸ್',
    slug: 'boat-airdopes-141-anc-earbuds',
    brand: 'boAt',
    category: 'other-store-products',
    subcategory: 'Audio & Earbuds',
    description: 'Drown out distractions with 32dB Active Noise Cancellation. Powered by 10mm drivers, 42 hours total playback, ENx quad-mic calling clarity, and Beast Mode low latency for gaming.',
    shortDescription: '32dB Active Noise Cancellation, 42H playback, ASAP Fast Charge, and quad-mic calling.',
    mrp: 4490,
    price: 1699,
    discountPercent: 62,
    costPrice: 950,
    sku: 'OTH-BOAT-AD141-BLK',
    images: [
      'https://images.unsplash.com/photo-1590658268037-6bf12165a8df?auto=format&fit=crop&w=800&q=80'
    ],
    specifications: {
      'ANC Level': 'Up to 32dB Active Noise Cancellation',
      'Battery Life': 'Up to 42 Hours Total with Case',
      'Fast Charge': '10 Mins Charge = 150 Mins Playtime',
      'Water Resistance': 'IPX5 Splash and Sweat Proof'
    },
    tags: ['boat', 'earbuds', 'anc', 'wireless', 'bluetooth', 'audio'],
    stock: {
      onHand: 48,
      reserved: 2,
      available: 46,
      lowStockThreshold: 10
    },
    sellerId: 'usr-seller-1',
    sellerName: 'TrendVibe Central Hub & HealthMart',
    instagramUrl: 'https://instagram.com/trendvibestore',
    officialSourceUrl: 'https://www.boat-lifestyle.com',
    lastVerifiedDate: '2026-03-01',
    isVerifiedInfo: true,
    deliveryConfig: {
      supportsExpress30Min: false,
      preparationMinutes: 60,
      standardDeliveryDays: 2,
      shippingFee: 0,
      freeShippingAbove: 500,
      returnPolicyDays: 7,
      serviceablePincodes: ['*']
    },
    status: 'published',
    rating: 4.7,
    reviewCount: 780,
    createdAt: '2026-02-13T10:00:00Z',
    updatedAt: '2026-03-10T12:00:00Z'
  },
  {
    id: 'prod-milton-thermosteel',
    name: 'Milton Thermosteel 24-Hr Vacuum Insulated Flask (1000ml)',
    kannadaName: 'ಮಿಲ್ಟನ್ ಥರ್ಮೋಸ್ಟೀಲ್ ಬಾಟಲ್ (1000 ಮಿ.ಲೀ)',
    slug: 'milton-thermosteel-flask-1000ml',
    brand: 'Milton',
    category: 'other-store-products',
    subcategory: 'Bottles & Flasks',
    description: 'Double-walled vacuum insulation with copper coating keeps beverages piping hot or icy cold for 24 hours. Made from 100% food-grade rust-free 304 stainless steel.',
    shortDescription: 'Double-walled copper-lined vacuum flask keeping drinks hot or cold for 24 continuous hours.',
    mrp: 1295,
    price: 999,
    discountPercent: 23,
    costPrice: 580,
    sku: 'OTH-MILT-TS1000-SS',
    images: [
      'https://images.unsplash.com/photo-1602143407151-7111542de6e8?auto=format&fit=crop&w=800&q=80'
    ],
    specifications: {
      'Capacity': '1000 ml (1 Litre)',
      'Material': 'Grade 304 Stainless Steel Inner & Outer',
      'Insulation': '24 Hours Hot / Cold Retention'
    },
    tags: ['milton', 'flask', 'water bottle', 'thermosteel', 'insulated'],
    stock: {
      onHand: 40,
      reserved: 1,
      available: 39,
      lowStockThreshold: 8
    },
    sellerId: 'usr-seller-1',
    sellerName: 'TrendVibe Central Hub & HealthMart',
    instagramUrl: 'https://instagram.com/trendvibestore',
    officialSourceUrl: 'https://www.milton.in',
    lastVerifiedDate: '2026-03-01',
    isVerifiedInfo: true,
    deliveryConfig: {
      supportsExpress30Min: false,
      preparationMinutes: 60,
      standardDeliveryDays: 2,
      shippingFee: 0,
      freeShippingAbove: 500,
      returnPolicyDays: 7,
      serviceablePincodes: ['*']
    },
    status: 'published',
    rating: 4.8,
    reviewCount: 460,
    createdAt: '2026-02-14T10:00:00Z',
    updatedAt: '2026-03-10T12:00:00Z'
  },
  {
    id: 'prod-portronics-65w-gan',
    name: 'Portronics Adapto 65W GaN Dual Type-C + USB Fast Wall Charger',
    kannadaName: 'ಪೋರ್ಟ್ರಾನಿಕ್ಸ್ 65W GaN ವೇಗದ ಚಾರ್ಜರ್',
    slug: 'portronics-adapto-65w-gan-charger',
    brand: 'Portronics',
    category: 'other-store-products',
    subcategory: 'Fast Chargers',
    description: 'Powered by Gallium Nitride (GaN) technology, this compact multi-device wall adapter powers laptops, MacBooks, tablets, and phones simultaneously with Power Delivery 3.0 and Quick Charge 4+ support.',
    shortDescription: 'Gallium Nitride 65W dual Type-C and USB-A power adapter for MacBooks, laptops, and 5G phones.',
    mrp: 3499,
    price: 1999,
    discountPercent: 43,
    costPrice: 1100,
    sku: 'OTH-PORT-GAN65-WHT',
    images: [
      'https://images.unsplash.com/photo-1583863788434-e58a36330cf0?auto=format&fit=crop&w=800&q=80'
    ],
    specifications: {
      'Max Output': '65W Power Delivery (GaN III)',
      'Ports': '2 x USB-C (65W Max each) + 1 x USB-A (30W Max)',
      'Safety': 'Over-voltage, short-circuit, and smart temperature regulation'
    },
    tags: ['portronics', 'gan charger', 'fast charger', 'type-c', '65w'],
    stock: {
      onHand: 35,
      reserved: 1,
      available: 34,
      lowStockThreshold: 6
    },
    sellerId: 'usr-seller-1',
    sellerName: 'TrendVibe Central Hub & HealthMart',
    instagramUrl: 'https://instagram.com/trendvibestore',
    officialSourceUrl: 'https://www.portronics.com',
    lastVerifiedDate: '2026-03-01',
    isVerifiedInfo: true,
    deliveryConfig: {
      supportsExpress30Min: false,
      preparationMinutes: 60,
      standardDeliveryDays: 2,
      shippingFee: 0,
      freeShippingAbove: 500,
      returnPolicyDays: 7,
      serviceablePincodes: ['*']
    },
    status: 'published',
    rating: 4.8,
    reviewCount: 330,
    createdAt: '2026-02-15T10:00:00Z',
    updatedAt: '2026-03-10T12:00:00Z'
  },
  {
    id: 'prod-solimo-cushion',
    name: 'Solimo Ergonomic Memory Foam Orthopedic Coccyx Cushion',
    kannadaName: 'ಸೋಲಿಮೋ ಮೆಮೊರಿ ಫೋಮ್ ಆಸನ ಕುಶನ್',
    slug: 'solimo-orthopedic-coccyx-memory-foam-cushion',
    brand: 'Solimo',
    category: 'other-store-products',
    subcategory: 'Ergonomic Living',
    description: 'High-density 100% therapeutic grade memory foam with U-shaped ergonomic cut-out relieves spinal and tailbone pressure during long work-from-home or office seating hours.',
    shortDescription: 'Orthopedic U-cut contour design with breathable mesh cover and non-slip rubberized bottom.',
    mrp: 1999,
    price: 1199,
    discountPercent: 40,
    costPrice: 650,
    sku: 'OTH-SOL-CUSH-BLK',
    images: [
      'https://images.unsplash.com/photo-1584100936595-c0654b55a2e2?auto=format&fit=crop&w=800&q=80'
    ],
    specifications: {
      'Core': '100% High-Density Slow Rebound Memory Foam',
      'Cover': 'Removable Machine Washable 3D Breathable Mesh',
      'Dimensions': '45 x 35 x 7 cm'
    },
    tags: ['cushion', 'ergonomic', 'memory foam', 'orthopedic', 'office chair'],
    stock: {
      onHand: 28,
      reserved: 1,
      available: 27,
      lowStockThreshold: 5
    },
    sellerId: 'usr-seller-1',
    sellerName: 'TrendVibe Central Hub & HealthMart',
    instagramUrl: 'https://instagram.com/trendvibestore',
    officialSourceUrl: 'https://trendvibe.internal/products/solimo',
    lastVerifiedDate: '2026-03-01',
    isVerifiedInfo: true,
    deliveryConfig: {
      supportsExpress30Min: false,
      preparationMinutes: 60,
      standardDeliveryDays: 2,
      shippingFee: 0,
      freeShippingAbove: 500,
      returnPolicyDays: 7,
      serviceablePincodes: ['*']
    },
    status: 'published',
    rating: 4.7,
    reviewCount: 290,
    createdAt: '2026-02-16T10:00:00Z',
    updatedAt: '2026-03-10T12:00:00Z'
  }
];

export const INITIAL_DOCUMENTS: SellerDocument[] = [
  {
    id: 'doc-dolo-guide',
    sellerId: 'usr-seller-1',
    productId: 'prod-dolo-650',
    productName: 'Dolo 650 Tablet (Paracetamol 650mg)',
    category: 'medicines-healthcare',
    fileName: 'Dolo-650-Clinical-Monograph-and-Dosage.pdf',
    fileSizeBytes: 485200,
    fileType: 'application/pdf',
    extractedText: 'Dolo 650 Monograph: Active Pharmaceutical Ingredient: Paracetamol IP 650mg. Mechanism: Antipyretic action through hypothalamic heat-regulating center. Analgesic through inhibition of prostaglandin synthesis in CNS. Dosage: Adults: 1 tablet every 4 to 6 hours as needed. Maximum dose: 4000mg (not exceeding 6 tablets in 24 hours). Avoid alcohol. Keep 4-hour gap between doses. Safe in pregnancy under physician supervision.',
    sections: [
      {
        title: 'Dosage and Administration',
        content: 'Adults: 1 tablet every 4 to 6 hours. Do not exceed 4000mg per 24 hours (maximum 6 tablets). Minimum interval between doses is 4 hours.'
      },
      {
        title: 'Safety Warnings & Contraindications',
        content: 'Do not combine with other paracetamol-containing remedies. Severe liver damage may occur if daily max dose is exceeded or taken with chronic alcohol.'
      }
    ],
    uploadedAt: '2026-02-01T10:00:00Z',
    status: 'indexed'
  },
  {
    id: 'doc-ors-manual',
    sellerId: 'usr-seller-1',
    productId: 'prod-electral-ors',
    productName: 'Electral WHO-ORS Powder Sachet (21.8g)',
    category: 'medicines-healthcare',
    fileName: 'Electral-WHO-ORS-Reconstitution-Standard.pdf',
    fileSizeBytes: 312000,
    fileType: 'application/pdf',
    extractedText: 'Electral Powder WHO Formulation: Dissolve the complete 21.8g sachet in exactly 1 litre (1000ml) of clean drinking or boiled and cooled water. Stir well until powder is completely dissolved. Do not boil the prepared solution. Use within 24 hours of preparation. Ideal for heat exhaustion, dehydration, and pediatric rehydration.',
    sections: [
      {
        title: 'Preparation & Mixing Directions',
        content: 'Pour the entire 21.8g contents of the sachet into exactly 1000 ml of clean drinking water. Mix until fully dissolved. Discard unused portion after 24 hours.'
      },
      {
        title: 'Dosage By Age',
        content: 'Infants: 50-100ml after each loose stool. Children (2-10 yrs): 100-200ml. Adults: As much as needed to quench thirst, typically 1 to 2 litres daily.'
      }
    ],
    uploadedAt: '2026-02-02T11:00:00Z',
    status: 'indexed'
  },
  {
    id: 'doc-ragi-idli-nutrition',
    sellerId: 'usr-seller-1',
    productId: 'prod-ragi-idli',
    productName: 'Fresh Ragi Idli (Pack of 4 with Chutney & Sambar)',
    category: 'food',
    fileName: 'Ragi-Idli-Sprouted-Millet-Nutritional-Analysis.pdf',
    fileSizeBytes: 228000,
    fileType: 'application/pdf',
    extractedText: 'TrendVibe Kitchen Sprouted Ragi Idli: Nutritional Facts per 4-piece serving: Calories 210 kcal, Carbohydrates 42g, Dietary Fiber 7.2g, Protein 6.8g, Calcium 344mg (approx 34% RDA), Iron 3.9mg. Certified Gluten-Free preparation environment. Fermented naturally for 14 hours for probiotic gut benefit.',
    sections: [
      {
        title: 'Nutritional Breakdown',
        content: 'Energy: 210 kcal, Fiber: 7.2g, Protein: 6.8g, Calcium: 344mg, Iron: 3.9mg per 4 pieces. Low glycemic index suitable for diabetes management.'
      },
      {
        title: 'Allergen & Hygiene Declaration',
        content: 'No refined flour (maida), zero artificial preservatives. Contains tree nuts in coconut chutney.'
      }
    ],
    uploadedAt: '2026-02-05T09:00:00Z',
    status: 'indexed'
  },
  {
    id: 'doc-asus-tuf-spec',
    sellerId: 'usr-seller-1',
    productId: 'prod-asus-tuf-f15',
    productName: 'ASUS TUF Gaming F15',
    category: 'laptops',
    fileName: 'ASUS-TUF-F15-Thermal-and-Expansion-Guide.pdf',
    fileSizeBytes: 620000,
    fileType: 'application/pdf',
    extractedText: 'ASUS TUF Gaming F15 Service Specification: Thermal system: Dual 83-blade Fans with self-cleaning anti-dust tunnels. Expansion: 2 x SO-DIMM DDR4 slots (supports up to 32GB 3200MHz), 2 x PCIe M.2 NVMe SSD slots. Display: 144Hz Adaptive-Sync IPS panel. Military durability: MIL-STD-810H shock and humidity certified.',
    sections: [
      {
        title: 'Upgradeability & Memory Support',
        content: 'Supports up to 32GB DDR4 dual-channel memory across two SO-DIMM slots. Secondary M.2 NVMe slot open for additional SSD storage up to 2TB.'
      },
      {
        title: 'Warranty & Service Coverage',
        content: '1 Year ASUS On-Site Domestic Warranty across 200+ Indian service centers. Accidental damage protection eligibility.'
      }
    ],
    uploadedAt: '2026-02-10T14:00:00Z',
    status: 'indexed'
  }
];

export const INITIAL_ORDERS: Order[] = [
  {
    id: 'ord-tv-8841',
    orderNumber: 'TV-2026-8841',
    customerId: 'usr-customer-1',
    customerName: 'Chandan Kumar',
    customerEmail: 'chandanchanduchandan9@gmail.com',
    customerPhone: '+91 98450 12345',
    shippingAddress: {
      id: 'addr-1',
      name: 'Chandan Kumar',
      phone: '+91 98450 12345',
      street: 'Flat 402, Green Glen Heights, Bellandur Outer Ring Road',
      city: 'Bangalore',
      state: 'Karnataka',
      pincode: '560103',
      landmark: 'Near EcoSpace Tech Park',
      isDefault: true,
    },
    items: [
      {
        productId: 'prod-dolo-650',
        productName: 'Dolo 650 Tablet (Paracetamol 650mg)',
        sku: 'MED-DOLO-650-15T',
        price: 30,
        mrp: 34,
        quantity: 2,
        image: 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?auto=format&fit=crop&w=800&q=80',
        category: 'medicines-healthcare',
        sellerId: 'usr-seller-1',
        sellerName: 'TrendVibe Central Hub & HealthMart'
      },
      {
        productId: 'prod-electral-ors',
        productName: 'Electral WHO-ORS Powder Sachet (21.8g)',
        sku: 'MED-ELECTRAL-21G',
        price: 21,
        mrp: 23,
        quantity: 3,
        image: 'https://images.unsplash.com/photo-1576092768241-dec231879fc3?auto=format&fit=crop&w=800&q=80',
        category: 'medicines-healthcare',
        sellerId: 'usr-seller-1',
        sellerName: 'TrendVibe Central Hub & HealthMart'
      }
    ],
    subtotal: 123,
    discount: 0,
    tax: 6,
    shippingFee: 25,
    totalAmount: 154,
    paymentMethod: 'ONLINE_RAZORPAY',
    paymentStatus: 'PAID',
    paymentId: 'pay_rzp_mock_884192',
    orderStatus: 'OUT_FOR_DELIVERY',
    isExpress30Min: true,
    estimatedDeliveryTime: 'Within 18 mins (Express Delivery Rider En Route)',
    aiAssisted: true,
    aiConversationSummary: 'Customer enquired via Zyro AI voice agent in Kannada & English about fast dehydration & headache relief. Zyro AI validated Bangalore 560103 express serviceability, checked stock, readback order summary and customer authorized instant checkout.',
    timeline: [
      {
        status: 'ORDER_PLACED',
        timestamp: '2026-10-18T10:15:00Z',
        note: 'Order confirmed via Zyro AI Express Checkout',
        actor: 'Zyro AI Assistant'
      },
      {
        status: 'ACCEPTED',
        timestamp: '2026-10-18T10:16:30Z',
        note: 'Seller accepted and verified batch expiry for Dolo 650 & Electral',
        actor: 'Priya Sharma (Seller)'
      },
      {
        status: 'PREPARING',
        timestamp: '2026-10-18T10:18:00Z',
        note: 'Sealed in tamper-proof thermal pouch with prescription receipt',
        actor: 'Hub Fulfillment'
      },
      {
        status: 'READY_FOR_DISPATCH',
        timestamp: '2026-10-18T10:22:00Z',
        note: 'Assigned to Express Electric Rider #EV-42 (Kiran M.)',
        actor: 'Automated Dispatch'
      },
      {
        status: 'OUT_FOR_DELIVERY',
        timestamp: '2026-10-18T10:25:00Z',
        note: 'Rider is 1.4 km away on Bellandur ORR approaching Green Glen Heights',
        actor: 'Delivery Partner'
      }
    ],
    createdAt: '2026-10-18T10:15:00Z',
    updatedAt: '2026-10-18T10:25:00Z'
  },
  {
    id: 'ord-tv-8835',
    orderNumber: 'TV-2026-8835',
    customerId: 'usr-customer-1',
    customerName: 'Chandan Kumar',
    customerEmail: 'chandanchanduchandan9@gmail.com',
    customerPhone: '+91 98450 12345',
    shippingAddress: {
      id: 'addr-1',
      name: 'Chandan Kumar',
      phone: '+91 98450 12345',
      street: 'Flat 402, Green Glen Heights, Bellandur Outer Ring Road',
      city: 'Bangalore',
      state: 'Karnataka',
      pincode: '560103',
      landmark: 'Near EcoSpace Tech Park',
      isDefault: true,
    },
    items: [
      {
        productId: 'prod-ragi-idli',
        productName: 'Fresh Ragi Idli (Pack of 4 with Chutney & Sambar)',
        sku: 'FOOD-RAGI-IDLI-4P',
        price: 79,
        mrp: 90,
        quantity: 2,
        image: 'https://images.unsplash.com/photo-1589301760014-d929f3979dbc?auto=format&fit=crop&w=800&q=80',
        category: 'food',
        sellerId: 'usr-seller-1',
        sellerName: 'TrendVibe Central Hub & HealthMart'
      },
      {
        productId: 'prod-peanut-smoothie',
        productName: 'Peanut Banana Protein Smoothie (Fresh 350ml Jar)',
        sku: 'FOOD-SMOOTHIE-350ML',
        price: 110,
        mrp: 130,
        quantity: 1,
        image: 'https://images.unsplash.com/photo-1553530666-ba11a7da3888?auto=format&fit=crop&w=800&q=80',
        category: 'food',
        sellerId: 'usr-seller-1',
        sellerName: 'TrendVibe Central Hub & HealthMart'
      }
    ],
    subtotal: 268,
    discount: 20,
    tax: 12,
    shippingFee: 0,
    totalAmount: 260,
    paymentMethod: 'COD',
    paymentStatus: 'PAID',
    orderStatus: 'DELIVERED',
    isExpress30Min: true,
    aiAssisted: false,
    timeline: [
      {
        status: 'ORDER_PLACED',
        timestamp: '2026-10-17T08:30:00Z',
        note: 'Order placed via Web Storefront',
        actor: 'Chandan Kumar'
      },
      {
        status: 'ACCEPTED',
        timestamp: '2026-10-17T08:32:00Z',
        note: 'Kitchen confirmed steam station capacity',
        actor: 'TrendVibe Kitchen'
      },
      {
        status: 'PREPARING',
        timestamp: '2026-10-17T08:34:00Z',
        note: 'Fresh ragi batter steaming & cold-pressing smoothie jar',
        actor: 'Kitchen Chef'
      },
      {
        status: 'READY_FOR_DISPATCH',
        timestamp: '2026-10-17T08:45:00Z',
        note: 'Packed in insulated container with hot sambar container',
        actor: 'Packaging Desk'
      },
      {
        status: 'SHIPPED',
        timestamp: '2026-10-17T08:48:00Z',
        note: 'Handed to express delivery fleet',
        actor: 'Dispatch Station'
      },
      {
        status: 'OUT_FOR_DELIVERY',
        timestamp: '2026-10-17T08:50:00Z',
        note: 'Rider arriving at customer location',
        actor: 'Rider Suresh'
      },
      {
        status: 'DELIVERED',
        timestamp: '2026-10-17T09:02:00Z',
        note: 'Delivered in 28 minutes. Cash on Delivery ₹260 collected and verified via OTP.',
        actor: 'Rider Suresh'
      }
    ],
    createdAt: '2026-10-17T08:30:00Z',
    updatedAt: '2026-10-17T09:02:00Z'
  }
];

export const INITIAL_INVENTORY_MOVEMENTS: InventoryMovement[] = [
  {
    id: 'mov-1',
    productId: 'prod-dolo-650',
    productName: 'Dolo 650 Tablet (Paracetamol 650mg)',
    sku: 'MED-DOLO-650-15T',
    type: 'INITIAL_STOCK',
    delta: 150,
    previousAvailable: 0,
    newAvailable: 150,
    timestamp: '2026-10-15T09:00:00Z',
    actor: 'Inventory Inbound (Batch #M26-89)',
    note: 'Initial factory receipt from Micro Labs distributor'
  },
  {
    id: 'mov-2',
    productId: 'prod-dolo-650',
    productName: 'Dolo 650 Tablet (Paracetamol 650mg)',
    sku: 'MED-DOLO-650-15T',
    type: 'RESERVATION_HOLD',
    delta: -2,
    previousAvailable: 150,
    newAvailable: 148,
    timestamp: '2026-10-18T10:14:30Z',
    actor: 'Checkout System',
    orderId: 'ord-tv-8841',
    note: 'Temporary stock reservation hold during checkout'
  },
  {
    id: 'mov-3',
    productId: 'prod-dolo-650',
    productName: 'Dolo 650 Tablet (Paracetamol 650mg)',
    sku: 'MED-DOLO-650-15T',
    type: 'ORDER_COMMITTED',
    delta: -3,
    previousAvailable: 148,
    newAvailable: 145,
    timestamp: '2026-10-18T10:15:05Z',
    actor: 'Payment Gateway Webhook',
    orderId: 'ord-tv-8841',
    note: 'Payment captured, stock committed and deducted'
  }
];
