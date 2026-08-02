/**
 * F5 Secure Web Gateway (SWG) Service
 * Manages SWG configuration via iControl REST API
 */

import { getF5Client, type F5iControlClient } from './icontrol-client';
import { F5_CONFIG } from './config';
import { logger } from '$lib/server/logger';

export interface SWGExplicitProxyConfig {
  ip: string;
  port: number;
  enabled: boolean;
  vlans: string[];
}

export interface SWGSSLConfig {
  intercept: boolean;
  caCert: string;
  bypassList: string[];
}

export interface SWGAuthenticationConfig {
  enabled: boolean;
  scheme: 'ntlm' | 'kerberos' | 'basic' | 'ldap';
  realm: string;
}

export class SWGService {
  private client: F5iControlClient;

  constructor(client: F5iControlClient = getF5Client()) {
    this.client = client;
  }

  /**
   * Get SWG explicit proxy virtual server configuration
   */
  async getExplicitProxyConfig(): Promise<SWGExplicitProxyConfig> {
    try {
      const vsName = F5_CONFIG.SWG.EXPLICIT_PROXY_VS;
      const response = await this.client.get(`tm/ltm/virtual/~Common~${vsName}`);
      
      return {
        ip: response.destination?.split(':')[0]?.replace('/Common/', '') || F5_CONFIG.SWG.EXPLICIT_PROXY_IP,
        port: parseInt(response.destination?.split(':')[1]) || F5_CONFIG.SWG.EXPLICIT_PROXY_PORT,
        enabled: response.enabled !== 'false',
        vlans: response.vlans?.map((v: string) => v.replace('/Common/', '')) || ['vlan30', 'vlan40']
      };
    } catch (error) {
      logger.error('Failed to get explicit proxy config', error);
      // Return default config
      return {
        ip: F5_CONFIG.SWG.EXPLICIT_PROXY_IP,
        port: F5_CONFIG.SWG.EXPLICIT_PROXY_PORT,
        enabled: true,
        vlans: ['vlan30', 'vlan40']
      };
    }
  }

  /**
   * Update explicit proxy virtual server
   */
  async updateExplicitProxyConfig(config: Partial<SWGExplicitProxyConfig>): Promise<void> {
    const vsName = F5_CONFIG.SWG.EXPLICIT_PROXY_VS;
    const current = await this.getExplicitProxyConfig();
    const updated = { ...current, ...config };

    const payload: any = {
      destination: `${updated.ip}:${updated.port}`,
      enabled: updated.enabled,
    };

    if (updated.vlans?.length > 0) {
      payload.vlans = updated.vlans.map(v => `/Common/${v}`);
      payload.vlansEnabled = true;
    }

    await this.client.patch(`tm/ltm/virtual/~Common~${vsName}`, payload);
  }

  /**
   * Get SSL intercept configuration
   */
  async getSSLConfig(): Promise<SWGSSLConfig> {
    try {
      const profileName = F5_CONFIG.SSL.INTERCEPT_PROFILE;
      const response = await this.client.get(`tm/ltm/profile/client-ssl/~Common~${profileName}`);
      
      // Get bypass list from data group
      const bypassDg = await this.getDataGroupRecords(F5_CONFIG.DATA_GROUPS.SSL_BYPASS);
      
      return {
        intercept: response.certKeyChain?.length > 0 || false,
        caCert: response.certKeyChain?.[0]?.name || F5_CONFIG.SSL.CA_CERT,
        bypassList: bypassDg.map((r: any) => r.name)
      };
    } catch (error) {
      logger.error('Failed to get SSL config', error);
      return {
        intercept: true,
        caCert: F5_CONFIG.SSL.CA_CERT,
        bypassList: []
      };
    }
  }

  /**
   * Get data group records
   */
  private async getDataGroupRecords(dgName: string): Promise<any[]> {
    try {
      const response = await this.client.get(`tm/ltm/data-group/internal/~Common~${dgName}`);
      return response.records || [];
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
      // Try to update existing data group
      await this.client.patch(`tm/ltm/data-group/internal/~Common~${dgName}`, { records });
    } catch (error: any) {
      if (error.message?.includes('not found')) {
        // Create new data group
        await this.client.createDataGroup(dgName, 'string', records);
      } else {
        throw error;
      }
    }
  }

  /**
   * Get blocked URLs from data group
   */
  async getBlockedUrls(): Promise<string[]> {
    const records = await this.getDataGroupRecords(F5_CONFIG.DATA_GROUPS.BLOCKED_URLS);
    return records.map((r: any) => r.name);
  }

  /**
   * Update blocked URLs data group
   */
  async updateBlockedUrls(urls: string[]): Promise<void> {
    const dgName = F5_CONFIG.DATA_GROUPS.BLOCKED_URLS;
    const records = urls.map(url => ({ name: url, data: '' }));

    try {
      await this.client.patch(`tm/ltm/data-group/internal/~Common~${dgName}`, { records });
    } catch (error: any) {
      if (error.message?.includes('not found')) {
        await this.client.createDataGroup(dgName, 'string', records);
      } else {
        throw error;
      }
    }
  }

  /**
   * Get APM access profile configuration
   */
  async getAuthenticationConfig(): Promise<SWGAuthenticationConfig> {
    try {
      const profileName = F5_CONFIG.APM.ACCESS_PROFILE;
      const response = await this.client.get(`tm/apm/profile/access/~Common~${profileName}`);
      
      return {
        enabled: response.enabled !== 'false',
        scheme: this.detectAuthScheme(response),
        realm: F5_CONFIG.APM.NTLM_AUTH.DOMAIN
      };
    } catch (error) {
      return {
        enabled: F5_CONFIG.APM.ENABLED,
        scheme: 'ntlm',
        realm: F5_CONFIG.APM.NTLM_AUTH.DOMAIN
      };
    }
  }

  /**
   * Detect authentication scheme from profile
   */
  private detectAuthScheme(profile: any): 'ntlm' | 'kerberos' | 'basic' | 'ldap' {
    // This would analyze the access policy to determine the auth scheme
    // For now, return configured default
    return 'ntlm';
  }

  /**
   * Get SWG statistics
   */
  async getStatistics(): Promise<any> {
    try {
      const vsName = F5_CONFIG.SWG.EXPLICIT_PROXY_VS;
      const response = await this.client.get(`tm/ltm/virtual/~Common~${vsName}/stats`);
      
      return {
        connections: response.entries?.[`https://localhost/mgmt/tm/ltm/virtual/~Common~${vsName}/stats`]?.nestedStats?.entries?.connections?.value || 0,
        bytesIn: response.entries?.[`https://localhost/mgmt/tm/ltm/virtual/~Common~${vsName}/stats`]?.nestedStats?.entries?.['serverside.bitsIn']?.value || 0,
        bytesOut: response.entries?.[`https://localhost/mgmt/tm/ltm/virtual/~Common~${vsName}/stats`]?.nestedStats?.entries?.['serverside.bitsOut']?.value || 0,
      };
    } catch (error) {
      return { connections: 0, bytesIn: 0, bytesOut: 0 };
    }
  }

  /**
   * Test connectivity to F5
   */
  async testConnectivity(): Promise<{ success: boolean; message: string }> {
    try {
      await this.client.getDeviceInfo();
      return { success: true, message: 'Successfully connected to F5 BIG-IP' };
    } catch (error: any) {
      return { success: false, message: error.message };
    }
  }
}

// Singleton instance
let swgService: SWGService | null = null;

export function getSWGService(): SWGService {
  if (!swgService) {
    swgService = new SWGService();
  }
  return swgService;
}
