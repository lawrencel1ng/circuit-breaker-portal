/**
 * Event-Driven Automation Store
 * Manages webhook-triggered and event-based automation workflows
 * Enables real-time response to monitoring alerts, CI/CD events, and external triggers
 */

import { writable, type Writable } from 'svelte/store';


export type EventSource = 
  | 'webhook' 
  | 'monitoring' 
  | 'cicd' 
  | 'security' 
  | 'schedule' 
  | 'manual'
  | 'f5-telemetry';

export type EventType = 
  // Monitoring events
  | 'pool_member_down' 
  | 'high_latency' 
  | 'high_cpu' 
  | 'ssl_cert_expiring'
  | 'waf_attack_detected'
  | 'ddos_detected'
  // CI/CD events
  | 'deployment_started'
  | 'deployment_completed'
  | 'deployment_failed'
  | 'git_push'
  | 'pr_merged'
  // Security events
  | 'suspicious_traffic'
  | 'failed_login'
  | 'policy_violation'
  | 'config_drift'
  // Custom events
  | 'custom_webhook'
  | 'api_call';

export type AutomationAction = 
  | 'scale_pool'
  | 'failover'
  | 'block_ip'
  | 'notify'
  | 'run_script'
  | 'deploy_template'
  | 'capture_traffic'
  | 'enable_waf'
  | 'rotate_cert'
  | 'quarantine';

export interface EventRule {
  id: string;
  name: string;
  description: string;
  enabled: boolean;
  
  // Event matching
  source: EventSource;
  eventType: EventType;
  conditions: EventCondition[];
  
  // Actions to execute
  actions: EventAction[];
  
  // Execution settings
  executionMode: 'immediate' | 'queued' | 'approved';
  throttleMs: number; // Minimum time between executions
  maxExecutionsPerHour: number;
  
  // Metadata
  createdAt: number;
  createdBy: string;
  updatedAt: number;
  lastTriggeredAt?: number;
  triggerCount: number;
  successCount: number;
  failureCount: number;
}

export interface EventCondition {
  field: string;
  operator: 'equals' | 'not_equals' | 'contains' | 'greater_than' | 'less_than' | 'matches' | 'in';
  value: any;
}

export interface EventAction {
  type: AutomationAction;
  config: Record<string, any>;
  delayMs?: number;
  condition?: EventCondition; // Conditional execution
}

export interface EventExecution {
  id: string;
  ruleId: string;
  ruleName: string;
  triggeredAt: number;
  completedAt?: number;
  status: 'pending' | 'running' | 'completed' | 'failed' | 'throttled';
  eventData: Record<string, any>;
  actionResults: ActionResult[];
  error?: string;
}

export interface ActionResult {
  actionType: AutomationAction;
  status: 'success' | 'failed' | 'skipped';
  duration: number;
  result?: any;
  error?: string;
}

