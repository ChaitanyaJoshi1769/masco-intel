import { Injectable } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

interface ProductReport {
  id: string;
  title: string;
  sku: string;
  brand: string;
  price: number;
  quality: number;
  grade: string;
  failureRate: number;
  repairCost: number;
  longevity: number;
}

@Injectable()
export class ReportsService {
  private prisma: PrismaClient;

  constructor() {
    this.prisma = new PrismaClient();
  }

  /**
   * Generate product comparison CSV
   */
  async generateComparisonCSV(productIds: string[]) {
    const products = await this.prisma.product.findMany({
      where: { id: { in: productIds } },
      include: {
        brand: true,
        prices: { orderBy: { timestamp: 'desc' }, take: 1 },
        qualityAnalysis: true,
        contractorIntelligence: true,
      },
    });

    // CSV headers
    const headers = [
      'Product ID',
      'Title',
      'SKU',
      'Brand',
      'Current Price',
      'Quality Score',
      'Grade',
      'Failure Rate',
      'Repair Cost',
      'Longevity (years)',
      'Install Time (min)',
      'Warranty (years)',
    ];

    // CSV rows
    const rows = products.map((p) => [
      p.id,
      p.title,
      p.sku,
      p.brand?.name || 'Unknown',
      p.prices[0]?.price?.toString() || '0',
      p.qualityAnalysis?.qualityScore?.toString() || '0',
      p.estimatedGrade || 'Unknown',
      p.contractorIntelligence?.failureRate?.toString() || '0',
      p.contractorIntelligence?.repairCost?.toString() || '0',
      p.contractorIntelligence?.longevity?.toString() || '0',
      p.contractorIntelligence?.installTimeMinutes?.toString() || '0',
      p.qualityAnalysis?.warrantyYears?.toString() || '0',
    ]);

    return {
      filename: `product-comparison-${Date.now()}.csv`,
      headers,
      rows,
      content: this.convertToCSV(headers, rows),
    };
  }

  /**
   * Generate price history CSV
   */
  async generatePriceHistoryCSV(productId: string, days = 90) {
    const product = await this.prisma.product.findUnique({
      where: { id: productId },
      include: {
        prices: {
          where: {
            timestamp: {
              gte: new Date(Date.now() - days * 24 * 60 * 60 * 1000),
            },
          },
          orderBy: { timestamp: 'asc' },
        },
      },
    });

    if (!product) return null;

    const headers = ['Date', 'Price', 'Retailer', 'In Stock'];
    const rows = product.prices.map((p) => [
      p.timestamp.toISOString().split('T')[0],
      p.price.toString(),
      p.retailerId,
      p.inStock ? 'Yes' : 'No',
    ]);

    return {
      filename: `price-history-${productId}-${Date.now()}.csv`,
      headers,
      rows,
      content: this.convertToCSV(headers, rows),
    };
  }

  /**
   * Generate market analysis CSV
   */
  async generateMarketAnalysisCSV(productType?: string) {
    const products = await this.prisma.product.findMany({
      where: productType ? { productType: { contains: productType, mode: 'insensitive' as any } } : {},
      include: {
        brand: true,
        prices: { orderBy: { timestamp: 'desc' }, take: 1 },
        qualityAnalysis: true,
        contractorIntelligence: true,
      },
    });

    // Group by brand
    const byBrand = new Map<string, typeof products>();
    products.forEach((p) => {
      const bn = p.brand?.name || 'Unknown';
      if (!byBrand.has(bn)) byBrand.set(bn, []);
      byBrand.get(bn)!.push(p);
    });

    const headers = [
      'Brand',
      'Product Count',
      'Avg Price',
      'Avg Quality Score',
      'Avg Failure Rate',
      'Avg Longevity',
      'Market Share (%)',
    ];

    const rows = Array.from(byBrand.entries()).map(([brand, items]) => {
      const avgPrice = items.reduce((sum, p) => sum + (p.prices[0]?.price || 0), 0) / (items.length || 1);
      const avgQuality = items.reduce((sum, p) => sum + (p.qualityAnalysis?.qualityScore || 0), 0) / (items.length || 1);
      const avgFailureRate = items.reduce((sum, p) => sum + (p.contractorIntelligence?.failureRate || 0.05), 0) / (items.length || 1);
      const avgLongevity = items.reduce((sum, p) => sum + (p.contractorIntelligence?.longevity || 10), 0) / (items.length || 1);
      const marketShare = (items.length / (products.length || 1)) * 100;

      return [
        brand,
        items.length.toString(),
        Math.round(avgPrice * 100) / 100,
        Math.round(avgQuality * 100) / 100,
        Math.round(avgFailureRate * 10000) / 10000,
        Math.round(avgLongevity * 100) / 100,
        Math.round(marketShare * 100) / 100,
      ];
    });

    return {
      filename: `market-analysis-${Date.now()}.csv`,
      headers,
      rows,
      content: this.convertToCSV(headers, rows),
    };
  }

