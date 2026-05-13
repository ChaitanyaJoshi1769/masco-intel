import { Controller, Get, Query, Post, Body } from '@nestjs/common';
import { SearchService } from './search.service';

@Controller('search')
export class SearchController {
  constructor(private readonly service: SearchService) {}

  /**
   * Full-text search
   * GET /search/fulltext?query=faucet&limit=20&offset=0
   */
  @Get('fulltext')
  async fullTextSearch(
    @Query('query') query: string,
    @Query('limit') limit = 20,
    @Query('offset') offset = 0
  ) {
    const results = await this.service.fullTextSearch(
      query,
      parseInt(limit as any, 10),
      parseInt(offset as any, 10)
    );
    return {
      success: true,
      data: results,
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * Faceted search with filters
   * POST /search/faceted
   * Body: { filters: { productType?, brand?, minPrice?, maxPrice?, minQuality?, finish?, grade?, searchQuery? }, limit?, offset? }
   */
  @Post('faceted')
  async facetedSearch(
    @Body()
    body: {
      filters: {
        productType?: string;
        brand?: string;
        minPrice?: number;
        maxPrice?: number;
        minQuality?: number;
        finish?: string;
        grade?: string;
        searchQuery?: string;
      };
      limit?: number;
      offset?: number;
    }
  ) {
    const results = await this.service.facetedSearch(
      body.filters,
      body.limit || 20,
      body.offset || 0
    );
    return {
      success: true,
      data: results,
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * Autocomplete suggestions
   * GET /search/autocomplete?prefix=fau&limit=10
   */
  @Get('autocomplete')
  async autocomplete(@Query('prefix') prefix: string, @Query('limit') limit = 10) {
    const results = await this.service.autocomplete(prefix, parseInt(limit as any, 10));
    return {
      success: true,
      data: results,
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * Get available filter options
   * GET /search/filters
   */
  @Get('filters')
  async getFilterOptions() {
    const options = await this.service.getFilterOptions();
    return {
      success: true,
      data: options,
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * Search by category with trending
   * GET /search/category/:category?limit=20
   */
  @Get('category/:category')
  async searchByCategory(
    @Query('category') category: string,
    @Query('limit') limit = 20
  ) {
    const results = await this.service.searchByCategory(category, parseInt(limit as any, 10));
    return {
      success: true,
      data: results,
      timestamp: new Date().toISOString(),
    };
  }
}
