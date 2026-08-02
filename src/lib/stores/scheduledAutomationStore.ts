/**
 * Scheduled Automation Store
 * Manages cron-like scheduled tasks for F5 automation
 * Supports recurring maintenance, reporting, compliance checks, and self-healing
 */

import { writable, type Writable } from 'svelte/store';

export type ScheduleFrequency = 'once' | 'hourly' | 'daily' | 'weekly' | 'monthly' | 'custom';
export type ScheduledTaskType = 
  | 'backup' 
  | 'compliance_check' 
  | 'certificate_renewal' 
  | 'config_audit' 
  | 'health_check' 
  | 'log_rotation'
  | 'report_generation'
  | 'drift_detection'
  | 'pool_cleanup'
  | 'ssl_renewal_check';

export type TaskStatus = 'pending' | 'running' | 'completed' | 'failed' | 'paused' | 'disabled';

export interface ScheduledTask {
  id: string;
  name: string;
  description: string;
  type: ScheduledTaskType;
  frequency: ScheduleFrequency;
  cronExpression?: string; // For custom schedules
  nextRunAt: number;
  lastRunAt?: number;
  lastRunStatus?: 'success' | 'failed';
  lastRunResult?: string;
  status: TaskStatus;
  createdAt: number;
  createdBy: string;
  
  // Task-specific configuration
  config: {
    // Backup config
    backupRetentionDays?: number;
    backupLocation?: string;
    includeCerts?: boolean;
    
    // Compliance config
    complianceStandard?: 'pci-dss' | 'soc2' | 'iso27001' | 'mas-trm' | 'custom';
    autoRemediate?: boolean;
    
    // Certificate config
    daysBeforeExpiry?: number;
    autoRenew?: boolean;
    certAuthority?: string;
    
    // Health check config
    checkInterval?: number;
    alertThreshold?: number;
    
    // Report config
    reportType?: 'usage' | 'security' | 'compliance' | 'performance';
    recipients?: string[];
    
    // Pool cleanup config
    maxInactiveDays?: number;
    minRequestCount?: number;
    
    // Custom script/endpoint
    customScript?: string;
    endpoint?: string;
  };
  
  // Execution tracking
  runHistory: TaskRun[];
  maxHistory: number;
  
  // Notifications
  notifications: {
    onSuccess: boolean;
    onFailure: boolean;
    emailRecipients: string[];
    slackWebhook?: string;
  };
}

export interface TaskRun {
  id: string;
  taskId: string;
  startedAt: number;
  completedAt?: number;
  status: 'running' | 'completed' | 'failed';
  result?: any;
  error?: string;
  logs: string[];
}

