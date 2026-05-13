import { Injectable, Logger } from '@nestjs/common';

export interface ForumCategory {
  id: string;
  name: string;
  description: string;
  slug: string;
  icon?: string;
  order: number;
  threadCount: number;
  createdAt: Date;
}

export interface ForumThread {
  id: string;
  categoryId: string;
  authorId: string;
  title: string;
  content: string;
  slug: string;
  tags: string[];
  views: number;
  replies: number;
  isPinned: boolean;
  isLocked: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface ForumReply {
  id: string;
  threadId: string;
  authorId: string;
  content: string;
  upvotes: number;
  downvotes: number;
  isModerated: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface ThreadMetrics {
  threadId: string;
  title: string;
  viewCount: number;
  replyCount: number;
  lastActivityAt: Date;
  popularity: number; // 0-100 based on engagement
}

@Injectable()
export class ForumService {
  private readonly logger = new Logger(ForumService.name);

  private categories: Map<string, ForumCategory> = new Map();
  private threads: Map<string, ForumThread> = new Map();
  private replies: Map<string, ForumReply> = new Map();
  private threadMetrics: Map<string, ThreadMetrics> = new Map();

  constructor() {
    this.initializeDefaultCategories();
  }

  /**
   * Initialize default forum categories
   */
  private initializeDefaultCategories(): void {
    const defaultCategories: ForumCategory[] = [
      {
        id: 'cat_general',
        name: 'General Discussion',
        description: 'General discussion about products and services',
        slug: 'general-discussion',
        icon: '💬',
        order: 1,
        threadCount: 0,
        createdAt: new Date(),
      },
      {
        id: 'cat_products',
        name: 'Product Reviews',
        description: 'Share and discuss product reviews and comparisons',
        slug: 'product-reviews',
        icon: '⭐',
        order: 2,
        threadCount: 0,
        createdAt: new Date(),
      },
      {
        id: 'cat_contractors',
        name: 'Contractor Tips',
        description: 'Tips and tricks for contractors and professionals',
        slug: 'contractor-tips',
        icon: '🔧',
        order: 3,
        threadCount: 0,
        createdAt: new Date(),
      },
      {
        id: 'cat_help',
        name: 'Help & Support',
        description: 'Get help with using the platform',
        slug: 'help-support',
        icon: '❓',
        order: 4,
        threadCount: 0,
        createdAt: new Date(),
      },
      {
        id: 'cat_announcements',
        name: 'Announcements',
        description: 'Important announcements and updates',
        slug: 'announcements',
        icon: '📢',
        order: 0,
        threadCount: 0,
        createdAt: new Date(),
      },
    ];

    for (const category of defaultCategories) {
      this.categories.set(category.id, category);
    }
  }

  /**
   * Get all categories
   */
  async getCategories(): Promise<ForumCategory[]> {
    try {
      return Array.from(this.categories.values()).sort((a, b) => a.order - b.order);
    } catch (error) {
      this.logger.error(`Failed to get categories: ${error}`);
      throw error;
    }
  }

  /**
   * Get category by ID
   */
  async getCategory(categoryId: string): Promise<ForumCategory | null> {
    return this.categories.get(categoryId) || null;
  }

  /**
   * Create forum thread
   */
  async createThread(
    categoryId: string,
    authorId: string,
    title: string,
    content: string,
    tags: string[] = []
  ): Promise<ForumThread> {
    try {
      const threadId = `thread_${Date.now()}_${Math.random().toString(36).substring(7)}`;
      const slug = title.toLowerCase().replace(/\s+/g, '-').substring(0, 50);

      const thread: ForumThread = {
        id: threadId,
        categoryId,
        authorId,
        title,
        content,
        slug,
        tags,
        views: 0,
        replies: 0,
        isPinned: false,
        isLocked: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      this.threads.set(threadId, thread);

      // Update category thread count
      const category = this.categories.get(categoryId);
      if (category) {
        category.threadCount++;
        this.categories.set(categoryId, category);
      }

      // Initialize metrics
      this.threadMetrics.set(threadId, {
        threadId,
        title,
        viewCount: 0,
        replyCount: 0,
        lastActivityAt: new Date(),
        popularity: 0,
      });

      this.logger.log(`Thread created: ${threadId} in category ${categoryId}`);
      return thread;
    } catch (error) {
      this.logger.error(`Failed to create thread: ${error}`);
      throw error;
    }
  }

  /**
   * Get threads by category
   */
  async getThreadsByCategory(categoryId: string, limit: number = 50): Promise<ForumThread[]> {
    try {
      return Array.from(this.threads.values())
        .filter((t) => t.categoryId === categoryId)
        .sort((a, b) => {
          if (a.isPinned !== b.isPinned) return a.isPinned ? -1 : 1;
          return b.updatedAt.getTime() - a.updatedAt.getTime();
        })
        .slice(0, limit);
    } catch (error) {
      this.logger.error(`Failed to get threads by category: ${error}`);
      throw error;
    }
  }

  /**
   * Get thread by ID
   */
  async getThread(threadId: string): Promise<ForumThread | null> {
    try {
      const thread = this.threads.get(threadId);
      if (thread) {
        // Increment view count
        thread.views++;
        this.threads.set(threadId, thread);

        // Update metrics
        const metrics = this.threadMetrics.get(threadId);
        if (metrics) {
          metrics.viewCount = thread.views;
          this.threadMetrics.set(threadId, metrics);
        }
      }
      return thread || null;
    } catch (error) {
      this.logger.error(`Failed to get thread: ${error}`);
      throw error;
    }
  }

  /**
   * Add reply to thread
   */
  async addReply(threadId: string, authorId: string, content: string): Promise<ForumReply> {
    try {
      const replyId = `reply_${Date.now()}_${Math.random().toString(36).substring(7)}`;

      const reply: ForumReply = {
        id: replyId,
        threadId,
        authorId,
        content,
        upvotes: 0,
        downvotes: 0,
        isModerated: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      this.replies.set(replyId, reply);

      // Update thread reply count
      const thread = this.threads.get(threadId);
      if (thread) {
        thread.replies++;
        thread.updatedAt = new Date();
        this.threads.set(threadId, thread);

        // Update metrics
        const metrics = this.threadMetrics.get(threadId);
        if (metrics) {
          metrics.replyCount = thread.replies;
          metrics.lastActivityAt = new Date();
          this.threadMetrics.set(threadId, metrics);
        }
      }

      this.logger.log(`Reply added to thread ${threadId}`);
      return reply;
    } catch (error) {
      this.logger.error(`Failed to add reply: ${error}`);
      throw error;
    }
  }

  /**
   * Get replies for thread
   */
  async getRepliesByThread(threadId: string, limit: number = 50): Promise<ForumReply[]> {
    try {
      return Array.from(this.replies.values())
        .filter((r) => r.threadId === threadId)
        .sort((a, b) => b.upvotes - a.upvotes || a.createdAt.getTime() - b.createdAt.getTime())
        .slice(0, limit);
    } catch (error) {
      this.logger.error(`Failed to get replies: ${error}`);
      throw error;
    }
  }

  /**
   * Upvote reply
   */
  async upvoteReply(replyId: string): Promise<ForumReply | null> {
    try {
      const reply = this.replies.get(replyId);
      if (reply) {
        reply.upvotes++;
        this.replies.set(replyId, reply);
      }
      return reply || null;
    } catch (error) {
      this.logger.error(`Failed to upvote reply: ${error}`);
      throw error;
    }
  }

  /**
   * Pin thread
   */
  async pinThread(threadId: string): Promise<ForumThread | null> {
    try {
      const thread = this.threads.get(threadId);
      if (thread) {
        thread.isPinned = true;
        this.threads.set(threadId, thread);
        this.logger.log(`Thread pinned: ${threadId}`);
      }
      return thread || null;
    } catch (error) {
      this.logger.error(`Failed to pin thread: ${error}`);
      throw error;
    }
  }

  /**
   * Lock thread
   */
  async lockThread(threadId: string): Promise<ForumThread | null> {
    try {
      const thread = this.threads.get(threadId);
      if (thread) {
        thread.isLocked = true;
        this.threads.set(threadId, thread);
        this.logger.log(`Thread locked: ${threadId}`);
      }
      return thread || null;
    } catch (error) {
      this.logger.error(`Failed to lock thread: ${error}`);
      throw error;
    }
  }

  /**
   * Search threads
   */
  async searchThreads(query: string, limit: number = 50): Promise<ForumThread[]> {
    try {
      const searchTerm = query.toLowerCase();
      return Array.from(this.threads.values())
        .filter(
          (t) =>
            t.title.toLowerCase().includes(searchTerm) ||
            t.content.toLowerCase().includes(searchTerm) ||
            t.tags.some((tag) => tag.toLowerCase().includes(searchTerm))
        )
        .sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime())
        .slice(0, limit);
    } catch (error) {
      this.logger.error(`Failed to search threads: ${error}`);
      throw error;
    }
  }

  /**
   * Get trending threads
   */
  async getTrendingThreads(limit: number = 10): Promise<ThreadMetrics[]> {
    try {
      return Array.from(this.threadMetrics.values())
        .map((metrics) => ({
          ...metrics,
          popularity: metrics.viewCount * 0.3 + metrics.replyCount * 0.7,
        }))
        .sort((a, b) => b.popularity - a.popularity)
        .slice(0, limit);
    } catch (error) {
      this.logger.error(`Failed to get trending threads: ${error}`);
      throw error;
    }
  }

  /**
   * Get forum statistics
   */
  async getStatistics(): Promise<{
    totalCategories: number;
    totalThreads: number;
    totalReplies: number;
    avgRepliesPerThread: number;
    totalViews: number;
  }> {
    try {
      const threads = Array.from(this.threads.values());
      const replies = Array.from(this.replies.values());

      return {
        totalCategories: this.categories.size,
        totalThreads: threads.length,
        totalReplies: replies.length,
        avgRepliesPerThread:
          threads.length > 0
            ? Math.round(
                (replies.length / threads.length) * 100
              ) / 100
            : 0,
        totalViews: threads.reduce((sum, t) => sum + t.views, 0),
      };
    } catch (error) {
      this.logger.error(`Failed to get forum statistics: ${error}`);
      throw error;
    }
  }
}
