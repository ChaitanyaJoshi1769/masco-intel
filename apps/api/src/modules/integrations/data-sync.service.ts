import { Injectable, Logger } from '@nestjs/common';

export interface SyncOperation {
  id: string;
  integrationId: string;
  operationType: 'push' | 'pull' | 'bidirectional';
  status: 'pending' | 'in_progress' | 'completed' | 'failed';
  startedAt: Date;
  completedAt?: Date;
  itemsSynced: number;
  itemsFailed: number;
  itemsSkipped: number;
  errorMessage?: string;
  metadata?: Record<string, any>;
}

export interface SyncConflict {
  id: string;
  integrationId: string;
  itemId: string;
  itemType: 'product' | 'order' | 'inventory';
  localVersion: any;
  remoteVersion: any;
  lastModifiedLocal: Date;
  lastModifiedRemote: Date;
  resolutionStrategy: 'local' | 'remote' | 'merge' | 'manual';
}

export interface SyncStatus {
  integrationId: string;
  lastSyncAt?: Date;
  nextSyncScheduled?: Date;
  totalItemsSynced: number;
  totalItemsFailed: number;
  lastOperationId?: string;
  lastOperationStatus: 'success' | 'failed' | 'pending';
}

export interface SyncMapping {
  localField: string;
  remoteField: string;
  transformer?: (value: any, direction: 'push' | 'pull') => any;
  bidirectional: boolean;
}

@Injectable()
export class DataSyncService {
  private readonly logger = new Logger(DataSyncService.name);

  // Store active sync operations
  private activeSyncOperations: Map<string, SyncOperation> = new Map();

  // Store sync conflicts
  private syncConflicts: Map<string, SyncConflict> = new Map();

  // Store sync status per integration
  private syncStatus: Map<string, SyncStatus> = new Map();

  // Store field mappings per provider
  private fieldMappings: Map<string, Map<string, SyncMapping>> = new Map([
    [
      'shopify',
      new Map([
        [
          'productTitle',
          {
            localField: 'name',
            remoteField: 'title',
            bidirectional: true,
          },
        ],
        [
          'productDescription',
          {
            localField: 'description',
            remoteField: 'body_html',
            bidirectional: true,
          },
        ],
        [
          'productPrice',
          {
            localField: 'price',
            remoteField: 'variants[0].price',
            bidirectional: true,
          },
        ],
        [
          'productSKU',
          {
            localField: 'sku',
            remoteField: 'variants[0].sku',
            bidirectional: true,
          },
        ],
        [
          'productImage',
          {
            localField: 'imageUrl',
            remoteField: 'images[0].src',
            bidirectional: true,
          },
        ],
      ]),
    ],
    [
      'woocommerce',
      new Map([
        [
          'productTitle',
          {
            localField: 'name',
            remoteField: 'name',
            bidirectional: true,
          },
        ],
        [
          'productDescription',
          {
            localField: 'description',
            remoteField: 'description',
            bidirectional: true,
          },
        ],
        [
          'productPrice',
          {
            localField: 'price',
            remoteField: 'price',
            bidirectional: true,
          },
        ],
        [
          'productSKU',
          {
            localField: 'sku',
            remoteField: 'sku',
            bidirectional: true,
          },
        ],
      ]),
    ],
    [
      'bigcommerce',
      new Map([
        [
          'productTitle',
          {
            localField: 'name',
            remoteField: 'name',
            bidirectional: true,
          },
        ],
        [
          'productDescription',
          {
            localField: 'description',
            remoteField: 'description',
            bidirectional: true,
          },
        ],
        [
          'productPrice',
          {
            localField: 'price',
            remoteField: 'price',
            bidirectional: true,
          },
        ],
      ]),
    ],
  ]);

  constructor() {
    // Initialize empty sync status maps
    this.initializeSyncStatus();
  }

  /**
   * Initialize sync status for known integrations
   */
  private initializeSyncStatus(): void {
    const integrations = ['shopify-demo', 'woocommerce-demo', 'bigcommerce-demo'];
    for (const integrationId of integrations) {
      this.syncStatus.set(integrationId, {
        integrationId,
        totalItemsSynced: 0,
        totalItemsFailed: 0,
        lastOperationStatus: 'pending',
      });
    }
  }

