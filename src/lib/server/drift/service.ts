/**
 * Configuration Drift Detection Service
 * Monitors F5 configurations for unauthorized changes
 */

import type {
  DriftDetection,
  DriftReport,
  DriftItem,
  ConfigurationSnapshot,
  DriftSeverity,
  DriftStatus,
  GitConfig,
  ComplianceRule,
  DriftStatistics,
  RemediationAction
} from './types';
import { logger } from '../logger';
import { getF5Client } from '../f5';

// Default drift detections
const DEFAULT_DETECTIONS: DriftDetection[] = [
  {
    id: 'drift-default',
    name: 'Default Configuration Monitor',
    description: 'Monitors all F5 configurations for changes',
    enabled: true,
    baselineSource: 'snapshot',
    baselineReference: 'snapshot-001',
    targetType: 'all',
    schedule: 'hourly',
    ignorePatterns: [
      '.*\\.lastUpdated',
      '.*\\.generation',
      '.*\\.selfLink',
      'sys\\.globalSettings'
    ],
    sensitivePaths: [
      'ltm.virtual.*.destination',
      'ltm.pool.*.members',
      'gtm.wideip.*.pools',
      'security.firewall'
    ],
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    id: 'drift-as3',
    name: 'AS3 Declaration Monitor',
    description: 'Monitors AS3 declarations for drift',
    enabled: true,
    baselineSource: 'git',
    baselineReference: 'main:as3/declarations/',
    targetType: 'as3_declaration',
    schedule: 'realtime',
    ignorePatterns: [
      '.*\\.schemaVersion',
      '.*\\.id'
    ],
    sensitivePaths: [
      'declaration.*.class',
      'declaration.*.virtualAddresses',
      'declaration.*.poolMembers'
    ],
    createdAt: new Date(),
    updatedAt: new Date()
  }
];

// Default compliance rules
const DEFAULT_COMPLIANCE_RULES: ComplianceRule[] = [
  {
    id: 'rule-ssl-profile',
    name: 'SSL Profile Security',
    description: 'Ensures SSL profiles use TLS 1.2+',
    enabled: true,
    resourceType: 'profile',
    pathPattern: 'client-ssl.*.options',
    expectedType: 'matches',
    expectedValue: 'no-sslv3|no-tlsv1|no-tlsv1_1',
    severity: 'high',
    autoRemediate: false
  },
  {
    id: 'rule-monitor',
    name: 'Health Monitor Required',
    description: 'Ensures pools have health monitors',
    enabled: true,
    resourceType: 'pool',
    pathPattern: '.*.monitor',
    expectedType: 'exists',
    severity: 'medium',
    autoRemediate: false
  },
  {
    id: 'rule-logging',
    name: 'Logging Enabled',
    description: 'Ensures virtual servers have logging enabled',
    enabled: true,
    resourceType: 'virtual_server',
    pathPattern: '.*.profiles.*.logging',
    expectedType: 'exists',
    severity: 'low',
    autoRemediate: false
  }
];

export class DriftDetectionService {
  private detections: Map<string, DriftDetection> = new Map();
  private reports: Map<string, DriftReport> = new Map();
  private snapshots: Map<string, ConfigurationSnapshot> = new Map();
  private complianceRules: Map<string, ComplianceRule> = new Map();
  private gitConfig: GitConfig;
  private scheduleInterval: NodeJS.Timeout | null = null;

  constructor() {
    // Initialize default detections
    DEFAULT_DETECTIONS.forEach(detection => {
      this.detections.set(detection.id, detection);
    });

    DEFAULT_COMPLIANCE_RULES.forEach(rule => {
      this.complianceRules.set(rule.id, rule);
    });

    // Initialize default Git config
    this.gitConfig = {
      enabled: false,
      repositoryUrl: '',
      branch: 'main',
      basePath: 'configs/f5/',
      authType: 'none',
      autoSync: false,
      syncInterval: 60
    };

    // Create initial baseline snapshot
    this.createSnapshot('snapshot-001', 'f5_api', 'Initial baseline snapshot');

    // Start scheduled detection
    this.startScheduledDetection();
  }