// Pre-built automation templates for common enterprise needs
export const automationTemplates: Record<string, {
  name: string;
  description: string;
  type: ScheduledTaskType;
  frequency: ScheduleFrequency;
  config: Record<string, any>;
  notifications: {
    onSuccess: boolean;
    onFailure: boolean;
    emailRecipients: string[];
  };
}> = {
  dailyBackup: {
    name: 'Daily Configuration Backup',
    description: 'Automated daily backup of all F5 configurations with 30-day retention',
    type: 'backup',
    frequency: 'daily',
    config: {
      backupRetentionDays: 30,
      backupLocation: '/var/backups/f5',
      includeCerts: true
    },
    notifications: {
      onSuccess: false,
      onFailure: true,
      emailRecipients: []
    }
  },
  
  hourlyCompliance: {
    name: 'Hourly Compliance Check',
    description: 'Continuous compliance monitoring against PCI-DSS requirements',
    type: 'compliance_check',
    frequency: 'hourly',
    config: {
      complianceStandard: 'pci-dss' as const,
      autoRemediate: false
    },
    notifications: {
      onSuccess: false,
      onFailure: true,
      emailRecipients: []
    }
  },
  
  weeklyCertCheck: {
    name: 'Weekly Certificate Audit',
    description: 'Check all SSL certificates for upcoming expiration',
    type: 'ssl_renewal_check',
    frequency: 'weekly',
    config: {
      daysBeforeExpiry: 30,
      autoRenew: false
    },
    notifications: {
      onSuccess: true,
      onFailure: true,
      emailRecipients: []
    }
  },
  
  dailyDriftDetection: {
    name: 'Daily Configuration Drift Detection',
    description: 'Compare current configs against approved baselines',
    type: 'drift_detection',
    frequency: 'daily',
    config: {
      autoRemediate: false
    },
    notifications: {
      onSuccess: false,
      onFailure: true,
      emailRecipients: []
    }
  },
  
  poolCleanup: {
    name: 'Pool Member Cleanup',
    description: 'Remove inactive pool members automatically',
    type: 'pool_cleanup',
    frequency: 'weekly',
    config: {
      maxInactiveDays: 90,
      minRequestCount: 100
    },
    notifications: {
      onSuccess: true,
      onFailure: true,
      emailRecipients: []
    }
  },
  
  monthlyReport: {
    name: 'Monthly Security Report',
    description: 'Generate comprehensive security posture report',
    type: 'report_generation',
    frequency: 'monthly',
    config: {
      reportType: 'security' as const,
      recipients: []
    },
    notifications: {
      onSuccess: true,
      onFailure: true,
      emailRecipients: []
    }
  }
};

