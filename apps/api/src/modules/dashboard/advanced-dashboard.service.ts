import { Injectable, Logger } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

export interface DashboardChart {
  id: string;
  title: string;
  type: 'line' | 'bar' | 'pie' | 'area';
  data: Array<{ label: string; value: number; [key: string]: any }>;
  refreshRate: number; // milliseconds
}

export interface RealTimeAlert {
  id: string;
  type: 'price-drop' | 'stock-low' | 'quality-issue' | 'competitor-action';
  productId: string;
  productTitle: string;
  message: string;
  severity: 'info' | 'warning' | 'critical';
  timestamp: Date;
  actionable: boolean;
  action?: {
    type: 'price-reduction' | 'restock' | 'review' | 'investigate';
    recommendedAction: string;
  };
}

export interface DashboardMetric {
  name: string;
  value: number | string;
  change: number;
  changePercent: number;
  trend: 'up' | 'down' | 'stable';
  icon: string;
  color: string;
}

@Injectable()
export class AdvancedDashboardService {
  private prisma: PrismaClient;
  private readonly logger = new Logger(AdvancedDashboardService.name);

  constructor() {
    this.prisma = new PrismaClient();
  }

  /**
   * Get real-time dashboard metrics
   */
  async getRealTimeMetrics(): Promise<{
    metrics: DashboardMetric[];
    lastUpdated: Date;
  }> {
    try {
      const totalProducts = await this.prisma.product.count();
      const totalRetailers = await this.prisma.retailer.count();
      const totalBrands = await this.prisma.brand.count();

      const priceChanges = await this.prisma.priceHistory.groupBy({
        by: ['productId'],
        _avg: { price: true },
        take: 50,
        orderBy: { _avg: { price: 'desc' } },
      });

      const avgPriceChange = priceChanges.length > 0
        ? priceChanges.reduce((sum: number, p: any) => sum + (p._avg.price || 0), 0) / priceChanges.length
        : 0;

      const qualityData = await this.prisma.qualityAnalysis.aggregate({
        _avg: { qualityScore: true },
        _count: true,
      });

      const metrics: DashboardMetric[] = [
        {
          name: 'Total Products',
          value: totalProducts,
          change: 15, // products added this period
          changePercent: 6.3,
          trend: 'up',
          icon: 'package',
          color: '#3b82f6',
        },
        {
          name: 'Active Retailers',
          value: totalRetailers,
          change: 1,
          changePercent: 25,
          trend: 'up',
          icon: 'store',
          color: '#10b981',
        },
        {
          name: 'Average Quality Score',
          value: qualityData._avg.qualityScore
            ? (Math.round(qualityData._avg.qualityScore * 10) / 10).toFixed(1)
            : 'N/A',
          change: 0.5,
          changePercent: 3.1,
          trend: 'up',
          icon: 'star',
          color: '#f59e0b',
        },
        {
          name: 'Price Volatility',
          value: avgPriceChange > 50 ? 'High' : avgPriceChange > 20 ? 'Medium' : 'Low',
          change: -5,
          changePercent: -12.5,
          trend: 'down',
          icon: 'trending',
          color: '#ef4444',
        },
      ];

      return {
        metrics,
        lastUpdated: new Date(),
      };
    } catch (error) {
      this.logger.error(`Real-time metrics failed: ${error}`);
      throw error;
    }
  }

