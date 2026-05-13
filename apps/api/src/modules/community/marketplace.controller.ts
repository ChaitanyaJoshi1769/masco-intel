import { Controller, Get, Post, Body, Param, Query } from '@nestjs/common';
import { MarketplaceService } from './marketplace.service';

@Controller('marketplace')
export class MarketplaceController {
  constructor(private readonly service: MarketplaceService) {}

  /**
   * Create marketplace profile
   * POST /marketplace/profiles
   */
  @Post('profiles')
  async createProfile(
    @Body()
    body: {
      userId: string;
      name: string;
      bio: string;
      expertise: string[];
      serviceArea: string[];
    }
  ) {
    const profile = await this.service.createProfile(
      body.userId,
      body.name,
      body.bio,
      body.expertise,
      body.serviceArea
    );

    return {
      success: true,
      data: profile,
      message: 'Marketplace profile created',
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * Get marketplace profile
   * GET /marketplace/profiles/:profileId
   */
  @Get('profiles/:profileId')
  async getProfile(@Param('profileId') profileId: string) {
    const profile = await this.service.getProfile(profileId);

    if (!profile) {
      return {
        success: false,
        error: 'Profile not found',
        timestamp: new Date().toISOString(),
      };
    }

    return {
      success: true,
      data: profile,
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * Create marketplace service
   * POST /marketplace/services
   */
  @Post('services')
  async createService(
    @Body()
    body: {
      profileId: string;
      title: string;
      description: string;
      category: string;
      price: number;
      deliveryTime: number;
    }
  ) {
    const service = await this.service.createService(
      body.profileId,
      body.title,
      body.description,
      body.category,
      body.price,
      body.deliveryTime
    );

    return {
      success: true,
      data: service,
      message: 'Service created successfully',
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * Get services by profile
   * GET /marketplace/profiles/:profileId/services
   */
  @Get('profiles/:profileId/services')
  async getServicesByProfile(@Param('profileId') profileId: string) {
    const services = await this.service.getServicesByProfile(profileId);

    return {
      success: true,
      data: services,
      count: services.length,
      profileId,
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * Search services
   * GET /marketplace/search?query=...&category=...&maxPrice=...
   */
  @Get('search')
  async searchServices(
    @Query('query') query: string,
    @Query('category') category?: string,
    @Query('maxPrice') maxPrice?: string
  ) {
    const results = await this.service.searchServices(
      query,
      category,
      maxPrice ? parseInt(maxPrice, 10) : undefined
    );

    return {
      success: true,
      data: results,
      count: results.length,
      query,
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * Create order
   * POST /marketplace/orders
   */
  @Post('orders')
  async createOrder(
    @Body()
    body: {
      serviceId: string;
      buyerId: string;
      sellerId: string;
      price: number;
      notes?: string;
    }
  ) {
    const order = await this.service.createOrder(
      body.serviceId,
      body.buyerId,
      body.sellerId,
      body.price,
      body.notes
    );

    return {
      success: true,
      data: order,
      message: 'Order created successfully',
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * Get order
   * GET /marketplace/orders/:orderId
   */
  @Get('orders/:orderId')
  async getOrder(@Param('orderId') orderId: string) {
    const order = await this.service.getOrder(orderId);

    if (!order) {
      return {
        success: false,
        error: 'Order not found',
        timestamp: new Date().toISOString(),
      };
    }

    return {
      success: true,
      data: order,
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * Update order status
   * POST /marketplace/orders/:orderId/status
   */
  @Post('orders/:orderId/status')
  async updateOrderStatus(
    @Param('orderId') orderId: string,
    @Body() body: { status: 'pending' | 'in-progress' | 'completed' | 'cancelled' }
  ) {
    const order = await this.service.updateOrderStatus(orderId, body.status);

    if (!order) {
      return {
        success: false,
        error: 'Order not found',
        timestamp: new Date().toISOString(),
      };
    }

    return {
      success: true,
      data: order,
      message: `Order status updated to ${body.status}`,
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * Add review
   * POST /marketplace/reviews
   */
  @Post('reviews')
  async addReview(
    @Body()
    body: {
      orderId: string;
      reviewerId: string;
      recipientId: string;
      rating: number;
      comment: string;
      category: 'communication' | 'quality' | 'timeliness' | 'value';
    }
  ) {
    const review = await this.service.addReview(
      body.orderId,
      body.reviewerId,
      body.recipientId,
      body.rating,
      body.comment,
      body.category
    );

    return {
      success: true,
      data: review,
      message: 'Review added successfully',
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * Get reviews for user
   * GET /marketplace/reviews?userId=...
   */
  @Get('reviews')
  async getReviewsForUser(@Query('userId') userId: string) {
    const reviews = await this.service.getReviewsForUser(userId);

    return {
      success: true,
      data: reviews,
      count: reviews.length,
      userId,
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * Get user's orders
   * GET /marketplace/user/:userId/orders
   */
  @Get('user/:userId/orders')
  async getUserOrders(@Param('userId') userId: string) {
    const orders = await this.service.getUserOrders(userId);

    return {
      success: true,
      data: orders,
      count: orders.length,
      userId,
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * Get marketplace statistics
   * GET /marketplace/stats
   */
  @Get('stats')
  async getStatistics() {
    const stats = await this.service.getStatistics();

    return {
      success: true,
      data: stats,
      message: 'Marketplace statistics',
      timestamp: new Date().toISOString(),
    };
  }
}
