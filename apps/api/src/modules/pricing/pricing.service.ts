import { Injectable } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PricingService {
  private prisma: PrismaClient;

  constructor() {
    this.prisma = new PrismaClient();
  }

  async getPriceHistory(productId: string, days = 90) {
    const since = new Date();
    since.setDate(since.getDate() - days);

    return this.prisma.priceHistory.findMany({
      where: {
        productId,
        timestamp: { gte: since },
      },
      orderBy: { timestamp: 'asc' },
      include: { retailer: true },
    });
  }

  async getComparisonAcrossRetailers(productId: string) {
    const priceHistory = await this.prisma.priceHistory.findMany({
      where: { productId },
      orderBy: { timestamp: 'desc' },
      distinct: ['retailerId'],
      take: 10,
      include: { retailer: true },
    });

    return {
      lowest: Math.min(...priceHistory.map((p) => p.price)),
      highest: Math.max(...priceHistory.map((p) => p.price)),
      average: priceHistory.reduce((sum, p) => sum + p.price, 0) / priceHistory.length,
      byRetailer: priceHistory.map((p) => ({
        retailer: p.retailer.name,
        price: p.price,
        url: p.url,
        lastUpdated: p.timestamp,
      })),
    };
  }

  async estimateMarkup(productId: string, msrp: number) {
    const comparison = await this.getComparisonAcrossRetailers(productId);
    return {
      msrp,
      averageRetailPrice: comparison.average,
      estimatedMarkup: ((comparison.average - msrp) / msrp) * 100,
      priceVariance: comparison.highest - comparison.lowest,
    };
  }

  async onModuleDestroy() {
    await this.prisma.$disconnect();
  }
}
