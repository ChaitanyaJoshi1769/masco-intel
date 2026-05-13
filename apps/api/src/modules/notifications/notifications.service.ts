import { Injectable } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

export interface Notification {
  id: string;
  userId?: string;
  type: 'price_alert' | 'price_update' | 'new_product' | 'quality_change' | 'stock_update' | 'recommendation';
  title: string;
  message: string;
  productId?: string;
  data?: Record<string, any>;
  read: boolean;
  createdAt: Date;
  expiresAt?: Date;
}

@Injectable()
export class NotificationsService {
  private prisma: PrismaClient;
  private notifications: Map<string, Notification[]> = new Map();
  private subscribers: Map<string, Set<(notification: Notification) => void>> = new Map();

  constructor() {
    this.prisma = new PrismaClient();
  }

  /**
   * Subscribe to notifications for a user
   */
  subscribe(userId: string, callback: (notification: Notification) => void): string {
    if (!this.subscribers.has(userId)) {
      this.subscribers.set(userId, new Set());
    }
    this.subscribers.get(userId)!.add(callback);

    return `subscription_${userId}_${Date.now()}`;
  }

  /**
   * Unsubscribe from notifications
   */
  unsubscribe(userId: string, callback: (notification: Notification) => void): void {
    const subs = this.subscribers.get(userId);
    if (subs) {
      subs.delete(callback);
    }
  }

  /**
   * Send notification
   */
  async sendNotification(notification: Omit<Notification, 'id' | 'createdAt'>): Promise<Notification> {
    const fullNotification: Notification = {
      ...notification,
      id: `notif_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      createdAt: new Date(),
    };

    // Store notification
    if (notification.userId) {
      if (!this.notifications.has(notification.userId)) {
        this.notifications.set(notification.userId, []);
      }
      this.notifications.get(notification.userId)!.push(fullNotification);

      // Keep only last 100 notifications per user
      const userNotifs = this.notifications.get(notification.userId)!;
      if (userNotifs.length > 100) {
        userNotifs.shift();
      }

      // Notify subscribers
      const subs = this.subscribers.get(notification.userId);
      if (subs) {
        subs.forEach((callback) => callback(fullNotification));
      }
    }

    return fullNotification;
  }

  /**
   * Broadcast price alert for a product
   */
  async broadcastPriceAlert(productId: string, oldPrice: number, newPrice: number): Promise<void> {
    const product = await this.prisma.product.findUnique({
      where: { id: productId },
      include: { priceAlerts: true, brand: true },
    });

    if (!product) return;

    const priceChange = ((newPrice - oldPrice) / oldPrice) * 100;
    const direction = priceChange > 0 ? 'increased' : 'decreased';

    for (const alert of product.priceAlerts) {
      if (!alert.triggered || !alert.lastNotifiedAt) {
        await this.sendNotification({
          userId: alert.userId,
          type: 'price_alert',
          title: `Price ${direction}!`,
          message: `${product.title} price changed from $${oldPrice.toFixed(2)} to $${newPrice.toFixed(2)} (${Math.abs(priceChange).toFixed(1)}%)`,
          productId,
          data: {
            oldPrice,
            newPrice,
            priceChange: Math.round(priceChange * 100) / 100,
            targetPrice: alert.targetPrice,
          },
          read: false,
        });

        // Update alert as triggered
        await this.prisma.priceAlert.update({
          where: { id: alert.id },
          data: {
            triggered: true,
            lastNotifiedAt: new Date(),
          },
        });
      }
    }
  }

  /**
   * Get user notifications
   */
  async getUserNotifications(userId: string, unreadOnly = false): Promise<{
    notifications: Notification[];
    unreadCount: number;
    total: number;
  }> {
    const notifs = this.notifications.get(userId) || [];
    const filtered = unreadOnly ? notifs.filter((n) => !n.read) : notifs;

    return {
      notifications: filtered.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime()),
      unreadCount: notifs.filter((n) => !n.read).length,
      total: notifs.length,
    };
  }

  /**
   * Mark notification as read
   */
  async markAsRead(userId: string, notificationId: string): Promise<void> {
    const notifs = this.notifications.get(userId);
    if (notifs) {
      const notif = notifs.find((n) => n.id === notificationId);
      if (notif) {
        notif.read = true;
      }
    }
  }

  /**
   * Mark all notifications as read
   */
  async markAllAsRead(userId: string): Promise<number> {
    const notifs = this.notifications.get(userId) || [];
    let count = 0;

    for (const notif of notifs) {
      if (!notif.read) {
        notif.read = true;
        count++;
      }
    }

    return count;
  }

  /**
   * Clear old notifications
   */
  async clearOldNotifications(userId?: string, maxAge = 7): Promise<{ cleared: number }> {
    const cutoff = new Date(Date.now() - maxAge * 24 * 60 * 60 * 1000);
    let cleared = 0;

    if (userId) {
      const notifs = this.notifications.get(userId);
      if (notifs) {
        const before = notifs.length;
        const filtered = notifs.filter((n) => n.createdAt > cutoff);
        this.notifications.set(userId, filtered);
        cleared = before - filtered.length;
      }
    } else {
      // Clear for all users
      for (const [uid, notifs] of this.notifications.entries()) {
        const before = notifs.length;
        const filtered = notifs.filter((n) => n.createdAt > cutoff);
        this.notifications.set(uid, filtered);
        cleared += before - filtered.length;
      }
    }

    return { cleared };
  }

  /**
   * Create product availability notification
   */
  async notifyProductAvailability(productId: string, inStock: boolean): Promise<void> {
    const product = await this.prisma.product.findUnique({
      where: { id: productId },
      include: { priceAlerts: true },
    });

    if (!product || product.priceAlerts.length === 0) return;

    for (const alert of product.priceAlerts) {
      await this.sendNotification({
        userId: alert.userId,
        type: 'stock_update',
        title: inStock ? 'Back in Stock!' : 'Out of Stock',
        message: `${product.title} is now ${inStock ? 'back in stock' : 'out of stock'}`,
        productId,
        data: { inStock },
        read: false,
      });
    }
  }

  /**
   * Get notification statistics for user
   */
  getNotificationStats(userId: string): {
    total: number;
    unread: number;
    byType: Record<string, number>;
    oldest: Date | null;
    newest: Date | null;
  } {
    const notifs = this.notifications.get(userId) || [];

    const byType: Record<string, number> = {};
    for (const notif of notifs) {
      byType[notif.type] = (byType[notif.type] || 0) + 1;
    }

    return {
      total: notifs.length,
      unread: notifs.filter((n) => !n.read).length,
      byType,
      oldest: notifs.length > 0 ? notifs[notifs.length - 1].createdAt : null,
      newest: notifs.length > 0 ? notifs[0].createdAt : null,
    };
  }

  async onModuleDestroy() {
    await this.prisma.$disconnect();
  }
}
