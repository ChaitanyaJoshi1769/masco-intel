import { Controller, Get, Post, Body, Query, Param } from '@nestjs/common';
import type { AuditEventType, AuditSeverity } from './audit.service';
import { AuditService } from './audit.service';

@Controller('audit')
export class AuditController {
  constructor(private readonly service: AuditService) {}

  /**
   * Log audit event
   * POST /audit/log
   */
  @Post('log')
  async logEvent(
    @Body()
    body: {
      eventType: AuditEventType;
      userId: string;
      integrationId: string;
      action: string;
      details: Record<string, any>;
      severity?: AuditSeverity;
      resourceId?: string;
      resourceType?: string;
      ipAddress?: string;
      userAgent?: string;
      statusCode?: number;
      errorMessage?: string;
    }
  ) {
    const auditLog = await this.service.logEvent(
      body.eventType,
      body.userId,
      body.integrationId,
      body.action,
      body.details,
      {
        severity: body.severity,
        resourceId: body.resourceId,
        resourceType: body.resourceType,
        ipAddress: body.ipAddress,
        userAgent: body.userAgent,
        statusCode: body.statusCode,
        errorMessage: body.errorMessage,
      }
    );

    return {
      success: true,
      data: auditLog,
      message: 'Audit event logged',
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * Get audit logs with filtering
   * GET /audit/logs?userId=user123&limit=50
   */
  @Get('logs')
  async getAuditLogs(
    @Query('userId') userId?: string,
    @Query('integrationId') integrationId?: string,
    @Query('eventType') eventType?: AuditEventType,
    @Query('severity') severity?: AuditSeverity,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('limit') limit: string = '100',
    @Query('offset') offset: string = '0'
  ) {
    const logs = await this.service.getAuditLogs({
      userId,
      integrationId,
      eventType,
      severity,
      startDate: startDate ? new Date(startDate) : undefined,
      endDate: endDate ? new Date(endDate) : undefined,
      limit: parseInt(limit, 10),
      offset: parseInt(offset, 10),
    });

    return {
      success: true,
      data: logs,
      count: logs.length,
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * Get audit log by ID
   * GET /audit/logs/:logId
   */
  @Get('logs/:logId')
  async getAuditLog(@Param('logId') logId: string) {
    const log = await this.service.getAuditLog(logId);

    if (!log) {
      return {
        success: false,
        error: 'Audit log not found',
        timestamp: new Date().toISOString(),
      };
    }

    return {
      success: true,
      data: log,
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * Get events for user
   * GET /audit/user/:userId
   */
  @Get('user/:userId')
  async getUserEvents(
    @Param('userId') userId: string,
    @Query('limit') limit: string = '100'
  ) {
    const events = await this.service.getUserEvents(userId, parseInt(limit, 10));

    return {
      success: true,
      data: events,
      count: events.length,
      userId,
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * Get events for integration
   * GET /audit/integration/:integrationId
   */
  @Get('integration/:integrationId')
  async getIntegrationEvents(
    @Param('integrationId') integrationId: string,
    @Query('limit') limit: string = '100'
  ) {
    const events = await this.service.getIntegrationEvents(
      integrationId,
      parseInt(limit, 10)
    );

    return {
      success: true,
      data: events,
      count: events.length,
      integrationId,
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * Search audit logs
   * POST /audit/search
   */
  @Post('search')
  async searchAuditLogs(
    @Body()
    body: {
      query: string;
      userId?: string;
      integrationId?: string;
      eventType?: AuditEventType;
      severity?: AuditSeverity;
      startDate?: string;
      endDate?: string;
      limit?: number;
    }
  ) {
    const results = await this.service.searchAuditLogs(body.query, {
      userId: body.userId,
      integrationId: body.integrationId,
      eventType: body.eventType,
      severity: body.severity,
      startDate: body.startDate ? new Date(body.startDate) : undefined,
      endDate: body.endDate ? new Date(body.endDate) : undefined,
      limit: body.limit || 100,
    });

    return {
      success: true,
      data: results,
      count: results.length,
      query: body.query,
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * Get audit statistics
   * GET /audit/stats
   */
  @Get('stats')
  async getStatistics() {
    const stats = await this.service.getStatistics();

    return {
      success: true,
      data: stats,
      message: 'Audit log statistics',
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * Generate compliance report
   * POST /audit/compliance-report
   */
  @Post('compliance-report')
  async generateComplianceReport(
    @Body()
    body: {
      startDate: string;
      endDate: string;
    }
  ) {
    const report = await this.service.generateComplianceReport(
      new Date(body.startDate),
      new Date(body.endDate)
    );

    return {
      success: true,
      data: report,
      message: 'Compliance report generated',
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * Export audit logs
   * POST /audit/export
   */
  @Post('export')
  async exportAuditLogs(
    @Body()
    body: {
      userId?: string;
      integrationId?: string;
      eventType?: AuditEventType;
      severity?: AuditSeverity;
      startDate?: string;
      endDate?: string;
      format: 'json' | 'csv';
    }
  ) {
    const content = await this.service.exportAuditLogs(
      {
        userId: body.userId,
        integrationId: body.integrationId,
        eventType: body.eventType,
        severity: body.severity,
        startDate: body.startDate ? new Date(body.startDate) : undefined,
        endDate: body.endDate ? new Date(body.endDate) : undefined,
      },
      body.format
    );

    return {
      success: true,
      data: {
        content,
        format: body.format,
        exportedAt: new Date().toISOString(),
      },
      message: `Audit logs exported as ${body.format.toUpperCase()}`,
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * Set audit retention policy
   * POST /audit/retention
   */
  @Post('retention')
  async setRetentionDays(@Body() body: { days: number }) {
    this.service.setRetentionDays(body.days);

    return {
      success: true,
      data: { retentionDays: body.days },
      message: `Audit log retention policy updated to ${body.days} days`,
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * Get audit retention policy
   * GET /audit/retention
   */
  @Get('retention')
  async getRetentionDays() {
    const days = this.service.getRetentionDays();

    return {
      success: true,
      data: { retentionDays: days },
      message: 'Audit log retention policy',
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * Get audit event types
   * GET /audit/events
   */
  @Get('events')
  async getEventTypes() {
    const eventTypes: AuditEventType[] = [
      'integration.created',
      'integration.updated',
      'integration.deleted',
      'api_key.created',
      'api_key.rotated',
      'api_key.revoked',
      'oauth.authorized',
      'oauth.token_refreshed',
      'oauth.token_revoked',
      'webhook.created',
      'webhook.verified',
      'webhook.failed',
      'webhook.deleted',
      'sync.started',
      'sync.completed',
      'sync.failed',
      'sync.cancelled',
      'permission.assigned',
      'permission.revoked',
      'access.granted',
      'access.denied',
      'resource.accessed',
      'error.occurred',
    ];

    return {
      success: true,
      data: { eventTypes },
      count: eventTypes.length,
      message: 'Supported audit event types',
      timestamp: new Date().toISOString(),
    };
  }
}
