import { Injectable, Logger } from '@nestjs/common';
import * as crypto from 'crypto';

export interface ApiKey {
  id: string;
  name: string;
  key: string;
  maskedKey: string;
  integrationId: string;
  scopes: string[];
  lastUsed?: Date;
  createdAt: Date;
  expiresAt?: Date;
  isActive: boolean;
  rateLimit?: {
    requestsPerMinute: number;
    requestsPerHour: number;
  };
}

export interface ApiKeyUsage {
  keyId: string;
  timestamp: Date;
  endpoint: string;
  statusCode: number;
  responseTime: number;
}

@Injectable()
export class ApiKeyService {
  private readonly logger = new Logger(ApiKeyService.name);
  private apiKeys: Map<string, ApiKey> = new Map();
  private apiKeyUsage: ApiKeyUsage[] = [];

  constructor() {
    this.initializeSampleKeys();
  }

  /**
   * Initialize sample API keys
   */
  private initializeSampleKeys(): void {
    const sampleKeys: ApiKey[] = [
      {
        id: 'key_demo_shopify_001',
        name: 'Shopify Integration Key',
        key: this.generateKey('shopify'),
        maskedKey: 'shopify_1234...****',
        integrationId: 'shopify-demo',
        scopes: ['products:read', 'products:write', 'inventory:read'],
        createdAt: new Date(),
        isActive: true,
        rateLimit: {
          requestsPerMinute: 60,
          requestsPerHour: 2000,
        },
      },
      {
        id: 'key_demo_woocommerce_001',
        name: 'WooCommerce Integration Key',
        key: this.generateKey('woocommerce'),
        maskedKey: 'woocom_5678...****',
        integrationId: 'woocommerce-demo',
        scopes: ['products:read', 'products:write', 'orders:read'],
        createdAt: new Date(),
        isActive: true,
        rateLimit: {
          requestsPerMinute: 30,
          requestsPerHour: 1000,
        },
      },
    ];

    for (const key of sampleKeys) {
      this.apiKeys.set(key.id, key);
    }
  }

  /**
   * Generate a new API key
   */
  private generateKey(prefix: string): string {
    const timestamp = Date.now().toString(36);
    const random = crypto.randomBytes(32).toString('hex');
    return `${prefix}_${timestamp}_${random}`;
  }

  /**
   * Create new API key
   */
  async createApiKey(
    name: string,
    integrationId: string,
    scopes: string[],
    expiresAt?: Date,
    rateLimit?: { requestsPerMinute: number; requestsPerHour: number }
  ): Promise<ApiKey> {
    try {
      const key = this.generateKey('api');
      const id = `key_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`;

      const apiKey: ApiKey = {
        id,
        name,
        key,
        maskedKey: this.maskKey(key),
        integrationId,
        scopes,
        createdAt: new Date(),
        expiresAt,
        isActive: true,
        rateLimit,
      };

      this.apiKeys.set(id, apiKey);
      this.logger.log(`API key created: ${id} for integration ${integrationId}`);

      return { ...apiKey, key }; // Return full key only on creation
    } catch (error) {
      this.logger.error(`Failed to create API key: ${error}`);
      throw error;
    }
  }

  /**
   * Get all API keys for an integration
   */
  async getIntegrationKeys(integrationId: string): Promise<ApiKey[]> {
    try {
      return Array.from(this.apiKeys.values()).filter(
        (k) => k.integrationId === integrationId
      );
    } catch (error) {
      this.logger.error(`Failed to get integration keys: ${error}`);
      throw error;
    }
  }

  /**
   * Get API key by ID (masked)
   */
  async getApiKey(id: string): Promise<ApiKey | null> {
    try {
      const key = this.apiKeys.get(id);
      if (!key) return null;

      // Return masked key for security
      return { ...key, key: key.maskedKey };
    } catch (error) {
      this.logger.error(`Failed to get API key ${id}: ${error}`);
      throw error;
    }
  }

  /**
   * Validate API key
   */
  async validateApiKey(key: string): Promise<ApiKey | null> {
    try {
      for (const apiKey of this.apiKeys.values()) {
        if (apiKey.key === key && apiKey.isActive) {
          // Check expiration
          if (apiKey.expiresAt && apiKey.expiresAt < new Date()) {
            return null; // Key expired
          }

          // Update last used
          apiKey.lastUsed = new Date();
          this.apiKeys.set(apiKey.id, apiKey);

          return apiKey;
        }
      }
      return null;
    } catch (error) {
      this.logger.error(`Failed to validate API key: ${error}`);
      throw error;
    }
  }

  /**
   * Revoke API key
   */
  async revokeApiKey(id: string): Promise<boolean> {
    try {
      const apiKey = this.apiKeys.get(id);
      if (!apiKey) return false;

      apiKey.isActive = false;
      this.apiKeys.set(id, apiKey);
      this.logger.log(`API key revoked: ${id}`);
      return true;
    } catch (error) {
      this.logger.error(`Failed to revoke API key ${id}: ${error}`);
      throw error;
    }
  }

