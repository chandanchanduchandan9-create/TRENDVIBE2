import amazonPaapi from 'amazon-paapi';
import dotenv from 'dotenv';

dotenv.config({ override: true });

export interface AmazonProductData {
  asin: string;
  title: string;
  price: number;
  currency: string;
  mrp?: number;
  availability: string;
  images: string[];
  features: string[];
  productUrl: string;
  specifications: Record<string, string>;
}

export class AmazonPaapiService {
  private commonParameters: any;

  constructor() {
    this.commonParameters = {
      AccessKey: (process.env.AMAZON_PAAPI_ACCESS_KEY || '').trim(),
      SecretKey: (process.env.AMAZON_PAAPI_SECRET_KEY || '').trim(),
      PartnerTag: (process.env.AMAZON_PAAPI_PARTNER_TAG || '').trim(),
      PartnerType: 'Associates',
      Marketplace: (process.env.AMAZON_PAAPI_MARKETPLACE || 'www.amazon.in').trim(),
    };
  }

  public isConfigured(): boolean {
    return Boolean(
      this.commonParameters.AccessKey &&
      this.commonParameters.SecretKey &&
      this.commonParameters.PartnerTag
    );
  }

  /**
   * Extract ASIN from any Amazon Product URL
   */
  public extractAsin(url: string): string | null {
    const regex = /\/([A-Z0-9]{10})(?:[\/?]|$)/;
    const match = url.match(regex);
    return match ? match[1] : null;
  }

  /**
   * Fetch Real-Time Product Data by ASIN or URL
   */
  public async getProductDetails(identifier: string): Promise<AmazonProductData> {
    if (!this.isConfigured()) {
      throw new Error('Amazon Product Advertising API is not configured. Please add AccessKey, SecretKey, and PartnerTag to secrets.');
    }

    const asin = identifier.length === 10 ? identifier : this.extractAsin(identifier);
    if (!asin) {
      throw new Error('Invalid Amazon URL or ASIN provided.');
    }

    const requestParameters = {
      ItemIds: [asin],
      ItemIdType: 'ASIN',
      Resources: [
        'ItemInfo.Title',
        'ItemInfo.Features',
        'ItemInfo.ByLineInfo',
        'ItemInfo.ProductInfo',
        'Images.Primary.Large',
        'Images.Variants.Large',
        'Offers.Listings.Price',
        'Offers.Listings.Availability',
        'Offers.Listings.SavingBasis',
      ],
    };

    try {
      const data = await amazonPaapi.GetItems(this.commonParameters, requestParameters);
      
      if (!data || !data.ItemsResult || !data.ItemsResult.Items || data.ItemsResult.Items.length === 0) {
        throw new Error('Product not found in Amazon catalog.');
      }

      const item = data.ItemsResult.Items[0];
      const itemInfo = item.ItemInfo;
      const listing = item.Offers?.Listings?.[0];

      // Extract specifications/features
      const features = itemInfo?.Features?.DisplayValues || [];
      const specs: Record<string, string> = {};
      if (itemInfo?.ByLineInfo?.Brand?.DisplayValue) {
        specs['Brand'] = itemInfo.ByLineInfo.Brand.DisplayValue;
      }
      if (itemInfo?.ProductInfo?.Color?.DisplayValue) {
        specs['Color'] = itemInfo.ProductInfo.Color.DisplayValue;
      }

      // Collect images
      const images = [];
      if (item.Images?.Primary?.Large?.URL) {
        images.push(item.Images.Primary.Large.URL);
      }
      if (item.Images?.Variants) {
        item.Images.Variants.forEach((v: any) => {
          if (v.Large?.URL) images.push(v.Large.URL);
        });
      }

      return {
        asin: item.ASIN,
        title: itemInfo?.Title?.DisplayValue || 'Unknown Product',
        price: listing?.Price?.Amount || 0,
        currency: listing?.Price?.Currency || 'INR',
        mrp: listing?.SavingBasis?.Amount || listing?.Price?.Amount || 0,
        availability: listing?.Availability?.Message || 'Unknown',
        images: images.slice(0, 5),
        features,
        productUrl: item.DetailPageURL,
        specifications: specs,
      };
    } catch (err: any) {
      console.error('[PA-API Error]:', err.message);
      throw new Error(`Amazon API fetch failed: ${err.message}`);
    }
  }
}

export const amazonPaapiService = new AmazonPaapiService();
