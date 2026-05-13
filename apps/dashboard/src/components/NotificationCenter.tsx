import React, { useState, useEffect } from 'react';
import { Button, Card, CardBody, CardHeader, Chip } from '@/components';
import { useWebSocket, useToast } from '@/hooks';

interface Notification {
  id: string;
  type: 'price-alert' | 'product-update' | 'stock-change' | 'market-trend' | 'order-status';
  title: string;
  message: string;
  data: any;
  timestamp: string;
  read: boolean;
}

interface NotificationCenterProps {
  userId: string;
  visible: boolean;
  onClose: () => void;
}

export const NotificationCenter: React.FC<NotificationCenterProps> = ({
  userId,
  visible,
  onClose,
}) => {
  const { showToast } = useToast();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const {
    connected,
    subscribeNotifications,
    unsubscribeNotifications,
    markNotificationRead,
    clearNotifications,
    on,
  } = useWebSocket();

  // Subscribe to notifications on mount
  useEffect(() => {
    if (connected && userId) {
      subscribeNotifications(userId);
    }

    return () => {
      if (connected && userId) {
        unsubscribeNotifications(userId);
      }
    };
  }, [connected, userId, subscribeNotifications, unsubscribeNotifications]);

  // Listen for new notifications
  useEffect(() => {
    const unsubscribe = on('notification', (notification: Notification) => {
      setNotifications((prev) => [notification, ...prev]);
      setUnreadCount((prev) => prev + 1);

      // Show toast for new notification
      showToast(`${notification.title}: ${notification.message}`, 'info');
    });

    return unsubscribe;
  }, [on, showToast]);

  // Listen for pending notifications on reconnection
  useEffect(() => {
    const unsubscribe = on('pending-notifications', (data: any) => {
      if (data.notifications && data.notifications.length > 0) {
        setNotifications(data.notifications);
        const unread = data.notifications.filter((n: Notification) => !n.read).length;
        setUnreadCount(unread);
      }
    });

    return unsubscribe;
  }, [on]);

  // Listen for notification read events
  useEffect(() => {
    const unsubscribe = on('notification-read', (data: any) => {
      setNotifications((prev) =>
        prev.map((n) =>
          n.id === data.notificationId ? { ...n, read: true } : n
        )
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
    });

    return unsubscribe;
  }, [on]);

  // Listen for clear notifications
  useEffect(() => {
    const unsubscribe = on('notifications-cleared', () => {
      setNotifications([]);
      setUnreadCount(0);
    });

    return unsubscribe;
  }, [on]);

  const handleMarkRead = (notificationId: string) => {
    markNotificationRead(userId, notificationId);
  };

  const handleClearAll = () => {
    clearNotifications(userId);
  };

  const getNotificationColor = (type: string): string => {
    switch (type) {
      case 'price-alert':
        return 'ok';
      case 'stock-change':
        return 'warn';
      case 'product-update':
        return 'cyan';
      case 'market-trend':
        return 'violet';
      case 'order-status':
        return 'copper';
      default:
        return 'cyan';
    }
  };

  const getNotificationIcon = (type: string): string => {
    switch (type) {
      case 'price-alert':
        return '💰';
      case 'stock-change':
        return '📦';
      case 'product-update':
        return '🔄';
      case 'market-trend':
        return '📊';
      case 'order-status':
        return '📮';
      default:
        return '🔔';
    }
  };

  if (!visible) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-end p-6">
      <Card className="w-full max-w-md max-h-96 flex flex-col">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-xl">🔔</span>
              <h3 className="text-base font-semibold">Notifications</h3>
              {unreadCount > 0 && (
                <span
                  className="px-2 py-1 text-xs font-semibold rounded-full"
                  style={{
                    backgroundColor: 'var(--bad)',
                    color: 'white',
                  }}
                >
                  {unreadCount}
                </span>
              )}
            </div>
            <Button
              variant="default"
              size="sm"
              onClick={onClose}
            >
              ✕
            </Button>
          </div>
        </CardHeader>

        <CardBody className="overflow-y-auto flex-1 space-y-2">
          {notifications.length === 0 ? (
            <div className="text-center py-8">
              <div className="text-3xl mb-2">📭</div>
              <p className="text-sm text-ink-3">No notifications yet</p>
            </div>
          ) : (
            notifications.map((notif) => (
              <div
                key={notif.id}
                className="p-3 rounded-lg border border-line-1 cursor-pointer hover:bg-bg-2 transition"
                style={{
                  backgroundColor: notif.read ? 'var(--bg-1)' : 'var(--bg-2)',
                  opacity: notif.read ? 0.7 : 1,
                }}
                onClick={() => !notif.read && handleMarkRead(notif.id)}
              >
                <div className="flex items-start gap-2 mb-1">
                  <span className="text-lg flex-shrink-0">
                    {getNotificationIcon(notif.type)}
                  </span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h4 className="text-sm font-semibold truncate">
                        {notif.title}
                      </h4>
                      <Chip
                        variant={getNotificationColor(notif.type) as any}
                        className="text-xs flex-shrink-0"
                      >
                        {notif.type.replace('-', ' ')}
                      </Chip>
                    </div>
                    <p className="text-xs text-ink-2 mt-1 line-clamp-2">
                      {notif.message}
                    </p>
                  </div>
                  {!notif.read && (
                    <div
                      className="w-2 h-2 rounded-full flex-shrink-0 mt-1"
                      style={{ backgroundColor: 'var(--violet)' }}
                    />
                  )}
                </div>
                <p className="text-xs text-ink-3 text-right">
                  {new Date(notif.timestamp).toLocaleTimeString()}
                </p>
              </div>
            ))
          )}
        </CardBody>

        {notifications.length > 0 && (
          <div className="border-t border-line-1 p-3">
            <Button
              variant="default"
              size="sm"
              className="w-full"
              onClick={handleClearAll}
            >
              Clear All
            </Button>
          </div>
        )}
      </Card>
    </div>
  );
};

export default NotificationCenter;
