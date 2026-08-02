/**
 * Blue/Green Deployment Service
 * Manages zero-downtime deployments with traffic shifting and automated rollback
 */

import { getConnectionPool } from '../f5/connection-pool';
import { getJobQueue, createDeploymentJob, type F5Job } from '../f5/job-queue';
import { getTransactionManager } from '../f5/transaction';
import { logger } from '../logger';

export type BlueGreenStatus = 'idle' | 'deploying' | 'health_check' | 'shifting' | 'completed' | 'failed' | 'rolling_back';
export type TrafficSplitStrategy = 'instant' | 'gradual' | 'canary';

export interface BlueGreenDeployment {
  id: string;
  name: string;
  description?: string;
  applicationId: string;
  applicationName: string;
  
  // Lanes
  blueLane: LaneInfo;
  greenLane: LaneInfo;
  
  // Current state
  activeLane: 'blue' | 'green';
  trafficSplit: number;  // 0-100, percentage to green
  
  // Status
  status: BlueGreenStatus;
  statusMessage?: string;
  
  // Configuration
  config: BlueGreenConfig;
  
  // Pipeline
  pipeline: DeploymentStage[];
  currentStageIndex: number;
  
  // Timestamps
  createdAt: number;
  startedAt?: number;
  completedAt?: number;
  
  // Results
  deploymentJobId?: string;
  healthCheckResults?: HealthCheckResult[];
  error?: {
    message: string;
    stage?: string;
    details?: any;
  };
  
  // Metadata
  createdBy: string;
  tags?: string[];
}

export interface LaneInfo {
  id: string;
  name: string;
  endpoint?: string;  // Health check endpoint URL (e.g., http://10.0.0.1:8080)
  currentVersion?: string;
  targetVersion: string;
  healthStatus: 'healthy' | 'degraded' | 'unhealthy' | 'unknown';
  serverCount: number;
  healthyServerCount: number;
}

export interface BlueGreenConfig {
  trafficSplitStrategy: TrafficSplitStrategy;
  healthCheck: HealthCheckConfig;
  rollback: RollbackConfig;
  notifications: NotificationConfig;
  hooks?: DeploymentHooks;
}

export interface HealthCheckConfig {
  enabled: boolean;
  url: string;
  method: 'GET' | 'POST' | 'HEAD';
  expectedStatus: number;
  timeout: number;        // milliseconds
  interval: number;       // milliseconds
  retries: number;
  consecutiveSuccesses: number;
}

export interface RollbackConfig {
  automatic: boolean;
  healthCheckFailures: number;
  errorRateThreshold: number;  // percentage
  latencyThreshold: number;    // milliseconds
}

export interface NotificationConfig {
  onStart: boolean;
  onSuccess: boolean;
  onFailure: boolean;
  channels: string[];  // email, slack, webhook
}

export interface DeploymentHooks {
  preDeploy?: HookAction[];
  postDeploy?: HookAction[];
  preTrafficShift?: HookAction[];
  postTrafficShift?: HookAction[];
  onRollback?: HookAction[];
}

export interface HookAction {
  name: string;
  type: 'webhook' | 'script' | 'notification';
  config: Record<string, any>;
}

export interface DeploymentStage {
  id: string;
  name: string;
  status: 'pending' | 'running' | 'completed' | 'failed' | 'skipped';
  order: number;
  execute: (deployment: BlueGreenDeployment) => Promise<void>;
  rollback?: (deployment: BlueGreenDeployment) => Promise<void>;
  canSkip?: (deployment: BlueGreenDeployment) => boolean;
}

export interface HealthCheckResult {
  timestamp: number;
  lane: 'blue' | 'green';
  success: boolean;
  responseTime?: number;
  statusCode?: number;
  error?: string;
}

export interface TrafficShiftStep {
  fromPercent: number;
  toPercent: number;
  duration: number;  // milliseconds to hold at this split
}

export class BlueGreenDeploymentService {
  private deployments: Map<string, BlueGreenDeployment> = new Map();
  private deploymentCounter = 0;

