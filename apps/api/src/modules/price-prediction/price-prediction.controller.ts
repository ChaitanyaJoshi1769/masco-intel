import { Controller, Get, Param, Query } from '@nestjs/common';
import { PricePredictionService } from './price-prediction.service';

@Controller('price-prediction')
export class PricePredictionController {
  constructor(private readonly service: PricePredictionService) {}

  /**
   * Analyze historical price patterns
   * GET /price-prediction/patterns/:productId?days=180
   */
  @Get('patterns/:productId')
  async analyzePricePatterns(@Param('productId') productId: string, @Query('days') days = '180') {
    return this.service.analyzePricePatterns(productId, parseInt(days, 10));
  }

  /**
   * Predict future price for a product
   * GET /price-prediction/forecast/:productId?daysAhead=30
   */
  @Get('forecast/:productId')
  async predictFuturePrice(@Param('productId') productId: string, @Query('daysAhead') daysAhead = '30') {
    return this.service.predictFuturePrice(productId, parseInt(daysAhead, 10));
  }

  /**
   * Identify seasonal pricing patterns
   * GET /price-prediction/seasonal/:productId
   */
  @Get('seasonal/:productId')
  async identifySeasonalPatterns(@Param('productId') productId: string) {
    return this.service.identifySeasonalPatterns(productId);
  }

  /**
   * Get best buy recommendation
   * GET /price-prediction/recommendation/:productId
   */
  @Get('recommendation/:productId')
  async getBestBuyRecommendation(@Param('productId') productId: string) {
    return this.service.getBestBuyRecommendation(productId);
  }
}
