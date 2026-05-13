import { Controller, Get, Post, Param, Body, Query } from '@nestjs/common';
import { DataSyncService } from './data-sync.service';

@Controller('data-sync')
export class DataSyncController {
  constructor(private readonly service: DataSyncService) {}

  /**
   * Start a new sync operation
   * POST /data-sync/operations
   */
  @Post('operations')
  async startSyncOperation(
    @Body()
    body: {
      integrationId: string;
      operationType: 'push' | 'pull' | 'bidirectional';
    }
  ) {
    const operation = await this.service.startSyncOperation(
      body.integrationId,
      body.operationType
    );

    return {
      success: true,
      data: operation,
      message: `Sync operation started: ${body.operationType}`,
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * Complete a sync operation
   * POST /data-sync/operations/:operationId/complete
   */
  @Post('operations/:operationId/complete')
  async completeSyncOperation(
    @Param('operationId') operationId: string,
    @Body()
    body: {
      itemsSynced: number;
      itemsFailed: number;
      itemsSkipped?: number;
      metadata?: Record<string, any>;
    }
  ) {
    const operation = await this.service.completeSyncOperation(
      operationId,
      body.itemsSynced,
      body.itemsFailed,
      body.itemsSkipped || 0,
      body.metadata
    );

    return {
      success: true,
      data: operation,
      message: 'Sync operation completed',
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * Fail a sync operation
   * POST /data-sync/operations/:operationId/fail
   */
  @Post('operations/:operationId/fail')
  async failSyncOperation(
    @Param('operationId') operationId: string,
    @Body() body: { errorMessage: string }
  ) {
    const operation = await this.service.failSyncOperation(
      operationId,
      body.errorMessage
    );

    return {
      success: true,
      data: operation,
      message: 'Sync operation marked as failed',
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * Get sync operation status
   * GET /data-sync/operations/:operationId
   */
  @Get('operations/:operationId')
  async getSyncOperation(@Param('operationId') operationId: string) {
    const operation = await this.service.getSyncOperation(operationId);

    if (!operation) {
      return {
        success: false,
        error: 'Sync operation not found',
        timestamp: new Date().toISOString(),
      };
    }

    return {
      success: true,
      data: operation,
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * Get all active sync operations
   * GET /data-sync/operations
   */
  @Get('operations')
  async getActiveSyncOperations() {
    const operations = await this.service.getActiveSyncOperations();

    return {
      success: true,
      data: operations,
      count: operations.length,
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * Get sync status for integration
   * GET /data-sync/status/:integrationId
   */
  @Get('status/:integrationId')
  async getSyncStatus(@Param('integrationId') integrationId: string) {
    const status = await this.service.getSyncStatus(integrationId);

    if (!status) {
      return {
        success: false,
        error: 'Sync status not found',
        timestamp: new Date().toISOString(),
      };
    }

    return {
      success: true,
      data: status,
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * Record sync conflict
   * POST /data-sync/conflicts
   */
  @Post('conflicts')
  async recordSyncConflict(
    @Body()
    body: {
      integrationId: string;
      itemId: string;
      itemType: 'product' | 'order' | 'inventory';
      localVersion: any;
      remoteVersion: any;
      lastModifiedLocal: string;
      lastModifiedRemote: string;
    }
  ) {
    const conflict = await this.service.recordSyncConflict(
      body.integrationId,
      body.itemId,
      body.itemType,
      body.localVersion,
      body.remoteVersion,
      new Date(body.lastModifiedLocal),
      new Date(body.lastModifiedRemote)
    );

    return {
      success: true,
      data: conflict,
      message: 'Sync conflict recorded',
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * Get sync conflicts for integration
   * GET /data-sync/conflicts?integrationId=shopify-demo
   */
  @Get('conflicts')
  async getSyncConflicts(@Query('integrationId') integrationId: string) {
    const conflicts = await this.service.getSyncConflicts(integrationId);

    return {
      success: true,
      data: conflicts,
      count: conflicts.length,
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * Resolve sync conflict
   * POST /data-sync/conflicts/:conflictId/resolve
   */
  @Post('conflicts/:conflictId/resolve')
  async resolveSyncConflict(
    @Param('conflictId') conflictId: string,
    @Body() body: { resolutionStrategy: 'local' | 'remote' | 'merge' | 'manual' }
  ) {
    const conflict = await this.service.resolveSyncConflict(
      conflictId,
      body.resolutionStrategy
    );

    if (!conflict) {
      return {
        success: false,
        error: 'Conflict not found',
        timestamp: new Date().toISOString(),
      };
    }

    return {
      success: true,
      data: conflict,
      message: `Conflict resolved with strategy: ${body.resolutionStrategy}`,
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * Get field mappings for provider
   * GET /data-sync/mappings/:provider
   */
  @Get('mappings/:provider')
  async getFieldMappings(@Param('provider') provider: string) {
    const mappings = this.service.getFieldMappings(provider);

    if (!mappings) {
      return {
        success: false,
        error: `No mappings found for provider: ${provider}`,
        timestamp: new Date().toISOString(),
      };
    }

    return {
      success: true,
      data: {
        provider,
        mappings: Array.from(mappings.entries()).map(([key, mapping]) => ({
          key,
          ...mapping,
        })),
      },
      count: mappings.size,
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * Transform data for push to provider
   * POST /data-sync/transform/push
   */
  @Post('transform/push')
  async transformDataForPush(
    @Body()
    body: {
      provider: string;
      localData: Record<string, any>;
    }
  ) {
    const remoteData = this.service.transformDataForPush(
      body.provider,
      body.localData
    );

    return {
      success: true,
      data: {
        provider: body.provider,
        localData: body.localData,
        remoteData,
      },
      message: 'Data transformed for push',
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * Transform data from provider
   * POST /data-sync/transform/pull
   */
  @Post('transform/pull')
  async transformDataFromProvider(
    @Body()
    body: {
      provider: string;
      remoteData: Record<string, any>;
    }
  ) {
    const localData = this.service.transformDataFromProvider(
      body.provider,
      body.remoteData
    );

    return {
      success: true,
      data: {
        provider: body.provider,
        remoteData: body.remoteData,
        localData,
      },
      message: 'Data transformed from pull',
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * Schedule next sync
   * POST /data-sync/schedule/:integrationId
   */
  @Post('schedule/:integrationId')
  async scheduleNextSync(
    @Param('integrationId') integrationId: string,
    @Body() body: { delayMinutes?: number }
  ) {
    await this.service.scheduleNextSync(
      integrationId,
      body.delayMinutes || 60
    );

    return {
      success: true,
      data: { integrationId, delayMinutes: body.delayMinutes || 60 },
      message: 'Next sync scheduled',
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * Get data sync statistics
   * GET /data-sync/stats
   */
  @Get('stats')
  async getStatistics() {
    const stats = await this.service.getStatistics();

    return {
      success: true,
      data: stats,
      message: 'Data synchronization statistics',
      timestamp: new Date().toISOString(),
    };
  }
}
