import { Controller, Get, Post, Param, Body, Query } from '@nestjs/common';
import { ForumService } from './forum.service';

@Controller('forum')
export class ForumController {
  constructor(private readonly service: ForumService) {}

  /**
   * Get all forum categories
   * GET /forum/categories
   */
  @Get('categories')
  async getCategories() {
    const categories = await this.service.getCategories();

    return {
      success: true,
      data: categories,
      count: categories.length,
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * Get category by ID
   * GET /forum/categories/:categoryId
   */
  @Get('categories/:categoryId')
  async getCategory(@Param('categoryId') categoryId: string) {
    const category = await this.service.getCategory(categoryId);

    if (!category) {
      return {
        success: false,
        error: 'Category not found',
        timestamp: new Date().toISOString(),
      };
    }

    return {
      success: true,
      data: category,
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * Create forum thread
   * POST /forum/threads
   */
  @Post('threads')
  async createThread(
    @Body()
    body: {
      categoryId: string;
      authorId: string;
      title: string;
      content: string;
      tags?: string[];
    }
  ) {
    const thread = await this.service.createThread(
      body.categoryId,
      body.authorId,
      body.title,
      body.content,
      body.tags || []
    );

    return {
      success: true,
      data: thread,
      message: 'Thread created successfully',
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * Get threads by category
   * GET /forum/categories/:categoryId/threads
   */
  @Get('categories/:categoryId/threads')
  async getThreadsByCategory(
    @Param('categoryId') categoryId: string,
    @Query('limit') limit: string = '50'
  ) {
    const threads = await this.service.getThreadsByCategory(
      categoryId,
      parseInt(limit, 10)
    );

    return {
      success: true,
      data: threads,
      count: threads.length,
      categoryId,
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * Get thread by ID
   * GET /forum/threads/:threadId
   */
  @Get('threads/:threadId')
  async getThread(@Param('threadId') threadId: string) {
    const thread = await this.service.getThread(threadId);

    if (!thread) {
      return {
        success: false,
        error: 'Thread not found',
        timestamp: new Date().toISOString(),
      };
    }

    return {
      success: true,
      data: thread,
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * Add reply to thread
   * POST /forum/threads/:threadId/replies
   */
  @Post('threads/:threadId/replies')
  async addReply(
    @Param('threadId') threadId: string,
    @Body()
    body: {
      authorId: string;
      content: string;
    }
  ) {
    const reply = await this.service.addReply(
      threadId,
      body.authorId,
      body.content
    );

    return {
      success: true,
      data: reply,
      message: 'Reply added successfully',
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * Get replies for thread
   * GET /forum/threads/:threadId/replies
   */
  @Get('threads/:threadId/replies')
  async getRepliesByThread(
    @Param('threadId') threadId: string,
    @Query('limit') limit: string = '50'
  ) {
    const replies = await this.service.getRepliesByThread(
      threadId,
      parseInt(limit, 10)
    );

    return {
      success: true,
      data: replies,
      count: replies.length,
      threadId,
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * Upvote reply
   * POST /forum/replies/:replyId/upvote
   */
  @Post('replies/:replyId/upvote')
  async upvoteReply(@Param('replyId') replyId: string) {
    const reply = await this.service.upvoteReply(replyId);

    if (!reply) {
      return {
        success: false,
        error: 'Reply not found',
        timestamp: new Date().toISOString(),
      };
    }

    return {
      success: true,
      data: reply,
      message: 'Reply upvoted',
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * Pin thread
   * POST /forum/threads/:threadId/pin
   */
  @Post('threads/:threadId/pin')
  async pinThread(@Param('threadId') threadId: string) {
    const thread = await this.service.pinThread(threadId);

    if (!thread) {
      return {
        success: false,
        error: 'Thread not found',
        timestamp: new Date().toISOString(),
      };
    }

    return {
      success: true,
      data: thread,
      message: 'Thread pinned',
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * Lock thread
   * POST /forum/threads/:threadId/lock
   */
  @Post('threads/:threadId/lock')
  async lockThread(@Param('threadId') threadId: string) {
    const thread = await this.service.lockThread(threadId);

    if (!thread) {
      return {
        success: false,
        error: 'Thread not found',
        timestamp: new Date().toISOString(),
      };
    }

    return {
      success: true,
      data: thread,
      message: 'Thread locked',
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * Search threads
   * POST /forum/search
   */
  @Post('search')
  async searchThreads(
    @Body()
    body: {
      query: string;
      limit?: number;
    }
  ) {
    const results = await this.service.searchThreads(
      body.query,
      body.limit || 50
    );

    return {
      success: true,
      data: results,
      count: results.length,
      query: body.query,
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * Get trending threads
   * GET /forum/trending
   */
  @Get('trending')
  async getTrendingThreads(@Query('limit') limit: string = '10') {
    const trending = await this.service.getTrendingThreads(parseInt(limit, 10));

    return {
      success: true,
      data: trending,
      count: trending.length,
      message: 'Trending threads based on views and engagement',
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * Get forum statistics
   * GET /forum/stats
   */
  @Get('stats')
  async getStatistics() {
    const stats = await this.service.getStatistics();

    return {
      success: true,
      data: stats,
      message: 'Forum statistics',
      timestamp: new Date().toISOString(),
    };
  }
}
