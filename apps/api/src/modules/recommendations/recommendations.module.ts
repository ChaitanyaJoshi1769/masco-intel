import { Module } from '@nestjs/common';
import { RecommendationsService } from './recommendations.service';
import { RecommendationsController } from './recommendations.controller';
import { AdvancedRecommendationsService } from './advanced-recommendations.service';
import { AdvancedRecommendationsController } from './advanced-recommendations.controller';
import { DbModule } from '@masco/db';

@Module({
  imports: [DbModule],
  controllers: [RecommendationsController, AdvancedRecommendationsController],
  providers: [RecommendationsService, AdvancedRecommendationsService],
  exports: [RecommendationsService, AdvancedRecommendationsService],
})
export class RecommendationsModule {}
