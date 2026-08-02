/**
 * F5 Access Policy Manager (APM) Service
 * Manages APM authentication and per-request policies
 */

import { getF5Client, type F5iControlClient } from './icontrol-client';
import { F5_CONFIG } from './config';
import { logger } from '$lib/server/logger';

export interface APMAuthConfig {
  enabled: boolean;
  scheme: 'ntlm' | 'kerberos' | 'basic' | 'ldap' | 'saml';
  realm: string;
  servers: string[];
}

export interface APMPerRequestRule {
  name: string;
  condition: {
    type: 'category' | 'url' | 'user' | 'ip';
    operator: 'equals' | 'contains' | 'matches';
    value: string;
  };
  action: 'allow' | 'block' | 'authenticate';
  enabled: boolean;
}

export interface APMSession {
  id: string;
  user: string;
  clientIp: string;
  startTime: string;
  status: 'active' | 'terminated';
}

export class APMService {
  private client: F5iControlClient;

  constructor(client: F5iControlClient = getF5Client()) {
    this.client = client;
  }

  /**
   * Get APM access profile configuration
   */
  async getAccessProfile(): Promise<any> {
    try {
      const profileName = F5_CONFIG.APM.ACCESS_PROFILE;
      return await this.client.get(`tm/apm/profile/access/~Common~${profileName}`);
    } catch (error) {
      logger.error('Failed to get APM access profile', error);
      return null;
    }
  }

  /**
   * Get authentication configuration
   */
  async getAuthenticationConfig(): Promise<APMAuthConfig> {
    try {
      const profile = await this.getAccessProfile();
      
      // Determine auth scheme from access policy
      const scheme = this.detectAuthScheme(profile);
      
      return {
        enabled: profile?.enabled !== false,
        scheme,
        realm: F5_CONFIG.APM.NTLM_AUTH.DOMAIN,
        servers: this.getAuthServers(scheme)
      };
    } catch (error) {
      return {
        enabled: F5_CONFIG.APM.ENABLED,
        scheme: 'ntlm',
        realm: F5_CONFIG.APM.NTLM_AUTH.DOMAIN,
        servers: F5_CONFIG.APM.NTLM_AUTH.SERVERS
      };
    }
  }

  /**
   * Detect authentication scheme from profile
   */
  private detectAuthScheme(profile: any): 'ntlm' | 'kerberos' | 'basic' | 'ldap' | 'saml' {
    // This would analyze the access policy to determine auth scheme
    // For now, return default
    return 'ntlm';
  }

  /**
   * Get authentication servers based on scheme
   */
  private getAuthServers(scheme: string): string[] {
    switch (scheme) {
      case 'ntlm':
        return F5_CONFIG.APM.NTLM_AUTH.SERVERS;
      case 'ldap':
        return [F5_CONFIG.APM.LDAP_AUTH.SERVER];
      case 'kerberos':
        return [F5_CONFIG.APM.KERBEROS_AUTH.KDC];
      default:
        return [];
    }
  }

  /**
   * Configure NTLM authentication
   */
  async configureNTLM(domain: string, servers: string[]): Promise<void> {
    const profileName = F5_CONFIG.APM.ACCESS_PROFILE;
    
    // Create or update NTLM auth configuration
    await this.client.post('tm/apm/aaa/ntlm', {
      name: `${profileName}-ntlm`,
      domain,
      servers: servers.map(s => ({ name: s }))
    });
  }

  /**
   * Configure LDAP authentication
   */
  async configureLDAP(
    server: string,
    bindDn: string,
    bindPassword: string,
    searchBase: string
  ): Promise<void> {
    const profileName = F5_CONFIG.APM.ACCESS_PROFILE;
    
    await this.client.post('tm/apm/aaa/ldap', {
      name: `${profileName}-ldap`,
      host: server,
      port: 389,
      bindDn,
      bindPassword,
      searchBase,
      searchScope: 'sub',
      userTemplate: '%s'
    });
  }

  /**
   * Configure Kerberos authentication
   */
  async configureKerberos(realm: string, kdc: string): Promise<void> {
    const profileName = F5_CONFIG.APM.ACCESS_PROFILE;
    
    await this.client.post('tm/apm/aaa/kerberos-auth', {
      name: `${profileName}-kerberos`,
      realm,
      kdc
    });
  }

  /**
   * Get per-request policy
   */
  async getPerRequestPolicy(): Promise<any> {
    try {
      const policyName = F5_CONFIG.APM.PER_REQUEST_POLICY;
      return await this.client.get(`tm/apm/policy/per-request-policy/~Common~${policyName}`);
    } catch (error) {
      logger.error('Failed to get per-request policy', error);
      return null;
    }
  }

