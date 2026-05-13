import { Injectable } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { EmbeddingService } from './embedding.service';
import * as crypto from 'crypto';

@Injectable()
export class ImageMatcherService {
  private prisma: PrismaClient;

  constructor(private embeddingService: EmbeddingService) {
    this.prisma = new PrismaClient();
  }

  /**
   * Generate a hash of an image for deduplication
   */
  generateImageHash(imageUrl: string): string {
    return crypto.createHash('sha256').update(imageUrl).digest('hex');
  }

  /**
   * Calculate visual similarity between product images
   */
  async calculateImageSimilarity(productId1: string, productId2: string): Promise<{
    score: number;
    similarity: number;
    hashMatch: boolean;
    embeddingSimilarity: number;
  }> {
    const product1 = await this.prisma.product.findUnique({
      where: { id: productId1 },
    });

    const product2 = await this.prisma.product.findUnique({
      where: { id: productId2 },
    });

    if (!product1 || !product2 || !product1.imageUrl || !product2.imageUrl) {
      return {
        score: 0,
        similarity: 0,
        hashMatch: false,
        embeddingSimilarity: 0,
      };
    }

    // Check exact image match via hash
    const hash1 = product1.imageHash || this.generateImageHash(product1.imageUrl);
    const hash2 = product2.imageHash || this.generateImageHash(product2.imageUrl);
    const hashMatch = hash1 === hash2;

    // Get or generate image embeddings
    let embedding1 = await this.embeddingService.getEmbedding(productId1, 'image');
    if (!embedding1) {
      embedding1 = await this.embeddingService.generateImageEmbedding(productId1, product1.imageUrl);
    }

    let embedding2 = await this.embeddingService.getEmbedding(productId2, 'image');
    if (!embedding2) {
      embedding2 = await this.embeddingService.generateImageEmbedding(productId2, product2.imageUrl);
    }

    // Calculate embedding-based similarity
    const embeddingSimilarity = embedding1 && embedding2
      ? (this.embeddingService.cosineSimilarity(embedding1, embedding2) + 1) / 2
      : 0;

    // Combined score
    const score = hashMatch ? 1.0 : embeddingSimilarity * 0.9;

    return {
      score: Math.round(score * 100) / 100,
      similarity: embeddingSimilarity,
      hashMatch,
      embeddingSimilarity: Math.round(embeddingSimilarity * 100) / 100,
    };
  }

  /**
   * Find visually similar products
   */
  async findVisuallySimilarProducts(productId: string, threshold = 0.7, limit = 10): Promise<Array<{
    productId: string;
    title: string;
    brand: string;
    imageUrl: string;
    similarityScore: number;
    matchType: 'exact' | 'high_similarity' | 'moderate_similarity';
  }>> {
    const sourceProduct = await this.prisma.product.findUnique({
      where: { id: productId },
      include: { brand: true },
    });

    if (!sourceProduct || !sourceProduct.imageUrl) {
      return [];
    }

    // Get source image embedding
    let sourceEmbedding = await this.embeddingService.getEmbedding(productId, 'image');
    if (!sourceEmbedding) {
      sourceEmbedding = await this.embeddingService.generateImageEmbedding(productId, sourceProduct.imageUrl);
    }

    if (!sourceEmbedding) {
      return [];
    }

    // Get all products with images
    const candidates = await this.prisma.product.findMany({
      where: {
        AND: [
          { id: { not: productId } },
          { imageUrl: { not: null } },
        ],
      },
      include: { brand: true },
      take: limit * 5,
    });

    const matches: Array<{
      product: typeof candidates[0];
      score: number;
      hashMatch: boolean;
    }> = [];

    for (const candidate of candidates) {
      // Check hash match first (fast path)
      const sourceHash = sourceProduct.imageHash || this.generateImageHash(sourceProduct.imageUrl);
      const candidateHash = candidate.imageHash || this.generateImageHash(candidate.imageUrl!);

      if (sourceHash === candidateHash) {
        matches.push({ product: candidate, score: 1.0, hashMatch: true });
        continue;
      }

      // Get candidate embedding
      let candidateEmbedding = await this.embeddingService.getEmbedding(candidate.id, 'image');
      if (!candidateEmbedding) {
        candidateEmbedding = await this.embeddingService.generateImageEmbedding(candidate.id, candidate.imageUrl!);
      }

      if (!candidateEmbedding) continue;

      const similarity = this.embeddingService.cosineSimilarity(sourceEmbedding, candidateEmbedding);
      const normalizedScore = (similarity + 1) / 2;

      if (normalizedScore >= threshold) {
        matches.push({ product: candidate, score: normalizedScore, hashMatch: false });
      }
    }

    // Sort by score
    return matches
      .sort((a, b) => b.score - a.score)
      .slice(0, limit)
      .map((match) => ({
        productId: match.product.id,
        title: match.product.title,
        brand: match.product.brand.name,
        imageUrl: match.product.imageUrl || '',
        similarityScore: Math.round(match.score * 100) / 100,
        matchType: match.hashMatch ? 'exact' : match.score > 0.85 ? 'high_similarity' : 'moderate_similarity',
      }));
  }

