/**
 * F5 Async Job Queue
 * Manages long-running F5 operations with progress tracking
 * Supports deployment jobs, configuration changes, and bulk operations
 */

import { writable, type Writable } from 'svelte/store';
import { logger } from '../logger';
import { getConnectionPool } from './connection-pool';
import type { F5iControlClient } from './icontrol-client';

export type JobStatus = 'pending' | 'running' | 'paused' | 'completed' | 'failed' | 'cancelled';
export type JobType = 'deploy' | 'undeploy' | 'config_change' | 'backup' | 'restore' | 'bulk_update';

export interface JobStep {
  id: string;
  name: string;
  status: 'pending' | 'running' | 'completed' | 'failed' | 'skipped';
  startTime?: number;
  endTime?: number;
  duration?: number;
  message?: string;
  result?: any;
}

export interface F5Job {
  id: string;
  type: JobType;
  name: string;
  description?: string;
  status: JobStatus;
  createdAt: number;
  startedAt?: number;
  completedAt?: number;
  createdBy: string;
  
  // Steps
  steps: JobStep[];
  currentStepIndex: number;
  
  // Progress
  progress: number; // 0-100
  
  // Results
  result?: any;
  error?: {
    message: string;
    code?: string;
    details?: any;
  };
  
  // Rollback
  rollbackAvailable: boolean;
  rollbackSteps?: JobStep[];
  rollbackStatus?: 'available' | 'in_progress' | 'completed' | 'failed';
  
  // Metadata
  metadata?: {
    tenant?: string;
    application?: string;
    targetDevice?: string;
    [key: string]: any;
  };
}

export interface JobOptions {
  name: string;
  description?: string;
  type: JobType;
  createdBy: string;
  steps: JobStepDefinition[];
  rollbackSteps?: JobStepDefinition[];
  metadata?: Record<string, any>;
}

export interface JobStepDefinition {
  id: string;
  name: string;
  execute: (client: F5iControlClient, context: JobContext) => Promise<any>;
  rollback?: (client: F5iControlClient, context: JobContext, stepResult: any) => Promise<void>;
  skipIf?: (context: JobContext) => boolean;
  timeout?: number; // milliseconds
}

export interface JobContext {
  jobId: string;
  stepResults: Map<string, any>;
  sharedData: Map<string, any>;
  cancelRequested: boolean;
}

interface JobExecution {
  job: F5Job;
  steps: JobStepDefinition[];
  context: JobContext;
  promise: Promise<void>;
}

export class F5JobQueue {
  private jobs: Map<string, F5Job> = new Map();
  private executions: Map<string, JobExecution> = new Map();
  private jobStore: Writable<F5Job[]>;
  private maxConcurrentJobs = 3;
  private maxJobsInMemory = 1000; // Prevent memory leak
  private runningJobs = 0;
  private jobCounter = 0;
  private cleanupTimer: NodeJS.Timeout | null = null;

  constructor() {
    this.jobStore = writable<F5Job[]>([]);
    this.startCleanupTimer();
  }

  /**
   * Start periodic cleanup timer
   */
  private startCleanupTimer(): void {
    // Clean up old jobs every 10 minutes
    this.cleanupTimer = setInterval(() => {
      this.cleanup(24 * 60 * 60 * 1000); // Keep 24 hours of jobs
    }, 10 * 60 * 1000);
  }

  /**
   * Stop the cleanup timer
   */
  destroy(): void {
    if (this.cleanupTimer) {
      clearInterval(this.cleanupTimer);
      this.cleanupTimer = null;
    }
  }

  /**
   * Get the job store for reactive updates
   */
  getStore(): Writable<F5Job[]> {
    return this.jobStore;
  }

  /**
   * Enqueue a new job
   */
  async enqueue(options: JobOptions): Promise<F5Job> {
    // Enforce max jobs limit to prevent memory leak
    if (this.jobs.size >= this.maxJobsInMemory) {
      // Remove oldest completed/failed/cancelled jobs
      const jobsToRemove = this.getAllJobs()
        .filter(j => j.status === 'completed' || j.status === 'failed' || j.status === 'cancelled')
        .sort((a, b) => (a.completedAt || 0) - (b.completedAt || 0))
        .slice(0, Math.floor(this.maxJobsInMemory * 0.1)); // Remove 10% of limit
      
      for (const job of jobsToRemove) {
        this.jobs.delete(job.id);
        this.executions.delete(job.id);
      }
      
      if (this.jobs.size >= this.maxJobsInMemory) {
        throw new Error(`Job queue is full (max ${this.maxJobsInMemory} jobs). Please wait for existing jobs to complete.`);
      }
    }

    const id = `job-${++this.jobCounter}-${Date.now()}`;
    
    const job: F5Job = {
      id,
      type: options.type,
      name: options.name,
      description: options.description,
      status: 'pending',
      createdAt: Date.now(),
      createdBy: options.createdBy,
      steps: options.steps.map(s => ({
        id: s.id,
        name: s.name,
        status: 'pending'
      })),
      currentStepIndex: 0,
      progress: 0,
      rollbackAvailable: !!options.rollbackSteps?.length,
      metadata: options.metadata
    };

    this.jobs.set(id, job);
    this.updateStore();

    logger.info(`Job ${id} enqueued: ${options.name}`);

    // Start execution if under concurrent limit
    this.processQueue();

    return job;
  }