// Pre-built event automation rules
export const eventAutomationPresets: Record<string, {
  name: string;
  description: string;
  source: EventSource;
  eventType: EventType;
  conditions: EventCondition[];
  actions: EventAction[];
  executionMode: 'immediate' | 'queued' | 'approved';
  throttleMs: number;
  maxExecutionsPerHour: number;
}> = {
  autoFailover: {
    name: 'Auto-Failover on Pool Member Failure',
    description: 'Automatically disable failed pool members and enable backup members',
    source: 'monitoring',
    eventType: 'pool_member_down',
    conditions: [
      { field: 'consecutive_failures', operator: 'greater_than', value: 3 }
    ],
    actions: [
      { type: 'notify', config: { channels: ['slack', 'email'], message: 'Pool member is down' } },
      { type: 'scale_pool', config: { action: 'disable_member' } },
      { type: 'scale_pool', config: { action: 'enable_backup' }, delayMs: 5000 }
    ],
    executionMode: 'immediate',
    throttleMs: 60000,
    maxExecutionsPerHour: 10
  },
  
  ddosMitigation: {
    name: 'Auto DDoS Mitigation',
    description: 'Block suspicious IPs and enable enhanced protection when DDoS detected',
    source: 'security',
    eventType: 'ddos_detected',
    conditions: [
      { field: 'request_rate', operator: 'greater_than', value: 10000 }
    ],
    actions: [
      { type: 'block_ip', config: { duration: '1h' } },
      { type: 'enable_waf', config: { mode: 'aggressive' } },
      { type: 'notify', config: { channels: ['pagerduty', 'slack'], priority: 'critical' } },
      { type: 'capture_traffic', config: { duration: 300 } }
    ],
    executionMode: 'immediate',
    throttleMs: 300000,
    maxExecutionsPerHour: 5
  },
  
  certExpiryAlert: {
    name: 'Certificate Expiry Auto-Renewal',
    description: 'Automatically renew certificates expiring within 30 days',
    source: 'monitoring',
    eventType: 'ssl_cert_expiring',
    conditions: [
      { field: 'days_until_expiry', operator: 'less_than', value: 30 },
      { field: 'auto_renew', operator: 'equals', value: true }
    ],
    actions: [
      { type: 'notify', config: { channels: ['email'], message: 'Certificate expiring soon' } },
      { type: 'rotate_cert', config: { ca: 'letsencrypt' }, delayMs: 3600000 }
    ],
    executionMode: 'approved',
    throttleMs: 86400000,
    maxExecutionsPerHour: 1
  },
  
  autoScaleOnLoad: {
    name: 'Auto-Scale on High Load',
    description: 'Add pool members when CPU or latency exceeds threshold',
    source: 'monitoring',
    eventType: 'high_cpu',
    conditions: [
      { field: 'cpu_percent', operator: 'greater_than', value: 80 },
      { field: 'duration_minutes', operator: 'greater_than', value: 5 }
    ],
    actions: [
      { type: 'scale_pool', config: { action: 'add_member', count: 2 } },
      { type: 'notify', config: { channels: ['slack'], message: 'Auto-scaled pool due to high CPU' } }
    ],
    executionMode: 'queued',
    throttleMs: 300000,
    maxExecutionsPerHour: 3
  },
  
  deploymentTrigger: {
    name: 'Auto-Deploy on Git Push',
    description: 'Trigger F5 deployment when code is merged to main branch',
    source: 'cicd',
    eventType: 'pr_merged',
    conditions: [
      { field: 'branch', operator: 'equals', value: 'main' },
      { field: 'files_changed', operator: 'contains', value: 'f5-config/' }
    ],
    actions: [
      { type: 'run_script', config: { script: 'validate-config.sh' } },
      { type: 'deploy_template', config: { template: 'web-application', environment: 'staging' } },
      { type: 'notify', config: { channels: ['slack'], message: 'F5 config deployed to staging' } }
    ],
    executionMode: 'approved',
    throttleMs: 60000,
    maxExecutionsPerHour: 10
  },
  
  wafAutoResponse: {
    name: 'WAF Auto-Response to Attacks',
    description: 'Block attacking IPs automatically when WAF detects attack patterns',
    source: 'security',
    eventType: 'waf_attack_detected',
    conditions: [
      { field: 'attack_confidence', operator: 'greater_than', value: 80 },
      { field: 'attack_type', operator: 'in', value: ['sql_injection', 'xss', 'command_injection'] }
    ],
    actions: [
      { type: 'block_ip', config: { duration: '24h' } },
      { type: 'notify', config: { channels: ['slack', 'email'], message: 'Blocked attack source' } }
    ],
    executionMode: 'immediate',
    throttleMs: 60000,
    maxExecutionsPerHour: 20
  },
  
  configDriftRemediation: {
    name: 'Auto-Remediate Configuration Drift',
    description: 'Automatically restore configuration when drift is detected',
    source: 'monitoring',
    eventType: 'config_drift',
    conditions: [
      { field: 'drift_severity', operator: 'equals', value: 'critical' },
      { field: 'auto_remediate', operator: 'equals', value: true }
    ],
    actions: [
      { type: 'notify', config: { channels: ['slack', 'email'], message: 'Critical drift detected' } },
      { type: 'run_script', config: { script: 'restore-config.sh' }, delayMs: 300000 },
      { type: 'notify', config: { channels: ['email'], message: 'Configuration restored' }, delayMs: 310000 }
    ],
    executionMode: 'approved',
    throttleMs: 3600000,
    maxExecutionsPerHour: 2
  }
};

