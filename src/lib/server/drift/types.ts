/**
 * Configuration Drift Detection Types
 */

export type DriftSeverity = 'critical' | 'high' | 'medium' | 'low' | 'info';
export type DriftStatus = 'pending' | 'detected' | 'acknowledged' | 'remediated' | 'ignored';
export type DriftType = 'value_change' | 'missing' | 'added' | 'type_change' | 'order_change';

export interface DriftDetection {
  id: string;
  name: string;
  description?: string;
  enabled: boolean;
  
  // Source of truth
  baselineSource: 'git' | 'snapshot' | 'file' | 'api';
  baselineReference: string; // Git commit hash, snapshot ID, etc.
  
  // Target to monitor
  targetType: 'f5_device' | 'as3_declaration' | 'policy' | 'certificate' | 'all';
  targetId?: string;
  targetDevice?: string;
  targetPartition?: string;
  
  // Schedule
  schedule: 'realtime' | 'hourly' | 'daily' | 'weekly' | 'manual';
  lastRun?: Date;
  nextRun?: Date;
  
  // Detection configuration
  ignorePatterns: string[]; // Regex patterns for paths to ignore
  sensitivePaths: string[]; // Paths that require immediate attention
  
  createdAt: Date;
  updatedAt: Date;
}

export interface DriftReport {
  id: string;
  detectionId: string;
  status: DriftStatus;
  severity: DriftSeverity;
  
  // Timing
  detectedAt: Date;
  acknowledgedAt?: Date;
  remediatedAt?: Date;
  
  // Baseline vs Current
  baselineConfig: ConfigurationSnapshot;
  currentConfig: ConfigurationSnapshot;
  
  // Drift items
  items: DriftItem[];
  
  // Statistics
  totalChanges: number;
  criticalChanges: number;
  highChanges: number;
  mediumChanges: number;
  lowChanges: number;
  
  // Remediation
  autoRemediationAttempted: boolean;
  autoRemediationSuccess?: boolean;
  autoRemediationError?: string;
  
  // Metadata
  detectedBy: string; // 'scheduled' | 'manual' | 'webhook'
  acknowledgedBy?: string;
  remediationActions?: RemediationAction[];
}

export interface ConfigurationSnapshot {
  id: string;
  timestamp: Date;
  source: 'git' | 'f5_api' | 'manual' | 'import';
  reference: string;
  config: Record<string, any>;
  metadata?: {
    deviceVersion?: string;
    exportedBy?: string;
    exportReason?: string;
  };
}

export interface DriftItem {
  id: string;
  path: string; // Dot-notation path, e.g., "ltm.virtual.vs_app_1.destination"
  type: DriftType;
  severity: DriftSeverity;
  
  // Values
  expectedValue: any;
  actualValue: any;
  
  // Context
  description?: string;
  context?: {
    parent?: string;
    siblings?: string[];
    relatedPaths?: string[];
  };
  
  // Remediation
  remediationAction: 'auto' | 'manual' | 'alert' | 'ignore';
  remediationCommand?: string; // F5 TMSH command or API call to fix
  canAutoRemediate: boolean;
}

export interface RemediationAction {
  id: string;
  driftItemId: string;
  action: 'restore' | 'update' | 'delete' | 'ignore';
  status: 'pending' | 'in_progress' | 'completed' | 'failed';
  executedAt?: Date;
  executedBy?: string;
  error?: string;
  command?: string;
  rollbackCommand?: string;
}

export interface GitConfig {
  enabled: boolean;
  repositoryUrl: string;
  branch: string;
  basePath: string;
  authType: 'ssh' | 'token' | 'none';
  authToken?: string;
  sshKey?: string;
  webhookSecret?: string;
  autoSync: boolean;
  syncInterval: number; // minutes
}

export interface ComplianceRule {
  id: string;
  name: string;
  description?: string;
  enabled: boolean;
  
  // What to check
  resourceType: 'virtual_server' | 'pool' | 'profile' | 'monitor' | 'policy' | 'certificate';
  pathPattern: string; // Regex pattern for configuration path
  
  // Expected value
  expectedType: 'exists' | 'equals' | 'matches' | 'in_list' | 'custom';
  expectedValue?: any;
  customValidator?: string; // JavaScript function as string
  
  // Severity
  severity: DriftSeverity;
  
  // Remediation
  autoRemediate: boolean;
  remediationValue?: any;
}

export interface DriftStatistics {
  totalDetections: number;
  activeDrifts: number;
  criticalDrifts: number;
  highDrifts: number;
  remediatedThisWeek: number;
  averageTimeToRemediate: number; // hours
  topDriftedPaths: Array<{ path: string; count: number }>;
  complianceScore: number; // 0-100
}

export interface DriftNotificationConfig {
  enabled: boolean;
  onDetection: boolean;
  onCritical: boolean;
  onHigh: boolean;
  channels: Array<{
    type: 'email' | 'slack' | 'webhook' | 'sms';
    target: string;
    minSeverity: DriftSeverity;
  }>;
}
