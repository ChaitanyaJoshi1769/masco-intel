import { Module } from '@nestjs/common';
import { IntegrationsService } from './integrations.service';
import { IntegrationsController } from './integrations.controller';
import { ApiKeyService } from './api-key.service';
import { ApiKeyController } from './api-key.controller';
import { OAuthService } from './oauth.service';
import { OAuthController } from './oauth.controller';

@Module({
  controllers: [IntegrationsController, ApiKeyController, OAuthController],
  providers: [IntegrationsService, ApiKeyService, OAuthService],
  exports: [IntegrationsService, ApiKeyService, OAuthService],
})
export class IntegrationsModule {}
