import { Controller, Get, Post, Delete, Param, Body, Query } from '@nestjs/common';
import { PermissionService, PermissionRole } from './permission.service';

@Controller('permissions')
export class PermissionController {
  constructor(private readonly service: PermissionService) {}

  /**
   * Assign role to user
   * POST /permissions/assign
   */
  @Post('assign')
  async assignRole(
    @Body()
    body: {
      userId: string;
      integrationId: string;
      role: PermissionRole;
      grantedBy: string;
      expiresAt?: string;
    }
  ) {
    const assignment = await this.service.assignRole(
      body.userId,
      body.integrationId,
      body.role,
      body.grantedBy,
      body.expiresAt ? new Date(body.expiresAt) : undefined
    );

    return {
      success: true,
      data: assignment,
      message: `Role ${body.role} assigned to user ${body.userId}`,
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * Get user's role for integration
   * GET /permissions/:userId/:integrationId
   */
  @Get(':userId/:integrationId')
  async getUserRole(
    @Param('userId') userId: string,
    @Param('integrationId') integrationId: string
  ) {
    const role = await this.service.getUserRole(userId, integrationId);

    if (!role) {
      return {
        success: false,
        error: 'No role assigned',
        timestamp: new Date().toISOString(),
      };
    }

    return {
      success: true,
      data: { userId, integrationId, role },
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * Check permission
   * POST /permissions/check
   */
  @Post('check')
  async checkPermission(
    @Body()
    body: {
      userId: string;
      integrationId: string;
      action: string;
    }
  ) {
    const result = await this.service.checkPermission(
      body.userId,
      body.integrationId,
      body.action
    );

    return {
      success: true,
      data: result,
      message: result.allowed ? 'Permission granted' : 'Permission denied',
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * Revoke user role
   * DELETE /permissions/:userId/:integrationId
   */
  @Delete(':userId/:integrationId')
  async revokeRole(
    @Param('userId') userId: string,
    @Param('integrationId') integrationId: string
  ) {
    const revoked = await this.service.revokeRole(userId, integrationId);

    return {
      success: revoked,
      message: revoked
        ? `Role revoked for user ${userId}`
        : 'Role not found',
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * Set resource-level access control
   * POST /permissions/resources
   */
  @Post('resources')
  async setResourceAccess(
    @Body()
    body: {
      resourceId: string;
      resourceType: 'integration' | 'api-key' | 'webhook' | 'sync-operation';
      allowedRoles: PermissionRole[];
      allowedUsers?: string[];
    }
  ) {
    const access = await this.service.setResourceAccess(
      body.resourceId,
      body.resourceType,
      body.allowedRoles,
      body.allowedUsers
    );

    return {
      success: true,
      data: access,
      message: `Resource access configured`,
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * Check resource access
   * POST /permissions/resources/check
   */
  @Post('resources/check')
  async checkResourceAccess(
    @Body()
    body: {
      userId: string;
      integrationId: string;
      resourceId: string;
    }
  ) {
    const allowed = await this.service.checkResourceAccess(
      body.userId,
      body.integrationId,
      body.resourceId
    );

    return {
      success: allowed,
      data: { userId: body.userId, resourceId: body.resourceId, allowed },
      message: allowed ? 'Access granted' : 'Access denied',
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * Get all roles
   * GET /permissions/roles
   */
  @Get('roles')
  async getAllRoles() {
    const roles = await this.service.getAllRoles();

    return {
      success: true,
      data: roles,
      count: roles.length,
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * Get user's integrations
   * GET /permissions/user/:userId/integrations
   */
  @Get('user/:userId/integrations')
  async getUserIntegrations(@Param('userId') userId: string) {
    const integrations = await this.service.getUserIntegrations(userId);

    return {
      success: true,
      data: { userId, integrations },
      count: integrations.length,
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * Get integration members
   * GET /permissions/integration/:integrationId/members
   */
  @Get('integration/:integrationId/members')
  async getIntegrationMembers(
    @Param('integrationId') integrationId: string
  ) {
    const members = await this.service.getIntegrationMembers(integrationId);

    return {
      success: true,
      data: { integrationId, members },
      count: members.length,
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * Get permission statistics
   * GET /permissions/stats
   */
  @Get('stats')
  async getStatistics() {
    const stats = await this.service.getStatistics();

    return {
      success: true,
      data: stats,
      message: 'Permission management statistics',
      timestamp: new Date().toISOString(),
    };
  }
}
