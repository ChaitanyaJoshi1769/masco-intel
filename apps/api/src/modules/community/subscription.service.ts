import { Injectable, Logger } from '@nestjs/common';

export type SubscriptionTier = 'free' | 'pro' | 'enterprise' | 'marketplace';

export interface SubscriptionPlan {
  tier: SubscriptionTier;
  name: string;
  price: number; // monthly price in USD
  description: string;
  features: string[];
  limits: {
    savedProducts: number;
    priceAlerts: number;
    comparisons: number;
    apiRequests: number;
    exportReports: boolean;
    advancedSearch: boolean;
    customDashboards: number;
    marketplaceListings?: number;
    communityReplyCount?: number;
  };
  supportLevel: 'community' | 'email' | 'priority' | 'dedicated';
}

export interface UserSubscription {
  id: string;
  userId: string;
  tier: SubscriptionTier;
  status: 'active' | 'paused' | 'cancelled' | 'expired';
  billingEmail: string;
  billingCycle: 'monthly' | 'yearly';
  startDate: Date;
  renewalDate: Date;
  cancelledAt?: Date;
  paymentMethod?: string;
  metadata?: Record<string, any>;
}

export interface Usage {
  userId: string;
  tier: SubscriptionTier;
  month: string; // YYYY-MM format
  savedProducts: number;
  priceAlerts: number;
  comparisons: number;
  apiRequests: number;
  exportReports: number;
  customDashboards: number;
  marketplaceListings?: number;
}

export interface SubscriptionEvent {
  id: string;
  userId: string;
  type: 'upgrade' | 'downgrade' | 'renewal' | 'cancellation' | 'payment_failed';
  fromTier?: SubscriptionTier;
  toTier: SubscriptionTier;
  amount: number;
  timestamp: Date;
}

@Injectable()
export class SubscriptionService {
  private readonly logger = new Logger(SubscriptionService.name);

  private subscriptionPlans: Map<SubscriptionTier, SubscriptionPlan> = new Map();
  private userSubscriptions: Map<string, UserSubscription> = new Map();
  private usage: Map<string, Usage> = new Map();
  private events: Map<string, SubscriptionEvent> = new Map();

  constructor() {
    this.initializeSubscriptionPlans();
  }

  /**
   * Initialize subscription plans
   */
  private initializeSubscriptionPlans(): void {
    const plans: SubscriptionPlan[] = [
      {
        tier: 'free',
        name: 'Free',
        price: 0,
        description: 'Get started with Masco Intel',
        features: [
          'Basic product search',
          'Save up to 10 products',
          'Price alerts (up to 3)',
          'Basic comparisons',
          'Community forum access',
        ],
        limits: {
          savedProducts: 10,
          priceAlerts: 3,
          comparisons: 5,
          apiRequests: 100,
          exportReports: false,
          advancedSearch: false,
          customDashboards: 0,
        },
        supportLevel: 'community',
      },
      {
        tier: 'pro',
        name: 'Professional',
        price: 9.99,
        description: 'Perfect for contractors and professionals',
        features: [
          'Everything in Free',
          'Save unlimited products',
          'Unlimited price alerts',
          'Advanced search and filters',
          'Export reports (CSV, PDF)',
          'Custom dashboards (up to 3)',
          'ROI calculator',
          'Email support',
          'Bulk operations',
          'Marketplace listing (up to 5)',
        ],
        limits: {
          savedProducts: 1000,
          priceAlerts: 100,
          comparisons: 100,
          apiRequests: 10000,
          exportReports: true,
          advancedSearch: true,
          customDashboards: 3,
          marketplaceListings: 5,
        },
        supportLevel: 'email',
      },
      {
        tier: 'enterprise',
        name: 'Enterprise',
        price: 49.99,
        description: 'For large organizations and agencies',
        features: [
          'Everything in Pro',
          'Priority support (24/7)',
          'Dedicated account manager',
          'Custom integrations',
          'API access (unlimited)',
          'White-label options',
          'Advanced analytics',
          'Team collaboration',
          'Unlimited marketplace listings',
        ],
        limits: {
          savedProducts: 50000,
          priceAlerts: 1000,
          comparisons: 1000,
          apiRequests: 1000000,
          exportReports: true,
          advancedSearch: true,
          customDashboards: 100,
          marketplaceListings: 1000,
        },
        supportLevel: 'dedicated',
      },
      {
        tier: 'marketplace',
        name: 'Marketplace Seller',
        price: 4.99,
        description: 'For marketplace contractors',
        features: [
          'Marketplace profile creation',
          'Service listings (up to 10)',
          'Order management',
          'Review and rating system',
          'Profile analytics',
          'Basic community access',
        ],
        limits: {
          savedProducts: 50,
          priceAlerts: 5,
          comparisons: 20,
          apiRequests: 500,
          exportReports: false,
          advancedSearch: false,
          customDashboards: 0,
          marketplaceListings: 10,
          communityReplyCount: 50,
        },
        supportLevel: 'email',
      },
    ];

    for (const plan of plans) {
      this.subscriptionPlans.set(plan.tier, plan);
    }
  }

