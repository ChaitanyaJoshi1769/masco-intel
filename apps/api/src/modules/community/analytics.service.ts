import { Injectable, Logger } from '@nestjs/common';

export interface DashboardOverview {
  totalUsers: number;
  activeSubscriptions: number;
  monthlyRecurringRevenue: number;
  totalForumThreads: number;
  totalMarketplaceOrders: number;
  averageCustomerSatisfaction: number;
}

export interface UserMetrics {
  totalRegisteredUsers: number;
  activeUsers: number;
  newUsersThisMonth: number;
  userRetention: number; // percentage
  churnRate: number; // percentage
}

export interface SubscriptionMetrics {
  totalSubscriptions: number;
  activeSubscriptions: number;
  cancelledSubscriptions: number;
  subscribersByTier: Record<string, number>;
  monthlyRecurringRevenue: number;
  averageSubscriptionValue: number;
}

export interface ProductMetrics {
  totalProducts: number;
  totalSavedProducts: number;
  mostSavedProducts: Array<{ id: string; name: string; saves: number }>;
  averageProductRating: number;
  totalProductComparisons: number;
}

export interface MarketplaceMetrics {
  totalSellers: number;
  verifiedSellers: number;
  totalServices: number;
  totalOrders: number;
  completedOrders: number;
  totalRevenue: number;
  averageOrderValue: number;
  averageSellerRating: number;
}

export interface ForumMetrics {
  totalCategories: number;
  totalThreads: number;
  totalReplies: number;
  averageRepliesPerThread: number;
  totalViews: number;
  averageEngagementScore: number;
}

export interface RevenueMetrics {
  monthlyRecurringRevenue: number;
  yearlyRecurringRevenue: number;
  totalRevenue: number;
  revenueByTier: Record<string, number>;
  revenueGrowth: number; // percentage
  customerLifetimeValue: number;
}

export interface TrendData {
  month: string;
  value: number;
  growth: number; // percentage change from previous month
}

export interface DashboardTrends {
  userGrowth: TrendData[];
  revenueGrowth: TrendData[];
  subscriptionGrowth: TrendData[];
  orderGrowth: TrendData[];
}

@Injectable()
export class AnalyticsService {
  private readonly logger = new Logger(AnalyticsService.name);

  // Mock data storage
  private userCount = 1250;
  private activeUserCount = 890;
  private totalSubscriptions = 450;
  private activeSubscriptions = 385;
  private totalOrders = 2300;
  private completedOrders = 2100;
  private totalThreads = 3450;
  private totalReplies = 18950;
  private totalSellers = 127;

  /**
   * Get dashboard overview
   */
  async getDashboardOverview(): Promise<DashboardOverview> {
    try {
      const mrrData = this.calculateMRR();

      return {
        totalUsers: this.userCount,
        activeSubscriptions: this.activeSubscriptions,
        monthlyRecurringRevenue: mrrData,
        totalForumThreads: this.totalThreads,
        totalMarketplaceOrders: this.totalOrders,
        averageCustomerSatisfaction: 4.3,
      };
    } catch (error) {
      this.logger.error(`Failed to get dashboard overview: ${error}`);
      throw error;
    }
  }

  /**
   * Get user metrics
   */
  async getUserMetrics(): Promise<UserMetrics> {
    try {
      const activePercentage = (this.activeUserCount / this.userCount) * 100;
      const retention = Math.round(activePercentage * 10) / 10;
      const churn = Math.round((100 - retention) * 10) / 10;

      return {
        totalRegisteredUsers: this.userCount,
        activeUsers: this.activeUserCount,
        newUsersThisMonth: Math.floor(this.userCount * 0.08),
        userRetention: retention,
        churnRate: churn,
      };
    } catch (error) {
      this.logger.error(`Failed to get user metrics: ${error}`);
      throw error;
    }
  }

