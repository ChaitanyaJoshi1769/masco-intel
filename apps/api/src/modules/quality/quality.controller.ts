import { Controller, Get, Param, Query } from '@nestjs/common';
import { QualityService } from './quality.service';

@Controller('api/quality')
export class QualityController {
  constructor(private qualityService: QualityService) {}

  @Get(':productId')
  async getAnalysis(@Param('productId') productId: string) {
    const analysis = await this.qualityService.getQualityAnalysis(productId);
    return {
      success: true,
      data: analysis,
      timestamp: new Date().toISOString(),
    };
  }

  @Get(':productId/grade-detection')
  async detectGrade(@Param('productId') productId: string) {
    const analysis = await this.qualityService.getQualityAnalysis(productId);
    if (!analysis) {
      return {
        success: false,
        error: 'Product not found',
        timestamp: new Date().toISOString(),
      };
    }
    return {
      success: true,
      data: {
        grade: analysis.grade,
        confidence: analysis.confidence,
        scores: analysis.scores,
        reasoning: analysis.reasoning,
        estimated_lifespan: analysis.estimated_lifespan,
      },
      timestamp: new Date().toISOString(),
    };
  }

  @Get('compare')
  async compare(@Query('source') sourceId: string, @Query('target') targetId: string) {
    const comparison = await this.qualityService.getComparisonQuality(sourceId, targetId);
    return {
      success: true,
      data: comparison,
      timestamp: new Date().toISOString(),
    };
  }
}
