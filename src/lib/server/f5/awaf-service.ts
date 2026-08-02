/**
 * F5 Advanced WAF (AWAF) Service
 * Manages WAF policies, attack signatures, security events, and threat protection
 */

import { getF5Client, type F5iControlClient } from './icontrol-client';
import { F5_CONFIG } from './config';
import { logger } from '../logger';

export interface WAFPolicy {
  id: string;
  name: string;
  description?: string;
  template: 'rapid_deployment' | 'fundamental' | 'enhanced' | 'comprehensive' | 'custom';
  enforcementMode: 'transparent' | 'blocking';
  language: string;
  serverTechnologies: string[];
  signatureSet?: string;
  virtualServers: string[];
  createdAt: string;
  modifiedAt: string;
  status: 'active' | 'inactive' | 'pending';
  compliance?: {
    pciDss: boolean;
    gdpr: boolean;
    hipaa: boolean;
    sox: boolean;
  };
}

export interface AttackSignature {
  id: string;
  name: string;
  signatureId: number;
  category: 'sql_injection' | 'xss' | 'command_execution' | 'path_traversal' | 'csrf' | 'xml_injection' | 'ldap_injection' | 'other';
  severity: 'critical' | 'high' | 'medium' | 'low' | 'info';
  accuracy: 'high' | 'medium' | 'low';
  risk: 'high' | 'medium' | 'low';
  enabled: boolean;
  autoLearn: boolean;
  description: string;
  lastUpdate: string;
}

export interface SecurityEvent {
  id: string;
  timestamp: string;
  policyId: string;
  policyName: string;
  violation: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
  clientIp: string;
  clientPort: number;
  serverIp: string;
  serverPort: number;
  method: string;
  uri: string;
  protocol: string;
  action: 'blocked' | 'alerted' | 'learned';
  request: string;
  details?: Record<string, any>;
  geoInfo?: {
    country: string;
    region: string;
    city: string;
    latitude: number;
    longitude: number;
  };
}

export interface IPReputation {
  ip: string;
  reputationScore: number; // 0-100, higher is worse
  category: string[];
  lastSeen: string;
  threatLevel: 'critical' | 'high' | 'medium' | 'low';
  action: 'block' | 'challenge' | 'monitor' | 'allow';
}

export interface GeoBlockingRule {
  id: string;
  countryCode: string;
  countryName: string;
  action: 'allow' | 'block' | 'challenge';
  whitelist?: string[]; // Specific IPs to whitelist
  blacklist?: string[]; // Specific IPs to blacklist
  enabled: boolean;
}

export interface ThreatIntelligenceFeed {
  id: string;
  name: string;
  provider: string;
  type: 'malware' | 'botnet' | 'phishing' | 'anonymous_proxy' | 'tor_exit' | 'custom';
  updateInterval: number; // minutes
  lastUpdate: string;
  enabled: boolean;
  entryCount: number;
}

export interface BotDefenseConfig {
  enabled: boolean;
  mode: 'off' | 'transparent' | 'blocking';
  categories: {
    name: string;
    action: 'block' | 'challenge' | 'allow' | 'detect';
    enabled: boolean;
  }[];
  challenges: {
    javascriptInjection: boolean;
    captcha: boolean;
    deviceFingerprinting: boolean;
  };
}

export interface Violation {
  name: string;
  description: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
  alarm: boolean;
  block: boolean;
  learn: boolean;
}

export class AWAFService {
  private client: F5iControlClient;

  constructor(client: F5iControlClient = getF5Client()) {
    this.client = client;
  }

  // ==================== Policy Management ====================

  /**
   * Get all WAF policies
   */
  async getPolicies(): Promise<WAFPolicy[]> {
    try {
      const response = await this.client.get('tm/asm/policies');
      return response.items?.map(this.mapPolicyFromF5) ?? [];
    } catch (error: any) {
      logger.error('Failed to get WAF policies', { error: error.message });
      return this.getMockPolicies();
    }
  }

