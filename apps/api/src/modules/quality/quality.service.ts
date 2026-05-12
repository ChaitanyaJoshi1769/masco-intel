import { Injectable } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { analyzeQuality } from '@masco/quality-engine';

@Injectable()
export class QualityService {
  private prisma: PrismaClient;

  constructor() {
    this.prisma = new PrismaClient();
  }

  async getQualityAnalysis(productId: string) {
    const product = await this.prisma.product.findUnique({
      where: { id: productId },
      include: { brand: true, prices: { take: 1, orderBy: { timestamp: 'desc' } } },
    });

    if (!product) {
      return null;
    }

    // Use new quality engine
    const analysis = analyzeQuality({
      price: product.prices[0]?.price || 0,
      brand: product.brand.name,
      warranty: 1, // TODO: Extract from specs
      materialComposition: product.specifications?.['Material'] || '',
      certifications: product.certifications,
      collection: product.collection || '',
      productType: product.productType,
      specifications: product.specifications as Record<string, string>,
    });

    return analysis;
  }

  async detectBuilderGrade(productId: string): Promise<{
    grade: 'builder-grade' | 'mid-range' | 'premium' | 'luxury';
    confidence: number;
    reasoning: string;
  }> {
    const product = await this.prisma.product.findUnique({
      where: { id: productId },
      include: { qualityAnalysis: true, prices: { take: 1, orderBy: { timestamp: 'desc' } } },
    });

    if (!product) {
      return {
        grade: 'mid-range',
        confidence: 0,
        reasoning: 'Product not found',
      };
    }

    let score = 0;
    const factors: string[] = [];

    // Price-based heuristics
    const price = product.prices[0]?.price || product.prices[0]?.price || 50;
    if (price < 50) {
      score += 0.4;
      factors.push('Budget price point');
    } else if (price > 300) {
      score -= 0.3;
      factors.push('Premium price point');
    }

    // Quality analysis signals
    if (product.qualityAnalysis) {
      const qa = product.qualityAnalysis;
      if (qa.hasPlasticComponents) {
        score += 0.2;
        factors.push('Plastic components detected');
      }
      if (qa.warrantyYears < 2) {
        score += 0.15;
        factors.push('Limited warranty');
      }
      if (!qa.repairPartsAvailable) {
        score += 0.1;
        factors.push('Limited repair parts availability');
      }
    }

    // Brand heuristics
    const luxuryBrands = ['Brizo', 'Axor', 'Hansgrohe'];
    const builderBrands = ['Moen', 'Kohler basics'];

    if (luxuryBrands.some((b) => product.brand.name.includes(b))) {
      score = Math.min(score, -0.5);
      factors.push('Luxury brand');
    }

    if (builderBrands.some((b) => product.brand.name.includes(b))) {
      score += 0.3;
      factors.push('Builder-grade brand');
    }

    // Collection/finish heuristics
    if (product.collection?.toLowerCase().includes('basic')) {
      score += 0.2;
      factors.push('Basic collection');
    }

    let grade: 'builder-grade' | 'mid-range' | 'premium' | 'luxury';
    if (score > 0.5) {
      grade = 'builder-grade';
    } else if (score > 0.2) {
      grade = 'mid-range';
    } else if (score > -0.2) {
      grade = 'premium';
    } else {
      grade = 'luxury';
    }

    return {
      grade,
      confidence: Math.min(Math.abs(score), 1),
      reasoning: factors.join('; '),
    };
  }

  async getComparisonQuality(sourceProductId: string, targetProductId: string) {
    const source = await this.getQualityAnalysis(sourceProductId);
    const target = await this.getQualityAnalysis(targetProductId);

    return {
      source,
      target,
      recommendation: source.qualityScore > target.qualityScore ? 'source' : 'target',
      qualityDifference: Math.abs(source.qualityScore - target.qualityScore),
    };
  }

  async onModuleDestroy() {
    await this.prisma.$disconnect();
  }
}