  /**
   * Start a new sync operation
   */
  async startSyncOperation(
    integrationId: string,
    operationType: 'push' | 'pull' | 'bidirectional'
  ): Promise<SyncOperation> {
    try {
      const operationId = `sync_${integrationId}_${Date.now()}`;

      const operation: SyncOperation = {
        id: operationId,
        integrationId,
        operationType,
        status: 'in_progress',
        startedAt: new Date(),
        itemsSynced: 0,
        itemsFailed: 0,
        itemsSkipped: 0,
      };

      this.activeSyncOperations.set(operationId, operation);
      this.logger.log(
        `Sync operation started: ${operationId} (${operationType})`
      );

      return operation;
    } catch (error) {
      this.logger.error(`Failed to start sync operation: ${error}`);
      throw error;
    }
  }

  /**
   * Complete a sync operation
   */
  async completeSyncOperation(
    operationId: string,
    itemsSynced: number,
    itemsFailed: number,
    itemsSkipped: number = 0,
    metadata?: Record<string, any>
  ): Promise<SyncOperation> {
    try {
      const operation = this.activeSyncOperations.get(operationId);
      if (!operation) {
        throw new Error(`Sync operation not found: ${operationId}`);
      }

      operation.status = itemsFailed > 0 ? 'completed' : 'completed';
      operation.completedAt = new Date();
      operation.itemsSynced = itemsSynced;
      operation.itemsFailed = itemsFailed;
      operation.itemsSkipped = itemsSkipped;
      operation.metadata = metadata;

      this.activeSyncOperations.set(operationId, operation);

      // Update sync status
      const status = this.syncStatus.get(operation.integrationId);
      if (status) {
        status.lastSyncAt = new Date();
        status.totalItemsSynced += itemsSynced;
        status.totalItemsFailed += itemsFailed;
        status.lastOperationId = operationId;
        status.lastOperationStatus = itemsFailed === 0 ? 'success' : 'failed';
        this.syncStatus.set(operation.integrationId, status);
      }

      this.logger.log(
        `Sync operation completed: ${operationId} (synced: ${itemsSynced}, failed: ${itemsFailed})`
      );

      return operation;
    } catch (error) {
      this.logger.error(`Failed to complete sync operation: ${error}`);
      throw error;
    }
  }

  /**
   * Fail a sync operation
   */
  async failSyncOperation(
    operationId: string,
    errorMessage: string
  ): Promise<SyncOperation> {
    try {
      const operation = this.activeSyncOperations.get(operationId);
      if (!operation) {
        throw new Error(`Sync operation not found: ${operationId}`);
      }

      operation.status = 'failed';
      operation.completedAt = new Date();
      operation.errorMessage = errorMessage;

      this.activeSyncOperations.set(operationId, operation);

      // Update sync status
      const status = this.syncStatus.get(operation.integrationId);
      if (status) {
        status.lastOperationId = operationId;
        status.lastOperationStatus = 'failed';
        this.syncStatus.set(operation.integrationId, status);
      }

      this.logger.error(`Sync operation failed: ${operationId} - ${errorMessage}`);

      return operation;
    } catch (error) {
      this.logger.error(`Failed to fail sync operation: ${error}`);
      throw error;
    }
  }

  /**
   * Get sync operation status
   */
  async getSyncOperation(operationId: string): Promise<SyncOperation | null> {
    return this.activeSyncOperations.get(operationId) || null;
  }

  /**
   * Get all active sync operations
   */
  async getActiveSyncOperations(): Promise<SyncOperation[]> {
    return Array.from(this.activeSyncOperations.values()).filter(
      (op) => op.status === 'in_progress'
    );
  }

  /**
   * Get sync status for integration
   */
  async getSyncStatus(integrationId: string): Promise<SyncStatus | null> {
    return this.syncStatus.get(integrationId) || null;
  }

  /**
   * Record sync conflict
   */
  async recordSyncConflict(
    integrationId: string,
    itemId: string,
    itemType: 'product' | 'order' | 'inventory',
    localVersion: any,
    remoteVersion: any,
    lastModifiedLocal: Date,
    lastModifiedRemote: Date
  ): Promise<SyncConflict> {
    try {
      const conflictId = `conflict_${integrationId}_${itemId}_${Date.now()}`;

      const conflict: SyncConflict = {
        id: conflictId,
        integrationId,
        itemId,
        itemType,
        localVersion,
        remoteVersion,
        lastModifiedLocal,
        lastModifiedRemote,
        resolutionStrategy: 'manual',
      };

      this.syncConflicts.set(conflictId, conflict);
      this.logger.warn(
        `Sync conflict recorded: ${conflictId} (${itemType}: ${itemId})`
      );

      return conflict;
    } catch (error) {
      this.logger.error(`Failed to record sync conflict: ${error}`);
      throw error;
    }
  }

  /**
   * Get sync conflicts for integration
   */
  async getSyncConflicts(integrationId: string): Promise<SyncConflict[]> {
    return Array.from(this.syncConflicts.values()).filter(
      (c) => c.integrationId === integrationId
    );
  }

