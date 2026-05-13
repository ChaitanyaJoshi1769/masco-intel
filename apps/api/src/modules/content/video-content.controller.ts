import { Controller, Get, Post, Param, Query, Body } from '@nestjs/common';
import { VideoContentService } from './video-content.service';

@Controller('videos')
export class VideoContentController {
  constructor(private readonly service: VideoContentService) {}

  /**
   * Get videos for a product
   * GET /videos/product/:productId
   */
  @Get('product/:productId')
  async getProductVideos(@Param('productId') productId: string) {
    const videos = await this.service.getProductVideos(productId);
    return {
      success: true,
      data: {
        productId,
        videos,
        count: videos.length,
      },
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * Get videos by type
   * GET /videos/type/:type
   */
  @Get('type/:type')
  async getVideosByType(
    @Param('type') type: 'tutorial' | 'comparison' | 'installation' | 'review' | 'maintenance'
  ) {
    const videos = await this.service.getVideosByType(type);
    return {
      success: true,
      data: {
        type,
        videos,
        count: videos.length,
      },
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * Search videos
   * GET /videos/search?query=faucet&limit=10
   */
  @Get('search')
  async searchVideos(@Query('query') query: string, @Query('limit') limit = 10) {
    const videos = await this.service.searchVideos(query);
    return {
      success: true,
      data: {
        query,
        videos: videos.slice(0, parseInt(limit as any, 10)),
        total: videos.length,
      },
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * Get featured videos
   * GET /videos/featured?limit=10
   */
  @Get('featured')
  async getFeaturedVideos(@Query('limit') limit = 10) {
    const videos = await this.service.getFeaturedVideos(parseInt(limit as any, 10));
    return {
      success: true,
      data: {
        videos,
        count: videos.length,
      },
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * Get comparison videos for products
   * POST /videos/comparisons
   * Body: { productIds: string[] }
   */
  @Post('comparisons')
  async getComparisonVideos(@Body() body: { productIds: string[] }) {
    const videos = await this.service.getComparisonVideos(body.productIds);
    return {
      success: true,
      data: {
        productIds: body.productIds,
        videos,
        count: videos.length,
      },
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * Get installation guides
   * GET /videos/installation?productType=faucet
   */
  @Get('installation')
  async getInstallationGuides(@Query('productType') productType?: string) {
    const videos = await this.service.getInstallationGuides(productType);
    return {
      success: true,
      data: {
        productType,
        videos,
        count: videos.length,
      },
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * Rate a video
   * POST /videos/:videoId/rate
   * Body: { rating: 1-5 }
   */
  @Post(':videoId/rate')
  async rateVideo(
    @Param('videoId') videoId: string,
    @Body() body: { rating: number }
  ) {
    try {
      const result = await this.service.rateVideo(videoId, body.rating);
      return {
        success: true,
        data: result,
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Rating failed',
        timestamp: new Date().toISOString(),
      };
    }
  }

  /**
   * Track video view
   * POST /videos/:videoId/view
   */
  @Post(':videoId/view')
  async trackVideoView(@Param('videoId') videoId: string) {
    try {
      await this.service.trackVideoView(videoId);
      return {
        success: true,
        message: 'View tracked',
        videoId,
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Tracking failed',
        timestamp: new Date().toISOString(),
      };
    }
  }
}
