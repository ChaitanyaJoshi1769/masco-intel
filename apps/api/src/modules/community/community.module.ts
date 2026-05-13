import { Module } from '@nestjs/common';
import { ForumService } from './forum.service';
import { ForumController } from './forum.controller';
import { MarketplaceService } from './marketplace.service';
import { MarketplaceController } from './marketplace.controller';
import { SubscriptionService } from './subscription.service';
import { SubscriptionController } from './subscription.controller';
import { ChatbotService } from './chatbot.service';
import { ChatbotController } from './chatbot.controller';
import { AnalyticsService } from './analytics.service';
import { AnalyticsController } from './analytics.controller';

@Module({
  controllers: [ForumController, MarketplaceController, SubscriptionController, ChatbotController, AnalyticsController],
  providers: [ForumService, MarketplaceService, SubscriptionService, ChatbotService, AnalyticsService],
  exports: [ForumService, MarketplaceService, SubscriptionService, ChatbotService, AnalyticsService],
})
export class CommunityModule {}
