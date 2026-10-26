import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import {
  CategoryInfo,
  Product,
  SellerDocument,
  User,
  Order,
  InventoryMovement,
  ProductEnquiry,
  DemandFunnelMetrics,
  SellerFinanceMetrics,
  OrderStatus,
} from '../src/types/index.ts';
import {
  INITIAL_CATEGORIES,
  INITIAL_USERS,
  INITIAL_PRODUCTS,
  INITIAL_DOCUMENTS,
  INITIAL_ORDERS,
  INITIAL_INVENTORY_MOVEMENTS,
} from './data.ts';

const DATA_DIR = path.resolve(process.cwd(), 'data');
const DB_FILE = path.join(DATA_DIR, 'store_db.json');

interface AnalyticsEventRecord {
  id: string;
  eventType: string;
  productId?: string;
  category?: string;
  sellerId?: string;
  timestamp: string;
  metadata?: Record<string, any>;
}

interface DatabaseSchema {
  categories: CategoryInfo[];
  users: User[];
  products: Product[];
  documents: SellerDocument[];
  orders: Order[];
  movements: InventoryMovement[];
  enquiries: ProductEnquiry[];
  analyticsEvents: AnalyticsEventRecord[];
}

class StoreDatabase {
  private data: DatabaseSchema;

  constructor() {
    this.data = this.loadData();
  }

  private loadData(): DatabaseSchema {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }

    if (fs.existsSync(DB_FILE)) {
      try {
        const raw = fs.readFileSync(DB_FILE, 'utf-8');
        const parsed = JSON.parse(raw);
        // Ensure all collections exist
        return {
          categories: parsed.categories || INITIAL_CATEGORIES,
          users: parsed.users || INITIAL_USERS,
          products: parsed.products || INITIAL_PRODUCTS,
          documents: parsed.documents || INITIAL_DOCUMENTS,
          orders: parsed.orders || INITIAL_ORDERS,
          movements: parsed.movements || INITIAL_INVENTORY_MOVEMENTS,
          enquiries: parsed.enquiries || [],
          analyticsEvents: parsed.analyticsEvents || [],
        };
      } catch (err) {
        console.error('Error reading store_db.json, reinitializing from defaults:', err);
      }
    }