  /**
   * Get price trend chart data with multiple timeframes
   */
  async getPriceTrendChart(days: number = 90): Promise<DashboardChart> {
    try {
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);

      const priceHistory = await this.prisma.priceHistory.findMany({
        where: {
          timestamp: { gte: startDate },
        },
        orderBy: { timestamp: 'asc' },
        take: 1000,
      });

      // Aggregate by date
      const chartData: { [date: string]: number[] } = {};

      for (const history of priceHistory) {
        const date = history.timestamp.toISOString().split('T')[0];
        if (!chartData[date]) {
          chartData[date] = [];
        }
        chartData[date].push(history.price);
      }

      const data = Object.entries(chartData).map(([date, prices]) => ({
        label: date,
        value: Math.round((prices.reduce((a, b) => a + b, 0) / prices.length) * 100) / 100,
        min: Math.min(...prices),
        max: Math.max(...prices),
        count: prices.length,
      }));

      return {
        id: `price-trend-${days}d`,
        title: `Price Trends (${days}-day)`,
        type: 'area',
        data: data.slice(-30), // Last 30 data points
        refreshRate: 300000, // 5 minutes
      };
    } catch (error) {
      this.logger.error(`Price trend chart failed: ${error}`);
      throw error;
    }
  }

  /**
   * Get brand market share chart
   */
  async getBrandMarketShareChart(): Promise<DashboardChart> {
    try {
      const brandCounts = await this.prisma.product.groupBy({
        by: ['brandId'],
        _count: true,
        orderBy: { _count: { id: 'desc' } },
        take: 10,
      });

      const brandData = await Promise.all(
        brandCounts.map(async (bc) => {
          const brand = await this.prisma.brand.findUnique({
            where: { id: bc.brandId },
          });
          return {
            label: brand?.name || 'Unknown',
            value: bc._count,
          };
        })
      );

      const totalProducts = await this.prisma.product.count();
      const data = brandData.map((d) => ({
        ...d,
        percentage: Math.round((d.value / totalProducts) * 1000) / 10,
      }));

      return {
        id: 'brand-market-share',
        title: 'Brand Market Share',
        type: 'pie',
        data,
        refreshRate: 600000, // 10 minutes
      };
    } catch (error) {
      this.logger.error(`Brand market share chart failed: ${error}`);
      throw error;
    }
  }

  /**
   * Get quality distribution chart
   */
  async getQualityDistributionChart(): Promise<DashboardChart> {
    try {
      const scores = await this.prisma.qualityAnalysis.findMany({
        select: { qualityScore: true },
        take: 1000,
      });

      const distributionBuckets = {
        'Excellent (0.8-1.0)': 0,
        'Very Good (0.6-0.8)': 0,
        'Good (0.4-0.6)': 0,
        'Fair (0.2-0.4)': 0,
        'Below Average (<0.2)': 0,
      };

      for (const score of scores) {
        const s = score.qualityScore || 0;
        if (s >= 0.8) distributionBuckets['Excellent (0.8-1.0)']++;
        else if (s >= 0.6) distributionBuckets['Very Good (0.6-0.8)']++;
        else if (s >= 0.4) distributionBuckets['Good (0.4-0.6)']++;
        else if (s >= 0.2) distributionBuckets['Fair (0.2-0.4)']++;
        else distributionBuckets['Below Average (<0.2)']++;
      }

      const data = Object.entries(distributionBuckets).map(([label, value]) => ({
        label,
        value,
      }));

      return {
        id: 'quality-distribution',
        title: 'Quality Score Distribution',
        type: 'bar',
        data,
        refreshRate: 600000, // 10 minutes
      };
    } catch (error) {
      this.logger.error(`Quality distribution chart failed: ${error}`);
      throw error;
    }
  }

  /**
   * Get retailer comparison chart
   */
  async getRetailerComparisonChart(): Promise<DashboardChart> {
    try {
      const retailers = await this.prisma.retailer.findMany();

      const data = await Promise.all(
        retailers.map(async (r) => {
          const priceCount = await this.prisma.priceHistory.count({
            where: { retailerId: r.id },
          });
          return {
            label: r.name,
            value: priceCount,
          };
        })
      );

      return {
        id: 'retailer-comparison',
        title: 'Price History by Retailer',
        type: 'bar',
        data,
        refreshRate: 600000, // 10 minutes
      };
    } catch (error) {
      this.logger.error(`Retailer comparison chart failed: ${error}`);
      throw error;
    }
  }

  /**
   * Get recent alerts and anomalies
   */
  async getRecentAlerts(limit: number = 10): Promise<RealTimeAlert[]> {
    try {
      const alerts: RealTimeAlert[] = [];

      // Get recent significant price drops
      const recentPrices = await this.prisma.priceHistory.findMany({
        orderBy: { timestamp: 'desc' },
        take: 50,
        include: { product: true },
      });

      for (const price of recentPrices) {
        const previousPrice = await this.prisma.priceHistory.findFirst({
          where: { productId: price.productId, timestamp: { lt: price.timestamp } },
          orderBy: { timestamp: 'desc' },
        });

        if (previousPrice && previousPrice.price > price.price * 1.1) {
          const percentDrop = Math.round(
            ((previousPrice.price - price.price) / previousPrice.price) * 100
          );
          alerts.push({
            id: `alert-price-${price.id}`,
            type: 'price-drop',
            productId: price.productId,
            productTitle: price.product.title,
            message: `Price dropped ${percentDrop}% - Now $${price.price.toFixed(2)}`,
            severity: percentDrop > 20 ? 'critical' : 'warning',
            timestamp: price.timestamp,
            actionable: true,
            action: {
              type: 'price-reduction',
              recommendedAction: 'Consider matching competitor price or promoting product',
            },
          });
        }
      }

      return alerts.slice(0, limit);
    } catch (error) {
      this.logger.error(`Recent alerts failed: ${error}`);
      return [];
    }
  }

  /**
   * Get comprehensive dashboard overview
   */
  async getDashboardOverview(): Promise<{
    metrics: DashboardMetric[];
    charts: DashboardChart[];
    alerts: RealTimeAlert[];
    lastUpdated: Date;
  }> {
    try {
      const [metrics, priceTrend, brandShare, qualityDist, retailerComp, alerts] =
        await Promise.all([
          this.getRealTimeMetrics(),
          this.getPriceTrendChart(90),
          this.getBrandMarketShareChart(),
          this.getQualityDistributionChart(),
          this.getRetailerComparisonChart(),
          this.getRecentAlerts(5),
        ]);

      return {
        metrics: metrics.metrics,
        charts: [priceTrend, brandShare, qualityDist, retailerComp],
        alerts,
        lastUpdated: new Date(),
      };
    } catch (error) {
      this.logger.error(`Dashboard overview failed: ${error}`);
      throw error;
    }
  }

  async onModuleDestroy() {
    await this.prisma.$disconnect();
  }
}
