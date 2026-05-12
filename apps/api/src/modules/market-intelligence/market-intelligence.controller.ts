import { Controller, Get, Param, Query } from '@nestjs/common';
import { MarketIntelligenceService } from './market-intelligence.service';

@Controller('market-intelligence')
export class MarketIntelligenceController {
  constructor(private readonly service: MarketIntelligenceService) {}

  /**
   * Get brand metrics (all brands or filtered by name)
   * GET /market-intelligence/brands
   * GET /market-intelligence/brands?name=Brizo
   */
  @Get('brands')
  async getBrandMetrics(@Query('name') brandName?: string) {
    return this.service.getBrandMetrics(brandName);
  }

  /**
   * Get price trend for a product
   * GET /market-intelligence/price-trends/:productId?days=90
   */
  @Get('price-trends/:productId')
  async getPriceTrend(@Param('productId') productId: string, @Query('days') days = '90') {
    return this.service.getPriceTrend(productId, parseInt(days, 10));
  }

  /**
   * Get market share distribution
   * GET /market-intelligence/market-share?category=faucet
   */
  @Get('market-share')
  async getMarketShare(@Query('category') productType?: string) {
    return this.service.getMarketShare(productType);
  }

  /**
   * Get competitive positioning for product type
   * GET /market-intelligence/positioning?type=faucet
   */
  @Get('positioning')
  async getCompetitivePositioning(@Query('type') productType: string) {
    return this.service.getCompetitivePositioning(productType);
  }

  /**
   * Get price volatility analysis for a product
   * GET /market-intelligence/volatility/:productId
   */
  @Get('volatility/:productId')
  async getVolatilityAnalysis(@Param('productId') productId: string) {
    return this.service.getVolatilityAnalysis(productId);
  }

  /**
   * Find best buy time for a product
   * GET /market-intelligence/best-buy/:productId
   */
  @Get('best-buy/:productId')
  async findBestBuyTime(@Param('productId') productId: string) {
    return this.service.findBestBuyTime(productId);
  }
}