  /**
   * Resolve sync conflict
   */
  async resolveSyncConflict(
    conflictId: string,
    resolutionStrategy: 'local' | 'remote' | 'merge' | 'manual'
  ): Promise<SyncConflict | null> {
    try {
      const conflict = this.syncConflicts.get(conflictId);
      if (!conflict) return null;

      conflict.resolutionStrategy = resolutionStrategy;
      this.syncConflicts.set(conflictId, conflict);

      this.logger.log(
        `Sync conflict resolved: ${conflictId} (strategy: ${resolutionStrategy})`
      );

      return conflict;
    } catch (error) {
      this.logger.error(`Failed to resolve sync conflict: ${error}`);
      throw error;
    }
  }

  /**
   * Get field mappings for provider
   */
  getFieldMappings(provider: string): Map<string, SyncMapping> | undefined {
    return this.fieldMappings.get(provider);
  }

  /**
   * Transform data for push to provider
   */
  transformDataForPush(
    provider: string,
    localData: Record<string, any>
  ): Record<string, any> {
    try {
      const mappings = this.fieldMappings.get(provider);
      if (!mappings) return localData;

      const remoteData: Record<string, any> = {};

      for (const [key, mapping] of mappings) {
        if (localData.hasOwnProperty(mapping.localField)) {
          let value = localData[mapping.localField];

          if (mapping.transformer) {
            value = mapping.transformer(value, 'push');
          }

          remoteData[mapping.remoteField] = value;
        }
      }

      return remoteData;
    } catch (error) {
      this.logger.error(
        `Failed to transform data for push to ${provider}: ${error}`
      );
      throw error;
    }
  }

  /**
   * Transform data from provider
   */
  transformDataFromProvider(
    provider: string,
    remoteData: Record<string, any>
  ): Record<string, any> {
    try {
      const mappings = this.fieldMappings.get(provider);
      if (!mappings) return remoteData;

      const localData: Record<string, any> = {};

      for (const [key, mapping] of mappings) {
        if (remoteData.hasOwnProperty(mapping.remoteField)) {
          let value = remoteData[mapping.remoteField];

          if (mapping.transformer) {
            value = mapping.transformer(value, 'pull');
          }

          localData[mapping.localField] = value;
        }
      }

      return localData;
    } catch (error) {
      this.logger.error(
        `Failed to transform data from ${provider}: ${error}`
      );
      throw error;
    }
  }

  /**
   * Schedule next sync
   */
  async scheduleNextSync(
    integrationId: string,
    delayMinutes: number = 60
  ): Promise<void> {
    try {
      const status = this.syncStatus.get(integrationId);
      if (status) {
        status.nextSyncScheduled = new Date(
          Date.now() + delayMinutes * 60 * 1000
        );
        this.syncStatus.set(integrationId, status);
      }

      this.logger.log(
        `Next sync scheduled for ${integrationId} in ${delayMinutes} minutes`
      );
    } catch (error) {
      this.logger.error(`Failed to schedule next sync: ${error}`);
      throw error;
    }
  }

  /**
   * Get data sync statistics
   */
  async getStatistics(): Promise<{
    totalOperations: number;
    activeOperations: number;
    completedOperations: number;
    totalItemsSynced: number;
    totalItemsFailed: number;
    totalConflicts: number;
    avgSyncDurationMs: number;
  }> {
    try {
      const operations = Array.from(this.activeSyncOperations.values());
      const completedOps = operations.filter((op) => op.status === 'completed');
      const activeOps = operations.filter((op) => op.status === 'in_progress');

      const avgDuration =
        completedOps.length > 0
          ? completedOps.reduce((sum, op) => {
              const duration =
                (op.completedAt!.getTime() - op.startedAt.getTime()) / 1000;
              return sum + duration;
            }, 0) / completedOps.length
          : 0;

      return {
        totalOperations: operations.length,
        activeOperations: activeOps.length,
        completedOperations: completedOps.length,
        totalItemsSynced: Array.from(this.syncStatus.values()).reduce(
          (sum, s) => sum + s.totalItemsSynced,
          0
        ),
        totalItemsFailed: Array.from(this.syncStatus.values()).reduce(
          (sum, s) => sum + s.totalItemsFailed,
          0
        ),
        totalConflicts: this.syncConflicts.size,
        avgSyncDurationMs: Math.round(avgDuration * 1000),
      };
    } catch (error) {
      this.logger.error(`Failed to get sync statistics: ${error}`);
      throw error;
    }
  }
}
