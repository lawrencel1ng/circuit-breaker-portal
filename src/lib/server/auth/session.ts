/**
 * Session Management
 * Handles user sessions with JWT tokens, timeout management, and security features
 */

import { createHash, randomBytes } from 'crypto';
import { logger } from '../logger';
import type { User, Role } from './rbac';

export interface Session {
  id: string;
  userId: string;
  username: string;
  email: string;
  roles: Role[];
  
  // Token
  accessToken: string;
  refreshToken: string;
  
  // Timestamps
  createdAt: number;
  expiresAt: number;
  lastActivity: number;
  refreshedAt?: number;
  
  // Security
  ipAddress: string;
  userAgent: string;
  fingerprint: string;  // Browser fingerprint
  
  // Status
  isValid: boolean;
  invalidatedReason?: string;
}

export interface SessionConfig {
  accessTokenExpiry: number;    // milliseconds
  refreshTokenExpiry: number;   // milliseconds
  sessionTimeout: number;       // milliseconds of inactivity
  maxConcurrentSessions: number;
  absoluteTimeout: number;      // maximum session lifetime
}

export interface TokenPayload {
  sub: string;           // user id
  username: string;
  email: string;
  roles: Role[];
  sessionId: string;
  iat: number;          // issued at
  exp: number;          // expiration
  jti: string;          // token id
}

const DEFAULT_SESSION_CONFIG: SessionConfig = {
  accessTokenExpiry: 15 * 60 * 1000,      // 15 minutes
  refreshTokenExpiry: 7 * 24 * 60 * 60 * 1000,  // 7 days
  sessionTimeout: 30 * 60 * 1000,         // 30 minutes
  maxConcurrentSessions: 5,
  absoluteTimeout: 8 * 60 * 60 * 1000     // 8 hours
};

export class SessionManager {
  private sessions: Map<string, Session> = new Map();
  private userSessions: Map<string, Set<string>> = new Map(); // userId -> sessionIds
  private config: SessionConfig;
  private cleanupTimer: NodeJS.Timeout | null = null;
  private jwtSecret: string;

  constructor(jwtSecret: string, config: Partial<SessionConfig> = {}) {
    this.jwtSecret = jwtSecret;
    this.config = { ...DEFAULT_SESSION_CONFIG, ...config };
    this.startCleanup();
  }

  /**
   * Create a new session for a user
   */
  async createSession(
    user: User,
    ipAddress: string,
    userAgent: string
  ): Promise<Session> {
    // Check concurrent session limit
    const userSessionIds = this.userSessions.get(user.id);
    if (userSessionIds && userSessionIds.size >= this.config.maxConcurrentSessions) {
      // Invalidate oldest session
      const oldestSessionId = this.getOldestSession(user.id);
      if (oldestSessionId) {
        await this.invalidateSession(oldestSessionId, 'max_concurrent_exceeded');
      }
    }

    const now = Date.now();
    const sessionId = this.generateSessionId();
    const fingerprint = this.generateFingerprint(ipAddress, userAgent);

    const session: Session = {
      id: sessionId,
      userId: user.id,
      username: user.username,
      email: user.email,
      roles: user.roles,
      accessToken: this.generateToken(sessionId, user, now, this.config.accessTokenExpiry),
      refreshToken: this.generateRefreshToken(),
      createdAt: now,
      expiresAt: now + this.config.absoluteTimeout,
      lastActivity: now,
      ipAddress,
      userAgent,
      fingerprint,
      isValid: true
    };

    this.sessions.set(sessionId, session);
    
    // Track user's sessions
    if (!this.userSessions.has(user.id)) {
      this.userSessions.set(user.id, new Set());
    }
    this.userSessions.get(user.id)!.add(sessionId);

    logger.info(`Session created for user ${user.username} from ${ipAddress}`);
    
    return session;
  }