  /**
   * Create a new Blue/Green deployment
   */
  async createDeployment(
    config: Omit<BlueGreenDeployment, 'id' | 'status' | 'pipeline' | 'currentStageIndex' | 'createdAt' | 'trafficSplit' | 'createdBy'>,
    createdBy: string
  ): Promise<BlueGreenDeployment> {
    const id = `bg-${++this.deploymentCounter}-${Date.now()}`;
    
    const deployment: BlueGreenDeployment = {
      ...config,
      id,
      status: 'idle',
      trafficSplit: config.activeLane === 'green' ? 100 : 0,
      pipeline: this.createDefaultPipeline(),
      currentStageIndex: 0,
      createdAt: Date.now(),
      createdBy
    };

    this.deployments.set(id, deployment);
    logger.info(`Blue/Green deployment ${id} created: ${config.name}`);
    
    return deployment;
  }

  /**
   * Start the deployment pipeline
   */
  async startDeployment(deploymentId: string): Promise<void> {
    const deployment = this.getDeployment(deploymentId);
    if (!deployment) {
      throw new Error(`Deployment ${deploymentId} not found`);
    }

    if (deployment.status !== 'idle') {
      throw new Error(`Cannot start deployment with status: ${deployment.status}`);
    }

    deployment.status = 'deploying';
    deployment.startedAt = Date.now();

    logger.info(`Starting Blue/Green deployment ${deploymentId}`);

    // Execute pipeline stages
    try {
      for (let i = 0; i < deployment.pipeline.length; i++) {
        deployment.currentStageIndex = i;
        const stage: DeploymentStage | undefined = deployment.pipeline[i];
        if (!stage) continue;

        // Check if stage can be skipped
        if (stage.canSkip?.(deployment)) {
          stage.status = 'skipped';
          continue;
        }

        stage.status = 'running';
        logger.info(`Executing stage: ${stage.name}`);

        try {
          await stage.execute(deployment);
          stage.status = 'completed';
          logger.info(`Stage completed: ${stage.name}`);
        } catch (error: any) {
          stage.status = 'failed';
          deployment.status = 'failed';
          deployment.error = {
            message: error.message,
            stage: stage.name,
            details: error
          };
          
          logger.error(`Stage failed: ${stage.name}`, error);
          
          // Trigger automatic rollback if configured
          if (deployment.config.rollback.automatic) {
            await this.rollbackDeployment(deploymentId);
          }
          
          throw error;
        }
      }

      deployment.status = 'completed';
      deployment.completedAt = Date.now();
      logger.info(`Blue/Green deployment ${deploymentId} completed successfully`);

    } catch (error: any) {
      logger.error(`Blue/Green deployment ${deploymentId} failed:`, error);
      throw error;
    }
  }

  /**
   * Shift traffic between blue and green
   */
  async shiftTraffic(
    deploymentId: string,
    targetPercent: number,
    strategy: 'gradual' | 'instant' = 'instant'
  ): Promise<void> {
    const deployment = this.getDeployment(deploymentId);
    if (!deployment) {
      throw new Error(`Deployment ${deploymentId} not found`);
    }

    const currentPercent = deployment.trafficSplit;
    
    if (strategy === 'instant') {
      await this.updateTrafficSplit(deployment, targetPercent);
    } else {
      // Gradual shift
      const steps = this.calculateShiftSteps(currentPercent, targetPercent);
      
      for (const step of steps) {
        await this.updateTrafficSplit(deployment, step.toPercent);
        await this.sleep(step.duration);
        
        // Verify health after each step
        const health = await this.checkHealth(deployment);
        if (!health.healthy) {
          throw new Error(`Health check failed at ${step.toPercent}% traffic: ${health.message}`);
        }
      }
    }

    // Update active lane based on traffic split
    deployment.activeLane = targetPercent >= 50 ? 'green' : 'blue';
  }

  /**
   * Execute rollback
   */
  async rollbackDeployment(deploymentId: string): Promise<void> {
    const deployment = this.getDeployment(deploymentId);
    if (!deployment) {
      throw new Error(`Deployment ${deploymentId} not found`);
    }

    deployment.status = 'rolling_back';
    logger.info(`Rolling back deployment ${deploymentId}`);

    try {
      // Execute rollback for completed stages in reverse order
      for (let i = deployment.currentStageIndex; i >= 0; i--) {
        const stage = deployment.pipeline[i];
        if (stage.status === 'completed' && stage.rollback) {
          logger.info(`Rolling back stage: ${stage.name}`);
          await stage.rollback(deployment);
        }
      }

      // Revert traffic to original lane
      const originalSplit = deployment.activeLane === 'blue' ? 100 : 0;
      await this.updateTrafficSplit(deployment, originalSplit);

      deployment.status = 'failed';
      deployment.completedAt = Date.now();
      
      logger.info(`Rollback completed for deployment ${deploymentId}`);

    } catch (error: any) {
      deployment.error = {
        message: `Rollback failed: ${error.message}`,
        details: error
      };
      logger.error(`Rollback failed for deployment ${deploymentId}:`, error);
      throw error;
    }
  }