function createEventAutomationStore() {
  const { subscribe, set, update } = writable<EventRule[]>([]);
  const executionStore = writable<EventExecution[]>([]);
  let ruleIdCounter = 0;
  let executionIdCounter = 0;

  // Initialize with preset rules
  const initialRules: EventRule[] = Object.entries(eventAutomationPresets).map(([key, preset], index) => ({
    id: `event-rule-${index + 1}`,
    name: preset.name,
    description: preset.description,
    enabled: true,
    source: preset.source,
    eventType: preset.eventType,
    conditions: preset.conditions,
    actions: preset.actions,
    executionMode: preset.executionMode,
    throttleMs: preset.throttleMs,
    maxExecutionsPerHour: preset.maxExecutionsPerHour,
    createdAt: Date.now() - Math.random() * 60 * 24 * 60 * 60 * 1000,
    createdBy: 'system',
    updatedAt: Date.now(),
    triggerCount: Math.floor(Math.random() * 100),
    successCount: Math.floor(Math.random() * 95),
    failureCount: Math.floor(Math.random() * 5)
  }));

  set(initialRules);

  return {
    subscribe,
    executions: { subscribe: executionStore.subscribe },

    // Create new event rule
    createRule: (preset: keyof typeof eventAutomationPresets | Partial<EventRule> | undefined, createdBy: string): EventRule => {
      const id = `event-rule-${++ruleIdCounter}-${Date.now()}`;
      let newRule: EventRule;

      if (typeof preset === 'string' && preset in eventAutomationPresets) {
        const p = eventAutomationPresets[preset];
        newRule = {
          id,
          name: p.name,
          description: p.description,
          enabled: true,
          source: p.source,
          eventType: p.eventType,
          conditions: [...p.conditions],
          actions: [...p.actions],
          executionMode: p.executionMode,
          throttleMs: p.throttleMs,
          maxExecutionsPerHour: p.maxExecutionsPerHour,
          createdAt: Date.now(),
          createdBy,
          updatedAt: Date.now(),
          triggerCount: 0,
          successCount: 0,
          failureCount: 0
        };
      } else {
        newRule = {
          id,
          name: 'New Event Rule',
          description: '',
          enabled: false,
          source: 'webhook',
          eventType: 'custom_webhook',
          conditions: [],
          actions: [],
          executionMode: 'approved',
          throttleMs: 60000,
          maxExecutionsPerHour: 10,
          createdAt: Date.now(),
          createdBy,
          updatedAt: Date.now(),
          triggerCount: 0,
          successCount: 0,
          failureCount: 0,
          ...(preset as Partial<EventRule>)
        };
      }

      update(rules => [...rules, newRule]);
      console.log(`Event automation rule created: ${newRule.name} (${id})`);
      return newRule;
    },

    // Update rule
    updateRule: (id: string, updates: Partial<EventRule>) => {
      update(rules => {
        const index = rules.findIndex(r => r.id === id);
        if (index === -1) return rules;

        const newRules = [...rules];
        newRules[index] = { ...newRules[index], ...updates, updatedAt: Date.now() };
        return newRules;
      });
    },

    // Toggle rule enabled state
    toggleRule: (id: string) => {
      update(rules => {
        const index = rules.findIndex(r => r.id === id);
        if (index === -1) return rules;

        const newRules = [...rules];
        newRules[index].enabled = !newRules[index].enabled;
        newRules[index].updatedAt = Date.now();
        return newRules;
      });
    },

    // Delete rule
    deleteRule: (id: string) => {
      update(rules => rules.filter(r => r.id !== id));
      console.log(`Event automation rule deleted: ${id}`);
    },

    // Trigger event (simulate or real)
    triggerEvent: (eventData: {
      source: EventSource;
      eventType: EventType;
      data: Record<string, any>;
    }, triggeredBy: string): EventExecution[] => {
      const executions: EventExecution[] = [];
      
      // Find matching rules
      let matchingRules: EventRule[] = [];
      subscribe(rules => {
        matchingRules = rules.filter(r => 
          r.enabled &&
          r.source === eventData.source &&
          r.eventType === eventData.eventType &&
          matchConditions(r.conditions, eventData.data)
        );
      })();

      // Check throttling
      const now = Date.now();
      matchingRules = matchingRules.filter(rule => {
        if (rule.lastTriggeredAt && (now - rule.lastTriggeredAt) < rule.throttleMs) {
          return false; // Throttled
        }
        const recentExecutions = executions.filter(e => 
          e.ruleId === rule.id && 
          e.triggeredAt > now - 3600000
        ).length;
        return recentExecutions < rule.maxExecutionsPerHour;
      });

      // Create executions
      matchingRules.forEach(rule => {
        const executionId = `exec-${++executionIdCounter}-${Date.now()}`;
        const execution: EventExecution = {
          id: executionId,
          ruleId: rule.id,
          ruleName: rule.name,
          triggeredAt: now,
          status: rule.executionMode === 'approved' ? 'pending' : 'running',
          eventData: eventData.data,
          actionResults: []
        };

        executions.push(execution);
        executionStore.update(execs => [execution, ...execs]);

        // Update rule stats
        update(rules => {
          const index = rules.findIndex(r => r.id === rule.id);
          if (index === -1) return rules;
          
          const newRules = [...rules];
          newRules[index].lastTriggeredAt = now;
          newRules[index].triggerCount++;
          return newRules;
        });

        // Simulate action execution
        if (rule.executionMode !== 'approved') {
          setTimeout(() => {
            executeActions(execution, rule.actions);
          }, 100);
        }
      });

      return executions;
    },

    // Approve pending execution
    approveExecution: (executionId: string) => {
      executionStore.update(executions => {
        const index = executions.findIndex(e => e.id === executionId);
        if (index === -1) return executions;
        
        const newExecutions = [...executions];
        const execution = newExecutions[index];
        
        if (execution.status === 'pending') {
          execution.status = 'running';
          
          subscribe(rules => {
            const rule = rules.find(r => r.id === execution.ruleId);
            if (rule) {
              executeActions(execution, rule.actions);
            }
          })();
        }
        
        return newExecutions;
      });
    },

    // Reject pending execution
    rejectExecution: (executionId: string, reason: string) => {
      executionStore.update(executions => {
        const index = executions.findIndex(e => e.id === executionId);
        if (index === -1) return executions;
        
        const newExecutions = [...executions];
        newExecutions[index].status = 'failed';
        newExecutions[index].error = `Rejected: ${reason}`;
        newExecutions[index].completedAt = Date.now();
        return newExecutions;
      });
    },

    // Get rule statistics
    getStatistics: () => {
      let result = {
        totalRules: 0,
        enabledRules: 0,
        totalTriggers: 0,
        successRate: 0,
        bySource: {} as Record<EventSource, number>,
        recentExecutions: 0
      };

      subscribe(rules => {
        result.totalRules = rules.length;
        result.enabledRules = rules.filter(r => r.enabled).length;
        result.totalTriggers = rules.reduce((sum, r) => sum + r.triggerCount, 0);
        
        const totalSuccess = rules.reduce((sum, r) => sum + r.successCount, 0);
        const totalAttempts = rules.reduce((sum, r) => sum + r.triggerCount, 0);
        result.successRate = totalAttempts > 0 ? (totalSuccess / totalAttempts) * 100 : 0;
        
        rules.forEach(r => {
          result.bySource[r.source] = (result.bySource[r.source] || 0) + 1;
        });
      })();

      executionStore.subscribe(execs => {
        result.recentExecutions = execs.filter(e => e.triggeredAt > Date.now() - 24 * 60 * 60 * 1000).length;
      })();

      return result;
    },

    // Get pending approvals
    getPendingApprovals: (): EventExecution[] => {
      let result: EventExecution[] = [];
      executionStore.subscribe(execs => {
        result = execs.filter(e => e.status === 'pending');
      })();
      return result;
    }
  };
}

