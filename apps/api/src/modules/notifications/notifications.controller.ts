import { Controller, Get, Post, Param, Query, Body } from '@nestjs/common';
import { NotificationsService } from './notifications.service';

@Controller('notifications')
export class NotificationsController {
  constructor(private readonly service: NotificationsService) {}

  /**
   * Get user notifications
   * GET /notifications/:userId?unreadOnly=false
   */
  @Get(':userId')
  async getUserNotifications(
    @Param('userId') userId: string,
    @Query('unreadOnly') unreadOnly: string | undefined = undefined
  ) {
    const result = await this.service.getUserNotifications(userId, unreadOnly === 'true');
    return {
      success: true,
      data: result,
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * Mark notification as read
   * POST /notifications/:userId/:notificationId/read
   */
  @Post(':userId/:notificationId/read')
  async markAsRead(
    @Param('userId') userId: string,
    @Param('notificationId') notificationId: string
  ) {
    await this.service.markAsRead(userId, notificationId);
    return {
      success: true,
      message: 'Notification marked as read',
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * Mark all notifications as read
   * POST /notifications/:userId/read-all
   */
  @Post(':userId/read-all')
  async markAllAsRead(@Param('userId') userId: string) {
    const count = await this.service.markAllAsRead(userId);
    return {
      success: true,
      data: { markedAsRead: count },
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * Clear old notifications
   * POST /notifications/:userId/clear
   * Body: { maxAge?: number } (days)
   */
  @Post(':userId/clear')
  async clearOldNotifications(
    @Param('userId') userId: string,
    @Body() body: { maxAge?: number }
  ) {
    const result = await this.service.clearOldNotifications(userId, body.maxAge || 7);
    return {
      success: true,
      data: result,
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * Get notification statistics
   * GET /notifications/:userId/stats
   */
  @Get(':userId/stats')
  getNotificationStats(@Param('userId') userId: string) {
    const stats = this.service.getNotificationStats(userId);
    return {
      success: true,
      data: stats,
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * Clear all old notifications (system endpoint)
   * POST /notifications/system/cleanup
   * Body: { maxAge?: number }
   */
  @Post('system/cleanup')
  async cleanupOldNotifications(@Body() body: { maxAge?: number }) {
    const result = await this.service.clearOldNotifications(undefined, body.maxAge || 7);
    return {
      success: true,
      data: result,
      timestamp: new Date().toISOString(),
    };
  }
}
