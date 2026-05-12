import {
  Controller,
  Get,
  Param,
  Query,
  UseGuards,
  Request,
  ParseIntPipe,
} from '@nestjs/common';
import { RecommendationsService } from './recommendations.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('recommendations')
export class RecommendationsController {
  constructor(private service: RecommendationsService) {}

  @Get('similar/:productId')
  async getSimilarProducts(
    @Param('productId') productId: string,
    @Query('limit', new ParseIntPipe({ optional: true })) limit = 5,
  ) {
    return this.service.getSimilarProducts(productId, limit);
  }

  @Get('better-value/:productId')
  async getBetterValueAlternatives(
    @Param('productId') productId: string,
    @Query('limit', new ParseIntPipe({ optional: true })) limit = 5,
  ) {
    return this.service.getBetterValueAlternatives(productId, limit);
  }

  @Get('compatible/:productId')
  async getCompatibleProducts(
    @Param('productId') productId: string,
    @Query('limit', new ParseIntPipe({ optional: true })) limit = 5,
  ) {
    return this.service.getCompatibleProducts(productId, limit);
  }

  @Get('personalized')
  @UseGuards(JwtAuthGuard)
  async getPersonalizedRecommendations(
    @Request() req: any,
    @Query('limit', new ParseIntPipe({ optional: true })) limit = 10,
  ) {
    return this.service.getPersonalizedRecommendations(req.user.userId, limit);
  }

  @Get('by-price')
  async getRecommendationsByPrice(
    @Query('minPrice', new ParseIntPipe({ optional: true })) minPrice = 50,
    @Query('maxPrice', new ParseIntPipe({ optional: true })) maxPrice = 500,
    @Query('productType') productType?: string,
    @Query('limit', new ParseIntPipe({ optional: true })) limit = 10,
  ) {
    return this.service.getRecommendationsByPrice(
      minPrice,
      maxPrice,
      productType,
      limit,
    );
  }
}
