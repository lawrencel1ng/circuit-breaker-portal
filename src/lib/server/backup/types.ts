/**
 * Backup & Disaster Recovery Types
 */

export type BackupType = 'ucs' | 'ucs+scf' | 'as3' | 'afm' | 'apm' | 'asm' | 'full' | 'selective';
export type BackupStatus = 'pending' | 'in_progress' | 'completed' | 'failed' | 'cancelled';
export type BackupDestinationType = 'local' | 'nfs' | 's3' | 'azure_blob' | 'gcs' | 'scp';
export type ScheduleFrequency = 'hourly' | 'daily' | 'weekly' | 'monthly' | 'custom';
export type RetentionPolicy = 'count' | 'days' | 'forever';

export interface BackupJob {
  id: string;
  name: string;
  description?: string;
  type: BackupType;
  status: BackupStatus;
  
  // Source
  sourceDevice: string;
  sourcePartition?: string;
  
  // Destination
  destination: BackupDestination;
  
  // Encryption
  encryption: {
    enabled: boolean;
    algorithm: 'aes-256' | 'aes-128';
    keyId?: string; // Reference to key management system
  };
  
  // Content
  include: {
    ucs: boolean;
    scf: boolean;
    as3Declarations: boolean;
    sslCerts: boolean;
    wafPolicies: boolean;
    apmProfiles: boolean;
    customFiles?: string[];
  };
  
  // Timing
  createdAt: Date;
  startedAt?: Date;
  completedAt?: Date;
  duration?: number; // seconds
  
  // Results
  size?: number; // bytes
  checksum?: string;
  filePath?: string;
  errorMessage?: string;
  
  // Metadata
  triggeredBy: 'scheduled' | 'manual' | 'api' | 'event';
  scheduleId?: string;
}

export interface BackupDestination {
  id: string;
  name: string;
  type: BackupDestinationType;
  path: string;
  
  // Credentials (encrypted)
  credentials?: {
    accessKey?: string;
    secretKey?: string;
    username?: string;
    password?: string;
    privateKey?: string;
    sasToken?: string;
  };
  
  // Connection settings
  region?: string; // For cloud providers
  bucket?: string; // For S3/GCS
  container?: string; // For Azure
  host?: string; // For NFS/SCP
  port?: number;
  
  // Validation
  lastTested?: Date;
  testStatus?: 'success' | 'failed';
  testError?: string;
}

export interface BackupSchedule {
  id: string;
  name: string;
  enabled: boolean;
  
  // What to backup
  backupType: BackupType;
  sourceDevice: string;
  destinationId: string;
  
  // When to backup
  frequency: ScheduleFrequency;
  cronExpression?: string; // For custom frequency
  timezone: string;
  
  // Schedule details
  daily?: {
    time: string; // HH:mm
  };
  weekly?: {
    dayOfWeek: number; // 0-6, 0 = Sunday
    time: string;
  };
  monthly?: {
    dayOfMonth: number; // 1-31
    time: string;
  };
  
  // Retention
  retention: {
    policy: RetentionPolicy;
    value?: number; // Count of backups or days
  };
  
  // Notifications
  notifications: {
    onSuccess: boolean;
    onFailure: boolean;
    emailRecipients: string[];
  };
  
  lastRun?: Date;
  nextRun?: Date;
  runCount: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface RestoreJob {
  id: string;
  name: string;
  status: BackupStatus;
  
  // Source backup
  sourceBackupId: string;
  sourcePath?: string;
  
  // Target
  targetDevice: string;
  targetPartition?: string;
  
  // What to restore
  restoreType: 'full' | 'selective' | 'merge';
  selectedItems?: string[]; // Paths to restore if selective
  excludeItems?: string[]; // Paths to exclude
  
  // Options
  options: {
    overwriteExisting: boolean;
    restoreCerts: boolean;
    restoreKeys: boolean;
    validateAfterRestore: boolean;
    automaticFailback: boolean;
  };
  
  // Pre-restore validation
  preValidation?: {
    passed: boolean;
    warnings: string[];
    errors: string[];
  };
  
  // Timing
  createdAt: Date;
  startedAt?: Date;
  completedAt?: Date;
  duration?: number;
  
  // Results
  restoredItems?: string[];
  failedItems?: Array<{ path: string; error: string }>;
  errorMessage?: string;
  
  // Post-restore
  postValidation?: {
    passed: boolean;
    warnings: string[];
    errors: string[];
  };
  
  triggeredBy: string;
}

export interface DisasterRecoveryPlan {
  id: string;
  name: string;
  description?: string;
  enabled: boolean;
  
  // Scope
  primarySite: string;
  drSite: string;
  affectedDevices: string[];
  
  // RTO/RPO
  rto: number; // Recovery Time Objective in minutes
  rpo: number; // Recovery Point Objective in minutes
  
  // Failover configuration
  failover: {
    type: 'automatic' | 'manual';
    triggerEvents: string[];
    healthCheckInterval: number;
    confirmationRequired: boolean;
    confirmationTimeout: number;
  };
  
  // Failback configuration
  failback: {
    type: 'automatic' | 'manual';
    healthCheckInterval: number;
    synchronizationRequired: boolean;
  };
  
  // Runbook
  runbook: DRRunbookStep[];
  
  // Testing
  lastTested?: Date;
  testResult?: 'success' | 'failed' | 'partial';
  testNotes?: string;
}

export interface DRRunbookStep {
  id: string;
  order: number;
  name: string;
  description?: string;
  type: 'manual' | 'automated' | 'approval';
  
  // For automated steps
  automationScript?: string;
  expectedDuration: number; // minutes
  
  // Dependencies
  dependsOn?: string[];
  
  // Execution
  status: 'pending' | 'in_progress' | 'completed' | 'failed' | 'skipped';
  startedAt?: Date;
  completedAt?: Date;
  executedBy?: string;
  output?: string;
  error?: string;
  
  // Rollback
  rollbackScript?: string;
}

export interface BackupStatistics {
  totalBackups: number;
  completedBackups: number;
  failedBackups: number;
  
  storageUsed: number; // bytes
  storageSaved: number; // bytes (compression/deduplication)
  
  lastBackupAt?: Date;
  nextScheduledBackup?: Date;
  
  averageBackupSize: number;
  averageBackupDuration: number;
  
  restoreCount: number;
  successfulRestores: number;
  failedRestores: number;
  
  complianceStatus: {
    last24Hours: boolean;
    last7Days: boolean;
    last30Days: boolean;
  };
}

export interface BackupHealthStatus {
  overall: 'healthy' | 'degraded' | 'critical';
  
  lastBackup: {
    status: 'success' | 'failed' | 'none';
    time?: Date;
    age?: number; // minutes since last backup
  };
  
  destinations: Array<{
    id: string;
    name: string;
    status: 'available' | 'unavailable' | 'unknown';
    lastTested?: Date;
    freeSpace?: number;
  }>;
  
  schedules: {
    total: number;
    enabled: number;
    overdue: number;
  };
  
  issues: Array<{
    severity: 'critical' | 'warning' | 'info';
    message: string;
    recommendation: string;
  }>;
}