  /**
   * Get a specific WAF policy
   */
  async getPolicy(id: string): Promise<WAFPolicy | null> {
    try {
      const response = await this.client.get(`tm/asm/policies/${id}`);
      return this.mapPolicyFromF5(response);
    } catch (error: any) {
      logger.error(`Failed to get WAF policy ${id}`, { error: error.message });
      return null;
    }
  }

  /**
   * Create a new WAF policy
   */
  async createPolicy(policy: Omit<WAFPolicy, 'id' | 'createdAt' | 'modifiedAt'>): Promise<WAFPolicy> {
    try {
      const f5Policy = {
        name: policy.name,
        description: policy.description,
        template: this.mapTemplateToF5(policy.template),
        enforcementMode: policy.enforcementMode,
        language: policy.language || 'utf-8',
        serverTechnologies: policy.serverTechnologies || []
      };

      const response = await this.client.post('tm/asm/policies', f5Policy);
      logger.info(`Created WAF policy: ${policy.name}`);
      
      return this.mapPolicyFromF5(response);
    } catch (error: any) {
      logger.error('Failed to create WAF policy', { error: error.message, policy });
      throw new Error(`Failed to create WAF policy: ${error.message}`);
    }
  }

  /**
   * Update a WAF policy
   */
  async updatePolicy(id: string, updates: Partial<WAFPolicy>): Promise<WAFPolicy> {
    try {
      const f5Updates: Record<string, any> = {};
      if (updates.name) f5Updates.name = updates.name;
      if (updates.description) f5Updates.description = updates.description;
      if (updates.enforcementMode) f5Updates.enforcementMode = updates.enforcementMode;
      if (updates.serverTechnologies) f5Updates.serverTechnologies = updates.serverTechnologies;

      const response = await this.client.patch(`tm/asm/policies/${id}`, f5Updates);
      logger.info(`Updated WAF policy: ${id}`);
      
      return this.mapPolicyFromF5(response);
    } catch (error: any) {
      logger.error(`Failed to update WAF policy ${id}`, { error: error.message });
      throw new Error(`Failed to update WAF policy: ${error.message}`);
    }
  }

  /**
   * Delete a WAF policy
   */
  async deletePolicy(id: string): Promise<void> {
    try {
      await this.client.delete(`tm/asm/policies/${id}`);
      logger.info(`Deleted WAF policy: ${id}`);
    } catch (error: any) {
      logger.error(`Failed to delete WAF policy ${id}`, { error: error.message });
      throw new Error(`Failed to delete WAF policy: ${error.message}`);
    }
  }

  /**
   * Apply policy to virtual server
   */
  async attachToVirtualServer(policyId: string, virtualServerName: string): Promise<void> {
    try {
      // Get the virtual server and attach the policy
      await this.client.patch(`tm/ltm/virtual/${virtualServerName}`, {
        policies: [{ name: policyId }]
      });
      logger.info(`Attached WAF policy ${policyId} to virtual server ${virtualServerName}`);
    } catch (error: any) {
      logger.error(`Failed to attach WAF policy to virtual server`, { error: error.message });
      throw new Error(`Failed to attach policy: ${error.message}`);
    }
  }

  /**
   * Remove policy from virtual server
   */
  async detachFromVirtualServer(policyId: string, virtualServerName: string): Promise<void> {
    try {
      const vs = await this.client.get(`tm/ltm/virtual/${virtualServerName}`);
      const updatedPolicies = (vs.policies || []).filter((p: any) => p.name !== policyId);
      
      await this.client.patch(`tm/ltm/virtual/${virtualServerName}`, {
        policies: updatedPolicies
      });
      logger.info(`Detached WAF policy ${policyId} from virtual server ${virtualServerName}`);
    } catch (error: any) {
      logger.error(`Failed to detach WAF policy from virtual server`, { error: error.message });
      throw new Error(`Failed to detach policy: ${error.message}`);
    }
  }

  // ==================== Attack Signatures ====================