  /**
   * Get deployment by ID
   */
  getDeployment(id: string): BlueGreenDeployment | undefined {
    return this.deployments.get(id);
  }

  /**
   * Get all deployments
   */
  getAllDeployments(): BlueGreenDeployment[] {
    return Array.from(this.deployments.values())
      .sort((a, b) => b.createdAt - a.createdAt);
  }

  /**
   * Get deployments by application
   */
  getDeploymentsByApplication(applicationId: string): BlueGreenDeployment[] {
    return this.getAllDeployments()
      .filter(d => d.applicationId === applicationId);
  }

  /**
   * Get active deployment for an application
   */
  getActiveDeployment(applicationId: string): BlueGreenDeployment | undefined {
    return this.getAllDeployments().find(d => 
      d.applicationId === applicationId &&
      ['deploying', 'health_check', 'shifting'].includes(d.status)
    );
  }

  /**
   * Cancel a deployment
   */
  async cancelDeployment(deploymentId: string): Promise<void> {
    const deployment = this.getDeployment(deploymentId);
    if (!deployment) {
      throw new Error(`Deployment ${deploymentId} not found`);
    }

    if (['completed', 'failed', 'rolling_back'].includes(deployment.status)) {
      throw new Error(`Cannot cancel deployment with status: ${deployment.status}`);
    }

    // Cancel the F5 job if running
    if (deployment.deploymentJobId) {
      const queue = getJobQueue();
      await queue.cancel(deployment.deploymentJobId);
    }

    deployment.status = 'failed';
    deployment.error = {
      message: 'Deployment cancelled by user'
    };
    deployment.completedAt = Date.now();

    logger.info(`Deployment ${deploymentId} cancelled`);
  }

  /**
   * Run health checks
   */
  async runHealthChecks(deploymentId: string): Promise<HealthCheckResult[]> {
    const deployment = this.getDeployment(deploymentId);
    if (!deployment) {
      throw new Error(`Deployment ${deploymentId} not found`);
    }

    const results: HealthCheckResult[] = [];
    const config = deployment.config.healthCheck;

    if (!config.enabled) {
      return results;
    }

    const lanes: Array<'blue' | 'green'> = ['blue', 'green'];

    for (const laneColor of lanes) {
      const lane = laneColor === 'blue' ? deployment.blueLane : deployment.greenLane;
      
      // Run health checks with retries
      let consecutiveSuccesses = 0;
      
      for (let attempt = 0; attempt < config.retries; attempt++) {
        const result = await this.executeHealthCheck(lane, config);
        results.push(result);

        if (result.success) {
          consecutiveSuccesses++;
          if (consecutiveSuccesses >= config.consecutiveSuccesses) {
            break;
          }
        } else {
          consecutiveSuccesses = 0;
        }

        await this.sleep(config.interval);
      }

      // Update lane health status
      lane.healthStatus = consecutiveSuccesses >= config.consecutiveSuccesses 
        ? 'healthy' 
        : 'unhealthy';
    }

    deployment.healthCheckResults = results;
    return results;
  }

  /**
   * Delete old deployments
   */
  cleanup(maxAge: number = 30 * 24 * 60 * 60 * 1000): number {
    const cutoff = Date.now() - maxAge;
    let removed = 0;

    for (const [id, deployment] of this.deployments) {
      if (deployment.completedAt && deployment.completedAt < cutoff) {
        this.deployments.delete(id);
        removed++;
      }
    }

    if (removed > 0) {
      logger.info(`Cleaned up ${removed} old deployments`);
    }

    return removed;
  }