// Helper to match conditions
function matchConditions(conditions: EventCondition[], data: Record<string, any>): boolean {
  return conditions.every(condition => {
    const value = data[condition.field];
    switch (condition.operator) {
      case 'equals': return value === condition.value;
      case 'not_equals': return value !== condition.value;
      case 'contains': return String(value).includes(condition.value);
      case 'greater_than': return Number(value) > condition.value;
      case 'less_than': return Number(value) < condition.value;
      case 'matches': return new RegExp(condition.value).test(String(value));
      case 'in': return Array.isArray(condition.value) && condition.value.includes(value);
      default: return false;
    }
  });
}

// Helper to execute actions
function executeActions(execution: EventExecution, actions: EventAction[]) {
  const startTime = Date.now();
  
  actions.forEach((action, index) => {
    setTimeout(() => {
      const actionStart = Date.now();
      const success = Math.random() > 0.05; // 95% success rate
      
      const result: ActionResult = {
        actionType: action.type,
        status: success ? 'success' : 'failed',
        duration: Date.now() - actionStart,
        result: success ? `Action ${action.type} completed` : undefined,
        error: success ? undefined : 'Action execution failed'
      };
      
      execution.actionResults.push(result);
      
      // Update execution status
      if (index === actions.length - 1) {
        execution.status = execution.actionResults.every(r => r.status === 'success') ? 'completed' : 'failed';
        execution.completedAt = Date.now();
      }
    }, action.delayMs || 0);
  });
}

export const eventAutomationStore = createEventAutomationStore();
