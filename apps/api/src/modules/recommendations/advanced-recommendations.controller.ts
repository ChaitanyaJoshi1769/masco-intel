import { Controller, Get, Post, Param, Query, Body } from '@nestjs/common';
import { AdvancedRecommendationsService } from './advanced-recommendations.service';

@Controller('recommendations')
export class AdvancedRecommendationsController {
  constructor(private readonly service: AdvancedRecommendationsService) {}

  /**
   * Get personalized recommendations for user
   * GET /recommendations/personalized/:userId?limit=10
   */
  @Get('personalized/:userId')
  async getPersonalizedRecommendations(
    @Param('userId') userId: string,
    @Query('limit') limit = 10
  ) {
    const result = await this.service.getPersonalizedRecommendations(userId, parseInt(limit as any, 10));
    return {
      success: true,
      data: result,
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * Get trending products
   * GET /recommendations/trending?days=7&limit=15
   */
  @Get('trending')
  async getTrendingProducts(
    @Query('days') days = 7,
    @Query('limit') limit = 15
  ) {
    const result = await this.service.getTrendingProducts(
      parseInt(days as any, 10),
      parseInt(limit as any, 10)
    );
    return {
      success: true,
      data: result,
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * Get complementary products for bundling
   * GET /recommendations/complements/:productId?limit=5
   */
  @Get('complements/:productId')
  async getComplementaryProducts(
    @Param('productId') productId: string,
    @Query('limit') limit = 5
  ) {
    try {
      const result = await this.service.getComplementaryProducts(productId, parseInt(limit as any, 10));
      return {
        success: true,
        data: result,
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to get complements',
        timestamp: new Date().toISOString(),
      };
    }
  }

  /**
   * Get contractor-focused recommendations
   * POST /recommendations/contractor
   * Body: { budget: number, reliability: 0-1, longevity: number, installationDifficulty?: number, quantity: number }
   */
  @Post('contractor')
  async getContractorRecommendations(
    @Body()
    body: {
      budget: number;
      reliability: number;
      longevity: number;
      installationDifficulty?: number;
      quantity: number;
    }
  ) {
    try {
      const result = await this.service.getContractorRecommendations(body);
      return {
        success: true,
        data: result,
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to get recommendations',
        timestamp: new Date().toISOString(),
      };
    }
  }
}
