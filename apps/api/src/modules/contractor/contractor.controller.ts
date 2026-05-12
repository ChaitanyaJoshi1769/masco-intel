import { Controller, Get, Param, Query } from '@nestjs/common';
import { ContractorService } from './contractor.service';

@Controller('api/contractor')
export class ContractorController {
  constructor(private contractorService: ContractorService) {}

  @Get(':productId/intelligence')
  async getIntelligence(@Param('productId') productId: string) {
    const intelligence = await this.contractorService.getContractorIntelligence(productId);
    return {
      success: true,
      data: intelligence,
      timestamp: new Date().toISOString(),
    };
  }

  @Get(':productId/recommendations')
  async getRecommendations(@Param('productId') productId: string) {
    const recommendations = await this.contractorService.getRecommendations(productId);
    return {
      success: true,
      data: recommendations,
      timestamp: new Date().toISOString(),
    };
  }

  @Get('brands/comparison')
  async compareBrands(@Query('brands') brandsString: string) {
    const brands = brandsString.split(',').map((b) => b.trim());
    const comparison = await this.contractorService.compareBrands(brands);
    return {
      success: true,
      data: comparison,
      timestamp: new Date().toISOString(),
    };
  }
}