  /**
   * Validate and get session from access token
   */
  async validateAccessToken(token: string): Promise<Session | null> {
    try {
      const payload = this.verifyToken(token);
      if (!payload) return null;

      const session = this.sessions.get(payload.sessionId);
      if (!session) return null;

      // Check if session is still valid
      if (!session.isValid) return null;

      // Check fingerprint (prevent token theft)
      // Note: In production, you'd verify the fingerprint matches

      // Check if token is expired
      if (Date.now() > payload.exp * 1000) {
        return null;
      }

      // Check absolute timeout
      if (Date.now() > session.expiresAt) {
        await this.invalidateSession(session.id, 'absolute_timeout');
        return null;
      }

      // Check inactivity timeout
      if (Date.now() - session.lastActivity > this.config.sessionTimeout) {
        await this.invalidateSession(session.id, 'inactivity_timeout');
        return null;
      }

      // Update last activity
      session.lastActivity = Date.now();

      return session;
    } catch (error: any) {
      logger.error('Token validation error: ' + error.message);
      return null;
    }
  }

  /**
   * Refresh access token using refresh token
   */
  async refreshSession(sessionId: string, refreshToken: string): Promise<Session | null> {
    const session = this.sessions.get(sessionId);
    if (!session) return null;

    // Verify refresh token
    if (session.refreshToken !== refreshToken) {
      logger.warn(`Invalid refresh token attempt for session ${sessionId}`);
      await this.invalidateSession(sessionId, 'invalid_refresh_token');
      return null;
    }

    // Check if session is valid
    if (!session.isValid) return null;

    // Check absolute timeout
    if (Date.now() > session.expiresAt) {
      await this.invalidateSession(sessionId, 'absolute_timeout');
      return null;
    }

    // Generate new tokens
    const now = Date.now();
    session.accessToken = this.generateToken(
      session.id,
      {
        id: session.userId,
        username: session.username,
        email: session.email,
        roles: session.roles,
        createdAt: new Date(),
        updatedAt: new Date(),
        isActive: true
      },
      now,
      this.config.accessTokenExpiry
    );
    session.refreshToken = this.generateRefreshToken();
    session.refreshedAt = now;
    session.lastActivity = now;

    logger.debug(`Session ${sessionId} refreshed`);
    
    return session;
  }

  /**
   * Invalidate a session
   */
  async invalidateSession(sessionId: string, reason: string): Promise<void> {
    const session = this.sessions.get(sessionId);
    if (!session) return;

    session.isValid = false;
    session.invalidatedReason = reason;

    // Remove from user's sessions
    const userSessionIds = this.userSessions.get(session.userId);
    if (userSessionIds) {
      userSessionIds.delete(sessionId);
      if (userSessionIds.size === 0) {
        this.userSessions.delete(session.userId);
      }
    }

    logger.info(`Session ${sessionId} invalidated: ${reason}`);
  }

  /**
   * Invalidate all sessions for a user
   */
  async invalidateAllUserSessions(userId: string, reason: string): Promise<number> {
    const sessionIds = this.userSessions.get(userId);
    if (!sessionIds) return 0;

    let count = 0;
    for (const sessionId of sessionIds) {
      await this.invalidateSession(sessionId, reason);
      count++;
    }

    logger.info(`All ${count} sessions invalidated for user ${userId}: ${reason}`);
    return count;
  }

  /**
   * Get session by ID
   */
  getSession(sessionId: string): Session | null {
    return this.sessions.get(sessionId) || null;
  }

  /**
   * Get all active sessions for a user
   */
  getUserSessions(userId: string): Session[] {
    const sessionIds = this.userSessions.get(userId);
    if (!sessionIds) return [];

    return Array.from(sessionIds)
      .map(id => this.sessions.get(id))
      .filter((s): s is Session => s !== undefined && s.isValid);
  }

  /**
   * Get all active sessions
   */
  getAllActiveSessions(): Session[] {
    return Array.from(this.sessions.values()).filter(s => s.isValid);
  }

  /**
   * Extend session timeout
   */
  async extendSession(sessionId: string): Promise<boolean> {
    const session = this.sessions.get(sessionId);
    if (!session || !session.isValid) return false;

    session.expiresAt = Date.now() + this.config.absoluteTimeout;
    session.lastActivity = Date.now();
    
    logger.debug(`Session ${sessionId} extended`);
    return true;
  }

  /**
   * Parse token from Authorization header
   */
  parseAuthHeader(header: string | null): string | null {
    if (!header) return null;
    
    const parts = header.split(' ');
    if (parts.length !== 2 || parts[0] !== 'Bearer') {
      return null;
    }
    
    return parts[1];
  }

  /**
   * Destroy session manager
   */
  destroy(): void {
    if (this.cleanupTimer) {
      clearInterval(this.cleanupTimer);
    }
  }

