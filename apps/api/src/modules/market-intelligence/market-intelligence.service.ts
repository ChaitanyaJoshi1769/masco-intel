import { Injectable } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class MarketIntelligenceService {
  private prisma: PrismaClient;

  constructor() {
    this.prisma = new PrismaClient();
  }

  /**
   * Get comprehensive brand metrics (all brands or filtered)
   */
  async getBrandMetrics(brandName?: string) {
    const products = await this.prisma.product.findMany({
      where: brandName ? { brand: { name: { contains: brandName, mode: 'insensitive' as any } } } : {},
      include: {
        brand: true,
        prices: { orderBy: { timestamp: 'desc' }, take: 1 },
        qualityAnalysis: true,
        contractorIntelligence: true,
      },
    });

    // Group by brand
    const byBrand = new Map<string, any[]>();
    products.forEach((p) => {
      const bn = p.brand?.name || 'Unknown';
      if (!byBrand.has(bn)) byBrand.set(bn, []);
      byBrand.get(bn)!.push(p);
    });

    // Calculate metrics per brand
    const metrics = Array.from(byBrand.entries()).map(([name, items]) => {
      const avgQuality = items.reduce((sum, p) => sum + (p.qualityAnalysis?.qualityScore || 0), 0) / (items.length || 1);
      const avgPrice = items.reduce((sum, p) => sum + (p.prices[0]?.price || 0), 0) / (items.length || 1);
      const avgFailureRate = items.reduce((sum, p) => sum + (p.contractorIntelligence?.failureRate || 0.05), 0) / (items.length || 1);
      const avgLongevity = items.reduce((sum, p) => sum + (p.contractorIntelligence?.longevity || 10), 0) / (items.length || 1);
      const priceRange = {
        min: Math.min(...items.map((p) => p.prices[0]?.price || 0)),
        max: Math.max(...items.map((p) => p.prices[0]?.price || 0)),
      };

      return {
        brand: name,
        productCount: items.length,
        avgQualityScore: Math.round(avgQuality * 100) / 100,
        avgPrice: Math.round(avgPrice * 100) / 100,
        priceRange,
        avgFailureRate: Math.round(avgFailureRate * 10000) / 10000,
        avgLongevity: Math.round(avgLongevity * 100) / 100,
        marketShare: 0, // Will be calculated below
      };
    });

    // Calculate market share
    const totalProducts = metrics.reduce((sum, m) => sum + m.productCount, 0);
    metrics.forEach((m) => {
      m.marketShare = Math.round((m.productCount / (totalProducts || 1)) * 10000) / 100;
    });

    return metrics.sort((a, b) => b.productCount - a.productCount);
  }

  /**
   * Get price trend for a product (90-day, 6-month, 1-year)
   */
  async getPriceTrend(productId: string, days = 90) {
    const product = await this.prisma.product.findUnique({
      where: { id: productId },
      include: {
        prices: {
          orderBy: { timestamp: 'desc' },
          where: {
            timestamp: {
              gte: new Date(Date.now() - days * 24 * 60 * 60 * 1000),
            },
          },
        },
      },
    });

    if (!product) return null;

    const prices = product.prices.sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());

    const minPrice = Math.min(...prices.map((p) => p.price));
    const maxPrice = Math.max(...prices.map((p) => p.price));
    const avgPrice = prices.reduce((sum, p) => sum + p.price, 0) / (prices.length || 1);
    const currentPrice = prices[prices.length - 1]?.price || 0;
    const volatility = ((maxPrice - minPrice) / avgPrice) * 100;

    return {
      productId,
      productTitle: product.title,
      timeframe: `${days} days`,
      pricePoints: prices.map((p) => ({
        price: p.price,
        timestamp: p.timestamp,
        retailer: p.retailerId,
      })),
      statistics: {
        currentPrice: Math.round(currentPrice * 100) / 100,
        minPrice: Math.round(minPrice * 100) / 100,
        maxPrice: Math.round(maxPrice * 100) / 100,
        avgPrice: Math.round(avgPrice * 100) / 100,
        volatility: Math.round(volatility * 100) / 100,
        trend: currentPrice > avgPrice ? 'increasing' : currentPrice < avgPrice ? 'decreasing' : 'stable',
      },
    };
  }

  /**
   * Get market share distribution by brand
   */
  async getMarketShare(productType?: string) {
    const products = await this.prisma.product.findMany({
      where: productType ? { productType: { contains: productType, mode: 'insensitive' as any } } : {},
      include: { brand: true },
    });

    const byBrand = new Map<string, number>();
    products.forEach((p) => {
      const bn = p.brand?.name || 'Unknown';
      byBrand.set(bn, (byBrand.get(bn) || 0) + 1);
    });

    const total = products.length;
    const distribution = Array.from(byBrand.entries())
      .map(([brand, count]) => ({
        brand,
        count,
        percentage: Math.round((count / (total || 1)) * 10000) / 100,
      }))
      .sort((a, b) => b.count - a.count);

    return {
      category: productType || 'all',
      totalProducts: total,
      brandCount: distribution.length,
      distribution,
    };
  }

  /**
   * Get competitive positioning analysis for a product type
   */
  async getCompetitivePositioning(productType: string) {
    const products = await this.prisma.product.findMany({
      where: { productType: { contains: productType, mode: 'insensitive' as any } },
      include: {
        brand: true,
        prices: { orderBy: { timestamp: 'desc' }, take: 1 },
        qualityAnalysis: true,
      },
    });

    const byBrand = new Map<string, typeof products>();
    products.forEach((p) => {
      const bn = p.brand?.name || 'Unknown';
      if (!byBrand.has(bn)) byBrand.set(bn, []);
      byBrand.get(bn)!.push(p);
    });

    const positioning = Array.from(byBrand.entries()).map(([brand, items]) => {
      const avgPrice = items.reduce((sum, p) => sum + (p.prices[0]?.price || 0), 0) / (items.length || 1);
      const avgQuality = items.reduce((sum, p) => sum + (p.qualityAnalysis?.qualityScore || 0), 0) / (items.length || 1);
      const valueScore = avgQuality / (avgPrice || 1);

      return {
        brand,
        avgPrice: Math.round(avgPrice * 100) / 100,
        avgQuality: Math.round(avgQuality * 100) / 100,
        valueScore: Math.round(valueScore * 10000) / 10000,
        productCount: items.length,
        positioning: valueScore > 0.3 ? 'premium-value' : valueScore > 0.15 ? 'mid-range' : 'budget',
      };
    });

    return {
      productType,
      brands: positioning.sort((a, b) => b.valueScore - a.valueScore),
    };
  }

  /**
   * Get price volatility analysis for a product
   */
  async getVolatilityAnalysis(productId: string) {
    const product = await this.prisma.product.findUnique({
      where: { id: productId },
      include: {
        brand: true,
        prices: { orderBy: { timestamp: 'desc' }, take: 90 },
      },
    });

    if (!product || product.prices.length === 0) return null;

    const prices = product.prices.sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime()).map((p) => p.price);

    // Calculate standard deviation
    const mean = prices.reduce((sum, p) => sum + p, 0) / prices.length;
    const variance = prices.reduce((sum, p) => sum + Math.pow(p - mean, 2), 0) / prices.length;
    const stdDev = Math.sqrt(variance);
    const coefficientOfVariation = (stdDev / mean) * 100;

    // Find price trend
    const firstPrice = prices[0];
    const lastPrice = prices[prices.length - 1];
    const priceChange = ((lastPrice - firstPrice) / firstPrice) * 100;

    return {
      productId,
      productTitle: product.title,
      brand: product.brand?.name,
      priceCount: prices.length,
      statistics: {
        minPrice: Math.round(Math.min(...prices) * 100) / 100,
        maxPrice: Math.round(Math.max(...prices) * 100) / 100,
        avgPrice: Math.round(mean * 100) / 100,
        stdDev: Math.round(stdDev * 100) / 100,
        coefficientOfVariation: Math.round(coefficientOfVariation * 100) / 100,
        volatilityRating: coefficientOfVariation > 10 ? 'high' : coefficientOfVariation > 5 ? 'medium' : 'low',
      },
      priceMovement: {
        change: Math.round(priceChange * 100) / 100,
        direction: priceChange > 0 ? 'increasing' : priceChange < 0 ? 'decreasing' : 'stable',
        firstPrice: Math.round(firstPrice * 100) / 100,
        lastPrice: Math.round(lastPrice * 100) / 100,
      },
    };
  }

  /**
   * Find best buy time for a product based on historical low
   */
  async findBestBuyTime(productId: string) {
    const product = await this.prisma.product.findUnique({
      where: { id: productId },
      include: {
        prices: { orderBy: { timestamp: 'asc' } },
      },
    });

    if (!product || product.prices.length === 0) return null;

    const prices = product.prices;
    const minPrice = Math.min(...prices.map((p) => p.price));
    const maxPrice = Math.max(...prices.map((p) => p.price));
    const avgPrice = prices.reduce((sum, p) => sum + p.price, 0) / prices.length;
    const currentPrice = prices[prices.length - 1]?.price || 0;

    // Calculate discount potential
    const discountFromMax = ((maxPrice - currentPrice) / maxPrice) * 100;
    const discountFromMin = ((currentPrice - minPrice) / minPrice) * 100;

    // Determine if it's a good time to buy
    const isGoodDeal = currentPrice <= avgPrice * 1.05; // Within 5% of average
    const savingsVsMax = maxPrice - currentPrice;
    const recommendation = isGoodDeal ? 'buy-now' : discountFromMax > 15 ? 'wait-for-drop' : 'neutral';

    return {
      productId,
      productTitle: product.title,
      currentPrice: Math.round(currentPrice * 100) / 100,
      historicalLow: Math.round(minPrice * 100) / 100,
      historicalHigh: Math.round(maxPrice * 100) / 100,
      averagePrice: Math.round(avgPrice * 100) / 100,
      metrics: {
        discountFromMax: Math.round(discountFromMax * 100) / 100,
        discountFromMin: Math.round(discountFromMin * 100) / 100,
        savingsVsMax: Math.round(savingsVsMax * 100) / 100,
      },
      recommendation,
      priceHistory: {
        dataPoints: prices.length,
        timespan: `${Math.ceil((prices[prices.length - 1].timestamp.getTime() - prices[0].timestamp.getTime()) / (24 * 60 * 60 * 1000))} days`,
      },
    };
  }

  async onModuleDestroy() {
    await this.prisma.$disconnect();
  }
}
