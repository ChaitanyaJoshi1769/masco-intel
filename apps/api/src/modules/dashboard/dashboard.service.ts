import { Injectable } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class DashboardService {
  private prisma: PrismaClient;

  constructor() {
    this.prisma = new PrismaClient();
  }

  /**
   * Get market trends overview for dashboard
   */
  async getMarketTrends(days = 90): Promise<{
    timeframe: string;
    totalProducts: number;
    averagePrice: number;
    priceChange: {
      percentage: number;
      direction: 'up' | 'down' | 'stable';
    };
    topBrands: Array<{
      name: string;
      productCount: number;
      averagePrice: number;
      marketShare: number;
    }>;
    priceDistribution: {
      budget: number; // < $50
      economy: number; // $50-$200
      midRange: number; // $200-$500
      premium: number; // $500+
    };
    trendingCategories: Array<{
      productType: string;
      productCount: number;
      growthRate: number;
    }>;
  }> {
    const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

    // Get all products
    const products = await this.prisma.product.findMany({
      include: {
        brand: true,
        prices: {
          where: { timestamp: { gte: startDate } },
          orderBy: { timestamp: 'asc' },
        },
      },
    });

    const totalProducts = products.length;

    // Calculate prices and trends
    const allPrices: number[] = [];
    const startPrices: number[] = [];
    const endPrices: number[] = [];

    products.forEach((p) => {
      if (p.prices.length > 0) {
        allPrices.push(...p.prices.map((pr) => pr.price));
        startPrices.push(p.prices[0].price);
        endPrices.push(p.prices[p.prices.length - 1].price);
      }
    });

    const averagePrice = allPrices.length > 0
      ? Math.round((allPrices.reduce((a, b) => a + b, 0) / allPrices.length) * 100) / 100
      : 0;

    const avgStartPrice = startPrices.length > 0
      ? startPrices.reduce((a, b) => a + b, 0) / startPrices.length
      : 0;

    const avgEndPrice = endPrices.length > 0
      ? endPrices.reduce((a, b) => a + b, 0) / endPrices.length
      : 0;

    const priceChangePercent = avgStartPrice > 0
      ? ((avgEndPrice - avgStartPrice) / avgStartPrice) * 100
      : 0;

    // Get top brands
    const brandStats = new Map<
      string,
      { count: number; totalPrice: number; name: string }
    >();

    products.forEach((p) => {
      if (!brandStats.has(p.brandId)) {
        brandStats.set(p.brandId, {
          count: 0,
          totalPrice: 0,
          name: p.brand.name,
        });
      }
      const stat = brandStats.get(p.brandId)!;
      stat.count++;
      if (p.prices.length > 0) {
        stat.totalPrice += p.prices[p.prices.length - 1].price;
      }
    });

    const topBrands = Array.from(brandStats.values())
      .map((stat) => ({
        name: stat.name,
        productCount: stat.count,
        averagePrice: Math.round((stat.totalPrice / stat.count) * 100) / 100,
        marketShare: Math.round((stat.count / totalProducts) * 100 * 100) / 100,
      }))
      .sort((a, b) => b.productCount - a.productCount)
      .slice(0, 10);

    // Price distribution
    const priceDistribution = {
      budget: 0,
      economy: 0,
      midRange: 0,
      premium: 0,
    };

    products.forEach((p) => {
      if (p.prices.length > 0) {
        const currentPrice = p.prices[p.prices.length - 1].price;
        if (currentPrice < 50) priceDistribution.budget++;
        else if (currentPrice < 200) priceDistribution.economy++;
        else if (currentPrice < 500) priceDistribution.midRange++;
        else priceDistribution.premium++;
      }
    });

    // Trending categories (by number of products)
    const categoryStats = new Map<
      string,
      { count: number; products: typeof products }
    >();

    products.forEach((p) => {
      if (!categoryStats.has(p.productType)) {
        categoryStats.set(p.productType, { count: 0, products: [] });
      }
      categoryStats.get(p.productType)!.count++;
      categoryStats.get(p.productType)!.products.push(p);
    });

    const trendingCategories = Array.from(categoryStats.values())
      .map((cat) => {
        // Calculate growth rate (products with recent prices)
        const recentProducts = cat.products.filter((p) => p.prices.length > 0);
        const growthRate = (recentProducts.length / cat.count) * 100;
        return {
          productType: cat.products[0].productType,
          productCount: cat.count,
          growthRate: Math.round(growthRate * 100) / 100,
        };
      })
      .sort((a, b) => b.productCount - a.productCount)
      .slice(0, 8);

    return {
      timeframe: `${days} days`,
      totalProducts,
      averagePrice,
      priceChange: {
        percentage: Math.round(priceChangePercent * 100) / 100,
        direction: priceChangePercent > 2 ? 'up' : priceChangePercent < -2 ? 'down' : 'stable',
      },
      topBrands,
      priceDistribution,
      trendingCategories,
    };
  }

  /**
   * Get analytics summary for dashboard
   */
  async getAnalyticsSummary(): Promise<{
    productAnalytics: {
      total: number;
      withPriceHistory: number;
      withQualityScore: number;
      withContractorIntel: number;
    };
    priceAnalytics: {
      averagePrice: number;
      minPrice: number;
      maxPrice: number;
      pricePoints: number;
      lastUpdated: string;
    };
    qualityAnalytics: {
      averageScore: number;
      highQuality: number; // score > 0.7
      mediumQuality: number; // 0.4-0.7
      lowQuality: number; // < 0.4
    };
    contractorAnalytics: {
      averageFailureRate: number;
      averageRepairCost: number;
      averageLongevity: number;
    };
    trendingMetrics: {
      mostComparisonsToday: string;
      mostSavedToday: string;
      topAlertedProduct: string;
      mostViewedCategory: string;
    };
  }> {
    // Get products
    const products = await this.prisma.product.findMany({
      include: {
        prices: true,
        qualityAnalysis: true,
        contractorIntelligence: true,
        savedProducts: true,
        priceAlerts: true,
      },
    });

    const withPriceHistory = products.filter((p) => p.prices.length > 0).length;
    const withQualityScore = products.filter((p) => p.qualityAnalysis).length;
    const withContractorIntel = products.filter((p) => p.contractorIntelligence).length;

    // Price analytics
    const allPrices = products
      .flatMap((p) => p.prices.map((pr) => pr.price))
      .filter((p) => p > 0);

    const avgPrice = allPrices.length > 0
      ? Math.round((allPrices.reduce((a, b) => a + b, 0) / allPrices.length) * 100) / 100
      : 0;

    const minPrice = allPrices.length > 0 ? Math.min(...allPrices) : 0;
    const maxPrice = allPrices.length > 0 ? Math.max(...allPrices) : 0;

    // Quality analytics
    const qualityScores = products
      .filter((p) => p.qualityAnalysis)
      .map((p) => p.qualityAnalysis!.qualityScore);

    const avgQuality = qualityScores.length > 0
      ? Math.round((qualityScores.reduce((a, b) => a + b, 0) / qualityScores.length) * 100) / 100
      : 0;

    const highQuality = qualityScores.filter((s) => s > 0.7).length;
    const mediumQuality = qualityScores.filter((s) => s >= 0.4 && s <= 0.7).length;
    const lowQuality = qualityScores.filter((s) => s < 0.4).length;

    // Contractor analytics
    const contractorData = products.filter((p) => p.contractorIntelligence);
    const avgFailure = contractorData.length > 0
      ? Math.round(
        (contractorData
          .map((p) => p.contractorIntelligence!.failureRate)
          .reduce((a, b) => a + b, 0) / contractorData.length) * 100
      ) / 100
      : 0;

    const avgRepair = contractorData.length > 0
      ? Math.round(
        (contractorData
          .map((p) => p.contractorIntelligence!.repairCost)
          .reduce((a, b) => a + b, 0) / contractorData.length) * 100
      ) / 100
      : 0;

    const avgLongevity = contractorData.length > 0
      ? Math.round(
        contractorData
          .map((p) => p.contractorIntelligence!.longevity)
          .reduce((a, b) => a + b, 0) / contractorData.length
      )
      : 0;

    // Trending metrics (simplified for demo)
    const mostSaved = products.reduce((best, p) => {
      return p.savedProducts.length > best.savedProducts.length ? p : best;
    }, products[0]);

    const mostAlerted = products.reduce((best, p) => {
      return p.priceAlerts.length > best.priceAlerts.length ? p : best;
    }, products[0]);

    const latestPrice = products
      .filter((p) => p.prices.length > 0)
      .map((p) => ({
        ...p,
        lastPrice: p.prices[p.prices.length - 1],
      }))
      .sort((a, b) => b.lastPrice.timestamp.getTime() - a.lastPrice.timestamp.getTime())
      [0];

    return {
      productAnalytics: {
        total: products.length,
        withPriceHistory,
        withQualityScore,
        withContractorIntel,
      },
      priceAnalytics: {
        averagePrice: avgPrice,
        minPrice,
        maxPrice,
        pricePoints: allPrices.length,
        lastUpdated: latestPrice?.prices[latestPrice.prices.length - 1].timestamp.toISOString() || new Date().toISOString(),
      },
      qualityAnalytics: {
        averageScore: avgQuality,
        highQuality,
        mediumQuality,
        lowQuality,
      },
      contractorAnalytics: {
        averageFailureRate: avgFailure,
        averageRepairCost: avgRepair,
        averageLongevity: avgLongevity,
      },
      trendingMetrics: {
        mostComparisonsToday: 'Data collection in progress',
        mostSavedToday: mostSaved?.title || 'N/A',
        topAlertedProduct: mostAlerted?.title || 'N/A',
        mostViewedCategory: 'Data collection in progress',
      },
    };
  }

  /**
   * Get price trend data for chart visualization
   */
  async getPriceTrendData(productId: string, days = 90): Promise<{
    productId: string;
    title: string;
    brand: string;
    data: Array<{
      date: string;
      price: number;
      minPrice: number;
      maxPrice: number;
      avgPrice: number;
    }>;
    summary: {
      current: number;
      min: number;
      max: number;
      trend: 'upward' | 'downward' | 'stable';
      volatility: number;
    };
  } | null> {
    const product = await this.prisma.product.findUnique({
      where: { id: productId },
      include: {
        brand: true,
        prices: {
          where: {
            timestamp: {
              gte: new Date(Date.now() - days * 24 * 60 * 60 * 1000),
            },
          },
          orderBy: { timestamp: 'asc' },
        },
      },
    });

    if (!product || product.prices.length === 0) return null;

    // Group prices by day
    const pricesByDay = new Map<string, number[]>();
    product.prices.forEach((p) => {
      const dateKey = p.timestamp.toISOString().split('T')[0];
      if (!pricesByDay.has(dateKey)) {
        pricesByDay.set(dateKey, []);
      }
      pricesByDay.get(dateKey)!.push(p.price);
    });

    // Create trend data
    const trendData = Array.from(pricesByDay.entries())
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(([date, prices]) => ({
        date,
        price: Math.round(prices[prices.length - 1] * 100) / 100,
        minPrice: Math.round(Math.min(...prices) * 100) / 100,
        maxPrice: Math.round(Math.max(...prices) * 100) / 100,
        avgPrice: Math.round((prices.reduce((a, b) => a + b, 0) / prices.length) * 100) / 100,
      }));

    // Calculate summary
    const currentPrice = product.prices[product.prices.length - 1].price;
    const allPrices = product.prices.map((p) => p.price);
    const minPrice = Math.min(...allPrices);
    const maxPrice = Math.max(...allPrices);
    const avgPrice = allPrices.reduce((a, b) => a + b, 0) / allPrices.length;

    const variance = allPrices.reduce((sum, p) => sum + Math.pow(p - avgPrice, 2), 0) / allPrices.length;
    const stdDev = Math.sqrt(variance);
    const volatility = Math.round((stdDev / avgPrice) * 100 * 100) / 100;

    const trend = currentPrice > avgPrice ? 'upward' : currentPrice < avgPrice ? 'downward' : 'stable';

    return {
      productId,
      title: product.title,
      brand: product.brand.name,
      data: trendData,
      summary: {
        current: Math.round(currentPrice * 100) / 100,
        min: minPrice,
        max: maxPrice,
        trend,
        volatility,
      },
    };
  }

  /**
   * Get quality distribution data for visualization
   */
  async getQualityDistribution(): Promise<{
    total: number;
    byScore: Array<{
      range: string;
      count: number;
      percentage: number;
      examples: Array<{ productId: string; title: string; score: number }>;
    }>;
    byCategory: Array<{
      category: string;
      averageScore: number;
      productCount: number;
    }>;
  }> {
    const products = await this.prisma.product.findMany({
      include: { qualityAnalysis: true },
    });

    const withQuality = products.filter((p) => p.qualityAnalysis);
    const total = withQuality.length;

    // Group by score ranges
    const ranges = [
      { min: 0, max: 0.3, label: 'Poor (0-0.3)' },
      { min: 0.3, max: 0.5, label: 'Fair (0.3-0.5)' },
      { min: 0.5, max: 0.7, label: 'Good (0.5-0.7)' },
      { min: 0.7, max: 1, label: 'Excellent (0.7-1.0)' },
    ];

    const byScore = ranges.map((range) => {
      const inRange = withQuality.filter(
        (p) =>
          p.qualityAnalysis!.qualityScore >= range.min &&
          p.qualityAnalysis!.qualityScore < range.max
      );

      const examples = inRange
        .sort((a, b) => b.qualityAnalysis!.qualityScore - a.qualityAnalysis!.qualityScore)
        .slice(0, 3)
        .map((p) => ({
          productId: p.id,
          title: p.title,
          score: p.qualityAnalysis!.qualityScore,
        }));

      return {
        range: range.label,
        count: inRange.length,
        percentage: total > 0 ? Math.round((inRange.length / total) * 100 * 100) / 100 : 0,
        examples,
      };
    });

    // By category
    const categoryMap = new Map<string, { total: number; sum: number }>();
    products.forEach((p) => {
      if (!categoryMap.has(p.productType)) {
        categoryMap.set(p.productType, { total: 0, sum: 0 });
      }
      const cat = categoryMap.get(p.productType)!;
      if (p.qualityAnalysis) {
        cat.total++;
        cat.sum += p.qualityAnalysis.qualityScore;
      }
    });

    const byCategory = Array.from(categoryMap.entries())
      .map(([category, data]) => ({
        category,
        averageScore: data.total > 0 ? Math.round((data.sum / data.total) * 100) / 100 : 0,
        productCount: data.total,
      }))
      .sort((a, b) => b.productCount - a.productCount);

    return { total, byScore, byCategory };
  }

  async onModuleDestroy() {
    await this.prisma.$disconnect();
  }
}
