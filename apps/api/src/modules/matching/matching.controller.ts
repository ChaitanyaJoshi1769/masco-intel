import { Controller, Get, Query } from '@nestjs/common';
import { MatchingService } from './matching.service';

@Controller('api/matching')
export class MatchingController {
  constructor(private matchingService: MatchingService) {}

  @Get('by-identifier')
  async matchByIdentifier(
    @Query('sku') sku?: string,
    @Query('mpn') mpn?: string,
    @Query('upc') upc?: string
  ) {
    const matches = await this.matchingService.matchByIdentifier(sku, mpn, upc);
    return {
      success: true,
      data: matches,
      timestamp: new Date().toISOString(),
    };
  }

  @Get('by-title')
  async matchByTitle(@Query('title') title: string, @Query('brand') brand: string) {
    const matches = await this.matchingService.matchByTitle(title, brand);
    return {
      success: true,
      data: matches,
      timestamp: new Date().toISOString(),
    };
  }

  @Get('compatible')
  async findCompatible(@Query('productId') productId: string) {
    const compatible = await this.matchingService.findCompatible(productId);
    return {
      success: true,
      data: compatible,
      timestamp: new Date().toISOString(),
    };
  }
}
