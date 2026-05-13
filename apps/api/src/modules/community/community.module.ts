import { Module } from '@nestjs/common';
import { ForumService } from './forum.service';
import { ForumController } from './forum.controller';
import { MarketplaceService } from './marketplace.service';
import { MarketplaceController } from './marketplace.controller';

@Module({
  controllers: [ForumController, MarketplaceController],
  providers: [ForumService, MarketplaceService],
  exports: [ForumService, MarketplaceService],
})
export class CommunityModule {}
