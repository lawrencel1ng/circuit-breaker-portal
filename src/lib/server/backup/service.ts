/**
 * Backup & Disaster Recovery Service
 * Manages F5 configuration backups, restores, and DR operations
 */

import type {
  BackupJob,
  BackupDestination,
  BackupSchedule,
  RestoreJob,
  DisasterRecoveryPlan,
  DRRunbookStep,
  BackupStatistics,
  BackupHealthStatus
} from './types';
import { logger } from '../logger';
import { getF5Client } from '../f5';

// Default destinations
const DEFAULT_DESTINATIONS: BackupDestination[] = [
  {
    id: 'dest-local',
    name: 'Local Storage',
    type: 'local',
    path: '/var/backups/f5/',
    lastTested: new Date(),
    testStatus: 'success'
  }
];

// Default schedules
const DEFAULT_SCHEDULES: BackupSchedule[] = [
  {
    id: 'schedule-daily',
    name: 'Daily UCS Backup',
    enabled: true,
    backupType: 'ucs',
    sourceDevice: 'bigip-01',
    destinationId: 'dest-local',
    frequency: 'daily',
    timezone: 'Asia/Singapore',
    daily: { time: '02:00' },
    retention: { policy: 'count', value: 7 },
    notifications: {
      onSuccess: false,
      onFailure: true,
      emailRecipients: ['admin@ocbc.com']
    },
    runCount: 0,
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    id: 'schedule-weekly',
    name: 'Weekly Full Backup',
    enabled: true,
    backupType: 'full',
    sourceDevice: 'bigip-01',
    destinationId: 'dest-local',
    frequency: 'weekly',
    timezone: 'Asia/Singapore',
    weekly: { dayOfWeek: 0, time: '03:00' },
    retention: { policy: 'count', value: 4 },
    notifications: {
      onSuccess: true,
      onFailure: true,
      emailRecipients: ['admin@ocbc.com', 'backup@ocbc.com']
    },
    runCount: 0,
    createdAt: new Date(),
    updatedAt: new Date()
  }
];

// Default DR Plan
const DEFAULT_DR_PLAN: DisasterRecoveryPlan = {
  id: 'dr-plan-001',
  name: 'Primary DR Plan',
  description: 'Disaster recovery plan for primary data center',
  enabled: true,
  primarySite: 'datacenter-singapore',
  drSite: 'datacenter-hongkong',
  affectedDevices: ['bigip-01', 'bigip-02', 'gtm-01'],
  rto: 60,
  rpo: 15,
  failover: {
    type: 'manual',
    triggerEvents: ['datacenter_outage', 'network_partition'],
    healthCheckInterval: 30,
    confirmationRequired: true,
    confirmationTimeout: 10
  },
  failback: {
    type: 'manual',
    healthCheckInterval: 60,
    synchronizationRequired: true
  },
  runbook: [
    {
      id: 'step-1',
      order: 1,
      name: 'Declare Disaster',
      description: 'Management approval for DR activation',
      type: 'approval',
      expectedDuration: 5,
      status: 'pending'
    },
    {
      id: 'step-2',
      order: 2,
      name: 'Stop Replication',
      description: 'Stop data replication to avoid split-brain',
      type: 'automated',
      automationScript: 'stop_replication.sh',
      expectedDuration: 2,
      status: 'pending'
    },
    {
      id: 'step-3',
      order: 3,
      name: 'Activate DR Site',
      description: 'Bring up F5 devices in DR site',
      type: 'automated',
      automationScript: 'activate_dr.sh',
      expectedDuration: 15,
      dependsOn: ['step-2'],
      status: 'pending'
    },
    {
      id: 'step-4',
      order: 4,
      name: 'Update DNS',
      description: 'Update GTM/DNS to point to DR site',
      type: 'automated',
      automationScript: 'update_dns.sh',
      expectedDuration: 5,
      dependsOn: ['step-3'],
      status: 'pending'
    },
    {
      id: 'step-5',
      order: 5,
      name: 'Health Check',
      description: 'Verify all services are healthy in DR',
      type: 'automated',
      automationScript: 'health_check.sh',
      expectedDuration: 10,
      dependsOn: ['step-4'],
      status: 'pending'
    },
    {
      id: 'step-6',
      order: 6,
      name: 'Notify Stakeholders',
      description: 'Send notification that DR is active',
      type: 'automated',
      automationScript: 'notify.sh',
      expectedDuration: 1,
      dependsOn: ['step-5'],
      status: 'pending'
    }
  ],
  lastTested: new Date('2024-01-15'),
  testResult: 'success',
  testNotes: 'DR drill completed successfully. RTO met.'
};