  /**
   * Get per-request policy rules (Layer 3 SWG policies)
   */
  async getPerRequestRules(): Promise<APMPerRequestRule[]> {
    try {
      const policy = await this.getPerRequestPolicy();
      
      if (policy?.rules) {
        return policy.rules.map((rule: any) => ({
          name: rule.name,
          condition: {
            type: this.mapConditionType(rule.condition?.type),
            operator: rule.condition?.operator || 'contains',
            value: rule.condition?.value || ''
          },
          action: this.mapAction(rule.action),
          enabled: rule.enabled !== false
        }));
      }

      return [];
    } catch (error) {
      return [];
    }
  }

  /**
   * Map condition type
   */
  private mapConditionType(type: string): 'category' | 'url' | 'user' | 'ip' {
    const typeMap: Record<string, 'category' | 'url' | 'user' | 'ip'> = {
      'category': 'category',
      'url': 'url',
      'user': 'user',
      'ip': 'ip',
      'source-ip': 'ip'
    };
    return typeMap[type] || 'url';
  }

  /**
   * Map action
   */
  private mapAction(action: string): 'allow' | 'block' | 'authenticate' {
    const actionMap: Record<string, 'allow' | 'block' | 'authenticate'> = {
      'allow': 'allow',
      'block': 'block',
      'reject': 'block',
      'authenticate': 'authenticate',
      'require-auth': 'authenticate'
    };
    return actionMap[action] || 'allow';
  }

  /**
   * Create per-request policy rule
   */
  async createPerRequestRule(rule: APMPerRequestRule): Promise<void> {
    const policyName = F5_CONFIG.APM.PER_REQUEST_POLICY;
    
    await this.client.post(
      `tm/apm/policy/per-request-policy/~Common~${policyName}/rules`,
      {
        name: rule.name,
        condition: this.buildCondition(rule.condition),
        action: rule.action,
        enabled: rule.enabled
      }
    );
  }

  /**
   * Build condition object
   */
  private buildCondition(condition: APMPerRequestRule['condition']): any {
    return {
      type: condition.type,
      operator: condition.operator,
      value: condition.value
    };
  }

  /**
   * Update per-request policy rule
   */
  async updatePerRequestRule(ruleName: string, updates: Partial<APMPerRequestRule>): Promise<void> {
    const policyName = F5_CONFIG.APM.PER_REQUEST_POLICY;
    
    const payload: any = {};
    if (updates.condition) payload.condition = this.buildCondition(updates.condition);
    if (updates.action) payload.action = updates.action;
    if (updates.enabled !== undefined) payload.enabled = updates.enabled;

    await this.client.patch(
      `tm/apm/policy/per-request-policy/~Common~${policyName}/rules/${ruleName}`,
      payload
    );
  }

  /**
   * Delete per-request policy rule
   */
  async deletePerRequestRule(ruleName: string): Promise<void> {
    const policyName = F5_CONFIG.APM.PER_REQUEST_POLICY;
    
    await this.client.delete(
      `tm/apm/policy/per-request-policy/~Common~${policyName}/rules/${ruleName}`
    );
  }

  /**
   * Get active sessions
   */
  async getActiveSessions(): Promise<APMSession[]> {
    try {
      const response = await this.client.get('tm/apm/session');
      
      return (response.items || []).map((session: any) => ({
        id: session.sessionId,
        user: session.userName,
        clientIp: session.clientIp,
        startTime: session.created,
        status: session.status === 'active' ? 'active' : 'terminated'
      }));
    } catch (error) {
      return [];
    }
  }

  /**
   * Terminate session
   */
  async terminateSession(sessionId: string): Promise<void> {
    await this.client.delete(`tm/apm/session/${sessionId}`);
  }

  /**
   * Get deny users list
   */
  async getDenyUsers(): Promise<string[]> {
    try {
      const response = await this.client.get(
        `tm/ltm/data-group/internal/~Common~${F5_CONFIG.DATA_GROUPS.DENY_USERS}`
      );
      
      return (response.records || []).map((r: any) => r.name);
    } catch (error) {
      return [];
    }
  }

  /**
   * Update deny users list
   */
  async updateDenyUsers(users: string[]): Promise<void> {
    const dgName = F5_CONFIG.DATA_GROUPS.DENY_USERS;
    const records = users.map(user => ({ name: user, data: '' }));

    try {
      await this.client.patch(
        `tm/ltm/data-group/internal/~Common~${dgName}`,
        { records }
      );
    } catch (error: any) {
      if (error.message?.includes('not found')) {
        await this.client.post('tm/ltm/data-group/internal', {
          name: dgName,
          type: 'string',
          records
        });
      } else {
        throw error;
      }
    }
  }

  /**
   * Test APM connectivity
   */
  async testConnectivity(): Promise<{ success: boolean; message: string }> {
    try {
      await this.client.get('tm/apm/profile/access');
      return { success: true, message: 'Successfully connected to APM' };
    } catch (error: any) {
      return { success: false, message: error.message };
    }
  }
}

// Singleton instance
let apmService: APMService | null = null;

export function getAPMService(): APMService {
  if (!apmService) {
    apmService = new APMService();
  }
  return apmService;
}