  /**
   * Generate brand comparison CSV
   */
  async generateBrandComparisonCSV(brands: string[]) {
    const products = await this.prisma.product.findMany({
      where: { brand: { name: { in: brands } } },
      include: {
        brand: true,
        prices: { orderBy: { timestamp: 'desc' }, take: 1 },
        qualityAnalysis: true,
        contractorIntelligence: true,
      },
    });

    const headers = [
      'Brand',
      'Products',
      'Avg Price',
      'Avg Quality',
      'Avg Failure Rate',
      'Avg Longevity',
      'Contractor Score',
    ];

    const byBrand = new Map<string, typeof products>();
    products.forEach((p) => {
      const bn = p.brand?.name || 'Unknown';
      if (!byBrand.has(bn)) byBrand.set(bn, []);
      byBrand.get(bn)!.push(p);
    });

    const rows = Array.from(byBrand.entries()).map(([brand, items]) => {
      const avgPrice = items.reduce((sum, p) => sum + (p.prices[0]?.price || 0), 0) / (items.length || 1);
      const avgQuality = items.reduce((sum, p) => sum + (p.qualityAnalysis?.qualityScore || 0), 0) / (items.length || 1);
      const avgFailureRate = items.reduce((sum, p) => sum + (p.contractorIntelligence?.failureRate || 0.05), 0) / (items.length || 1);
      const avgLongevity = items.reduce((sum, p) => sum + (p.contractorIntelligence?.longevity || 10), 0) / (items.length || 1);
      const contractorScore = 100 - avgFailureRate * 100;

      return [
        brand,
        items.length.toString(),
        Math.round(avgPrice * 100) / 100,
        Math.round(avgQuality * 100) / 100,
        Math.round(avgFailureRate * 10000) / 10000,
        Math.round(avgLongevity * 100) / 100,
        Math.round(contractorScore * 100) / 100,
      ];
    });

    return {
      filename: `brand-comparison-${Date.now()}.csv`,
      headers,
      rows,
      content: this.convertToCSV(headers, rows),
    };
  }

  /**
   * Generate product inventory report
   */
  async generateInventoryReport(productType?: string) {
    const products = await this.prisma.product.findMany({
      where: productType ? { productType: { contains: productType, mode: 'insensitive' as any } } : {},
      include: {
        brand: true,
        prices: { orderBy: { timestamp: 'desc' }, take: 1 },
        qualityAnalysis: true,
      },
    });

    const headers = ['SKU', 'Product', 'Brand', 'Type', 'Current Price', 'Quality Grade', 'Status'];

    const rows = products.map((p) => [
      p.sku,
      p.title,
      p.brand?.name || 'Unknown',
      p.productType,
      p.prices[0]?.price?.toString() || 'N/A',
      p.estimatedGrade || 'Unknown',
      p.prices[0]?.inStock ? 'In Stock' : 'Out of Stock',
    ]);

    return {
      filename: `inventory-report-${Date.now()}.csv`,
      headers,
      rows,
      content: this.convertToCSV(headers, rows),
      totalProducts: products.length,
      inStock: products.filter((p) => p.prices[0]?.inStock).length,
    };
  }

