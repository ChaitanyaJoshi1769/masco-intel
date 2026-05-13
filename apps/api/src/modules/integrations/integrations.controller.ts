import { Controller, Get, Post, Put, Delete, Param, Body } from '@nestjs/common';
import { IntegrationsService, IntegrationType } from './integrations.service';

@Controller('integrations')
export class IntegrationsController {
  constructor(private readonly service: IntegrationsService) {}

  /**
   * Get all integrations
   * GET /integrations
   */
  @Get()
  async getIntegrations() {
    const integrations = await this.service.getIntegrations();
    return {
      success: true,
      data: integrations,
      count: integrations.length,
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * Get integration by ID
   * GET /integrations/:id
   */
  @Get(':id')
  async getIntegration(@Param('id') id: string) {
    const integration = await this.service.getIntegration(id);
    if (!integration) {
      return {
        success: false,
        error: 'Integration not found',
        timestamp: new Date().toISOString(),
      };
    }
    return {
      success: true,
      data: integration,
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * Create new integration
   * POST /integrations
   * Body: { name, type, credentials, settings? }
   */
  @Post()
  async createIntegration(
    @Body()
    body: {
      name: string;
      type: IntegrationType;
      credentials: Record<string, string>;
      settings?: Record<string, any>;
    }
  ) {
    const integration = await this.service.createIntegration(
      body.name,
      body.type,
      body.credentials,
      body.settings
    );
    return {
      success: true,
      data: integration,
      message: `Integration ${body.name} created successfully`,
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * Update integration
   * PUT /integrations/:id
   */
  @Put(':id')
  async updateIntegration(
    @Param('id') id: string,
    @Body() body: Record<string, any>
  ) {
    const updated = await this.service.updateIntegration(id, body);
    if (!updated) {
      return {
        success: false,
        error: 'Integration not found',
        timestamp: new Date().toISOString(),
      };
    }
    return {
      success: true,
      data: updated,
      message: 'Integration updated successfully',
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * Delete integration
   * DELETE /integrations/:id
   */
  @Delete(':id')
  async deleteIntegration(@Param('id') id: string) {
    const deleted = await this.service.deleteIntegration(id);
    return {
      success: deleted,
      message: deleted ? 'Integration deleted successfully' : 'Integration not found',
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * Test integration connection
   * POST /integrations/:id/test
   */
  @Post(':id/test')
  async testIntegration(@Param('id') id: string) {
    const result = await this.service.testIntegration(id);
    return {
      ...result,
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * Sync products from integration
   * POST /integrations/:id/sync
   */
  @Post(':id/sync')
  async syncProducts(@Param('id') id: string) {
    const result = await this.service.syncProducts(id);
    return {
      ...result,
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * Process webhook event
   * POST /integrations/:id/webhooks
   */
  @Post(':id/webhooks')
  async processWebhook(
    @Param('id') id: string,
    @Body() body: { eventType: string; payload: Record<string, any> }
  ) {
    const result = await this.service.processWebhookEvent(id, body.eventType, body.payload);
    return {
      ...result,
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * Get integration statistics
   * GET /integrations/stats/overview
   */
  @Get('stats/overview')
  async getStatistics() {
    const stats = await this.service.getIntegrationStats();
    return {
      success: true,
      data: stats,
      timestamp: new Date().toISOString(),
    };
  }
}