  /**
   * Find products that look like a given image URL
   */
  async findByImageUrl(imageUrl: string, threshold = 0.6, limit = 10): Promise<Array<{
    productId: string;
    title: string;
    brand: string;
    imageUrl: string;
    similarityScore: number;
  }>> {
    // Generate embedding for the provided image
    const queryEmbedding = await this.embeddingService.generateImageEmbedding(
      `query_${Date.now()}`,
      imageUrl
    );

    if (!queryEmbedding) {
      return [];
    }

    // Get all products with images
    const products = await this.prisma.product.findMany({
      where: { imageUrl: { not: null } },
      include: { brand: true },
      take: limit * 5,
    });

    const matches: Array<{
      product: typeof products[0];
      score: number;
    }> = [];

    for (const product of products) {
      if (!product.imageUrl) continue;

      let productEmbedding = await this.embeddingService.getEmbedding(product.id, 'image');
      if (!productEmbedding) {
        productEmbedding = await this.embeddingService.generateImageEmbedding(product.id, product.imageUrl);
      }

      if (!productEmbedding) continue;

      const similarity = this.embeddingService.cosineSimilarity(queryEmbedding, productEmbedding);
      const normalizedScore = (similarity + 1) / 2;

      if (normalizedScore >= threshold) {
        matches.push({ product, score: normalizedScore });
      }
    }

    return matches
      .sort((a, b) => b.score - a.score)
      .slice(0, limit)
      .map((match) => ({
        productId: match.product.id,
        title: match.product.title,
        brand: match.product.brand.name,
        imageUrl: match.product.imageUrl || '',
        similarityScore: Math.round(match.score * 100) / 100,
      }));
  }

  /**
   * Store image hash for a product (for deduplication)
   */
  async storeImageHash(productId: string, imageUrl: string): Promise<void> {
    const hash = this.generateImageHash(imageUrl);

    await this.prisma.product.update({
      where: { id: productId },
      data: {
        imageHash: hash,
      },
    });
  }

  /**
   * Find duplicate images in the database
   */
  async findDuplicateImages(limit = 100): Promise<Array<{
    imageHash: string;
    imageUrl: string;
    count: number;
    products: Array<{
      productId: string;
      title: string;
      brand: string;
    }>;
  }>> {
    // Get all products with image hashes
    const products = await this.prisma.product.findMany({
      where: { imageHash: { not: null } },
      include: { brand: true },
      take: limit,
    });

    // Group by image hash
    const hashGroups = new Map<string, typeof products>();
    for (const product of products) {
      if (!product.imageHash) continue;
      if (!hashGroups.has(product.imageHash)) {
        hashGroups.set(product.imageHash, []);
      }
      hashGroups.get(product.imageHash)!.push(product);
    }

    // Filter to only duplicates and return
    return Array.from(hashGroups.entries())
      .filter(([_, group]) => group.length > 1)
      .map(([hash, group]) => ({
        imageHash: hash,
        imageUrl: group[0].imageUrl || '',
        count: group.length,
        products: group.map((p) => ({
          productId: p.id,
          title: p.title,
          brand: p.brand.name,
        })),
      }))
      .slice(0, 10); // Return top 10 duplicate image groups
  }

  /**
   * Batch generate image embeddings for products
   */
  async generateBatchImageEmbeddings(productIds: string[]): Promise<Map<string, number[] | null>> {
    const results = new Map<string, number[] | null>();

    const products = await this.prisma.product.findMany({
      where: { id: { in: productIds } },
    });

    for (const product of products) {
      if (!product.imageUrl) {
        results.set(product.id, null);
        continue;
      }

      let embedding = await this.embeddingService.getEmbedding(product.id, 'image');
      if (!embedding) {
        embedding = await this.embeddingService.generateImageEmbedding(product.id, product.imageUrl);
      }

      results.set(product.id, embedding);
    }

    return results;
  }

  async onModuleDestroy() {
    await this.prisma.$disconnect();
  }
}
