import { Injectable, Logger } from '@nestjs/common';

export type ChatbotCategory =
  | 'product-search'
  | 'pricing'
  | 'comparisons'
  | 'alerts'
  | 'marketplace'
  | 'billing'
  | 'technical'
  | 'account'
  | 'general';

export interface ChatMessage {
  id: string;
  userId: string;
  content: string;
  category?: ChatbotCategory;
  timestamp: Date;
  isUserMessage: boolean;
  sentiment?: 'positive' | 'neutral' | 'negative';
}

export interface ChatConversation {
  id: string;
  userId: string;
  messages: ChatMessage[];
  status: 'active' | 'resolved' | 'escalated';
  createdAt: Date;
  updatedAt: Date;
  resolutionScore?: number; // 0-100 based on satisfaction
  escalatedTo?: string; // human agent ID if escalated
}

export interface KnowledgeBase {
  id: string;
  category: ChatbotCategory;
  keywords: string[];
  question: string;
  answer: string;
  relatedTopics: string[];
  helpfulCount: number;
}

export interface ChatbotStats {
  totalConversations: number;
  averageResolutionScore: number;
  escalatedConversations: number;
  topCategories: Record<ChatbotCategory, number>;
  averageResponseTime: number;
}

@Injectable()
export class ChatbotService {
  private readonly logger = new Logger(ChatbotService.name);

  private conversations: Map<string, ChatConversation> = new Map();
  private knowledgeBase: Map<string, KnowledgeBase> = new Map();
  private messageHistory: ChatMessage[] = [];

  constructor() {
    this.initializeKnowledgeBase();
  }

  /**
   * Initialize knowledge base with common questions
   */
  private initializeKnowledgeBase(): void {
    const faqItems: KnowledgeBase[] = [
      {
        id: 'kb_1',
        category: 'product-search',
        keywords: ['search', 'find', 'product', 'filter', 'categories'],
        question: 'How do I search for products?',
        answer:
          'Use the search bar at the top of the page. You can search by product name, brand, or category. Use filters on the left to narrow results by price, ratings, and specifications.',
        relatedTopics: ['advanced-search', 'filters', 'categories'],
        helpfulCount: 245,
      },
      {
        id: 'kb_2',
        category: 'comparisons',
        keywords: ['compare', 'comparison', 'side-by-side', 'specs'],
        question: 'How can I compare products?',
        answer:
          'Click the compare button on any product page. You can compare up to 5 products side-by-side to see specifications, prices, and ratings.',
        relatedTopics: ['product-details', 'specifications'],
        helpfulCount: 189,
      },
      {
        id: 'kb_3',
        category: 'alerts',
        keywords: ['alert', 'price', 'notification', 'track', 'watch'],
        question: 'How do I set up price alerts?',
        answer:
          'On any product page, click "Set Price Alert". Choose your target price and how often you want to be notified. You\'ll receive alerts via email when prices drop to your target.',
        relatedTopics: ['notifications', 'pricing'],
        helpfulCount: 312,
      },
      {
        id: 'kb_4',
        category: 'marketplace',
        keywords: ['marketplace', 'seller', 'contractor', 'services'],
        question: 'How do I become a marketplace seller?',
        answer:
          'Go to the Marketplace section and click "Become a Seller". Create your profile, add your services, and set your pricing. You can start receiving orders within 24 hours of approval.',
        relatedTopics: ['profile', 'services', 'pricing'],
        helpfulCount: 156,
      },
      {
        id: 'kb_5',
        category: 'billing',
        keywords: ['subscription', 'payment', 'billing', 'upgrade', 'plan'],
        question: 'What are your subscription plans?',
        answer:
          'We offer 4 plans: Free (no cost), Pro ($9.99/month), Enterprise ($49.99/month), and Marketplace Seller ($4.99/month). Each has different features and limits. You can upgrade or downgrade anytime.',
        relatedTopics: ['pricing', 'features', 'billing'],
        helpfulCount: 428,
      },
      {
        id: 'kb_6',
        category: 'account',
        keywords: ['account', 'profile', 'password', 'login', 'password reset'],
        question: 'How do I reset my password?',
        answer:
          'Click "Forgot Password" on the login page. Enter your email address and check your inbox for a reset link. Click the link and create a new password.',
        relatedTopics: ['security', 'login', 'account-management'],
        helpfulCount: 521,
      },
      {
        id: 'kb_7',
        category: 'technical',
        keywords: ['bug', 'error', 'not working', 'problem', 'issue'],
        question: 'What should I do if I encounter a bug?',
        answer:
          'If you experience a technical issue, try clearing your browser cache and cookies. If the problem persists, contact our support team with details about what happened and your browser type.',
        relatedTopics: ['troubleshooting', 'browser-compatibility'],
        helpfulCount: 187,
      },
      {
        id: 'kb_8',
        category: 'general',
        keywords: ['help', 'support', 'contact', 'question'],
        question: 'How can I contact support?',
        answer:
          'You can chat with our AI assistant here, email support@mascoIntel.com, or contact a human agent. Our team is available 24/7 to help with any questions.',
        relatedTopics: ['contact-us', 'support-hours'],
        helpfulCount: 634,
      },
    ];

    for (const item of faqItems) {
      this.knowledgeBase.set(item.id, item);
    }
  }