  /**
   * Get all attack signatures
   */
  async getSignatures(policyId?: string): Promise<AttackSignature[]> {
    try {
      if (policyId) {
        const response = await this.client.get(`tm/asm/policies/${policyId}/signatures`);
        return response.items?.map(this.mapSignatureFromF5) ?? [];
      }
      const response = await this.client.get('tm/asm/signatures');
      return response.items?.map(this.mapSignatureFromF5) ?? [];
    } catch (error: any) {
      logger.error('Failed to get attack signatures', { error: error.message });
      return this.getMockSignatures();
    }
  }

  /**
   * Update signature settings in a policy
   */
  async updateSignatureStatus(
    policyId: string, 
    signatureId: string, 
    enabled: boolean,
    autoLearn: boolean
  ): Promise<void> {
    try {
      await this.client.patch(`tm/asm/policies/${policyId}/signatures/${signatureId}`, {
        enabled,
        learn: autoLearn
      });
      logger.info(`Updated signature ${signatureId} in policy ${policyId}`);
    } catch (error: any) {
      logger.error(`Failed to update signature status`, { error: error.message });
      throw new Error(`Failed to update signature: ${error.message}`);
    }
  }

  // ==================== Security Events ====================

  /**
   * Get security events (violations/attacks)
   */
  async getSecurityEvents(options?: {
    policyId?: string;
    startTime?: string;
    endTime?: string;
    severity?: string;
    limit?: number;
  }): Promise<SecurityEvent[]> {
    try {
      const params = new URLSearchParams();
      if (options?.policyId) params.append('policyId', options.policyId);
      if (options?.startTime) params.append('startTime', options.startTime);
      if (options?.endTime) params.append('endTime', options.endTime);
      if (options?.severity) params.append('severity', options.severity);
      if (options?.limit) params.append('limit', options.limit.toString());

      const response = await this.client.get(`tm/asm/events?${params.toString()}`);
      return response.items?.map(this.mapEventFromF5) ?? [];
    } catch (error: any) {
      logger.error('Failed to get security events', { error: error.message });
      return this.getMockSecurityEvents();
    }
  }

  /**
   * Get security statistics
   */
  async getSecurityStats(timeRange: '1h' | '24h' | '7d' | '30d' = '24h'): Promise<{
    totalRequests: number;
    blockedRequests: number;
    alertedRequests: number;
    topViolations: { name: string; count: number }[];
    topAttackingIPs: { ip: string; count: number }[];
    topAttackedURLs: { url: string; count: number }[];
  }> {
    try {
      const response = await this.client.get(`tm/asm/stats?timeRange=${timeRange}`);
      return {
        totalRequests: response.totalRequests || 0,
        blockedRequests: response.blockedRequests || 0,
        alertedRequests: response.alertedRequests || 0,
        topViolations: response.topViolations || [],
        topAttackingIPs: response.topAttackingIPs || [],
        topAttackedURLs: response.topAttackedURLs || []
      };
    } catch (error: any) {
      logger.error('Failed to get security stats', { error: error.message });
      return this.getMockSecurityStats();
    }
  }

  // ==================== IP Intelligence & Geo-blocking ====================

  /**
   * Get IP reputation data
   */
  async getIPReputation(ip: string): Promise<IPReputation | null> {
    try {
      const response = await this.client.get(`tm/asm/ip-intelligence/${ip}`);
      return {
        ip: response.ip,
        reputationScore: response.reputationScore,
        category: response.categories || [],
        lastSeen: response.lastSeen,
        threatLevel: this.mapThreatLevel(response.reputationScore),
        action: this.mapReputationAction(response.reputationScore)
      };
    } catch (error: any) {
      logger.error(`Failed to get IP reputation for ${ip}`, { error: error.message });
      return null;
    }
  }

