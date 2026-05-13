import { useEffect, useRef, useState, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';

interface UseWebSocketOptions {
  url?: string;
  reconnection?: boolean;
  reconnectionDelay?: number;
  reconnectionDelayMax?: number;
  reconnectionAttempts?: number;
}

export const useWebSocket = (options: UseWebSocketOptions = {}) => {
  const socketRef = useRef<Socket | null>(null);
  const [connected, setConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const url = options.url || (typeof window !== 'undefined'
    ? `${window.location.protocol}//${window.location.host}`
    : '');

  // Initialize socket connection
  useEffect(() => {
    if (!url) return;

    socketRef.current = io(url, {
      reconnection: options.reconnection !== false,
      reconnectionDelay: options.reconnectionDelay || 1000,
      reconnectionDelayMax: options.reconnectionDelayMax || 5000,
      reconnectionAttempts: options.reconnectionAttempts || 5,
    });

    socketRef.current.on('connect', () => {
      setConnected(true);
      setError(null);
    });

    socketRef.current.on('disconnect', () => {
      setConnected(false);
    });

    socketRef.current.on('connect_error', (err: any) => {
      setError(err.message || 'Connection error');
    });

    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
      }
    };
  }, [url, options.reconnection, options.reconnectionDelay, options.reconnectionDelayMax, options.reconnectionAttempts]);

  // Subscribe to event
  const on = useCallback((event: string, callback: (...args: any[]) => void) => {
    if (socketRef.current) {
      socketRef.current.on(event, callback);
    }
    return () => {
      if (socketRef.current) {
        socketRef.current.off(event, callback);
      }
    };
  }, []);

  // Emit event
  const emit = useCallback((event: string, data?: any) => {
    if (socketRef.current) {
      socketRef.current.emit(event, data);
    }
  }, []);

  // Register user
  const register = useCallback((userId: string) => {
    emit('register', { userId });
  }, [emit]);

  // Join conversation
  const joinConversation = useCallback((conversationId: string) => {
    emit('join-conversation', { conversationId });
  }, [emit]);

  // Leave conversation
  const leaveConversation = useCallback((conversationId: string) => {
    emit('leave-conversation', { conversationId });
  }, [emit]);

  // Send message
  const sendMessage = useCallback((conversationId: string, content: string, role = 'user') => {
    emit('send-message', { conversationId, content, role });
  }, [emit]);

  // Mark as typing
  const setTyping = useCallback((conversationId: string, isTyping: boolean) => {
    emit('typing', { conversationId, isTyping });
  }, [emit]);

  // Mark messages as read
  const markMessagesRead = useCallback((conversationId: string, messageIds: string[]) => {
    emit('mark-read', { conversationId, messageIds });
  }, [emit]);

  // Subscribe to notifications
  const subscribeNotifications = useCallback((userId: string) => {
    emit('subscribe-notifications', { userId });
  }, [emit]);

  // Unsubscribe from notifications
  const unsubscribeNotifications = useCallback((userId: string) => {
    emit('unsubscribe-notifications', { userId });
  }, [emit]);

  // Mark notification as read
  const markNotificationRead = useCallback((userId: string, notificationId: string) => {
    emit('mark-notification-read', { userId, notificationId });
  }, [emit]);

  // Clear all notifications
  const clearNotifications = useCallback((userId: string) => {
    emit('clear-notifications', { userId });
  }, [emit]);

  return {
    socket: socketRef.current,
    connected,
    error,
    on,
    emit,
    register,
    joinConversation,
    leaveConversation,
    sendMessage,
    setTyping,
    markMessagesRead,
    subscribeNotifications,
    unsubscribeNotifications,
    markNotificationRead,
    clearNotifications,
  };
};
