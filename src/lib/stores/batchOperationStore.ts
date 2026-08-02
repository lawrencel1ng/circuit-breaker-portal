/**
 * Batch Operations Store
 * Manages bulk changes across multiple F5 devices
 * Enables mass configuration updates, certificate deployments, and policy rollouts
 */

import { writable, type Writable } from 'svelte/store';


export type BatchOperationType = 
  | 'config_update'
  | 'cert_deploy'
  | 'policy_rollout'
  | 'software_upgrade'
  | 'license_update'
  | 'backup_all'
  | 'health_check'
  | 'compliance_scan'
  | 'parameter_update';

export type BatchStatus = 
  | 'draft'
  | 'validating'
  | 'pending_approval'
  | 'approved'
  | 'running'
  | 'paused'
  | 'completed'
  | 'failed'
  | 'rolling_back';

export type DeviceStatus = 'pending' | 'queued' | 'running' | 'completed' | 'failed' | 'skipped' | 'rolled_back';

export interface BatchOperation {
  id: string;
  name: string;
  description: string;
  type: BatchOperationType;
  status: BatchStatus;
  
  // Target devices
  targetDevices: TargetDevice[];
  
  // Operation configuration
  config: {
    // Config update
    as3Declaration?: any;
    doDeclaration?: any;
    
    // Certificate
    certName?: string;
    certData?: string;
    keyData?: string;
    
    // Policy
    policyName?: string;
    policyRules?: any[];
    
    // Software
    version?: string;
    imageLocation?: string;
    
    // Parameters
    parameters?: Record<string, any>;
    
    // Rollout strategy
    batchSize?: number;
    parallelism?: number;
    delayBetweenBatches?: number;
    
    // Error handling
    continueOnError?: boolean;
    autoRollback?: boolean;
    rollbackThreshold?: number; // Percentage of failures to trigger rollback
  };
  
  // Execution tracking
  createdAt: number;
  createdBy: string;
  approvedAt?: number;
  approvedBy?: string;
  startedAt?: number;
  completedAt?: number;
  
  // Progress
  totalDevices: number;
  completedDevices: number;
  failedDevices: number;
  skippedDevices: number;
  progress: number; // 0-100
  
  // Results
  results: DeviceResult[];
  summary?: {
    successRate: number;
    averageDuration: number;
    errors: string[];
  };
  
  // Schedule
  scheduledFor?: number;
  timezone?: string;
  
  // Maintenance window
  maintenanceWindow?: {
    start: number;
    end: number;
    description: string;
  };
}

export interface TargetDevice {
  id: string;
  name: string;
  ip: string;
  datacenter: string;
  environment: 'production' | 'staging' | 'development' | 'dr';
  status: DeviceStatus;
  order: number; // For sequential execution
  
  // Execution details
  startedAt?: number;
  completedAt?: number;
  duration?: number;
  result?: any;
  error?: string;
  logs: string[];
}

export interface DeviceResult {
  deviceId: string;
  deviceName: string;
  status: DeviceStatus;
  duration: number;
  output?: string;
  error?: string;
  rollbackResult?: string;
}

// Pre-built batch operation templates
export const batchOperationTemplates = {
  certRollout: {
    name: 'Global Certificate Deployment',
    description: 'Deploy new SSL certificate to all production load balancers',
    type: 'cert_deploy' as BatchOperationType,
    config: {
      batchSize: 5,
      parallelism: 2,
      delayBetweenBatches: 300000, // 5 minutes
      continueOnError: true,
      autoRollback: true,
      rollbackThreshold: 20
    }
  },
  
  wafPolicyRollout: {
    name: 'WAF Policy Update',
    description: 'Roll out updated OWASP policy to all WAF-enabled devices',
    type: 'policy_rollout' as BatchOperationType,
    config: {
      batchSize: 3,
      parallelism: 1,
      delayBetweenBatches: 600000, // 10 minutes
      continueOnError: false,
      autoRollback: true,
      rollbackThreshold: 10
    }
  },
  
  configSync: {
    name: 'Configuration Synchronization',
    description: 'Synchronize configuration across all devices in a cluster',
    type: 'config_update' as BatchOperationType,
    config: {
      batchSize: 10,
      parallelism: 5,
      delayBetweenBatches: 60000,
      continueOnError: true,
      autoRollback: false
    }
  },
  
  backupAll: {
    name: 'Global Backup Operation',
    description: 'Backup configurations from all F5 devices',
    type: 'backup_all' as BatchOperationType,
    config: {
      batchSize: 20,
      parallelism: 10,
      delayBetweenBatches: 30000,
      continueOnError: true,
      autoRollback: false
    }
  },
  
  complianceScan: {
    name: 'Compliance Assessment',
    description: 'Run compliance checks across all devices',
    type: 'compliance_scan' as BatchOperationType,
    config: {
      batchSize: 15,
      parallelism: 5,
      delayBetweenBatches: 60000,
      continueOnError: true,
      autoRollback: false
    }
  },
  
  parameterUpdate: {
    name: 'Global Parameter Update',
    description: 'Update system parameters (NTP, DNS, SNMP) across all devices',
    type: 'parameter_update' as BatchOperationType,
    config: {
      batchSize: 10,
      parallelism: 3,
      delayBetweenBatches: 120000,
      continueOnError: true,
      autoRollback: true,
      rollbackThreshold: 30
    }
  }
};

