import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '@masco/db';

export interface ComparisonSpec {
  label: string;
  source: any;
  target: any;
  match: boolean;
}

export interface ProductComparison {
  source: {
    id: string;
    title: string;
    price?: number;
    grade: string;
    quality?: number;
  };
  target: {
    id: string;
    title: string;
    price?: number;
    grade: string;
    quality?: number;
  };
  similarities: string[];
  differences: ComparisonSpec[];
  priceComparison: {
    difference: number;
    percentDifference: number;
    sourceIsCheaper: boolean;
  };
  qualityComparison: {
    sourceBetter: boolean;
    qualityDifference: number;
  };
  valueScore: number;
}

@Injectable()
export class ComparisonService {
  constructor(private prisma: PrismaService) {}

  async compareProducts(
    sourceId: string,
    targetId: string,
  ): Promise<ProductComparison> {
    const source = await this.prisma.product.findUnique({
      where: { id: sourceId },
      include: {
        prices: { orderBy: { timestamp: 'desc' }, take: 1 },
        qualityAnalysis: true,
        brand: true,
      },
    });

    const target = await this.prisma.product.findUnique({
      where: { id: targetId },
      include: {
        prices: { orderBy: { timestamp: 'desc' }, take: 1 },
        qualityAnalysis: true,
        brand: true,
      },
    });

    if (!source || !target) {
      throw new NotFoundException('One or both products not found');
    }

    const sourcePrice = source.prices[0]?.price || 0;
    const targetPrice = target.prices[0]?.price || 0;
    const sourceQuality = source.qualityAnalysis?.qualityScore || 0.5;
    const targetQuality = target.qualityAnalysis?.qualityScore || 0.5;

    const priceDiff = targetPrice - sourcePrice;
    const percentDiff =
      sourcePrice > 0 ? ((priceDiff / sourcePrice) * 100).toFixed(1) : 0;

    const qualityDiff = targetQuality - sourceQuality;

    const similarities: string[] = [];
    if (source.productType === target.productType) {
      similarities.push('Same product type');
    }
    if (source.finish === target.finish) {
      similarities.push('Same finish');
    }
    if (source.estimatedGrade === target.estimatedGrade) {
      similarities.push('Same quality grade');
    }
    if (source.valveType === target.valveType) {
      similarities.push('Same valve type');
    }

    const differences: ComparisonSpec[] = [];
    if (source.title !== target.title) {
      differences.push({
        label: 'Model',
        source: source.title,
        target: target.title,
        match: false,
      });
    }
    if (source.estimatedGrade !== target.estimatedGrade) {
      differences.push({
        label: 'Grade',
        source: source.estimatedGrade,
        target: target.estimatedGrade,
        match: false,
      });
    }
    if (source.brand.name !== target.brand.name) {
      differences.push({
        label: 'Brand',
        source: source.brand.name,
        target: target.brand.name,
        match: false,
      });
    }

    if (sourcePrice !== targetPrice) {
      differences.push({
        label: 'Price',
        source: `$${sourcePrice.toFixed(2)}`,
        target: `$${targetPrice.toFixed(2)}`,
        match: false,
      });
    }

    const specs = source.specifications as Record<string, any>;
    const targetSpecs = target.specifications as Record<string, any>;
    for (const key in specs) {
      if (
        targetSpecs[key] !== undefined &&
        specs[key] !== targetSpecs[key]
      ) {
        differences.push({
          label: key.charAt(0).toUpperCase() + key.slice(1),
          source: specs[key],
          target: targetSpecs[key],
          match: false,
        });
      }
    }

    const valueScore = this.calculateValueScore(
      sourceQuality,
      targetQuality,
      sourcePrice,
      targetPrice,
    );

    return {
      source: {
        id: source.id,
        title: source.title,
        price: sourcePrice,
        grade: source.estimatedGrade,
        quality: sourceQuality,
      },
      target: {
        id: target.id,
        title: target.title,
        price: targetPrice,
        grade: target.estimatedGrade,
        quality: targetQuality,
      },
      similarities,
      differences,
      priceComparison: {
        difference: priceDiff,
        percentDifference: parseFloat(percentDiff as string),
        sourceIsCheaper: sourcePrice < targetPrice,
      },
      qualityComparison: {
        sourceBetter: sourceQuality > targetQuality,
        qualityDifference: qualityDiff,
      },
      valueScore,
    };
  }

  async compareMultiple(productIds: string[]): Promise<ProductComparison[]> {
    const comparisons: ProductComparison[] = [];

    for (let i = 0; i < productIds.length - 1; i++) {
      for (let j = i + 1; j < productIds.length; j++) {
        const comparison = await this.compareProducts(
          productIds[i],
          productIds[j],
        );
        comparisons.push(comparison);
      }
    }

    return comparisons;
  }

  async compareByCategory(
    productType: string,
    priceRange?: { min: number; max: number },
    limit = 5,
  ) {
    const products = await this.prisma.product.findMany({
      where: {
        AND: [
          { productType },
          priceRange
            ? {
                prices: {
                  some: {
                    AND: [
                      { price: { gte: priceRange.min } },
                      { price: { lte: priceRange.max } },
                    ],
                  },
                },
              }
            : {},
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
      price: p.prices[0]?.price,
      grade: p.estimatedGrade,
      quality: p.qualityAnalysis?.qualityScore,
    }));
  }

  private calculateValueScore(
    sourceQuality: number,
    targetQuality: number,
    sourcePrice: number,
    targetPrice: number,
  ): number {
    if (sourcePrice === 0 || targetPrice === 0) return 0;

    const sourceValue = sourceQuality / sourcePrice;
    const targetValue = targetQuality / targetPrice;

    return parseFloat(((sourceValue / targetValue) * 100).toFixed(1));
  }
}
