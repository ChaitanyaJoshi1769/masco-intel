import { Controller, Get, Post, Body, Param, Query } from '@nestjs/common';
import { SubscriptionService } from './subscription.service';
import type { SubscriptionTier } from './subscription.service';

@Controller('subscriptions')
export class SubscriptionController {
  constructor(private readonly service: SubscriptionService) {}

  /**
   * Get all subscription plans
   * GET /subscriptions/plans
   */
  @Get('plans')
  async getAllSubscriptionPlans() {
    const plans = await this.service.getAllSubscriptionPlans();

    return {
      success: true,
      data: plans,
      count: plans.length,
      message: 'Available subscription plans',
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * Get subscription plan
   * GET /subscriptions/plans/:tier
   */
  @Get('plans/:tier')
  async getSubscriptionPlan(@Param('tier') tier: SubscriptionTier) {
    const plan = await this.service.getSubscriptionPlan(tier);

    if (!plan) {
      return {
        success: false,
        error: 'Plan not found',
        timestamp: new Date().toISOString(),
      };
    }

    return {
      success: true,
      data: plan,
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * Create user subscription
   * POST /subscriptions
   */
  @Post()
  async createSubscription(
    @Body()
    body: {
      userId: string;
      tier: SubscriptionTier;
      billingEmail: string;
      billingCycle?: 'monthly' | 'yearly';
    }
  ) {
    const subscription = await this.service.createSubscription(
      body.userId,
      body.tier,
      body.billingEmail,
      body.billingCycle || 'monthly'
    );

    return {
      success: true,
      data: subscription,
      message: `Subscription created for tier: ${body.tier}`,
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * Get user subscription
   * GET /subscriptions/:userId
   */
  @Get(':userId')
  async getUserSubscription(@Param('userId') userId: string) {
    const subscription = await this.service.getUserSubscription(userId);

    if (!subscription) {
      return {
        success: false,
        error: 'Subscription not found',
        timestamp: new Date().toISOString(),
      };
    }

    return {
      success: true,
      data: subscription,
      userId,
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * Upgrade subscription
   * POST /subscriptions/:userId/upgrade
   */
  @Post(':userId/upgrade')
  async upgradeSubscription(
    @Param('userId') userId: string,
    @Body() body: { tier: SubscriptionTier }
  ) {
    const subscription = await this.service.upgradeSubscription(userId, body.tier);

    if (!subscription) {
      return {
        success: false,
        error: 'Subscription not found',
        timestamp: new Date().toISOString(),
      };
    }

    return {
      success: true,
      data: subscription,
      message: `Subscription upgraded to ${body.tier}`,
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * Downgrade subscription
   * POST /subscriptions/:userId/downgrade
   */
  @Post(':userId/downgrade')
  async downgradeSubscription(
    @Param('userId') userId: string,
    @Body() body: { tier: SubscriptionTier }
  ) {
    const subscription = await this.service.downgradeSubscription(userId, body.tier);

    if (!subscription) {
      return {
        success: false,
        error: 'Subscription not found',
        timestamp: new Date().toISOString(),
      };
    }

    return {
      success: true,
      data: subscription,
      message: `Subscription downgraded to ${body.tier}`,
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * Cancel subscription
   * POST /subscriptions/:userId/cancel
   */
  @Post(':userId/cancel')
  async cancelSubscription(@Param('userId') userId: string) {
    const subscription = await this.service.cancelSubscription(userId);

    if (!subscription) {
      return {
        success: false,
        error: 'Subscription not found',
        timestamp: new Date().toISOString(),
      };
    }

    return {
      success: true,
      data: subscription,
      message: 'Subscription cancelled',
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * Track usage
   * POST /subscriptions/:userId/usage
   */
  @Post(':userId/usage')
  async trackUsage(
    @Param('userId') userId: string,
    @Body()
    body: {
      metric: string;
      amount?: number;
    }
  ) {
    await this.service.trackUsage(userId, body.metric, body.amount || 1);

    return {
      success: true,
      message: `Usage tracked: ${body.metric} +${body.amount || 1}`,
      userId,
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * Check usage limits
   * GET /subscriptions/:userId/limits?metric=apiRequests
   */
  @Get(':userId/limits')
  async checkUsageLimits(
    @Param('userId') userId: string,
    @Query('metric') metric: string
  ) {
    const limits = await this.service.checkUsageLimits(userId, metric);

    return {
      success: true,
      data: limits,
      userId,
      metric,
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * Get subscription statistics
   * GET /subscriptions/stats/overview
   */
  @Get('stats/overview')
  async getStatistics() {
    const stats = await this.service.getStatistics();

    return {
      success: true,
      data: stats,
      message: 'Subscription statistics',
      timestamp: new Date().toISOString(),
    };
  }
}