  /**
   * Create new conversation
   */
  async createConversation(userId: string): Promise<ChatConversation> {
    try {
      const conversationId = `conv_${userId}_${Date.now()}`;

      const conversation: ChatConversation = {
        id: conversationId,
        userId,
        messages: [],
        status: 'active',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      this.conversations.set(conversationId, conversation);
      this.logger.log(`Conversation created: ${conversationId}`);

      return conversation;
    } catch (error) {
      this.logger.error(`Failed to create conversation: ${error}`);
      throw error;
    }
  }

  /**
   * Get conversation
   */
  async getConversation(conversationId: string): Promise<ChatConversation | null> {
    return this.conversations.get(conversationId) || null;
  }

  /**
   * Categorize user message
   */
  private categorizeMessage(content: string): ChatbotCategory {
    const lowerContent = content.toLowerCase();

    if (
      lowerContent.includes('search') ||
      lowerContent.includes('find') ||
      lowerContent.includes('look for')
    ) {
      return 'product-search';
    }
    if (
      lowerContent.includes('compare') ||
      lowerContent.includes('comparison') ||
      lowerContent.includes('versus')
    ) {
      return 'comparisons';
    }
    if (
      lowerContent.includes('price') ||
      lowerContent.includes('alert') ||
      lowerContent.includes('notification')
    ) {
      return 'alerts';
    }
    if (
      lowerContent.includes('marketplace') ||
      lowerContent.includes('seller') ||
      lowerContent.includes('contractor')
    ) {
      return 'marketplace';
    }
    if (
      lowerContent.includes('subscription') ||
      lowerContent.includes('payment') ||
      lowerContent.includes('billing')
    ) {
      return 'billing';
    }
    if (
      lowerContent.includes('account') ||
      lowerContent.includes('password') ||
      lowerContent.includes('login')
    ) {
      return 'account';
    }
    if (
      lowerContent.includes('bug') ||
      lowerContent.includes('error') ||
      lowerContent.includes('technical')
    ) {
      return 'technical';
    }

    return 'general';
  }

  /**
   * Find relevant knowledge base articles
   */
  private findRelevantArticles(content: string): KnowledgeBase[] {
    const lowerContent = content.toLowerCase();

    return Array.from(this.knowledgeBase.values())
      .filter((item) =>
        item.keywords.some((keyword) => lowerContent.includes(keyword))
      )
      .sort((a, b) => b.helpfulCount - a.helpfulCount)
      .slice(0, 3);
  }

  /**
   * Generate chatbot response
   */
  async sendMessage(
    conversationId: string,
    userId: string,
    content: string
  ): Promise<{ userMessage: ChatMessage; botResponse: ChatMessage }> {
    try {
      const conversation = await this.getConversation(conversationId);
      if (!conversation) {
        throw new Error('Conversation not found');
      }

      // Store user message
      const userMessageId = `msg_${Date.now()}_user`;
      const userMessage: ChatMessage = {
        id: userMessageId,
        userId,
        content,
        category: this.categorizeMessage(content),
        timestamp: new Date(),
        isUserMessage: true,
      };

      conversation.messages.push(userMessage);
      this.messageHistory.push(userMessage);

      // Generate bot response
      const relevantArticles = this.findRelevantArticles(content);
      let botResponseContent = '';

      if (relevantArticles.length > 0) {
        botResponseContent = `Based on your question, here's what might help:\n\n${relevantArticles[0].answer}\n\nWas this helpful?`;
      } else {
        botResponseContent =
          "I'm not sure about that specific question. Could you provide more details? Or would you like me to connect you with a human agent?";
      }

      const botMessageId = `msg_${Date.now()}_bot`;
      const botResponse: ChatMessage = {
        id: botMessageId,
        userId,
        content: botResponseContent,
        category: userMessage.category,
        timestamp: new Date(),
        isUserMessage: false,
      };

      conversation.messages.push(botResponse);
      this.messageHistory.push(botResponse);
      conversation.updatedAt = new Date();

      this.conversations.set(conversationId, conversation);

      this.logger.log(`Message processed in conversation: ${conversationId}`);

      return { userMessage, botResponse };
    } catch (error) {
      this.logger.error(`Failed to send message: ${error}`);
      throw error;
    }
  }

  /**
   * Mark conversation as resolved with satisfaction score
   */
  async resolveConversation(
    conversationId: string,
    satisfactionScore: number
  ): Promise<ChatConversation | null> {
    try {
      const conversation = this.conversations.get(conversationId);
      if (!conversation) return null;

      conversation.status = 'resolved';
      conversation.resolutionScore = Math.max(0, Math.min(100, satisfactionScore));
      conversation.updatedAt = new Date();

      this.conversations.set(conversationId, conversation);
      this.logger.log(
        `Conversation resolved: ${conversationId} (score: ${satisfactionScore})`
      );

      return conversation;
    } catch (error) {
      this.logger.error(`Failed to resolve conversation: ${error}`);
      throw error;
    }
  }

  /**
   * Escalate to human agent
   */
  async escalateConversation(
    conversationId: string,
    reason: string
  ): Promise<ChatConversation | null> {
    try {
      const conversation = this.conversations.get(conversationId);
      if (!conversation) return null;

      conversation.status = 'escalated';
      conversation.escalatedTo = `agent_${Date.now()}`;
      conversation.updatedAt = new Date();

      // Add system message
      conversation.messages.push({
        id: `msg_${Date.now()}_system`,
        userId: conversation.userId,
        content: `Your conversation has been escalated to our support team. A human agent will be with you shortly. Reason: ${reason}`,
        timestamp: new Date(),
        isUserMessage: false,
      });

      this.conversations.set(conversationId, conversation);
      this.logger.log(`Conversation escalated: ${conversationId} - ${reason}`);

      return conversation;
    } catch (error) {
      this.logger.error(`Failed to escalate conversation: ${error}`);
      throw error;
    }
  }

  /**
   * Get user conversations
   */
  async getUserConversations(userId: string): Promise<ChatConversation[]> {
    return Array.from(this.conversations.values())
      .filter((c) => c.userId === userId)
      .sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime());
  }

