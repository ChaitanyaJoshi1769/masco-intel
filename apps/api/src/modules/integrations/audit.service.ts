import { Injectable, Logger } from '@nestjs/common';

export type AuditEventType =
  | 'integration.created'
  | 'integration.updated'
  | 'integration.deleted'
  | 'api_key.created'
  | 'api_key.rotated'
  | 'api_key.revoked'
  | 'oauth.authorized'
  | 'oauth.token_refreshed'
  | 'oauth.token_revoked'
  | 'webhook.created'
  | 'webhook.verified'
  | 'webhook.failed'
  | 'webhook.deleted'
  | 'sync.started'
  | 'sync.completed'
  | 'sync.failed'
  | 'sync.cancelled'
  | 'permission.assigned'
  | 'permission.revoked'
  | 'access.granted'
  | 'access.denied'
  | 'resource.accessed'
  | 'error.occurred';

export type AuditSeverity = 'info' | 'warning' | 'error' | 'critical';

export interface AuditLog {
  id: string;
  eventType: AuditEventType;
  severity: AuditSeverity;
  userId: string;
  integrationId: string;
  resourceId?: string;
  resourceType?: string;
  action: string;
  details: Record<string, any>;
  ipAddress?: string;
  userAgent?: string;
  timestamp: Date;
  statusCode?: number;
  errorMessage?: string;
}

export interface AuditFilter {
  userId?: string;
  integrationId?: string;
  eventType?: AuditEventType;
  severity?: AuditSeverity;
  startDate?: Date;
  endDate?: Date;
  limit?: number;
  offset?: number;
}

export interface AuditStatistics {
  totalEvents: number;
  eventsByType: Record<AuditEventType, number>;
  eventsBySeverity: Record<AuditSeverity, number>;
  eventsByUser: Record<string, number>;
  eventsByIntegration: Record<string, number>;
  averageEventsPerDay: number;
  lastEventAt: Date | null;
}

export interface ComplianceReport {
  period: string;
  startDate: Date;
  endDate: Date;
  totalEvents: number;
  criticalEvents: number;
  failedOperations: number;
  unauthorizedAttempts: number;
  dataModifications: number;
  deletions: number;
  riskScore: number;
  summary: string;
}

@Injectable()
export class AuditService {
  private readonly logger = new Logger(AuditService.name);

  // Store audit logs
  private auditLogs: AuditLog[] = [];

  // Retention policy (days)
  private retentionDays = 90;

  // Critical events for alerting
  private criticalEventTypes: AuditEventType[] = [
    'api_key.revoked',
    'oauth.token_revoked',
    'integration.deleted',
    'permission.revoked',
    'access.denied',
  ];

  constructor() {
    // Cleanup old logs daily
    setInterval(() => this.cleanupOldLogs(), 24 * 60 * 60 * 1000);
  }

  /**
   * Log audit event
   */
  async logEvent(
    eventType: AuditEventType,
    userId: string,
    integrationId: string,
    action: string,
    details: Record<string, any>,
    options?: {
      severity?: AuditSeverity;
      resourceId?: string;
      resourceType?: string;
      ipAddress?: string;
      userAgent?: string;
      statusCode?: number;
      errorMessage?: string;
    }
  ): Promise<AuditLog> {
    try {
      const severity = this.determineSeverity(eventType, options?.statusCode);

      const auditLog: AuditLog = {
        id: `audit_${Date.now()}_${Math.random().toString(36).substring(7)}`,
        eventType,
        severity,
        userId,
        integrationId,
        resourceId: options?.resourceId,
        resourceType: options?.resourceType,
        action,
        details,
        ipAddress: options?.ipAddress,
        userAgent: options?.userAgent,
        timestamp: new Date(),
        statusCode: options?.statusCode,
        errorMessage: options?.errorMessage,
      };

      this.auditLogs.push(auditLog);

      // Alert on critical events
      if (this.criticalEventTypes.includes(eventType)) {
        this.logger.warn(
          `CRITICAL AUDIT EVENT: ${eventType} by ${userId} on ${integrationId}`
        );
      } else {
        this.logger.debug(`Audit event logged: ${auditLog.id}`);
      }

      return auditLog;
    } catch (error) {
      this.logger.error(`Failed to log audit event: ${error}`);
      throw error;
    }
  }

