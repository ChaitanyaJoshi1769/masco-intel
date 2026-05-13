import { Controller, Get, Query, Param } from '@nestjs/common';
import { DashboardService } from './dashboard.service';
import { AdvancedDashboardService } from './advanced-dashboard.service';

@Controller('dashboard')
export class DashboardController {
  constructor(
    private readonly service: DashboardService,
    private readonly advancedService: AdvancedDashboardService,
  ) {}

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

  /**
   * Get real-time dashboard metrics
   * GET /dashboard/metrics/realtime
   */
  @Get('metrics/realtime')
  async getRealTimeMetrics() {
    const data = await this.advancedService.getRealTimeMetrics();
    return {
      success: true,
      data,
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * Get price trend chart data
   * GET /dashboard/charts/price-trends?days=90
   */
  @Get('charts/price-trends')
  async getPriceTrendChart(@Query('days') days = '90') {
    const data = await this.advancedService.getPriceTrendChart(parseInt(days, 10));
    return {
      success: true,
      data,
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * Get brand market share chart
   * GET /dashboard/charts/brand-share
   */
  @Get('charts/brand-share')
  async getBrandMarketShareChart() {
    const data = await this.advancedService.getBrandMarketShareChart();
    return {
      success: true,
      data,
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * Get quality distribution chart
   * GET /dashboard/charts/quality-distribution
   */
  @Get('charts/quality-distribution')
  async getQualityDistributionChart() {
    const data = await this.advancedService.getQualityDistributionChart();
    return {
      success: true,
      data,
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * Get retailer comparison chart
   * GET /dashboard/charts/retailer-comparison
   */
  @Get('charts/retailer-comparison')
  async getRetailerComparisonChart() {
    const data = await this.advancedService.getRetailerComparisonChart();
    return {
      success: true,
      data,
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * Get recent alerts
   * GET /dashboard/alerts?limit=10
   */
  @Get('alerts')
  async getRecentAlerts(@Query('limit') limit = '10') {
    const data = await this.advancedService.getRecentAlerts(parseInt(limit, 10));
    return {
      success: true,
      data,
      count: data.length,
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * Get comprehensive dashboard overview with all components
   * GET /dashboard/overview
   */
  @Get('overview')
  async getDashboardOverview() {
    const data = await this.advancedService.getDashboardOverview();
    return {
      success: true,
      data,
      timestamp: new Date().toISOString(),
    };
  }
}