export class BackupService {
  private backups: Map<string, BackupJob> = new Map();
  private destinations: Map<string, BackupDestination> = new Map();
  private schedules: Map<string, BackupSchedule> = new Map();
  private restores: Map<string, RestoreJob> = new Map();
  private drPlans: Map<string, DisasterRecoveryPlan> = new Map();
  private scheduleInterval: NodeJS.Timeout | null = null;

  constructor() {
    // Initialize default destinations
    DEFAULT_DESTINATIONS.forEach(dest => {
      this.destinations.set(dest.id, dest);
    });

    // Initialize default schedules
    DEFAULT_SCHEDULES.forEach(schedule => {
      this.schedules.set(schedule.id, schedule);
    });

    // Initialize DR plan
    this.drPlans.set(DEFAULT_DR_PLAN.id, DEFAULT_DR_PLAN);

    // Start schedule processor
    this.startScheduleProcessor();
  }

  // Backup Job Management
  async createBackup(config: Omit<BackupJob, 'id' | 'createdAt' | 'status'>): Promise<BackupJob> {
    const backup: BackupJob = {
      ...config,
      id: `backup-${Date.now()}`,
      status: 'pending',
      createdAt: new Date()
    };

    this.backups.set(backup.id, backup);
    logger.info(`Created backup job: ${backup.id}`);

    // Execute backup asynchronously
    this.executeBackup(backup.id).catch(error => {
      logger.error(`Backup ${backup.id} failed:`, error);
    });

    return backup;
  }

  getAllBackups(): BackupJob[] {
    return Array.from(this.backups.values()).sort((a, b) => 
      b.createdAt.getTime() - a.createdAt.getTime()
    );
  }

  getBackup(id: string): BackupJob | undefined {
    return this.backups.get(id);
  }

  async cancelBackup(id: string): Promise<void> {
    const backup = this.backups.get(id);
    if (!backup) {
      throw new Error(`Backup ${id} not found`);
    }

    if (backup.status === 'in_progress') {
      backup.status = 'cancelled';
      logger.info(`Backup ${id} cancelled`);
    }
  }

  async deleteBackup(id: string): Promise<void> {
    const backup = this.backups.get(id);
    if (!backup) {
      throw new Error(`Backup ${id} not found`);
    }

    // Delete backup file if exists
    if (backup.filePath) {
      // Would delete actual file here
      logger.info(`Deleted backup file: ${backup.filePath}`);
    }

    this.backups.delete(id);
    logger.info(`Deleted backup record: ${id}`);
  }

  // Destination Management
  getAllDestinations(): BackupDestination[] {
    return Array.from(this.destinations.values());
  }

  getDestination(id: string): BackupDestination | undefined {
    return this.destinations.get(id);
  }

  createDestination(destination: Omit<BackupDestination, 'id'>): BackupDestination {
    const newDest: BackupDestination = {
      ...destination,
      id: `dest-${Date.now()}`
    };

    this.destinations.set(newDest.id, newDest);
    logger.info(`Created backup destination: ${newDest.id}`);
    return newDest;
  }

  async testDestination(id: string): Promise<{ success: boolean; message: string }> {
    const destination = this.destinations.get(id);
    if (!destination) {
      throw new Error(`Destination ${id} not found`);
    }

    try {
      // Simulate connection test
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      destination.lastTested = new Date();
      destination.testStatus = 'success';
      destination.testError = undefined;

      return { success: true, message: 'Connection successful' };
    } catch (error: any) {
      destination.lastTested = new Date();
      destination.testStatus = 'failed';
      destination.testError = error.message;

      return { success: false, message: error.message };
    }
  }

