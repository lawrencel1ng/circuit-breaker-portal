/**
 * Multi-Cloud Traffic Management Service
 * Manages cloud providers, regions, routing rules, and traffic distribution
 */

import type {
  CloudProvider,
  CloudProviderConfig,
  CloudRegion,
  CloudRoutingRule,
  MultiCloudPolicy,
  CloudTrafficMetrics,
  CloudHealthCheck,
  FailoverConfig,
  CloudScalingEvent
} from './types';
import { logger } from '../logger';

// Default cloud provider configurations
const DEFAULT_PROVIDERS: CloudProviderConfig[] = [
  {
    name: 'aws',
    enabled: true,
    credentials: {},
    regions: [
      {
        id: 'us-east-1',
        name: 'US East (N. Virginia)',
        provider: 'aws',
        location: 'Virginia, USA',
        endpoint: 'https://us-east-1.elb.amazonaws.com',
        status: 'healthy',
        latency: 45,
        costPerHour: 12.50,
        trafficDistribution: 35,
        healthyInstanceCount: 8,
        totalInstanceCount: 8
      },
      {
        id: 'us-west-2',
        name: 'US West (Oregon)',
        provider: 'aws',
        location: 'Oregon, USA',
        endpoint: 'https://us-west-2.elb.amazonaws.com',
        status: 'healthy',
        latency: 52,
        costPerHour: 11.80,
        trafficDistribution: 25,
        healthyInstanceCount: 6,
        totalInstanceCount: 6
      }
    ],
    healthStatus: 'healthy',
    lastHealthCheck: new Date()
  },
  {
    name: 'azure',
    enabled: true,
    credentials: {},
    regions: [
      {
        id: 'eastus',
        name: 'East US',
        provider: 'azure',
        location: 'Virginia, USA',
        endpoint: 'https://eastus.cloudapp.azure.com',
        status: 'healthy',
        latency: 38,
        costPerHour: 11.00,
        trafficDistribution: 20,
        healthyInstanceCount: 5,
        totalInstanceCount: 5
      },
      {
        id: 'westeurope',
        name: 'West Europe',
        provider: 'azure',
        location: 'Amsterdam, Netherlands',
        endpoint: 'https://westeurope.cloudapp.azure.com',
        status: 'healthy',
        latency: 67,
        costPerHour: 9.80,
        trafficDistribution: 10,
        healthyInstanceCount: 3,
        totalInstanceCount: 3
      }
    ],
    healthStatus: 'healthy',
    lastHealthCheck: new Date()
  },
  {
    name: 'gcp',
    enabled: true,
    credentials: {},
    regions: [
      {
        id: 'us-central1',
        name: 'US Central (Iowa)',
        provider: 'gcp',
        location: 'Iowa, USA',
        endpoint: 'https://us-central1.googleapis.com',
        status: 'healthy',
        latency: 42,
        costPerHour: 10.50,
        trafficDistribution: 10,
        healthyInstanceCount: 4,
        totalInstanceCount: 4
      }
    ],
    healthStatus: 'healthy',
    lastHealthCheck: new Date()
  }
];

// Default routing rules
const DEFAULT_ROUTING_RULES: CloudRoutingRule[] = [
  {
    id: 'rule-1',
    name: 'Geographic Routing',
    priority: 1,
    enabled: true,
    condition: {
      type: 'geographic',
      operator: 'equals',
      target: 'user_location',
      value: 'nearest'
    },
    action: {
      type: 'route_to_region',
      targetProvider: 'aws',
      targetRegion: 'us-east-1'
    },
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    id: 'rule-2',
    name: 'Latency-Based Routing',
    priority: 2,
    enabled: true,
    condition: {
      type: 'latency',
      operator: 'less_than',
      target: 'response_time',
      value: 100
    },
    action: {
      type: 'route_to_provider',
      targetProvider: 'azure'
    },
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    id: 'rule-3',
    name: 'Cost Optimization',
    priority: 3,
    enabled: true,
    condition: {
      type: 'time',
      operator: 'in',
      target: 'hour_of_day',
      value: [0, 1, 2, 3, 4, 5] // Off-peak hours
    },
    action: {
      type: 'route_to_region',
      targetProvider: 'gcp',
      targetRegion: 'us-central1'
    },
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    id: 'rule-4',
    name: 'Health-Based Failover',
    priority: 4,
    enabled: true,
    condition: {
      type: 'health',
      operator: 'less_than',
      target: 'region_health',
      value: 95
    },
    action: {
      type: 'failover',
      backupRegions: ['us-west-2', 'eastus']
    },
    createdAt: new Date(),
    updatedAt: new Date()
  }
];

