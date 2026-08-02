/**
 * F5 Application Services 3 (AS3) Extension Service
 * Manages declarative configuration deployment via AS3
 */

import { getF5Client, type F5iControlClient } from './icontrol-client';
import { F5_CONFIG } from './config';

export interface AS3Declaration {
  class: 'AS3';
  action: 'deploy' | 'dry-run' | 'delete';
  persist: boolean;
  declaration: AS3Tenant;
}

export interface AS3Tenant {
  class: 'ADC' | 'Tenant';
  [key: string]: any;
}

export interface AS3Application {
  class: 'Application';
  template: 'generic' | 'https' | 'http' | 'tcp';
  [key: string]: any;
}

export class AS3Service {
  private client: F5iControlClient;
  private baseUrl: string;

  constructor(client: F5iControlClient = getF5Client()) {
    this.client = client;
    this.baseUrl = F5_CONFIG.AS3.API_URL;
  }

  /**
   * Get AS3 info
   */
  async getInfo(): Promise<any> {
    return this.client.get('shared/appsvcs/info');
  }

  /**
   * Deploy AS3 declaration
   */
  async deploy(declaration: AS3Declaration): Promise<{ success: boolean; message: string; details?: any }> {
    try {
      const response = await this.client.post('shared/appsvcs/declare', declaration);
      
      return {
        success: true,
        message: 'AS3 declaration deployed successfully',
        details: response
      };
    } catch (error: any) {
      return {
        success: false,
        message: error.message,
        details: error
      };
    }
  }

  /**
   * Get current declaration
   */
  async getDeclaration(tenant?: string): Promise<any> {
    const endpoint = tenant 
      ? `shared/appsvcs/declare/${tenant}`
      : 'shared/appsvcs/declare';
    
    return this.client.get(endpoint);
  }

  /**
   * Delete tenant
   */
  async deleteTenant(tenantName: string): Promise<{ success: boolean; message: string }> {
    try {
      await this.client.delete(`shared/appsvcs/declare/${tenantName}`);
      return {
        success: true,
        message: `Tenant ${tenantName} deleted successfully`
      };
    } catch (error: any) {
      return {
        success: false,
        message: error.message
      };
    }
  }

  /**
   * Deploy virtual server configuration
   */
  async deployVirtualServer(config: {
    name: string;
    ip: string;
    port: number;
    poolMembers?: Array<{ ip: string; port?: number; weight?: number }>;
    ssl?: boolean;
    profiles?: string[];
  }): Promise<{ success: boolean; message: string; details?: any }> {
    try {
      const tenant = F5_CONFIG.AS3.TENANT;
      const app = F5_CONFIG.AS3.APPLICATION;
      const poolName = `${config.name}_pool`;

      const declaration: AS3Declaration = {
        class: 'AS3',
        action: 'deploy',
        persist: true,
        declaration: {
          class: 'ADC',
          schemaVersion: '3.43.0',
          id: `vs-${config.name}`,
          label: `Virtual Server ${config.name}`,
          remark: `Virtual server deployed via Circuit Breaker Portal`,
          [tenant]: {
            class: 'Tenant',
            [app]: {
              class: 'Application',
              template: 'generic',
              
              // Pool
              [poolName]: config.poolMembers && config.poolMembers.length > 0 ? {
                class: 'Pool',
                loadBalancingMode: 'round-robin',
                members: config.poolMembers.map(member => ({
                  servicePort: member.port || config.port,
                  serverAddresses: [member.ip],
                  ratio: member.weight || 1
                }))
              } : undefined,

              // Virtual Server
              [config.name]: {
                class: config.ssl ? 'Service_HTTPS' : 'Service_HTTP',
                virtualAddresses: [config.ip],
                virtualPort: config.port,
                pool: config.poolMembers && config.poolMembers.length > 0 ? { use: poolName } : undefined,
                profileTCP: { use: '/Common/tcp' },
                profileHTTP: config.ssl ? undefined : { use: '/Common/http' },
                serverTLS: config.ssl ? { use: '/Common/clientssl' } : undefined
              }
            }
          }
        }
      };

      return this.deploy(declaration);
    } catch (error: any) {
      return {
        success: false,
        message: error.message,
        details: error
      };
    }
  }