  /**
   * Mark response as helpful
   */
  async markResponseAsHelpful(messageId: string): Promise<void> {
    try {
      const message = this.messageHistory.find((m) => m.id === messageId);
      if (!message) return;

      // Find and update relevant knowledge base article
      const relevantArticles = this.findRelevantArticles(message.content);
      if (relevantArticles.length > 0) {
        relevantArticles[0].helpfulCount++;
      }

      this.logger.log(`Response marked as helpful: ${messageId}`);
    } catch (error) {
      this.logger.error(`Failed to mark response as helpful: ${error}`);
    }
  }

  /**
   * Get chatbot statistics
   */
  async getStatistics(): Promise<ChatbotStats> {
    try {
      const conversations = Array.from(this.conversations.values());
      const resolvedConversations = conversations.filter((c) => c.status === 'resolved');
      const escalatedConversations = conversations.filter((c) => c.status === 'escalated');

      const avgResolutionScore =
        resolvedConversations.length > 0
          ? Math.round(
              (resolvedConversations.reduce(
                (sum, c) => sum + (c.resolutionScore || 0),
                0
              ) /
                resolvedConversations.length) *
                10
            ) / 10
          : 0;

      const topCategories: Record<ChatbotCategory, number> = {
        'product-search': 0,
        pricing: 0,
        comparisons: 0,
        alerts: 0,
        marketplace: 0,
        billing: 0,
        technical: 0,
        account: 0,
        general: 0,
      };

      for (const message of this.messageHistory) {
        if (message.category) {
          topCategories[message.category]++;
        }
      }

      const averageResponseTime =
        this.messageHistory.length > 1
          ? Math.round(
              this.messageHistory
                .slice(0, -1)
                .reduce((sum, m, i) => {
                  const nextMessage = this.messageHistory[i + 1];
                  return (
                    sum +
                    (nextMessage.timestamp.getTime() - m.timestamp.getTime())
                  );
                }, 0) / (this.messageHistory.length - 1)
            )
          : 0;

      return {
        totalConversations: conversations.length,
        averageResolutionScore: avgResolutionScore,
        escalatedConversations: escalatedConversations.length,
        topCategories,
        averageResponseTime,
      };
    } catch (error) {
      this.logger.error(`Failed to get chatbot statistics: ${error}`);
      throw error;
    }
  }
}
