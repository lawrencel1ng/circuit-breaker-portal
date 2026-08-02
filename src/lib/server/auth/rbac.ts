/**
 * RBAC (Role-Based Access Control) System
 * Provides role and permission management for the Circuit Breaker Portal
 * Supports resource-level permissions and conditions
 */

import { logger } from '../logger';

// Role definitions
export enum Role {
  SUPER_ADMIN = 'super_admin',
  ADMIN = 'admin',
  OPERATOR = 'operator',
  VIEWER = 'viewer',
  SWG_ADMIN = 'swg_admin',
  DEPLOYMENT_ADMIN = 'deployment_admin',
  SECURITY_ADMIN = 'security_admin'
}

// Resource types
export enum Resource {
  LANE = 'lane',
  DEPLOYMENT = 'deployment',
  APPLICATION = 'application',
  SWG_CONFIG = 'swg_config',
  SWG_POLICY = 'swg_policy',
  SWG_URL_FILTER = 'swg_url_filter',
  CERTIFICATE = 'certificate',
  USER = 'user',
  ROLE = 'role',
  SETTING = 'setting',
  LOG = 'log',
  BACKUP = 'backup',
  F5_DEVICE = 'f5_device',
  BLUE_GREEN = 'blue_green',
  AUTO_SCALING = 'auto_scaling',
  CLOUD = 'cloud',
  SYSTEM = 'system'
}

// Actions
export enum Action {
  CREATE = 'create',
  READ = 'read',
  UPDATE = 'update',
  DELETE = 'delete',
  EXECUTE = 'execute',  // For actions like failover, rollback
  APPROVE = 'approve'   // For approval workflows
}

// Permission with optional conditions
export interface Permission {
  resource: Resource;
  action: Action;
  conditions?: {
    lanes?: string[];      // e.g., ['lane-1', 'lane-2']
    roles?: string[];      // Can manage users with these roles
    readonly?: boolean;    // Special flag for read-only access
  };
}

// Role definition with permissions
export interface RoleDefinition {
  name: Role;
  displayName: string;
  description: string;
  permissions: Permission[];
  inherits?: Role;  // For role hierarchy
}

// User with roles
export interface User {
  id: string;
  username: string;
  email: string;
  roles: Role[];
  permissions?: Permission[];  // Additional direct permissions
  attributes?: {
    department?: string;
    team?: string;
    lanes?: string[];  // Assigned lanes
  };
  lastLogin?: Date;
  createdAt: Date;
  updatedAt: Date;
  isActive: boolean;
}

// Access check result
export interface AccessCheckResult {
  allowed: boolean;
  reason?: string;
  requiredPermissions?: Permission[];
  userPermissions?: Permission[];
}

