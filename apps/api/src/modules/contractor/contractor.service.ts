import { Injectable } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class ContractorService {
  private prisma: PrismaClient;

  constructor() {
    this.prisma = new PrismaClient();
  }

  async getContractorIntelligence(productId: string) {
    const intelligence = await this.prisma.contractorIntelligence.findUnique({
      where: { productId },
    });

    return (
      intelligence || {
        productId,
        failureRate: 0.05,
        repairCost: 0,
        installDifficulty: 5,
        longevity: 10,
        commonIssues: [],
      }
    );
  }

  async getRecommendations(productId: string) {
    const intel = await this.getContractorIntelligence(productId);
    const product = await this.prisma.product.findUnique({
      where: { id: productId },
      include: { brand: true },
    });

    if (!product) {
      return {
        recommendation: 'unknown',
        score: 0,
        reasoning: [],
      };
    }

    const factors: string[] = [];
    let score = 50;

    // Failure rate
    if (intel.failureRate < 0.03) {
      score += 20;
      factors.push('Low failure rate in contractor field');
    } else if (intel.failureRate > 0.1) {
      score -= 20;
      factors.push('High failure rate reported');
    }

    // Longevity
    if (intel.longevity > 15) {
      score += 15;
      factors.push('Long expected lifespan');
    } else if (intel.longevity < 5) {
      score -= 15;
      factors.push('Short expected lifespan');
    }

    // Install difficulty
    if (intel.installDifficulty < 4) {
      score += 10;
      factors.push('Easy installation');
    } else if (intel.installDifficulty > 7) {
      score -= 10;
      factors.push('Complex installation');
    }

    // Repair parts availability
    const quality = await this.prisma.qualityAnalysis.findUnique({
      where: { productId },
    });

    if (quality?.repairPartsAvailable) {
      score += 10;
      factors.push('Repair parts readily available');
    }

    let recommendation: 'highly-recommended' | 'recommended' | 'neutral' | 'not-recommended';
    if (score >= 75) {
      recommendation = 'highly-recommended';
    } else if (score >= 60) {
      recommendation = 'recommended';
    } else if (score >= 40) {
      recommendation = 'neutral';
    } else {
      recommendation = 'not-recommended';
    }

    return {
      recommendation,
      score: Math.max(0, Math.min(100, score)),
      reasoning: factors,
      estimatedRepairCost: intel.repairCost,
      installTimeMinutes: intel.installTimeMinutes,
      commonIssues: intel.commonIssues,
    };
  }

  async compareBrands(brandNames: string[]) {
    const products = await this.prisma.product.findMany({
      where: {
        brand: { name: { in: brandNames } },
      },
      include: { contractorIntelligence: true, qualityAnalysis: true },
    });

    const byBrand = brandNames.map((brandName) => {
      const brandProducts = products.filter((p) => p.brand.name === brandName);
      const avgFailureRate =
        brandProducts.reduce((sum, p) => sum + (p.contractorIntelligence?.failureRate || 0.05), 0) /
        (brandProducts.length || 1);
      const avgLongevity =
        brandProducts.reduce((sum, p) => sum + (p.contractorIntelligence?.longevity || 10), 0) /
        (brandProducts.length || 1);

      return {
        brand: brandName,
        productCount: brandProducts.length,
        avgFailureRate,
        avgLongevity,
        avgScore:
          brandProducts.reduce((sum, p) => sum + (p.qualityAnalysis?.qualityScore || 0.5), 0) /
          (brandProducts.length || 1),
      };
    });

    return byBrand.sort((a, b) => b.avgScore - a.avgScore);
  }

  async onModuleDestroy() {
    await this.prisma.$disconnect();
  }
}
