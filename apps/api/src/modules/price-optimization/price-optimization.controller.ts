import { Controller, Get, Post, Param, Body, Query } from '@nestjs/common';
import {
  PriceOptimizationService,
  DemandPrediction,
  MarginAnalysis,
  PriceOptimizationRecommendation,
} from './price-optimization.service';

@Controller('price-optimization')
export class PriceOptimizationController {
  constructor(private readonly service: PriceOptimizationService) {}

  /**
   * Predict demand at various price points
   * GET /price-optimization/demand/:productId
   */
  @Get('demand/:productId')
  async predictDemand(@Param('productId') productId: string): Promise<{
    success: boolean;
    data: DemandPrediction;
    timestamp: string;
  }> {
    try {
      const data = await this.service.predictDemand(productId);
      return {
        success: true,
        data,
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      return {
        success: false,
        data: null as any,
        timestamp: new Date().toISOString(),
      };
    }
  }

  /**
   * Analyze margins and recommend optimal pricing
   * GET /price-optimization/margins/:productId?estimatedCost=50.00
   */
  @Get('margins/:productId')
  async analyzeMargins(
    @Param('productId') productId: string,
    @Query('estimatedCost') estimatedCost?: string
  ): Promise<{
    success: boolean;
    data: MarginAnalysis;
    timestamp: string;
  }> {
    try {
      const cost = estimatedCost ? parseFloat(estimatedCost) : undefined;
      const data = await this.service.analyzeMargins(productId, cost);
      return {
        success: true,
        data,
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      return {
        success: false,
        data: null as any,
        timestamp: new Date().toISOString(),
      };
    }
  }

  /**
   * Get comprehensive price optimization recommendations
   * GET /price-optimization/recommendations?productIds=id1,id2,id3
   * POST /price-optimization/recommendations
   * Body: { productIds?: string[] }
   */
  @Get('recommendations')
  async getRecommendationsGet(
    @Query('productIds') productIds?: string
  ): Promise<{
    success: boolean;
    data: PriceOptimizationRecommendation[];
    count: number;
    timestamp: string;
  }> {
    try {
      const ids = productIds ? productIds.split(',') : undefined;
      const data = await this.service.getOptimizationRecommendations(ids);
      return {
        success: true,
        data,
        count: data.length,
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      return {
        success: false,
        data: [],
        count: 0,
        timestamp: new Date().toISOString(),
      };
    }
  }

  /**
   * Get comprehensive price optimization recommendations (POST)
   * POST /price-optimization/recommendations
   * Body: { productIds?: string[] }
   */
  @Post('recommendations')
  async getRecommendationsPost(
    @Body() body: { productIds?: string[] }
  ): Promise<{
    success: boolean;
    data: PriceOptimizationRecommendation[];
    count: number;
    timestamp: string;
  }> {
    try {
      const data = await this.service.getOptimizationRecommendations(body.productIds);
      return {
        success: true,
        data,
        count: data.length,
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      return {
        success: false,
        data: [],
        count: 0,
        timestamp: new Date().toISOString(),
      };
    }
  }

  /**
   * Get optimization summary for all products
   * GET /price-optimization/summary
   */
  @Get('summary')
  async getSummary(): Promise<{
    success: boolean;
    data: {
      recommendations: PriceOptimizationRecommendation[];
      summary: {
        totalProducts: number;
        increaseRecommendations: number;
        decreaseRecommendations: number;
        holdRecommendations: number;
        averageConfidence: number;
        totalPotentialProfit: number;
      };
    };
    timestamp: string;
  }> {
    try {
      const recommendations = await this.service.getOptimizationRecommendations();

      const summary = {
        totalProducts: recommendations.length,
        increaseRecommendations: recommendations.filter(r => r.recommendation === 'INCREASE').length,
        decreaseRecommendations: recommendations.filter(r => r.recommendation === 'DECREASE').length,
        holdRecommendations: recommendations.filter(r => r.recommendation === 'HOLD').length,
        averageConfidence: recommendations.length > 0
          ? Math.round((recommendations.reduce((sum, r) => sum + r.confidenceScore, 0) / recommendations.length) * 1000) / 1000
          : 0,
        totalPotentialProfit: Math.round(
          recommendations.reduce((sum, r) => sum + (r.profitImpact || 0), 0) * 100
        ) / 100,
      };

      return {
        success: true,
        data: {
          recommendations,
          summary,
        },
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      return {
        success: false,
        data: { recommendations: [], summary: null as any },
        timestamp: new Date().toISOString(),
      };
    }
  }
}
