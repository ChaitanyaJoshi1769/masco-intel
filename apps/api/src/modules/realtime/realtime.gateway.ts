import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
  ConnectedSocket,
  MessageBody,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Logger } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

interface UserSubscription {
  userId: string;
  productIds: string[];
  categories: string[];
  types: string[];
}

@WebSocketGateway({
  cors: { origin: '*' },
  namespace: '/realtime',
})
export class RealtimeGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server!: Server;

  private logger = new Logger(RealtimeGateway.name);
  private userSubscriptions = new Map<string, UserSubscription>();
  private prisma = new PrismaClient();

  /**
   * Handle client connection
   */
  handleConnection(client: Socket) {
    this.logger.log(`Client connected: ${client.id}`);
    client.emit('connected', {
      message: 'Connected to real-time updates',
      serverId: client.id,
      timestamp: new Date().toISOString(),
    });
  }

  /**
   * Handle client disconnection
   */
  handleDisconnect(client: Socket) {
    this.logger.log(`Client disconnected: ${client.id}`);
    this.userSubscriptions.delete(client.id);
  }

  /**
   * Subscribe to product price updates
   */
  @SubscribeMessage('subscribe-product')
  async handleProductSubscription(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { productId: string; userId?: string }
  ) {
    const key = client.id;
    const existing = this.userSubscriptions.get(key) || {
      userId: data.userId || 'anonymous',
      productIds: [],
      categories: [],
      types: [],
    };

    if (!existing.productIds.includes(data.productId)) {
      existing.productIds.push(data.productId);
    }

    this.userSubscriptions.set(key, existing);

    // Join room for this product
    client.join(`product-${data.productId}`);

    client.emit('subscribed', {
      type: 'product',
      productId: data.productId,
      message: `Subscribed to ${data.productId} price updates`,
      timestamp: new Date().toISOString(),
    });

    this.logger.log(`Client ${client.id} subscribed to product ${data.productId}`);
  }

  /**
   * Subscribe to category price updates
   */
  @SubscribeMessage('subscribe-category')
  handleCategorySubscription(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { category: string; userId?: string }
  ) {
    const key = client.id;
    const existing = this.userSubscriptions.get(key) || {
      userId: data.userId || 'anonymous',
      productIds: [],
      categories: [],
      types: [],
    };

    if (!existing.categories.includes(data.category)) {
      existing.categories.push(data.category);
    }

    this.userSubscriptions.set(key, existing);

    // Join category room
    client.join(`category-${data.category}`);

    client.emit('subscribed', {
      type: 'category',
      category: data.category,
      message: `Subscribed to ${data.category} updates`,
      timestamp: new Date().toISOString(),
    });

    this.logger.log(`Client ${client.id} subscribed to category ${data.category}`);
  }

  /**
   * Subscribe to alert notifications
   */
  @SubscribeMessage('subscribe-alerts')
  handleAlertSubscription(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { userId: string }
  ) {
    const existing = this.userSubscriptions.get(client.id) || {
      userId: data.userId,
      productIds: [],
      categories: [],
      types: [],
    };

    if (!existing.types.includes('alerts')) {
      existing.types.push('alerts');
    }

    this.userSubscriptions.set(client.id, existing);

    // Join user alert room
    client.join(`user-${data.userId}-alerts`);

    client.emit('subscribed', {
      type: 'alerts',
      userId: data.userId,
      message: 'Subscribed to alerts',
      timestamp: new Date().toISOString(),
    });

    this.logger.log(`Client ${client.id} subscribed to alerts for user ${data.userId}`);
  }

  /**
   * Unsubscribe from updates
   */
  @SubscribeMessage('unsubscribe')
  handleUnsubscribe(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { type: 'product' | 'category' | 'alerts'; id: string }
  ) {
    const key = client.id;
    const existing = this.userSubscriptions.get(key);

    if (existing) {
      if (data.type === 'product') {
        existing.productIds = existing.productIds.filter((p) => p !== data.id);
        client.leave(`product-${data.id}`);
      } else if (data.type === 'category') {
        existing.categories = existing.categories.filter((c) => c !== data.id);
        client.leave(`category-${data.id}`);
      } else if (data.type === 'alerts') {
        existing.types = existing.types.filter((t) => t !== 'alerts');
        client.leave(`user-${data.id}-alerts`);
      }

      this.userSubscriptions.set(key, existing);
    }

    client.emit('unsubscribed', {
      type: data.type,
      id: data.id,
      timestamp: new Date().toISOString(),
    });
  }

  /**
   * Broadcast price update to all subscribers
   */
  async broadcastPriceUpdate(productId: string, priceData: {
    price: number;
    retailer: string;
    change: number;
    timestamp: Date;
  }) {
    this.server.to(`product-${productId}`).emit('price-update', {
      productId,
      ...priceData,
      timestamp: priceData.timestamp.toISOString(),
    });

    // Also get product category and broadcast there
    try {
      const product = await this.prisma.product.findUnique({
        where: { id: productId },
      });

      if (product) {
        this.server.to(`category-${product.productType}`).emit('category-update', {
          productId,
          category: product.productType,
          title: product.title,
          ...priceData,
          timestamp: priceData.timestamp.toISOString(),
        });
      }
    } catch (error) {
      this.logger.error(`Error broadcasting category update: ${error}`);
    }
  }

  /**
   * Broadcast alert to user
   */
  broadcastAlert(userId: string, alertData: {
    type: string;
    title: string;
    message: string;
    productId?: string;
    data?: Record<string, any>;
  }) {
    this.server.to(`user-${userId}-alerts`).emit('alert', {
      ...alertData,
      timestamp: new Date().toISOString(),
    });
  }

  /**
   * Get active connections
   */
  getActiveConnections(): {
    totalConnections: number;
    subscriptions: {
      products: number;
      categories: number;
      alerts: number;
    };
  } {
    let productCount = 0;
    let categoryCount = 0;
    let alertCount = 0;

    this.userSubscriptions.forEach((sub) => {
      productCount += sub.productIds.length;
      categoryCount += sub.categories.length;
      if (sub.types.includes('alerts')) alertCount++;
    });

    return {
      totalConnections: this.userSubscriptions.size,
      subscriptions: {
        products: productCount,
        categories: categoryCount,
        alerts: alertCount,
      },
    };
  }

  /**
   * Get user subscriptions
   */
  getUserSubscriptions(clientId: string): UserSubscription | null {
    return this.userSubscriptions.get(clientId) || null;
  }

  async onModuleDestroy() {
    await this.prisma.$disconnect();
  }
}