  // Schedule Management
  getAllSchedules(): BackupSchedule[] {
    return Array.from(this.schedules.values());
  }

  getSchedule(id: string): BackupSchedule | undefined {
    return this.schedules.get(id);
  }

  createSchedule(schedule: Omit<BackupSchedule, 'id' | 'runCount' | 'createdAt' | 'updatedAt'>): BackupSchedule {
    const newSchedule: BackupSchedule = {
      ...schedule,
      id: `schedule-${Date.now()}`,
      runCount: 0,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    newSchedule.nextRun = this.calculateNextRun(newSchedule);
    this.schedules.set(newSchedule.id, newSchedule);
    logger.info(`Created backup schedule: ${newSchedule.id}`);
    return newSchedule;
  }

  updateSchedule(id: string, updates: Partial<BackupSchedule>): BackupSchedule {
    const existing = this.schedules.get(id);
    if (!existing) {
      throw new Error(`Schedule ${id} not found`);
    }

    const updated = { ...existing, ...updates, updatedAt: new Date() };
    updated.nextRun = this.calculateNextRun(updated);
    this.schedules.set(id, updated);
    logger.info(`Updated backup schedule: ${id}`);
    return updated;
  }

  deleteSchedule(id: string): void {
    if (!this.schedules.has(id)) {
      throw new Error(`Schedule ${id} not found`);
    }
    this.schedules.delete(id);
    logger.info(`Deleted backup schedule: ${id}`);
  }

  // Restore Management
  async createRestore(config: Omit<RestoreJob, 'id' | 'createdAt' | 'status'>): Promise<RestoreJob> {
    const restore: RestoreJob = {
      ...config,
      id: `restore-${Date.now()}`,
      status: 'pending',
      createdAt: new Date()
    };

    this.restores.set(restore.id, restore);
    logger.info(`Created restore job: ${restore.id}`);

    // Execute restore asynchronously
    this.executeRestore(restore.id).catch(error => {
      logger.error(`Restore ${restore.id} failed:`, error);
    });

    return restore;
  }

  getAllRestores(): RestoreJob[] {
    return Array.from(this.restores.values()).sort((a, b) => 
      b.createdAt.getTime() - a.createdAt.getTime()
    );
  }

  getRestore(id: string): RestoreJob | undefined {
    return this.restores.get(id);
  }

  // DR Plan Management
  getAllDRPlans(): DisasterRecoveryPlan[] {
    return Array.from(this.drPlans.values());
  }

  getDRPlan(id: string): DisasterRecoveryPlan | undefined {
    return this.drPlans.get(id);
  }

  createDRPlan(plan: Omit<DisasterRecoveryPlan, 'id'>): DisasterRecoveryPlan {
    const newPlan: DisasterRecoveryPlan = {
      ...plan,
      id: `dr-plan-${Date.now()}`
    };

    this.drPlans.set(newPlan.id, newPlan);
    logger.info(`Created DR plan: ${newPlan.id}`);
    return newPlan;
  }

  async executeDRPlan(planId: string, triggeredBy: string): Promise<DisasterRecoveryPlan> {
    const plan = this.drPlans.get(planId);
    if (!plan) {
      throw new Error(`DR Plan ${planId} not found`);
    }

    logger.info(`Executing DR plan: ${planId}`);

    // Execute runbook steps
    for (const step of plan.runbook) {
      if (step.dependsOn) {
        // Wait for dependencies
        const depsCompleted = step.dependsOn.every(depId => {
          const dep = plan.runbook.find(s => s.id === depId);
          return dep?.status === 'completed';
        });

        if (!depsCompleted) {
          step.status = 'pending';
          continue;
        }
      }

      step.status = 'in_progress';
      step.startedAt = new Date();

      try {
        if (step.type === 'automated' && step.automationScript) {
          // Execute automation script
          await this.executeAutomationScript(step.automationScript);
        }

        step.status = 'completed';
        step.completedAt = new Date();
        step.executedBy = triggeredBy;
      } catch (error: any) {
        step.status = 'failed';
        step.error = error.message;
        logger.error(`DR step ${step.id} failed:`, error);
        break;
      }
    }

    return plan;
  }

  async testDRPlan(planId: string): Promise<{ success: boolean; results: any[] }> {
    const plan = this.drPlans.get(planId);
    if (!plan) {
      throw new Error(`DR Plan ${planId} not found`);
    }

    logger.info(`Testing DR plan: ${planId}`);

    // Simulate DR test
    const results: any[] = [];
    
    for (const step of plan.runbook) {
      const result = {
        stepId: step.id,
        name: step.name,
        status: 'success',
        duration: Math.random() * step.expectedDuration
      };
      results.push(result);
    }

    plan.lastTested = new Date();
    plan.testResult = 'success';
    plan.testNotes = 'Automated test completed successfully';

    return { success: true, results };
  }

  // Statistics
  getStatistics(): BackupStatistics {
    const backups = this.getAllBackups();
    const restores = this.getAllRestores();
    const now = new Date();
    const dayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    const completedBackups = backups.filter(b => b.status === 'completed');
    const totalSize = completedBackups.reduce((sum, b) => sum + (b.size || 0), 0);

    return {
      totalBackups: backups.length,
      completedBackups: completedBackups.length,
      failedBackups: backups.filter(b => b.status === 'failed').length,
      storageUsed: totalSize,
      storageSaved: totalSize * 0.3, // Simulate 30% compression
      lastBackupAt: completedBackups[0]?.completedAt,
      nextScheduledBackup: this.getNextScheduledBackup(),
      averageBackupSize: completedBackups.length > 0 ? totalSize / completedBackups.length : 0,
      averageBackupDuration: completedBackups.length > 0
        ? completedBackups.reduce((sum, b) => sum + (b.duration || 0), 0) / completedBackups.length
        : 0,
      restoreCount: restores.length,
      successfulRestores: restores.filter(r => r.status === 'completed').length,
      failedRestores: restores.filter(r => r.status === 'failed').length,
      complianceStatus: {
        last24Hours: completedBackups.some(b => b.completedAt && b.completedAt > dayAgo),
        last7Days: completedBackups.some(b => b.completedAt && b.completedAt > weekAgo),
        last30Days: completedBackups.some(b => b.completedAt && b.completedAt > monthAgo)
      }
    };
  }

  // Health Status
  getHealthStatus(): BackupHealthStatus {
    const backups = this.getAllBackups();
    const completedBackups = backups.filter(b => b.status === 'completed');
    const lastBackup = completedBackups[0];
    const now = new Date();
    
    const issues: BackupHealthStatus['issues'] = [];
    let overall: BackupHealthStatus['overall'] = 'healthy';

    // Check last backup age
    if (!lastBackup) {
      issues.push({
        severity: 'critical',
        message: 'No backups found',
        recommendation: 'Create an immediate backup'
      });
      overall = 'critical';
    } else if (lastBackup.completedAt) {
      const ageHours = (now.getTime() - lastBackup.completedAt.getTime()) / (60 * 60 * 1000);
      if (ageHours > 48) {
        issues.push({
          severity: 'critical',
          message: `Last backup is ${Math.round(ageHours)} hours old`,
          recommendation: 'Check backup schedules and run manual backup'
        });
        overall = 'critical';
      } else if (ageHours > 24) {
        issues.push({
          severity: 'warning',
          message: `Last backup is ${Math.round(ageHours)} hours old`,
          recommendation: 'Verify backup schedule is running correctly'
        });
        overall = overall === 'healthy' ? 'degraded' : overall;
      }
    }

    // Check failed backups
    const recentFailures = backups.filter(b => 
      b.status === 'failed' && b.createdAt > new Date(now.getTime() - 24 * 60 * 60 * 1000)
    );
    
    if (recentFailures.length > 0) {
      issues.push({
        severity: 'warning',
        message: `${recentFailures.length} backup failures in the last 24 hours`,
        recommendation: 'Review backup logs and destination connectivity'
      });
      overall = overall === 'healthy' ? 'degraded' : overall;
    }

    return {
      overall,
      lastBackup: lastBackup ? {
        status: 'success',
        time: lastBackup.completedAt,
        age: lastBackup.completedAt 
          ? Math.round((now.getTime() - lastBackup.completedAt.getTime()) / (60 * 1000))
          : undefined
      } : { status: 'none' },
      destinations: this.getAllDestinations().map(d => ({
        id: d.id,
        name: d.name,
        status: d.testStatus === 'success' ? 'available' : 'unknown',
        lastTested: d.lastTested
      })),
      schedules: {
        total: this.schedules.size,
        enabled: Array.from(this.schedules.values()).filter(s => s.enabled).length,
        overdue: Array.from(this.schedules.values()).filter(s => {
          return s.enabled && s.nextRun && s.nextRun < now;
        }).length
      },
      issues
    };
  }

  // Private methods
  private async executeBackup(backupId: string): Promise<void> {
    const backup = this.backups.get(backupId);
    if (!backup) return;

    backup.status = 'in_progress';
    backup.startedAt = new Date();

    try {
      // Get F5 client
      const f5Client = getF5Client();

      // Simulate backup process
      await new Promise(resolve => setTimeout(resolve, 5000));

      // Generate backup file
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const filename = `${backup.sourceDevice}_${backup.type}_${timestamp}.ucs`;
      
      backup.filePath = `/var/backups/f5/${filename}`;
      backup.size = Math.floor(Math.random() * 500 * 1024 * 1024) + 100 * 1024 * 1024; // 100-600MB
      backup.checksum = this.generateChecksum();
      backup.status = 'completed';
      backup.completedAt = new Date();
      backup.duration = (backup.completedAt.getTime() - backup.startedAt.getTime()) / 1000;

      logger.info(`Backup ${backupId} completed successfully`);

      // Apply retention policy if from schedule
      if (backup.scheduleId) {
        await this.applyRetentionPolicy(backup.scheduleId);
      }
    } catch (error: any) {
      backup.status = 'failed';
      backup.errorMessage = error.message;
      logger.error(`Backup ${backupId} failed:`, error);
    }
  }

  private async executeRestore(restoreId: string): Promise<void> {
    const restore = this.restores.get(restoreId);
    if (!restore) return;

    restore.status = 'in_progress';
    restore.startedAt = new Date();

    try {
      // Pre-validation
      restore.preValidation = {
        passed: true,
        warnings: ['Virtual server IPs will be temporarily unavailable'],
        errors: []
      };

      // Simulate restore process
      await new Promise(resolve => setTimeout(resolve, 10000));

      restore.restoredItems = [
        'ltm virtual vs_app_1',
        'ltm pool pool_app_1',
        'ltm profile clientssl app_ssl'
      ];

      restore.postValidation = {
        passed: true,
        warnings: [],
        errors: []
      };

      restore.status = 'completed';
      restore.completedAt = new Date();
      restore.duration = (restore.completedAt.getTime() - restore.startedAt.getTime()) / 1000;

      logger.info(`Restore ${restoreId} completed successfully`);
    } catch (error: any) {
      restore.status = 'failed';
      restore.errorMessage = error.message;
      logger.error(`Restore ${restoreId} failed:`, error);
    }
  }

  private async applyRetentionPolicy(scheduleId: string): Promise<void> {
    const schedule = this.schedules.get(scheduleId);
    if (!schedule) return;

    const backups = this.getAllBackups().filter(b => b.scheduleId === scheduleId);
    
    if (schedule.retention.policy === 'count' && schedule.retention.value) {
      // Keep only N most recent backups
      const toDelete = backups.slice(schedule.retention.value);
      for (const backup of toDelete) {
        await this.deleteBackup(backup.id);
      }
    } else if (schedule.retention.policy === 'days' && schedule.retention.value) {
      // Delete backups older than N days
      const cutoff = new Date(Date.now() - schedule.retention.value * 24 * 60 * 60 * 1000);
      for (const backup of backups) {
        if (backup.createdAt < cutoff) {
          await this.deleteBackup(backup.id);
        }
      }
    }
  }

  private calculateNextRun(schedule: BackupSchedule): Date | undefined {
    const now = new Date();
    const timezone = schedule.timezone || 'UTC';

    switch (schedule.frequency) {
      case 'hourly':
        return new Date(now.getTime() + 60 * 60 * 1000);
      
      case 'daily':
        if (schedule.daily) {
          const [hours, minutes] = schedule.daily.time.split(':').map(Number);
          const next = new Date(now);
          next.setHours(hours, minutes, 0, 0);
          if (next <= now) {
            next.setDate(next.getDate() + 1);
          }
          return next;
        }
        break;
      
      case 'weekly':
        if (schedule.weekly) {
          const [hours, minutes] = schedule.weekly.time.split(':').map(Number);
          const next = new Date(now);
          next.setHours(hours, minutes, 0, 0);
          
          const dayDiff = schedule.weekly.dayOfWeek - next.getDay();
          if (dayDiff > 0) {
            next.setDate(next.getDate() + dayDiff);
          } else if (dayDiff < 0) {
            next.setDate(next.getDate() + 7 + dayDiff);
          } else if (next <= now) {
            next.setDate(next.getDate() + 7);
          }
          return next;
        }
        break;
      
      case 'monthly':
        if (schedule.monthly) {
          const [hours, minutes] = schedule.monthly.time.split(':').map(Number);
          const next = new Date(now.getFullYear(), now.getMonth(), schedule.monthly.dayOfMonth, hours, minutes);
          if (next <= now) {
            next.setMonth(next.getMonth() + 1);
          }
          return next;
        }
        break;
    }

    return undefined;
  }

  private getNextScheduledBackup(): Date | undefined {
    const nextRuns = Array.from(this.schedules.values())
      .filter(s => s.enabled && s.nextRun)
      .map(s => s.nextRun!)
      .sort((a, b) => a.getTime() - b.getTime());
    
    return nextRuns[0];
  }

  private async executeAutomationScript(script: string): Promise<void> {
    // Would execute actual automation script
    logger.info(`Executing automation script: ${script}`);
    await new Promise(resolve => setTimeout(resolve, 2000));
  }

  private generateChecksum(): string {
    return Math.random().toString(36).substring(2, 15) + 
           Math.random().toString(36).substring(2, 15);
  }

  private startScheduleProcessor(): void {
    this.scheduleInterval = setInterval(async () => {
      const now = new Date();
      
      for (const schedule of this.schedules.values()) {
        if (!schedule.enabled) continue;
        if (!schedule.nextRun || schedule.nextRun > now) continue;

        try {
          // Create backup from schedule
          await this.createBackup({
            name: `${schedule.name} - ${now.toISOString()}`,
            type: schedule.backupType,
            sourceDevice: schedule.sourceDevice,
            destination: this.destinations.get(schedule.destinationId)!,
            encryption: { enabled: true, algorithm: 'aes-256' },
            include: {
              ucs: true,
              scf: true,
              as3Declarations: true,
              sslCerts: true,
              wafPolicies: true,
              apmProfiles: true
            },
            triggeredBy: 'scheduled',
            scheduleId: schedule.id
          });

          schedule.runCount++;
          schedule.lastRun = now;
          schedule.nextRun = this.calculateNextRun(schedule);
        } catch (error) {
          logger.error(`Scheduled backup ${schedule.id} failed:`, error);
        }
      }
    }, 60000); // Check every minute
  }

  dispose(): void {
    if (this.scheduleInterval) {
      clearInterval(this.scheduleInterval);
    }
  }
}

// Singleton instance
let backupService: BackupService | null = null;

export function getBackupService(): BackupService {
  if (!backupService) {
    backupService = new BackupService();
  }
  return backupService;
}

export function resetBackupService(): void {
  if (backupService) {
    backupService.dispose();
    backupService = null;
  }
}