  /**
   * Get subscription metrics
   */
  async getSubscriptionMetrics(): Promise<SubscriptionMetrics> {
    try {
      const cancelledCount = this.totalSubscriptions - this.activeSubscriptions;
      const subscribersByTier = {
        free: Math.floor(this.activeSubscriptions * 0.4),
        pro: Math.floor(this.activeSubscriptions * 0.35),
        enterprise: Math.floor(this.activeSubscriptions * 0.15),
        marketplace: Math.floor(this.activeSubscriptions * 0.1),
      };

      const mrr = this.calculateMRR();
      const avgValue = Math.round((mrr / this.activeSubscriptions) * 100) / 100;

      return {
        totalSubscriptions: this.totalSubscriptions,
        activeSubscriptions: this.activeSubscriptions,
        cancelledSubscriptions: cancelledCount,
        subscribersByTier,
        monthlyRecurringRevenue: mrr,
        averageSubscriptionValue: avgValue,
      };
    } catch (error) {
      this.logger.error(`Failed to get subscription metrics: ${error}`);
      throw error;
    }
  }

  /**
   * Get product metrics
   */
  async getProductMetrics(): Promise<ProductMetrics> {
    try {
      const totalSaved = this.activeSubscriptions * 45;

      return {
        totalProducts: 12500,
        totalSavedProducts: totalSaved,
        mostSavedProducts: [
          { id: 'prod_1', name: 'Premium Faucet Pro', saves: 1250 },
          { id: 'prod_2', name: 'Smart Thermostat V2', saves: 1050 },
          { id: 'prod_3', name: 'LED Strip Lights', saves: 890 },
        ],
        averageProductRating: 4.2,
        totalProductComparisons: Math.floor(this.activeUserCount * 2.5),
      };
    } catch (error) {
      this.logger.error(`Failed to get product metrics: ${error}`);
      throw error;
    }
  }

  /**
   * Get marketplace metrics
   */
  async getMarketplaceMetrics(): Promise<MarketplaceMetrics> {
    try {
      const verifiedCount = Math.floor(this.totalSellers * 0.72);
      const completionRate = (this.completedOrders / this.totalOrders) * 100;
      const totalRevenue = this.completedOrders * 85.5;
      const avgOrderValue = Math.round((totalRevenue / this.completedOrders) * 100) / 100;

      return {
        totalSellers: this.totalSellers,
        verifiedSellers: verifiedCount,
        totalServices: this.totalSellers * 8,
        totalOrders: this.totalOrders,
        completedOrders: this.completedOrders,
        totalRevenue: totalRevenue,
        averageOrderValue: avgOrderValue,
        averageSellerRating: 4.6,
      };
    } catch (error) {
      this.logger.error(`Failed to get marketplace metrics: ${error}`);
      throw error;
    }
  }

  /**
   * Get forum metrics
   */
  async getForumMetrics(): Promise<ForumMetrics> {
    try {
      const avgReplies =
        this.totalThreads > 0
          ? Math.round((this.totalReplies / this.totalThreads) * 10) / 10
          : 0;
      const totalViews = this.totalThreads * 127;
      const engagementScore = Math.round((avgReplies * 10 + totalViews * 0.05) * 10) / 10;

      return {
        totalCategories: 5,
        totalThreads: this.totalThreads,
        totalReplies: this.totalReplies,
        averageRepliesPerThread: avgReplies,
        totalViews,
        averageEngagementScore: engagementScore,
      };
    } catch (error) {
      this.logger.error(`Failed to get forum metrics: ${error}`);
      throw error;
    }
  }

  /**
   * Get revenue metrics
   */
  async getRevenueMetrics(): Promise<RevenueMetrics> {
    try {
      const mrr = this.calculateMRR();
      const yrr = mrr * 12;
      const totalRev = this.completedOrders * 85.5 + yrr;

      const revenueByTier = {
        free: 0,
        pro: Math.floor(this.activeSubscriptions * 0.35 * 9.99),
        enterprise: Math.floor(this.activeSubscriptions * 0.15 * 49.99),
        marketplace: Math.floor(this.activeSubscriptions * 0.1 * 4.99),
      };

      const ctv = Math.round((totalRev / this.userCount) * 100) / 100;

      return {
        monthlyRecurringRevenue: mrr,
        yearlyRecurringRevenue: yrr,
        totalRevenue: totalRev,
        revenueByTier,
        revenueGrowth: 15.7,
        customerLifetimeValue: ctv,
      };
    } catch (error) {
      this.logger.error(`Failed to get revenue metrics: ${error}`);
      throw error;
    }
  }