  private createDefaultPipeline(): DeploymentStage[] {
    return [
      {
        id: 'stage-1',
        name: 'Pre-Deployment Validation',
        status: 'pending',
        order: 1,
        execute: async (deployment) => {
          // Validate configuration
          if (!deployment.blueLane.targetVersion && !deployment.greenLane.targetVersion) {
            throw new Error('No target version specified for either lane');
          }
          
          // Check for active deployment on same application
          const active = this.getActiveDeployment(deployment.applicationId);
          if (active && active.id !== deployment.id) {
            throw new Error(`Another deployment is active for this application: ${active.name}`);
          }

          deployment.statusMessage = 'Validation passed';
        }
      },
      {
        id: 'stage-2',
        name: 'Deploy to Inactive Lane',
        status: 'pending',
        order: 2,
        execute: async (deployment) => {
          deployment.status = 'deploying';
          
          const inactiveLane = deployment.activeLane === 'blue' ? 'green' : 'blue';
          const lane = inactiveLane === 'blue' ? deployment.blueLane : deployment.greenLane;
          
          // Create F5 deployment job
          const queue = getJobQueue();
          const jobOptions = createDeploymentJob(
            `Deploy ${deployment.applicationName} to ${lane.name}`,
            lane.name,
            {
              class: 'AS3',
              action: 'deploy',
              persist: true,
              declaration: {
                class: 'ADC',
                schemaVersion: '3.43.0',
                [lane.name]: {
                  class: 'Tenant',
                  [deployment.applicationName]: {
                    class: 'Application',
                    template: 'generic'
                    // Additional AS3 configuration would go here
                  }
                }
              }
            },
            deployment.createdBy
          );

          const job = await queue.enqueue(jobOptions);
          deployment.deploymentJobId = job.id;

          // Wait for deployment to complete (poll)
          await this.waitForJobCompletion(job.id, 30 * 60 * 1000); // 30 min timeout
          
          deployment.statusMessage = `Deployed to ${inactiveLane} lane`;
        },
        rollback: async (deployment) => {
          // Undeploy from inactive lane
          if (deployment.deploymentJobId) {
            const queue = getJobQueue();
            await queue.rollback(deployment.deploymentJobId);
          }
        },
        canSkip: (deployment) => {
          // Skip if target version is already deployed
          const inactiveLane = deployment.activeLane === 'blue' ? deployment.greenLane : deployment.blueLane;
          return inactiveLane.currentVersion === inactiveLane.targetVersion;
        }
      },
      {
        id: 'stage-3',
        name: 'Health Checks',
        status: 'pending',
        order: 3,
        execute: async (deployment) => {
          deployment.status = 'health_check';
          
          const results = await this.runHealthChecks(deployment.id);
          
          const failedChecks = results.filter(r => !r.success);
          if (failedChecks.length > 0) {
            throw new Error(`Health checks failed: ${failedChecks.map(f => f.error).join(', ')}`);
          }

          deployment.statusMessage = 'Health checks passed';
        },
        rollback: async (deployment) => {
          // No rollback needed for health checks
        }
      },
      {
        id: 'stage-4',
        name: 'Traffic Shift',
        status: 'pending',
        order: 4,
        execute: async (deployment) => {
          deployment.status = 'shifting';
          
          // Shift traffic to new lane (100%)
          const newActiveLane = deployment.activeLane === 'blue' ? 'green' : 'blue';
          const targetSplit = newActiveLane === 'green' ? 100 : 0;
          
          await this.shiftTraffic(
            deployment.id, 
            targetSplit, 
            deployment.config.trafficSplitStrategy === 'gradual' ? 'gradual' : 'instant'
          );

          deployment.statusMessage = 'Traffic shifted to new lane';
        },
        rollback: async (deployment) => {
          // Revert traffic split
          const originalSplit = deployment.activeLane === 'blue' ? 0 : 100;
          await this.updateTrafficSplit(deployment, originalSplit);
        }
      },
      {
        id: 'stage-5',
        name: 'Post-Deployment Verification',
        status: 'pending',
        order: 5,
        execute: async (deployment) => {
          // Run final health checks on new active lane
          const results = await this.runHealthChecks(deployment.id);
          
          const newActiveLane = deployment.activeLane === 'blue' ? deployment.blueLane : deployment.greenLane;
          if (newActiveLane.healthStatus !== 'healthy') {
            throw new Error('Post-deployment health check failed');
          }

          // Update current version on lanes
          if (deployment.activeLane === 'blue') {
            deployment.blueLane.currentVersion = deployment.blueLane.targetVersion;
          } else {
            deployment.greenLane.currentVersion = deployment.greenLane.targetVersion;
          }

          deployment.statusMessage = 'Deployment verified';
        }
      }
    ];
  }

