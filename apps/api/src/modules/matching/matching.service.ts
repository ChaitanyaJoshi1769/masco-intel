import { Injectable } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { SemanticMatcherService } from './semantic-matcher.service';
import { ImageMatcherService } from './image-matcher.service';

@Injectable()
export class MatchingService {
  private prisma: PrismaClient;

  constructor(
    private semanticMatcher: SemanticMatcherService,
    private imageMatcher: ImageMatcherService,
  ) {
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
      conditions.push({ sku: { contains: normalizedSku, mode: 'insensitive' as any } });
    }

    if (mpn) {
      conditions.push({ mpn: { contains: mpn, mode: 'insensitive' as any } });
    }

    if (upc) {
      conditions.push({ upc: { contains: upc, mode: 'insensitive' as any } });
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
      where: { brand: { name: { contains: brand, mode: 'insensitive' as any } } },
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

  /**
   * Calculate semantic similarity between two products
   */
  async calculateSemanticSimilarity(productId1: string, productId2: string) {
    return this.semanticMatcher.calculateSemanticSimilarity(productId1, productId2);
  }

  /**
   * Find semantic duplicates for a product
   */
  async findSemanticDuplicates(productId: string, threshold = 0.75, limit = 10) {
    return this.semanticMatcher.findSemanticDuplicates(productId, threshold, limit);
  }

  /**
   * Validate a match between two products
   */
  async validateMatch(productId1: string, productId2: string, isMatch: boolean) {
    return this.semanticMatcher.validateMatch(productId1, productId2, isMatch);
  }

  /**
   * Find cross-retailer matches
   */
  async findCrossRetailerMatches(productId: string, limit = 5) {
    return this.semanticMatcher.findCrossRetailerMatches(productId, limit);
  }

  /**
   * Calculate image similarity between two products
   */
  async calculateImageSimilarity(productId1: string, productId2: string) {
    return this.imageMatcher.calculateImageSimilarity(productId1, productId2);
  }

  /**
   * Find visually similar products
   */
  async findVisuallySimilarProducts(productId: string, threshold = 0.7, limit = 10) {
    return this.imageMatcher.findVisuallySimilarProducts(productId, threshold, limit);
  }

  /**
   * Find products by image URL
   */
  async findByImageUrl(imageUrl: string, threshold = 0.6, limit = 10) {
    return this.imageMatcher.findByImageUrl(imageUrl, threshold, limit);
  }

  /**
   * Find duplicate images in database
   */
  async findDuplicateImages(limit = 100) {
    return this.imageMatcher.findDuplicateImages(limit);
  }

  async onModuleDestroy() {
    await this.prisma.$disconnect();
  }
}
