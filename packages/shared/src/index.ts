// Product types
export type ProductFinish =
  | 'Chrome'
  | 'Brushed Nickel'
  | 'Oil Rubbed Bronze'
  | 'Matte Black'
  | 'Polished Brass'
  | 'Stainless Steel'
  | 'Matte Gold'
  | 'Venetian Bronze'
  | 'Champagne Bronze';

export type ValveType = 'Cartridge' | 'Ball' | 'Compression' | 'Ceramic Disk';

export type ProductGrade = 'builder-grade' | 'mid-range' | 'premium' | 'luxury';

export type Retailer =
  | 'Home Depot'
  | 'Lowes'
  | 'Amazon'
  | 'Wayfair'
  | 'Build.com'
  | 'Ferguson'
  | 'FaucetDirect'
  | 'SupplyHouse'
  | 'Menards'
  | 'Costco'
  | 'Other';

export interface Product {
  id: string;
  sku: string;
  upc?: string;
  mpn?: string;
  title: string;
  description: string;
  brand: string;
  collection: string;
  productType: string; // 'faucet', 'cartridge', 'valve', etc.
  finish: ProductFinish;
  valveType?: ValveType;
  price: number;
  retailer: Retailer;
  retailerUrl: string;
  imageUrl?: string;
  specifications: Record<string, string>;
  certifications: string[]; // WaterSense, cUPC, NSF, etc.
  estimatedGrade: ProductGrade;
  msrp?: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface PriceHistory {
  id: string;
  productId: string;
  retailer: Retailer;
  price: number;
  timestamp: Date;
}

export interface ProductComparison {
  product: Product;
  alternatives: Product[];
  estimatedMarkup: number;
  priceRange: {
    min: number;
    max: number;
    average: number;
  };
}

export interface ContractorIntelligence {
  productId: string;
  failureRate: number;
  repairCost: number;
  installDifficulty: number; // 1-10
  longevity: number; // years
  recommendedAlternative?: string;
  commonIssues: string[];
}

export interface CompatibilityMapping {
  id: string;
  sourceProductId: string;
  compatibleProductId: string;
  relationship: 'replacement-cartridge' | 'replacement-valve' | 'trim-compatible' | 'interchangeable';
}

export interface QualityAnalysis {
  productId: string;
  qualityScore: number; // 0-100
  serviceabilityScore: number;
  contractorScore: number;
  longevityScore: number;
  repairabilityScore: number;
  hasPlasticComponents: boolean;
  warrantyYears: number;
  repairPartsAvailable: boolean;
}

export interface ExtensionMessage {
  type: 'ANALYZE_PRODUCT' | 'GET_ALTERNATIVES' | 'GET_QUALITY_INFO' | 'GET_COMPATIBILITY';
  payload: Record<string, any>;
}

export interface APIResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  timestamp: string;
}
