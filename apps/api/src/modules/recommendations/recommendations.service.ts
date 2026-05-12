import { Injectable } from '@nestjs/common';
import { PrismaService } from '@masco/db';

export interface RecommendedProduct {
  id: string;
  title: string;
  estimatedGrade: string;
  currentPrice?: number;
  msrp?: number;
  priceReduction?: number;
  reason: string;
  relevanceScore: number;
}

@Injectable()
export class RecommendationsService {
  constructor(private prisma: PrismaService) {}

  async getSimilarProducts(
    productId: string,
    limit = 5,
  ): Promise<RecommendedProduct[]> {
    const product = await this.prisma.product.findUnique({
      where: { id: productId },
      include: {
        prices: { orderBy: { timestamp: 'desc' }, take: 1 },
        qualityAnalysis: true,
      },
    });

    if (!product) return [];

    const similar = await this.prisma.product.findMany({
      where: {
        AND: [
          { id: { not: productId } },
          { productType: product.productType },
          { finish: product.finish },
        ],
      },
      include: {
        prices: { orderBy: { timestamp: 'desc' }, take: 1 },
        qualityAnalysis: true,
      },
      take: limit,
    });

    return similar.map((p) => ({
      id: p.id,
      title: p.title,
      estimatedGrade: p.estimatedGrade,
      currentPrice: p.prices[0]?.price,
      reason: `Similar ${product.productType} with ${p.finish} finish`,
      relevanceScore: 0.85,
    }));
  }

  async getBetterValueAlternatives(
    productId: string,
    limit = 5,
  ): Promise<RecommendedProduct[]> {
    const product = await this.prisma.product.findUnique({
      where: { id: productId },
      include: {
        prices: { orderBy: { timestamp: 'desc' }, take: 1 },
        qualityAnalysis: true,
      },
    });

    if (!product || !product.prices[0]) return [];

    const currentPrice = product.prices[0].price;
    const qualityScore = product.qualityAnalysis?.qualityScore || 0.5;

    const betterValue = await this.prisma.product.findMany({
      where: {
        AND: [
          { id: { not: productId } },
          { productType: product.productType },
        ],
      },
      include: {
        prices: { orderBy: { timestamp: 'desc' }, take: 1 },
        qualityAnalysis: true,
      },
      take: limit * 2,
    });

    return betterValue
      .filter((p) => {
        const price = p.prices[0]?.price || 0;
        const pQuality = p.qualityAnalysis?.qualityScore || 0.5;
        return price < currentPrice && pQuality >= qualityScore;
      })
      .slice(0, limit)
      .map((p) => ({
        id: p.id,
        title: p.title,
        estimatedGrade: p.estimatedGrade,
        currentPrice: p.prices[0]?.price,
        reason: `Better value: lower price with comparable quality`,
        relevanceScore: 0.9,
      }));
  }

  async getCompatibleProducts(
    productId: string,
    limit = 5,
  ): Promise<RecommendedProduct[]> {
    const mappings = await this.prisma.compatibilityMapping.findMany({
      where: { sourceProductId: productId },
      include: {
        targetProduct: {
          include: {
            prices: { orderBy: { timestamp: 'desc' }, take: 1 },
          },
        },
      },
      take: limit,
    });

    return mappings.map((m) => ({
      id: m.targetProduct.id,
      title: m.targetProduct.title,
      estimatedGrade: m.targetProduct.estimatedGrade,
      currentPrice: m.targetProduct.prices[0]?.price,
      reason: `Compatible ${m.relationship.replace('-', ' ')}`,
      relevanceScore: m.confidence,
    }));
  }

  async getPersonalizedRecommendations(
    userId: string,
    limit = 10,
  ): Promise<RecommendedProduct[]> {
    const savedProducts = await this.prisma.savedProduct.findMany({
      where: { userId },
      include: {
        product: {
          include: {
            prices: { orderBy: { timestamp: 'desc' }, take: 1 },
            qualityAnalysis: true,
          },
        },
      },
      take: 5,
    });

    if (savedProducts.length === 0) return [];

    const recommendations: RecommendedProduct[] = [];
    const seen = new Set<string>();

    for (const saved of savedProducts) {
      const similar = await this.getSimilarProducts(saved.product.id, 3);
      const compatible = await this.getCompatibleProducts(
        saved.product.id,
        2,
      );

      for (const rec of [...similar, ...compatible]) {
        if (!seen.has(rec.id)) {
          recommendations.push(rec);
          seen.add(rec.id);
        }
      }
    }

    return recommendations
      .sort((a, b) => b.relevanceScore - a.relevanceScore)
      .slice(0, limit);
  }

  async getRecommendationsByPrice(
    minPrice: number,
    maxPrice: number,
    productType?: string,
    limit = 10,
  ): Promise<RecommendedProduct[]> {
    const products = await this.prisma.product.findMany({
      where: {
        AND: [
          productType ? { productType } : {},
          {
            prices: {
              some: {
                AND: [
                  { price: { gte: minPrice } },
                  { price: { lte: maxPrice } },
                ],
              },
            },
          },
        ],
      },
      include: {
        prices: { orderBy: { timestamp: 'desc' }, take: 1 },
        qualityAnalysis: true,
      },
      take: limit,
    });

    return products.map((p) => ({
      id: p.id,
      title: p.title,
      estimatedGrade: p.estimatedGrade,
      currentPrice: p.prices[0]?.price,
      reason: `Available in your price range`,
      relevanceScore: 0.75,
    }));
  }
}
