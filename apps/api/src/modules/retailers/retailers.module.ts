import { Module } from '@nestjs/common';
import { MenardsScraperService } from './menards-scraper.service';
import { AceHardwareScraperService } from './ace-hardware-scraper.service';
import { GrangerScraperService } from './grainger-scraper.service';
import { RetailersController } from './retailers.controller';

@Module({
  controllers: [RetailersController],
  providers: [MenardsScraperService, AceHardwareScraperService, GrangerScraperService],
  exports: [MenardsScraperService, AceHardwareScraperService, GrangerScraperService],
})
export class RetailersModule {}