  /**
   * Get subscription plan
   */
  async getSubscriptionPlan(tier: SubscriptionTier): Promise<SubscriptionPlan | null> {
    return this.subscriptionPlans.get(tier) || null;
  }

  /**
   * Get all subscription plans
   */
  async getAllSubscriptionPlans(): Promise<SubscriptionPlan[]> {
    return Array.from(this.subscriptionPlans.values());
  }

  /**
   * Create user subscription
   */
  async createSubscription(
    userId: string,
    tier: SubscriptionTier,
    billingEmail: string,
    billingCycle: 'monthly' | 'yearly' = 'monthly'
  ): Promise<UserSubscription> {
    try {
      const subscriptionId = `sub_${userId}_${Date.now()}`;

      const subscription: UserSubscription = {
        id: subscriptionId,
        userId,
        tier,
        status: 'active',
        billingEmail,
        billingCycle,
        startDate: new Date(),
        renewalDate: new Date(Date.now() + (billingCycle === 'monthly' ? 30 : 365) * 24 * 60 * 60 * 1000),
      };

      this.userSubscriptions.set(userId, subscription);

      // Log event
      const plan = this.subscriptionPlans.get(tier);
      if (plan) {
        const eventId = `event_${userId}_${Date.now()}`;
        this.events.set(eventId, {
          id: eventId,
          userId,
          type: 'upgrade',
          toTier: tier,
          amount: plan.price,
          timestamp: new Date(),
        });
      }

      this.logger.log(`Subscription created for ${userId}: ${tier}`);
      return subscription;
    } catch (error) {
      this.logger.error(`Failed to create subscription: ${error}`);
      throw error;
    }
  }

  /**
   * Get user subscription
   */
  async getUserSubscription(userId: string): Promise<UserSubscription | null> {
    return this.userSubscriptions.get(userId) || null;
  }

  /**
   * Upgrade subscription
   */
  async upgradeSubscription(userId: string, newTier: SubscriptionTier): Promise<UserSubscription | null> {
    try {
      const subscription = this.userSubscriptions.get(userId);
      if (!subscription) return null;

      const oldTier = subscription.tier;
      subscription.tier = newTier;
      subscription.status = 'active';
      this.userSubscriptions.set(userId, subscription);

      // Log event
      const plan = this.subscriptionPlans.get(newTier);
      if (plan) {
        const eventId = `event_${userId}_${Date.now()}`;
        this.events.set(eventId, {
          id: eventId,
          userId,
          type: 'upgrade',
          fromTier: oldTier,
          toTier: newTier,
          amount: plan.price,
          timestamp: new Date(),
        });
      }

      this.logger.log(`Subscription upgraded for ${userId}: ${oldTier} -> ${newTier}`);
      return subscription;
    } catch (error) {
      this.logger.error(`Failed to upgrade subscription: ${error}`);
      throw error;
    }
  }

  /**
   * Downgrade subscription
   */
  async downgradeSubscription(userId: string, newTier: SubscriptionTier): Promise<UserSubscription | null> {
    try {
      const subscription = this.userSubscriptions.get(userId);
      if (!subscription) return null;

      const oldTier = subscription.tier;
      subscription.tier = newTier;
      this.userSubscriptions.set(userId, subscription);

      // Log event
      const plan = this.subscriptionPlans.get(newTier);
      if (plan) {
        const eventId = `event_${userId}_${Date.now()}`;
        this.events.set(eventId, {
          id: eventId,
          userId,
          type: 'downgrade',
          fromTier: oldTier,
          toTier: newTier,
          amount: plan.price,
          timestamp: new Date(),
        });
      }

      this.logger.log(`Subscription downgraded for ${userId}: ${oldTier} -> ${newTier}`);
      return subscription;
    } catch (error) {
      this.logger.error(`Failed to downgrade subscription: ${error}`);
      throw error;
    }
  }

