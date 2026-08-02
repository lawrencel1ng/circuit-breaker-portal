/**
 * Authentication Audit Logging
 * Tracks all authentication events for security monitoring
 */

import { logger } from '../logger';

export type AuthEventType = 
  | 'login_success'
  | 'login_failure'
  | 'logout'
  | 'token_refresh'
  | 'token_invalid'
  | 'session_expired'
  | 'password_change'
  | 'password_reset_request'
  | 'password_reset_complete'
  | 'mfa_enabled'
  | 'mfa_disabled'
  | 'account_locked'
  | 'account_unlocked'
  | 'permission_denied'
  | 'suspicious_activity';

export interface AuthAuditEvent {
  id: string;
  timestamp: number;
  type: AuthEventType;
  userId?: string;
  username?: string;
  ipAddress: string;
  userAgent: string;
  sessionId?: string;
  success: boolean;
  details?: {
    reason?: string;
    resource?: string;
    action?: string;
    metadata?: Record<string, any>;
  };
  riskScore?: number;  // 0-100, higher = more suspicious
}

export interface AuthAuditConfig {
  retentionDays: number;
  alertThreshold: number;  // Risk score threshold for alerts
  suspiciousPatterns: SuspiciousPattern[];
}

export interface SuspiciousPattern {
  name: string;
  description: string;
  check: (events: AuthAuditEvent[], currentEvent: AuthAuditEvent) => boolean;
  riskScore: number;
}

export class AuthAuditLogger {
  private events: AuthAuditEvent[] = [];
  private config: AuthAuditConfig;
  private eventCounter = 0;

  constructor(config: Partial<AuthAuditConfig> = {}) {
    this.config = {
      retentionDays: 90,
      alertThreshold: 70,
      suspiciousPatterns: this.getDefaultPatterns(),
      ...config
    };

    // Start cleanup
    this.startCleanup();
  }

  /**
   * Log an authentication event
   */
  log(event: Omit<AuthAuditEvent, 'id' | 'timestamp' | 'riskScore'>): AuthAuditEvent {
    const fullEvent: AuthAuditEvent = {
      id: `auth-${++this.eventCounter}-${Date.now()}`,
      timestamp: Date.now(),
      riskScore: 0,
      ...event
    };

    // Calculate risk score
    fullEvent.riskScore = this.calculateRiskScore(fullEvent);

    // Check for suspicious patterns
    const isSuspicious = this.checkSuspiciousPatterns(fullEvent);

    this.events.push(fullEvent);

    // Log to system logger
    const logMessage = `[AUTH] ${event.type} | User: ${event.username || 'anonymous'} | IP: ${event.ipAddress} | Success: ${event.success}`;
    
    if (!event.success) {
      logger.warn(logMessage + ' | Details: ' + JSON.stringify(event.details));
    } else if (isSuspicious || fullEvent.riskScore >= this.config.alertThreshold) {
      logger.warn(`[SUSPICIOUS] ${logMessage} | Risk: ${fullEvent.riskScore}`);
    } else {
      logger.info(logMessage);
    }

    return fullEvent;
  }

  /**
   * Log login attempt
   */
  logLogin(
    username: string,
    ipAddress: string,
    userAgent: string,
    success: boolean,
    userId?: string,
    details?: { reason?: string }
  ): AuthAuditEvent {
    return this.log({
      type: success ? 'login_success' : 'login_failure',
      userId,
      username,
      ipAddress,
      userAgent,
      success,
      details
    });
  }

  /**
   * Log logout
   */
  logLogout(
    userId: string,
    username: string,
    sessionId: string,
    ipAddress: string,
    userAgent: string,
    details?: { reason?: string }
  ): AuthAuditEvent {
    return this.log({
      type: 'logout',
      userId,
      username,
      sessionId,
      ipAddress,
      userAgent,
      success: true,
      details
    });
  }

  /**
   * Log permission denied
   */
  logPermissionDenied(
    userId: string,
    username: string,
    ipAddress: string,
    userAgent: string,
    resource: string,
    action: string,
    sessionId?: string
  ): AuthAuditEvent {
    return this.log({
      type: 'permission_denied',
      userId,
      username,
      sessionId,
      ipAddress,
      userAgent,
      success: false,
      details: { resource, action }
    });
  }

  /**
   * Get events for a user
   */
  getUserEvents(userId: string, limit = 100): AuthAuditEvent[] {
    return this.events
      .filter(e => e.userId === userId)
      .sort((a, b) => b.timestamp - a.timestamp)
      .slice(0, limit);
  }

  /**
   * Get events by type
   */
  getEventsByType(type: AuthEventType, limit = 100): AuthAuditEvent[] {
    return this.events
      .filter(e => e.type === type)
      .sort((a, b) => b.timestamp - a.timestamp)
      .slice(0, limit);
  }

  /**
   * Get recent failed login attempts from an IP
   */
  getFailedLoginsFromIp(ipAddress: string, windowMs = 3600000): AuthAuditEvent[] {
    const cutoff = Date.now() - windowMs;
    return this.events.filter(e => 
      e.ipAddress === ipAddress &&
      e.type === 'login_failure' &&
      e.timestamp >= cutoff
    );
  }

  /**
   * Check if IP should be rate limited
   */
  shouldRateLimitIp(ipAddress: string, threshold = 5, windowMs = 3600000): boolean {
    const failedAttempts = this.getFailedLoginsFromIp(ipAddress, windowMs);
    return failedAttempts.length >= threshold;
  }

