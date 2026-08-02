/**
 * F5 SSL Orchestrator (SSLO) Service
 * Manages SSLO configuration and policies
 */

import { getF5Client, type F5iControlClient } from './icontrol-client';
import { F5_CONFIG } from './config';
import { logger } from '$lib/server/logger';

export interface SSLOTopology {
  name: string;
  type: 'explicit-proxy' | 'transparent-proxy';
  enabled: boolean;
  vlans: string[];
}

export interface SSLOServiceChain {
  name: string;
  services: string[];
}

export interface SSLORule {
  name: string;
  condition: string;
  action: 'intercept' | 'bypass' | 'reject';
  enabled: boolean;
}

export class SSLOService {
  private client: F5iControlClient;
  private baseUrl: string;

  constructor(client: F5iControlClient = getF5Client()) {
    this.client = client;
    this.baseUrl = F5_CONFIG.SSLO.API_URL;
  }

  /**
   * Get SSLO topology configuration
   */
  async getTopology(): Promise<SSLOTopology> {
    try {
      const response = await this.client.get(
        `shared/ssl-orchestrator/topology/${F5_CONFIG.SSLO.TOPOLOGY_NAME}`
      );

      return {
        name: response.name || F5_CONFIG.SSLO.TOPOLOGY_NAME,
        type: response.proxyMode || 'explicit-proxy',
        enabled: response.enabled !== false,
        vlans: response.vlans || ['vlan30', 'vlan40']
      };
    } catch (error) {
      logger.error('Failed to get SSLO topology', error);
      return {
        name: F5_CONFIG.SSLO.TOPOLOGY_NAME,
        type: 'explicit-proxy',
        enabled: true,
        vlans: ['vlan30', 'vlan40']
      };
    }
  }

  /**
   * Update SSLO topology
   */
  async updateTopology(config: Partial<SSLOTopology>): Promise<void> {
    const payload = {
      name: config.name || F5_CONFIG.SSLO.TOPOLOGY_NAME,
      enabled: config.enabled,
      vlans: config.vlans
    };

    await this.client.patch(
      `shared/ssl-orchestrator/topology/${F5_CONFIG.SSLO.TOPOLOGY_NAME}`,
      payload
    );
  }

  /**
   * Get service chain configuration
   */
  async getServiceChain(): Promise<SSLOServiceChain> {
    try {
      const response = await this.client.get(
        `shared/ssl-orchestrator/service-chain/${F5_CONFIG.SSLO.SERVICE_CHAIN}`
      );

      return {
        name: response.name || F5_CONFIG.SSLO.SERVICE_CHAIN,
        services: response.services || []
      };
    } catch (error) {
      return {
        name: F5_CONFIG.SSLO.SERVICE_CHAIN,
        services: []
      };
    }
  }

  /**
   * Get Layer 2 (SSLO) security policies
   */
  async getSecurityPolicies(): Promise<SSLORule[]> {
    try {
      // Get policy rules from SSLO
      const response = await this.client.get(
        `shared/ssl-orchestrator/policy/${F5_CONFIG.SSLO.TOPOLOGY_NAME}-policy`
      );

      if (response.rules) {
        return response.rules.map((rule: any) => ({
          name: rule.name,
          condition: rule.condition,
          action: this.mapSSLOAction(rule.action),
          enabled: rule.enabled !== false
        }));
      }

      return [];
    } catch (error) {
      logger.error('Failed to get SSLO policies', error);
      return [];
    }
  }

  /**
   * Map SSLO action to standard action
   */
  private mapSSLOAction(action: string): 'intercept' | 'bypass' | 'reject' {
    const actionMap: Record<string, 'intercept' | 'bypass' | 'reject'> = {
      'intercept': 'intercept',
      'bypass': 'bypass',
      'reject': 'reject',
      'drop': 'reject',
      'allow': 'bypass'
    };
    return actionMap[action] || 'intercept';
  }

  /**
   * Create or update SSLO security policy rule
   */
  async createPolicyRule(rule: SSLORule): Promise<void> {
    const policyName = `${F5_CONFIG.SSLO.TOPOLOGY_NAME}-policy`;
    
    const payload = {
      name: rule.name,
      condition: rule.condition,
      action: rule.action,
      enabled: rule.enabled
    };

    await this.client.post(
      `shared/ssl-orchestrator/policy/${policyName}/rules`,
      payload
    );
  }

  /**
   * Update existing policy rule
   */
  async updatePolicyRule(ruleName: string, updates: Partial<SSLORule>): Promise<void> {
    const policyName = `${F5_CONFIG.SSLO.TOPOLOGY_NAME}-policy`;
    
    await this.client.patch(
      `shared/ssl-orchestrator/policy/${policyName}/rules/${ruleName}`,
      updates
    );
  }

  /**
   * Delete policy rule
   */
  async deletePolicyRule(ruleName: string): Promise<void> {
    const policyName = `${F5_CONFIG.SSLO.TOPOLOGY_NAME}-policy`;
    
    await this.client.delete(
      `shared/ssl-orchestrator/policy/${policyName}/rules/${ruleName}`
    );
  }

  /**
   * Get SSL bypass data group (used by SSLO)
   */
  async getSSLBypassList(): Promise<string[]> {
    try {
      const response = await this.client.get(
        `tm/ltm/data-group/internal/~Common~${F5_CONFIG.DATA_GROUPS.SSL_BYPASS}`
      );
      
      return (response.records || []).map((r: any) => r.name);
    } catch (error) {
      return [];
    }
  }

  /**
   * Update SSL bypass list
   */
  async updateSSLBypassList(urls: string[]): Promise<void> {
    const dgName = F5_CONFIG.DATA_GROUPS.SSL_BYPASS;
    const records = urls.map(url => ({ name: url, data: '' }));

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
   * Get SSLO statistics
   */
  async getStatistics(): Promise<any> {
    try {
      const response = await this.client.get(
        `shared/ssl-orchestrator/topology/${F5_CONFIG.SSLO.TOPOLOGY_NAME}/stats`
      );

      return {
        connections: response.connections || 0,
        intercepted: response.intercepted || 0,
        bypassed: response.bypassed || 0,
        rejected: response.rejected || 0
      };
    } catch (error) {
      return { connections: 0, intercepted: 0, bypassed: 0, rejected: 0 };
    }
  }

  /**
   * Deploy SSLO configuration changes
   */
  async deploy(): Promise<{ success: boolean; message: string }> {
    try {
      await this.client.post(
        'shared/ssl-orchestrator/deploy',
        {
          topologies: [F5_CONFIG.SSLO.TOPOLOGY_NAME],
          services: [],
          serviceChains: [F5_CONFIG.SSLO.SERVICE_CHAIN]
        }
      );

      return { success: true, message: 'SSLO configuration deployed successfully' };
    } catch (error: any) {
      return { success: false, message: error.message };
    }
  }

  /**
   * Test SSLO connectivity
   */
  async testConnectivity(): Promise<{ success: boolean; message: string }> {
    try {
      await this.client.get('shared/ssl-orchestrator/info');
      return { success: true, message: 'Successfully connected to SSLO API' };
    } catch (error: any) {
      return { success: false, message: error.message };
    }
  }
}

// Singleton instance
let ssloService: SSLOService | null = null;

export function getSSLOService(): SSLOService {
  if (!ssloService) {
    ssloService = new SSLOService();
  }
  return ssloService;
}
