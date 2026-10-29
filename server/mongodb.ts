import { MongoClient, Db } from 'mongodb';
import dotenv from 'dotenv';
import { Product, User, Order } from '../src/types/index.ts';

dotenv.config({ override: true });

export interface MongoIntegrationStatus {
  connected: boolean;
  uri: string;
  dbName: string;
  lastChecked: string;
  productsCount?: number;
  ordersCount?: number;
  usersCount?: number;
  callsCount?: number;
  error?: string;
}

export interface InboundCallRecord {
  id: string;
  callSid: string;
  from: string;
  to: string;
  startTime: string;
  endTime?: string;
  duration?: number;
  status: 'in-progress' | 'completed' | 'failed';
  turnCount: number;
  transcripts: Array<{
    sender: 'customer' | 'zyro_ai';
    text: string;
    timestamp: string;
    sttEngine?: string;
    ttsEngine?: string;
  }>;
  resolvedProductId?: string;
  resolvedSellerId?: string;
  orderCreated?: boolean;
}

export class MongoDatabaseService {
  private client: MongoClient | null = null;
  private db: Db | null = null;
  private isConnected = false;
  private uri: string;
  private dbName: string;

  constructor() {
    this.uri = (process.env.MONGODB_URI || 'mongodb://localhost:27017').trim();
    this.dbName = (process.env.MONGODB_DB_NAME || 'trendvibe').trim();
  }

  public async init(): Promise<boolean> {
    try {
      this.client = new MongoClient(this.uri, {
        serverSelectionTimeoutMS: 2000,
        connectTimeoutMS: 2000,
      });

      await this.client.connect();
      this.db = this.client.db(this.dbName);
      this.isConnected = true;
      console.log(`[MongoDB] Successfully connected to ${this.uri} (Database: ${this.dbName})`);
      return true;
    } catch (err: any) {
      this.isConnected = false;
      this.db = null;
      console.log(`[MongoDB] Local daemon not reachable at ${this.uri}. Using file-based persistent store.`);
      return false;
    }
  }

  public getStatus(): MongoIntegrationStatus {
    return {
      connected: this.isConnected,
      uri: this.uri,
      dbName: this.dbName,
      lastChecked: new Date().toISOString(),
    };
  }

  public async getDetailedStatus(): Promise<MongoIntegrationStatus> {
    const status = this.getStatus();
    if (!this.isConnected || !this.db) {
      return status;
    }

    try {
      const [pCount, oCount, uCount, cCount] = await Promise.all([
        this.db.collection('products').countDocuments(),
        this.db.collection('orders').countDocuments(),
        this.db.collection('users').countDocuments(),
        this.db.collection('inbound_calls').countDocuments(),
      ]);

      return {
        ...status,
        productsCount: pCount,
        ordersCount: oCount,
        usersCount: uCount,
        callsCount: cCount,
      };
    } catch (err: any) {
      return {
        ...status,
        error: err.message,
      };
    }
  }

  // --- Products ---
  public async upsertProduct(product: Product): Promise<boolean> {
    if (!this.isConnected || !this.db) return false;
    try {
      await this.db
        .collection('products')
        .updateOne({ id: product.id }, { $set: { ...product, updatedAt: new Date().toISOString() } }, { upsert: true });
      return true;
    } catch (err: any) {
      console.error('[MongoDB] Failed to upsert product:', err.message);
      return false;
    }
  }

  public async deleteProduct(productId: string): Promise<boolean> {
    if (!this.isConnected || !this.db) return false;
    try {
      await this.db.collection('products').deleteOne({ id: productId });
      return true;
    } catch (err: any) {
      console.error('[MongoDB] Failed to delete product:', err.message);
      return false;
    }
  }

  public async getAllProducts(): Promise<Product[]> {
    if (!this.isConnected || !this.db) return [];
    try {
      const docs = await this.db.collection('products').find({}).toArray();
      return docs.map((d: any) => {
        const { _id, ...rest } = d;
        return rest as Product;
      });
    } catch (err: any) {
      console.error('[MongoDB] Failed to get products:', err.message);
      return [];
    }
  }

