import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Injectable } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

interface ChatMessage {
  id: string;
  conversationId: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
}

@Injectable()
@WebSocketGateway({
  cors: {
    origin: '*',
    methods: ['GET', 'POST'],
  },
})
export class ChatbotGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server!: Server;

  private prisma: PrismaClient;
  private userConnections: Map<string, string> = new Map(); // userId -> socketId
  private conversationConnections: Map<string, Set<string>> = new Map(); // conversationId -> socketIds

  constructor() {
    this.prisma = new PrismaClient();
  }

  handleConnection(client: Socket) {
    console.log(`Client connected: ${client.id}`);
  }

  handleDisconnect(client: Socket) {
    console.log(`Client disconnected: ${client.id}`);
    // Remove user from connections
    for (const [userId, socketId] of this.userConnections.entries()) {
      if (socketId === client.id) {
        this.userConnections.delete(userId);
        break;
      }
    }
    // Remove from conversation connections
    for (const [conversationId, socketIds] of this.conversationConnections.entries()) {
      socketIds.delete(client.id);
      if (socketIds.size === 0) {
        this.conversationConnections.delete(conversationId);
      }
    }
  }

  /**
   * Register user connection to track which socket belongs to which user
   */
  @SubscribeMessage('register')
  handleRegister(client: Socket, data: { userId: string }): void {
    this.userConnections.set(data.userId, client.id);
    client.emit('registered', { userId: data.userId });
  }

  /**
   * Join a conversation room for real-time updates
   */
  @SubscribeMessage('join-conversation')
  handleJoinConversation(
    client: Socket,
    data: { conversationId: string }
  ): void {
    if (!this.conversationConnections.has(data.conversationId)) {
      this.conversationConnections.set(data.conversationId, new Set());
    }
    this.conversationConnections.get(data.conversationId)!.add(client.id);
    client.join(`conversation-${data.conversationId}`);
    client.emit('joined-conversation', { conversationId: data.conversationId });
  }

  /**
   * Leave a conversation room
   */
  @SubscribeMessage('leave-conversation')
  handleLeaveConversation(
    client: Socket,
    data: { conversationId: string }
  ): void {
    client.leave(`conversation-${data.conversationId}`);
    const socketIds = this.conversationConnections.get(data.conversationId);
    if (socketIds) {
      socketIds.delete(client.id);
      if (socketIds.size === 0) {
        this.conversationConnections.delete(data.conversationId);
      }
    }
    client.emit('left-conversation', { conversationId: data.conversationId });
  }

  /**
   * Send a message in real-time (broadcast to conversation participants)
   */
  @SubscribeMessage('send-message')
  async handleSendMessage(
    client: Socket,
    data: { conversationId: string; content: string; role?: string }
  ): Promise<void> {
    try {
      const messageId = `msg-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      const timestamp = new Date().toISOString();

      const message: ChatMessage = {
        id: messageId,
        conversationId: data.conversationId,
        role: (data.role as 'user' | 'assistant') || 'user',
        content: data.content,
        timestamp,
      };

      // Broadcast message to all participants in this conversation
      this.server
        .to(`conversation-${data.conversationId}`)
        .emit('message-received', message);

      // Acknowledge receipt to sender
      client.emit('message-sent', { messageId, timestamp });

      // Simulate AI response (replace with real AI service in production)
      setTimeout(() => {
        const aiResponseId = `msg-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        const aiMessage: ChatMessage = {
          id: aiResponseId,
          conversationId: data.conversationId,
          role: 'assistant',
          content: this.generateAIResponse(data.content),
          timestamp: new Date().toISOString(),
        };
        this.server
          .to(`conversation-${data.conversationId}`)
          .emit('message-received', aiMessage);
      }, 500);
    } catch (error) {
      client.emit('message-error', { error: error instanceof Error ? error.message : 'Unknown error' });
    }
  }

  /**
   * Typing indicator - broadcast when user is typing
   */
  @SubscribeMessage('typing')
  handleTyping(
    client: Socket,
    data: { conversationId: string; isTyping: boolean }
  ): void {
    client.broadcast
      .to(`conversation-${data.conversationId}`)
      .emit('user-typing', {
        isTyping: data.isTyping,
        socketId: client.id,
      });
  }

  /**
   * Mark message as read
   */
  @SubscribeMessage('mark-read')
  handleMarkRead(
    client: Socket,
    data: { conversationId: string; messageIds: string[] }
  ): void {
    this.server.to(`conversation-${data.conversationId}`).emit('messages-read', {
      messageIds: data.messageIds,
      socketId: client.id,
    });
  }

  /**
   * Emit real-time notification to specific user
   */
  emitToUser(userId: string, event: string, data: any): void {
    const socketId = this.userConnections.get(userId);
    if (socketId) {
      this.server.to(socketId).emit(event, data);
    }
  }

  /**
   * Emit real-time notification to conversation participants
   */
  emitToConversation(conversationId: string, event: string, data: any): void {
    this.server.to(`conversation-${conversationId}`).emit(event, data);
  }

  /**
   * Simple AI response generator (placeholder - replace with real AI service)
   */
  private generateAIResponse(userMessage: string): string {
    const responses = [
      `I'm analyzing your request about "${userMessage.substring(0, 20)}...". Let me fetch the relevant data from our system.`,
      `Great question! I'm searching our product database for information related to "${userMessage.substring(0, 30)}...".`,
      `I understand you're asking about "${userMessage.substring(0, 25)}...". Let me pull up the latest market data.`,
      `Looking into that for you. I can help with product comparisons, pricing analysis, and market trends based on your question.`,
    ];
    return responses[Math.floor(Math.random() * responses.length)];
  }
}
