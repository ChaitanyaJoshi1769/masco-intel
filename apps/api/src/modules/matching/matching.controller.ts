import { Controller, Get, Query, Post, Body } from '@nestjs/common';
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

  /**
   * Calculate semantic similarity between two products
   * GET /api/matching/semantic/similarity?productId1=id1&productId2=id2
   */
  @Get('semantic/similarity')
  async calculateSemanticSimilarity(
    @Query('productId1') productId1: string,
    @Query('productId2') productId2: string
  ) {
    const result = await this.matchingService.calculateSemanticSimilarity(productId1, productId2);
    return {
      success: true,
      data: result,
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * Find semantic duplicates for a product
   * GET /api/matching/semantic/duplicates/:productId?threshold=0.75&limit=10
   */
  @Get('semantic/duplicates/:productId')
  async findSemanticDuplicates(
    @Query('productId') productId: string,
    @Query('threshold') threshold = 0.75,
    @Query('limit') limit = 10
  ) {
    const duplicates = await this.matchingService.findSemanticDuplicates(
      productId,
      parseFloat(threshold as any),
      parseInt(limit as any, 10)
    );
    return {
      success: true,
      data: duplicates,
      count: duplicates.length,
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * Find cross-retailer matches
   * GET /api/matching/semantic/cross-retailer/:productId?limit=5
   */
  @Get('semantic/cross-retailer/:productId')
  async findCrossRetailerMatches(
    @Query('productId') productId: string,
    @Query('limit') limit = 5
  ) {
    const matches = await this.matchingService.findCrossRetailerMatches(productId, parseInt(limit as any, 10));
    return {
      success: true,
      data: matches,
      count: matches.length,
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * Validate a match between two products
   * POST /api/matching/validate
   */
  @Post('validate')
  async validateMatch(@Body() body: { productId1: string; productId2: string; isMatch: boolean }) {
    const result = await this.matchingService.validateMatch(body.productId1, body.productId2, body.isMatch);
    return {
      success: true,
      data: result,
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * Calculate image similarity between two products
   * GET /api/matching/image/similarity?productId1=id1&productId2=id2
   */
  @Get('image/similarity')
  async calculateImageSimilarity(
    @Query('productId1') productId1: string,
    @Query('productId2') productId2: string
  ) {
    const result = await this.matchingService.calculateImageSimilarity(productId1, productId2);
    return {
      success: true,
      data: result,
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * Find visually similar products
   * GET /api/matching/image/similar/:productId?threshold=0.7&limit=10
   */
  @Get('image/similar/:productId')
  async findVisuallySimilarProducts(
    @Query('productId') productId: string,
    @Query('threshold') threshold = 0.7,
    @Query('limit') limit = 10
  ) {
    const similar = await this.matchingService.findVisuallySimilarProducts(
      productId,
      parseFloat(threshold as any),
      parseInt(limit as any, 10)
    );
    return {
      success: true,
      data: similar,
      count: similar.length,
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * Find products by image URL
   * GET /api/matching/image/search?imageUrl=url&threshold=0.6&limit=10
   */
  @Get('image/search')
  async findByImageUrl(
    @Query('imageUrl') imageUrl: string,
    @Query('threshold') threshold = 0.6,
    @Query('limit') limit = 10
  ) {
    const results = await this.matchingService.findByImageUrl(
      imageUrl,
      parseFloat(threshold as any),
      parseInt(limit as any, 10)
    );
    return {
      success: true,
      data: results,
      count: results.length,
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * Find duplicate images in database
   * GET /api/matching/image/duplicates?limit=100
   */
  @Get('image/duplicates')
  async findDuplicateImages(@Query('limit') limit = 100) {
    const duplicates = await this.matchingService.findDuplicateImages(parseInt(limit as any, 10));
    return {
      success: true,
      data: duplicates,
      count: duplicates.length,
      timestamp: new Date().toISOString(),
    };
  }
}