  /**
   * Get job by ID
   */
  getJob(id: string): F5Job | undefined {
    return this.jobs.get(id);
  }

  /**
   * Get all jobs
   */
  getAllJobs(): F5Job[] {
    return Array.from(this.jobs.values()).sort((a, b) => b.createdAt - a.createdAt);
  }

  /**
   * Get jobs by status
   */
  getJobsByStatus(status: JobStatus): F5Job[] {
    return this.getAllJobs().filter(j => j.status === status);
  }

  /**
   * Cancel a job
   */
  async cancel(jobId: string): Promise<boolean> {
    const execution = this.executions.get(jobId);
    
    if (execution) {
      execution.context.cancelRequested = true;
      
      // Wait briefly for graceful cancellation
      await this.sleep(5000);
      
      const job = this.jobs.get(jobId);
      if (job && job.status === 'running') {
        job.status = 'cancelled';
        job.completedAt = Date.now();
        this.updateStore();
        logger.info(`Job ${jobId} cancelled`);
      }
      
      return true;
    }

    // Job not running yet, mark as cancelled
    const job = this.jobs.get(jobId);
    if (job && job.status === 'pending') {
      job.status = 'cancelled';
      this.updateStore();
      return true;
    }

    return false;
  }

  /**
   * Retry a failed job
   */
  async retry(jobId: string, createdBy: string): Promise<F5Job | null> {
    const originalJob = this.jobs.get(jobId);
    if (!originalJob) return null;

    // Create new job with same parameters
    const execution = this.executions.get(jobId);
    if (!execution) return null;

    const newJob = await this.enqueue({
      name: `${originalJob.name} (Retry)`,
      description: originalJob.description,
      type: originalJob.type,
      createdBy,
      steps: execution.steps,
      rollbackSteps: originalJob.rollbackSteps ? execution.steps : undefined,
      metadata: originalJob.metadata
    });

    return newJob;
  }

  /**
   * Execute rollback for a job
   */
  async rollback(jobId: string): Promise<boolean> {
    const job = this.jobs.get(jobId);
    const execution = this.executions.get(jobId);
    
    if (!job || !execution || !job.rollbackAvailable) {
      return false;
    }

    if (job.rollbackStatus === 'in_progress') {
      throw new Error('Rollback already in progress');
    }

    job.rollbackStatus = 'in_progress';
    this.updateStore();

    try {
      const pool = getConnectionPool();
      
      await pool.execute(async (client) => {
        // Execute rollback steps in reverse order
        const completedSteps = job.steps.filter(s => s.status === 'completed');
        
        for (let i = completedSteps.length - 1; i >= 0; i--) {
          const stepResult = completedSteps[i];
          const stepDef = execution.steps.find(s => s.id === stepResult.id);
          
          if (stepDef?.rollback) {
            logger.info(`Rolling back step ${stepResult.id}`);
            await stepDef.rollback(client, execution.context, stepResult.result);
          }
        }
      });

      job.rollbackStatus = 'completed';
      this.updateStore();
      logger.info(`Rollback completed for job ${jobId}`);
      return true;

    } catch (error: any) {
      job.rollbackStatus = 'failed';
      this.updateStore();
      logger.error(`Rollback failed for job ${jobId}:`, error);
      throw error;
    }
  }

  /**
   * Clean up old jobs
   */
  cleanup(maxAge: number = 7 * 24 * 60 * 60 * 1000): number {
    const cutoff = Date.now() - maxAge;
    let removed = 0;

    for (const [id, job] of this.jobs) {
      if (job.completedAt && job.completedAt < cutoff) {
        this.jobs.delete(id);
        this.executions.delete(id);
        removed++;
      }
    }

    if (removed > 0) {
      this.updateStore();
      logger.info(`Cleaned up ${removed} old jobs`);
    }

    return removed;
  }

  private async processQueue(): Promise<void> {
    if (this.runningJobs >= this.maxConcurrentJobs) {
      return;
    }

    const pendingJob = this.getAllJobs().find(j => j.status === 'pending');
    if (!pendingJob) {
      return;
    }

    this.runningJobs++;
    pendingJob.status = 'running';
    pendingJob.startedAt = Date.now();
    this.updateStore();

    // Get execution details
    const execution = this.executions.get(pendingJob.id);
    if (!execution) {
      // This shouldn't happen, but handle gracefully
      pendingJob.status = 'failed';
      pendingJob.error = { message: 'Execution details not found' };
      pendingJob.completedAt = Date.now();
      this.runningJobs--;
      this.updateStore();
      return;
    }

    // Execute the job
    execution.promise = this.executeJob(pendingJob, execution);
    
    // When done, process next job
    execution.promise.finally(() => {
      this.runningJobs--;
      this.processQueue();
    });
  }