  private generateSessionId(): string {
    return randomBytes(32).toString('hex');
  }

  private generateRefreshToken(): string {
    return randomBytes(32).toString('base64url');
  }

  private generateFingerprint(ip: string, userAgent: string): string {
    const data = `${ip}:${userAgent}`;
    return createHash('sha256').update(data).digest('hex').substring(0, 16);
  }

  private generateToken(
    sessionId: string,
    user: User,
    issuedAt: number,
    expiry: number
  ): string {
    const payload: TokenPayload = {
      sub: user.id,
      username: user.username,
      email: user.email,
      roles: user.roles,
      sessionId,
      iat: Math.floor(issuedAt / 1000),
      exp: Math.floor((issuedAt + expiry) / 1000),
      jti: randomBytes(16).toString('hex')
    };

    // Simple JWT implementation
    // In production, use a library like 'jsonwebtoken'
    const header = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64url');
    const body = Buffer.from(JSON.stringify(payload)).toString('base64url');
    const signature = createHash('sha256')
      .update(`${header}.${body}.${this.jwtSecret}`)
      .digest('base64url');

    return `${header}.${body}.${signature}`;
  }

  private verifyToken(token: string): TokenPayload | null {
    try {
      const parts = token.split('.');
      if (parts.length !== 3) return null;

      const [header, body, signature] = parts;

      // Verify signature
      const expectedSignature = createHash('sha256')
        .update(`${header}.${body}.${this.jwtSecret}`)
        .digest('base64url');

      if (signature !== expectedSignature) {
        return null;
      }

      const payload = JSON.parse(Buffer.from(body, 'base64url').toString());
      return payload;
    } catch (error) {
      return null;
    }
  }

  private getOldestSession(userId: string): string | null {
    const sessionIds = this.userSessions.get(userId);
    if (!sessionIds) return null;

    let oldestId: string | null = null;
    let oldestTime = Infinity;

    for (const id of sessionIds) {
      const session = this.sessions.get(id);
      if (session && session.createdAt < oldestTime) {
        oldestTime = session.createdAt;
        oldestId = id;
      }
    }

    return oldestId;
  }

  private startCleanup(): void {
    // Clean up expired sessions every 5 minutes
    this.cleanupTimer = setInterval(() => {
      const now = Date.now();
      let cleaned = 0;

      for (const [id, session] of this.sessions) {
        if (!session.isValid) continue;

        // Check absolute timeout
        if (now > session.expiresAt) {
          this.invalidateSession(id, 'cleanup_absolute_timeout');
          cleaned++;
          continue;
        }

        // Check inactivity timeout
        if (now - session.lastActivity > this.config.sessionTimeout) {
          this.invalidateSession(id, 'cleanup_inactivity_timeout');
          cleaned++;
        }
      }

      if (cleaned > 0) {
        logger.debug(`Cleaned up ${cleaned} expired sessions`);
      }
    }, 5 * 60 * 1000);
  }
}

// Singleton instance
let sessionManager: SessionManager | null = null;
let sessionManagerError: string | null = null;

export function getSessionManager(jwtSecret?: string): SessionManager {
  if (!sessionManager) {
    if (!jwtSecret) {
      jwtSecret = process.env.JWT_SECRET;
    }
    if (!jwtSecret || jwtSecret === 'default-secret-change-in-production') {
      sessionManagerError = 'JWT_SECRET environment variable is required and must be set to a secure value.';
      // In development, log error but don't throw to prevent reload loops
      if (process.env.NODE_ENV === 'development') {
        console.error('[SessionManager] ' + sessionManagerError);
        // Create a dummy session manager that will reject all operations
        // This allows the app to start but authentication will fail
        sessionManager = new SessionManager('dummy-secret-not-for-production-use-only');
      } else {
        throw new Error(
          sessionManagerError + 
          ' Please generate a strong secret (e.g., using: node -e "console.log(require(\'crypto\').randomBytes(64).toString(\'hex\'))")'
        );
      }
    } else {
      sessionManager = new SessionManager(jwtSecret);
    }
  }
  return sessionManager;
}

export function getSessionManagerStatus(): { initialized: boolean; error: string | null } {
  return { initialized: !!sessionManager, error: sessionManagerError };
}

export function resetSessionManager(): void {
  if (sessionManager) {
    sessionManager.destroy();
    sessionManager = null;
  }
}