function createBatchOperationStore() {
  const { subscribe, set, update } = writable<BatchOperation[]>([]);
  let operationIdCounter = 0;

  // Initialize with sample operations
  const initialOperations: BatchOperation[] = [
    {
      id: 'batch-1',
      name: 'Production Certificate Renewal',
      description: 'Deploy new wildcard certificate to all production VIPs',
      type: 'cert_deploy',
      status: 'completed',
      targetDevices: [
        { id: 'dev-1', name: 'prod-lb-01', ip: '10.1.1.10', datacenter: 'DC1', environment: 'production', status: 'completed', order: 1, logs: [] },
        { id: 'dev-2', name: 'prod-lb-02', ip: '10.1.1.11', datacenter: 'DC1', environment: 'production', status: 'completed', order: 2, logs: [] },
        { id: 'dev-3', name: 'prod-lb-03', ip: '10.1.2.10', datacenter: 'DC2', environment: 'production', status: 'completed', order: 3, logs: [] },
        { id: 'dev-4', name: 'prod-lb-04', ip: '10.1.2.11', datacenter: 'DC2', environment: 'production', status: 'completed', order: 4, logs: [] }
      ],
      config: {
        batchSize: 2,
        parallelism: 1,
        continueOnError: true,
        autoRollback: true,
        rollbackThreshold: 25
      },
      createdAt: Date.now() - 7 * 24 * 60 * 60 * 1000,
      createdBy: 'admin',
      approvedAt: Date.now() - 7 * 24 * 60 * 60 * 1000 + 3600000,
      approvedBy: 'security-team',
      startedAt: Date.now() - 6 * 24 * 60 * 60 * 1000,
      completedAt: Date.now() - 6 * 24 * 60 * 60 * 1000 + 7200000,
      totalDevices: 4,
      completedDevices: 4,
      failedDevices: 0,
      skippedDevices: 0,
      progress: 100,
      results: [],
      summary: {
        successRate: 100,
        averageDuration: 1800000,
        errors: []
      }
    },
    {
      id: 'batch-2',
      name: 'WAF Policy v2.5 Rollout',
      description: 'Update OWASP Core Rule Set to v3.3.5',
      type: 'policy_rollout',
      status: 'running',
      targetDevices: [
        { id: 'dev-1', name: 'prod-lb-01', ip: '10.1.1.10', datacenter: 'DC1', environment: 'production', status: 'completed', order: 1, logs: [] },
        { id: 'dev-2', name: 'prod-lb-02', ip: '10.1.1.11', datacenter: 'DC1', environment: 'production', status: 'running', order: 2, logs: [] },
        { id: 'dev-3', name: 'prod-lb-03', ip: '10.1.2.10', datacenter: 'DC2', environment: 'production', status: 'queued', order: 3, logs: [] },
        { id: 'dev-4', name: 'prod-lb-04', ip: '10.1.2.11', datacenter: 'DC2', environment: 'production', status: 'queued', order: 4, logs: [] }
      ],
      config: {
        batchSize: 1,
        parallelism: 1,
        delayBetweenBatches: 600000,
        continueOnError: false,
        autoRollback: true,
        rollbackThreshold: 10
      },
      createdAt: Date.now() - 2 * 24 * 60 * 60 * 1000,
      createdBy: 'security-team',
      approvedAt: Date.now() - 1 * 24 * 60 * 60 * 1000,
      approvedBy: 'security-manager',
      startedAt: Date.now() - 3600000,
      totalDevices: 4,
      completedDevices: 1,
      failedDevices: 0,
      skippedDevices: 0,
      progress: 25,
      results: [],
      maintenanceWindow: {
        start: Date.now() - 3600000,
        end: Date.now() + 4 * 3600000,
        description: 'Scheduled maintenance window for WAF policy update'
      }
    },
    {
      id: 'batch-3',
      name: 'Global NTP Server Update',
      description: 'Update NTP configuration across all devices',
      type: 'parameter_update',
      status: 'pending_approval',
      targetDevices: [
        { id: 'dev-1', name: 'prod-lb-01', ip: '10.1.1.10', datacenter: 'DC1', environment: 'production', status: 'pending', order: 1, logs: [] },
        { id: 'dev-2', name: 'prod-lb-02', ip: '10.1.1.11', datacenter: 'DC1', environment: 'production', status: 'pending', order: 2, logs: [] },
        { id: 'dev-3', name: 'dr-lb-01', ip: '10.2.1.10', datacenter: 'DR', environment: 'dr', status: 'pending', order: 3, logs: [] }
      ],
      config: {
        batchSize: 3,
        parallelism: 2,
        continueOnError: true,
        autoRollback: true,
        rollbackThreshold: 30,
        parameters: {
          ntpServers: ['ntp1.company.com', 'ntp2.company.com']
        }
      },
      createdAt: Date.now() - 4 * 60 * 60 * 1000,
      createdBy: 'network-team',
      totalDevices: 3,
      completedDevices: 0,
      failedDevices: 0,
      skippedDevices: 0,
      progress: 0,
      results: []
    }
  ];

  set(initialOperations);

  return {
    subscribe,

    // Create new batch operation
    createOperation: (
      template: keyof typeof batchOperationTemplates | Partial<BatchOperation>,
      targetDevices: TargetDevice[],
      createdBy: string
    ): BatchOperation => {
      const id = `batch-${++operationIdCounter}-${Date.now()}`;
      let newOperation: BatchOperation;

      if (typeof template === 'string' && template in batchOperationTemplates) {
        const tmpl = batchOperationTemplates[template];
        newOperation = {
          id,
          name: tmpl.name,
          description: tmpl.description,
          type: tmpl.type,
          status: 'draft',
          targetDevices: targetDevices.map((d, i) => ({ ...d, order: i + 1, logs: [] })),
          config: { ...tmpl.config },
          createdAt: Date.now(),
          createdBy,
          totalDevices: targetDevices.length,
          completedDevices: 0,
          failedDevices: 0,
          skippedDevices: 0,
          progress: 0,
          results: []
        };
      } else {
        newOperation = {
          id,
          name: 'New Batch Operation',
          description: '',
          type: 'config_update',
          status: 'draft',
          targetDevices: targetDevices.map((d, i) => ({ ...d, order: i + 1, logs: [] })),
          config: {
            batchSize: 5,
            parallelism: 2,
            continueOnError: true,
            autoRollback: false
          },
          createdAt: Date.now(),
          createdBy,
          totalDevices: targetDevices.length,
          completedDevices: 0,
          failedDevices: 0,
          skippedDevices: 0,
          progress: 0,
          results: [],
          ...(template as Partial<BatchOperation>)
        };
      }

      update(ops => [newOperation, ...ops]);
      console.log(`Batch operation created: ${newOperation.name} (${id})`);
      return newOperation;
    },

    // Update operation
    updateOperation: (id: string, updates: Partial<BatchOperation>) => {
      update(ops => {
        const index = ops.findIndex(o => o.id === id);
        if (index === -1) return ops;

        const newOps = [...ops];
        newOps[index] = { ...newOps[index], ...updates };
        return newOps;
      });
    },

    // Submit for approval
    submitForApproval: (id: string) => {
      update(ops => {
        const index = ops.findIndex(o => o.id === id);
        if (index === -1) return ops;

        const newOps = [...ops];
        newOps[index].status = 'pending_approval';
        return newOps;
      });
    },

    // Approve operation
    approve: (id: string, approvedBy: string) => {
      update(ops => {
        const index = ops.findIndex(o => o.id === id);
        if (index === -1) return ops;

        const newOps = [...ops];
        newOps[index].status = 'approved';
        newOps[index].approvedAt = Date.now();
        newOps[index].approvedBy = approvedBy;
        return newOps;
      });
    },

    // Start operation
    start: (id: string) => {
      update(ops => {
        const index = ops.findIndex(o => o.id === id);
        if (index === -1) return ops;

        const newOps = [...ops];
        newOps[index].status = 'running';
        newOps[index].startedAt = Date.now();
        return newOps;
      });

      // Simulate execution
      simulateExecution(id);
    },

    // Pause operation
    pause: (id: string) => {
      update(ops => {
        const index = ops.findIndex(o => o.id === id);
        if (index === -1) return ops;

        const newOps = [...ops];
        if (newOps[index].status === 'running') {
          newOps[index].status = 'paused';
        }
        return newOps;
      });
    },

    // Resume operation
    resume: (id: string) => {
      update(ops => {
        const index = ops.findIndex(o => o.id === id);
        if (index === -1) return ops;

        const newOps = [...ops];
        if (newOps[index].status === 'paused') {
          newOps[index].status = 'running';
        }
        return newOps;
      });
    },

    // Cancel operation
    cancel: (id: string) => {
      update(ops => {
        const index = ops.findIndex(o => o.id === id);
        if (index === -1) return ops;

        const newOps = [...ops];
        if (['running', 'paused', 'approved'].includes(newOps[index].status)) {
          newOps[index].status = 'failed';
          newOps[index].completedAt = Date.now();
        }
        return newOps;
      });
    },

    // Rollback operation
    rollback: (id: string) => {
      update(ops => {
        const index = ops.findIndex(o => o.id === id);
        if (index === -1) return ops;

        const newOps = [...ops];
        newOps[index].status = 'rolling_back';
        return newOps;
      });

      // Simulate rollback
      setTimeout(() => {
        update(ops => {
          const index = ops.findIndex(o => o.id === id);
          if (index === -1) return ops;

          const newOps = [...ops];
          newOps[index].targetDevices.forEach(d => {
            if (d.status === 'completed') {
              d.status = 'rolled_back';
              d.logs.push('Configuration rolled back');
            }
          });
          newOps[index].status = 'completed';
          newOps[index].completedAt = Date.now();
          return newOps;
        });
      }, 5000);
    },

    // Delete operation
    deleteOperation: (id: string) => {
      update(ops => ops.filter(o => o.id !== id));
      console.log(`Batch operation deleted: ${id}`);
    },

    // Get operations by status
    getByStatus: (status: BatchStatus): BatchOperation[] => {
      let result: BatchOperation[] = [];
      subscribe(ops => { result = ops.filter(o => o.status === status); })();
      return result;
    },

    // Get operations by type
    getByType: (type: BatchOperationType): BatchOperation[] => {
      let result: BatchOperation[] = [];
      subscribe(ops => { result = ops.filter(o => o.type === type); })();
      return result;
    },

    // Get statistics
    getStatistics: () => {
      let result = {
        total: 0,
        completed: 0,
        failed: 0,
        running: 0,
        pending: 0,
        successRate: 0
      };

      subscribe(ops => {
        result.total = ops.length;
        result.completed = ops.filter(o => o.status === 'completed').length;
        result.failed = ops.filter(o => o.status === 'failed').length;
        result.running = ops.filter(o => o.status === 'running').length;
        result.pending = ops.filter(o => o.status === 'pending_approval' || o.status === 'approved').length;
        
        const completedOps = ops.filter(o => o.status === 'completed');
        if (completedOps.length > 0) {
          result.successRate = completedOps.reduce((sum, o) => sum + (o.summary?.successRate || 0), 0) / completedOps.length;
        }
      })();

      return result;
    }
  };
}

