/**
 * Auto-Scaling Types
 * Type definitions for cloud auto-scaling and pool management
 */

export type ScalingMetric = 'cpu' | 'memory' | 'connections' | 'response_time' | 'throughput' | 'custom';
export type ScalingActionType = 'scale_out' | 'scale_in' | 'maintain';
export type ScalingAdjustmentType = 'change_in_capacity' | 'percent_change' | 'exact_capacity';
export type ScalingStatus = 'active' | 'paused' | 'disabled';

export interface ScalingPolicy {
  id: string;
  name: string;
  description?: string;
  enabled: boolean;
  status: ScalingStatus;
  
  // Target
  targetPool: string;
  targetProvider?: string;
  targetRegion?: string;
  
  // Metrics
  metrics: MetricThreshold[];
  
  // Scaling Actions
  scaleUp: ScalingAction;
  scaleDown: ScalingAction;
  
  // Limits
  minInstances: number;
  maxInstances: number;
  cooldownPeriod: number; // seconds
  
  // Schedule
  scheduledScaling?: ScheduledScaling[];
  
  createdAt: Date;
  updatedAt: Date;
}

export interface MetricThreshold {
  metric: ScalingMetric;
  statistic: 'average' | 'minimum' | 'maximum' | 'sum' | 'p95' | 'p99';
  comparisonOperator: 'greater_than' | 'less_than' | 'greater_than_or_equal' | 'less_than_or_equal';
  threshold: number;
  evaluationPeriods: number; // number of consecutive periods
  period: number; // seconds per period
}

export interface ScalingAction {
  adjustment: number;
  adjustmentType: ScalingAdjustmentType;
  cooldown: number; // seconds
  minAdjustment?: number;
  maxAdjustment?: number;
}

export interface ScheduledScaling {
  id: string;
  name: string;
  schedule: string; // cron expression
  minInstances: number;
  maxInstances: number;
  desiredCapacity?: number;
  timezone: string;
  enabled: boolean;
}

export interface PoolMember {
  id: string;
  name: string;
  ip: string;
  port: number;
  status: 'up' | 'down' | 'disabled' | 'unknown';
  health: 'healthy' | 'degraded' | 'unhealthy';
  
  // Metrics
  cpu: number; // percentage
  memory: number; // percentage
  connections: number;
  responseTime: number; // ms
  throughput: number; // requests per second
  errorRate: number; // percentage
  
  // Cost
  costPerHour: number;
  
  // Metadata
  instanceType?: string;
  availabilityZone?: string;
  launchTime?: Date;
  metadata?: Record<string, any>;
}

export interface ScalingEvent {
  id: string;
  policyId: string;
  policyName: string;
  type: ScalingActionType;
  reason: string;
  
  // Before/After state
  previousInstanceCount: number;
  newInstanceCount: number;
  instancesChanged: number;
  
  // Impact
  costImpact: number; // per hour
  estimatedSavings?: number;
  
  // Status
  status: 'pending' | 'in_progress' | 'completed' | 'failed' | 'cancelled';
  errorMessage?: string;
  
  // Timing
  triggeredAt: Date;
  completedAt?: Date;
  duration?: number; // seconds
}

export interface ScalingMetrics {
  timestamp: Date;
  poolId: string;
  
  // Capacity
  currentCapacity: number;
  targetCapacity: number;
  minCapacity: number;
  maxCapacity: number;
  
  // Performance
  averageCpu: number;
  averageMemory: number;
  averageResponseTime: number;
  totalConnections: number;
  totalThroughput: number;
  averageErrorRate: number;
  
  // Cost
  currentCostPerHour: number;
  projectedCostPerHour: number;
}

export interface PredictiveScalingConfig {
  enabled: boolean;
  algorithm: 'linear_regression' | 'arima' | 'lstm';
  forecastHorizon: number; // minutes
  confidenceThreshold: number; // 0-1
  trainingDataDays: number;
  scaleInAdvance: boolean;
}

export interface CostOptimizationConfig {
  enabled: boolean;
  targetCostPerHour: number;
  spotInstancesEnabled: boolean;
  spotInstancePercentage: number; // 0-100
  reservedInstanceCapacity: number;
  autoShutdownEnabled: boolean;
  idleShutdownDelay: number; // minutes
}

export interface ScalingRecommendation {
  id: string;
  type: 'scale_out' | 'scale_in' | 'optimize' | 'migrate';
  priority: 'high' | 'medium' | 'low';
  title: string;
  description: string;
  
  // Current vs Recommended
  currentState: {
    instanceCount: number;
    costPerHour: number;
    averageUtilization: number;
  };
  
  recommendedState: {
    instanceCount: number;
    costPerHour: number;
    expectedUtilization: number;
  };
  
  // Impact
  potentialSavings?: number;
  riskLevel: 'low' | 'medium' | 'high';
  
  createdAt: Date;
  expiresAt: Date;
}

export interface CapacityForecast {
  timestamp: Date;
  predictedCapacity: number;
  confidenceInterval: {
    lower: number;
    upper: number;
  };
  predictedCost: number;
}
