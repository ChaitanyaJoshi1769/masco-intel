import { Injectable } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

interface BulkAnalysisJob {
  jobId: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  productIds: string[];
  createdAt: Date;
  completedAt?: Date;
  results?: Record<string, any>;
  error?: string;
}

@Injectable()
export class BulkOperationsService {
  private prisma: PrismaClient;
  private jobs: Map<string, BulkAnalysisJob> = new Map();

  constructor() {
    this.prisma = new PrismaClient();
  }

  /**
   * Analyze multiple products in bulk
   */
  async bulkAnalyzeProducts(
    productIds: string[],
    analysisTypes: Array<'roi' | 'comparison' | 'quality' | 'price-trend' | 'all'>
  ): Promise<{
    jobId: string;
    status: 'processing';
    productCount: number;
    timestamp: string;
  }> {
    const jobId = `job_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const job: BulkAnalysisJob = {
      jobId,
      status: 'processing',
      productIds,
      createdAt: new Date(),
    };

    this.jobs.set(jobId, job);

    // Process asynchronously
    this.processAnalysisJob(jobId, analysisTypes).catch((error) => {
      const currentJob = this.jobs.get(jobId);
      if (currentJob) {
        currentJob.status = 'failed';
        currentJob.error = error.message;
      }
    });

    return {
      jobId,
      status: 'processing',
      productCount: productIds.length,
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * Process bulk analysis job
   */
  private async processAnalysisJob(jobId: string, analysisTypes: string[]): Promise<void> {
    const job = this.jobs.get(jobId);
    if (!job) return;

    try {
      const products = await this.prisma.product.findMany({
        where: { id: { in: job.productIds } },
        include: {
          brand: true,
          prices: { orderBy: { timestamp: 'desc' }, take: 180 },
          qualityAnalysis: true,
          contractorIntelligence: true,
        },
      });

      const results: Record<string, any> = {};

      for (const product of products) {
        const analysis: Record<string, any> = { title: product.title, brand: product.brand.name };

        const types = analysisTypes.includes('all')
          ? ['roi', 'comparison', 'quality', 'price-trend']
          : analysisTypes;

        if (types.includes('quality') && product.qualityAnalysis) {
          analysis.quality = {
            score: product.qualityAnalysis.qualityScore,
            serviceability: product.qualityAnalysis.serviceabilityScore,
            contractorScore: product.qualityAnalysis.contractorScore,
            longevity: product.qualityAnalysis.longevityScore,
            warrantyYears: product.qualityAnalysis.warrantyYears,
          };
        }

        if (types.includes('price-trend') && product.prices.length > 0) {
          const prices = product.prices.map((p) => p.price);
          analysis.priceTrend = {
            current: prices[0],
            min: Math.min(...prices),
            max: Math.max(...prices),
            avg: Math.round((prices.reduce((a, b) => a + b, 0) / prices.length) * 100) / 100,
            change: Math.round(((prices[0] - prices[prices.length - 1]) / prices[prices.length - 1]) * 100 * 100) / 100,
          };
        }

        if (types.includes('roi') && product.contractorIntelligence) {
          const ci = product.contractorIntelligence;
          const tco = (product.prices[0]?.price || 0) + (ci.repairCost * ci.failureRate * ci.longevity);
          analysis.roi = {
            failureRate: ci.failureRate,
            repairCost: ci.repairCost,
            longevity: ci.longevity,
            estimatedTCO: Math.round(tco * 100) / 100,
            costPerYear: Math.round((tco / ci.longevity) * 100) / 100,
          };
        }

        if (types.includes('comparison')) {
          analysis.comparison = {
            productType: product.productType,
            finish: product.finish,
            grade: product.estimatedGrade,
          };
        }

        results[product.id] = analysis;
      }

      job.results = results;
      job.status = 'completed';
      job.completedAt = new Date();
    } catch (error) {
      job.status = 'failed';
      job.error = error instanceof Error ? error.message : 'Unknown error';
      job.completedAt = new Date();
    }
  }

  /**
   * Get job status and results
   */
  async getJobStatus(jobId: string): Promise<{
    jobId: string;
    status: string;
    progress: {
      completed: number;
      total: number;
      percentage: number;
    };
    createdAt: string;
    completedAt?: string;
    results?: Record<string, any>;
    error?: string;
  }> {
    const job = this.jobs.get(jobId);

    if (!job) {
      throw new Error('Job not found');
    }

    const resultsCount = job.results ? Object.keys(job.results).length : 0;
    const totalCount = job.productIds.length;

    return {
      jobId: job.jobId,
      status: job.status,
      progress: {
        completed: resultsCount,
        total: totalCount,
        percentage: totalCount > 0 ? Math.round((resultsCount / totalCount) * 100) : 0,
      },
      createdAt: job.createdAt.toISOString(),
      completedAt: job.completedAt?.toISOString(),
      results: job.results,
      error: job.error,
    };
  }

  /**
   * Export bulk analysis to CSV
   */
  async exportBulkAnalysisCSV(jobId: string): Promise<{
    filename: string;
    content: string;
    rows: number;
  }> {
    const job = this.jobs.get(jobId);

    if (!job || !job.results) {
      throw new Error('Job not found or not completed');
    }

    // Build CSV header
    const allKeys = new Set<string>();
    Object.values(job.results).forEach((item: any) => {
      Object.keys(item).forEach((key) => allKeys.add(key));
    });

    const headers = Array.from(allKeys);
    let csv = headers.join(',') + '\n';

    // Build CSV rows
    let rowCount = 0;
    for (const [productId, data] of Object.entries(job.results)) {
      const row = [productId, ...headers.map((h) => {
        const value = (data as any)[h];
        if (typeof value === 'object') {
          return JSON.stringify(value).replace(/,/g, ';');
        }
        return String(value || '').replace(/"/g, '""');
      })];

      csv += row.map((v) => `"${v}"`).join(',') + '\n';
      rowCount++;
    }

    return {
      filename: `bulk-analysis-${jobId}.csv`,
      content: csv,
      rows: rowCount,
    };
  }

  /**
   * Compare multiple products side-by-side
   */
  async bulkCompare(productIds: string[]): Promise<{
    products: Array<{
      id: string;
      title: string;
      brand: string;
      price: number;
      quality: number;
      grade: string;
      longevity: number;
      failureRate: number;
    }>;
    winner: {
      category: string;
      productId: string;
      metric: string;
    }[];
  }> {
    const products = await this.prisma.product.findMany({
      where: { id: { in: productIds } },
      include: {
        brand: true,
        prices: { orderBy: { timestamp: 'desc' }, take: 1 },
        qualityAnalysis: true,
        contractorIntelligence: true,
      },
    });

    const comparison = products.map((p) => ({
      id: p.id,
      title: p.title,
      brand: p.brand.name,
      price: p.prices[0]?.price || 0,
      quality: p.qualityAnalysis?.qualityScore || 0,
      grade: p.estimatedGrade,
      longevity: p.contractorIntelligence?.longevity || 0,
      failureRate: p.contractorIntelligence?.failureRate || 0,
    }));

    // Find winners in each category
    const winners = [
      {
        category: 'Best Price',
        productId: comparison.reduce((best, p) => p.price < best.price ? p : best).id,
        metric: 'lowestPrice',
      },
      {
        category: 'Best Quality',
        productId: comparison.reduce((best, p) => p.quality > best.quality ? p : best).id,
        metric: 'highestQuality',
      },
      {
        category: 'Best Longevity',
        productId: comparison.reduce((best, p) => p.longevity > best.longevity ? p : best).id,
        metric: 'longestLife',
      },
      {
        category: 'Best Reliability',
        productId: comparison.reduce((best, p) => p.failureRate < best.failureRate ? p : best).id,
        metric: 'lowestFailure',
      },
    ];

    return {
      products: comparison,
      winner: winners,
    };
  }

  /**
   * Get recommended products based on multiple criteria
   */
  async bulkRecommend(
    criteria: {
      maxPrice?: number;
      minQuality?: number;
      minLongevity?: number;
      maxFailureRate?: number;
      productType?: string;
    },
    limit = 10
  ): Promise<{
    count: number;
    products: Array<{
      id: string;
      title: string;
      brand: string;
      price: number;
      quality: number;
      longevity: number;
      failureRate: number;
      matchScore: number;
    }>;
  }> {
    const products = await this.prisma.product.findMany({
      where: {
        ...(criteria.productType && { productType: criteria.productType }),
      },
      include: {
        brand: true,
        prices: { orderBy: { timestamp: 'desc' }, take: 1 },
        qualityAnalysis: true,
        contractorIntelligence: true,
      },
    });

    const candidates = products
      .map((p) => {
        const price = p.prices[0]?.price || 999999;
        const quality = p.qualityAnalysis?.qualityScore || 0;
        const longevity = p.contractorIntelligence?.longevity || 0;
        const failureRate = p.contractorIntelligence?.failureRate || 1;

        // Calculate match score (0-100)
        let score = 0;
        let checks = 0;

        if (criteria.maxPrice && price <= criteria.maxPrice) {
          score += (1 - price / criteria.maxPrice) * 25;
          checks++;
        }
        if (criteria.minQuality && quality >= criteria.minQuality) {
          score += (quality / 1) * 25;
          checks++;
        }
        if (criteria.minLongevity && longevity >= criteria.minLongevity) {
          score += (longevity / 20) * 25;
          checks++;
        }
        if (criteria.maxFailureRate && failureRate <= criteria.maxFailureRate) {
          score += (1 - failureRate) * 25;
          checks++;
        }

        return {
          id: p.id,
          title: p.title,
          brand: p.brand.name,
          price: Math.round(price * 100) / 100,
          quality: Math.round(quality * 100) / 100,
          longevity,
          failureRate: Math.round(failureRate * 100) / 100,
          matchScore: checks > 0 ? Math.round((score / checks) * 100) / 100 : 0,
        };
      })
      .filter((p) => {
        if (criteria.maxPrice && p.price > criteria.maxPrice) return false;
        if (criteria.minQuality && p.quality < criteria.minQuality) return false;
        if (criteria.minLongevity && p.longevity < criteria.minLongevity) return false;
        if (criteria.maxFailureRate && p.failureRate > criteria.maxFailureRate) return false;
        return true;
      })
      .sort((a, b) => b.matchScore - a.matchScore)
      .slice(0, limit);

    return {
      count: candidates.length,
      products: candidates,
    };
  }

  /**
   * List active jobs
   */
  getActiveJobs(): Array<{
    jobId: string;
    status: string;
    productCount: number;
    createdAt: string;
    progress: number;
  }> {
    return Array.from(this.jobs.values())
      .map((job) => ({
        jobId: job.jobId,
        status: job.status,
        productCount: job.productIds.length,
        createdAt: job.createdAt.toISOString(),
        progress: job.results ? Math.round((Object.keys(job.results).length / job.productIds.length) * 100) : 0,
      }))
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 20);
  }

  /**
   * Clear completed jobs
   */
  clearCompletedJobs(): { clearedCount: number } {
    let count = 0;
    for (const [jobId, job] of this.jobs.entries()) {
      if (job.status === 'completed' && job.completedAt && Date.now() - job.completedAt.getTime() > 3600000) { // 1 hour
        this.jobs.delete(jobId);
        count++;
      }
    }
    return { clearedCount: count };
  }

  async onModuleDestroy() {
    await this.prisma.$disconnect();
  }
}
