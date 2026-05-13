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
    ProductModule,
    PricingModule,
    MatchingModule,
    QualityModule,
    ContractorModule,
  ],
  controllers: [HealthController],
})
export class AppModule {}
