import { Controller, Get, Post, Body, Param } from '@nestjs/common';
import { ChatbotService } from './chatbot.service';

@Controller('chatbot')
export class ChatbotController {
  constructor(private readonly service: ChatbotService) {}

  /**
   * Create new conversation
   * POST /chatbot/conversations
   */
  @Post('conversations')
  async createConversation(@Body() body: { userId: string }) {
    const conversation = await this.service.createConversation(body.userId);

    return {
      success: true,
      data: conversation,
      message: 'Conversation created',
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * Get conversation
   * GET /chatbot/conversations/:conversationId
   */
  @Get('conversations/:conversationId')
  async getConversation(@Param('conversationId') conversationId: string) {
    const conversation = await this.service.getConversation(conversationId);

    if (!conversation) {
      return {
        success: false,
        error: 'Conversation not found',
        timestamp: new Date().toISOString(),
      };
    }

    return {
      success: true,
      data: conversation,
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * Send message and get bot response
   * POST /chatbot/conversations/:conversationId/messages
   */
  @Post('conversations/:conversationId/messages')
  async sendMessage(
    @Param('conversationId') conversationId: string,
    @Body() body: { userId: string; content: string }
  ) {
    const result = await this.service.sendMessage(conversationId, body.userId, body.content);

    return {
      success: true,
      data: result,
      message: 'Message processed',
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * Resolve conversation with satisfaction score
   * POST /chatbot/conversations/:conversationId/resolve
   */
  @Post('conversations/:conversationId/resolve')
  async resolveConversation(
    @Param('conversationId') conversationId: string,
    @Body() body: { satisfactionScore: number }
  ) {
    const conversation = await this.service.resolveConversation(
      conversationId,
      body.satisfactionScore
    );

    if (!conversation) {
      return {
        success: false,
        error: 'Conversation not found',
        timestamp: new Date().toISOString(),
      };
    }

    return {
      success: true,
      data: conversation,
      message: `Conversation resolved with score: ${body.satisfactionScore}`,
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * Escalate conversation to human agent
   * POST /chatbot/conversations/:conversationId/escalate
   */
  @Post('conversations/:conversationId/escalate')
  async escalateConversation(
    @Param('conversationId') conversationId: string,
    @Body() body: { reason: string }
  ) {
    const conversation = await this.service.escalateConversation(conversationId, body.reason);

    if (!conversation) {
      return {
        success: false,
        error: 'Conversation not found',
        timestamp: new Date().toISOString(),
      };
    }

    return {
      success: true,
      data: conversation,
      message: `Conversation escalated to human agent. Reason: ${body.reason}`,
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * Get user's conversations
   * GET /chatbot/conversations/user/:userId
   */
  @Get('conversations/user/:userId')
  async getUserConversations(@Param('userId') userId: string) {
    const conversations = await this.service.getUserConversations(userId);

    return {
      success: true,
      data: conversations,
      count: conversations.length,
      userId,
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * Mark response as helpful
   * POST /chatbot/messages/:messageId/helpful
   */
  @Post('messages/:messageId/helpful')
  async markResponseAsHelpful(@Param('messageId') messageId: string) {
    await this.service.markResponseAsHelpful(messageId);

    return {
      success: true,
      message: 'Response marked as helpful',
      messageId,
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * Get chatbot statistics
   * GET /chatbot/stats
   */
  @Get('stats')
  async getStatistics() {
    const stats = await this.service.getStatistics();

    return {
      success: true,
      data: stats,
      message: 'Chatbot statistics',
      timestamp: new Date().toISOString(),
    };
  }
}
