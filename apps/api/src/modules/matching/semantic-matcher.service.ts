import { Injectable } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { EmbeddingService } from './embedding.service';

@Injectable()
export class SemanticMatcherService {
  private prisma: PrismaClient;

  constructor(private embeddingService: EmbeddingService) {
    this.prisma = new PrismaClient();
  }

  /**
   * Calculate semantic similarity score between two products
   */
  async calculateSemanticSimilarity(productId1: string, productId2: string): Promise<{
    score: number;
    similarity: number;
    reasoning: string;
  }> {
    const product1 = await this.prisma.product.findUnique({
      where: { id: productId1 },
      include: { brand: true },
    });

    const product2 = await this.prisma.product.findUnique({
      where: { id: productId2 },
      include: { brand: true },
    });

    if (!product1 || !product2) {
      return { score: 0, similarity: 0, reasoning: 'Product not found' };
    }

    // Get or generate embeddings
    let embedding1 = await this.embeddingService.getEmbedding(productId1);
    if (!embedding1) {
      embedding1 = await this.embeddingService.generateDescriptionEmbedding(
        productId1,
        product1.title,
        product1.description || '',
        product1.productType
      );
    }

    let embedding2 = await this.embeddingService.getEmbedding(productId2);
    if (!embedding2) {
      embedding2 = await this.embeddingService.generateDescriptionEmbedding(
        productId2,
        product2.title,
        product2.description || '',
        product2.productType
      );
    }

    // Calculate cosine similarity
    const semanticScore = this.embeddingService.cosineSimilarity(embedding1, embedding2);

    // Normalize to 0-1 range
    const normalizedScore = (semanticScore + 1) / 2;

    // Additional factors
    const sameProductType = product1.productType === product2.productType ? 0.2 : 0;
    const sameBrand = product1.brandId === product2.brandId ? 0.15 : 0;
    const titleSimilarity = this.calculateTitleSimilarity(product1.title, product2.title);

    // Weighted combination
    const finalScore = Math.round((normalizedScore * 0.6 + titleSimilarity * 0.15 + sameProductType + sameBrand) * 100) / 100;

    const reasoning = this.generateSimilarityReasoning(finalScore, product1, product2, normalizedScore);

    return {
      score: finalScore,
      similarity: normalizedScore,
      reasoning,
    };
  }

  /**
   * Find semantic duplicates for a product (products with high similarity)
   */
  async findSemanticDuplicates(productId: string, threshold = 0.75, limit = 10): Promise<Array<{
    productId: string;
    title: string;
    brand: string;
    similarityScore: number;
    matchType: 'exact_match' | 'high_similarity' | 'potential_duplicate';
  }>> {
    const sourceProduct = await this.prisma.product.findUnique({
      where: { id: productId },
      include: { brand: true },
    });

    if (!sourceProduct) {
      return [];
    }

    // Get source embedding
    let sourceEmbedding = await this.embeddingService.getEmbedding(productId);
    if (!sourceEmbedding) {
      sourceEmbedding = await this.embeddingService.generateDescriptionEmbedding(
        productId,
        sourceProduct.title,
        sourceProduct.description || '',
        sourceProduct.productType
      );
    }

    // Get all products of similar type
    const candidates = await this.prisma.product.findMany({
      where: {
        AND: [
          { id: { not: productId } },
          { productType: sourceProduct.productType },
        ],
      },
      include: { brand: true },
      take: limit * 3, // Get more candidates to filter
    });

    // Calculate similarity for each candidate
    const matches: Array<{
      product: typeof candidates[0];
      score: number;
    }> = [];

    for (const candidate of candidates) {
      let candidateEmbedding = await this.embeddingService.getEmbedding(candidate.id);
      if (!candidateEmbedding) {
        candidateEmbedding = await this.embeddingService.generateDescriptionEmbedding(
          candidate.id,
          candidate.title,
          candidate.description || '',
          candidate.productType
        );
      }

      const similarity = this.embeddingService.cosineSimilarity(sourceEmbedding, candidateEmbedding);
      const normalizedScore = (similarity + 1) / 2;

      // Add bonus for same brand
      const sameBrand = candidate.brandId === sourceProduct.brandId ? 0.1 : 0;
      const titleSim = this.calculateTitleSimilarity(sourceProduct.title, candidate.title);

      const finalScore = normalizedScore * 0.7 + titleSim * 0.2 + sameBrand * 0.1;

      if (finalScore >= threshold) {
        matches.push({ product: candidate, score: finalScore });
      }
    }

    // Sort by score and return top matches
    return matches
      .sort((a, b) => b.score - a.score)
      .slice(0, limit)
      .map((match) => ({
        productId: match.product.id,
        title: match.product.title,
        brand: match.product.brand.name,
        similarityScore: Math.round(match.score * 100) / 100,
        matchType: match.score > 0.9 ? 'exact_match' : match.score > 0.85 ? 'high_similarity' : 'potential_duplicate',
      }));
  }