  /**
   * Get dashboard trends
   */
  async getDashboardTrends(): Promise<DashboardTrends> {
    try {
      return {
        userGrowth: [
          { month: '2026-01', value: 980, growth: 0 },
          { month: '2026-02', value: 1050, growth: 7.1 },
          { month: '2026-03', value: 1120, growth: 6.7 },
          { month: '2026-04', value: 1180, growth: 5.4 },
          { month: '2026-05', value: 1250, growth: 5.9 },
        ],
        revenueGrowth: [
          { month: '2026-01', value: 2400, growth: 0 },
          { month: '2026-02', value: 2580, growth: 7.5 },
          { month: '2026-03', value: 2850, growth: 10.4 },
          { month: '2026-04', value: 3120, growth: 9.5 },
          { month: '2026-05', value: 3450, growth: 10.6 },
        ],
        subscriptionGrowth: [
          { month: '2026-01', value: 320, growth: 0 },
          { month: '2026-02', value: 355, growth: 10.9 },
          { month: '2026-03', value: 385, growth: 8.5 },
          { month: '2026-04', value: 405, growth: 5.2 },
          { month: '2026-05', value: 450, growth: 11.1 },
        ],
        orderGrowth: [
          { month: '2026-01', value: 1600, growth: 0 },
          { month: '2026-02', value: 1750, growth: 9.4 },
          { month: '2026-03', value: 2000, growth: 14.3 },
          { month: '2026-04', value: 2150, growth: 7.5 },
          { month: '2026-05', value: 2300, growth: 7.0 },
        ],
      };
    } catch (error) {
      this.logger.error(`Failed to get dashboard trends: ${error}`);
      throw error;
    }
  }

  /**
   * Export dashboard data
   */
  async exportDashboardData(format: 'json' | 'csv'): Promise<{
    format: string;
    data: any;
    filename: string;
    generatedAt: string;
  }> {
    try {
      const overview = await this.getDashboardOverview();
      const userMetrics = await this.getUserMetrics();
      const subscriptionMetrics = await this.getSubscriptionMetrics();
      const productMetrics = await this.getProductMetrics();
      const marketplaceMetrics = await this.getMarketplaceMetrics();
      const forumMetrics = await this.getForumMetrics();
      const revenueMetrics = await this.getRevenueMetrics();
      const trends = await this.getDashboardTrends();

      const exportData = {
        exportedAt: new Date().toISOString(),
        overview,
        userMetrics,
        subscriptionMetrics,
        productMetrics,
        marketplaceMetrics,
        forumMetrics,
        revenueMetrics,
        trends,
      };

      const filename =
        format === 'json'
          ? `dashboard-export-${Date.now()}.json`
          : `dashboard-export-${Date.now()}.csv`;

      return {
        format,
        data: exportData,
        filename,
        generatedAt: new Date().toISOString(),
      };
    } catch (error) {
      this.logger.error(`Failed to export dashboard data: ${error}`);
      throw error;
    }
  }

  /**
   * Get custom report
   */
  async getCustomReport(
    reportType: 'user' | 'revenue' | 'product' | 'marketplace',
    dateRange: 'week' | 'month' | 'quarter' | 'year'
  ): Promise<{
    reportType: string;
    dateRange: string;
    data: any;
    generatedAt: string;
  }> {
    try {
      let reportData = {};

      switch (reportType) {
        case 'user':
          reportData = await this.getUserMetrics();
          break;
        case 'revenue':
          reportData = await this.getRevenueMetrics();
          break;
        case 'product':
          reportData = await this.getProductMetrics();
          break;
        case 'marketplace':
          reportData = await this.getMarketplaceMetrics();
          break;
      }

      return {
        reportType,
        dateRange,
        data: reportData,
        generatedAt: new Date().toISOString(),
      };
    } catch (error) {
      this.logger.error(`Failed to generate custom report: ${error}`);
      throw error;
    }
  }

  /**
   * Calculate MRR based on subscription distribution
   */
  private calculateMRR(): number {
    const proSubscribers = Math.floor(this.activeSubscriptions * 0.35);
    const enterpriseSubscribers = Math.floor(this.activeSubscriptions * 0.15);
    const marketplaceSubscribers = Math.floor(this.activeSubscriptions * 0.1);

    const mrrPro = proSubscribers * 9.99;
    const mrrEnterprise = enterpriseSubscribers * 49.99;
    const mrrMarketplace = marketplaceSubscribers * 4.99;

    return Math.round((mrrPro + mrrEnterprise + mrrMarketplace) * 100) / 100;
  }
}