// Role definitions with their permissions
export const ROLE_DEFINITIONS: Record<Role, RoleDefinition> = {
  [Role.SUPER_ADMIN]: {
    name: Role.SUPER_ADMIN,
    displayName: 'Super Administrator',
    description: 'Full system access including user management',
    permissions: [
      { resource: Resource.LANE, action: Action.CREATE },
      { resource: Resource.LANE, action: Action.READ },
      { resource: Resource.LANE, action: Action.UPDATE },
      { resource: Resource.LANE, action: Action.DELETE },
      { resource: Resource.LANE, action: Action.EXECUTE },
      { resource: Resource.DEPLOYMENT, action: Action.CREATE },
      { resource: Resource.DEPLOYMENT, action: Action.READ },
      { resource: Resource.DEPLOYMENT, action: Action.UPDATE },
      { resource: Resource.DEPLOYMENT, action: Action.DELETE },
      { resource: Resource.DEPLOYMENT, action: Action.EXECUTE },
      { resource: Resource.APPLICATION, action: Action.CREATE },
      { resource: Resource.APPLICATION, action: Action.READ },
      { resource: Resource.APPLICATION, action: Action.UPDATE },
      { resource: Resource.APPLICATION, action: Action.DELETE },
      { resource: Resource.SWG_CONFIG, action: Action.CREATE },
      { resource: Resource.SWG_CONFIG, action: Action.READ },
      { resource: Resource.SWG_CONFIG, action: Action.UPDATE },
      { resource: Resource.SWG_CONFIG, action: Action.DELETE },
      { resource: Resource.SWG_POLICY, action: Action.CREATE },
      { resource: Resource.SWG_POLICY, action: Action.READ },
      { resource: Resource.SWG_POLICY, action: Action.UPDATE },
      { resource: Resource.SWG_POLICY, action: Action.DELETE },
      { resource: Resource.SWG_URL_FILTER, action: Action.CREATE },
      { resource: Resource.SWG_URL_FILTER, action: Action.READ },
      { resource: Resource.SWG_URL_FILTER, action: Action.UPDATE },
      { resource: Resource.SWG_URL_FILTER, action: Action.DELETE },
      { resource: Resource.CERTIFICATE, action: Action.CREATE },
      { resource: Resource.CERTIFICATE, action: Action.READ },
      { resource: Resource.CERTIFICATE, action: Action.UPDATE },
      { resource: Resource.CERTIFICATE, action: Action.DELETE },
      { resource: Resource.USER, action: Action.CREATE },
      { resource: Resource.USER, action: Action.READ },
      { resource: Resource.USER, action: Action.UPDATE },
      { resource: Resource.USER, action: Action.DELETE },
      { resource: Resource.ROLE, action: Action.CREATE },
      { resource: Resource.ROLE, action: Action.READ },
      { resource: Resource.ROLE, action: Action.UPDATE },
      { resource: Resource.ROLE, action: Action.DELETE },
      { resource: Resource.SETTING, action: Action.CREATE },
      { resource: Resource.SETTING, action: Action.READ },
      { resource: Resource.SETTING, action: Action.UPDATE },
      { resource: Resource.SETTING, action: Action.DELETE },
      { resource: Resource.LOG, action: Action.READ },
      { resource: Resource.LOG, action: Action.DELETE },
      { resource: Resource.BACKUP, action: Action.CREATE },
      { resource: Resource.BACKUP, action: Action.READ },
      { resource: Resource.BACKUP, action: Action.UPDATE },
      { resource: Resource.BACKUP, action: Action.DELETE },
      { resource: Resource.BACKUP, action: Action.EXECUTE },
      { resource: Resource.F5_DEVICE, action: Action.CREATE },
      { resource: Resource.F5_DEVICE, action: Action.READ },
      { resource: Resource.F5_DEVICE, action: Action.UPDATE },
      { resource: Resource.F5_DEVICE, action: Action.DELETE },
      { resource: Resource.F5_DEVICE, action: Action.EXECUTE },
      { resource: Resource.BLUE_GREEN, action: Action.CREATE },
      { resource: Resource.BLUE_GREEN, action: Action.READ },
      { resource: Resource.BLUE_GREEN, action: Action.UPDATE },
      { resource: Resource.BLUE_GREEN, action: Action.DELETE },
      { resource: Resource.BLUE_GREEN, action: Action.EXECUTE },
      { resource: Resource.AUTO_SCALING, action: Action.CREATE },
      { resource: Resource.AUTO_SCALING, action: Action.READ },
      { resource: Resource.AUTO_SCALING, action: Action.UPDATE },
      { resource: Resource.AUTO_SCALING, action: Action.DELETE },
      { resource: Resource.AUTO_SCALING, action: Action.EXECUTE }
    ]
  },

  [Role.ADMIN]: {
    name: Role.ADMIN,
    displayName: 'Administrator',
    description: 'Full access except user/role management',
    permissions: [
      { resource: Resource.LANE, action: Action.CREATE },
      { resource: Resource.LANE, action: Action.READ },
      { resource: Resource.LANE, action: Action.UPDATE },
      { resource: Resource.LANE, action: Action.DELETE },
      { resource: Resource.LANE, action: Action.EXECUTE },
      { resource: Resource.DEPLOYMENT, action: Action.CREATE },
      { resource: Resource.DEPLOYMENT, action: Action.READ },
      { resource: Resource.DEPLOYMENT, action: Action.UPDATE },
      { resource: Resource.DEPLOYMENT, action: Action.DELETE },
      { resource: Resource.DEPLOYMENT, action: Action.EXECUTE },
      { resource: Resource.APPLICATION, action: Action.CREATE },
      { resource: Resource.APPLICATION, action: Action.READ },
      { resource: Resource.APPLICATION, action: Action.UPDATE },
      { resource: Resource.APPLICATION, action: Action.DELETE },
      { resource: Resource.SWG_CONFIG, action: Action.CREATE },
      { resource: Resource.SWG_CONFIG, action: Action.READ },
      { resource: Resource.SWG_CONFIG, action: Action.UPDATE },
      { resource: Resource.SWG_CONFIG, action: Action.DELETE },
      { resource: Resource.SWG_POLICY, action: Action.CREATE },
      { resource: Resource.SWG_POLICY, action: Action.READ },
      { resource: Resource.SWG_POLICY, action: Action.UPDATE },
      { resource: Resource.SWG_POLICY, action: Action.DELETE },
      { resource: Resource.SWG_URL_FILTER, action: Action.CREATE },
      { resource: Resource.SWG_URL_FILTER, action: Action.READ },
      { resource: Resource.SWG_URL_FILTER, action: Action.UPDATE },
      { resource: Resource.SWG_URL_FILTER, action: Action.DELETE },
      { resource: Resource.CERTIFICATE, action: Action.CREATE },
      { resource: Resource.CERTIFICATE, action: Action.READ },
      { resource: Resource.CERTIFICATE, action: Action.UPDATE },
      { resource: Resource.CERTIFICATE, action: Action.DELETE },
      { resource: Resource.USER, action: Action.READ },
      { resource: Resource.USER, action: Action.UPDATE },
      { resource: Resource.SETTING, action: Action.READ },
      { resource: Resource.SETTING, action: Action.UPDATE },
      { resource: Resource.LOG, action: Action.READ },
      { resource: Resource.BACKUP, action: Action.CREATE },
      { resource: Resource.BACKUP, action: Action.READ },
      { resource: Resource.BACKUP, action: Action.UPDATE },
      { resource: Resource.BACKUP, action: Action.DELETE },
      { resource: Resource.BACKUP, action: Action.EXECUTE },
      { resource: Resource.F5_DEVICE, action: Action.READ },
      { resource: Resource.F5_DEVICE, action: Action.UPDATE },
      { resource: Resource.F5_DEVICE, action: Action.EXECUTE },
      { resource: Resource.BLUE_GREEN, action: Action.CREATE },
      { resource: Resource.BLUE_GREEN, action: Action.READ },
      { resource: Resource.BLUE_GREEN, action: Action.UPDATE },
      { resource: Resource.BLUE_GREEN, action: Action.DELETE },
      { resource: Resource.BLUE_GREEN, action: Action.EXECUTE },
      { resource: Resource.AUTO_SCALING, action: Action.CREATE },
      { resource: Resource.AUTO_SCALING, action: Action.READ },
      { resource: Resource.AUTO_SCALING, action: Action.UPDATE },
      { resource: Resource.AUTO_SCALING, action: Action.DELETE },
      { resource: Resource.AUTO_SCALING, action: Action.EXECUTE }
    ]
  },

  [Role.OPERATOR]: {
    name: Role.OPERATOR,
    displayName: 'Operator',
    description: 'Can manage circuit breakers and view everything',
    permissions: [
      { resource: Resource.LANE, action: Action.READ },
      { resource: Resource.LANE, action: Action.UPDATE },  // Can toggle circuit breakers
      { resource: Resource.LANE, action: Action.EXECUTE }, // Can trigger failover
      { resource: Resource.DEPLOYMENT, action: Action.READ },
      { resource: Resource.DEPLOYMENT, action: Action.EXECUTE }, // Can trigger deployments
      { resource: Resource.APPLICATION, action: Action.READ },
      { resource: Resource.SWG_CONFIG, action: Action.READ },
      { resource: Resource.SWG_POLICY, action: Action.READ },
      { resource: Resource.SWG_URL_FILTER, action: Action.READ },
      { resource: Resource.CERTIFICATE, action: Action.READ },
      { resource: Resource.SETTING, action: Action.READ },
      { resource: Resource.LOG, action: Action.READ },
      { resource: Resource.F5_DEVICE, action: Action.READ },
      { resource: Resource.F5_DEVICE, action: Action.EXECUTE }, // Can test connectivity
      { resource: Resource.BLUE_GREEN, action: Action.READ },
      { resource: Resource.BLUE_GREEN, action: Action.EXECUTE }, // Can trigger switches
      { resource: Resource.AUTO_SCALING, action: Action.READ }
    ]
  },

  [Role.VIEWER]: {
    name: Role.VIEWER,
    displayName: 'Viewer',
    description: 'Read-only access to all resources',
    permissions: [
      { resource: Resource.LANE, action: Action.READ },
      { resource: Resource.DEPLOYMENT, action: Action.READ },
      { resource: Resource.APPLICATION, action: Action.READ },
      { resource: Resource.SWG_CONFIG, action: Action.READ },
      { resource: Resource.SWG_POLICY, action: Action.READ },
      { resource: Resource.SWG_URL_FILTER, action: Action.READ },
      { resource: Resource.CERTIFICATE, action: Action.READ },
      { resource: Resource.SETTING, action: Action.READ },
      { resource: Resource.LOG, action: Action.READ },
      { resource: Resource.F5_DEVICE, action: Action.READ },
      { resource: Resource.BLUE_GREEN, action: Action.READ },
      { resource: Resource.AUTO_SCALING, action: Action.READ }
    ]
  },

  [Role.SWG_ADMIN]: {
    name: Role.SWG_ADMIN,
    displayName: 'SWG Administrator',
    description: 'Full access to SWG configuration only',
    permissions: [
      { resource: Resource.LANE, action: Action.READ },
      { resource: Resource.DEPLOYMENT, action: Action.READ },
      { resource: Resource.APPLICATION, action: Action.READ },
      { resource: Resource.SWG_CONFIG, action: Action.CREATE },
      { resource: Resource.SWG_CONFIG, action: Action.READ },
      { resource: Resource.SWG_CONFIG, action: Action.UPDATE },
      { resource: Resource.SWG_CONFIG, action: Action.DELETE },
      { resource: Resource.SWG_POLICY, action: Action.CREATE },
      { resource: Resource.SWG_POLICY, action: Action.READ },
      { resource: Resource.SWG_POLICY, action: Action.UPDATE },
      { resource: Resource.SWG_POLICY, action: Action.DELETE },
      { resource: Resource.SWG_URL_FILTER, action: Action.CREATE },
      { resource: Resource.SWG_URL_FILTER, action: Action.READ },
      { resource: Resource.SWG_URL_FILTER, action: Action.UPDATE },
      { resource: Resource.SWG_URL_FILTER, action: Action.DELETE },
      { resource: Resource.SETTING, action: Action.READ },
      { resource: Resource.LOG, action: Action.READ }
    ]
  },

  [Role.DEPLOYMENT_ADMIN]: {
    name: Role.DEPLOYMENT_ADMIN,
    displayName: 'Deployment Administrator',
    description: 'Full access to deployment operations only',
    permissions: [
      { resource: Resource.LANE, action: Action.READ },
      { resource: Resource.LANE, action: Action.EXECUTE },
      { resource: Resource.DEPLOYMENT, action: Action.CREATE },
      { resource: Resource.DEPLOYMENT, action: Action.READ },
      { resource: Resource.DEPLOYMENT, action: Action.UPDATE },
      { resource: Resource.DEPLOYMENT, action: Action.DELETE },
      { resource: Resource.DEPLOYMENT, action: Action.EXECUTE },
      { resource: Resource.APPLICATION, action: Action.CREATE },
      { resource: Resource.APPLICATION, action: Action.READ },
      { resource: Resource.APPLICATION, action: Action.UPDATE },
      { resource: Resource.APPLICATION, action: Action.DELETE },
      { resource: Resource.BLUE_GREEN, action: Action.CREATE },
      { resource: Resource.BLUE_GREEN, action: Action.READ },
      { resource: Resource.BLUE_GREEN, action: Action.UPDATE },
      { resource: Resource.BLUE_GREEN, action: Action.DELETE },
      { resource: Resource.BLUE_GREEN, action: Action.EXECUTE },
      { resource: Resource.AUTO_SCALING, action: Action.READ },
      { resource: Resource.AUTO_SCALING, action: Action.EXECUTE },
      { resource: Resource.SETTING, action: Action.READ },
      { resource: Resource.LOG, action: Action.READ }
    ]
  },

  [Role.SECURITY_ADMIN]: {
    name: Role.SECURITY_ADMIN,
    displayName: 'Security Administrator',
    description: 'Access to security-related configurations',
    permissions: [
      { resource: Resource.LANE, action: Action.READ },
      { resource: Resource.DEPLOYMENT, action: Action.READ },
      { resource: Resource.SWG_CONFIG, action: Action.READ },
      { resource: Resource.SWG_CONFIG, action: Action.UPDATE },
      { resource: Resource.SWG_POLICY, action: Action.CREATE },
      { resource: Resource.SWG_POLICY, action: Action.READ },
      { resource: Resource.SWG_POLICY, action: Action.UPDATE },
      { resource: Resource.SWG_POLICY, action: Action.DELETE },
      { resource: Resource.SWG_URL_FILTER, action: Action.CREATE },
      { resource: Resource.SWG_URL_FILTER, action: Action.READ },
      { resource: Resource.SWG_URL_FILTER, action: Action.UPDATE },
      { resource: Resource.SWG_URL_FILTER, action: Action.DELETE },
      { resource: Resource.CERTIFICATE, action: Action.CREATE },
      { resource: Resource.CERTIFICATE, action: Action.READ },
      { resource: Resource.CERTIFICATE, action: Action.UPDATE },
      { resource: Resource.CERTIFICATE, action: Action.DELETE },
      { resource: Resource.USER, action: Action.READ },
      { resource: Resource.ROLE, action: Action.READ },
      { resource: Resource.LOG, action: Action.READ },
      { resource: Resource.LOG, action: Action.DELETE },
      { resource: Resource.BACKUP, action: Action.READ },
      { resource: Resource.BACKUP, action: Action.EXECUTE }
    ]
  }
};