    // Default bootstrap
    const initialDb: DatabaseSchema = {
      categories: INITIAL_CATEGORIES,
      users: INITIAL_USERS,
      products: INITIAL_PRODUCTS,
      documents: INITIAL_DOCUMENTS,
      orders: INITIAL_ORDERS,
      movements: INITIAL_INVENTORY_MOVEMENTS,
      enquiries: [
        {
          id: 'enq-dolo-1',
          productId: 'prod-dolo-650',
          productName: 'Dolo 650 Tablet (Paracetamol 650mg)',
          sellerId: 'usr-seller-1',
          customerId: 'usr-customer-1',
          customerName: 'Chandan Kumar',
          status: 'RESOLVED',
          channel: 'ZYRO_AI_CALL',
          lastMessageSnippet: 'Verified Dolo 650 dosage: maximum 4 tablets daily for adults with 4-6 hr gap.',
          messages: [
            {
              id: 'm1',
              sender: 'customer',
              senderName: 'Chandan Kumar',
              text: 'How many Dolo 650 tablets can I take in a day for viral fever?',
              kannadaText: 'ವೈರಲ್ ಜ್ವರಕ್ಕೆ ನಾನು ದಿನಕ್ಕೆ ಎಷ್ಟು ಡೋಲೋ 650 ಮಾತ್ರೆಗಳನ್ನು ತೆಗೆದುಕೊಳ್ಳಬಹುದು?',
              timestamp: '2026-10-18T10:10:00Z',
            },
            {
              id: 'm2',
              sender: 'zyro_ai',
              senderName: 'Zyro AI Shopping Assistant',
              text: 'According to the verified manufacturer monograph, adults can take 1 tablet every 4 to 6 hours as needed. Do not exceed 4000mg (6 tablets) in 24 hours. Always consult a physician if fever lasts beyond 3 days.',
              kannadaText: 'ಪರಿಶೀಲಿಸಿದ ವೈದ್ಯಕೀಯ ದಾಖಲೆಯ ಪ್ರಕಾರ, ವಯಸ್ಕರು ಅಗತ್ಯವಿದ್ದಾಗ ಪ್ರತಿ 4 ರಿಂದ 6 ಗಂಟೆಗಳಿಗೊಮ್ಮೆ 1 ಮಾತ್ರೆಯನ್ನು ತೆಗೆದುಕೊಳ್ಳಬಹುದು. 24 ಗಂಟೆಗಳಲ್ಲಿ 6 ಮಾತ್ರೆಗಳನ್ನು ಮೀರಬಾರದು.',
              citations: ['Dolo-650-Clinical-Monograph-and-Dosage.pdf (Section 1: Dosage & Administration)'],
              timestamp: '2026-10-18T10:10:15Z',
            },
          ],
          createdAt: '2026-10-18T10:10:00Z',
          updatedAt: '2026-10-18T10:10:15Z',
        },
      ],
      analyticsEvents: [
        { id: 'ev-1', eventType: 'IMPRESSION', productId: 'prod-dolo-650', category: 'medicines-healthcare', sellerId: 'usr-seller-1', timestamp: '2026-10-18T09:00:00Z' },
        { id: 'ev-2', eventType: 'INSTAGRAM_CLICK', productId: 'prod-iphone-16', category: 'mobiles', sellerId: 'usr-seller-1', timestamp: '2026-10-18T09:15:00Z' },
        { id: 'ev-3', eventType: 'ENQUIRY_START', productId: 'prod-dolo-650', category: 'medicines-healthcare', sellerId: 'usr-seller-1', timestamp: '2026-10-18T10:09:00Z' },
        { id: 'ev-4', eventType: 'AI_CHAT_COMPLETED', productId: 'prod-dolo-650', category: 'medicines-healthcare', sellerId: 'usr-seller-1', timestamp: '2026-10-18T10:10:15Z' },
        { id: 'ev-5', eventType: 'ADD_TO_CART', productId: 'prod-dolo-650', category: 'medicines-healthcare', sellerId: 'usr-seller-1', timestamp: '2026-10-18T10:12:00Z' },
        { id: 'ev-6', eventType: 'CHECKOUT_START', productId: 'prod-dolo-650', category: 'medicines-healthcare', sellerId: 'usr-seller-1', timestamp: '2026-10-18T10:14:00Z' },
        { id: 'ev-7', eventType: 'ORDER_PLACED', productId: 'prod-dolo-650', category: 'medicines-healthcare', sellerId: 'usr-seller-1', timestamp: '2026-10-18T10:15:00Z' },
      ],
    };

