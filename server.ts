import express from 'express';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { createServer as createViteServer } from 'vite';
import dotenv from 'dotenv';
import { db } from './server/db.ts';
import { processZyroConversation } from './server/zyroAi.ts';
import { checkSupabaseStatus, syncDataToSupabase } from './server/supabase.ts';
import { User, OrderStatus } from './src/types/index.ts';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

// Body parser supporting JSON and base64 document payloads
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Helper to authenticate user from Authorization header (mock bearer token: `Bearer usr-xxx`)
function getAuthUser(req: express.Request): User | undefined {
  const authHeader = req.headers.authorization;
  if (!authHeader) return undefined;
  const token = authHeader.replace(/^Bearer\s+/i, '').trim();
  return db.getUserById(token);
}

// ==========================================
// AUTHENTICATION ROUTES
// ==========================================

app.post('/api/auth/login', (req, res) => {
  const { email, phone, password, role } = req.body;

  if (!email || !email.trim()) {
    return res.status(400).json({ error: 'Gmail / Email address is required for secure authentication.' });
  }

  if (!phone || !phone.trim()) {
    return res.status(400).json({ error: 'Mobile number is required for 2-factor verified access.' });
  }

  if (!password || !password.trim()) {
    return res.status(400).json({ error: 'Password is required to authenticate.' });
  }

  const result = db.authenticateUser(email, phone, password, role);
  if (result.error || !result.user) {
    return res.status(401).json({ error: result.error || 'Authentication failed. Please verify your credentials.' });
  }

  return res.json({
    user: result.user,
    token: result.user.id,
    message: `Secure login successful as ${result.user.role.toUpperCase()}`,
  });
});

app.post('/api/auth/voice-profile', (req, res) => {
  const user = getAuthUser(req);
  const { voiceprintId, confidence } = req.body;

  if (!user) {
    return res.status(401).json({ error: 'User must be authenticated to calibrate voice profile.' });
  }

  const updated = db.updateUser(user.id, {
    voiceProfile: {
      isEnrolled: true,
      voiceprintId: voiceprintId || `VP-${user.name.toUpperCase().replace(/\s+/g, '_')}-${Math.floor(1000 + Math.random() * 9000)}`,
      enrolledAt: new Date().toISOString(),
      confidence: confidence || 0.988,
    },
  });

  return res.json({ user: updated, success: true });
});

app.post('/api/auth/register', (req, res) => {
  const { name, email, phone, role, storeName, storeDescription } = req.body;
  if (!name || !email || !phone) {
    return res.status(400).json({ error: 'Name, email, and phone are required' });
  }

  // Prevent users from granting themselves admin via public registration
  const assignedRole = role === 'seller' ? 'seller' : 'customer';

  const existing = db.getUserByEmail(email);
  if (existing) {
    return res.status(400).json({ error: 'An account with this email already exists' });
  }

  const newUser = db.createUser({
    name,
    email,
    phone,
    role: assignedRole,
    storeName: assignedRole === 'seller' ? storeName || `${name}'s Store` : undefined,
    storeDescription: assignedRole === 'seller' ? storeDescription || 'Quality multi-category seller.' : undefined,
    isApprovedSeller: assignedRole === 'seller',
    avatarUrl: `https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=200&q=80`,
    addresses: [
      {
        id: `addr-${Date.now()}`,
        name,
        phone,
        street: '12th Main Road, HAL 2nd Stage, Indiranagar',
        city: 'Bangalore',
        state: 'Karnataka',
        pincode: '560038',
        landmark: 'Near Indiranagar Club',
        isDefault: true,
      },
    ],
  });

  return res.status(201).json({ user: newUser, token: newUser.id });
});

app.get('/api/auth/me', (req, res) => {
  const user = getAuthUser(req);
  if (!user) {
    // Default to customer-1 for seamless instant experience
    const defaultUser = db.getUserById('usr-customer-1');
    return res.json({ user: defaultUser, token: defaultUser?.id });
  }
  return res.json({ user, token: user.id });
});

app.get('/api/users/switch-list', (_req, res) => {
  // Returns demo personas for instant one-click preview
  const users = db.getUsers();
  res.json(users);
});

// ==========================================
// CATEGORIES & PRODUCTS ROUTES
// ==========================================

app.get('/api/categories', (_req, res) => {
  const categories = db.getCategories();
  res.json(categories);
});