/**
 * RBAC Engine
 */
export class RBACEngine {
  /**
   * Check if a user has a specific permission
   */
  checkAccess(
    user: User,
    resource: Resource,
    action: Action,
    conditions?: { laneId?: string; userId?: string }
  ): AccessCheckResult {
    // Super admin always has access
    if (user.roles.includes(Role.SUPER_ADMIN)) {
      return { allowed: true };
    }

    // Get all permissions for the user's roles
    const userPermissions = this.getUserPermissions(user);

    // Check for exact permission match
    const hasPermission = userPermissions.some(permission => {
      // Check resource and action match
      if (permission.resource !== resource || permission.action !== action) {
        return false;
      }

      // Check conditions
      if (permission.conditions) {
        // Lane restriction
        if (conditions?.laneId && permission.conditions.lanes) {
          if (!permission.conditions.lanes.includes(conditions.laneId)) {
            return false;
          }
        }

        // User restriction (for user management)
        if (conditions?.userId && permission.conditions.roles) {
          // This would need user role lookup
          // For now, allow if no specific restriction
        }
      }

      return true;
    });

    if (hasPermission) {
      return { allowed: true };
    }

    return {
      allowed: false,
      reason: `User lacks ${action} permission on ${resource}`,
      requiredPermissions: [{ resource, action }],
      userPermissions
    };
  }