  /**
   * Validate whether two products are actually the same product
   */
  async validateMatch(productId1: string, productId2: string, userFeedback: boolean): Promise<{
    validated: boolean;
    confidence: number;
    updated: boolean;
  }> {
    const similarity = await this.calculateSemanticSimilarity(productId1, productId2);

    // Update similarity data based on user feedback
    const currentData = await this.prisma.productAlternative.findUnique({
      where: {
        sourceProductId_alternativeProductId: {
          sourceProductId: productId1,
          alternativeProductId: productId2,
        },
      },
    });

    let updated = false;

    if (currentData) {
      // Update existing record
      await this.prisma.productAlternative.update({
        where: {
          sourceProductId_alternativeProductId: {
            sourceProductId: productId1,
            alternativeProductId: productId2,
          },
        },
        data: {
          score: userFeedback ? Math.max(currentData.score, similarity.score) : Math.min(currentData.score, similarity.score - 0.2),
          reason: userFeedback ? 'Validated as duplicate' : 'Marked as non-duplicate',
        },
      });
      updated = true;
    } else if (userFeedback) {
      // Create new record if validated as match
      await this.prisma.productAlternative.create({
        data: {
          sourceProductId: productId1,
          alternativeProductId: productId2,
          score: similarity.score,
          reason: 'Validated as duplicate',
        },
      });
      updated = true;
    }

    return {
      validated: userFeedback,
      confidence: similarity.score,
      updated,
    };
  }

  /**
   * Find best matching products across retailers
   */
  async findCrossRetailerMatches(productId: string, limit = 5): Promise<Array<{
    productId: string;
    title: string;
    brand: string;
    similarity: number;
    retailer?: string;
  }>> {
    const sourceProduct = await this.prisma.product.findUnique({
      where: { id: productId },
      include: { brand: true, prices: { take: 1 } },
    });

    if (!sourceProduct) {
      return [];
    }

    // Find products with latest prices from different context
    const duplicates = await this.findSemanticDuplicates(productId, 0.7, limit);

    return duplicates.map((dup) => ({
      productId: dup.productId,
      title: dup.title,
      brand: dup.brand,
      similarity: dup.similarityScore,
    }));
  }

  /**
   * Helper: Calculate title similarity using character n-grams
   */
  private calculateTitleSimilarity(title1: string, title2: string): number {
    const t1 = title1.toLowerCase().trim();
    const t2 = title2.toLowerCase().trim();

    // Exact match
    if (t1 === t2) return 1.0;

    // Length similarity
    const lengthDiff = Math.abs(t1.length - t2.length);
    const maxLen = Math.max(t1.length, t2.length);
    const lengthSim = 1 - lengthDiff / maxLen;

    // Common words
    const words1 = new Set(t1.split(/\s+/));
    const words2 = new Set(t2.split(/\s+/));
    const commonWords = [...words1].filter((w) => words2.has(w)).length;
    const totalWords = Math.max(words1.size, words2.size);
    const wordSim = commonWords / (totalWords || 1);

    // Weighted combination
    return lengthSim * 0.3 + wordSim * 0.7;
  }

  /**
   * Generate human-readable reasoning for similarity score
   */
  private generateSimilarityReasoning(score: number, product1: any, product2: any, embeddingSim: number): string {
    const factors: string[] = [];

    if (product1.productType === product2.productType) {
      factors.push('Same product type');
    }

    if (product1.brandId === product2.brandId) {
      factors.push('Same brand');
    }

    if (embeddingSim > 0.8) {
      factors.push('Very similar specifications');
    } else if (embeddingSim > 0.6) {
      factors.push('Moderately similar specifications');
    }

    const titleWords1 = new Set(product1.title.toLowerCase().split(/\s+/));
    const titleWords2 = new Set(product2.title.toLowerCase().split(/\s+/));
    const commonWords = [...titleWords1].filter((w) => titleWords2.has(w)).length;

    if (commonWords > 3) {
      factors.push(`${commonWords} matching title words`);
    }

    if (score >= 0.85) {
      factors.push('Likely duplicate or equivalent product');
    } else if (score >= 0.7) {
      factors.push('Possible alternative product');
    }

    return factors.join('; ');
  }

  async onModuleDestroy() {
    await this.prisma.$disconnect();
  }
}