  /**
   * Block an IP address
   */
  async blockIP(ip: string, reason: string, duration?: number): Promise<void> {
    try {
      await this.client.post('tm/asm/blocked-ips', {
        ip,
        reason,
        duration: duration || 0 // 0 = permanent
      });
      logger.info(`Blocked IP ${ip}`, { reason, duration });
    } catch (error: any) {
      logger.error(`Failed to block IP ${ip}`, { error: error.message });
      throw new Error(`Failed to block IP: ${error.message}`);
    }
  }

  /**
   * Unblock an IP address
   */
  async unblockIP(ip: string): Promise<void> {
    try {
      await this.client.delete(`tm/asm/blocked-ips/${ip}`);
      logger.info(`Unblocked IP ${ip}`);
    } catch (error: any) {
      logger.error(`Failed to unblock IP ${ip}`, { error: error.message });
      throw new Error(`Failed to unblock IP: ${error.message}`);
    }
  }

  /**
   * Get geo-blocking rules
   */
  async getGeoBlockingRules(): Promise<GeoBlockingRule[]> {
    try {
      const response = await this.client.get('tm/asm/geo-blocking');
      return response.items?.map((item: any) => ({
        id: item.id,
        countryCode: item.countryCode,
        countryName: item.countryName,
        action: item.action,
        whitelist: item.whitelist || [],
        blacklist: item.blacklist || [],
        enabled: item.enabled
      })) ?? [];
    } catch (error: any) {
      logger.error('Failed to get geo-blocking rules', { error: error.message });
      return [];
    }
  }

  /**
   * Update geo-blocking rule
   */
  async updateGeoBlockingRule(rule: GeoBlockingRule): Promise<void> {
    try {
      await this.client.patch(`tm/asm/geo-blocking/${rule.id}`, {
        action: rule.action,
        whitelist: rule.whitelist,
        blacklist: rule.blacklist,
        enabled: rule.enabled
      });
      logger.info(`Updated geo-blocking rule for ${rule.countryName}`);
    } catch (error: any) {
      logger.error(`Failed to update geo-blocking rule`, { error: error.message });
      throw new Error(`Failed to update geo-blocking rule: ${error.message}`);
    }
  }

  // ==================== Bot Defense ====================

  /**
   * Get bot defense configuration
   */
  async getBotDefenseConfig(policyId: string): Promise<BotDefenseConfig> {
    try {
      const response = await this.client.get(`tm/asm/policies/${policyId}/bot-defense`);
      return {
        enabled: response.enabled,
        mode: response.mode,
        categories: response.categories || [],
        challenges: {
          javascriptInjection: response.challenges?.javascriptInjection || false,
          captcha: response.challenges?.captcha || false,
          deviceFingerprinting: response.challenges?.deviceFingerprinting || false
        }
      };
    } catch (error: any) {
      logger.error(`Failed to get bot defense config`, { error: error.message });
      return this.getDefaultBotDefenseConfig();
    }
  }

  /**
   * Update bot defense configuration
   */
  async updateBotDefenseConfig(policyId: string, config: BotDefenseConfig): Promise<void> {
    try {
      await this.client.patch(`tm/asm/policies/${policyId}/bot-defense`, {
        enabled: config.enabled,
        mode: config.mode,
        categories: config.categories,
        challenges: config.challenges
      });
      logger.info(`Updated bot defense config for policy ${policyId}`);
    } catch (error: any) {
      logger.error(`Failed to update bot defense config`, { error: error.message });
      throw new Error(`Failed to update bot defense config: ${error.message}`);
    }
  }

  // ==================== Violations ====================

  /**
   * Get violations configuration for a policy
   */
  async getViolations(policyId: string): Promise<Violation[]> {
    try {
      const response = await this.client.get(`tm/asm/policies/${policyId}/violations`);
      return response.items?.map((v: any) => ({
        name: v.name,
        description: v.description,
        severity: v.severity,
        alarm: v.alarm,
        block: v.block,
        learn: v.learn
      })) ?? [];
    } catch (error: any) {
      logger.error(`Failed to get violations`, { error: error.message });
      return [];
    }
  }