  /**
   * Get security summary
   */
  getSecuritySummary(timeWindowMs = 24 * 60 * 60 * 1000): {
    totalEvents: number;
    failedLogins: number;
    successfulLogins: number;
    suspiciousEvents: number;
    uniqueIps: number;
    topIps: Array<{ ip: string; count: number; failedCount: number }>;
  } {
    const cutoff = Date.now() - timeWindowMs;
    const recentEvents = this.events.filter(e => e.timestamp >= cutoff);

    const failedLogins = recentEvents.filter(e => e.type === 'login_failure');
    const successfulLogins = recentEvents.filter(e => e.type === 'login_success');
    const suspiciousEvents = recentEvents.filter(e => (e.riskScore || 0) >= this.config.alertThreshold);

    const ipStats = new Map<string, { count: number; failed: number }>();
    for (const event of recentEvents) {
      const stats = ipStats.get(event.ipAddress) || { count: 0, failed: 0 };
      stats.count++;
      if (!event.success) {
        stats.failed++;
      }
      ipStats.set(event.ipAddress, stats);
    }

    const topIps = Array.from(ipStats.entries())
      .sort((a, b) => b[1].count - a[1].count)
      .slice(0, 10)
      .map(([ip, stats]) => ({ ip, count: stats.count, failedCount: stats.failed }));

    return {
      totalEvents: recentEvents.length,
      failedLogins: failedLogins.length,
      successfulLogins: successfulLogins.length,
      suspiciousEvents: suspiciousEvents.length,
      uniqueIps: ipStats.size,
      topIps
    };
  }

  /**
   * Export audit log
   */
  exportAuditLog(startDate: Date, endDate: Date): AuthAuditEvent[] {
    return this.events.filter(e => 
      e.timestamp >= startDate.getTime() &&
      e.timestamp <= endDate.getTime()
    );
  }

  private calculateRiskScore(event: AuthAuditEvent): number {
    let score = 0;

    // Failed login increases risk
    if (!event.success) {
      score += 30;
    }

    // Multiple failed logins from same IP
    const recentFailures = this.getFailedLoginsFromIp(event.ipAddress, 3600000);
    if (recentFailures.length > 3) {
      score += Math.min(recentFailures.length * 10, 50);
    }

    // Off-hours access (simplified - between 10 PM and 6 AM)
    const hour = new Date(event.timestamp).getHours();
    if (hour >= 22 || hour <= 6) {
      score += 10;
    }

    return Math.min(score, 100);
  }

  private checkSuspiciousPatterns(event: AuthAuditEvent): boolean {
    const userEvents = event.userId 
      ? this.events.filter(e => e.userId === event.userId)
      : [];

    for (const pattern of this.config.suspiciousPatterns) {
      if (pattern.check(userEvents, event)) {
        logger.warn(`Suspicious pattern detected: ${pattern.name} | User: ${event.username} | IP: ${event.ipAddress}`);
        return true;
      }
    }

    return false;
  }

  private getDefaultPatterns(): SuspiciousPattern[] {
    return [
      {
        name: 'rapid_login_failures',
        description: 'Multiple login failures in short time',
        check: (events, current) => {
          if (current.type !== 'login_failure') return false;
          const recent = events.filter(e => 
            e.type === 'login_failure' &&
            e.timestamp > current.timestamp - 300000 // 5 minutes
          );
          return recent.length >= 5;
        },
        riskScore: 80
      },
      {
        name: 'impossible_travel',
        description: 'Logins from different locations in impossible time',
        check: (events, current) => {
          if (current.type !== 'login_success') return false;
          // Simplified: Would need geolocation in production
          return false;
        },
        riskScore: 90
      },
      {
        name: 'unusual_hours',
        description: 'Login at unusual hours for user',
        check: (events, current) => {
          if (current.type !== 'login_success') return false;
          const hour = new Date(current.timestamp).getHours();
          const isUnusualHour = hour >= 23 || hour <= 5;
          
          // Check if user normally logs in during these hours
          const userLogins = events.filter(e => e.type === 'login_success');
          const unusualLogins = userLogins.filter(e => {
            const h = new Date(e.timestamp).getHours();
            return h >= 23 || h <= 5;
          });
          
          // If less than 10% of logins are at unusual hours, flag it
          return isUnusualHour && userLogins.length > 10 && unusualLogins.length / userLogins.length < 0.1;
        },
        riskScore: 40
      }
    ];
  }

  private startCleanup(): void {
    // Clean up old events daily
    setInterval(() => {
      const cutoff = Date.now() - (this.config.retentionDays * 24 * 60 * 60 * 1000);
      const beforeCount = this.events.length;
      this.events = this.events.filter(e => e.timestamp >= cutoff);
      const removed = beforeCount - this.events.length;
      
      if (removed > 0) {
        logger.debug(`Cleaned up ${removed} old audit events`);
      }
    }, 24 * 60 * 60 * 1000);
  }
}

// Singleton instance
let auditLogger: AuthAuditLogger | null = null;

export function getAuthAuditLogger(): AuthAuditLogger {
  if (!auditLogger) {
    auditLogger = new AuthAuditLogger();
  }
  return auditLogger;
}

export function resetAuthAuditLogger(): void {
  auditLogger = null;
}
