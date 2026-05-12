import { Controller, Get, Param, Query } from '@nestjs/common';
import { PricingService } from './pricing.service';

@Controller('api/pricing')
export class PricingController {
  constructor(private pricingService: PricingService) {}

  @Get(':productId/history')
  async getPriceHistory(@Param('productId') productId: string, @Query('days') days = 90) {
    const history = await this.pricingService.getPriceHistory(productId, parseInt(String(days)));
    return {
      success: true,
      data: history,
      timestamp: new Date().toISOString(),
    };
  }

  @Get(':productId/comparison')
  async getComparison(@Param('productId') productId: string) {
    const comparison = await this.pricingService.getComparisonAcrossRetailers(productId);
    return {
      success: true,
      data: comparison,
      timestamp: new Date().toISOString(),
    };
  }

  @Get(':productId/markup')
  async estimateMarkup(@Param('productId') productId: string, @Query('msrp') msrp: string) {
    const markup = await this.pricingService.estimateMarkup(productId, parseFloat(msrp));
    return {
      success: true,
      data: markup,
      timestamp: new Date().toISOString(),
    };
  }
}