app.get('/api/products', (req, res) => {
  const { category, search, sellerId, status, minPrice, maxPrice, sortBy } = req.query;
  const products = db.getProducts({
    category: category ? String(category) : undefined,
    search: search ? String(search) : undefined,
    sellerId: sellerId ? String(sellerId) : undefined,
    status: status ? String(status) : undefined,
    minPrice: minPrice ? Number(minPrice) : undefined,
    maxPrice: maxPrice ? Number(maxPrice) : undefined,
    sortBy: sortBy as any,
  });
  res.json(products);
});

app.get('/api/products/:id', (req, res) => {
  const product = db.getProductById(req.params.id);
  if (!product) {
    return res.status(404).json({ error: 'Product not found' });
  }
  res.json(product);
});

app.post('/api/products', (req, res) => {
  let user = getAuthUser(req);
  if (!user) {
    user = db.getUserById('usr-seller-1');
  } else if (user.role !== 'seller' && user.role !== 'admin') {
    // If the authenticated user is currently in a customer persona, associate with the authorized seller hub
    const seller = db.getUserById('usr-seller-1');
    if (seller) user = seller;
  }

  if (!user) {
    return res.status(403).json({ error: 'Unauthorized: Seller account required' });
  }

  try {
    const created = db.createProduct(req.body, user);
    res.status(201).json(created);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

app.put('/api/products/:id', (req, res) => {
  const user = getAuthUser(req);
  if (!user || (user.role !== 'seller' && user.role !== 'admin')) {
    return res.status(403).json({ error: 'Unauthorized: Only seller or admin can update product' });
  }

  try {
    const updated = db.updateProduct(req.params.id, req.body, user);
    if (!updated) {
      return res.status(404).json({ error: 'Product not found' });
    }
    res.json(updated);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

app.delete('/api/products/:id', (req, res) => {
  const user = getAuthUser(req);
  if (!user || (user.role !== 'seller' && user.role !== 'admin')) {
    return res.status(403).json({ error: 'Unauthorized' });
  }

  const success = db.deleteProduct(req.params.id, user);
  if (!success) {
    return res.status(404).json({ error: 'Product not found' });
  }
  res.json({ success: true, message: 'Product deleted' });
});

// ==========================================
// INVENTORY MANAGEMENT ROUTES
// ==========================================

app.get('/api/inventory/movements', (req, res) => {
  const { productId } = req.query;
  const movements = db.getMovements(productId ? String(productId) : undefined);
  res.json(movements);
});

app.post('/api/inventory/restock', (req, res) => {
  const user = getAuthUser(req);
  if (!user || (user.role !== 'seller' && user.role !== 'admin')) {
    return res.status(403).json({ error: 'Unauthorized' });
  }

  const { productId, quantity, note } = req.body;
  if (!productId || !quantity || quantity <= 0) {
    return res.status(400).json({ error: 'Invalid productId or quantity' });
  }

  try {
    const updated = db.restockProduct(productId, Number(quantity), user.name, note);
    res.json(updated);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

// ==========================================
// ORDERS & CHECKOUT ROUTES
// ==========================================

app.get('/api/orders', (req, res) => {
  const user = getAuthUser(req);
  const orders = db.getOrders(user);
  res.json(orders);
});

app.get('/api/orders/:id', (req, res) => {
  const order = db.getOrderById(req.params.id);
  if (!order) {
    return res.status(404).json({ error: 'Order not found' });
  }
  res.json(order);
});

app.post('/api/orders/checkout', (req, res) => {
  const user = getAuthUser(req);
  const { items, shippingAddress, paymentMethod, isExpress30Min, aiAssisted, aiConversationSummary } = req.body;

  if (!items || !Array.isArray(items) || items.length === 0) {
    return res.status(400).json({ error: 'Order items are required' });
  }

  if (!shippingAddress || !shippingAddress.pincode) {
    return res.status(400).json({ error: 'Valid delivery address and PIN code are required' });
  }

  try {
    const customer = user || db.getUserById('usr-customer-1')!;
    const newOrder = db.createOrder({
      customerId: customer.id,
      customerName: customer.name,
      customerEmail: customer.email,
      customerPhone: shippingAddress.phone || customer.phone,
      shippingAddress,
      items,
      paymentMethod: paymentMethod || 'COD',
      isExpress30Min: !!isExpress30Min,
      aiAssisted: !!aiAssisted,
      aiConversationSummary,
    });

    res.status(201).json(newOrder);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

app.put('/api/orders/:id/status', (req, res) => {
  const user = getAuthUser(req);
  const { status, note } = req.body;
  if (!status) {
    return res.status(400).json({ error: 'Status is required' });
  }

  try {
    const actorName = user ? user.name : 'System Operations';
    const updated = db.updateOrderStatus(req.params.id, status as OrderStatus, note || `Status updated to ${status}`, actorName);
    res.json(updated);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

// ==========================================
// SELLER DOCUMENTS & PDF KNOWLEDGE BASE
// ==========================================

app.get('/api/seller/documents', (req, res) => {
  const user = getAuthUser(req);
  const sellerId = user?.role === 'admin' ? undefined : user?.id;
  const docs = db.getDocuments(sellerId);
  res.json(docs);
});

app.post('/api/seller/documents', (req, res) => {
  const user = getAuthUser(req);
  if (!user || (user.role !== 'seller' && user.role !== 'admin')) {
    return res.status(403).json({ error: 'Unauthorized: Only sellers can upload documents' });
  }

  const { fileName, fileSizeBytes, fileType, extractedText, sections, productId, productName, category } = req.body;
  if (!fileName || !extractedText) {
    return res.status(400).json({ error: 'File name and text content are required' });
  }

  const createdDoc = db.addDocument({
    sellerId: user.id,
    fileName,
    fileSizeBytes: fileSizeBytes || 102400,
    fileType: fileType || 'application/pdf',
    extractedText,
    sections: sections && sections.length > 0 ? sections : [{ title: 'Overview', content: extractedText.slice(0, 500) }],
    productId,
    productName,
    category,
  });

  res.status(201).json(createdDoc);
});

app.delete('/api/seller/documents/:id', (req, res) => {
  const user = getAuthUser(req);
  if (!user) return res.status(401).json({ error: 'Unauthorized' });

  const success = db.deleteDocument(req.params.id, user.id);
  if (!success) {
    return res.status(404).json({ error: 'Document not found or unauthorized' });
  }
  res.json({ success: true, message: 'Document deleted' });
});

// ==========================================
// SELLER ANALYTICS & FINANCE (CONFIDENTIAL)
// ==========================================

app.get('/api/seller/analytics', (req, res) => {
  const user = getAuthUser(req);
  const sellerId = user?.role === 'admin' ? undefined : user?.id;
  const analytics = db.getSellerAnalytics(sellerId);
  res.json(analytics);
});

app.get('/api/seller/finance', (req, res) => {
  const user = getAuthUser(req);
  if (!user || (user.role !== 'seller' && user.role !== 'admin')) {
    return res.status(403).json({ error: 'Confidential: Only authorized sellers or administrators can view financial statements' });
  }
  const sellerId = user.role === 'admin' ? undefined : user.id;
  const finance = db.getSellerFinance(sellerId);
  res.json(finance);
});

// ==========================================
// ENQUIRIES & MESSAGING
// ==========================================

app.get('/api/enquiries', (req, res) => {
  const user = getAuthUser(req);
  const enquiries = db.getEnquiries(user);
  res.json(enquiries);
});

app.post('/api/enquiries', (req, res) => {
  const user = getAuthUser(req);
  const { productId, productName, sellerId, text, kannadaText, channel } = req.body;
  if (!productId || !text) {
    return res.status(400).json({ error: 'Product ID and message are required' });
  }

  const customer = user || db.getUserById('usr-customer-1')!;
  const newEnquiry = db.createOrUpdateEnquiry({
    productId,
    productName: productName || 'Product Enquiry',
    sellerId: sellerId || 'usr-seller-1',
    customerId: customer.id,
    customerName: customer.name,
    status: 'OPEN',
    channel: channel || 'WEB_CHAT',
    lastMessageSnippet: text,
    messages: [
      {
        id: `msg-${Date.now()}`,
        sender: 'customer',
        senderName: customer.name,
        text,
        kannadaText,
        timestamp: new Date().toISOString(),
      },
    ],
  });

  res.status(201).json(newEnquiry);
});

// ==========================================
// ZYRO AI CHAT & VOICE CALLING AGENT
// ==========================================

app.post('/api/zyro-ai/chat', async (req, res) => {
  const user = getAuthUser(req);
  const { message, productId, category, language, isCallingSession } = req.body;

  if (!message) {
    return res.status(400).json({ error: 'Message is required' });
  }

  try {
    const zyroResponse = await processZyroConversation({
      message,
      productId,
      category,
      language: language || 'auto',
      customerId: user?.id,
      customerName: user?.name,
      customerPhone: user?.phone,
      isCallingSession: !!isCallingSession,
    });

    res.json(zyroResponse);
  } catch (err: any) {
    console.error('Zyro AI chat route error:', err);
    res.status(500).json({ error: 'Failed to process AI conversation' });
  }
});

// Simulated payment verification
app.post('/api/payments/verify', (req, res) => {
  const { paymentId, orderId } = req.body;
  if (!paymentId || !orderId) {
    return res.status(400).json({ error: 'Payment ID and Order ID required' });
  }

  const order = db.getOrderById(orderId);
  if (!order) {
    return res.status(404).json({ error: 'Order not found' });
  }

  order.paymentStatus = 'PAID';
  order.paymentId = paymentId;
  order.timeline.push({
    status: order.orderStatus,
    timestamp: new Date().toISOString(),
    note: `Online payment of ₹${order.totalAmount} verified via Razorpay Gateway (Ref: ${paymentId})`,
    actor: 'Razorpay Webhook',
  });

  res.json({ success: true, order });
});

// ==========================================
// PRICE DROP ALERTS & EMAIL NOTIFICATION SIMULATION
// ==========================================

app.post('/api/price-alerts', (req, res) => {
  const { productId, productName, userEmail, targetPrice, currentPrice } = req.body;
  if (!productId || !userEmail || !targetPrice) {
    return res.status(400).json({ error: 'productId, userEmail, and targetPrice are required' });
  }

  const alert = db.createPriceAlert({
    productId,
    productName: productName || 'Product',
    userEmail,
    targetPrice: Number(targetPrice),
    currentPrice: Number(currentPrice || 0),
  });

  // Simulated email dispatch record
  const emailNotificationSimulation = {
    to: userEmail,
    subject: `Price Drop Alert Confirmed: ${productName}`,
    body: `Hello! We will notify you immediately at ${userEmail} as soon as ${productName} drops to or below ₹${targetPrice}. Current price is ₹${currentPrice}.`,
    sentAt: new Date().toISOString(),
    status: 'SIMULATED_DISPATCHED',
  };

  res.status(201).json({ alert, emailSimulation: emailNotificationSimulation });
});

app.get('/api/price-alerts', (req, res) => {
  const { email } = req.query;
  const alerts = db.getPriceAlerts(email ? String(email) : undefined);
  res.json(alerts);
});

// ==========================================
// IMAGE ASSET UPLOADS (JPG, PNG, WEBP)
// ==========================================

const UPLOADS_DIR = path.resolve(process.cwd(), 'uploads');
if (!fs.existsSync(UPLOADS_DIR)) {
  fs.mkdirSync(UPLOADS_DIR, { recursive: true });
}
app.use('/uploads', express.static(UPLOADS_DIR));

app.post('/api/upload/image', (req, res) => {
  let user = getAuthUser(req);
  if (!user) {
    user = db.getUserById('usr-seller-1');
  }

  if (!user || (user.role !== 'seller' && user.role !== 'admin')) {
    return res.status(403).json({ error: 'Unauthorized: Only sellers and admins can upload product images' });
  }

  const { fileName, dataUrl } = req.body;
  if (!fileName || !dataUrl) {
    return res.status(400).json({ error: 'fileName and dataUrl are required' });
  }

  // Validate format
  const matches = dataUrl.match(/^data:(image\/(jpeg|jpg|png|webp));base64,(.+)$/i);
  if (!matches) {
    return res.status(400).json({ error: 'Invalid image format. Supported formats: JPG, JPEG, PNG, WebP.' });
  }

  const mimeType = matches[1].toLowerCase();
  const ext = mimeType.includes('png') ? 'png' : mimeType.includes('webp') ? 'webp' : 'jpg';
  const base64Data = matches[3];
  const buffer = Buffer.from(base64Data, 'base64');

  // Validate size (max 5MB)
  if (buffer.length > 5 * 1024 * 1024) {
    return res.status(400).json({ error: 'Image file size exceeds maximum 5MB limit.' });
  }

  const safeFileName = `prod-img-${Date.now()}-${Math.random().toString(36).substring(2, 8)}.${ext}`;
  const filePath = path.join(UPLOADS_DIR, safeFileName);
  fs.writeFileSync(filePath, buffer);

  const imageUrl = `/uploads/${safeFileName}`;
  return res.json({ imageUrl, fileName: safeFileName, size: buffer.length });
});

// ==========================================
// SUPABASE DATABASE CLOUD INTEGRATION
// ==========================================

app.get('/api/supabase/status', async (_req, res) => {
  const status = await checkSupabaseStatus();
  res.json(status);
});

app.post('/api/supabase/sync', async (_req, res) => {
  const products = db.getProducts({ status: 'all' });
  const orders = db.getOrders();
  const users = db.getUsers();
  const result = await syncDataToSupabase(products, orders, users);
  res.json(result);
});

// ==========================================
// VITE MIDDLEWARE & STATIC ASSET SERVING
// ==========================================

async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (_req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`TrendVibe Store + Zyro AI backend listening on port ${PORT}`);
  });
}

startServer();