  private async updateTrafficSplit(deployment: BlueGreenDeployment, percent: number): Promise<void> {
    const pool = getConnectionPool();
    
    // Update traffic split in F5
    await pool.execute(async (client) => {
      // Update pool member ratios or use iRules for traffic splitting
      // This is a simplified implementation
      const blueWeight = 100 - percent;
      const greenWeight = percent;

      // Example: Update pool member ratios
      await client.patch(`/tm/ltm/pool/~${deployment.blueLane.name}~pool`, {
        members: {
          ratio: blueWeight
        }
      });

      await client.patch(`/tm/ltm/pool/~${deployment.greenLane.name}~pool`, {
        members: {
          ratio: greenWeight
        }
      });
    });

    deployment.trafficSplit = percent;
    logger.debug(`Updated traffic split for ${deployment.id}: ${percent}% to green`);
  }

  private async checkHealth(deployment: BlueGreenDeployment): Promise<{ healthy: boolean; message?: string }> {
    const results = await this.runHealthChecks(deployment.id);
    const failed = results.filter(r => !r.success);
    
    if (failed.length > deployment.config.rollback.healthCheckFailures) {
      return { 
        healthy: false, 
        message: `Too many health check failures: ${failed.length}` 
      };
    }

    return { healthy: true };
  }

  private async executeHealthCheck(lane: LaneInfo, config: HealthCheckConfig): Promise<HealthCheckResult> {
    const startTime = Date.now();
    
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), config.timeout);

      // Build health check URL
      // In production, this would use actual lane endpoint URLs
      const baseUrl = lane.endpoint || `http://${lane.name}`;
      const url = `${baseUrl}${config.url}`;
      
      try {
        const response = await fetch(url, {
          method: config.method,
          signal: controller.signal,
          headers: {
            'Accept': 'application/json',
            'User-Agent': 'F5-Control-Center-HealthCheck/1.0'
          }
        });
        
        clearTimeout(timeoutId);
        
        const success = response.status === config.expectedStatus;
        
        return {
          timestamp: Date.now(),
          lane: lane.id as 'blue' | 'green',
          success,
          responseTime: Date.now() - startTime,
          statusCode: response.status
        };
      } catch (fetchError: any) {
        clearTimeout(timeoutId);
        
        // Handle specific error types
        if (fetchError.name === 'AbortError') {
          return {
            timestamp: Date.now(),
            lane: lane.id as 'blue' | 'green',
            success: false,
            responseTime: Date.now() - startTime,
            error: `Health check timeout after ${config.timeout}ms`
          };
        }
        
        return {
          timestamp: Date.now(),
          lane: lane.id as 'blue' | 'green',
          success: false,
          responseTime: Date.now() - startTime,
          error: fetchError.message
        };
      }

    } catch (error: any) {
      return {
        timestamp: Date.now(),
        lane: lane.id as 'blue' | 'green',
        success: false,
        responseTime: Date.now() - startTime,
        error: error.message
      };
    }
  }

  private calculateShiftSteps(fromPercent: number, toPercent: number): TrafficShiftStep[] {
    const steps: TrafficShiftStep[] = [];
    const increment = toPercent > fromPercent ? 10 : -10;
    let current = fromPercent;

    while ((increment > 0 && current < toPercent) || (increment < 0 && current > toPercent)) {
      const next = increment > 0 
        ? Math.min(current + increment, toPercent)
        : Math.max(current + increment, toPercent);
      
      steps.push({
        fromPercent: current,
        toPercent: next,
        duration: 60000 // 1 minute between steps
      });
      
      current = next;
    }

    return steps;
  }

  private async waitForJobCompletion(jobId: string, timeout: number): Promise<void> {
    const queue = getJobQueue();
    const startTime = Date.now();
    
    while (Date.now() - startTime < timeout) {
      const job = queue.getJob(jobId);
      
      if (!job) {
        throw new Error('Job not found');
      }

      if (job.status === 'completed') {
        return;
      }

      if (job.status === 'failed') {
        throw new Error(`Job failed: ${job.error?.message}`);
      }

      if (job.status === 'cancelled') {
        throw new Error('Job was cancelled');
      }

      await this.sleep(5000); // Check every 5 seconds
    }

    throw new Error('Timeout waiting for job completion');
  }

  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// Singleton instance
let blueGreenService: BlueGreenDeploymentService | null = null;

export function getBlueGreenService(): BlueGreenDeploymentService {
  if (!blueGreenService) {
    blueGreenService = new BlueGreenDeploymentService();
  }
  return blueGreenService;
}

export function resetBlueGreenService(): void {
  blueGreenService = null;
}