  /**
   * Check multiple permissions (all must pass)
   */
  checkAllAccess(
    user: User,
    checks: Array<{ resource: Resource; action: Action; conditions?: any }>
  ): AccessCheckResult {
    for (const check of checks) {
      const result = this.checkAccess(user, check.resource, check.action, check.conditions);
      if (!result.allowed) {
        return result;
      }
    }
    return { allowed: true };
  }

  /**
   * Check if user has any of the permissions
   */
  checkAnyAccess(
    user: User,
    checks: Array<{ resource: Resource; action: Action; conditions?: any }>
  ): AccessCheckResult {
    const failedChecks: AccessCheckResult[] = [];

    for (const check of checks) {
      const result = this.checkAccess(user, check.resource, check.action, check.conditions);
      if (result.allowed) {
        return { allowed: true };
      }
      failedChecks.push(result);
    }

    return {
      allowed: false,
      reason: 'User lacks all required permissions',
      requiredPermissions: checks.map(c => ({ resource: c.resource, action: c.action })),
      userPermissions: failedChecks[0]?.userPermissions
    };
  }

  /**
   * Get all permissions for a user (including inherited)
   */
  getUserPermissions(user: User): Permission[] {
    const permissions: Permission[] = [...(user.permissions || [])];
    const processedRoles = new Set<Role>();

    for (const role of user.roles) {
      this.addRolePermissions(role, permissions, processedRoles);
    }

    return permissions;
  }

