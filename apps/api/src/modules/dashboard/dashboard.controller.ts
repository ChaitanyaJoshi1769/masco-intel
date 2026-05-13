import { Controller, Get, Query, Param } from '@nestjs/common';
import { DashboardService } from './dashboard.service';

@Controller('dashboard')
export class DashboardController {
  constructor(private readonly service: DashboardService) {}

  /**
   * Get market trends overview
   * GET /dashboard/market-trends?days=90
   */
  @Get('market-trends')
  async getMarketTrends(@Query('days') days = '90') {
    const data = await this.service.getMarketTrends(parseInt(days, 10));
    return {
      success: true,
      data,
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * Get analytics summary for dashboard
   * GET /dashboard/analytics-summary
   */
  @Get('analytics-summary')
  async getAnalyticsSummary() {
    const data = await this.service.getAnalyticsSummary();
    return {
      success: true,
      data,
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * Get price trend data for charts
   * GET /dashboard/price-trends/:productId?days=90
   */
  @Get('price-trends/:productId')
  async getPriceTrendData(
    @Param('productId') productId: string,
    @Query('days') days = '90'
  ) {
    const data = await this.service.getPriceTrendData(productId, parseInt(days, 10));

    if (!data) {
      return {
        success: false,
        error: 'No price data found for this product',
        timestamp: new Date().toISOString(),
      };
    }

    return {
      success: true,
      data,
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * Get quality distribution data
   * GET /dashboard/quality-distribution
   */
  @Get('quality-distribution')
  async getQualityDistribution() {
    const data = await this.service.getQualityDistribution();
    return {
      success: true,
      data,
      timestamp: new Date().toISOString(),
    };
  }
}