  /**
   * Rotate API key (create new, deactivate old)
   */
  async rotateApiKey(id: string): Promise<{ oldKey: ApiKey; newKey: ApiKey } | null> {
    try {
      const oldKey = this.apiKeys.get(id);
      if (!oldKey) return null;

      // Create new key with same settings
      const newKey = await this.createApiKey(
        `${oldKey.name} (rotated)`,
        oldKey.integrationId,
        oldKey.scopes,
        oldKey.expiresAt,
        oldKey.rateLimit
      );

      // Revoke old key
      oldKey.isActive = false;
      this.apiKeys.set(id, oldKey);

      this.logger.log(`API key rotated: ${id} -> ${newKey.id}`);
      return { oldKey, newKey };
    } catch (error) {
      this.logger.error(`Failed to rotate API key ${id}: ${error}`);
      throw error;
    }
  }

  /**
   * Record API key usage
   */
  async recordUsage(
    keyId: string,
    endpoint: string,
    statusCode: number,
    responseTime: number
  ): Promise<void> {
    try {
      const usage: ApiKeyUsage = {
        keyId,
        timestamp: new Date(),
        endpoint,
        statusCode,
        responseTime,
      };

      this.apiKeyUsage.push(usage);

      // Keep last 10,000 usage records
      if (this.apiKeyUsage.length > 10000) {
        this.apiKeyUsage = this.apiKeyUsage.slice(-10000);
      }
    } catch (error) {
      this.logger.error(`Failed to record API key usage: ${error}`);
    }
  }

  /**
   * Get API key usage statistics
   */
  async getUsageStats(keyId: string, hours: number = 24): Promise<{
    totalRequests: number;
    successfulRequests: number;
    failedRequests: number;
    averageResponseTime: number;
    lastUsed: Date | null;
  }> {
    try {
      const cutoffTime = new Date(Date.now() - hours * 60 * 60 * 1000);
      const usage = this.apiKeyUsage.filter(
        (u) => u.keyId === keyId && u.timestamp >= cutoffTime
      );

      const totalRequests = usage.length;
      const successfulRequests = usage.filter(
        (u) => u.statusCode >= 200 && u.statusCode < 300
      ).length;
      const failedRequests = usage.filter((u) => u.statusCode >= 400).length;
      const averageResponseTime =
        usage.length > 0
          ? usage.reduce((sum, u) => sum + u.responseTime, 0) / usage.length
          : 0;

      const sortedUsage = usage.sort(
        (a, b) => b.timestamp.getTime() - a.timestamp.getTime()
      );
      const lastUsed = sortedUsage.length > 0 ? sortedUsage[0].timestamp : null;

      return {
        totalRequests,
        successfulRequests,
        failedRequests,
        averageResponseTime: Math.round(averageResponseTime * 100) / 100,
        lastUsed,
      };
    } catch (error) {
      this.logger.error(`Failed to get usage stats: ${error}`);
      throw error;
    }
  }

  /**
   * Check rate limit
   */
  async checkRateLimit(
    keyId: string,
    timeWindow: 'minute' | 'hour'
  ): Promise<{ allowed: boolean; remaining: number; limit: number }> {
    try {
      const apiKey = this.apiKeys.get(keyId);
      if (!apiKey || !apiKey.rateLimit) {
        return { allowed: true, remaining: -1, limit: -1 };
      }

      const limit =
        timeWindow === 'minute'
          ? apiKey.rateLimit.requestsPerMinute
          : apiKey.rateLimit.requestsPerHour;

      const cutoffTime =
        timeWindow === 'minute'
          ? new Date(Date.now() - 60 * 1000)
          : new Date(Date.now() - 60 * 60 * 1000);

      const recentRequests = this.apiKeyUsage.filter(
        (u) => u.keyId === keyId && u.timestamp >= cutoffTime
      ).length;

      const remaining = Math.max(0, limit - recentRequests);
      const allowed = recentRequests < limit;

      return { allowed, remaining, limit };
    } catch (error) {
      this.logger.error(`Failed to check rate limit: ${error}`);
      throw error;
    }
  }

  /**
   * Mask API key for display
   */
  private maskKey(key: string): string {
    const parts = key.split('_');
    if (parts.length < 3) return key;

    const prefix = parts.slice(0, -1).join('_');
    const suffix = parts[parts.length - 1].slice(-4);
    return `${prefix}...${suffix}`;
  }

  /**
   * Get statistics across all keys
   */
  async getAllKeyStats(): Promise<{
    totalKeys: number;
    activeKeys: number;
    totalRequests: number;
    averageResponseTime: number;
  }> {
    try {
      const keys = Array.from(this.apiKeys.values());
      const activeKeys = keys.filter((k) => k.isActive).length;
      const totalRequests = this.apiKeyUsage.length;
      const averageResponseTime =
        totalRequests > 0
          ? this.apiKeyUsage.reduce((sum, u) => sum + u.responseTime, 0) /
            totalRequests
          : 0;

      return {
        totalKeys: keys.length,
        activeKeys,
        totalRequests,
        averageResponseTime: Math.round(averageResponseTime * 100) / 100,
      };
    } catch (error) {
      this.logger.error(`Failed to get all key stats: ${error}`);
      throw error;
    }
  }
}
