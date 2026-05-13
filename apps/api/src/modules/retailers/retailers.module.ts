import { Module } from '@nestjs/common';
import { MenardsScraperService } from './menards-scraper.service';
import { AceHardwareScraperService } from './ace-hardware-scraper.service';
import { RetailersController } from './retailers.controller';

@Module({
  controllers: [RetailersController],
  providers: [MenardsScraperService, AceHardwareScraperService],
  exports: [MenardsScraperService, AceHardwareScraperService],
})
export class RetailersModule {}