  /**
   * Get user's effective roles (including inherited)
   */
  getUserRoles(user: User): Role[] {
    const roles = new Set<Role>(user.roles);
    
    for (const role of user.roles) {
      const roleDef = ROLE_DEFINITIONS[role];
      if (roleDef?.inherits) {
        roles.add(roleDef.inherits);
      }
    }

    return Array.from(roles);
  }

  /**
   * Check if user can manage another user
   */
  canManageUser(manager: User, target: User): boolean {
    // Super admin can manage anyone
    if (manager.roles.includes(Role.SUPER_ADMIN)) {
      return true;
    }

    // Admin can manage non-admin users
    if (manager.roles.includes(Role.ADMIN)) {
      return !target.roles.some(r => 
        r === Role.SUPER_ADMIN || r === Role.ADMIN
      );
    }

    return false;
  }

  /**
   * Get accessible lanes for a user
   */
  getAccessibleLanes(user: User): string[] | 'all' {
    // Super admin and admin can access all lanes
    if (user.roles.includes(Role.SUPER_ADMIN) || user.roles.includes(Role.ADMIN)) {
      return 'all';
    }

    // Check for lane-specific permissions
    const permissions = this.getUserPermissions(user);
    const lanePermissions = permissions.filter(p => p.resource === Resource.LANE);

    // Collect allowed lanes from conditions
    const allowedLanes = new Set<string>();
    for (const perm of lanePermissions) {
      if (perm.conditions?.lanes) {
        perm.conditions.lanes.forEach(l => allowedLanes.add(l));
      }
    }

    // If no lane restrictions found but has lane permission, allow all
    if (allowedLanes.size === 0 && lanePermissions.length > 0) {
      return 'all';
    }

    return Array.from(allowedLanes);
  }

  private addRolePermissions(
    role: Role,
    permissions: Permission[],
    processedRoles: Set<Role>
  ): void {
    if (processedRoles.has(role)) {
      return;
    }
    processedRoles.add(role);

    const roleDef = ROLE_DEFINITIONS[role];
    if (!roleDef) {
      logger.warn(`Unknown role: ${role}`);
      return;
    }

    permissions.push(...roleDef.permissions);

    // Process inherited roles
    if (roleDef.inherits) {
      this.addRolePermissions(roleDef.inherits, permissions, processedRoles);
    }
  }
}

// Singleton instance
let rbacEngine: RBACEngine | null = null;

export function getRBACEngine(): RBACEngine {
  if (!rbacEngine) {
    rbacEngine = new RBACEngine();
  }
  return rbacEngine;
}

export function resetRBACEngine(): void {
  rbacEngine = null;
}

// Helper functions
export function hasRole(user: User, role: Role): boolean {
  return user.roles.includes(role);
}

export function hasAnyRole(user: User, roles: Role[]): boolean {
  return roles.some(role => user.roles.includes(role));
}

export function hasAllRoles(user: User, roles: Role[]): boolean {
  return roles.every(role => user.roles.includes(role));
}
