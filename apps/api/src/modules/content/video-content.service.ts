import { Injectable } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

export interface VideoContent {
  id: string;
  title: string;
  type: 'tutorial' | 'comparison' | 'installation' | 'review' | 'maintenance';
  description: string;
  duration: number; // seconds
  thumbnail?: string;
  videoUrl?: string;
  productIds: string[];
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  views: number;
  rating: number; // 0-5
  tags: string[];
  createdAt: Date;
}

@Injectable()
export class VideoContentService {
  private prisma: PrismaClient;
  private videos: Map<string, VideoContent> = new Map();

  constructor() {
    this.prisma = new PrismaClient();
    this.initializeSampleVideos();
  }

  /**
   * Get videos for a product
   */
  async getProductVideos(productId: string): Promise<VideoContent[]> {
    return Array.from(this.videos.values()).filter((v) =>
      v.productIds.includes(productId)
    );
  }

  /**
   * Get videos by type
   */
  async getVideosByType(
    type: 'tutorial' | 'comparison' | 'installation' | 'review' | 'maintenance'
  ): Promise<VideoContent[]> {
    return Array.from(this.videos.values())
      .filter((v) => v.type === type)
      .sort((a, b) => b.views - a.views);
  }

  /**
   * Search videos
   */
  async searchVideos(query: string): Promise<VideoContent[]> {
    const term = query.toLowerCase();
    return Array.from(this.videos.values())
      .filter(
        (v) =>
          v.title.toLowerCase().includes(term) ||
          v.description.toLowerCase().includes(term) ||
          v.tags.some((tag) => tag.toLowerCase().includes(term))
      )
      .sort((a, b) => b.views - a.views);
  }

  /**
   * Get featured videos
   */
  async getFeaturedVideos(limit = 10): Promise<VideoContent[]> {
    return Array.from(this.videos.values())
      .sort((a, b) => {
        // Score based on rating and views
        const scoreA = a.rating * (a.views / 100);
        const scoreB = b.rating * (b.views / 100);
        return scoreB - scoreA;
      })
      .slice(0, limit);
  }

  /**
   * Get recommendations for product comparison
   */
  async getComparisonVideos(productIds: string[]): Promise<VideoContent[]> {
    return Array.from(this.videos.values()).filter((v) => {
      // Only return videos that feature multiple of the requested products
      const matches = productIds.filter((id) => v.productIds.includes(id));
      return matches.length >= 2;
    });
  }

  /**
   * Get installation guides
   */
  async getInstallationGuides(productType?: string): Promise<VideoContent[]> {
    return Array.from(this.videos.values())
      .filter(
        (v) =>
          v.type === 'installation' &&
          (!productType ||
            v.productIds.some(
              async (id) => {
                try {
                  const p = await this.prisma.product.findUnique({
                    where: { id },
                  });
                  return p?.productType === productType;
                } catch {
                  return false;
                }
              }
            ))
      )
      .sort((a, b) => a.difficulty.localeCompare(b.difficulty));
  }

  /**
   * Rate a video
   */
  async rateVideo(
    videoId: string,
    rating: number
  ): Promise<{ videoId: string; newRating: number; ratingCount: number }> {
    const video = this.videos.get(videoId);
    if (!video) throw new Error('Video not found');

    // Simple rating update (in production, would track individual ratings)
    video.rating = Math.min(5, Math.max(0, (video.rating + rating) / 2));

    return {
      videoId,
      newRating: Math.round(video.rating * 10) / 10,
      ratingCount: Math.ceil(video.views / 10), // Estimate
    };
  }

  /**
   * Track video view
   */
  async trackVideoView(videoId: string): Promise<void> {
    const video = this.videos.get(videoId);
    if (video) {
      video.views++;
    }
  }

  /**
   * Initialize sample videos for demo
   */
  private initializeSampleVideos(): void {
    const sampleVideos: VideoContent[] = [
      {
        id: 'vid_001',
        title: 'How to Install a Faucet: Complete Guide',
        type: 'installation',
        description: 'Step-by-step guide to installing a bathroom faucet',
        duration: 1200,
        difficulty: 'intermediate',
        views: 2500,
        rating: 4.7,
        tags: ['faucet', 'installation', 'diy', 'plumbing'],
        productIds: ['prod_moen_001', 'prod_delta_001'],
        createdAt: new Date('2024-04-01'),
      },
      {
        id: 'vid_002',
        title: 'Moen vs Delta: Kitchen Faucet Comparison',
        type: 'comparison',
        description: 'Detailed comparison of two popular kitchen faucets',
        duration: 900,
        difficulty: 'beginner',
        views: 4200,
        rating: 4.5,
        tags: ['comparison', 'moen', 'delta', 'faucet'],
        productIds: ['prod_moen_002', 'prod_delta_002'],
        createdAt: new Date('2024-03-15'),
      },
      {
        id: 'vid_003',
        title: 'Faucet Maintenance Tips to Extend Life',
        type: 'maintenance',
        description: 'Learn how to maintain your faucet for longevity',
        duration: 600,
        difficulty: 'beginner',
        views: 1800,
        rating: 4.6,
        tags: ['maintenance', 'faucet', 'tips', 'longevity'],
        productIds: ['prod_kohler_001', 'prod_grohe_001'],
        createdAt: new Date('2024-03-10'),
      },
      {
        id: 'vid_004',
        title: 'Kohler Bathroom Fixtures Review',
        type: 'review',
        description: 'In-depth review of Kohler bathroom fixtures',
        duration: 1500,
        difficulty: 'beginner',
        views: 3100,
        rating: 4.8,
        tags: ['review', 'kohler', 'bathroom', 'quality'],
        productIds: ['prod_kohler_001', 'prod_kohler_002', 'prod_kohler_003'],
        createdAt: new Date('2024-02-20'),
      },
      {
        id: 'vid_005',
        title: 'Valve Replacement Tutorial',
        type: 'tutorial',
        description: 'Learn how to replace cartridge valves',
        duration: 800,
        difficulty: 'advanced',
        views: 950,
        rating: 4.9,
        tags: ['valve', 'replacement', 'tutorial', 'plumbing'],
        productIds: ['prod_moen_cartridge', 'prod_delta_cartridge'],
        createdAt: new Date('2024-02-10'),
      },
    ];

    sampleVideos.forEach((video) => {
      this.videos.set(video.id, video);
    });
  }

  async onModuleDestroy() {
    await this.prisma.$disconnect();
  }
}
