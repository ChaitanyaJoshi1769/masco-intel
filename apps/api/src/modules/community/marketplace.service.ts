import { Injectable, Logger } from '@nestjs/common';

export interface MarketplaceProfile {
  id: string;
  userId: string;
  name: string;
  bio: string;
  expertise: string[];
  serviceArea: string[];
  rating: number; // 0-5
  totalReviews: number;
  completedJobs: number;
  hourlyRate?: number;
  profileImage?: string;
  verified: boolean;
  responseTime: number; // in hours
  createdAt: Date;
  updatedAt: Date;
}

export interface MarketplaceServiceListing {
  id: string;
  profileId: string;
  title: string;
  description: string;
  category: string;
  price: number;
  deliveryTime: number; // in days
  active: boolean;
  orders: number;
  createdAt: Date;
}

export interface MarketplaceOrder {
  id: string;
  serviceId: string;
  buyerId: string;
  sellerId: string;
  status: 'pending' | 'in-progress' | 'completed' | 'cancelled';
  price: number;
  notes: string;
  createdAt: Date;
  completedAt?: Date;
}

export interface MarketplaceReview {
  id: string;
  orderId: string;
  reviewerId: string;
  recipientId: string;
  rating: number; // 1-5
  comment: string;
  category: 'communication' | 'quality' | 'timeliness' | 'value';
  helpful: number;
  createdAt: Date;
}

@Injectable()
export class MarketplaceService {
  private readonly logger = new Logger(MarketplaceService.name);

  private profiles: Map<string, MarketplaceProfile> = new Map();
  private services: Map<string, MarketplaceServiceListing> = new Map();
  private orders: Map<string, MarketplaceOrder> = new Map();
  private reviews: Map<string, MarketplaceReview> = new Map();