// Default multi-cloud policy
const DEFAULT_POLICY: MultiCloudPolicy = {
  id: 'default',
  name: 'Default Multi-Cloud Policy',
  description: 'Default routing policy for multi-cloud traffic management',
  enabled: true,
  defaultProvider: 'aws',
  defaultRegion: 'us-east-1',
  rules: DEFAULT_ROUTING_RULES,
  createdAt: new Date(),
  updatedAt: new Date()
};

export class MultiCloudService {
  private providers: Map<string, CloudProviderConfig> = new Map();
  private policies: Map<string, MultiCloudPolicy> = new Map();
  private healthChecks: Map<string, CloudHealthCheck> = new Map();
  private metrics: CloudTrafficMetrics[] = [];
  private scalingEvents: CloudScalingEvent[] = [];
  private failoverConfig: FailoverConfig;
  private healthCheckInterval: NodeJS.Timeout | null = null;

  constructor() {
    // Initialize with defaults
    DEFAULT_PROVIDERS.forEach(provider => {
      this.providers.set(provider.name, provider);
    });
    this.policies.set(DEFAULT_POLICY.id, DEFAULT_POLICY);
    
    this.failoverConfig = {
      enabled: true,
      primaryRegion: 'us-east-1',
      backupRegions: ['us-west-2', 'eastus'],
      healthCheckInterval: 30,
      failoverThreshold: 3,
      automaticFailback: true,
      failbackDelay: 10
    };

    // Start health checks
    this.startHealthChecks();
  }

  // Provider Management
  getAllProviders(): CloudProviderConfig[] {
    return Array.from(this.providers.values());
  }

  getProvider(name: CloudProvider): CloudProviderConfig | undefined {
    return this.providers.get(name);
  }

  updateProvider(name: CloudProvider, config: Partial<CloudProviderConfig>): CloudProviderConfig {
    const existing = this.providers.get(name);
    if (!existing) {
      throw new Error(`Provider ${name} not found`);
    }

    const updated = {
      ...existing,
      ...config,
      regions: config.regions || existing.regions
    };
    this.providers.set(name, updated);
    logger.info(`Updated provider: ${name}`);
    return updated;
  }

  // Region Management
  getAllRegions(): CloudRegion[] {
    const regions: CloudRegion[] = [];
    this.providers.forEach(provider => {
      regions.push(...provider.regions);
    });
    return regions;
  }

  getRegion(id: string): CloudRegion | undefined {
    for (const provider of this.providers.values()) {
      const region = provider.regions.find(r => r.id === id);
      if (region) return region;
    }
    return undefined;
  }

  updateRegion(id: string, updates: Partial<CloudRegion>): CloudRegion {
    for (const provider of this.providers.values()) {
      const index = provider.regions.findIndex(r => r.id === id);
      if (index !== -1) {
        provider.regions[index] = { ...provider.regions[index], ...updates };
        logger.info(`Updated region: ${id}`);
        return provider.regions[index];
      }
    }
    throw new Error(`Region ${id} not found`);
  }

  // Routing Rules Management
  getAllRules(): CloudRoutingRule[] {
    const policy = this.getActivePolicy();
    return policy.rules.sort((a, b) => a.priority - b.priority);
  }

  getRule(id: string): CloudRoutingRule | undefined {
    const policy = this.getActivePolicy();
    return policy.rules.find(r => r.id === id);
  }

