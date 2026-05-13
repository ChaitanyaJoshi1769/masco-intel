import { Module } from '@nestjs/common';
import { VideoContentService } from './video-content.service';
import { VideoContentController } from './video-content.controller';

@Module({
  controllers: [VideoContentController],
  providers: [VideoContentService],
  exports: [VideoContentService],
})
export class ContentModule {}
