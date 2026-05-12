import { Controller, Get, Param, Post, Query, Body } from '@nestjs/common';
import { ContractorAnalyticsService } from './contractor-analytics.service';

interface JobEstimateRequest {
  productIds: string[];
  quantities: number[];
  laborCostPerHour: number;
}

@Controller('contractor-analytics')
export class ContractorAnalyticsController {
  constructor(private readonly service: ContractorAnalyticsService) {}

  /**
   * Calculate ROI for a product
   * GET /contractor-analytics/roi/:productId?years=10&laborCost=50
   */
  @Get('roi/:productId')
  async calculateROI(
    @Param('productId') productId: string,
    @Query('years') years = '10',
    @Query('laborCost') laborCost = '50',
  ) {
    return this.service.calculateROI(productId, parseInt(years, 10), parseInt(laborCost, 10));
  }

  /**
   * Calculate total cost of ownership
   * GET /contractor-analytics/tco/:productId?years=10
   */
  @Get('tco/:productId')
  async calculateTCO(@Param('productId') productId: string, @Query('years') years = '10') {
    return this.service.calculateTCO(productId, parseInt(years, 10));
  }

  /**
   * Compare ROI for multiple products
   * GET /contractor-analytics/roi-comparison?ids=id1,id2,id3&years=10
   */
  @Get('roi-comparison')
  async compareROI(@Query('ids') ids: string, @Query('years') years = '10') {
    const productIds = ids.split(',').map((id) => id.trim());
    return this.service.compareROI(productIds, parseInt(years, 10));
  }

  /**
   * Estimate job cost for materials and labor
   * POST /contractor-analytics/job-estimate
   * Body: { productIds: [], quantities: [], laborCostPerHour: 50 }
   */
  @Post('job-estimate')
  async estimateJobCost(@Body() request: JobEstimateRequest) {
    return this.service.estimateJobCost(request.productIds, request.quantities, request.laborCostPerHour);
  }

  /**
   * Get brand reliability ranking for product type
   * GET /contractor-analytics/brand-reliability?productType=faucet
   */
  @Get('brand-reliability')
  async getBrandReliabilityRanking(@Query('productType') productType: string) {
    return this.service.getBrandReliabilityRanking(productType);
  }

  /**
   * Identify cost savings with alternative products
   * GET /contractor-analytics/cost-savings/:productId?alternatives=id1,id2,id3&years=10
   */
  @Get('cost-savings/:productId')
  async identifyCostSavings(
    @Param('productId') productId: string,
    @Query('alternatives') alternatives: string,
    @Query('years') years = '10',
  ) {
    const alternativeIds = alternatives.split(',').map((id) => id.trim());
    return this.service.identifyCostSavings(productId, alternativeIds, parseInt(years, 10));
  }
}
