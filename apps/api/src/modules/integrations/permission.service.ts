import { Injectable, Logger } from '@nestjs/common';

export type PermissionRole = 'admin' | 'integrator' | 'viewer' | 'collaborator' | 'restricted';

export interface Permission {
  id: string;
  action: string;
  resource: string;
  description: string;
}

export interface Role {
  id: string;
  name: PermissionRole;
  description: string;
  permissions: string[]; // permission IDs
  createdAt: Date;
  updatedAt: Date;
}

export interface RoleAssignment {
  id: string;
  userId: string;
  integrationId: string;
  role: PermissionRole;
  grantedBy: string;
  grantedAt: Date;
  expiresAt?: Date;
  metadata?: Record<string, any>;
}

export interface PermissionCheck {
  allowed: boolean;
  reason?: string;
  userId: string;
  action: string;
  resource: string;
}

export interface ResourceAccess {
  resourceId: string;
  resourceType: 'integration' | 'api-key' | 'webhook' | 'sync-operation';
  allowedRoles: PermissionRole[];
  allowedUsers?: string[];
  createdAt: Date;
}

@Injectable()
export class PermissionService {
  private readonly logger = new Logger(PermissionService.name);

  // Store roles with their permissions
  private roles: Map<string, Role> = new Map();

  // Store permissions
  private permissions: Map<string, Permission> = new Map();

  // Store role assignments per user
  private roleAssignments: Map<string, RoleAssignment[]> = new Map();

  // Store resource-level access controls
  private resourceAccess: Map<string, ResourceAccess> = new Map();

  // Default permissions per action
  private defaultPermissions: Map<PermissionRole, Set<string>> = new Map([
    [
      'admin',
      new Set([
        'integration:create',
        'integration:read',
        'integration:update',
        'integration:delete',
        'api-key:create',
        'api-key:read',
        'api-key:delete',
        'api-key:rotate',
        'oauth:authorize',
        'oauth:revoke',
        'webhook:create',
        'webhook:verify',
        'webhook:delete',
        'sync:trigger',
        'sync:monitor',
        'sync:cancel',
        'permission:assign',
        'permission:revoke',
        'audit:read',
        'settings:update',
      ]),
    ],
    [
      'integrator',
      new Set([
        'integration:read',
        'integration:update',
        'api-key:create',
        'api-key:read',
        'api-key:rotate',
        'oauth:authorize',
        'webhook:create',
        'webhook:verify',
        'sync:trigger',
        'sync:monitor',
        'audit:read:own',
      ]),
    ],
    [
      'collaborator',
      new Set([
        'integration:read',
        'api-key:read',
        'oauth:authorize',
        'webhook:verify',
        'sync:monitor',
        'audit:read:own',
      ]),
    ],
    [
      'viewer',
      new Set([
        'integration:read',
        'api-key:read:masked',
        'webhook:read',
        'sync:monitor',
      ]),
    ],
    [
      'restricted',
      new Set([
        'integration:read:limited',
      ]),
    ],
  ]);

  constructor() {
    this.initializeDefaultRoles();
    this.initializeDefaultPermissions();
  }

