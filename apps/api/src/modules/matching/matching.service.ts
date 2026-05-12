import { Injectable } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

interface MatchCandidate {
  productId: string;
  score: number;
}

@Injectable()
export class MatchingService {
  private prisma: PrismaClient;

  constructor() {
    this.prisma = new PrismaClient();
  }

  /**
   * Normalize SKU for matching (remove special chars, lowercase)
   */
  private normalizeSku(sku: string): string {
    return sku.toLowerCase().replace(/[^a-z0-9]/g, '');
  }

  /**
   * Calculate string similarity (Levenshtein distance)
   */
  private levenshteinDistance(a: string, b: string): number {
    const matrix: number[][] = [];

    for (let i = 0; i <= b.length; i++) {
      matrix[i] = [i];
    }

    for (let j = 0; j <= a.length; j++) {
      matrix[0][j] = j;
    }

    for (let i = 1; i <= b.length; i++) {
      for (let j = 1; j <= a.length; j++) {
        if (b.charAt(i - 1) === a.charAt(j - 1)) {
          matrix[i][j] = matrix[i - 1][j - 1];
        } else {
          matrix[i][j] = Math.min(
            matrix[i - 1][j - 1] + 1,
            matrix[i][j - 1] + 1,
            matrix[i - 1][j] + 1
          );
        }
      }
    }

    const max = Math.max(a.length, b.length);
    return 1 - matrix[b.length][a.length] / max;
  }

  /**
   * Match product by SKU, MPN, or UPC
   */
  async matchByIdentifier(sku?: string, mpn?: string, upc?: string) {
    const conditions = [];

    if (sku) {
      const normalizedSku = this.normalizeSku(sku);
      conditions.push({ sku: { contains: normalizedSku, mode: 'insensitive' } });
    }

    if (mpn) {
      conditions.push({ mpn: { contains: mpn, mode: 'insensitive' } });
    }

    if (upc) {
      conditions.push({ upc: { contains: upc, mode: 'insensitive' } });
    }

    if (conditions.length === 0) {
      return [];
    }

    return this.prisma.product.findMany({
      where: { OR: conditions },
      include: {
        brand: true,
        prices: { orderBy: { timestamp: 'desc' }, take: 1 },
      },
    });
  }

  /**
   * Match by title similarity
   */
  async matchByTitle(title: string, brand: string, limit = 5) {
    const products = await this.prisma.product.findMany({
      where: { brand: { name: { contains: brand, mode: 'insensitive' } } },
      include: {
        brand: true,
        prices: { orderBy: { timestamp: 'desc' }, take: 1 },
      },
    });

    const scored = products
      .map((p) => ({
        ...p,
        score: this.levenshteinDistance(title.toLowerCase(), p.title.toLowerCase()),
      }))
      .sort((a, b) => b.score - a.score)
      .slice(0, limit);

    return scored;
  }

  /**
   * Find compatible cartridges/valves
   */
  async findCompatible(productId: string) {
    return this.prisma.compatibilityMapping.findMany({
      where: { sourceProductId: productId },
      include: { targetProduct: { include: { brand: true } } },
    });
  }

  async onModuleDestroy() {
    await this.prisma.$disconnect();
  }
}
