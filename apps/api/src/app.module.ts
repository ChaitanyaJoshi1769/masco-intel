import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ProductModule } from './modules/product/product.module';
import { PricingModule } from './modules/pricing/pricing.module';
import { MatchingModule } from './modules/matching/matching.module';
import { QualityModule } from './modules/quality/quality.module';
import { ContractorModule } from './modules/contractor/contractor.module';
import { HealthController } from './health.controller';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env.local', '.env'],
    }),
    ProductModule,
    PricingModule,
    MatchingModule,
    QualityModule,
    ContractorModule,
  ],
  controllers: [HealthController],
})
export class AppModule {}