    this.saveDataDirect(initialDb);
    return initialDb;
  }

  private saveData() {
    this.saveDataDirect(this.data);
  }

  private saveDataDirect(db: DatabaseSchema) {
    try {
      const tempPath = `${DB_FILE}.tmp.${Date.now()}`;
      fs.writeFileSync(tempPath, JSON.stringify(db, null, 2), 'utf-8');
      fs.renameSync(tempPath, DB_FILE);
    } catch (err) {
      console.error('Error saving store_db.json:', err);
    }
  }

  // --- Users & Auth ---
  public getUsers(): User[] {
    return this.data.users;
  }

  public getUserById(id: string): User | undefined {
    return this.data.users.find((u) => u.id === id);
  }

  public getUserByEmail(email: string): User | undefined {
    return this.data.users.find((u) => u.email.toLowerCase() === email.toLowerCase());
  }

  public createUser(userData: Omit<User, 'id' | 'createdAt'>): User {
    const newUser: User = {
      ...userData,
      id: `usr-${crypto.randomUUID().slice(0, 8)}`,
      createdAt: new Date().toISOString(),
    };
    this.data.users.push(newUser);
    this.saveData();
    return newUser;
  }

  public updateUser(id: string, updates: Partial<User>): User | undefined {
    const user = this.getUserById(id);
    if (!user) return undefined;
    Object.assign(user, updates);
    this.saveData();
    return user;
  }

  // --- Categories ---
  public getCategories(): CategoryInfo[] {
    return this.data.categories;
  }

  // --- Products ---
  public getProducts(options?: {
    category?: string;
    search?: string;
    sellerId?: string;
    status?: string;
    minPrice?: number;
    maxPrice?: number;
    sortBy?: 'price-asc' | 'price-desc' | 'rating' | 'newest';
  }): Product[] {
    let result = [...this.data.products];

    if (options?.category && options.category !== 'all') {
      result = result.filter((p) => p.category === options.category);
    }

    if (options?.sellerId) {
      result = result.filter((p) => p.sellerId === options.sellerId);
    }

    if (options?.status && options.status !== 'all') {
      result = result.filter((p) => p.status === options.status);
    } else if (!options?.status) {
      // By default for public storefront, return published items unless explicitly asked
      result = result.filter((p) => p.status === 'published');
    }

    if (options?.search) {
      const q = options.search.toLowerCase();
      result = result.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          (p.kannadaName && p.kannadaName.toLowerCase().includes(q)) ||
          p.brand.toLowerCase().includes(q) ||
          p.description.toLowerCase().includes(q) ||
          p.tags.some((t) => t.toLowerCase().includes(q))
      );
    }

    if (options?.minPrice !== undefined) {
      result = result.filter((p) => p.price >= (options.minPrice || 0));
    }
    if (options?.maxPrice !== undefined) {
      result = result.filter((p) => p.price <= (options.maxPrice || Infinity));
    }

    if (options?.sortBy) {
      if (options.sortBy === 'price-asc') result.sort((a, b) => a.price - b.price);
      else if (options.sortBy === 'price-desc') result.sort((a, b) => b.price - a.price);
      else if (options.sortBy === 'rating') result.sort((a, b) => b.rating - a.rating);
      else if (options.sortBy === 'newest')
        result.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    }

    return result;
  }

  public getProductById(id: string): Product | undefined {
    return this.data.products.find((p) => p.id === id || p.slug === id);
  }

  public createProduct(productData: Partial<Product>, seller: User): Product {
    const id = `prod-${crypto.randomUUID().slice(0, 8)}`;
    const now = new Date().toISOString();
    const onHand = Number(productData.stock?.onHand ?? 10);
    const lowStockThreshold = Number(productData.stock?.lowStockThreshold ?? 5);

    const newProduct: Product = {
      id,
      name: productData.name || 'New Product',
      kannadaName: productData.kannadaName || '',
      slug: (productData.name || 'new-product').toLowerCase().replace(/[^a-z0-9]+/g, '-'),
      brand: productData.brand || seller.storeName || 'TrendVibe',
      category: productData.category || 'other-store-products',
      subcategory: productData.subcategory || 'General',
      description: productData.description || '',
      shortDescription: productData.shortDescription || '',
      mrp: Number(productData.mrp || 100),
      price: Number(productData.price || 90),
      discountPercent: productData.mrp && productData.price
        ? Math.round(((productData.mrp - productData.price) / productData.mrp) * 100)
        : 0,
      costPrice: Number(productData.costPrice || (productData.price ? productData.price * 0.7 : 60)),
      sku: productData.sku || `SKU-${Date.now().toString().slice(-6)}`,
      images: productData.images && productData.images.length > 0
        ? productData.images
        : ['https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=800&q=80'],
      variants: productData.variants || [],
      specifications: productData.specifications || {},
      tags: productData.tags || [],
      stock: {
        onHand,
        reserved: 0,
        available: onHand,
        lowStockThreshold,
      },
      sellerId: seller.id,
      sellerName: seller.storeName || seller.name,
      instagramUrl: productData.instagramUrl || '',
      officialSourceUrl: productData.officialSourceUrl || '',
      lastVerifiedDate: productData.lastVerifiedDate || now.slice(0, 10),
      isVerifiedInfo: productData.isVerifiedInfo ?? false,
      deliveryConfig: productData.deliveryConfig || {
        supportsExpress30Min: productData.category === 'medicines-healthcare' || productData.category === 'food',
        preparationMinutes: 15,
        standardDeliveryDays: 2,
        shippingFee: 25,
        freeShippingAbove: 499,
        returnPolicyDays: 7,
        serviceablePincodes: ['*'],
      },
      status: productData.status || 'published',
      rating: 5.0,
      reviewCount: 1,
      createdAt: now,
      updatedAt: now,
    };

    this.data.products.push(newProduct);

    // Initial stock movement
    this.recordMovement({
      productId: newProduct.id,
      productName: newProduct.name,
      sku: newProduct.sku,
      type: 'INITIAL_STOCK',
      delta: onHand,
      previousAvailable: 0,
      newAvailable: onHand,
      actor: seller.name,
      note: 'Product created with initial stock',
    });

    this.saveData();
    return newProduct;
  }

  public updateProduct(id: string, updates: Partial<Product>, seller: User): Product | undefined {
    const product = this.getProductById(id);
    if (!product) return undefined;

    // Check permissions: seller must own product or be admin
    if (seller.role !== 'admin' && product.sellerId !== seller.id) {
      throw new Error('Unauthorized to modify this product');
    }

    const previousAvailable = product.stock.available;

    // Handle stock updates if onHand changed
    if (updates.stock?.onHand !== undefined && updates.stock.onHand !== product.stock.onHand) {
      const diff = updates.stock.onHand - product.stock.onHand;
      product.stock.onHand = updates.stock.onHand;
      product.stock.available = product.stock.onHand - product.stock.reserved;

      this.recordMovement({
        productId: product.id,
        productName: product.name,
        sku: product.sku,
        type: diff > 0 ? 'MANUAL_RESTOCK' : 'INVENTORY_ADJUSTMENT',
        delta: diff,
        previousAvailable,
        newAvailable: product.stock.available,
        actor: seller.name,
        note: `Manual stock adjustment of ${diff > 0 ? '+' : ''}${diff} units`,
      });
    }

    if (updates.price !== undefined && updates.mrp !== undefined) {
      updates.discountPercent = Math.round(((updates.mrp - updates.price) / updates.mrp) * 100);
    }

    Object.assign(product, updates, { updatedAt: new Date().toISOString() });
    this.saveData();
    return product;
  }

  public deleteProduct(id: string, seller: User): boolean {
    const idx = this.data.products.findIndex((p) => p.id === id);
    if (idx === -1) return false;
    const product = this.data.products[idx];
    if (seller.role !== 'admin' && product.sellerId !== seller.id) {
      throw new Error('Unauthorized to delete this product');
    }
    this.data.products.splice(idx, 1);
    this.saveData();
    return true;
  }

  // --- Real-Time Inventory & Movements ---
  public getMovements(productId?: string): InventoryMovement[] {
    if (productId) {
      return this.data.movements.filter((m) => m.productId === productId);
    }
    return this.data.movements.slice().reverse();
  }

  private recordMovement(movementData: Omit<InventoryMovement, 'id' | 'timestamp'>) {
    const movement: InventoryMovement = {
      ...movementData,
      id: `mov-${crypto.randomUUID().slice(0, 8)}`,
      timestamp: new Date().toISOString(),
    };
    this.data.movements.push(movement);
  }

  public restockProduct(productId: string, quantity: number, actorName: string, note?: string): Product {
    const product = this.getProductById(productId);
    if (!product) throw new Error('Product not found');

    const previousAvailable = product.stock.available;
    product.stock.onHand += quantity;
    product.stock.available = product.stock.onHand - product.stock.reserved;

    this.recordMovement({
      productId: product.id,
      productName: product.name,
      sku: product.sku,
      type: 'MANUAL_RESTOCK',
      delta: quantity,
      previousAvailable,
      newAvailable: product.stock.available,
      actor: actorName,
      note: note || `Restocked ${quantity} units`,
    });

    this.saveData();
    return product;
  }

  // --- Atomic Order & Stock Validation ---
  public createOrder(orderInput: {
    customerId: string;
    customerName: string;
    customerEmail: string;
    customerPhone: string;
    shippingAddress: any;
    items: { productId: string; quantity: number }[];
    paymentMethod: 'COD' | 'ONLINE_RAZORPAY';
    isExpress30Min?: boolean;
    aiAssisted?: boolean;
    aiConversationSummary?: string;
  }): Order {
    // 1. Validate Stock Atomically
    for (const item of orderInput.items) {
      const product = this.getProductById(item.productId);
      if (!product) {
        throw new Error(`Product not found: ${item.productId}`);
      }
      if (product.stock.available < item.quantity) {
        throw new Error(
          `Insufficient stock for "${product.name}". Available: ${product.stock.available}, Requested: ${item.quantity}`
        );
      }
    }

    // 2. Prepare Order Items with immutable server snapshot
    let subtotal = 0;
    const validatedItems = orderInput.items.map((item) => {
      const product = this.getProductById(item.productId)!;
      const lineTotal = product.price * item.quantity;
      subtotal += lineTotal;

      return {
        productId: product.id,
        productName: product.name,
        sku: product.sku,
        price: product.price,
        mrp: product.mrp,
        quantity: item.quantity,
        image: product.images[0] || '',
        category: product.category,
        sellerId: product.sellerId,
        sellerName: product.sellerName,
      };
    });

    const tax = Math.round(subtotal * 0.05); // 5% GST
    const shippingFee = subtotal > 499 ? 0 : 25;
    const discount = subtotal > 1000 ? 50 : 0;
    const totalAmount = subtotal - discount + tax + shippingFee;

    const orderNumber = `TV-2026-${Math.floor(1000 + Math.random() * 9000)}`;
    const orderId = `ord-${crypto.randomUUID().slice(0, 8)}`;
    const now = new Date().toISOString();

    // 3. Atomically Commit Stock: Deduct onHand and log
    for (const item of validatedItems) {
      const product = this.getProductById(item.productId)!;
      const previousAvailable = product.stock.available;

      product.stock.onHand -= item.quantity;
      product.stock.available = product.stock.onHand - product.stock.reserved;

      this.recordMovement({
        productId: product.id,
        productName: product.name,
        sku: product.sku,
        type: 'ORDER_COMMITTED',
        delta: -item.quantity,
        previousAvailable,
        newAvailable: product.stock.available,
        actor: 'Order Checkout',
        orderId,
        note: `Committed ${item.quantity} units for Order #${orderNumber}`,
      });
    }

    const newOrder: Order = {
      id: orderId,
      orderNumber,
      customerId: orderInput.customerId,
      customerName: orderInput.customerName,
      customerEmail: orderInput.customerEmail,
      customerPhone: orderInput.customerPhone,
      shippingAddress: orderInput.shippingAddress,
      items: validatedItems,
      subtotal,
      discount,
      tax,
      shippingFee,
      totalAmount,
      paymentMethod: orderInput.paymentMethod,
      paymentStatus: orderInput.paymentMethod === 'ONLINE_RAZORPAY' ? 'PAID' : 'PENDING',
      paymentId: orderInput.paymentMethod === 'ONLINE_RAZORPAY' ? `pay_rzp_${crypto.randomUUID().slice(0, 10)}` : undefined,
      orderStatus: 'ORDER_PLACED',
      isExpress30Min: orderInput.isExpress30Min || false,
      estimatedDeliveryTime: orderInput.isExpress30Min
        ? 'Within 30 minutes (Express Delivery)'
        : 'Tomorrow, by 8:00 PM',
      aiAssisted: orderInput.aiAssisted || false,
      aiConversationSummary: orderInput.aiConversationSummary,
      timeline: [
        {
          status: 'ORDER_PLACED',
          timestamp: now,
          note: orderInput.aiAssisted
            ? 'Order placed with verified consent via Zyro AI'
            : 'Order placed successfully by customer',
          actor: orderInput.aiAssisted ? 'Zyro AI Agent' : orderInput.customerName,
        },
      ],
      createdAt: now,
      updatedAt: now,
    };

    this.data.orders.unshift(newOrder);

    // Record Analytics Event
    this.recordAnalyticsEvent({
      eventType: 'ORDER_PLACED',
      sellerId: validatedItems[0]?.sellerId,
      metadata: { orderId, totalAmount, itemsCount: validatedItems.length },
    });

    this.saveData();
    return newOrder;
  }

  public getOrders(user?: User): Order[] {
    if (!user) return this.data.orders;
    if (user.role === 'admin') return this.data.orders;
    if (user.role === 'seller') {
      return this.data.orders.filter((ord) => ord.items.some((it) => it.sellerId === user.id));
    }
    // Customer
    return this.data.orders.filter((ord) => ord.customerId === user.id);
  }

  public getOrderById(id: string): Order | undefined {
    return this.data.orders.find((o) => o.id === id || o.orderNumber === id);
  }

  public updateOrderStatus(
    orderId: string,
    newStatus: OrderStatus,
    note: string,
    actorName: string
  ): Order {
    const order = this.getOrderById(orderId);
    if (!order) throw new Error('Order not found');

    const previousStatus = order.orderStatus;
    order.orderStatus = newStatus;
    const now = new Date().toISOString();

    order.timeline.push({
      status: newStatus,
      timestamp: now,
      note,
      actor: actorName,
    });
    order.updatedAt = now;

    // Handle cancellation: restore stock
    if (newStatus === 'CANCELLED' && previousStatus !== 'CANCELLED') {
      for (const item of order.items) {
        const product = this.getProductById(item.productId);
        if (product) {
          const previousAvailable = product.stock.available;
          product.stock.onHand += item.quantity;
          product.stock.available = product.stock.onHand - product.stock.reserved;

          this.recordMovement({
            productId: product.id,
            productName: product.name,
            sku: product.sku,
            type: 'ORDER_CANCELLED_RESTOCKED',
            delta: item.quantity,
            previousAvailable,
            newAvailable: product.stock.available,
            actor: actorName,
            orderId: order.id,
            note: `Restocked ${item.quantity} units due to Order #${order.orderNumber} cancellation`,
          });
        }
      }
      if (order.paymentStatus === 'PAID') {
        order.paymentStatus = 'REFUNDED';
      }
    }

    if (newStatus === 'DELIVERED') {
      if (order.paymentMethod === 'COD') {
        order.paymentStatus = 'PAID';
      }
      this.recordAnalyticsEvent({
        eventType: 'ORDER_DELIVERED',
        sellerId: order.items[0]?.sellerId,
        metadata: { orderId: order.id, totalAmount: order.totalAmount },
      });
    }

    this.saveData();
    return order;
  }

  // --- Seller Documents & RAG Knowledge Base ---
  public getDocuments(sellerId?: string): SellerDocument[] {
    if (!sellerId) return this.data.documents;
    return this.data.documents.filter((d) => d.sellerId === sellerId);
  }

  public addDocument(docData: Omit<SellerDocument, 'id' | 'uploadedAt' | 'status'>): SellerDocument {
    const newDoc: SellerDocument = {
      ...docData,
      id: `doc-${crypto.randomUUID().slice(0, 8)}`,
      uploadedAt: new Date().toISOString(),
      status: 'indexed',
    };
    this.data.documents.push(newDoc);
    this.saveData();
    return newDoc;
  }

  public deleteDocument(id: string, sellerId: string): boolean {
    const idx = this.data.documents.findIndex((d) => d.id === id && (sellerId === 'admin' || d.sellerId === sellerId));
    if (idx === -1) return false;
    this.data.documents.splice(idx, 1);
    this.saveData();
    return true;
  }

  public searchKnowledgeBase(query: string, productId?: string): { title: string; content: string; source: string }[] {
    const q = query.toLowerCase();
    const results: { title: string; content: string; source: string }[] = [];

    const candidateDocs = productId
      ? this.data.documents.filter((d) => d.productId === productId || !d.productId)
      : this.data.documents;

    for (const doc of candidateDocs) {
      for (const section of doc.sections) {
        if (
          section.title.toLowerCase().includes(q) ||
          section.content.toLowerCase().includes(q) ||
          (doc.productName && q.includes(doc.productName.toLowerCase()))
        ) {
          results.push({
            title: section.title,
            content: section.content,
            source: doc.fileName,
          });
        }
      }
    }

    return results;
  }

  // --- Analytics & Demand Funnel ---
  public recordAnalyticsEvent(event: Omit<AnalyticsEventRecord, 'id' | 'timestamp'>) {
    this.data.analyticsEvents.push({
      ...event,
      id: `ev-${crypto.randomUUID().slice(0, 8)}`,
      timestamp: new Date().toISOString(),
    });
    this.saveData();
  }

  public getSellerAnalytics(sellerId?: string): DemandFunnelMetrics {
    const allProducts = this.data.products.filter((p) => !sellerId || p.sellerId === sellerId);
    const allOrders = this.data.orders.filter((o) => !sellerId || o.items.some((it) => it.sellerId === sellerId));

    const impressions = 2840 + (allProducts.length * 120);
    const instagramClicks = 345 + (allProducts.length * 15);
    const enquiriesStarted = 182 + (allOrders.length * 8);
    const aiConversationsCompleted = 148 + (allOrders.length * 6);
    const qualifiedLeads = 95 + allOrders.length * 4;
    const addToCartEvents = 160 + allOrders.length * 3;
    const checkoutStarts = 85 + allOrders.length * 2;
    const ordersPlaced = allOrders.length;
    const ordersPaidOrConfirmed = allOrders.filter((o) => o.paymentStatus === 'PAID' || o.orderStatus !== 'CANCELLED').length;
    const ordersDelivered = allOrders.filter((o) => o.orderStatus === 'DELIVERED').length;

    const topEnquired = allProducts
      .slice(0, 5)
      .map((p) => ({
        productId: p.id,
        productName: p.name,
        count: Math.floor(p.reviewCount / 5) + 12,
        category: p.category,
      }))
      .sort((a, b) => b.count - a.count);

    const lowStockItems = allProducts
      .filter((p) => p.stock.available <= p.stock.lowStockThreshold)
      .map((p) => ({
        productId: p.id,
        productName: p.name,
        sku: p.sku,
        available: p.stock.available,
        threshold: p.stock.lowStockThreshold,
      }));

    return {
      impressions,
      instagramClicks,
      enquiriesStarted,
      aiConversationsCompleted,
      qualifiedLeads,
      addToCartEvents,
      checkoutStarts,
      ordersPlaced,
      ordersPaidOrConfirmed,
      ordersDelivered,
      topEnquiredProducts: topEnquired,
      commonObjections: [
        { reason: 'Express 30-min Delivery Area Availability', count: 42, resolvedCount: 36 },
        { reason: 'Price vs Market Comparison / Discounts', count: 35, resolvedCount: 28 },
        { reason: 'Medicine Expiry Date Verification', count: 29, resolvedCount: 29 },
        { reason: 'Laptop RAM & Storage Upgradeability', count: 24, resolvedCount: 22 },
      ],
      lowStockItems,
      conversionRates: {
        visitToCart: Math.round((addToCartEvents / impressions) * 1000) / 10,
        cartToCheckout: Math.round((checkoutStarts / addToCartEvents) * 1000) / 10,
        checkoutToOrder: checkoutStarts > 0 ? Math.round((ordersPlaced / checkoutStarts) * 1000) / 10 : 0,
        overallConversion: Math.round((ordersPlaced / impressions) * 1000) / 10,
      },
    };
  }

  // --- Confidential Seller Finance ---
  public getSellerFinance(sellerId?: string): SellerFinanceMetrics {
    const orders = this.data.orders.filter(
      (o) => !sellerId || o.items.some((it) => it.sellerId === sellerId)
    );

    let gmv = 0;
    let sellerDiscounts = 0;
    let deliveryCharges = 0;
    let taxCollected = 0;
    let cogs = 0;
    let refunds = 0;
    let codCollected = 0;
    let codPending = 0;
    let onlineSettled = 0;
    let onlinePending = 0;

    for (const order of orders) {
      if (order.orderStatus === 'CANCELLED') {
        refunds += order.totalAmount;
        continue;
      }

      gmv += order.subtotal;
      sellerDiscounts += order.discount;
      deliveryCharges += order.shippingFee;
      taxCollected += order.tax;

      // Estimate COGS from product definitions
      for (const item of order.items) {
        const prod = this.getProductById(item.productId);
        const unitCost = prod?.costPrice || (item.price * 0.7);
        cogs += unitCost * item.quantity;
      }

      if (order.paymentMethod === 'COD') {
        if (order.orderStatus === 'DELIVERED') {
          codCollected += order.totalAmount;
        } else {
          codPending += order.totalAmount;
        }
      } else {
        if (order.orderStatus === 'DELIVERED') {
          onlineSettled += order.totalAmount;
        } else {
          onlinePending += order.totalAmount;
        }
      }
    }

    const netSales = gmv - sellerDiscounts - refunds;
    const paymentGatewayFees = Math.round((onlineSettled + onlinePending) * 0.02); // 2% standard
    const grossProfit = Math.max(0, netSales - cogs);
    const platformCommission = Math.round(netSales * 0.05); // 5% marketplace commission
    const netProfit = Math.max(0, grossProfit - platformCommission - paymentGatewayFees);

    return {
      grossMerchandiseSales: gmv,
      sellerDiscounts,
      refundsAndCancellations: refunds,
      netSales,
      deliveryChargesCollected: deliveryCharges,
      taxCollected,
      paymentGatewayFees,
      costOfGoodsSold: cogs,
      estimatedGrossProfit: grossProfit,
      platformCommissionAndExpenses: platformCommission,
      estimatedNetProfit: netProfit,
      codCollected,
      codPendingSettlement: codPending,
      onlineSettled,
      onlinePendingSettlement: onlinePending,
      outstandingRefunds: refunds,
    };
  }

  // --- Enquiries ---
  public getEnquiries(user?: User): ProductEnquiry[] {
    if (!user) return this.data.enquiries;
    if (user.role === 'admin') return this.data.enquiries;
    if (user.role === 'seller') return this.data.enquiries.filter((e) => e.sellerId === user.id);
    return this.data.enquiries.filter((e) => e.customerId === user.id);
  }

  public createOrUpdateEnquiry(enquiry: Omit<ProductEnquiry, 'id' | 'createdAt' | 'updatedAt'> & { id?: string }): ProductEnquiry {
    const now = new Date().toISOString();
    if (enquiry.id) {
      const existing = this.data.enquiries.find((e) => e.id === enquiry.id);
      if (existing) {
        Object.assign(existing, enquiry, { updatedAt: now });
        this.saveData();
        return existing;
      }
    }

    const newEnquiry: ProductEnquiry = {
      ...enquiry,
      id: `enq-${crypto.randomUUID().slice(0, 8)}`,
      createdAt: now,
      updatedAt: now,
    };
    this.data.enquiries.unshift(newEnquiry);
    this.saveData();
    return newEnquiry;
  }
}

export const db = new StoreDatabase();
