import { Module } from '@nestjs/common';
import { ContractorAnalyticsService } from './contractor-analytics.service';
import { ContractorAnalyticsController } from './contractor-analytics.controller';

@Module({
  controllers: [ContractorAnalyticsController],
  providers: [ContractorAnalyticsService],
  exports: [ContractorAnalyticsService],
})
export class ContractorAnalyticsModule {}
