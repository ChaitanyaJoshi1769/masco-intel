import { Controller, Get, Post, Query } from '@nestjs/common';
import { AnalyticsService } from './analytics.service';

@Controller('analytics')
export class AnalyticsController {
  constructor(private readonly service: AnalyticsService) {}

  /**
   * Get dashboard overview
   * GET /analytics/dashboard/overview
   */
  @Get('dashboard/overview')
  async getDashboardOverview() {
    const data = await this.service.getDashboardOverview();

    return {
      success: true,
      data,
      message: 'Dashboard overview',
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * Get user metrics
   * GET /analytics/dashboard/user-metrics
   */
  @Get('dashboard/user-metrics')
  async getUserMetrics() {
    const data = await this.service.getUserMetrics();

    return {
      success: true,
      data,
      message: 'User metrics',
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * Get subscription metrics
   * GET /analytics/dashboard/subscription-metrics
   */
  @Get('dashboard/subscription-metrics')
  async getSubscriptionMetrics() {
    const data = await this.service.getSubscriptionMetrics();

    return {
      success: true,
      data,
      message: 'Subscription metrics',
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * Get product metrics
   * GET /analytics/dashboard/product-metrics
   */
  @Get('dashboard/product-metrics')
  async getProductMetrics() {
    const data = await this.service.getProductMetrics();

    return {
      success: true,
      data,
      message: 'Product metrics',
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * Get marketplace metrics
   * GET /analytics/dashboard/marketplace-metrics
   */
  @Get('dashboard/marketplace-metrics')
  async getMarketplaceMetrics() {
    const data = await this.service.getMarketplaceMetrics();

    return {
      success: true,
      data,
      message: 'Marketplace metrics',
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * Get forum metrics
   * GET /analytics/dashboard/forum-metrics
   */
  @Get('dashboard/forum-metrics')
  async getForumMetrics() {
    const data = await this.service.getForumMetrics();

    return {
      success: true,
      data,
      message: 'Forum metrics',
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * Get revenue metrics
   * GET /analytics/dashboard/revenue-metrics
   */
  @Get('dashboard/revenue-metrics')
  async getRevenueMetrics() {
    const data = await this.service.getRevenueMetrics();

    return {
      success: true,
      data,
      message: 'Revenue metrics',
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * Get dashboard trends
   * GET /analytics/dashboard/trends
   */
  @Get('dashboard/trends')
  async getDashboardTrends() {
    const data = await this.service.getDashboardTrends();

    return {
      success: true,
      data,
      message: 'Dashboard trends',
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * Export dashboard data
   * POST /analytics/dashboard/export?format=json
   */
  @Post('dashboard/export')
  async exportDashboardData(@Query('format') format: 'json' | 'csv' = 'json') {
    const data = await this.service.exportDashboardData(format);

    return {
      success: true,
      data,
      message: `Dashboard data exported as ${format}`,
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * Get custom report
   * GET /analytics/dashboard/report?type=revenue&range=month
   */
  @Get('dashboard/report')
  async getCustomReport(
    @Query('type') reportType: 'user' | 'revenue' | 'product' | 'marketplace' = 'revenue',
    @Query('range') dateRange: 'week' | 'month' | 'quarter' | 'year' = 'month'
  ) {
    const data = await this.service.getCustomReport(reportType, dateRange);

    return {
      success: true,
      data,
      message: `${reportType} report for ${dateRange}`,
      timestamp: new Date().toISOString(),
    };
  }
}