  /**
   * Get audit logs with filtering
   */
  async getAuditLogs(filter: AuditFilter): Promise<AuditLog[]> {
    try {
      let filtered = [...this.auditLogs];

      // Apply filters
      if (filter.userId) {
        filtered = filtered.filter((log) => log.userId === filter.userId);
      }

      if (filter.integrationId) {
        filtered = filtered.filter(
          (log) => log.integrationId === filter.integrationId
        );
      }

      if (filter.eventType) {
        filtered = filtered.filter((log) => log.eventType === filter.eventType);
      }

      if (filter.severity) {
        filtered = filtered.filter((log) => log.severity === filter.severity);
      }

      if (filter.startDate) {
        filtered = filtered.filter((log) => log.timestamp >= filter.startDate!);
      }

      if (filter.endDate) {
        filtered = filtered.filter((log) => log.timestamp <= filter.endDate!);
      }

      // Sort by timestamp (newest first)
      filtered.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());

      // Apply pagination
      const offset = filter.offset || 0;
      const limit = filter.limit || 100;

      return filtered.slice(offset, offset + limit);
    } catch (error) {
      this.logger.error(`Failed to get audit logs: ${error}`);
      throw error;
    }
  }

  /**
   * Get audit log by ID
   */
  async getAuditLog(logId: string): Promise<AuditLog | null> {
    return this.auditLogs.find((log) => log.id === logId) || null;
  }

  /**
   * Get events for user
   */
  async getUserEvents(
    userId: string,
    limit: number = 100
  ): Promise<AuditLog[]> {
    return this.getAuditLogs({ userId, limit });
  }

  /**
   * Get events for integration
   */
  async getIntegrationEvents(
    integrationId: string,
    limit: number = 100
  ): Promise<AuditLog[]> {
    return this.getAuditLogs({ integrationId, limit });
  }

  /**
   * Search audit logs
   */
  async searchAuditLogs(
    query: string,
    filter?: AuditFilter
  ): Promise<AuditLog[]> {
    try {
      let results = await this.getAuditLogs(filter || {});

      // Simple text search in action and details
      const searchTerm = query.toLowerCase();
      results = results.filter(
        (log) =>
          log.action.toLowerCase().includes(searchTerm) ||
          JSON.stringify(log.details).toLowerCase().includes(searchTerm) ||
          log.eventType.toLowerCase().includes(searchTerm)
      );

      return results;
    } catch (error) {
      this.logger.error(`Failed to search audit logs: ${error}`);
      throw error;
    }
  }

  /**
   * Get audit statistics
   */
  async getStatistics(): Promise<AuditStatistics> {
    try {
      const eventsByType: Record<AuditEventType, number> = {} as any;
      const eventsBySeverity: Record<AuditSeverity, number> = {
        info: 0,
        warning: 0,
        error: 0,
        critical: 0,
      };
      const eventsByUser: Record<string, number> = {};
      const eventsByIntegration: Record<string, number> = {};

      for (const log of this.auditLogs) {
        // Count by type
        eventsByType[log.eventType] = (eventsByType[log.eventType] || 0) + 1;

        // Count by severity
        eventsBySeverity[log.severity]++;

        // Count by user
        eventsByUser[log.userId] = (eventsByUser[log.userId] || 0) + 1;

        // Count by integration
        eventsByIntegration[log.integrationId] =
          (eventsByIntegration[log.integrationId] || 0) + 1;
      }

      // Calculate average events per day
      const dayCount = this.retentionDays;
      const avgEventsPerDay = this.auditLogs.length / dayCount;

      const lastEventAt =
        this.auditLogs.length > 0
          ? this.auditLogs[this.auditLogs.length - 1].timestamp
          : null;

      return {
        totalEvents: this.auditLogs.length,
        eventsByType,
        eventsBySeverity,
        eventsByUser,
        eventsByIntegration,
        averageEventsPerDay: Math.round(avgEventsPerDay * 100) / 100,
        lastEventAt,
      };
    } catch (error) {
      this.logger.error(`Failed to get audit statistics: ${error}`);
      throw error;
    }
  }

  /**
   * Generate compliance report
   */
  async generateComplianceReport(
    startDate: Date,
    endDate: Date
  ): Promise<ComplianceReport> {
    try {
      const logs = await this.getAuditLogs({ startDate, endDate });

      const criticalEvents = logs.filter(
        (log) => log.severity === 'critical'
      ).length;
      const failedOperations = logs.filter(
        (log) =>
          log.eventType.includes('failed') || log.statusCode! >= 400
      ).length;
      const unauthorizedAttempts = logs.filter(
        (log) => log.eventType === 'access.denied'
      ).length;
      const dataModifications = logs.filter(
        (log) =>
          log.eventType.includes('created') ||
          log.eventType.includes('updated')
      ).length;
      const deletions = logs.filter(
        (log) => log.eventType.includes('deleted')
      ).length;

      // Calculate risk score (0-100)
      const riskScore = Math.min(
        100,
        criticalEvents * 10 + failedOperations * 2 + unauthorizedAttempts * 5
      );

      const summary = `Compliance Report: ${logs.length} events logged. Critical events: ${criticalEvents}, Failed operations: ${failedOperations}, Unauthorized attempts: ${unauthorizedAttempts}. Risk score: ${riskScore}/100.`;

      return {
        period: `${startDate.toISOString().split('T')[0]} to ${endDate.toISOString().split('T')[0]}`,
        startDate,
        endDate,
        totalEvents: logs.length,
        criticalEvents,
        failedOperations,
        unauthorizedAttempts,
        dataModifications,
        deletions,
        riskScore,
        summary,
      };
    } catch (error) {
      this.logger.error(`Failed to generate compliance report: ${error}`);
      throw error;
    }
  }

  /**
   * Export audit logs
   */
  async exportAuditLogs(
    filter: AuditFilter,
    format: 'json' | 'csv'
  ): Promise<string> {
    try {
      const logs = await this.getAuditLogs(filter);

      if (format === 'json') {
        return JSON.stringify(logs, null, 2);
      } else {
        // CSV format
        const headers = [
          'ID',
          'EventType',
          'Severity',
          'UserID',
          'IntegrationID',
          'Action',
          'Timestamp',
          'StatusCode',
        ];

        const rows = logs.map((log) => [
          log.id,
          log.eventType,
          log.severity,
          log.userId,
          log.integrationId,
          log.action,
          log.timestamp.toISOString(),
          log.statusCode || '',
        ]);

        const csv = [
          headers.join(','),
          ...rows.map((row) => row.map((cell) => `"${cell}"`).join(',')),
        ].join('\n');

        return csv;
      }
    } catch (error) {
      this.logger.error(`Failed to export audit logs: ${error}`);
      throw error;
    }
  }

  /**
   * Determine severity based on event type and status
   */
  private determineSeverity(
    eventType: AuditEventType,
    statusCode?: number
  ): AuditSeverity {
    if (eventType.includes('failed') || statusCode! >= 500) {
      return 'critical';
    } else if (statusCode! >= 400) {
      return 'error';
    } else if (this.criticalEventTypes.includes(eventType)) {
      return 'warning';
    }
    return 'info';
  }

  /**
   * Cleanup old logs based on retention policy
   */
  private cleanupOldLogs(): void {
    try {
      const cutoffDate = new Date(
        Date.now() - this.retentionDays * 24 * 60 * 60 * 1000
      );

      const initialCount = this.auditLogs.length;
      this.auditLogs = this.auditLogs.filter(
        (log) => log.timestamp >= cutoffDate
      );
      const removedCount = initialCount - this.auditLogs.length;

      if (removedCount > 0) {
        this.logger.log(
          `Cleaned up ${removedCount} old audit logs (retention: ${this.retentionDays} days)`
        );
      }
    } catch (error) {
      this.logger.error(`Failed to cleanup old audit logs: ${error}`);
    }
  }

  /**
   * Set retention policy
   */
  setRetentionDays(days: number): void {
    this.retentionDays = Math.max(7, Math.min(days, 730)); // Between 7 and 730 days
    this.logger.log(`Audit log retention policy updated to ${this.retentionDays} days`);
  }

  /**
   * Get retention policy
   */
  getRetentionDays(): number {
    return this.retentionDays;
  }
}
