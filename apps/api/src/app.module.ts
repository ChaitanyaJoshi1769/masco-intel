import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ProductModule } from './modules/product/product.module';
import { PricingModule } from './modules/pricing/pricing.module';
import { MatchingModule } from './modules/matching/matching.module';
import { QualityModule } from './modules/quality/quality.module';
import { ContractorModule } from './modules/contractor/contractor.module';
import { AuthModule } from './modules/auth/auth.module';
import { SavedProductsModule } from './modules/saved-products/saved-products.module';
import { PriceAlertsModule } from './modules/price-alerts/price-alerts.module';
import { RecommendationsModule } from './modules/recommendations/recommendations.module';
import { ComparisonModule } from './modules/comparison/comparison.module';
import { MarketIntelligenceModule } from './modules/market-intelligence/market-intelligence.module';
import { ContractorAnalyticsModule } from './modules/contractor-analytics/contractor-analytics.module';
import { ReportsModule } from './modules/reports/reports.module';
import { PricePredictionModule } from './modules/price-prediction/price-prediction.module';
import { DashboardModule } from './modules/dashboard/dashboard.module';
import { BulkOperationsModule } from './modules/bulk-operations/bulk-operations.module';
import { SearchModule } from './modules/search/search.module';
import { NotificationsModule } from './modules/notifications/notifications.module';
import { RetailersModule } from './modules/retailers/retailers.module';
import { RealtimeModule } from './modules/realtime/realtime.module';
import { ContentModule } from './modules/content/content.module';
import { PriceOptimizationModule } from './modules/price-optimization/price-optimization.module';
import { IntegrationsModule } from './modules/integrations/integrations.module';
import { CommunityModule } from './modules/community/community.module';
import { HealthController } from './health.controller';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env.local', '.env'],
    }),
    AuthModule,
    SavedProductsModule,
    PriceAlertsModule,
    RecommendationsModule,
    ComparisonModule,
    MarketIntelligenceModule,
    ContractorAnalyticsModule,
    ReportsModule,
    PricePredictionModule,
    DashboardModule,
    BulkOperationsModule,
    SearchModule,
    NotificationsModule,
    RetailersModule,
    RealtimeModule,
    ContentModule,
    PriceOptimizationModule,
    IntegrationsModule,
    CommunityModule,
    ProductModule,
    PricingModule,
    MatchingModule,
    QualityModule,
    ContractorModule,
  ],
  controllers: [HealthController],
})
export class AppModule {}
