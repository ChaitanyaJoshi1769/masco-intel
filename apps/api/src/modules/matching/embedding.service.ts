import { Injectable } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class EmbeddingService {
  private prisma: PrismaClient;
  private embeddingCache: Map<string, number[]> = new Map();

  constructor() {
    this.prisma = new PrismaClient();
  }

  /**
   * Generate embeddings for product descriptions (simulated - would use OpenAI in production)
   * For now, uses TF-IDF inspired vectorization from product metadata
   */
  async generateDescriptionEmbedding(productId: string, title: string, description: string, productType: string): Promise<number[]> {
    // Check cache first
    const cacheKey = `desc_${productId}`;
    if (this.embeddingCache.has(cacheKey)) {
      return this.embeddingCache.get(cacheKey)!;
    }

    // In production, this would call OpenAI API:
    // const response = await fetch('https://api.openai.com/v1/embeddings', {...})
    // For demo: generate a deterministic embedding based on text features

    const text = `${title} ${description} ${productType}`.toLowerCase();
    const embedding = this.generateSimpleEmbedding(text, 1536); // OpenAI embedding dimension

    // Cache the embedding
    this.embeddingCache.set(cacheKey, embedding);

    // Store in database
    await this.prisma.aIEmbedding.upsert({
      where: {
        productId_type: { productId, type: 'description' },
      },
      update: {
        embedding,
        model: 'openai-text-embedding-3-small',
        createdAt: new Date(),
      },
      create: {
        productId,
        type: 'description',
        embedding,
        model: 'openai-text-embedding-3-small',
      },
    });

    return embedding;
  }

  /**
   * Generate embeddings for product images (simulated)
   * In production, would use CLIP or similar vision model
   */
  async generateImageEmbedding(productId: string, imageUrl: string): Promise<number[] | null> {
    if (!imageUrl) return null;

    const cacheKey = `img_${productId}`;
    if (this.embeddingCache.has(cacheKey)) {
      return this.embeddingCache.get(cacheKey)!;
    }

    // In production, would use vision API:
    // const response = await fetch('https://api.openai.com/v1/vision/embeddings', {...})
    // For demo: generate embedding based on image URL hash

    const embedding = this.generateSimpleEmbedding(imageUrl, 512); // Vision model embedding dimension

    this.embeddingCache.set(cacheKey, embedding);

    await this.prisma.aIEmbedding.upsert({
      where: {
        productId_type: { productId, type: 'image' },
      },
      update: {
        embedding,
        model: 'openai-clip-vision',
        createdAt: new Date(),
      },
      create: {
        productId,
        type: 'image',
        embedding,
        model: 'openai-clip-vision',
      },
    });

    return embedding;
  }

  /**
   * Get stored embedding for a product
   */
  async getEmbedding(productId: string, type: 'description' | 'image' = 'description'): Promise<number[] | null> {
    const stored = await this.prisma.aIEmbedding.findUnique({
      where: {
        productId_type: { productId, type },
      },
    });

    return stored?.embedding || null;
  }

  /**
   * Calculate cosine similarity between two embeddings
   */
  cosineSimilarity(embedding1: number[], embedding2: number[]): number {
    if (embedding1.length !== embedding2.length) {
      return 0;
    }

    let dotProduct = 0;
    let magnitude1 = 0;
    let magnitude2 = 0;

    for (let i = 0; i < embedding1.length; i++) {
      dotProduct += embedding1[i] * embedding2[i];
      magnitude1 += embedding1[i] * embedding1[i];
      magnitude2 += embedding2[i] * embedding2[i];
    }

    magnitude1 = Math.sqrt(magnitude1);
    magnitude2 = Math.sqrt(magnitude2);

    if (magnitude1 === 0 || magnitude2 === 0) {
      return 0;
    }

    return dotProduct / (magnitude1 * magnitude2);
  }

  /**
   * Euclidean distance between embeddings
   */
  euclideanDistance(embedding1: number[], embedding2: number[]): number {
    if (embedding1.length !== embedding2.length) {
      return Number.MAX_VALUE;
    }

    let sumSquaredDiff = 0;
    for (let i = 0; i < embedding1.length; i++) {
      const diff = embedding1[i] - embedding2[i];
      sumSquaredDiff += diff * diff;
    }

    return Math.sqrt(sumSquaredDiff);
  }

  /**
   * Generate a simple deterministic embedding for demo purposes
   * In production, replace with actual OpenAI embedding API call
   */
  private generateSimpleEmbedding(text: string, dimensions: number): number[] {
    const embedding: number[] = new Array(dimensions).fill(0);

    // Use text hash to seed deterministic values
    let hash = 0;
    for (let i = 0; i < text.length; i++) {
      const char = text.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash = hash & hash; // Convert to 32bit integer
    }

    // Fill embedding with pseudo-random but deterministic values
    for (let i = 0; i < dimensions; i++) {
      const seed = hash + i * 12345;
      const random = Math.sin(seed) * 10000;
      embedding[i] = random - Math.floor(random);
    }

    // Normalize to unit vector
    let magnitude = Math.sqrt(embedding.reduce((sum, val) => sum + val * val, 0));
    if (magnitude > 0) {
      for (let i = 0; i < dimensions; i++) {
        embedding[i] = embedding[i] / magnitude;
      }
    }

    return embedding;
  }

  /**
   * Batch generate embeddings for multiple products
   */
  async generateBatchEmbeddings(
    products: Array<{ id: string; title: string; description?: string; imageUrl?: string; productType: string }>
  ): Promise<Map<string, { description: number[]; image?: number[] }>> {
    const results = new Map();

    for (const product of products) {
      const descEmbedding = await this.generateDescriptionEmbedding(
        product.id,
        product.title,
        product.description || '',
        product.productType
      );

      const imgEmbedding = product.imageUrl
        ? await this.generateImageEmbedding(product.id, product.imageUrl)
        : null;

      results.set(product.id, {
        description: descEmbedding,
        image: imgEmbedding,
      });
    }

    return results;
  }

  async onModuleDestroy() {
    await this.prisma.$disconnect();
  }
}