  /**
   * Update violation settings
   */
  async updateViolation(
    policyId: string, 
    violationName: string, 
    settings: { alarm?: boolean; block?: boolean; learn?: boolean }
  ): Promise<void> {
    try {
      await this.client.patch(`tm/asm/policies/${policyId}/violations/${violationName}`, settings);
      logger.info(`Updated violation ${violationName} in policy ${policyId}`);
    } catch (error: any) {
      logger.error(`Failed to update violation`, { error: error.message });
      throw new Error(`Failed to update violation: ${error.message}`);
    }
  }

  // ==================== Export/Import ====================

  /**
   * Export WAF policy
   */
  async exportPolicy(policyId: string, format: 'json' | 'xml' = 'json'): Promise<string> {
    try {
      const response = await this.client.get(`tm/asm/policies/${policyId}/export?format=${format}`);
      return response.content;
    } catch (error: any) {
      logger.error(`Failed to export policy ${policyId}`, { error: error.message });
      throw new Error(`Failed to export policy: ${error.message}`);
    }
  }

  /**
   * Import WAF policy
   */
  async importPolicy(content: string, name: string): Promise<WAFPolicy> {
    try {
      const response = await this.client.post('tm/asm/policies/import', {
        content,
        name
      });
      logger.info(`Imported WAF policy: ${name}`);
      return this.mapPolicyFromF5(response);
    } catch (error: any) {
      logger.error(`Failed to import WAF policy`, { error: error.message });
      throw new Error(`Failed to import policy: ${error.message}`);
    }
  }

  // ==================== Private Helpers ====================

  private mapPolicyFromF5(item: any): WAFPolicy {
    return {
      id: item.id || item.fullPath || item.name,
      name: item.name,
      description: item.description,
      template: this.mapTemplateFromF5(item.template),
      enforcementMode: item.enforcementMode || 'transparent',
      language: item.language || 'utf-8',
      serverTechnologies: item.serverTechnologies || [],
      virtualServers: item.virtualServers || [],
      createdAt: item.createTime || new Date().toISOString(),
      modifiedAt: item.lastUpdateTime || new Date().toISOString(),
      status: item.active === true ? 'active' : (item.active === false ? 'inactive' : 'pending'),
      compliance: {
        pciDss: item.pciCompliance || false,
        gdpr: item.gdprCompliance || false,
        hipaa: item.hipaaCompliance || false,
        sox: item.soxCompliance || false
      }
    };
  }

  private mapTemplateToF5(template: string): string {
    const mapping: Record<string, string> = {
      'rapid_deployment': 'POLICY_TEMPLATE_RAPID_DEPLOYMENT',
      'fundamental': 'POLICY_TEMPLATE_FUNDAMENTAL',
      'enhanced': 'POLICY_TEMPLATE_ENHANCED',
      'comprehensive': 'POLICY_TEMPLATE_COMPREHENSIVE',
      'custom': 'POLICY_TEMPLATE_CUSTOM'
    };
    return mapping[template] || template;
  }

  private mapTemplateFromF5(template: string): WAFPolicy['template'] {
    const mapping: Record<string, WAFPolicy['template']> = {
      'POLICY_TEMPLATE_RAPID_DEPLOYMENT': 'rapid_deployment',
      'POLICY_TEMPLATE_FUNDAMENTAL': 'fundamental',
      'POLICY_TEMPLATE_ENHANCED': 'enhanced',
      'POLICY_TEMPLATE_COMPREHENSIVE': 'comprehensive',
      'POLICY_TEMPLATE_CUSTOM': 'custom'
    };
    return mapping[template] || 'custom';
  }

  private mapSignatureFromF5(item: any): AttackSignature {
    return {
      id: item.id || item.signatureId?.toString(),
      name: item.name,
      signatureId: item.signatureId || 0,
      category: this.mapSignatureCategory(item.category),
      severity: item.severity || 'medium',
      accuracy: item.accuracy || 'medium',
      risk: item.risk || 'medium',
      enabled: item.enabled !== false,
      autoLearn: item.learn === true,
      description: item.description || '',
      lastUpdate: item.lastUpdateTime || new Date().toISOString()
    };
  }