  /**
   * Create marketplace profile
   */
  async createProfile(
    userId: string,
    name: string,
    bio: string,
    expertise: string[],
    serviceArea: string[]
  ): Promise<MarketplaceProfile> {
    try {
      const profileId = `profile_${userId}_${Date.now()}`;

      const profile: MarketplaceProfile = {
        id: profileId,
        userId,
        name,
        bio,
        expertise,
        serviceArea,
        rating: 0,
        totalReviews: 0,
        completedJobs: 0,
        verified: false,
        responseTime: 24,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      this.profiles.set(profileId, profile);
      this.logger.log(`Marketplace profile created: ${profileId}`);

      return profile;
    } catch (error) {
      this.logger.error(`Failed to create marketplace profile: ${error}`);
      throw error;
    }
  }

  /**
   * Get marketplace profile
   */
  async getProfile(profileId: string): Promise<MarketplaceProfile | null> {
    return this.profiles.get(profileId) || null;
  }

  /**
   * Update profile rating
   */
  async updateProfileRating(profileId: string): Promise<MarketplaceProfile | null> {
    try {
      const profile = this.profiles.get(profileId);
      if (!profile) return null;

      const reviews = Array.from(this.reviews.values()).filter(
        (r) => r.recipientId === profile.userId
      );

      if (reviews.length > 0) {
        const avgRating = reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length;
        profile.rating = Math.round(avgRating * 10) / 10;
        profile.totalReviews = reviews.length;
        profile.updatedAt = new Date();
        this.profiles.set(profileId, profile);
      }

      return profile;
    } catch (error) {
      this.logger.error(`Failed to update profile rating: ${error}`);
      throw error;
    }
  }

  /**
   * Create marketplace service
   */
  async createService(
    profileId: string,
    title: string,
    description: string,
    category: string,
    price: number,
    deliveryTime: number
  ): Promise<MarketplaceServiceListing> {
    try {
      const serviceId = `service_${profileId}_${Date.now()}`;

      const service: MarketplaceServiceListing = {
        id: serviceId,
        profileId,
        title,
        description,
        category,
        price,
        deliveryTime,
        active: true,
        orders: 0,
        createdAt: new Date(),
      };

      this.services.set(serviceId, service);
      this.logger.log(`Marketplace service created: ${serviceId}`);

      return service;
    } catch (error) {
      this.logger.error(`Failed to create marketplace service: ${error}`);
      throw error;
    }
  }

  /**
   * Get services by profile
   */
  async getServicesByProfile(profileId: string): Promise<MarketplaceServiceListing[]> {
    return Array.from(this.services.values())
      .filter((s) => s.profileId === profileId && s.active)
      .sort((a, b) => b.orders - a.orders);
  }

  /**
   * Search services
   */
  async searchServices(
    query: string,
    category?: string,
    maxPrice?: number
  ): Promise<MarketplaceServiceListing[]> {
    try {
      const searchTerm = query.toLowerCase();

      return Array.from(this.services.values())
        .filter(
          (s) =>
            s.active &&
            (s.title.toLowerCase().includes(searchTerm) ||
              s.description.toLowerCase().includes(searchTerm)) &&
            (!category || s.category === category) &&
            (!maxPrice || s.price <= maxPrice)
        )
        .sort((a, b) => b.orders - a.orders);
    } catch (error) {
      this.logger.error(`Failed to search services: ${error}`);
      throw error;
    }
  }

  /**
   * Create order
   */
  async createOrder(
    serviceId: string,
    buyerId: string,
    sellerId: string,
    price: number,
    notes?: string
  ): Promise<MarketplaceOrder> {
    try {
      const orderId = `order_${serviceId}_${Date.now()}`;

      const order: MarketplaceOrder = {
        id: orderId,
        serviceId,
        buyerId,
        sellerId,
        status: 'pending',
        price,
        notes: notes || '',
        createdAt: new Date(),
      };

      this.orders.set(orderId, order);

      // Update service order count
      const service = this.services.get(serviceId);
      if (service) {
        service.orders++;
        this.services.set(serviceId, service);
      }

      this.logger.log(`Order created: ${orderId}`);
      return order;
    } catch (error) {
      this.logger.error(`Failed to create order: ${error}`);
      throw error;
    }
  }

  /**
   * Get order
   */
  async getOrder(orderId: string): Promise<MarketplaceOrder | null> {
    return this.orders.get(orderId) || null;
  }

  /**
   * Update order status
   */
  async updateOrderStatus(
    orderId: string,
    status: 'pending' | 'in-progress' | 'completed' | 'cancelled'
  ): Promise<MarketplaceOrder | null> {
    try {
      const order = this.orders.get(orderId);
      if (!order) return null;

      order.status = status;
      if (status === 'completed') {
        order.completedAt = new Date();
      }

      this.orders.set(orderId, order);
      this.logger.log(`Order status updated: ${orderId} -> ${status}`);

      return order;
    } catch (error) {
      this.logger.error(`Failed to update order status: ${error}`);
      throw error;
    }
  }

  /**
   * Add review
   */
  async addReview(
    orderId: string,
    reviewerId: string,
    recipientId: string,
    rating: number,
    comment: string,
    category: 'communication' | 'quality' | 'timeliness' | 'value'
  ): Promise<MarketplaceReview> {
    try {
      const reviewId = `review_${orderId}_${Date.now()}`;

      const review: MarketplaceReview = {
        id: reviewId,
        orderId,
        reviewerId,
        recipientId,
        rating: Math.min(5, Math.max(1, rating)),
        comment,
        category,
        helpful: 0,
        createdAt: new Date(),
      };

      this.reviews.set(reviewId, review);

      // Update profile rating
      const profile = Array.from(this.profiles.values()).find(
        (p) => p.userId === recipientId
      );
      if (profile) {
        await this.updateProfileRating(profile.id);
      }

      this.logger.log(`Review added: ${reviewId}`);
      return review;
    } catch (error) {
      this.logger.error(`Failed to add review: ${error}`);
      throw error;
    }
  }

  /**
   * Get reviews for user
   */
  async getReviewsForUser(userId: string): Promise<MarketplaceReview[]> {
    return Array.from(this.reviews.values())
      .filter((r) => r.recipientId === userId)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  /**
   * Get user's orders
   */
  async getUserOrders(userId: string): Promise<MarketplaceOrder[]> {
    return Array.from(this.orders.values())
      .filter((o) => o.buyerId === userId || o.sellerId === userId)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  /**
   * Get marketplace statistics
   */
  async getStatistics(): Promise<{
    totalProfiles: number;
    totalServices: number;
    totalOrders: number;
    completedOrders: number;
    totalReviews: number;
    averageRating: number;
  }> {
    try {
      const profiles = Array.from(this.profiles.values());
      const services = Array.from(this.services.values());
      const orders = Array.from(this.orders.values());
      const reviews = Array.from(this.reviews.values());

      const completedOrders = orders.filter((o) => o.status === 'completed').length;
      const avgRating =
        reviews.length > 0
          ? Math.round(
              (reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length) * 10
            ) / 10
          : 0;

      return {
        totalProfiles: profiles.length,
        totalServices: services.length,
        totalOrders: orders.length,
        completedOrders,
        totalReviews: reviews.length,
        averageRating: avgRating,
      };
    } catch (error) {
      this.logger.error(`Failed to get marketplace statistics: ${error}`);
      throw error;
    }
  }
}