function createScheduledAutomationStore() {
  const { subscribe, set, update } = writable<ScheduledTask[]>([]);
  let taskIdCounter = 0;
  let runIdCounter = 0;

  // Load initial data
  const initialTasks: ScheduledTask[] = [
    {
      id: 'task-1',
      name: 'Daily Configuration Backup',
      description: 'Automated daily backup of all F5 configurations',
      type: 'backup',
      frequency: 'daily',
      nextRunAt: Date.now() + 24 * 60 * 60 * 1000,
      lastRunAt: Date.now() - 12 * 60 * 60 * 1000,
      lastRunStatus: 'success',
      status: 'pending',
      createdAt: Date.now() - 30 * 24 * 60 * 60 * 1000,
      createdBy: 'system',
      config: { backupRetentionDays: 30, includeCerts: true },
      runHistory: [],
      maxHistory: 10,
      notifications: { onSuccess: false, onFailure: true, emailRecipients: ['admin@company.com'] }
    },
    {
      id: 'task-2',
      name: 'Hourly Compliance Check',
      description: 'Continuous PCI-DSS compliance monitoring',
      type: 'compliance_check',
      frequency: 'hourly',
      nextRunAt: Date.now() + 60 * 60 * 1000,
      lastRunAt: Date.now() - 30 * 60 * 1000,
      lastRunStatus: 'success',
      status: 'pending',
      createdAt: Date.now() - 15 * 24 * 60 * 60 * 1000,
      createdBy: 'security-team',
      config: { complianceStandard: 'pci-dss', autoRemediate: false },
      runHistory: [],
      maxHistory: 24,
      notifications: { onSuccess: false, onFailure: true, emailRecipients: ['security@company.com'] }
    },
    {
      id: 'task-3',
      name: 'SSL Certificate Renewal Check',
      description: 'Weekly check for certificates expiring within 30 days',
      type: 'ssl_renewal_check',
      frequency: 'weekly',
      nextRunAt: Date.now() + 5 * 24 * 60 * 60 * 1000,
      lastRunAt: Date.now() - 2 * 24 * 60 * 60 * 1000,
      lastRunStatus: 'failed',
      lastRunResult: 'Failed to connect to CA',
      status: 'pending',
      createdAt: Date.now() - 60 * 24 * 60 * 60 * 1000,
      createdBy: 'admin',
      config: { daysBeforeExpiry: 30, autoRenew: false },
      runHistory: [],
      maxHistory: 10,
      notifications: { onSuccess: true, onFailure: true, emailRecipients: ['certs@company.com'] }
    },
    {
      id: 'task-4',
      name: 'Configuration Drift Detection',
      description: 'Detect unauthorized configuration changes',
      type: 'drift_detection',
      frequency: 'daily',
      nextRunAt: Date.now() + 8 * 60 * 60 * 1000,
      status: 'paused',
      createdAt: Date.now() - 10 * 24 * 60 * 60 * 1000,
      createdBy: 'compliance-team',
      config: { autoRemediate: false },
      runHistory: [],
      maxHistory: 10,
      notifications: { onSuccess: false, onFailure: true, emailRecipients: ['compliance@company.com'] }
    }
  ];

  set(initialTasks);

  return {
    subscribe,

    // Create new scheduled task
    createTask: (template: keyof typeof automationTemplates | Partial<ScheduledTask>, createdBy: string): ScheduledTask => {
      const id = `task-${++taskIdCounter}-${Date.now()}`;
      let newTask: ScheduledTask;

      if (typeof template === 'string' && template in automationTemplates) {
        const tmpl = automationTemplates[template as keyof typeof automationTemplates];
        newTask = {
          id,
          name: tmpl.name,
          description: tmpl.description,
          type: tmpl.type,
          frequency: tmpl.frequency,
          nextRunAt: calculateNextRun(tmpl.frequency),
          status: 'pending',
          createdAt: Date.now(),
          createdBy,
          config: { ...tmpl.config },
          runHistory: [],
          maxHistory: 10,
          notifications: { ...tmpl.notifications }
        };
      } else if (template && typeof template === 'object') {
        const partial = template as Partial<ScheduledTask>;
        newTask = {
          id,
          name: partial.name || 'New Task',
          description: partial.description || '',
          type: partial.type || 'health_check',
          frequency: partial.frequency || 'daily',
          nextRunAt: calculateNextRun(partial.frequency || 'daily'),
          status: partial.status || 'pending',
          createdAt: Date.now(),
          createdBy,
          config: partial.config || {},
          runHistory: [],
          maxHistory: 10,
          notifications: partial.notifications || { onSuccess: false, onFailure: true, emailRecipients: [] }
        };
      } else {
        newTask = {
          id,
          name: 'New Task',
          description: '',
          type: 'health_check',
          frequency: 'daily',
          nextRunAt: calculateNextRun('daily'),
          status: 'pending',
          createdAt: Date.now(),
          createdBy,
          config: {},
          runHistory: [],
          maxHistory: 10,
          notifications: { onSuccess: false, onFailure: true, emailRecipients: [] }
        };
      }

      update(tasks => [...tasks, newTask]);
      console.log(`Scheduled task created: ${newTask.name} (${id})`);
      return newTask;
    },

    // Update task
    updateTask: (id: string, updates: Partial<ScheduledTask>) => {
      update(tasks => {
        const index = tasks.findIndex(t => t.id === id);
        if (index === -1) return tasks;
        
        const updated = { ...tasks[index], ...updates };
        if (updates.frequency && !updates.nextRunAt) {
          updated.nextRunAt = calculateNextRun(updates.frequency);
        }
        
        const newTasks = [...tasks];
        newTasks[index] = updated;
        return newTasks;
      });
    },

    // Delete task
    deleteTask: (id: string) => {
      update(tasks => tasks.filter(t => t.id !== id));
      console.log(`Scheduled task deleted: ${id}`);
    },

    // Toggle task status
    toggleTask: (id: string) => {
      update(tasks => {
        const index = tasks.findIndex(t => t.id === id);
        if (index === -1) return tasks;
        
        const newTasks = [...tasks];
        const task = newTasks[index];
        task.status = task.status === 'disabled' || task.status === 'paused' ? 'pending' : 'paused';
        return newTasks;
      });
    },

    // Run task immediately (manual trigger)
    runNow: (id: string): TaskRun => {
      const runId = `run-${++runIdCounter}-${Date.now()}`;
      const run: TaskRun = {
        id: runId,
        taskId: id,
        startedAt: Date.now(),
        status: 'running',
        logs: [`Task started at ${new Date().toISOString()}`]
      };

      update(tasks => {
        const index = tasks.findIndex(t => t.id === id);
        if (index === -1) return tasks;
        
        const newTasks = [...tasks];
        const task = newTasks[index];
        task.runHistory = [run, ...task.runHistory].slice(0, task.maxHistory);
        return newTasks;
      });

      // Simulate async execution
      setTimeout(() => {
        update(tasks => {
          const task = tasks.find(t => t.id === id);
          if (!task) return tasks;
          
          const runIndex = task.runHistory.findIndex(r => r.id === runId);
          if (runIndex === -1) return tasks;
          
          const newTasks = [...tasks];
          const newTask = newTasks.find(t => t.id === id)!;
          const newRun = { ...newTask.runHistory[runIndex] };
          
          // Simulate success/failure
          const success = Math.random() > 0.1;
          newRun.status = success ? 'completed' : 'failed';
          newRun.completedAt = Date.now();
          newRun.result = success ? 'Task completed successfully' : 'Task failed';
          newRun.logs = [...newRun.logs, `Task ${success ? 'completed' : 'failed'} at ${new Date().toISOString()}`];
          
          newTask.runHistory[runIndex] = newRun;
          newTask.lastRunAt = Date.now();
          newTask.lastRunStatus = success ? 'success' : 'failed';
          newTask.lastRunResult = newRun.result;
          
          return newTasks;
        });
      }, 2000);

      return run;
    },

    // Get tasks by type
    getTasksByType: (type: ScheduledTaskType): ScheduledTask[] => {
      let result: ScheduledTask[] = [];
      subscribe(tasks => { result = tasks.filter(t => t.type === type); })();
      return result;
    },

    // Get upcoming tasks
    getUpcomingTasks: (hours: number = 24): ScheduledTask[] => {
      const cutoff = Date.now() + hours * 60 * 60 * 1000;
      let result: ScheduledTask[] = [];
      subscribe(tasks => { 
        result = tasks.filter(t => t.status === 'pending' && t.nextRunAt <= cutoff);
      })();
      return result;
    },

    // Get task statistics
    getStatistics: () => {
      let result = { total: 0, active: 0, paused: 0, failed: 0, success: 0 };
      subscribe(tasks => {
        result = {
          total: tasks.length,
          active: tasks.filter(t => t.status === 'pending' || t.status === 'running').length,
          paused: tasks.filter(t => t.status === 'paused' || t.status === 'disabled').length,
          failed: tasks.filter(t => t.lastRunStatus === 'failed').length,
          success: tasks.filter(t => t.lastRunStatus === 'success').length
        };
      })();
      return result;
    }
  };
}

// Helper function to calculate next run time
function calculateNextRun(frequency: ScheduleFrequency, customCron?: string): number {
  const now = Date.now();
  
  switch (frequency) {
    case 'once':
      return now + 60 * 1000; // 1 minute from now
    case 'hourly':
      return now + 60 * 60 * 1000;
    case 'daily':
      return now + 24 * 60 * 60 * 1000;
    case 'weekly':
      return now + 7 * 24 * 60 * 60 * 1000;
    case 'monthly':
      return now + 30 * 24 * 60 * 60 * 1000;
    case 'custom':
      // Parse simple cron for demo (e.g., "0 */6 * * *" = every 6 hours)
      if (customCron?.includes('*/6')) {
        return now + 6 * 60 * 60 * 1000;
      }
      return now + 60 * 60 * 1000; // Default to hourly
    default:
      return now + 24 * 60 * 60 * 1000;
  }
}

export const scheduledAutomationStore = createScheduledAutomationStore();