  /**
   * Build SWG AS3 declaration
   */
  buildSWGDeclaration(config: {
    proxyIp: string;
    proxyPort: number;
    vlans: string[];
    sslIntercept: boolean;
    authEnabled: boolean;
  }): AS3Declaration {
    const tenant = F5_CONFIG.AS3.TENANT;
    const app = F5_CONFIG.AS3.APPLICATION;
    const vsName = F5_CONFIG.SWG.EXPLICIT_PROXY_VS;

    return {
      class: 'AS3',
      action: 'deploy',
      persist: true,
      declaration: {
        class: 'ADC',
        schemaVersion: '3.43.0',
        id: 'swg-declaration',
        label: 'Secure Web Gateway',
        remark: 'SWG Configuration deployed via Circuit Breaker Portal',
        [tenant]: {
          class: 'Tenant',
          [app]: {
            class: 'Application',
            template: 'generic',
            
            // Explicit Proxy Virtual Server
            [vsName]: {
              class: 'Service_HTTP',
              virtualAddresses: [config.proxyIp],
              virtualPort: config.proxyPort,
              vlans: config.vlans.map(v => ({ use: v })),
              profileHTTP: {
                use: '/Common/swg-forward-proxy'
              },
              profileTCP: {
                use: '/Common/tcp-lan-optimized'
              },
              policyIAM: config.authEnabled ? {
                use: '/Common/swg-access-policy'
              } : undefined,
              securityLogProfiles: [{
                use: '/Common/swg-request-logging'
              }]
            },

            // VLANs
            ...config.vlans.reduce((acc, vlan) => ({
              ...acc,
              [vlan]: {
                class: 'VLAN',
                mtu: 1500,
                tag: parseInt(vlan.replace('vlan', '')) || 0,
                interfaces: [{
                  name: '1.1',
                  tagged: true
                }]
              }
            }), {})
          }
        }
      }
    };
  }

  /**
   * Build SSLO AS3 declaration
   */
  buildSSLODeclaration(topology: {
    name: string;
    type: 'explicit-proxy' | 'transparent-proxy';
    vlans: string[];
    services: string[];
  }): AS3Declaration {
    const tenant = F5_CONFIG.AS3.TENANT;
    const app = F5_CONFIG.AS3.APPLICATION;

    return {
      class: 'AS3',
      action: 'deploy',
      persist: true,
      declaration: {
        class: 'ADC',
        schemaVersion: '3.43.0',
        id: 'sslo-declaration',
        label: 'SSL Orchestrator',
        remark: 'SSLO Configuration deployed via Circuit Breaker Portal',
        [tenant]: {
          class: 'Tenant',
          [app]: {
            class: 'Application',
            template: 'generic',
            
            // SSLO Topology
            [topology.name]: {
              class: 'Service_Generic',
              virtualAddresses: ['0.0.0.0'],
              virtualPort: 0,
              vlans: topology.vlans.map(v => ({ use: v })),
              // Additional SSLO-specific configuration would go here
            }
          }
        }
      }
    };
  }

  /**
   * Deploy SWG configuration via AS3
   */
  async deploySWG(config: {
    proxyIp: string;
    proxyPort: number;
    vlans: string[];
    sslIntercept: boolean;
    authEnabled: boolean;
  }): Promise<{ success: boolean; message: string; details?: any }> {
    const declaration = this.buildSWGDeclaration(config);
    return this.deploy(declaration);
  }

  /**
   * Deploy SSLO configuration via AS3
   */
  async deploySSLO(topology: {
    name: string;
    type: 'explicit-proxy' | 'transparent-proxy';
    vlans: string[];
    services: string[];
  }): Promise<{ success: boolean; message: string; details?: any }> {
    const declaration = this.buildSSLODeclaration(topology);
    return this.deploy(declaration);
  }

  /**
   * Validate AS3 declaration (dry-run)
   */
  async validate(declaration: AS3Declaration): Promise<{ success: boolean; message: string; errors?: string[] }> {
    try {
      const dryRunDeclaration = {
        ...declaration,
        action: 'dry-run'
      };

      const response = await this.client.post('shared/appsvcs/declare', dryRunDeclaration);
      
      return {
        success: true,
        message: 'AS3 declaration is valid'
      };
    } catch (error: any) {
      return {
        success: false,
        message: 'AS3 declaration validation failed',
        errors: [error.message]
      };
    }
  }

  /**
   * Get AS3 task status
   */
  async getTaskStatus(taskId: string): Promise<any> {
    return this.client.get(`shared/appsvcs/task/${taskId}`);
  }

  /**
   * Test AS3 connectivity
   */
  async testConnectivity(): Promise<{ success: boolean; message: string; version?: string }> {
    try {
      const info = await this.getInfo();
      return {
        success: true,
        message: 'Successfully connected to AS3',
        version: info.version
      };
    } catch (error: any) {
      return {
        success: false,
        message: error.message
      };
    }
  }
}

// Singleton instance
let as3Service: AS3Service | null = null;

export function getAS3Service(): AS3Service {
  if (!as3Service) {
    as3Service = new AS3Service();
  }
  return as3Service;
}
