/**
 * Multi-Cloud Traffic Management Types
 * Type definitions for cloud provider integration and routing
 */

export type CloudProvider = 'aws' | 'azure' | 'gcp' | 'on-premise';

export interface CloudRegion {
  id: string;
  name: string;
  provider: CloudProvider;
  location: string;
  endpoint: string;
  status: 'healthy' | 'degraded' | 'down';
  latency: number; // ms
  costPerHour: number;
  trafficDistribution: number; // percentage
  healthyInstanceCount: number;
  totalInstanceCount: number;
  metadata?: Record<string, any>;
}

export interface CloudProviderConfig {
  name: CloudProvider;
  enabled: boolean;
  credentials: {
    accessKeyId?: string;
    secretAccessKey?: string;
    region?: string;
    subscriptionId?: string;
    tenantId?: string;
    clientId?: string;
    clientSecret?: string;
    projectId?: string;
    keyFile?: string;
  };
  regions: CloudRegion[];
  healthStatus: 'healthy' | 'degraded' | 'down';
  lastHealthCheck: Date;
}

export interface CloudRoutingRule {
  id: string;
  name: string;
  priority: number;
  enabled: boolean;
  condition: RoutingCondition;
  action: RoutingAction;
  createdAt: Date;
  updatedAt: Date;
}

export interface RoutingCondition {
  type: 'geographic' | 'latency' | 'cost' | 'health' | 'time' | 'custom';
  operator: 'equals' | 'not_equals' | 'less_than' | 'greater_than' | 'in' | 'not_in';
  target: string;
  value: any;
}

export interface RoutingAction {
  type: 'route_to_region' | 'route_to_provider' | 'weighted' | 'failover';
  targetProvider?: CloudProvider;
  targetRegion?: string;
  weight?: number;
  backupRegions?: string[];
}

export interface MultiCloudPolicy {
  id: string;
  name: string;
  description?: string;
  enabled: boolean;
  defaultProvider: CloudProvider;
  defaultRegion: string;
  rules: CloudRoutingRule[];
  createdAt: Date;
  updatedAt: Date;
}

export interface CloudTrafficMetrics {
  timestamp: Date;
  provider: CloudProvider;
  region: string;
  totalRequests: number;
  successfulRequests: number;
  failedRequests: number;
  averageLatency: number;
  p95Latency: number;
  p99Latency: number;
  cost: number;
}

export interface CloudHealthCheck {
  id: string;
  regionId: string;
  status: 'healthy' | 'degraded' | 'down';
  lastCheck: Date;
  responseTime: number;
  errorRate: number;
  details?: string;
}

export interface FailoverConfig {
  enabled: boolean;
  primaryRegion: string;
  backupRegions: string[];
  healthCheckInterval: number; // seconds
  failoverThreshold: number; // consecutive failures
  automaticFailback: boolean;
  failbackDelay: number; // minutes
}

export interface CloudScalingEvent {
  id: string;
  provider: CloudProvider;
  region: string;
  type: 'scale_out' | 'scale_in';
  reason: string;
  instancesChanged: number;
  timestamp: Date;
  status: 'pending' | 'in_progress' | 'completed' | 'failed';
}
