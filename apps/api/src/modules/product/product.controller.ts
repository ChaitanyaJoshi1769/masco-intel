import { Controller, Get, Post, Body, Param, Query } from '@nestjs/common';
import { ProductService } from './product.service';
import { CreateProductDto } from './dto/create-product.dto';

@Controller('api/products')
export class ProductController {
  constructor(private productService: ProductService) {}

  @Post()
  async create(@Body() dto: CreateProductDto) {
    const product = await this.productService.create(dto);
    return {
      success: true,
      data: product,
      timestamp: new Date().toISOString(),
    };
  }

  @Get('search')
  async search(@Query('q') query: string, @Query('limit') limit = 10) {
    const results = await this.productService.search(query, parseInt(String(limit)));
    return {
      success: true,
      data: results,
      timestamp: new Date().toISOString(),
    };
  }

  @Get('sku/:sku')
  async findBySku(@Param('sku') sku: string) {
    const product = await this.productService.findBySku(sku);
    return {
      success: !!product,
      data: product || null,
      timestamp: new Date().toISOString(),
    };
  }

  @Get('mpn/:mpn')
  async findByMpn(@Param('mpn') mpn: string) {
    const product = await this.productService.findByMpn(mpn);
    return {
      success: !!product,
      data: product || null,
      timestamp: new Date().toISOString(),
    };
  }

  @Get(':id/alternatives')
  async getAlternatives(
    @Param('id') id: string,
    @Query('limit') limit = 5
  ) {
    const alternatives = await this.productService.findAlternatives(
      id,
      parseInt(String(limit))
    );
    return {
      success: true,
      data: alternatives,
      timestamp: new Date().toISOString(),
    };
  }

  @Get('alternatives')
  async getAlternativesBySku(@Query('sku') sku: string, @Query('limit') limit = 5) {
    const product = await this.productService.findBySku(sku);
    if (!product) {
      return {
        success: false,
        data: [],
        error: 'Product not found',
        timestamp: new Date().toISOString(),
      };
    }

    const alternatives = await this.productService.findAlternatives(
      product.id,
      parseInt(String(limit))
    );
    return {
      success: true,
      data: alternatives,
      timestamp: new Date().toISOString(),
    };
  }
}
