import { Module } from '@nestjs/common';
import { IntegrationsService } from './integrations.service';
import { IntegrationsController } from './integrations.controller';
import { ApiKeyService } from './api-key.service';
import { ApiKeyController } from './api-key.controller';
import { OAuthService } from './oauth.service';
import { OAuthController } from './oauth.controller';
import { WebhookSignatureService } from './webhook-signature.service';
import { WebhookSignatureController } from './webhook-signature.controller';

@Module({
  controllers: [
    IntegrationsController,
    ApiKeyController,
    OAuthController,
    WebhookSignatureController,
  ],
  providers: [
    IntegrationsService,
    ApiKeyService,
    OAuthService,
    WebhookSignatureService,
  ],
  exports: [
    IntegrationsService,
    ApiKeyService,
    OAuthService,
    WebhookSignatureService,
  ],
})
export class IntegrationsModule {}