  private async executeJob(job: F5Job, execution: JobExecution): Promise<void> {
    const pool = getConnectionPool();
    
    try {
      await pool.execute(async (client) => {
        for (let i = 0; i < execution.steps.length; i++) {
          if (execution.context.cancelRequested) {
            throw new Error('Job cancelled by user');
          }

          const stepDef = execution.steps[i];
          const step = job.steps[i];
          
          job.currentStepIndex = i;
          step.status = 'running';
          step.startTime = Date.now();
          this.updateStore();

          // Check if step should be skipped
          if (stepDef.skipIf?.(execution.context)) {
            step.status = 'skipped';
            step.endTime = Date.now();
            continue;
          }

          try {
            // Execute step with timeout
            const timeout = stepDef.timeout || 300000; // 5 min default
            const result = await this.executeWithTimeout(
              () => stepDef.execute(client, execution.context),
              timeout
            );

            step.status = 'completed';
            step.endTime = Date.now();
            step.duration = step.endTime - step.startTime;
            step.result = result;
            
            execution.context.stepResults.set(stepDef.id, result);
            
            logger.info(`Step ${stepDef.id} completed for job ${job.id}`);

          } catch (error: any) {
            step.status = 'failed';
            step.endTime = Date.now();
            step.message = error.message;
            
            job.status = 'failed';
            job.error = {
              message: error.message,
              code: error.code,
              details: error.details
            };
            
            logger.error(`Step ${stepDef.id} failed for job ${job.id}:`, error);
            throw error;
          }

          // Update progress
          job.progress = Math.round(((i + 1) / execution.steps.length) * 100);
          this.updateStore();
        }

        // All steps completed
        job.status = 'completed';
        job.progress = 100;
        job.completedAt = Date.now();
        
        logger.info(`Job ${job.id} completed successfully`);
      });

    } catch (error: any) {
      if (job.status !== 'cancelled') {
        job.status = 'failed';
        job.completedAt = Date.now();
        
        if (!job.error) {
          job.error = {
            message: error.message,
            code: error.code,
            details: error.details
          };
        }
        
        logger.error(`Job ${job.id} failed:`, error);
      }
    }

    this.updateStore();
  }

  private async executeWithTimeout<T>(fn: () => Promise<T>, timeout: number): Promise<T> {
    return Promise.race([
      fn(),
      new Promise<T>((_, reject) => {
        setTimeout(() => reject(new Error(`Step timeout after ${timeout}ms`)), timeout);
      })
    ]);
  }

  private updateStore(): void {
    this.jobStore.set(this.getAllJobs());
  }

  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// Singleton instance
let jobQueue: F5JobQueue | null = null;

export function getJobQueue(): F5JobQueue {
  if (!jobQueue) {
    jobQueue = new F5JobQueue();
  }
  return jobQueue;
}

export function resetJobQueue(): void {
  if (jobQueue) {
    jobQueue.destroy();
    jobQueue = null;
  }
}

// Helper functions for common job types
export function createDeploymentJob(
  name: string,
  tenant: string,
  declaration: any,
  createdBy: string
): JobOptions {
  return {
    name,
    type: 'deploy',
    createdBy,
    steps: [
      {
        id: 'validate',
        name: 'Validate Declaration',
        execute: async (client) => {
          const response = await client.post('shared/appsvcs/declare', {
            ...declaration,
            action: 'dry-run'
          });
          return response;
        }
      },
      {
        id: 'backup',
        name: 'Backup Current Configuration',
        execute: async (client, context) => {
          const current = await client.get(`shared/appsvcs/declare/${tenant}`);
          context.sharedData.set('backup', current);
          return current;
        }
      },
      {
        id: 'deploy',
        name: 'Deploy Configuration',
        execute: async (client) => {
          const response = await client.post('shared/appsvcs/declare', declaration);
          return response;
        },
        timeout: 600000 // 10 minutes for deployment
      },
      {
        id: 'verify',
        name: 'Verify Deployment',
        execute: async (client) => {
          // Wait a moment for deployment to stabilize
          await new Promise(r => setTimeout(r, 5000));
          const status = await client.get('shared/appsvcs/task');
          return status;
        }
      }
    ],
    rollbackSteps: [
      {
        id: 'restore',
        name: 'Restore Previous Configuration',
        execute: async (client, context) => {
          const backup = context.sharedData.get('backup');
          if (backup) {
            await client.post('shared/appsvcs/declare', backup);
          }
        }
      }
    ],
    metadata: { tenant }
  };
}
