import {
  Controller,
  Get,
  Query,
  ParseIntPipe,
} from '@nestjs/common';
import { ComparisonService } from './comparison.service';

@Controller('comparison')
export class ComparisonController {
  constructor(private service: ComparisonService) {}

  @Get()
  async compareProducts(
    @Query('source') sourceId: string,
    @Query('target') targetId: string,
  ) {
    return this.service.compareProducts(sourceId, targetId);
  }

  @Get('multiple')
  async compareMultiple(@Query('ids') ids: string) {
    const productIds = ids.split(',');
    return this.service.compareMultiple(productIds);
  }

  @Get('category')
  async compareByCategory(
    @Query('productType') productType: string,
    @Query('minPrice', new ParseIntPipe({ optional: true })) minPrice?: number,
    @Query('maxPrice', new ParseIntPipe({ optional: true })) maxPrice?: number,
    @Query('limit', new ParseIntPipe({ optional: true })) limit = 5,
  ) {
    const priceRange =
      minPrice && maxPrice ? { min: minPrice, max: maxPrice } : undefined;
    return this.service.compareByCategory(productType, priceRange, limit);
  }
}