  /**
   * Generate executive summary report
   */
  async generateExecutiveSummary() {
    const totalProducts = await this.prisma.product.count();
    const brands = await this.prisma.product.findMany({
      distinct: ['brandId'],
      select: { brandId: true },
    });

    const products = await this.prisma.product.findMany({
      include: {
        prices: { orderBy: { timestamp: 'desc' }, take: 1 },
        qualityAnalysis: true,
        contractorIntelligence: true,
      },
    });

    const avgPrice = products.reduce((sum, p) => sum + (p.prices[0]?.price || 0), 0) / (products.length || 1);
    const avgQuality = products.reduce((sum, p) => sum + (p.qualityAnalysis?.qualityScore || 0), 0) / (products.length || 1);
    const avgFailureRate = products.reduce((sum, p) => sum + (p.contractorIntelligence?.failureRate || 0.05), 0) / (products.length || 1);

    return {
      summary: {
        generatedAt: new Date().toISOString(),
        totalProducts,
        totalBrands: brands.length,
        averagePrice: Math.round(avgPrice * 100) / 100,
        averageQualityScore: Math.round(avgQuality * 100) / 100,
        averageFailureRate: Math.round(avgFailureRate * 10000) / 10000,
        healthScore: Math.round((100 - avgFailureRate * 100) * 100) / 100,
      },
      insights: {
        premiumProducts: products.filter((p) => p.estimatedGrade === 'luxury').length,
        builderGradeProducts: products.filter((p) => p.estimatedGrade === 'builder-grade').length,
        highQualityProducts: products.filter((p) => p.qualityAnalysis?.qualityScore || 0 > 75).length,
        reliableProducts: products.filter((p) => (p.contractorIntelligence?.failureRate || 1) < 0.05).length,
      },
    };
  }

  /**
   * Helper: Convert array to CSV format
   */
  private convertToCSV(headers: string[], rows: any[][]): string {
    const csvHeaders = headers.map((h) => `"${h}"`).join(',');
    const csvRows = rows.map((row) => row.map((cell) => `"${cell}"`).join(',')).join('\n');
    return `${csvHeaders}\n${csvRows}`;
  }

  /**
   * Generate PDF report (text-based for now)
   */
  async generatePDFReport(reportType: string, productIds?: string[]) {
    let content = '';
    let title = '';

    switch (reportType) {
      case 'comparison':
        if (!productIds || productIds.length === 0) {
          return { error: 'Product IDs required for comparison report' };
        }
        const comparison = await this.generateComparisonCSV(productIds);
        title = 'Product Comparison Report';
        content = this.formatPDFContent(title, comparison.headers, comparison.rows);
        break;

      case 'market':
        const market = await this.generateExecutiveSummary();
        title = 'Market Intelligence Report';
        content = this.formatMarketPDF(market);
        break;

      case 'brand':
        if (!productIds || productIds.length === 0) {
          return { error: 'Brand names required for brand comparison report' };
        }
        const brands = await this.generateBrandComparisonCSV(productIds);
        title = 'Brand Comparison Report';
        content = this.formatPDFContent(title, brands.headers, brands.rows);
        break;

      default:
        return { error: 'Unknown report type' };
    }

    return {
      filename: `${reportType}-report-${Date.now()}.pdf`,
      title,
      generatedAt: new Date().toISOString(),
      preview: content.substring(0, 500) + '...',
      contentSize: content.length,
      note: 'PDF generation requires puppeteer. Use CSV export for immediate data availability.',
    };
  }

  /**
   * Format content for PDF
   */
  private formatPDFContent(title: string, headers: string[], rows: any[][]): string {
    let content = `${title}\nGenerated: ${new Date().toISOString()}\n\n`;
    content += headers.join(' | ') + '\n';
    content += '-'.repeat(80) + '\n';
    rows.forEach((row) => {
      content += row.join(' | ') + '\n';
    });
    return content;
  }

  /**
   * Format market PDF
   */
  private formatMarketPDF(summary: any): string {
    let content = 'MARKET INTELLIGENCE REPORT\n';
    content += `Generated: ${summary.summary.generatedAt}\n\n`;

    content += 'EXECUTIVE SUMMARY\n';
    content += '-'.repeat(80) + '\n';
    content += `Total Products: ${summary.summary.totalProducts}\n`;
    content += `Total Brands: ${summary.summary.totalBrands}\n`;
    content += `Average Price: $${summary.summary.averagePrice}\n`;
    content += `Average Quality Score: ${summary.summary.averageQualityScore}\n`;
    content += `Average Failure Rate: ${summary.summary.averageFailureRate}\n`;
    content += `Market Health Score: ${summary.summary.healthScore}\n\n`;

    content += 'KEY INSIGHTS\n';
    content += '-'.repeat(80) + '\n';
    content += `Premium Products: ${summary.insights.premiumProducts}\n`;
    content += `Builder Grade Products: ${summary.insights.builderGradeProducts}\n`;
    content += `High Quality Products (>75): ${summary.insights.highQualityProducts}\n`;
    content += `Reliable Products (<5% failure): ${summary.insights.reliableProducts}\n`;

    return content;
  }

  async onModuleDestroy() {
    await this.prisma.$disconnect();
  }
}