  /**
   * Cancel subscription
   */
  async cancelSubscription(userId: string): Promise<UserSubscription | null> {
    try {
      const subscription = this.userSubscriptions.get(userId);
      if (!subscription) return null;

      const oldTier = subscription.tier;
      subscription.status = 'cancelled';
      subscription.cancelledAt = new Date();
      this.userSubscriptions.set(userId, subscription);

      // Log event
      const eventId = `event_${userId}_${Date.now()}`;
      this.events.set(eventId, {
        id: eventId,
        userId,
        type: 'cancellation',
        toTier: oldTier,
        amount: 0,
        timestamp: new Date(),
      });

      this.logger.log(`Subscription cancelled for ${userId}`);
      return subscription;
    } catch (error) {
      this.logger.error(`Failed to cancel subscription: ${error}`);
      throw error;
    }
  }

  /**
   * Track usage
   */
  async trackUsage(
    userId: string,
    metric: string,
    amount: number = 1
  ): Promise<void> {
    try {
      const subscription = await this.getUserSubscription(userId);
      if (!subscription) return;

      const month = new Date().toISOString().substring(0, 7); // YYYY-MM
      const key = `${userId}_${month}`;

      let usage = this.usage.get(key);
      if (!usage) {
        usage = {
          userId,
          tier: subscription.tier,
          month,
          savedProducts: 0,
          priceAlerts: 0,
          comparisons: 0,
          apiRequests: 0,
          exportReports: 0,
          customDashboards: 0,
        };
      }

      // Increment metric
      if (metric === 'savedProducts') usage.savedProducts += amount;
      if (metric === 'priceAlerts') usage.priceAlerts += amount;
      if (metric === 'comparisons') usage.comparisons += amount;
      if (metric === 'apiRequests') usage.apiRequests += amount;
      if (metric === 'exportReports') usage.exportReports += amount;
      if (metric === 'customDashboards') usage.customDashboards += amount;

      this.usage.set(key, usage);
    } catch (error) {
      this.logger.error(`Failed to track usage: ${error}`);
    }
  }

  /**
   * Check usage limits
   */
  async checkUsageLimits(userId: string, metric: string): Promise<{
    allowed: boolean;
    usage: number;
    limit: number;
    percentageUsed: number;
  }> {
    try {
      const subscription = await this.getUserSubscription(userId);
      if (!subscription) {
        return { allowed: false, usage: 0, limit: 0, percentageUsed: 0 };
      }

      const plan = this.subscriptionPlans.get(subscription.tier);
      if (!plan) {
        return { allowed: false, usage: 0, limit: 0, percentageUsed: 0 };
      }

      const month = new Date().toISOString().substring(0, 7);
      const key = `${userId}_${month}`;
      const usage = this.usage.get(key) || { [metric]: 0 };

      const limit = (plan.limits as any)[metric] || 0;
      const used = (usage as any)[metric] || 0;
      const allowed = used < limit;

      return {
        allowed,
        usage: used,
        limit,
        percentageUsed: Math.round((used / limit) * 100),
      };
    } catch (error) {
      this.logger.error(`Failed to check usage limits: ${error}`);
      throw error;
    }
  }

  /**
   * Get subscription statistics
   */
  async getStatistics(): Promise<{
    totalSubscriptions: number;
    activeSubscriptions: number;
    cancelledSubscriptions: number;
    subscribersByTier: Record<SubscriptionTier, number>;
    totalMonthlyRecurringRevenue: number;
  }> {
    try {
      const subscriptions = Array.from(this.userSubscriptions.values());
      const active = subscriptions.filter((s) => s.status === 'active').length;
      const cancelled = subscriptions.filter((s) => s.status === 'cancelled').length;

      const subscribersByTier: Record<SubscriptionTier, number> = {
        free: 0,
        pro: 0,
        enterprise: 0,
        marketplace: 0,
      };

      let totalMRR = 0;
      for (const subscription of subscriptions) {
        if (subscription.status === 'active') {
          subscribersByTier[subscription.tier]++;
          const plan = this.subscriptionPlans.get(subscription.tier);
          if (plan) {
            totalMRR += plan.price;
          }
        }
      }

      return {
        totalSubscriptions: subscriptions.length,
        activeSubscriptions: active,
        cancelledSubscriptions: cancelled,
        subscribersByTier,
        totalMonthlyRecurringRevenue: Math.round(totalMRR * 100) / 100,
      };
    } catch (error) {
      this.logger.error(`Failed to get subscription statistics: ${error}`);
      throw error;
    }
  }
}
