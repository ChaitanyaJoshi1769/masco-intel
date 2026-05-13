import { Module } from '@nestjs/common';
import { DashboardService } from './dashboard.service';
import { AdvancedDashboardService } from './advanced-dashboard.service';
import { DashboardController } from './dashboard.controller';

@Module({
  controllers: [DashboardController],
  providers: [DashboardService, AdvancedDashboardService],
  exports: [DashboardService, AdvancedDashboardService],
})
export class DashboardModule {}