  public async syncAllProducts(products: Product[]): Promise<number> {
    if (!this.isConnected || !this.db || products.length === 0) return 0;
    try {
      const collection = this.db.collection('products');
      const operations = products.map((p) => ({
        updateOne: {
          filter: { id: p.id },
          update: { $set: p },
          upsert: true,
        },
      }));
      const res = await collection.bulkWrite(operations);
      return (res.upsertedCount || 0) + (res.modifiedCount || 0);
    } catch (err: any) {
      console.error('[MongoDB] Sync products failed:', err.message);
      return 0;
    }
  }

  // --- Users ---
  public async upsertUser(user: User): Promise<boolean> {
    if (!this.isConnected || !this.db) return false;
    try {
      await this.db
        .collection('users')
        .updateOne({ id: user.id }, { $set: { ...user, updatedAt: new Date().toISOString() } }, { upsert: true });
      return true;
    } catch (err: any) {
      console.error('[MongoDB] Failed to upsert user:', err.message);
      return false;
    }
  }

  public async getAllUsers(): Promise<User[]> {
    if (!this.isConnected || !this.db) return [];
    try {
      const docs = await this.db.collection('users').find({}).toArray();
      return docs.map((d: any) => {
        const { _id, ...rest } = d;
        return rest as User;
      });
    } catch (err: any) {
      console.error('[MongoDB] Failed to get users:', err.message);
      return [];
    }
  }

  public async syncAllUsers(users: User[]): Promise<number> {
    if (!this.isConnected || !this.db || users.length === 0) return 0;
    try {
      const collection = this.db.collection('users');
      const operations = users.map((u) => ({
        updateOne: {
          filter: { id: u.id },
          update: { $set: u },
          upsert: true,
        },
      }));
      const res = await collection.bulkWrite(operations);
      return (res.upsertedCount || 0) + (res.modifiedCount || 0);
    } catch (err: any) {
      console.error('[MongoDB] Sync users failed:', err.message);
      return 0;
    }
  }

  // --- Orders ---
  public async upsertOrder(order: Order): Promise<boolean> {
    if (!this.isConnected || !this.db) return false;
    try {
      await this.db
        .collection('orders')
        .updateOne({ id: order.id }, { $set: { ...order, updatedAt: new Date().toISOString() } }, { upsert: true });
      return true;
    } catch (err: any) {
      console.error('[MongoDB] Failed to upsert order:', err.message);
      return false;
    }
  }

  public async getAllOrders(): Promise<Order[]> {
    if (!this.isConnected || !this.db) return [];
    try {
      const docs = await this.db.collection('orders').find({}).toArray();
      return docs.map((d: any) => {
        const { _id, ...rest } = d;
        return rest as Order;
      });
    } catch (err: any) {
      console.error('[MongoDB] Failed to get orders:', err.message);
      return [];
    }
  }

  // --- Inbound Calls Log ---
  public async upsertCallRecord(call: InboundCallRecord): Promise<boolean> {
    if (!this.isConnected || !this.db) return false;
    try {
      await this.db
        .collection('inbound_calls')
        .updateOne({ id: call.id }, { $set: call }, { upsert: true });
      return true;
    } catch (err: any) {
      console.error('[MongoDB] Failed to record call:', err.message);
      return false;
    }
  }

  public async getCallRecords(): Promise<InboundCallRecord[]> {
    if (!this.isConnected || !this.db) return [];
    try {
      const docs = await this.db
        .collection('inbound_calls')
        .find({})
        .sort({ startTime: -1 })
        .limit(100)
        .toArray();
      return docs.map((d: any) => {
        const { _id, ...rest } = d;
        return rest as InboundCallRecord;
      });
    } catch (err: any) {
      console.error('[MongoDB] Failed to get call records:', err.message);
      return [];
    }
  }
}

export const mongoService = new MongoDatabaseService();
