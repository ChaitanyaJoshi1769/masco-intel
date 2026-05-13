import { Module } from '@nestjs/common';
import { IntegrationsService } from './integrations.service';
import { IntegrationsController } from './integrations.controller';
import { ApiKeyService } from './api-key.service';
import { ApiKeyController } from './api-key.controller';
import { OAuthService } from './oauth.service';
import { OAuthController } from './oauth.controller';
import { WebhookSignatureService } from './webhook-signature.service';
import { WebhookSignatureController } from './webhook-signature.controller';
import { DataSyncService } from './data-sync.service';
import { DataSyncController } from './data-sync.controller';
import { PermissionService } from './permission.service';
import { PermissionController } from './permission.controller';
import { AuditService } from './audit.service';
import { AuditController } from './audit.controller';

@Module({
  controllers: [
    IntegrationsController,
    ApiKeyController,
    OAuthController,
    WebhookSignatureController,
    DataSyncController,
    PermissionController,
    AuditController,
  ],
  providers: [
    IntegrationsService,
    ApiKeyService,
    OAuthService,
    WebhookSignatureService,
    DataSyncService,
    PermissionService,
    AuditService,
  ],
  exports: [
    IntegrationsService,
    ApiKeyService,
    OAuthService,
    WebhookSignatureService,
    DataSyncService,
    PermissionService,
    AuditService,
  ],
})
export class IntegrationsModule {}
