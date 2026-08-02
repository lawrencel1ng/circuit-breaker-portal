/**
 * Auto-Scaling Service
 * Manages automatic scaling of pool members based on metrics and policies
 */

import type {
  ScalingPolicy,
  PoolMember,
  ScalingEvent,
  ScalingMetrics,
  MetricThreshold,
  ScalingRecommendation,
  CapacityForecast,
  PredictiveScalingConfig,
  CostOptimizationConfig
} from './types';
import { logger } from '../logger';

// Default scaling policies
const DEFAULT_POLICIES: ScalingPolicy[] = [
  {
    id: 'policy-cpu',
    name: 'CPU-Based Scaling',
    description: 'Scale based on CPU utilization',
    enabled: true,
    status: 'active',
    targetPool: 'pool-app-servers',
    metrics: [
      {
        metric: 'cpu',
        statistic: 'average',
        comparisonOperator: 'greater_than',
        threshold: 70,
        evaluationPeriods: 2,
        period: 60
      }
    ],
    scaleUp: {
      adjustment: 2,
      adjustmentType: 'change_in_capacity',
      cooldown: 300,
      minAdjustment: 1,
      maxAdjustment: 5
    },
    scaleDown: {
      adjustment: -1,
      adjustmentType: 'change_in_capacity',
      cooldown: 600,
      minAdjustment: 1,
      maxAdjustment: 2
    },
    minInstances: 2,
    maxInstances: 20,
    cooldownPeriod: 300,
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    id: 'policy-memory',
    name: 'Memory-Based Scaling',
    description: 'Scale based on memory utilization',
    enabled: true,
    status: 'active',
    targetPool: 'pool-app-servers',
    metrics: [
      {
        metric: 'memory',
        statistic: 'average',
        comparisonOperator: 'greater_than',
        threshold: 80,
        evaluationPeriods: 2,
        period: 60
      }
    ],
    scaleUp: {
      adjustment: 1,
      adjustmentType: 'change_in_capacity',
      cooldown: 300
    },
    scaleDown: {
      adjustment: -1,
      adjustmentType: 'change_in_capacity',
      cooldown: 600
    },
    minInstances: 2,
    maxInstances: 15,
    cooldownPeriod: 300,
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    id: 'policy-response-time',
    name: 'Response Time Scaling',
    description: 'Scale based on application response time',
    enabled: true,
    status: 'active',
    targetPool: 'pool-app-servers',
    metrics: [
      {
        metric: 'response_time',
        statistic: 'p95',
        comparisonOperator: 'greater_than',
        threshold: 200,
        evaluationPeriods: 3,
        period: 60
      }
    ],
    scaleUp: {
      adjustment: 2,
      adjustmentType: 'change_in_capacity',
      cooldown: 180
    },
    scaleDown: {
      adjustment: -1,
      adjustmentType: 'change_in_capacity',
      cooldown: 600
    },
    minInstances: 3,
    maxInstances: 25,
    cooldownPeriod: 180,
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    id: 'policy-throughput',
    name: 'Low Traffic Scale-in',
    description: 'Scale in during low traffic periods',
    enabled: true,
    status: 'active',
    targetPool: 'pool-app-servers',
    metrics: [
      {
        metric: 'throughput',
        statistic: 'average',
        comparisonOperator: 'less_than',
        threshold: 100,
        evaluationPeriods: 10,
        period: 60
      }
    ],
    scaleUp: {
      adjustment: 1,
      adjustmentType: 'change_in_capacity',
      cooldown: 300
    },
    scaleDown: {
      adjustment: -2,
      adjustmentType: 'change_in_capacity',
      cooldown: 600
    },
    minInstances: 2,
    maxInstances: 20,
    cooldownPeriod: 600,
    createdAt: new Date(),
    updatedAt: new Date()
  }
];