// Helper to simulate batch execution
function simulateExecution(operationId: string) {
  const updateProgress = () => {
    const store = batchOperationStore;
    let operation: BatchOperation | undefined;
    
    store.subscribe(ops => {
      operation = ops.find(o => o.id === operationId);
    })();
    
    if (!operation || operation.status !== 'running') return;

    // Find next pending device
    const pendingDevice = operation.targetDevices.find(d => d.status === 'queued' || d.status === 'pending');
    
    if (pendingDevice) {
      // Mark as running
      store.updateOperation(operationId, {
        targetDevices: operation.targetDevices.map(d => 
          d.id === pendingDevice.id ? { ...d, status: 'running', startedAt: Date.now() } : d
        )
      });

      // Simulate execution time
      setTimeout(() => {
        const success = Math.random() > 0.1; // 90% success rate
        
        store.updateOperation(operationId, {
          targetDevices: operation!.targetDevices.map(d => {
            if (d.id === pendingDevice.id) {
              return {
                ...d,
                status: success ? 'completed' : 'failed',
                completedAt: Date.now(),
                duration: Date.now() - (d.startedAt || Date.now()),
                logs: [...d.logs, success ? 'Operation completed successfully' : 'Operation failed: Connection timeout']
              };
            }
            return d;
          }),
          completedDevices: operation!.completedDevices + (success ? 1 : 0),
          failedDevices: operation!.failedDevices + (success ? 0 : 1),
          progress: Math.round(((operation!.completedDevices + 1) / operation!.totalDevices) * 100)
        });

        // Continue with next device
        updateProgress();
      }, 2000 + Math.random() * 3000);
    } else {
      // All devices processed
      store.updateOperation(operationId, {
        status: operation.failedDevices > 0 && !operation.config.continueOnError ? 'failed' : 'completed',
        completedAt: Date.now(),
        progress: 100,
        summary: {
          successRate: Math.round((operation.completedDevices / operation.totalDevices) * 100),
          averageDuration: 300000,
          errors: operation.failedDevices > 0 ? ['Some devices failed'] : []
        }
      });
    }
  };

  // Start execution after a short delay
  setTimeout(updateProgress, 1000);
}

export const batchOperationStore = createBatchOperationStore();
