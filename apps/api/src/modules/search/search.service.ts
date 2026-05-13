import { Injectable } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class SearchService {
  private prisma: PrismaClient;

  constructor() {
    this.prisma = new PrismaClient();
  }

  /**
   * Full-text search across products
   */
  async fullTextSearch(query: string, limit = 20, offset = 0): Promise<{
    query: string;
    results: Array<{
      id: string;
      title: string;
      brand: string;
      productType: string;
      price: number;
      quality: number;
      relevanceScore: number;
    }>;
    total: number;
    limit: number;
    offset: number;
  }> {
    const searchTerm = query.toLowerCase();
    const products = await this.prisma.product.findMany({
      include: {
        brand: true,
        prices: { orderBy: { timestamp: 'desc' }, take: 1 },
        qualityAnalysis: true,
      },
    });

    // Simple full-text search implementation (in production, use PostgreSQL full-text search)
    const scored = products
      .map((p) => {
        let score = 0;

        // Title match (highest weight)
        if (p.title.toLowerCase().includes(searchTerm)) {
          score += 100;
          // Bonus for exact phrase
          if (p.title.toLowerCase() === searchTerm) score += 50;
        }

        // Brand match
        if (p.brand.name.toLowerCase().includes(searchTerm)) {
          score += 50;
        }

        // Product type match
        if (p.productType.toLowerCase().includes(searchTerm)) {
          score += 30;
        }

        // Description match
        if (p.description?.toLowerCase().includes(searchTerm)) {
          score += 20;
        }

        // SKU match
        if (p.sku.toLowerCase().includes(searchTerm)) {
          score += 40;
        }

        return {
          ...p,
          relevanceScore: score,
        };
      })
      .filter((p) => p.relevanceScore > 0)
      .sort((a, b) => b.relevanceScore - a.relevanceScore);

    const total = scored.length;
    const results = scored.slice(offset, offset + limit).map((p) => ({
      id: p.id,
      title: p.title,
      brand: p.brand.name,
      productType: p.productType,
      price: p.prices[0]?.price || 0,
      quality: p.qualityAnalysis?.qualityScore || 0,
      relevanceScore: Math.round(p.relevanceScore),
    }));

    return {
      query,
      results,
      total,
      limit,
      offset,
    };
  }

  /**
   * Faceted search with filters
   */
  async facetedSearch(filters: {
    productType?: string;
    brand?: string;
    minPrice?: number;
    maxPrice?: number;
    minQuality?: number;
    finish?: string;
    grade?: string;
    searchQuery?: string;
  }, limit = 20, offset = 0): Promise<{
    results: Array<{
      id: string;
      title: string;
      brand: string;
      price: number;
      quality: number;
      productType: string;
      finish: string;
      grade: string;
    }>;
    facets: {
      productTypes: Array<{ name: string; count: number }>;
      brands: Array<{ name: string; count: number }>;
      priceRanges: Array<{ range: string; count: number }>;
      qualityRanges: Array<{ range: string; count: number }>;
      grades: Array<{ name: string; count: number }>;
    };
    total: number;
    appliedFilters: Record<string, any>;
  }> {
    let products = await this.prisma.product.findMany({
      include: {
        brand: true,
        prices: { orderBy: { timestamp: 'desc' }, take: 1 },
        qualityAnalysis: true,
      },
    });

    // Apply text search
    if (filters.searchQuery) {
      const term = filters.searchQuery.toLowerCase();
      products = products.filter(
        (p) =>
          p.title.toLowerCase().includes(term) ||
          p.brand.name.toLowerCase().includes(term) ||
          p.description?.toLowerCase().includes(term) ||
          p.sku.toLowerCase().includes(term)
      );
    }

    // Apply filters
    const filtered = products.filter((p) => {
      if (filters.productType && p.productType !== filters.productType) return false;
      if (filters.brand && p.brand.name !== filters.brand) return false;
      if (filters.finish && p.finish !== filters.finish) return false;
      if (filters.grade && p.estimatedGrade !== filters.grade) return false;

      const currentPrice = p.prices[0]?.price || 0;
      if (filters.minPrice && currentPrice < filters.minPrice) return false;
      if (filters.maxPrice && currentPrice > filters.maxPrice) return false;

      const quality = p.qualityAnalysis?.qualityScore || 0;
      if (filters.minQuality && quality < filters.minQuality) return false;

      return true;
    });

    // Calculate facets from all products (for facet count accuracy)
    const facets = this.calculateFacets(products);

    // Get results
    const total = filtered.length;
    const results = filtered
      .slice(offset, offset + limit)
      .map((p) => ({
        id: p.id,
        title: p.title,
        brand: p.brand.name,
        price: Math.round((p.prices[0]?.price || 0) * 100) / 100,
        quality: Math.round((p.qualityAnalysis?.qualityScore || 0) * 100) / 100,
        productType: p.productType,
        finish: p.finish,
        grade: p.estimatedGrade,
      }));

    return {
      results,
      facets,
      total,
      appliedFilters: filters,
    };
  }

  /**
   * Autocomplete search suggestions
   */
  async autocomplete(prefix: string, limit = 10): Promise<{
    suggestions: Array<{
      type: 'brand' | 'product' | 'category';
      label: string;
      value: string;
      count: number;
    }>;
  }> {
    const term = prefix.toLowerCase();

    const products = await this.prisma.product.findMany({
      include: { brand: true },
    });

    // Get suggestions from products
    const productSuggestions = new Map<string, number>();
    const brandSuggestions = new Map<string, number>();
    const categorySuggestions = new Map<string, number>();

    for (const p of products) {
      if (p.title.toLowerCase().startsWith(term)) {
        const key = p.title;
        productSuggestions.set(key, (productSuggestions.get(key) || 0) + 1);
      }

      if (p.brand.name.toLowerCase().startsWith(term)) {
        const key = p.brand.name;
        brandSuggestions.set(key, (brandSuggestions.get(key) || 0) + 1);
      }

      if (p.productType.toLowerCase().startsWith(term)) {
        const key = p.productType;
        categorySuggestions.set(key, (categorySuggestions.get(key) || 0) + 1);
      }
    }

    // Combine and sort by frequency
    const all = [
      ...Array.from(brandSuggestions.entries()).map(([label, count]) => ({
        type: 'brand' as const,
        label,
        value: label,
        count,
      })),
      ...Array.from(categorySuggestions.entries()).map(([label, count]) => ({
        type: 'category' as const,
        label,
        value: label,
        count,
      })),
      ...Array.from(productSuggestions.entries()).map(([label, count]) => ({
        type: 'product' as const,
        label,
        value: label,
        count,
      })),
    ]
      .sort((a, b) => b.count - a.count)
      .slice(0, limit);

    return { suggestions: all };
  }

  /**
   * Advanced filters - get available filter options
   */
  async getFilterOptions(): Promise<{
    productTypes: string[];
    brands: string[];
    finishes: string[];
    grades: string[];
    priceRange: { min: number; max: number };
    qualityRange: { min: number; max: number };
  }> {
    const products = await this.prisma.product.findMany({
      include: {
        brand: true,
        prices: { orderBy: { timestamp: 'desc' }, take: 1 },
        qualityAnalysis: true,
      },
    });

    const productTypes = [...new Set(products.map((p) => p.productType))].sort();
    const brands = [...new Set(products.map((p) => p.brand.name))].sort();
    const finishes = [...new Set(products.map((p) => p.finish))].sort();
    const grades = [...new Set(products.map((p) => p.estimatedGrade))].sort();

    const prices = products.filter((p) => p.prices.length > 0).map((p) => p.prices[0]!.price);
    const qualities = products
      .filter((p) => p.qualityAnalysis)
      .map((p) => p.qualityAnalysis!.qualityScore);

    return {
      productTypes,
      brands,
      finishes,
      grades,
      priceRange: {
        min: Math.min(...prices),
        max: Math.max(...prices),
      },
      qualityRange: {
        min: Math.min(...qualities),
        max: Math.max(...qualities),
      },
    };
  }

  /**
   * Search by category with trending
   */
  async searchByCategory(category: string, limit = 20): Promise<{
    category: string;
    total: number;
    products: Array<{
      id: string;
      title: string;
      brand: string;
      price: number;
      quality: number;
      popularity: number;
    }>;
    trending: Array<{
      id: string;
      title: string;
      trend: 'up' | 'down' | 'stable';
      trendValue: number;
    }>;
  }> {
    const products = await this.prisma.product.findMany({
      where: { productType: category },
      include: {
        brand: true,
        prices: { take: 30, orderBy: { timestamp: 'asc' } },
        qualityAnalysis: true,
        savedProducts: true,
        priceAlerts: true,
      },
    });

    // Calculate popularity (saved + alerts)
    const withPopularity = products.map((p) => ({
      ...p,
      popularity: p.savedProducts.length + p.priceAlerts.length,
    }));

    // Sort by popularity
    const sorted = withPopularity.sort((a, b) => b.popularity - a.popularity);

    // Get trending (price change direction)
    const trending = sorted.slice(0, 5).map((p) => {
      let trend: 'up' | 'down' | 'stable' = 'stable';
      let trendValue = 0;

      if (p.prices.length > 1) {
        const oldPrice = p.prices[0].price;
        const newPrice = p.prices[p.prices.length - 1].price;
        trendValue = ((newPrice - oldPrice) / oldPrice) * 100;
        trend = trendValue > 2 ? 'up' : trendValue < -2 ? 'down' : 'stable';
      }

      return {
        id: p.id,
        title: p.title,
        trend,
        trendValue: Math.round(trendValue * 100) / 100,
      };
    });

    const results = sorted
      .slice(0, limit)
      .map((p) => ({
        id: p.id,
        title: p.title,
        brand: p.brand.name,
        price: p.prices[p.prices.length - 1]?.price || 0,
        quality: p.qualityAnalysis?.qualityScore || 0,
        popularity: p.popularity,
      }));

    return {
      category,
      total: products.length,
      products: results,
      trending,
    };
  }

  /**
   * Helper: Calculate facets for filtering
   */
  private calculateFacets(products: any[]): {
    productTypes: Array<{ name: string; count: number }>;
    brands: Array<{ name: string; count: number }>;
    priceRanges: Array<{ range: string; count: number }>;
    qualityRanges: Array<{ range: string; count: number }>;
    grades: Array<{ name: string; count: number }>;
  } {
    const typeMap = new Map<string, number>();
    const brandMap = new Map<string, number>();
    const gradeMap = new Map<string, number>();
    let budget = 0,
      economy = 0,
      midRange = 0,
      premium = 0;
    let poor = 0,
      fair = 0,
      good = 0,
      excellent = 0;

    for (const p of products) {
      typeMap.set(p.productType, (typeMap.get(p.productType) || 0) + 1);
      brandMap.set(p.brand.name, (brandMap.get(p.brand.name) || 0) + 1);
      gradeMap.set(p.estimatedGrade, (gradeMap.get(p.estimatedGrade) || 0) + 1);

      const price = p.prices[0]?.price || 0;
      if (price < 50) budget++;
      else if (price < 200) economy++;
      else if (price < 500) midRange++;
      else premium++;

      const quality = p.qualityAnalysis?.qualityScore || 0;
      if (quality < 0.3) poor++;
      else if (quality < 0.5) fair++;
      else if (quality < 0.7) good++;
      else excellent++;
    }

    return {
      productTypes: Array.from(typeMap.entries())
        .map(([name, count]) => ({ name, count }))
        .sort((a, b) => b.count - a.count),
      brands: Array.from(brandMap.entries())
        .map(([name, count]) => ({ name, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 20),
      priceRanges: [
        { range: 'Under $50', count: budget },
        { range: '$50 - $200', count: economy },
        { range: '$200 - $500', count: midRange },
        { range: '$500+', count: premium },
      ],
      qualityRanges: [
        { range: 'Poor (< 0.3)', count: poor },
        { range: 'Fair (0.3-0.5)', count: fair },
        { range: 'Good (0.5-0.7)', count: good },
        { range: 'Excellent (> 0.7)', count: excellent },
      ],
      grades: Array.from(gradeMap.entries())
        .map(([name, count]) => ({ name, count }))
        .sort((a, b) => b.count - a.count),
    };
  }

  async onModuleDestroy() {
    await this.prisma.$disconnect();
  }
}