  private mapSignatureCategory(category: string): AttackSignature['category'] {
    const mapping: Record<string, AttackSignature['category']> = {
      'SQL Injection': 'sql_injection',
      'Cross Site Scripting': 'xss',
      'Command Execution': 'command_execution',
      'Directory Traversal': 'path_traversal',
      'CSRF': 'csrf',
      'XML Injection': 'xml_injection',
      'LDAP Injection': 'ldap_injection'
    };
    return mapping[category] || 'other';
  }

  private mapEventFromF5(item: any): SecurityEvent {
    return {
      id: item.id || `${Date.now()}-${Math.random()}`,
      timestamp: item.dateTime || new Date().toISOString(),
      policyId: item.policyId || item.policyName,
      policyName: item.policyName || 'Unknown',
      violation: item.violationName || item.violation,
      severity: this.mapSeverity(item.severity),
      clientIp: item.sourceIp || item.clientIp,
      clientPort: item.sourcePort || 0,
      serverIp: item.destIp || item.serverIp,
      serverPort: item.destPort || 0,
      method: item.method || 'GET',
      uri: item.uri || '/',
      protocol: item.protocol || 'HTTP/1.1',
      action: item.blocked === true ? 'blocked' : (item.learned === true ? 'learned' : 'alerted'),
      request: item.request || '',
      details: item.details || {},
      geoInfo: item.geoInfo
    };
  }

  private mapSeverity(severity: string): SecurityEvent['severity'] {
    const mapping: Record<string, SecurityEvent['severity']> = {
      'critical': 'critical',
      'high': 'high',
      'medium': 'medium',
      'low': 'low',
      'error': 'high',
      'warning': 'medium',
      'info': 'low'
    };
    return mapping[severity] || 'medium';
  }

  private mapThreatLevel(score: number): IPReputation['threatLevel'] {
    if (score >= 80) return 'critical';
    if (score >= 60) return 'high';
    if (score >= 40) return 'medium';
    return 'low';
  }

  private mapReputationAction(score: number): IPReputation['action'] {
    if (score >= 80) return 'block';
    if (score >= 60) return 'challenge';
    if (score >= 40) return 'monitor';
    return 'allow';
  }

  // ==================== Mock Data for Development ====================

  private getMockPolicies(): WAFPolicy[] {
    return [
      {
        id: 'policy-1',
        name: 'Production API Policy',
        description: 'High security policy for production APIs',
        template: 'comprehensive',
        enforcementMode: 'blocking',
        language: 'utf-8',
        serverTechnologies: ['Apache', 'MySQL', 'Node.js'],
        virtualServers: ['/Common/vs_api_prod'],
        createdAt: '2024-01-15T10:00:00Z',
        modifiedAt: '2024-02-10T15:30:00Z',
        status: 'active',
        compliance: { pciDss: true, gdpr: true, hipaa: false, sox: false }
      },
      {
        id: 'policy-2',
        name: 'Web App Policy',
        description: 'Standard protection for web applications',
        template: 'enhanced',
        enforcementMode: 'transparent',
        language: 'utf-8',
        serverTechnologies: ['IIS', 'ASP.NET'],
        virtualServers: ['/Common/vs_web_app'],
        createdAt: '2024-01-20T08:00:00Z',
        modifiedAt: '2024-02-12T11:20:00Z',
        status: 'active',
        compliance: { pciDss: true, gdpr: true, hipaa: false, sox: false }
      }
    ];
  }

