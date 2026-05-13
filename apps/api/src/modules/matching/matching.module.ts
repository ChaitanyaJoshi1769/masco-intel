import { Module } from '@nestjs/common';
import { MatchingService } from './matching.service';
import { MatchingController } from './matching.controller';
import { EmbeddingService } from './embedding.service';
import { SemanticMatcherService } from './semantic-matcher.service';
import { ImageMatcherService } from './image-matcher.service';

@Module({
  controllers: [MatchingController],
  providers: [EmbeddingService, SemanticMatcherService, ImageMatcherService, MatchingService],
  exports: [MatchingService],
})
export class MatchingModule {}