  // Drift Detection Management
  getAllDetections(): DriftDetection[] {
    return Array.from(this.detections.values());
  }

  getDetection(id: string): DriftDetection | undefined {
    return this.detections.get(id);
  }

  createDetection(detection: Omit<DriftDetection, 'id' | 'createdAt' | 'updatedAt'>): DriftDetection {
    const newDetection: DriftDetection = {
      ...detection,
      id: `drift-${Date.now()}`,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    this.detections.set(newDetection.id, newDetection);
    logger.info(`Created drift detection: ${newDetection.id}`);
    return newDetection;
  }

  updateDetection(id: string, updates: Partial<DriftDetection>): DriftDetection {
    const existing = this.detections.get(id);
    if (!existing) {
      throw new Error(`Detection ${id} not found`);
    }

    const updated = { ...existing, ...updates, updatedAt: new Date() };
    this.detections.set(id, updated);
    logger.info(`Updated drift detection: ${id}`);
    return updated;
  }

  deleteDetection(id: string): void {
    if (!this.detections.has(id)) {
      throw new Error(`Detection ${id} not found`);
    }
    this.detections.delete(id);
    logger.info(`Deleted drift detection: ${id}`);
  }

  // Drift Detection Execution
  async runDetection(detectionId: string): Promise<DriftReport> {
    const detection = this.detections.get(detectionId);
    if (!detection) {
      throw new Error(`Detection ${detectionId} not found`);
    }

    logger.info(`Running drift detection: ${detectionId}`);

    // Get baseline snapshot
    const baseline = this.snapshots.get(detection.baselineReference);
    if (!baseline) {
      throw new Error(`Baseline snapshot ${detection.baselineReference} not found`);
    }

    // Get current configuration
    const current = await this.captureCurrentConfig(detection);

    // Compare configurations
    const items = this.compareConfigurations(baseline.config, current.config, detection);

    // Calculate severity
    const severity = this.calculateSeverity(items);

    // Create report
    const report: DriftReport = {
      id: `report-${Date.now()}`,
      detectionId,
      status: items.length > 0 ? 'detected' : 'remediated',
      severity,
      detectedAt: new Date(),
      baselineConfig: baseline,
      currentConfig: current,
      items,
      totalChanges: items.length,
      criticalChanges: items.filter(i => i.severity === 'critical').length,
      highChanges: items.filter(i => i.severity === 'high').length,
      mediumChanges: items.filter(i => i.severity === 'medium').length,
      lowChanges: items.filter(i => i.severity === 'low').length,
      autoRemediationAttempted: false,
      detectedBy: 'manual'
    };

    // Attempt auto-remediation for eligible items
    if (detection.enabled) {
      await this.attemptAutoRemediation(report);
    }

    this.reports.set(report.id, report);
    
    // Update detection last run
    detection.lastRun = new Date();
    detection.nextRun = this.calculateNextRun(detection.schedule);

    logger.info(`Drift detection completed: ${report.id}, found ${items.length} changes`);
    return report;
  }

  async runAllDetections(): Promise<DriftReport[]> {
    const reports: DriftReport[] = [];
    
    for (const detection of this.detections.values()) {
      if (detection.enabled) {
        try {
          const report = await this.runDetection(detection.id);
          reports.push(report);
        } catch (error) {
          logger.error(`Failed to run detection ${detection.id}:`, error);
        }
      }
    }

    return reports;
  }

  // Report Management
  getAllReports(): DriftReport[] {
    return Array.from(this.reports.values()).sort((a, b) => 
      b.detectedAt.getTime() - a.detectedAt.getTime()
    );
  }

  getReport(id: string): DriftReport | undefined {
    return this.reports.get(id);
  }

  getActiveDrifts(): DriftReport[] {
    return this.getAllReports().filter(r => r.status === 'detected');
  }

  acknowledgeDrift(reportId: string, userId: string): DriftReport {
    const report = this.reports.get(reportId);
    if (!report) {
      throw new Error(`Report ${reportId} not found`);
    }

    report.status = 'acknowledged';
    report.acknowledgedAt = new Date();
    report.acknowledgedBy = userId;

    logger.info(`Drift ${reportId} acknowledged by ${userId}`);
    return report;
  }

  // Remediation
  async remediateDriftItem(reportId: string, itemId: string, action: RemediationAction['action']): Promise<void> {
    const report = this.reports.get(reportId);
    if (!report) {
      throw new Error(`Report ${reportId} not found`);
    }

    const item = report.items.find(i => i.id === itemId);
    if (!item) {
      throw new Error(`Item ${itemId} not found in report`);
    }

    const remediationAction: RemediationAction = {
      id: `rem-${Date.now()}`,
      driftItemId: itemId,
      action,
      status: 'in_progress',
      executedAt: new Date(),
      executedBy: 'system'
    };

    try {
      // Execute remediation based on action type
      switch (action) {
        case 'restore':
          await this.restoreConfiguration(item.path, item.expectedValue);
          break;
        case 'update':
          await this.updateConfiguration(item.path, item.expectedValue);
          break;
        case 'delete':
          await this.deleteConfiguration(item.path);
          break;
        case 'ignore':
          // Just mark as ignored
          break;
      }

      remediationAction.status = 'completed';
      item.remediationAction = 'manual';

      logger.info(`Remediated drift item ${itemId}: ${action}`);
    } catch (error: any) {
      remediationAction.status = 'failed';
      remediationAction.error = error.message;
      throw error;
    }

    if (!report.remediationActions) {
      report.remediationActions = [];
    }
    report.remediationActions.push(remediationAction);

    // Check if all items are remediated
    const pendingItems = report.items.filter(i => i.remediationAction !== 'manual');
    if (pendingItems.length === 0) {
      report.status = 'remediated';
      report.remediatedAt = new Date();
    }
  }

  // Snapshot Management
  createSnapshot(id: string, source: ConfigurationSnapshot['source'], reference: string): ConfigurationSnapshot {
    const snapshot: ConfigurationSnapshot = {
      id,
      timestamp: new Date(),
      source,
      reference,
      config: {} // Would be populated from actual F5 or Git
    };

    this.snapshots.set(id, snapshot);
    logger.info(`Created snapshot: ${id}`);
    return snapshot;
  }

  getAllSnapshots(): ConfigurationSnapshot[] {
    return Array.from(this.snapshots.values()).sort((a, b) => 
      b.timestamp.getTime() - a.timestamp.getTime()
    );
  }

  // Git Integration
  getGitConfig(): GitConfig {
    return this.gitConfig;
  }

  updateGitConfig(config: Partial<GitConfig>): GitConfig {
    this.gitConfig = { ...this.gitConfig, ...config };
    return this.gitConfig;
  }

  async syncFromGit(): Promise<ConfigurationSnapshot> {
    if (!this.gitConfig.enabled) {
      throw new Error('Git integration is not enabled');
    }

    // Simulate Git sync
    const snapshot = this.createSnapshot(
      `git-${Date.now()}`,
      'git',
      `${this.gitConfig.branch}:${this.gitConfig.basePath}`
    );

    logger.info('Synced configuration from Git');
    return snapshot;
  }

  // Compliance Rules
  getAllComplianceRules(): ComplianceRule[] {
    return Array.from(this.complianceRules.values());
  }

  createComplianceRule(rule: Omit<ComplianceRule, 'id'>): ComplianceRule {
    const newRule: ComplianceRule = {
      ...rule,
      id: `rule-${Date.now()}`
    };
    this.complianceRules.set(newRule.id, newRule);
    return newRule;
  }

  // Statistics
  getStatistics(): DriftStatistics {
    const reports = this.getAllReports();
    const activeDrifts = this.getActiveDrifts();
    const now = new Date();
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    // Calculate top drifted paths
    const pathCounts: Record<string, number> = {};
    reports.forEach(report => {
      report.items.forEach(item => {
        pathCounts[item.path] = (pathCounts[item.path] || 0) + 1;
      });
    });

    const topDriftedPaths = Object.entries(pathCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([path, count]) => ({ path, count }));

    // Calculate compliance score
    const totalRules = this.complianceRules.size;
    const passedRules = Math.floor(totalRules * 0.85); // Simulate 85% pass rate
    const complianceScore = totalRules > 0 ? Math.round((passedRules / totalRules) * 100) : 100;

    return {
      totalDetections: reports.length,
      activeDrifts: activeDrifts.length,
      criticalDrifts: activeDrifts.filter(r => r.severity === 'critical').length,
      highDrifts: activeDrifts.filter(r => r.severity === 'high').length,
      remediatedThisWeek: reports.filter(r => 
        r.status === 'remediated' && r.remediatedAt && r.remediatedAt > weekAgo
      ).length,
      averageTimeToRemediate: 4.5, // hours (simulated)
      topDriftedPaths,
      complianceScore
    };
  }

  // Private methods
  private async captureCurrentConfig(detection: DriftDetection): Promise<ConfigurationSnapshot> {
    const snapshotId = `current-${Date.now()}`;
    
    try {
      // Get configuration from F5
      const f5Client = getF5Client();
      const config: Record<string, any> = {};

      if (detection.targetType === 'all' || detection.targetType === 'f5_device') {
        config.virtualServers = await f5Client.getVirtualServers();
        config.pools = await f5Client.getPools();
        config.profiles = await f5Client.getSSLProfiles();
      }

      return {
        id: snapshotId,
        timestamp: new Date(),
        source: 'f5_api',
        reference: detection.targetDevice || 'bigip-01',
        config
      };
    } catch (error) {
      logger.error('Failed to capture current config:', error);
      // Return empty config on error
      return {
        id: snapshotId,
        timestamp: new Date(),
        source: 'f5_api',
        reference: detection.targetDevice || 'bigip-01',
        config: {}
      };
    }
  }

  private compareConfigurations(
    baseline: Record<string, any>,
    current: Record<string, any>,
    detection: DriftDetection
  ): DriftItem[] {
    const items: DriftItem[] = [];

    // Deep comparison of configurations
    this.compareObjects('', baseline, current, detection, items);

    return items;
  }

  private compareObjects(
    path: string,
    baseline: any,
    current: any,
    detection: DriftDetection,
    items: DriftItem[]
  ): void {
    // Check if path should be ignored
    if (detection.ignorePatterns.some(pattern => new RegExp(pattern).test(path))) {
      return;
    }

    // Handle different types
    if (typeof baseline !== typeof current) {
      items.push(this.createDriftItem(path, 'type_change', baseline, current, detection));
      return;
    }

    if (typeof baseline === 'object' && baseline !== null) {
      const baselineKeys = Object.keys(baseline);
      const currentKeys = Object.keys(current);

      // Check for missing keys
      baselineKeys.forEach(key => {
        if (!currentKeys.includes(key)) {
          items.push(this.createDriftItem(
            `${path}.${key}`,
            'missing',
            baseline[key],
            undefined,
            detection
          ));
        }
      });

      // Check for added keys
      currentKeys.forEach(key => {
        if (!baselineKeys.includes(key)) {
          items.push(this.createDriftItem(
            `${path}.${key}`,
            'added',
            undefined,
            current[key],
            detection
          ));
        }
      });

      // Recursively compare common keys
      baselineKeys.forEach(key => {
        if (currentKeys.includes(key)) {
          this.compareObjects(
            `${path}.${key}`,
            baseline[key],
            current[key],
            detection,
            items
          );
        }
      });
    } else if (baseline !== current) {
      items.push(this.createDriftItem(path, 'value_change', baseline, current, detection));
    }
  }

  private createDriftItem(
    path: string,
    type: DriftItem['type'],
    expectedValue: any,
    actualValue: any,
    detection: DriftDetection
  ): DriftItem {
    // Determine severity based on path sensitivity
    let severity: DriftSeverity = 'low';
    
    if (detection.sensitivePaths.some(pattern => new RegExp(pattern).test(path))) {
      severity = 'critical';
    } else if (path.includes('security') || path.includes('ssl') || path.includes('password')) {
      severity = 'high';
    } else if (path.includes('monitor') || path.includes('health')) {
      severity = 'medium';
    }

    return {
      id: `item-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      path,
      type,
      severity,
      expectedValue,
      actualValue,
      description: `${type} at ${path}`,
      remediationAction: severity === 'critical' ? 'manual' : 'auto',
      canAutoRemediate: severity !== 'critical'
    };
  }

  private calculateSeverity(items: DriftItem[]): DriftSeverity {
    if (items.some(i => i.severity === 'critical')) return 'critical';
    if (items.some(i => i.severity === 'high')) return 'high';
    if (items.some(i => i.severity === 'medium')) return 'medium';
    if (items.length > 0) return 'low';
    return 'info';
  }

  private async attemptAutoRemediation(report: DriftReport): Promise<void> {
    const autoItems = report.items.filter(i => i.canAutoRemediate && i.remediationAction === 'auto');
    
    if (autoItems.length === 0) return;

    report.autoRemediationAttempted = true;

    try {
      for (const item of autoItems) {
        await this.remediateDriftItem(report.id, item.id, 'restore');
      }
      report.autoRemediationSuccess = true;
    } catch (error) {
      report.autoRemediationSuccess = false;
      report.autoRemediationError = (error as Error).message;
    }
  }

  private async restoreConfiguration(path: string, value: any): Promise<void> {
    // Would implement actual F5 API call to restore configuration
    logger.info(`Restoring configuration at ${path}`);
  }

  private async updateConfiguration(path: string, value: any): Promise<void> {
    logger.info(`Updating configuration at ${path}`);
  }

  private async deleteConfiguration(path: string): Promise<void> {
    logger.info(`Deleting configuration at ${path}`);
  }

  private calculateNextRun(schedule: DriftDetection['schedule']): Date | undefined {
    const now = new Date();
    
    switch (schedule) {
      case 'realtime':
        return new Date(now.getTime() + 60000); // 1 minute
      case 'hourly':
        return new Date(now.getTime() + 60 * 60000); // 1 hour
      case 'daily':
        return new Date(now.getTime() + 24 * 60 * 60000); // 24 hours
      case 'weekly':
        return new Date(now.getTime() + 7 * 24 * 60 * 60000); // 1 week
      case 'manual':
        return undefined;
      default:
        return new Date(now.getTime() + 60 * 60000);
    }
  }

  private startScheduledDetection(): void {
    this.scheduleInterval = setInterval(async () => {
      const now = new Date();
      
      for (const detection of this.detections.values()) {
        if (!detection.enabled) continue;
        if (detection.schedule === 'manual') continue;
        if (!detection.nextRun || detection.nextRun > now) continue;

        try {
          await this.runDetection(detection.id);
        } catch (error) {
          logger.error(`Scheduled detection ${detection.id} failed:`, error);
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
let driftService: DriftDetectionService | null = null;

export function getDriftDetectionService(): DriftDetectionService {
  if (!driftService) {
    driftService = new DriftDetectionService();
  }
  return driftService;
}

export function resetDriftDetectionService(): void {
  if (driftService) {
    driftService.dispose();
    driftService = null;
  }
}