  private getMockSignatures(): AttackSignature[] {
    return [
      {
        id: 'sig-1',
        name: 'SQL Injection - Union Select',
        signatureId: 200000001,
        category: 'sql_injection',
        severity: 'critical',
        accuracy: 'high',
        risk: 'high',
        enabled: true,
        autoLearn: false,
        description: 'Detects UNION-based SQL injection attacks',
        lastUpdate: '2024-01-01T00:00:00Z'
      },
      {
        id: 'sig-2',
        name: 'Cross-Site Scripting (XSS)',
        signatureId: 200000050,
        category: 'xss',
        severity: 'high',
        accuracy: 'high',
        risk: 'high',
        enabled: true,
        autoLearn: true,
        description: 'Detects reflected XSS attempts',
        lastUpdate: '2024-01-01T00:00:00Z'
      },
      {
        id: 'sig-3',
        name: 'Remote Command Execution',
        signatureId: 200000100,
        category: 'command_execution',
        severity: 'critical',
        accuracy: 'high',
        risk: 'high',
        enabled: true,
        autoLearn: false,
        description: 'Detects command injection attempts',
        lastUpdate: '2024-01-01T00:00:00Z'
      }
    ];
  }

  private getMockSecurityEvents(): SecurityEvent[] {
    return [
      {
        id: 'evt-1',
        timestamp: new Date(Date.now() - 3600000).toISOString(),
        policyId: 'policy-1',
        policyName: 'Production API Policy',
        violation: 'SQL Injection',
        severity: 'critical',
        clientIp: '192.168.1.100',
        clientPort: 54321,
        serverIp: '10.0.0.50',
        serverPort: 443,
        method: 'POST',
        uri: '/api/users',
        protocol: 'HTTP/1.1',
        action: 'blocked',
        request: 'POST /api/users HTTP/1.1\nHost: api.example.com',
        details: { param: 'username', pattern: 'union select' }
      },
      {
        id: 'evt-2',
        timestamp: new Date(Date.now() - 7200000).toISOString(),
        policyId: 'policy-1',
        policyName: 'Production API Policy',
        violation: 'Cross-Site Scripting',
        severity: 'high',
        clientIp: '192.168.1.101',
        clientPort: 54322,
        serverIp: '10.0.0.50',
        serverPort: 443,
        method: 'GET',
        uri: '/search?q=<script>',
        protocol: 'HTTP/1.1',
        action: 'blocked',
        request: 'GET /search?q=<script>alert(1)</script> HTTP/1.1',
        details: { param: 'q', pattern: '<script>' }
      }
    ];
  }

  private getMockSecurityStats() {
    return {
      totalRequests: 1250000,
      blockedRequests: 1250,
      alertedRequests: 3450,
      topViolations: [
        { name: 'SQL Injection', count: 450 },
        { name: 'Cross-Site Scripting', count: 320 },
        { name: 'Path Traversal', count: 180 },
        { name: 'Command Injection', count: 120 },
        { name: 'Bot Traffic', count: 380 }
      ],
      topAttackingIPs: [
        { ip: '192.168.100.10', count: 145 },
        { ip: '10.50.60.20', count: 98 },
        { ip: '172.16.30.40', count: 76 },
        { ip: '203.0.113.50', count: 54 },
        { ip: '198.51.100.30', count: 43 }
      ],
      topAttackedURLs: [
        { url: '/api/login', count: 520 },
        { url: '/api/users', count: 380 },
        { url: '/search', count: 290 },
        { url: '/admin', count: 210 },
        { url: '/api/payment', count: 150 }
      ]
    };
  }

  private getDefaultBotDefenseConfig(): BotDefenseConfig {
    return {
      enabled: true,
      mode: 'transparent',
      categories: [
        { name: 'Web Scrapers', action: 'block', enabled: true },
        { name: 'Credential Stuffing', action: 'block', enabled: true },
        { name: 'Vulnerability Scanners', action: 'block', enabled: true },
        { name: 'Search Engines', action: 'allow', enabled: true }
      ],
      challenges: {
        javascriptInjection: true,
        captcha: true,
        deviceFingerprinting: true
      }
    };
  }
}

// Singleton instance
let awafService: AWAFService | null = null;

export function getAWAFService(): AWAFService {
  if (!awafService) {
    awafService = new AWAFService();
  }
  return awafService;
}

export function resetAWAFService(): void {
  awafService = null;
}
