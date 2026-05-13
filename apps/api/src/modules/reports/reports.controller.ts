import { Controller, Get, Post, Param, Query, Res } from '@nestjs/common';
import type { Response } from 'express';
import { ReportsService } from './reports.service';

@Controller('reports')
export class ReportsController {
  constructor(private readonly service: ReportsService) {}

  /**
   * Export product comparison as CSV
   * GET /reports/export/comparison?ids=id1,id2,id3
   */
  @Get('export/comparison')
  async exportComparisonCSV(@Query('ids') ids: string, @Res() res: Response) {
    const productIds = ids.split(',').map((id) => id.trim());
    const report = await this.service.generateComparisonCSV(productIds);

    res.set({
      'Content-Type': 'text/csv',
      'Content-Disposition': `attachment; filename="${report.filename}"`,
    });
    res.send(report.content);
  }

  /**
   * Export price history as CSV
   * GET /reports/export/price-history/:productId?days=90
   */
  @Get('export/price-history/:productId')
  async exportPriceHistoryCSV(
    @Param('productId') productId: string,
    @Res() res: Response,
    @Query('days') days = '90',
  ) {
    const report = await this.service.generatePriceHistoryCSV(productId, parseInt(days, 10));

    if (!report) {
      res.status(404).json({ error: 'Product not found' });
      return;
    }

    res.set({
      'Content-Type': 'text/csv',
      'Content-Disposition': `attachment; filename="${report.filename}"`,
    });
    res.send(report.content);
  }

  /**
   * Export market analysis as CSV
   * GET /reports/export/market-analysis?category=faucet
   */
  @Get('export/market-analysis')
  async exportMarketAnalysisCSV(@Res() res: Response, @Query('category') category?: string) {
    const report = await this.service.generateMarketAnalysisCSV(category);

    res.set({
      'Content-Type': 'text/csv',
      'Content-Disposition': `attachment; filename="${report.filename}"`,
    });
    res.send(report.content);
  }

  /**
   * Export brand comparison as CSV
   * GET /reports/export/brand-comparison?brands=Brizo,Delta,Hansgrohe
   */
  @Get('export/brand-comparison')
  async exportBrandComparisonCSV(@Query('brands') brands: string, @Res() res: Response) {
    const brandList = brands.split(',').map((b) => b.trim());
    const report = await this.service.generateBrandComparisonCSV(brandList);

    res.set({
      'Content-Type': 'text/csv',
      'Content-Disposition': `attachment; filename="${report.filename}"`,
    });
    res.send(report.content);
  }

  /**
   * Export inventory report as CSV
   * GET /reports/export/inventory?type=faucet
   */
  @Get('export/inventory')
  async exportInventoryCSV(@Res() res: Response, @Query('type') type?: string) {
    const report = await this.service.generateInventoryReport(type);

    res.set({
      'Content-Type': 'text/csv',
      'Content-Disposition': `attachment; filename="${report.filename}"`,
    });
    res.send(report.content);
  }

  /**
   * Get executive summary as JSON
   * GET /reports/summary
   */
  @Get('summary')
  async getExecutiveSummary() {
    return this.service.generateExecutiveSummary();
  }

  /**
   * Generate PDF report (preview/metadata)
   * POST /reports/generate-pdf?type=comparison
   * Body: { productIds: [] }
   */
  @Post('generate-pdf')
  async generatePDF(@Query('type') type: string, @Query('ids') ids?: string) {
    const productIds = ids ? ids.split(',').map((id) => id.trim()) : undefined;
    return this.service.generatePDFReport(type, productIds);
  }

  /**
   * Get report metadata
   * GET /reports/metadata/:reportType
   */
  @Get('metadata/:reportType')
  async getReportMetadata(@Param('reportType') reportType: string) {
    const metadata: Record<string, any> = {
      comparison: {
        name: 'Product Comparison Report',
        description: 'Compare multiple products side-by-side',
        format: ['CSV', 'PDF'],
        requiredParams: ['ids'],
      },
      'price-history': {
        name: 'Price History Report',
        description: 'Historical pricing data for a product',
        format: ['CSV'],
        requiredParams: ['productId'],
        optionalParams: ['days'],
      },
      'market-analysis': {
        name: 'Market Analysis Report',
        description: 'Brand metrics and market share analysis',
        format: ['CSV'],
        optionalParams: ['category'],
      },
      'brand-comparison': {
        name: 'Brand Comparison Report',
        description: 'Compare performance across brands',
        format: ['CSV'],
        requiredParams: ['brands'],
      },
      inventory: {
        name: 'Inventory Report',
        description: 'Product inventory and status overview',
        format: ['CSV'],
        optionalParams: ['type'],
      },
      summary: {
        name: 'Executive Summary',
        description: 'High-level market statistics and insights',
        format: ['JSON'],
      },
    };

    return metadata[reportType] || { error: 'Report type not found' };
  }

  /**
   * List all available reports
   * GET /reports/available
   */
  @Get('available')
  async listAvailableReports() {
    return {
      reports: [
        {
          type: 'comparison',
          name: 'Product Comparison',
          endpoint: 'GET /reports/export/comparison?ids=id1,id2,id3',
          format: 'CSV',
        },
        {
          type: 'price-history',
          name: 'Price History',
          endpoint: 'GET /reports/export/price-history/:productId?days=90',
          format: 'CSV',
        },
        {
          type: 'market-analysis',
          name: 'Market Analysis',
          endpoint: 'GET /reports/export/market-analysis?category=type',
          format: 'CSV',
        },
        {
          type: 'brand-comparison',
          name: 'Brand Comparison',
          endpoint: 'GET /reports/export/brand-comparison?brands=Brizo,Delta',
          format: 'CSV',
        },
        {
          type: 'inventory',
          name: 'Inventory Report',
          endpoint: 'GET /reports/export/inventory?type=faucet',
          format: 'CSV',
        },
        {
          type: 'summary',
          name: 'Executive Summary',
          endpoint: 'GET /reports/summary',
          format: 'JSON',
        },
      ],
    };
  }
}
