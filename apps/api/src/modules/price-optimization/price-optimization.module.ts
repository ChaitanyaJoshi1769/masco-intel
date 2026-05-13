import { Module } from '@nestjs/common';
import { PriceOptimizationService } from './price-optimization.service';
import { PriceOptimizationController } from './price-optimization.controller';

@Module({
  controllers: [PriceOptimizationController],
  providers: [PriceOptimizationService],
  exports: [PriceOptimizationService],
})
export class PriceOptimizationModule {}