  /**
   * Initialize default roles
   */
  private initializeDefaultRoles(): void {
    const defaultRoles: Role[] = [
      {
        id: 'role_admin',
        name: 'admin',
        description: 'Full access to all integration features and settings',
        permissions: Array.from(this.defaultPermissions.get('admin') || new Set()),
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: 'role_integrator',
        name: 'integrator',
        description: 'Can create and manage integrations and API keys',
        permissions: Array.from(this.defaultPermissions.get('integrator') || new Set()),
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: 'role_collaborator',
        name: 'collaborator',
        description: 'Can view and participate in integrations',
        permissions: Array.from(this.defaultPermissions.get('collaborator') || new Set()),
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: 'role_viewer',
        name: 'viewer',
        description: 'Read-only access to integration data',
        permissions: Array.from(this.defaultPermissions.get('viewer') || new Set()),
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: 'role_restricted',
        name: 'restricted',
        description: 'Limited access, only view basic integration info',
        permissions: Array.from(this.defaultPermissions.get('restricted') || new Set()),
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ];

    for (const role of defaultRoles) {
      this.roles.set(role.id, role);
    }
  }

  /**
   * Initialize default permissions
   */
  private initializeDefaultPermissions(): void {
    const permissions: Permission[] = [
      // Integration permissions
      { id: 'perm_int_create', action: 'integration:create', resource: 'integration', description: 'Create new integration' },
      { id: 'perm_int_read', action: 'integration:read', resource: 'integration', description: 'Read integration data' },
      { id: 'perm_int_update', action: 'integration:update', resource: 'integration', description: 'Update integration' },
      { id: 'perm_int_delete', action: 'integration:delete', resource: 'integration', description: 'Delete integration' },
      // API Key permissions
      { id: 'perm_key_create', action: 'api-key:create', resource: 'api-key', description: 'Create API key' },
      { id: 'perm_key_read', action: 'api-key:read', resource: 'api-key', description: 'Read API key' },
      { id: 'perm_key_delete', action: 'api-key:delete', resource: 'api-key', description: 'Delete API key' },
      { id: 'perm_key_rotate', action: 'api-key:rotate', resource: 'api-key', description: 'Rotate API key' },
      // OAuth permissions
      { id: 'perm_oauth_auth', action: 'oauth:authorize', resource: 'oauth', description: 'Authorize OAuth flow' },
      { id: 'perm_oauth_revoke', action: 'oauth:revoke', resource: 'oauth', description: 'Revoke OAuth token' },
      // Webhook permissions
      { id: 'perm_webhook_create', action: 'webhook:create', resource: 'webhook', description: 'Create webhook' },
      { id: 'perm_webhook_verify', action: 'webhook:verify', resource: 'webhook', description: 'Verify webhook signature' },
      { id: 'perm_webhook_delete', action: 'webhook:delete', resource: 'webhook', description: 'Delete webhook' },
      // Sync permissions
      { id: 'perm_sync_trigger', action: 'sync:trigger', resource: 'sync', description: 'Trigger data sync' },
      { id: 'perm_sync_monitor', action: 'sync:monitor', resource: 'sync', description: 'Monitor sync operations' },
      { id: 'perm_sync_cancel', action: 'sync:cancel', resource: 'sync', description: 'Cancel sync operation' },
      // Permission management
      { id: 'perm_perm_assign', action: 'permission:assign', resource: 'permission', description: 'Assign permissions' },
      { id: 'perm_perm_revoke', action: 'permission:revoke', resource: 'permission', description: 'Revoke permissions' },
      // Audit permissions
      { id: 'perm_audit_read', action: 'audit:read', resource: 'audit', description: 'Read audit logs' },
      // Settings
      { id: 'perm_settings_update', action: 'settings:update', resource: 'settings', description: 'Update settings' },
    ];

    for (const permission of permissions) {
      this.permissions.set(permission.id, permission);
    }
  }

  /**
   * Get role by name
   */
  async getRoleByName(roleName: PermissionRole): Promise<Role | undefined> {
    return Array.from(this.roles.values()).find((r) => r.name === roleName);
  }

  /**
   * Assign role to user for integration
   */
  async assignRole(
    userId: string,
    integrationId: string,
    role: PermissionRole,
    grantedBy: string,
    expiresAt?: Date
  ): Promise<RoleAssignment> {
    try {
      const assignmentId = `assignment_${userId}_${integrationId}_${Date.now()}`;

      const assignment: RoleAssignment = {
        id: assignmentId,
        userId,
        integrationId,
        role,
        grantedBy,
        grantedAt: new Date(),
        expiresAt,
      };

      const key = `${userId}_${integrationId}`;
      const assignments = this.roleAssignments.get(key) || [];
      assignments.push(assignment);
      this.roleAssignments.set(key, assignments);

      this.logger.log(
        `Role assigned: ${userId} -> ${role} for integration ${integrationId}`
      );

      return assignment;
    } catch (error) {
      this.logger.error(`Failed to assign role: ${error}`);
      throw error;
    }
  }

  /**
   * Get user's role for integration
   */
  async getUserRole(
    userId: string,
    integrationId: string
  ): Promise<PermissionRole | null> {
    try {
      const key = `${userId}_${integrationId}`;
      const assignments = this.roleAssignments.get(key) || [];

      // Find non-expired assignment
      for (const assignment of assignments) {
        if (!assignment.expiresAt || assignment.expiresAt > new Date()) {
          return assignment.role;
        }
      }

      return null;
    } catch (error) {
      this.logger.error(`Failed to get user role: ${error}`);
      throw error;
    }
  }

  /**
   * Check if user has permission
   */
  async checkPermission(
    userId: string,
    integrationId: string,
    action: string
  ): Promise<PermissionCheck> {
    try {
      const role = await this.getUserRole(userId, integrationId);

      if (!role) {
        return {
          allowed: false,
          reason: 'No role assigned for integration',
          userId,
          action,
          resource: 'integration',
        };
      }

      const permissions = this.defaultPermissions.get(role);
      if (!permissions) {
        return {
          allowed: false,
          reason: 'Role not found',
          userId,
          action,
          resource: 'integration',
        };
      }

      const allowed = permissions.has(action);

      return {
        allowed,
        reason: allowed ? undefined : `Permission denied: ${action}`,
        userId,
        action,
        resource: 'integration',
      };
    } catch (error) {
      this.logger.error(`Failed to check permission: ${error}`);
      return {
        allowed: false,
        reason: `Permission check failed: ${error}`,
        userId,
        action,
        resource: 'integration',
      };
    }
  }

  /**
   * Revoke user role
   */
  async revokeRole(userId: string, integrationId: string): Promise<boolean> {
    try {
      const key = `${userId}_${integrationId}`;
      const success = this.roleAssignments.delete(key);

      if (success) {
        this.logger.log(
          `Role revoked: ${userId} from integration ${integrationId}`
        );
      }

      return success;
    } catch (error) {
      this.logger.error(`Failed to revoke role: ${error}`);
      throw error;
    }
  }

  /**
   * Set resource-level access control
   */
  async setResourceAccess(
    resourceId: string,
    resourceType: 'integration' | 'api-key' | 'webhook' | 'sync-operation',
    allowedRoles: PermissionRole[],
    allowedUsers?: string[]
  ): Promise<ResourceAccess> {
    try {
      const access: ResourceAccess = {
        resourceId,
        resourceType,
        allowedRoles,
        allowedUsers,
        createdAt: new Date(),
      };

      this.resourceAccess.set(resourceId, access);

      this.logger.log(
        `Resource access set for ${resourceType}: ${resourceId}`
      );

      return access;
    } catch (error) {
      this.logger.error(`Failed to set resource access: ${error}`);
      throw error;
    }
  }

  /**
   * Check resource access
   */
  async checkResourceAccess(
    userId: string,
    integrationId: string,
    resourceId: string
  ): Promise<boolean> {
    try {
      const resource = this.resourceAccess.get(resourceId);
      if (!resource) return true; // No restriction

      // Check user list first
      if (resource.allowedUsers && !resource.allowedUsers.includes(userId)) {
        return false;
      }

      // Check role
      const role = await this.getUserRole(userId, integrationId);
      if (!role) return false;

      return resource.allowedRoles.includes(role);
    } catch (error) {
      this.logger.error(`Failed to check resource access: ${error}`);
      return false;
    }
  }

  /**
   * Get all roles
   */
  async getAllRoles(): Promise<Role[]> {
    return Array.from(this.roles.values());
  }

  /**
   * Get user's integrations
   */
  async getUserIntegrations(userId: string): Promise<string[]> {
    const integrations = new Set<string>();

    for (const [key] of this.roleAssignments) {
      if (key.startsWith(`${userId}_`)) {
        const integrationId = key.substring(`${userId}_`.length);
        integrations.add(integrationId);
      }
    }

    return Array.from(integrations);
  }

  /**
   * Get integration members
   */
  async getIntegrationMembers(integrationId: string): Promise<RoleAssignment[]> {
    const members: RoleAssignment[] = [];

    for (const assignments of this.roleAssignments.values()) {
      for (const assignment of assignments) {
        if (assignment.integrationId === integrationId) {
          members.push(assignment);
        }
      }
    }

    return members;
  }

  /**
   * Get permission statistics
   */
  async getStatistics(): Promise<{
    totalRoles: number;
    totalPermissions: number;
    totalAssignments: number;
    totalResourceRestrictions: number;
  }> {
    return {
      totalRoles: this.roles.size,
      totalPermissions: this.permissions.size,
      totalAssignments: Array.from(this.roleAssignments.values()).flat().length,
      totalResourceRestrictions: this.resourceAccess.size,
    };
  }
}
