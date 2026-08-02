/**
 * Rate Limiter
 * Simple in-memory rate limiting for authentication endpoints
 */

import { logger } from './logger';

interface RateLimitEntry {
  count: number;
  firstAttempt: number;
  blocked: boolean;
  blockExpiresAt?: number;
}

interface RateLimitConfig {
  maxAttempts: number;      // Maximum attempts before blocking
  windowMs: number;         // Time window in milliseconds
  blockDurationMs: number;  // How long to block after exceeding limit
}

const DEFAULT_CONFIG: RateLimitConfig = {
  maxAttempts: 5,
  windowMs: 15 * 60 * 1000,      // 15 minutes
  blockDurationMs: 30 * 60 * 1000 // 30 minutes block
};

export class RateLimiter {
  private attempts: Map<string, RateLimitEntry> = new Map();
  private config: RateLimitConfig;
  private cleanupInterval: NodeJS.Timeout | null = null;

  constructor(config: Partial<RateLimitConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.startCleanup();
  }

  /**
   * Check if a key is rate limited
   * Returns true if the request should be allowed, false if blocked
   */
  check(key: string): { allowed: boolean; remaining: number; resetAt?: number } {
    const now = Date.now();
    const entry = this.attempts.get(key);

    // If no entry exists, allow and create entry
    if (!entry) {
      this.attempts.set(key, {
        count: 1,
        firstAttempt: now,
        blocked: false
      });
      return { allowed: true, remaining: this.config.maxAttempts - 1 };
    }

    // Check if blocked
    if (entry.blocked) {
      if (entry.blockExpiresAt && now < entry.blockExpiresAt) {
        return { 
          allowed: false, 
          remaining: 0, 
          resetAt: entry.blockExpiresAt 
        };
      }
      // Block expired, reset
      entry.blocked = false;
      entry.count = 1;
      entry.firstAttempt = now;
      delete entry.blockExpiresAt;
      return { allowed: true, remaining: this.config.maxAttempts - 1 };
    }

    // Check if window has expired
    if (now - entry.firstAttempt > this.config.windowMs) {
      // Reset window
      entry.count = 1;
      entry.firstAttempt = now;
      return { allowed: true, remaining: this.config.maxAttempts - 1 };
    }

    // Increment count
    entry.count++;

    // Check if limit exceeded
    if (entry.count > this.config.maxAttempts) {
      entry.blocked = true;
      entry.blockExpiresAt = now + this.config.blockDurationMs;
      logger.warn(`Rate limit exceeded for key: ${key}`);
      return { 
        allowed: false, 
        remaining: 0, 
        resetAt: entry.blockExpiresAt 
      };
    }

    return { 
      allowed: true, 
      remaining: this.config.maxAttempts - entry.count 
    };
  }

  /**
   * Reset rate limit for a key
   */
  reset(key: string): void {
    this.attempts.delete(key);
  }

  /**
   * Get current status for a key
   */
  getStatus(key: string): { 
    blocked: boolean; 
    attempts: number; 
    remaining: number;
    resetAt?: number;
  } | null {
    const entry = this.attempts.get(key);
    if (!entry) return null;

    return {
      blocked: entry.blocked,
      attempts: entry.count,
      remaining: Math.max(0, this.config.maxAttempts - entry.count),
      resetAt: entry.blockExpiresAt
    };
  }

  /**
   * Clean up old entries periodically
   */
  private startCleanup(): void {
    this.cleanupInterval = setInterval(() => {
      const now = Date.now();
      let cleaned = 0;

      for (const [key, entry] of this.attempts) {
        // Remove expired entries
        const windowExpired = now - entry.firstAttempt > this.config.windowMs;
        const blockExpired = entry.blocked && entry.blockExpiresAt && now > entry.blockExpiresAt;
        
        if (windowExpired || blockExpired) {
          this.attempts.delete(key);
          cleaned++;
        }
      }

      if (cleaned > 0) {
        logger.debug(`Cleaned up ${cleaned} rate limit entries`);
      }
    }, 5 * 60 * 1000); // Clean every 5 minutes
  }

  /**
   * Stop the cleanup interval
   */
  destroy(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
      this.cleanupInterval = null;
    }
  }
}

// Singleton instance for auth rate limiting
let authRateLimiter: RateLimiter | null = null;

export function getAuthRateLimiter(): RateLimiter {
  if (!authRateLimiter) {
    authRateLimiter = new RateLimiter({
      maxAttempts: 5,
      windowMs: 15 * 60 * 1000,      // 15 minutes
      blockDurationMs: 30 * 60 * 1000 // 30 minutes block
    });
  }
  return authRateLimiter;
}

/**
 * Create a rate limit key from IP and username (for login attempts)
 */
export function createRateLimitKey(ip: string, username?: string): string {
  // Use both IP and username to prevent:
  // 1. Same IP trying multiple usernames (distributed guessing)
  // 2. Same username from different IPs (distributed attack)
  if (username) {
    return `auth:${ip}:${username.toLowerCase()}`;
  }
  return `auth:${ip}`;
}
