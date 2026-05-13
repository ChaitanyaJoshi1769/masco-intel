import { Injectable } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class AdvancedRecommendationsService {
  private prisma: PrismaClient;

  constructor() {
    this.prisma = new PrismaClient();
  }

  /**
   * Get personalized recommendations for a user based on history
   */
  async getPersonalizedRecommendations(userId: string, limit = 10): Promise<{
    recommendations: Array<{
      productId: string;
      title: string;
      brand: string;
      price: number;
      quality: number;
      reason: string;
      score: number;
    }>;
    insights: {
      favoriteCategory: string;
      averageSpend: number;
      preferredBrands: string[];
      qualityPreference: 'budget' | 'mid-range' | 'premium' | 'mixed';
    };
  }> {
    // Get user's saved products
    const savedProducts = await this.prisma.savedProduct.findMany({
      where: { userId },
      include: {
        product: {
          include: {
            brand: true,
            prices: { orderBy: { timestamp: 'desc' }, take: 1 },
            qualityAnalysis: true,
          },
        },
      },
    });

    if (savedProducts.length === 0) {
      return {
        recommendations: [],
        insights: {
          favoriteCategory: 'unknown',
          averageSpend: 0,
          preferredBrands: [],
          qualityPreference: 'mixed',
        },
      };
    }

    // Analyze user preferences
    const categories = new Map<string, number>();
    const brands = new Map<string, number>();
    let totalPrice = 0;
    let qualityScores: number[] = [];

    for (const saved of savedProducts) {
      categories.set(
        saved.product.productType,
        (categories.get(saved.product.productType) || 0) + 1
      );
      brands.set(saved.product.brand.name, (brands.get(saved.product.brand.name) || 0) + 1);

      if (saved.product.prices[0]) {
        totalPrice += saved.product.prices[0].price;
      }

      if (saved.product.qualityAnalysis) {
        qualityScores.push(saved.product.qualityAnalysis.qualityScore);
      }
    }

    const favoriteCategory = Array.from(categories.entries()).sort((a, b) => b[1] - a[1])[0][0];
    const preferredBrands = Array.from(brands.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([name]) => name);

    const averageSpend = totalPrice / savedProducts.length;
    const avgQuality = qualityScores.length > 0
      ? qualityScores.reduce((a, b) => a + b) / qualityScores.length
      : 0.5;

    const qualityPreference =
      avgQuality > 0.7 ? 'premium' : avgQuality > 0.5 ? 'mid-range' : 'budget';

    // Get recommendations from same category
    const categoryProducts = await this.prisma.product.findMany({
      where: {
        productType: favoriteCategory,
        NOT: { id: { in: savedProducts.map((s) => s.productId) } },
      },
      include: {
        brand: true,
        prices: { orderBy: { timestamp: 'desc' }, take: 1 },
        qualityAnalysis: true,
        contractorIntelligence: true,
      },
      take: limit * 3,
    });

    // Score recommendations
    const scored = categoryProducts.map((p) => {
      let score = 0;
      let reasons: string[] = [];

      // Brand preference
      if (preferredBrands.includes(p.brand.name)) {
        score += 30;
        reasons.push('Your favorite brand');
      }

      // Price alignment
      const priceMatch = p.prices[0]?.price || 0;
      const priceDiff = Math.abs(priceMatch - averageSpend);
      if (priceDiff < averageSpend * 0.3) {
        score += 25;
        reasons.push('Similar price range');
      }

      // Quality alignment
      const quality = p.qualityAnalysis?.qualityScore || 0.5;
      if (
        (qualityPreference === 'premium' && quality > 0.7) ||
        (qualityPreference === 'mid-range' && quality >= 0.5 && quality <= 0.7) ||
        (qualityPreference === 'budget' && quality < 0.5)
      ) {
        score += 25;
        reasons.push('Matches your quality preference');
      }

      // High quality bonus
      if (quality > 0.8) {
        score += 15;
        reasons.push('Excellent quality');
      }

      // Contractor intel
      if (p.contractorIntelligence && p.contractorIntelligence.failureRate < 0.1) {
        score += 10;
        reasons.push('Highly reliable');
      }

      // New product bonus
      const daysOld = Math.ceil(
        (Date.now() - p.createdAt.getTime()) / (1000 * 60 * 60 * 24)
      );
      if (daysOld < 30) {
        score += 5;
        reasons.push('Recently added');
      }

      return {
        productId: p.id,
        title: p.title,
        brand: p.brand.name,
        price: priceMatch,
        quality,
        score,
        reasons,
      };
    });

    const recommendations = scored
      .sort((a, b) => b.score - a.score)
      .slice(0, limit)
      .map((r) => ({
        ...r,
        reason: r.reasons.join(', '),
        reasons: undefined,
      } as any));

    return {
      recommendations,
      insights: {
        favoriteCategory,
        averageSpend: Math.round(averageSpend * 100) / 100,
        preferredBrands,
        qualityPreference,
      },
    };
  }

  /**
   * Get trending products based on recent activity
   */
  async getTrendingProducts(days = 7, limit = 15): Promise<{
    trending: Array<{
      productId: string;
      title: string;
      brand: string;
      price: number;
      quality: number;
      saves: number;
      alerts: number;
      trendScore: number;
    }>;
    period: string;
  }> {
    const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

    const products = await this.prisma.product.findMany({
      include: {
        brand: true,
        prices: { orderBy: { timestamp: 'desc' }, take: 1 },
        qualityAnalysis: true,
        savedProducts: { where: { savedAt: { gte: startDate } } },
        priceAlerts: { where: { createdAt: { gte: startDate } } },
      },
    });

    const scored = products
      .map((p) => ({
        productId: p.id,
        title: p.title,
        brand: p.brand.name,
        price: p.prices[0]?.price || 0,
        quality: p.qualityAnalysis?.qualityScore || 0,
        saves: p.savedProducts.length,
        alerts: p.priceAlerts.length,
        trendScore: p.savedProducts.length * 2 + p.priceAlerts.length,
      }))
      .filter((p) => p.trendScore > 0)
      .sort((a, b) => b.trendScore - a.trendScore)
      .slice(0, limit);

    return {
      trending: scored,
      period: `Last ${days} days`,
    };
  }

  /**
   * Get complementary products (bundles)
   */
  async getComplementaryProducts(productId: string, limit = 5): Promise<{
    product: {
      id: string;
      title: string;
      brand: string;
      price: number;
    };
    complements: Array<{
      id: string;
      title: string;
      brand: string;
      price: number;
      compatibility: string;
      bundlePrice: number;
      savings: number;
    }>;
  }> {
    const product = await this.prisma.product.findUnique({
      where: { id: productId },
      include: {
        brand: true,
        prices: { orderBy: { timestamp: 'desc' }, take: 1 },
        compatibilityTarget: { include: { sourceProduct: { include: { brand: true, prices: { take: 1 } } } } },
      },
    });

    if (!product) {
      throw new Error('Product not found');
    }

    const complements = product.compatibilityTarget
      .slice(0, limit)
      .map((compat) => {
        const price = compat.sourceProduct.prices[0]?.price || 0;
        const bundlePrice = (product.prices[0]?.price || 0) + price;
        const savings = Math.max(0, bundlePrice * 0.1); // 10% bundle discount

        return {
          id: compat.sourceProduct.id,
          title: compat.sourceProduct.title,
          brand: compat.sourceProduct.brand.name,
          price: Math.round(price * 100) / 100,
          compatibility: compat.relationship,
          bundlePrice: Math.round((bundlePrice - savings) * 100) / 100,
          savings: Math.round(savings * 100) / 100,
        };
      });

    return {
      product: {
        id: product.id,
        title: product.title,
        brand: product.brand.name,
        price: Math.round((product.prices[0]?.price || 0) * 100) / 100,
      },
      complements,
    };
  }

  /**
   * Get recommendations based on contractor needs
   */
  async getContractorRecommendations(criteria: {
    budget: number;
    reliability: number; // 0-1
    longevity: number; // years
    installationDifficulty?: number; // 1-10, lower is easier
    quantity: number;
  }): Promise<{
    recommendations: Array<{
      id: string;
      title: string;
      brand: string;
      unitPrice: number;
      totalCost: number;
      reliability: number;
      longevity: number;
      installTime: number;
      roi: number;
      score: number;
    }>;
    summary: {
      bestValue: string;
      mostReliable: string;
      fastestInstall: string;
      bestROI: string;
    };
  }> {
    const products = await this.prisma.product.findMany({
      include: {
        brand: true,
        prices: { orderBy: { timestamp: 'desc' }, take: 1 },
        contractorIntelligence: true,
        qualityAnalysis: true,
      },
    });

    const candidates = products
      .filter((p) => {
        const price = p.prices[0]?.price || 0;
        if (price * criteria.quantity > criteria.budget) return false;

        const ci = p.contractorIntelligence;
        if (!ci) return false;
        if (ci.failureRate > 1 - criteria.reliability) return false;
        if (ci.longevity < criteria.longevity) return false;

        return true;
      })
      .map((p) => {
        const price = p.prices[0]?.price || 0;
        const ci = p.contractorIntelligence!;
        const qa = p.qualityAnalysis;

        const totalCost = price * criteria.quantity;
        const roi = (criteria.budget - totalCost) / criteria.budget;
        const reliability = 1 - ci.failureRate;

        let score = 0;
        score += reliability * 40;
        score += (ci.longevity / 15) * 30;
        score += roi * 20;
        score += (1 - ci.installDifficulty / 10) * 10;

        return {
          id: p.id,
          title: p.title,
          brand: p.brand.name,
          unitPrice: Math.round(price * 100) / 100,
          totalCost: Math.round(totalCost * 100) / 100,
          reliability: Math.round(reliability * 100) / 100,
          longevity: ci.longevity,
          installTime: ci.installTimeMinutes || 0,
          roi: Math.round(roi * 100) / 100,
          score: Math.round(score * 100) / 100,
        };
      })
      .sort((a, b) => b.score - a.score)
      .slice(0, 10);

    const bestValue = candidates[0];
    const mostReliable = candidates.reduce((best, p) =>
      p.reliability > best.reliability ? p : best
    );
    const fastestInstall = candidates.reduce((fastest, p) =>
      p.installTime < fastest.installTime ? p : fastest
    );
    const bestROI = candidates.reduce((best, p) => (p.roi > best.roi ? p : best));

    return {
      recommendations: candidates,
      summary: {
        bestValue: bestValue?.id || 'N/A',
        mostReliable: mostReliable?.id || 'N/A',
        fastestInstall: fastestInstall?.id || 'N/A',
        bestROI: bestROI?.id || 'N/A',
      },
    };
  }

  async onModuleDestroy() {
    await this.prisma.$disconnect();
  }
}
