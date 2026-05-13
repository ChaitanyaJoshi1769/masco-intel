import { Module } from '@nestjs/common';
import { IntegrationsService } from './integrations.service';
import { IntegrationsController } from './integrations.controller';
import { ApiKeyService } from './api-key.service';
import { ApiKeyController } from './api-key.controller';

@Module({
  controllers: [IntegrationsController, ApiKeyController],
  providers: [IntegrationsService, ApiKeyService],
  exports: [IntegrationsService, ApiKeyService],
})
export class IntegrationsModule {}