// Default pool members
const DEFAULT_POOL_MEMBERS: PoolMember[] = [
  {
    id: 'member-1',
    name: 'app-server-1',
    ip: '10.10.1.10',
    port: 8080,
    status: 'up',
    health: 'healthy',
    cpu: 45,
    memory: 60,
    connections: 125,
    responseTime: 120,
    throughput: 250,
    errorRate: 0.5,
    costPerHour: 8.50,
    instanceType: 't3.medium',
    availabilityZone: 'us-east-1a',
    launchTime: new Date(Date.now() - 86400000)
  },
  {
    id: 'member-2',
    name: 'app-server-2',
    ip: '10.10.1.11',
    port: 8080,
    status: 'up',
    health: 'healthy',
    cpu: 52,
    memory: 65,
    connections: 140,
    responseTime: 135,
    throughput: 280,
    errorRate: 0.3,
    costPerHour: 8.50,
    instanceType: 't3.medium',
    availabilityZone: 'us-east-1b',
    launchTime: new Date(Date.now() - 86400000)
  },
  {
    id: 'member-3',
    name: 'app-server-3',
    ip: '10.10.1.12',
    port: 8080,
    status: 'up',
    health: 'degraded',
    cpu: 78,
    memory: 80,
    connections: 200,
    responseTime: 180,
    throughput: 320,
    errorRate: 1.2,
    costPerHour: 8.50,
    instanceType: 't3.medium',
    availabilityZone: 'us-east-1a',
    launchTime: new Date(Date.now() - 43200000)
  },
  {
    id: 'member-4',
    name: 'app-server-4',
    ip: '10.10.1.13',
    port: 8080,
    status: 'up',
    health: 'healthy',
    cpu: 38,
    memory: 55,
    connections: 100,
    responseTime: 110,
    throughput: 220,
    errorRate: 0.2,
    costPerHour: 8.50,
    instanceType: 't3.medium',
    availabilityZone: 'us-east-1c',
    launchTime: new Date(Date.now() - 86400000)
  },
  {
    id: 'member-5',
    name: 'app-server-5',
    ip: '10.10.1.14',
    port: 8080,
    status: 'up',
    health: 'healthy',
    cpu: 42,
    memory: 58,
    connections: 115,
    responseTime: 125,
    throughput: 240,
    errorRate: 0.4,
    costPerHour: 8.50,
    instanceType: 't3.medium',
    availabilityZone: 'us-east-1b',
    launchTime: new Date(Date.now() - 86400000)
  }
];

export class AutoScalingService {
  private policies: Map<string, ScalingPolicy> = new Map();
  private poolMembers: Map<string, PoolMember> = new Map();
  private events: ScalingEvent[] = [];
  private metrics: ScalingMetrics[] = [];
  private metricHistory: Map<string, number[]> = new Map(); // For tracking metric values
  private predictiveConfig: PredictiveScalingConfig;
  private costConfig: CostOptimizationConfig;
  private scalingInterval: NodeJS.Timeout | null = null;
  private metricsInterval: NodeJS.Timeout | null = null;

  constructor() {
    // Initialize policies
    DEFAULT_POLICIES.forEach(policy => {
      this.policies.set(policy.id, policy);
    });

    // Initialize pool members
    DEFAULT_POOL_MEMBERS.forEach(member => {
      this.poolMembers.set(member.id, member);
    });

    // Initialize predictive scaling config
    this.predictiveConfig = {
      enabled: true,
      algorithm: 'linear_regression',
      forecastHorizon: 30,
      confidenceThreshold: 0.8,
      trainingDataDays: 7,
      scaleInAdvance: true
    };

    // Initialize cost optimization config
    this.costConfig = {
      enabled: true,
      targetCostPerHour: 50,
      spotInstancesEnabled: true,
      spotInstancePercentage: 30,
      reservedInstanceCapacity: 3,
      autoShutdownEnabled: false,
      idleShutdownDelay: 60
    };

    // Start monitoring
    this.startMonitoring();
  }

  // Policy Management
  getAllPolicies(): ScalingPolicy[] {
    return Array.from(this.policies.values());
  }

  getPolicy(id: string): ScalingPolicy | undefined {
    return this.policies.get(id);
  }

