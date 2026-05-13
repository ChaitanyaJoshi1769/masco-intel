import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Injectable } from '@nestjs/common';

interface Notification {
  id: string;
  type: 'price-alert' | 'product-update' | 'stock-change' | 'market-trend' | 'order-status';
  title: string;
  message: string;
  data: any;
  timestamp: string;
  read: boolean;
}

@Injectable()
@WebSocketGateway({
  cors: {
    origin: '*',
    methods: ['GET', 'POST'],
  },
})
export class NotificationsGateway
  implements OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer()
  server!: Server;

  private userConnections: Map<string, Set<string>> = new Map(); // userId -> Set<socketIds>
  private userNotifications: Map<string, Notification[]> = new Map(); // userId -> notifications

  handleConnection(client: Socket) {
    console.log(`Notification client connected: ${client.id}`);
  }

  handleDisconnect(client: Socket) {
    console.log(`Notification client disconnected: ${client.id}`);
    // Remove from user connections
    for (const [userId, socketIds] of this.userConnections.entries()) {
      socketIds.delete(client.id);
      if (socketIds.size === 0) {
        this.userConnections.delete(userId);
      }
    }
  }

  /**
   * User subscribes to notifications
   */
  @SubscribeMessage('subscribe-notifications')
  handleSubscribe(client: Socket, data: { userId: string }): void {
    if (!this.userConnections.has(data.userId)) {
      this.userConnections.set(data.userId, new Set());
    }
    this.userConnections.get(data.userId)!.add(client.id);
    client.emit('subscribed', { userId: data.userId });

    // Send any pending notifications
    const pending = this.userNotifications.get(data.userId) || [];
    if (pending.length > 0) {
      client.emit('pending-notifications', { notifications: pending });
    }
  }

  /**
   * User unsubscribes from notifications
   */
  @SubscribeMessage('unsubscribe-notifications')
  handleUnsubscribe(client: Socket, data: { userId: string }): void {
    const socketIds = this.userConnections.get(data.userId);
    if (socketIds) {
      socketIds.delete(client.id);
      if (socketIds.size === 0) {
        this.userConnections.delete(data.userId);
      }
    }
    client.emit('unsubscribed', { userId: data.userId });
  }

  /**
   * Mark notification as read
   */
  @SubscribeMessage('mark-notification-read')
  handleMarkRead(client: Socket, data: { userId: string; notificationId: string }): void {
    const notifications = this.userNotifications.get(data.userId);
    if (notifications) {
      const notif = notifications.find((n) => n.id === data.notificationId);
      if (notif) {
        notif.read = true;
      }
    }
    // Broadcast to user's other connections
    this.broadcastToUser(data.userId, 'notification-read', {
      notificationId: data.notificationId,
    });
  }

  /**
   * Clear all notifications for user
   */
  @SubscribeMessage('clear-notifications')
  handleClearNotifications(client: Socket, data: { userId: string }): void {
    this.userNotifications.set(data.userId, []);
    this.broadcastToUser(data.userId, 'notifications-cleared', {});
  }

  /**
   * Emit price alert notification
   */
  emitPriceAlert(
    userId: string,
    productId: string,
    productName: string,
    oldPrice: number,
    newPrice: number
  ): void {
    const notification: Notification = {
      id: `notif-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      type: 'price-alert',
      title: `Price Drop: ${productName}`,
      message: `Price dropped from $${oldPrice.toFixed(2)} to $${newPrice.toFixed(2)}`,
      data: {
        productId,
        productName,
        oldPrice,
        newPrice,
        priceChange: oldPrice - newPrice,
        percentChange: ((oldPrice - newPrice) / oldPrice * 100).toFixed(1),
      },
      timestamp: new Date().toISOString(),
      read: false,
    };

    this.storeAndBroadcastNotification(userId, notification);
  }

  /**
   * Emit product update notification
   */
  emitProductUpdate(
    userId: string,
    productId: string,
    productName: string,
    updateType: string,
    details: string
  ): void {
    const notification: Notification = {
      id: `notif-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      type: 'product-update',
      title: `Product Update: ${productName}`,
      message: `${updateType}: ${details}`,
      data: {
        productId,
        productName,
        updateType,
      },
      timestamp: new Date().toISOString(),
      read: false,
    };

    this.storeAndBroadcastNotification(userId, notification);
  }

  /**
   * Emit stock change notification
   */
  emitStockChange(
    userId: string,
    productId: string,
    productName: string,
    status: 'in_stock' | 'low' | 'out_of_stock'
  ): void {
    const statusMessages = {
      in_stock: 'Product is back in stock!',
      low: 'Stock is running low',
      out_of_stock: 'Product is now out of stock',
    };

    const notification: Notification = {
      id: `notif-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      type: 'stock-change',
      title: `Stock Update: ${productName}`,
      message: statusMessages[status],
      data: {
        productId,
        productName,
        status,
      },
      timestamp: new Date().toISOString(),
      read: false,
    };

    this.storeAndBroadcastNotification(userId, notification);
  }

  /**
   * Emit market trend notification
   */
  emitMarketTrend(
    userId: string,
    trendType: string,
    description: string,
    data: any
  ): void {
    const notification: Notification = {
      id: `notif-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      type: 'market-trend',
      title: `Market Trend: ${trendType}`,
      message: description,
      data,
      timestamp: new Date().toISOString(),
      read: false,
    };

    this.storeAndBroadcastNotification(userId, notification);
  }

  /**
   * Emit order status notification
   */
  emitOrderStatus(
    userId: string,
    orderId: string,
    status: string,
    details: string
  ): void {
    const notification: Notification = {
      id: `notif-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      type: 'order-status',
      title: `Order ${status}: #${orderId}`,
      message: details,
      data: {
        orderId,
        status,
      },
      timestamp: new Date().toISOString(),
      read: false,
    };

    this.storeAndBroadcastNotification(userId, notification);
  }

  /**
   * Private: Store notification and broadcast to user
   */
  private storeAndBroadcastNotification(
    userId: string,
    notification: Notification
  ): void {
    // Store notification
    if (!this.userNotifications.has(userId)) {
      this.userNotifications.set(userId, []);
    }
    const notifications = this.userNotifications.get(userId)!;
    notifications.unshift(notification); // Add to front (newest first)

    // Keep only last 50 notifications
    if (notifications.length > 50) {
      notifications.pop();
    }

    // Broadcast to user's connected sockets
    this.broadcastToUser(userId, 'notification', notification);
  }

  /**
   * Private: Broadcast event to all user's connections
   */
  private broadcastToUser(userId: string, event: string, data: any): void {
    const socketIds = this.userConnections.get(userId);
    if (socketIds) {
      socketIds.forEach((socketId) => {
        this.server.to(socketId).emit(event, data);
      });
    }
  }

  /**
   * Get unread notification count
   */
  getUnreadCount(userId: string): number {
    const notifications = this.userNotifications.get(userId) || [];
    return notifications.filter((n) => !n.read).length;
  }

  /**
   * Get all notifications for user
   */
  getAllNotifications(userId: string): Notification[] {
    return this.userNotifications.get(userId) || [];
  }
}
