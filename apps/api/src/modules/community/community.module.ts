import { Module } from '@nestjs/common';
import { ForumService } from './forum.service';
import { ForumController } from './forum.controller';
import { MarketplaceService } from './marketplace.service';
import { MarketplaceController } from './marketplace.controller';
import { SubscriptionService } from './subscription.service';
import { SubscriptionController } from './subscription.controller';

@Module({
  controllers: [ForumController, MarketplaceController, SubscriptionController],
  providers: [ForumService, MarketplaceService, SubscriptionService],
  exports: [ForumService, MarketplaceService, SubscriptionService],
})
export class CommunityModule {}