  createPolicy(policy: Omit<ScalingPolicy, 'id' | 'createdAt' | 'updatedAt'>): ScalingPolicy {
    const newPolicy: ScalingPolicy = {
      ...policy,
      id: `policy-${Date.now()}`,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    this.policies.set(newPolicy.id, newPolicy);
    logger.info(`Created scaling policy: ${newPolicy.id}`);
    return newPolicy;
  }

  updatePolicy(id: string, updates: Partial<ScalingPolicy>): ScalingPolicy {
    const existing = this.policies.get(id);
    if (!existing) {
      throw new Error(`Policy ${id} not found`);
    }

    const updated = { ...existing, ...updates, updatedAt: new Date() };
    this.policies.set(id, updated);
    logger.info(`Updated scaling policy: ${id}`);
    return updated;
  }

  deletePolicy(id: string): void {
    if (!this.policies.has(id)) {
      throw new Error(`Policy ${id} not found`);
    }
    this.policies.delete(id);
    logger.info(`Deleted scaling policy: ${id}`);
  }

  // Pool Member Management
  getAllPoolMembers(): PoolMember[] {
    return Array.from(this.poolMembers.values());
  }

  getPoolMember(id: string): PoolMember | undefined {
    return this.poolMembers.get(id);
  }

  addPoolMember(member: Omit<PoolMember, 'id'>): PoolMember {
    const newMember: PoolMember = {
      ...member,
      id: `member-${Date.now()}`
    };

    this.poolMembers.set(newMember.id, newMember);
    logger.info(`Added pool member: ${newMember.id}`);
    return newMember;
  }

  removePoolMember(id: string): void {
    if (!this.poolMembers.has(id)) {
      throw new Error(`Pool member ${id} not found`);
    }
    this.poolMembers.delete(id);
    logger.info(`Removed pool member: ${id}`);
  }

  updatePoolMember(id: string, updates: Partial<PoolMember>): PoolMember {
    const existing = this.poolMembers.get(id);
    if (!existing) {
      throw new Error(`Pool member ${id} not found`);
    }

    const updated = { ...existing, ...updates };
    this.poolMembers.set(id, updated);
    return updated;
  }

  // Scaling Operations
  async scaleOut(policyId: string, count: number, reason: string): Promise<ScalingEvent> {
    const policy = this.policies.get(policyId);
    if (!policy) {
      throw new Error(`Policy ${policyId} not found`);
    }

    const currentCount = this.poolMembers.size;
    const newCount = Math.min(currentCount + count, policy.maxInstances);
    const actualCount = newCount - currentCount;

    const event: ScalingEvent = {
      id: `event-${Date.now()}`,
      policyId,
      policyName: policy.name,
      type: 'scale_out',
      reason,
      previousInstanceCount: currentCount,
      newInstanceCount: newCount,
      instancesChanged: actualCount,
      costImpact: actualCount * 8.50,
      status: 'pending',
      triggeredAt: new Date()
    };

    this.events.push(event);

    // Simulate scaling
    event.status = 'in_progress';
    
    // Add new pool members
    for (let i = 0; i < actualCount; i++) {
      const newMember = this.addPoolMember({
        name: `app-server-${this.poolMembers.size + 1}`,
        ip: `10.10.1.${10 + this.poolMembers.size + 1}`,
        port: 8080,
        status: 'up',
        health: 'healthy',
        cpu: 10 + Math.random() * 20,
        memory: 30 + Math.random() * 20,
        connections: 0,
        responseTime: 100 + Math.random() * 50,
        throughput: 0,
        errorRate: 0,
        costPerHour: 8.50,
        instanceType: 't3.medium',
        availabilityZone: ['us-east-1a', 'us-east-1b', 'us-east-1c'][Math.floor(Math.random() * 3)],
        launchTime: new Date()
      });
    }

    event.status = 'completed';
    event.completedAt = new Date();
    event.duration = (event.completedAt.getTime() - event.triggeredAt.getTime()) / 1000;

    logger.info(`Scaled out: +${actualCount} instances (total: ${newCount})`);
    return event;
  }

  async scaleIn(policyId: string, count: number, reason: string): Promise<ScalingEvent> {
    const policy = this.policies.get(policyId);
    if (!policy) {
      throw new Error(`Policy ${policyId} not found`);
    }

    const currentCount = this.poolMembers.size;
    const newCount = Math.max(currentCount - count, policy.minInstances);
    const actualCount = currentCount - newCount;

    const event: ScalingEvent = {
      id: `event-${Date.now()}`,
      policyId,
      policyName: policy.name,
      type: 'scale_in',
      reason,
      previousInstanceCount: currentCount,
      newInstanceCount: newCount,
      instancesChanged: -actualCount,
      costImpact: -actualCount * 8.50,
      estimatedSavings: actualCount * 8.50 * 24 * 30, // Monthly savings
      status: 'pending',
      triggeredAt: new Date()
    };

    this.events.push(event);

    // Simulate scaling
    event.status = 'in_progress';

    // Remove pool members (preferably ones with lower load)
    const members = this.getAllPoolMembers()
      .filter(m => m.status === 'up')
      .sort((a, b) => a.cpu - b.cpu);

    for (let i = 0; i < actualCount && i < members.length; i++) {
      this.removePoolMember(members[i].id);
    }

    event.status = 'completed';
    event.completedAt = new Date();
    event.duration = (event.completedAt.getTime() - event.triggeredAt.getTime()) / 1000;

    logger.info(`Scaled in: -${actualCount} instances (total: ${newCount})`);
    return event;
  }

  // Event History
  getScalingEvents(limit: number = 50): ScalingEvent[] {
    return this.events.slice(-limit).reverse();
  }

  getEvent(id: string): ScalingEvent | undefined {
    return this.events.find(e => e.id === id);
  }

  // Metrics
  getCurrentMetrics(): ScalingMetrics {
    const members = this.getAllPoolMembers();
    const activeMembers = members.filter(m => m.status === 'up');

    if (activeMembers.length === 0) {
      return {
        timestamp: new Date(),
        poolId: 'pool-app-servers',
        currentCapacity: 0,
        targetCapacity: 0,
        minCapacity: 2,
        maxCapacity: 20,
        averageCpu: 0,
        averageMemory: 0,
        averageResponseTime: 0,
        totalConnections: 0,
        totalThroughput: 0,
        averageErrorRate: 0,
        currentCostPerHour: 0,
        projectedCostPerHour: 0
      };
    }

    const avgCpu = activeMembers.reduce((sum, m) => sum + m.cpu, 0) / activeMembers.length;
    const avgMemory = activeMembers.reduce((sum, m) => sum + m.memory, 0) / activeMembers.length;
    const avgResponseTime = activeMembers.reduce((sum, m) => sum + m.responseTime, 0) / activeMembers.length;
    const totalConnections = activeMembers.reduce((sum, m) => sum + m.connections, 0);
    const totalThroughput = activeMembers.reduce((sum, m) => sum + m.throughput, 0);
    const avgErrorRate = activeMembers.reduce((sum, m) => sum + m.errorRate, 0) / activeMembers.length;
    const currentCost = activeMembers.reduce((sum, m) => sum + m.costPerHour, 0);

    return {
      timestamp: new Date(),
      poolId: 'pool-app-servers',
      currentCapacity: activeMembers.length,
      targetCapacity: activeMembers.length,
      minCapacity: 2,
      maxCapacity: 20,
      averageCpu: Math.round(avgCpu),
      averageMemory: Math.round(avgMemory),
      averageResponseTime: Math.round(avgResponseTime),
      totalConnections,
      totalThroughput,
      averageErrorRate: Math.round(avgErrorRate * 100) / 100,
      currentCostPerHour: currentCost,
      projectedCostPerHour: currentCost * 1.1 // 10% buffer
    };
  }

  getMetricsHistory(limit: number = 100): ScalingMetrics[] {
    return this.metrics.slice(-limit);
  }

  // Recommendations
  getRecommendations(): ScalingRecommendation[] {
    const metrics = this.getCurrentMetrics();
    const members = this.getAllPoolMembers();
    const recommendations: ScalingRecommendation[] = [];

    // Check for scale out recommendation
    if (metrics.averageCpu > 70 || metrics.averageResponseTime > 200) {
      recommendations.push({
        id: `rec-${Date.now()}-1`,
        type: 'scale_out',
        priority: 'high',
        title: 'High CPU Utilization Detected',
        description: `Average CPU is at ${metrics.averageCpu}%. Consider scaling out to maintain performance.`,
        currentState: {
          instanceCount: metrics.currentCapacity,
          costPerHour: metrics.currentCostPerHour,
          averageUtilization: metrics.averageCpu
        },
        recommendedState: {
          instanceCount: metrics.currentCapacity + 2,
          costPerHour: metrics.currentCostPerHour + 17,
          expectedUtilization: 50
        },
        riskLevel: 'low',
        createdAt: new Date(),
        expiresAt: new Date(Date.now() + 3600000)
      });
    }

    // Check for cost optimization
    if (metrics.averageCpu < 30 && metrics.currentCapacity > 3) {
      recommendations.push({
        id: `rec-${Date.now()}-2`,
        type: 'optimize',
        priority: 'medium',
        title: 'Cost Optimization Opportunity',
        description: `Low CPU utilization (${metrics.averageCpu}%) with ${metrics.currentCapacity} instances. Scale in to reduce costs.`,
        currentState: {
          instanceCount: metrics.currentCapacity,
          costPerHour: metrics.currentCostPerHour,
          averageUtilization: metrics.averageCpu
        },
        recommendedState: {
          instanceCount: Math.max(3, metrics.currentCapacity - 1),
          costPerHour: metrics.currentCostPerHour - 8.50,
          expectedUtilization: 50
        },
        potentialSavings: (metrics.currentCapacity - 3) * 8.50 * 24 * 30, // Monthly
        riskLevel: 'low',
        createdAt: new Date(),
        expiresAt: new Date(Date.now() + 7200000)
      });
    }

    return recommendations;
  }

  // Predictive Scaling
  getPredictiveConfig(): PredictiveScalingConfig {
    return this.predictiveConfig;
  }

  updatePredictiveConfig(config: Partial<PredictiveScalingConfig>): PredictiveScalingConfig {
    this.predictiveConfig = { ...this.predictiveConfig, ...config };
    return this.predictiveConfig;
  }

  getCapacityForecast(): CapacityForecast[] {
    // Simulate forecast using simple linear trend
    const metrics = this.getMetricsHistory(24);
    const currentCapacity = this.poolMembers.size;
    const forecasts: CapacityForecast[] = [];

    let trend = 0;
    if (metrics.length >= 2) {
      const recent = metrics.slice(-6); // Last hour
      const avgCapacity = recent.reduce((sum, m) => sum + m.currentCapacity, 0) / recent.length;
      trend = avgCapacity - currentCapacity;
    }

    for (let i = 1; i <= 12; i++) { // Next 12 periods (30 min each = 6 hours)
      const predictedCapacity = Math.max(2, Math.min(20, currentCapacity + (trend * i)));
      forecasts.push({
        timestamp: new Date(Date.now() + i * 30 * 60000),
        predictedCapacity: Math.round(predictedCapacity),
        confidenceInterval: {
          lower: Math.round(predictedCapacity * 0.8),
          upper: Math.round(predictedCapacity * 1.2)
        },
        predictedCost: Math.round(predictedCapacity * 8.50 * 100) / 100
      });
    }

    return forecasts;
  }

  // Cost Optimization
  getCostConfig(): CostOptimizationConfig {
    return this.costConfig;
  }

  updateCostConfig(config: Partial<CostOptimizationConfig>): CostOptimizationConfig {
    this.costConfig = { ...this.costConfig, ...config };
    return this.costConfig;
  }

  getCostAnalysis(): {
    currentCostPerHour: number;
    projectedCostPerHour: number;
    dailyCost: number;
    monthlyCost: number;
    potentialSavings: number;
    spotInstanceSavings: number;
  } {
    const metrics = this.getCurrentMetrics();
    const currentCost = metrics.currentCostPerHour;
    const projectedCost = currentCost * 1.1;

    return {
      currentCostPerHour: currentCost,
      projectedCostPerHour: projectedCost,
      dailyCost: currentCost * 24,
      monthlyCost: currentCost * 24 * 30,
      potentialSavings: currentCost * 0.2 * 24 * 30, // 20% optimization potential
      spotInstanceSavings: currentCost * 0.3 * this.costConfig.spotInstancePercentage / 100 * 24 * 30
    };
  }

  // Statistics
  getScalingStats(): {
    totalScaleOutEvents: number;
    totalScaleInEvents: number;
    totalInstancesAdded: number;
    totalInstancesRemoved: number;
    averageScaleOutTime: number;
    averageScaleInTime: number;
    totalCostSavings: number;
  } {
    const scaleOutEvents = this.events.filter(e => e.type === 'scale_out' && e.status === 'completed');
    const scaleInEvents = this.events.filter(e => e.type === 'scale_in' && e.status === 'completed');

    return {
      totalScaleOutEvents: scaleOutEvents.length,
      totalScaleInEvents: scaleInEvents.length,
      totalInstancesAdded: scaleOutEvents.reduce((sum, e) => sum + e.instancesChanged, 0),
      totalInstancesRemoved: scaleInEvents.reduce((sum, e) => sum + Math.abs(e.instancesChanged), 0),
      averageScaleOutTime: scaleOutEvents.length > 0
        ? scaleOutEvents.reduce((sum, e) => sum + (e.duration || 0), 0) / scaleOutEvents.length
        : 0,
      averageScaleInTime: scaleInEvents.length > 0
        ? scaleInEvents.reduce((sum, e) => sum + (e.duration || 0), 0) / scaleInEvents.length
        : 0,
      totalCostSavings: scaleInEvents.reduce((sum, e) => sum + (e.estimatedSavings || 0), 0)
    };
  }

  // Private monitoring
  private startMonitoring(): void {
    // Simulate metrics collection every 10 seconds
    this.metricsInterval = setInterval(() => {
      const metrics = this.getCurrentMetrics();
      this.metrics.push(metrics);
      
      // Keep only last 1000 metrics
      if (this.metrics.length > 1000) {
        this.metrics = this.metrics.slice(-1000);
      }

      // Update pool member metrics with random variations
      this.poolMembers.forEach(member => {
        member.cpu = Math.max(10, Math.min(100, member.cpu + (Math.random() - 0.5) * 10));
        member.memory = Math.max(20, Math.min(100, member.memory + (Math.random() - 0.5) * 5));
        member.responseTime = Math.max(50, Math.min(300, member.responseTime + (Math.random() - 0.5) * 20));
        member.connections = Math.max(0, member.connections + Math.floor((Math.random() - 0.5) * 20));
        member.throughput = Math.max(0, member.throughput + Math.floor((Math.random() - 0.5) * 50));
        
        // Update health based on metrics
        if (member.cpu > 85 || member.memory > 90) {
          member.health = 'degraded';
        } else if (member.errorRate > 5) {
          member.health = 'unhealthy';
        } else {
          member.health = 'healthy';
        }
      });
    }, 10000);

    // Evaluate scaling policies every minute
    this.scalingInterval = setInterval(() => {
      this.evaluateScalingPolicies();
    }, 60000);
  }

  private evaluateScalingPolicies(): void {
    const metrics = this.getCurrentMetrics();

    this.policies.forEach(policy => {
      if (!policy.enabled || policy.status !== 'active') return;

      // Check if we should scale out
      const shouldScaleOut = policy.metrics.some(m => {
        const metricValue = this.getMetricValue(m.metric);
        return metricValue > m.threshold;
      });

      // Check if we should scale in
      const shouldScaleIn = metrics.averageCpu < 30 && metrics.currentCapacity > policy.minInstances;

      if (shouldScaleOut && metrics.currentCapacity < policy.maxInstances) {
        this.scaleOut(policy.id, policy.scaleUp.adjustment, 'Automated scaling based on metric threshold');
      } else if (shouldScaleIn && metrics.currentCapacity > policy.minInstances) {
        this.scaleIn(policy.id, Math.abs(policy.scaleDown.adjustment), 'Automated scale-in based on low utilization');
      }
    });
  }

  private getMetricValue(metric: import('./types').ScalingMetric): number {
    const metrics = this.getCurrentMetrics();
    
    switch (metric) {
      case 'cpu':
        return metrics.averageCpu;
      case 'memory':
        return metrics.averageMemory;
      case 'response_time':
        return metrics.averageResponseTime;
      case 'throughput':
        return metrics.totalThroughput;
      default:
        return 0;
    }
  }

  dispose(): void {
    if (this.metricsInterval) {
      clearInterval(this.metricsInterval);
    }
    if (this.scalingInterval) {
      clearInterval(this.scalingInterval);
    }
  }
}

// Singleton instance
let autoScalingService: AutoScalingService | null = null;

export function getAutoScalingService(): AutoScalingService {
  if (!autoScalingService) {
    autoScalingService = new AutoScalingService();
  }
  return autoScalingService;
}

export function resetAutoScalingService(): void {
  if (autoScalingService) {
    autoScalingService.dispose();
    autoScalingService = null;
  }
}
