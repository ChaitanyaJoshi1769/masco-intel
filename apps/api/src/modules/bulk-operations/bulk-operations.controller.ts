import { Controller, Post, Get, Body, Param, Query } from '@nestjs/common';
import { BulkOperationsService } from './bulk-operations.service';

@Controller('bulk')
export class BulkOperationsController {
  constructor(private readonly service: BulkOperationsService) {}

  /**
   * Analyze multiple products in bulk
   * POST /bulk/analyze
   * Body: { productIds: string[], analysisTypes: string[] }
   */
  @Post('analyze')
  async bulkAnalyzeProducts(
    @Body() body: { productIds: string[]; analysisTypes: Array<'roi' | 'comparison' | 'quality' | 'price-trend' | 'all'> }
  ) {
    const result = await this.service.bulkAnalyzeProducts(body.productIds, body.analysisTypes);
    return {
      success: true,
      data: result,
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * Get bulk job status and results
   * GET /bulk/jobs/:jobId
   */
  @Get('jobs/:jobId')
  async getJobStatus(@Param('jobId') jobId: string) {
    try {
      const status = await this.service.getJobStatus(jobId);
      return {
        success: true,
        data: status,
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Job not found',
        timestamp: new Date().toISOString(),
      };
    }
  }

  /**
   * Export bulk analysis results to CSV
   * GET /bulk/export/:jobId/csv
   */
  @Get('export/:jobId/csv')
  async exportBulkAnalysisCSV(@Param('jobId') jobId: string) {
    try {
      const result = await this.service.exportBulkAnalysisCSV(jobId);
      return {
        success: true,
        data: result,
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Export failed',
        timestamp: new Date().toISOString(),
      };
    }
  }

  /**
   * Compare multiple products
   * POST /bulk/compare
   * Body: { productIds: string[] }
   */
  @Post('compare')
  async bulkCompare(@Body() body: { productIds: string[] }) {
    try {
      const comparison = await this.service.bulkCompare(body.productIds);
      return {
        success: true,
        data: comparison,
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Comparison failed',
        timestamp: new Date().toISOString(),
      };
    }
  }

  /**
   * Get bulk product recommendations
   * POST /bulk/recommend
   * Body: { criteria: { maxPrice?, minQuality?, minLongevity?, maxFailureRate?, productType? }, limit? }
   */
  @Post('recommend')
  async bulkRecommend(
    @Body()
    body: {
      criteria: {
        maxPrice?: number;
        minQuality?: number;
        minLongevity?: number;
        maxFailureRate?: number;
        productType?: string;
      };
      limit?: number;
    }
  ) {
    try {
      const recommendations = await this.service.bulkRecommend(body.criteria, body.limit || 10);
      return {
        success: true,
        data: recommendations,
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Recommendation failed',
        timestamp: new Date().toISOString(),
      };
    }
  }

  /**
   * List active jobs
   * GET /bulk/jobs
   */
  @Get('jobs')
  getActiveJobs() {
    const jobs = this.service.getActiveJobs();
    return {
      success: true,
      data: {
        activeJobs: jobs,
        total: jobs.length,
      },
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * Clear old completed jobs
   * POST /bulk/cleanup
   */
  @Post('cleanup')
  clearCompletedJobs() {
    const result = this.service.clearCompletedJobs();
    return {
      success: true,
      data: result,
      timestamp: new Date().toISOString(),
    };
  }
}