  createRule(rule: Omit<CloudRoutingRule, 'id' | 'createdAt' | 'updatedAt'>): CloudRoutingRule {
    const newRule: CloudRoutingRule = {
      ...rule,
      id: `rule-${Date.now()}`,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    const policy = this.getActivePolicy();
    policy.rules.push(newRule);
    policy.rules.sort((a, b) => a.priority - b.priority);
    policy.updatedAt = new Date();

    logger.info(`Created routing rule: ${newRule.id}`);
    return newRule;
  }

  updateRule(id: string, updates: Partial<CloudRoutingRule>): CloudRoutingRule {
    const policy = this.getActivePolicy();
    const index = policy.rules.findIndex(r => r.id === id);
    
    if (index === -1) {
      throw new Error(`Rule ${id} not found`);
    }

    policy.rules[index] = { ...policy.rules[index], ...updates, updatedAt: new Date() };
    policy.rules.sort((a, b) => a.priority - b.priority);
    policy.updatedAt = new Date();

    logger.info(`Updated routing rule: ${id}`);
    return policy.rules[index];
  }

  deleteRule(id: string): void {
    const policy = this.getActivePolicy();
    const index = policy.rules.findIndex(r => r.id === id);
    
    if (index === -1) {
      throw new Error(`Rule ${id} not found`);
    }

    policy.rules.splice(index, 1);
    policy.updatedAt = new Date();
    logger.info(`Deleted routing rule: ${id}`);
  }

  // Policy Management
  getActivePolicy(): MultiCloudPolicy {
    // Return the default policy for now
    return this.policies.get('default') || DEFAULT_POLICY;
  }

  getPolicy(id: string): MultiCloudPolicy | undefined {
    return this.policies.get(id);
  }

  updatePolicy(id: string, updates: Partial<MultiCloudPolicy>): MultiCloudPolicy {
    const existing = this.policies.get(id);
    if (!existing) {
      throw new Error(`Policy ${id} not found`);
    }

    const updated = { ...existing, ...updates, updatedAt: new Date() };
    this.policies.set(id, updated);
    logger.info(`Updated policy: ${id}`);
    return updated;
  }

  // Traffic Distribution
  getTrafficDistribution(): Record<string, number> {
    const distribution: Record<string, number> = {};
    
    this.providers.forEach(provider => {
      provider.regions.forEach(region => {
        distribution[`${provider.name}:${region.id}`] = region.trafficDistribution;
      });
    });

    return distribution;
  }

  updateTrafficDistribution(distribution: Record<string, number>): void {
    Object.entries(distribution).forEach(([key, percentage]) => {
      const [providerName, regionId] = key.split(':');
      const provider = this.providers.get(providerName);
      
      if (provider) {
        const region = provider.regions.find(r => r.id === regionId);
        if (region) {
          region.trafficDistribution = percentage;
        }
      }
    });

    logger.info('Updated traffic distribution');
  }

  // Metrics
  getMetrics(timeRange?: { start: Date; end: Date }): CloudTrafficMetrics[] {
    if (!timeRange) {
      return this.metrics.slice(-100); // Return last 100 metrics
    }
    
    return this.metrics.filter(m => 
      m.timestamp >= timeRange.start && m.timestamp <= timeRange.end
    );
  }

  addMetric(metric: CloudTrafficMetrics): void {
    this.metrics.push(metric);
    // Keep only last 1000 metrics
    if (this.metrics.length > 1000) {
      this.metrics = this.metrics.slice(-1000);
    }
  }

  // Health Checks
  getHealthChecks(): CloudHealthCheck[] {
    return Array.from(this.healthChecks.values());
  }

  private startHealthChecks(): void {
    // Run health check every 30 seconds
    this.healthCheckInterval = setInterval(() => {
      this.runHealthChecks();
    }, 30000);
  }

  private async runHealthChecks(): Promise<void> {
    for (const provider of this.providers.values()) {
      if (!provider.enabled) continue;

      for (const region of provider.regions) {
        try {
          // Simulate health check
          const responseTime = region.latency + (Math.random() - 0.5) * 20;
          const errorRate = Math.random() * 0.02;
          
          let status: 'healthy' | 'degraded' | 'down' = 'healthy';
          if (errorRate > 0.01) status = 'degraded';
          if (errorRate > 0.05) status = 'down';

          const healthCheck: CloudHealthCheck = {
            id: `${provider.name}:${region.id}`,
            regionId: region.id,
            status,
            lastCheck: new Date(),
            responseTime,
            errorRate
          };

          this.healthChecks.set(healthCheck.id, healthCheck);
          
          // Update region status
          region.status = status;
          
          // Check for failover
          if (status === 'down' && this.failoverConfig.enabled) {
            await this.handleFailover(region);
          }
        } catch (error) {
          logger.error(`Health check failed for ${provider.name}:${region.id}`, error);
        }
      }

      // Update provider health status
      const healthyRegions = provider.regions.filter(r => r.status === 'healthy').length;
      const totalRegions = provider.regions.length;
      
      if (healthyRegions === totalRegions) {
        provider.healthStatus = 'healthy';
      } else if (healthyRegions > 0) {
        provider.healthStatus = 'degraded';
      } else {
        provider.healthStatus = 'down';
      }
      
      provider.lastHealthCheck = new Date();
    }
  }

  // Failover
  private async handleFailover(failedRegion: CloudRegion): Promise<void> {
    logger.warn(`Handling failover for region: ${failedRegion.id}`);
    
    // Find backup region
    const backupRegionId = this.failoverConfig.backupRegions.find(
      id => this.getRegion(id)?.status === 'healthy'
    );

    if (backupRegionId) {
      const backupRegion = this.getRegion(backupRegionId);
      if (backupRegion) {
        // Transfer traffic to backup
        backupRegion.trafficDistribution += failedRegion.trafficDistribution;
        failedRegion.trafficDistribution = 0;
        
        logger.info(`Failed over from ${failedRegion.id} to ${backupRegionId}`);
      }
    }
  }

  getFailoverConfig(): FailoverConfig {
    return this.failoverConfig;
  }

  updateFailoverConfig(config: Partial<FailoverConfig>): FailoverConfig {
    this.failoverConfig = { ...this.failoverConfig, ...config };
    logger.info('Updated failover configuration');
    return this.failoverConfig;
  }

  // Scaling Events
  getScalingEvents(limit: number = 50): CloudScalingEvent[] {
    return this.scalingEvents.slice(-limit);
  }

  addScalingEvent(event: Omit<CloudScalingEvent, 'id' | 'timestamp'>): CloudScalingEvent {
    const newEvent: CloudScalingEvent = {
      ...event,
      id: `scale-${Date.now()}`,
      timestamp: new Date()
    };

    this.scalingEvents.push(newEvent);
    if (this.scalingEvents.length > 200) {
      this.scalingEvents = this.scalingEvents.slice(-200);
    }

    logger.info(`Scaling event: ${newEvent.type} in ${newEvent.region}`);
    return newEvent;
  }

  // Statistics
  getGlobalStats(): {
    totalTraffic: number;
    healthyRegions: number;
    totalRegions: number;
    averageLatency: number;
    totalCostPerHour: number;
    uptime: number;
  } {
    const regions = this.getAllRegions();
    const healthyRegions = regions.filter(r => r.status === 'healthy');
    
    // Calculate weighted average latency based on traffic distribution
    const totalTraffic = regions.reduce((sum, r) => sum + r.trafficDistribution, 0);
    const weightedLatency = regions.reduce(
      (sum, r) => sum + (r.latency * r.trafficDistribution), 
      0
    ) / (totalTraffic || 1);

    return {
      totalTraffic: Math.round(totalTraffic * 1000), // Simulated request count
      healthyRegions: healthyRegions.length,
      totalRegions: regions.length,
      averageLatency: Math.round(weightedLatency),
      totalCostPerHour: regions.reduce((sum, r) => sum + r.costPerHour, 0),
      uptime: 99.2 // Simulated uptime percentage
    };
  }

  dispose(): void {
    if (this.healthCheckInterval) {
      clearInterval(this.healthCheckInterval);
    }
  }
}

// Singleton instance
let multiCloudService: MultiCloudService | null = null;

export function getMultiCloudService(): MultiCloudService {
  if (!multiCloudService) {
    multiCloudService = new MultiCloudService();
  }
  return multiCloudService;
}

export function resetMultiCloudService(): void {
  if (multiCloudService) {
    multiCloudService.dispose();
    multiCloudService = null;
  }
}
