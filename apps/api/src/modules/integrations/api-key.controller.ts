import { Controller, Get, Post, Delete, Param, Body, Query } from '@nestjs/common';
import { ApiKeyService } from './api-key.service';

@Controller('api-keys')
export class ApiKeyController {
  constructor(private readonly service: ApiKeyService) {}

  /**
   * Create new API key
   * POST /api-keys
   */
  @Post()
  async createApiKey(
    @Body()
    body: {
      name: string;
      integrationId: string;
      scopes: string[];
      expiresAt?: string;
      rateLimit?: { requestsPerMinute: number; requestsPerHour: number };
    }
  ) {
    const apiKey = await this.service.createApiKey(
      body.name,
      body.integrationId,
      body.scopes,
      body.expiresAt ? new Date(body.expiresAt) : undefined,
      body.rateLimit
    );

    return {
      success: true,
      data: apiKey,
      message: 'API key created successfully. Store the key securely.',
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * Get all API keys for integration
   * GET /api-keys?integrationId=shopify-demo
   */
  @Get()
  async getIntegrationKeys(@Query('integrationId') integrationId: string) {
    const keys = await this.service.getIntegrationKeys(integrationId);
    return {
      success: true,
      data: keys,
      count: keys.length,
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * Get API key by ID
   * GET /api-keys/:id
   */
  @Get(':id')
  async getApiKey(@Param('id') id: string) {
    const key = await this.service.getApiKey(id);
    if (!key) {
      return {
        success: false,
        error: 'API key not found',
        timestamp: new Date().toISOString(),
      };
    }

    return {
      success: true,
      data: key,
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * Revoke API key
   * DELETE /api-keys/:id
   */
  @Delete(':id')
  async revokeApiKey(@Param('id') id: string) {
    const revoked = await this.service.revokeApiKey(id);
    return {
      success: revoked,
      message: revoked ? 'API key revoked successfully' : 'API key not found',
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * Rotate API key
   * POST /api-keys/:id/rotate
   */
  @Post(':id/rotate')
  async rotateApiKey(@Param('id') id: string) {
    const result = await this.service.rotateApiKey(id);
    if (!result) {
      return {
        success: false,
        error: 'API key not found',
        timestamp: new Date().toISOString(),
      };
    }

    return {
      success: true,
      data: {
        oldKeyId: result.oldKey.id,
        newKeyId: result.newKey.id,
        newKey: result.newKey.key, // Only shown once
      },
      message: 'API key rotated successfully',
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * Get API key usage statistics
   * GET /api-keys/:id/stats?hours=24
   */
  @Get(':id/stats')
  async getUsageStats(
    @Param('id') id: string,
    @Query('hours') hours: string = '24'
  ) {
    const stats = await this.service.getUsageStats(id, parseInt(hours, 10));
    return {
      success: true,
      data: stats,
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * Check rate limit for API key
   * GET /api-keys/:id/rate-limit?window=minute
   */
  @Get(':id/rate-limit')
  async checkRateLimit(
    @Param('id') id: string,
    @Query('window') window: 'minute' | 'hour' = 'minute'
  ) {
    const rateLimit = await this.service.checkRateLimit(id, window);
    return {
      success: rateLimit.allowed,
      data: rateLimit,
      message: rateLimit.allowed
        ? `${rateLimit.remaining} requests remaining`
        : 'Rate limit exceeded',
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * Get statistics for all API keys
   * GET /api-keys/stats/overview
   */
  @Get('stats/overview')
  async getAllKeyStats() {
    const stats = await this.service.getAllKeyStats();
    return {
      success: true,
      data: stats,
      timestamp: new Date().toISOString(),
    };
  }
}
