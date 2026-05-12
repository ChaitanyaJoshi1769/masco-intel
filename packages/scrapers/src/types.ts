export interface ScrapedProduct {
  sku: string;
  upc?: string;
  mpn?: string;
  title: string;
  description?: string;
  brand: string;
  productType: string;
  finish?: string;
  price: number;
  msrp?: number;
  imageUrl?: string;
  retailerUrl: string;
  specifications: Record<string, string>;
  certifications: string[];
  retailer: 'Home Depot' | 'Lowes' | 'Amazon' | 'Wayfair';
}

export interface ScraperConfig {
  retailer: string;
  searchTerms: string[];
  maxProductsPerTerm?: number;
  retryAttempts?: number;
  timeout?: number;
  headless?: boolean;
}

export interface ScraperResult {
  retailer: string;
  successCount: number;
  errorCount: number;
  products: ScrapedProduct[];
  errors: Array<{ url: string; error: string }>;
  startTime: Date;
  endTime: Date;
}
