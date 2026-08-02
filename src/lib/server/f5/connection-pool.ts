/**
 * F5 Connection Pool Manager
 * Manages persistent connections to F5 BIG-IP devices
 * Provides connection reuse, health checks, and circuit breaker pattern
 */

import { F5iControlClient } from './icontrol-client';
import { F5_CONFIG } from './config';
import { logger } from '../logger';

export interface ConnectionPoolConfig {
  maxConnections: number;
  minConnections: number;
  idleTimeout: number;        // milliseconds
  connectionTimeout: number;  // milliseconds
  healthCheckInterval: number; // milliseconds
  maxRetries: number;
  retryDelay: number;         // milliseconds
}

export interface PooledConnection {
  id: string;
  client: F5iControlClient;
  inUse: boolean;
  createdAt: number;
  lastUsed: number;
  healthStatus: 'healthy' | 'unhealthy' | 'unknown';
  useCount: number;
}

const DEFAULT_POOL_CONFIG: ConnectionPoolConfig = {
  maxConnections: 10,
  minConnections: 2,
  idleTimeout: 300000,       // 5 minutes
  connectionTimeout: 30000,  // 30 seconds
  healthCheckInterval: 60000, // 1 minute
  maxRetries: 3,
  retryDelay: 1000
};

export class F5ConnectionPool {
  private connections: Map<string, PooledConnection> = new Map();
  private config: ConnectionPoolConfig;
  private healthCheckTimer: NodeJS.Timeout | null = null;
  private cleanupTimer: NodeJS.Timeout | null = null;
  private connectionCounter = 0;

  constructor(config: Partial<ConnectionPoolConfig> = {}) {
    this.config = { ...DEFAULT_POOL_CONFIG, ...config };
    this.startHealthChecks();
    this.startCleanup();
  }

  /**
   * Acquire a connection from the pool
   */
  async acquire(): Promise<PooledConnection> {
    // First, try to find an available healthy connection
    const available = this.findAvailableConnection();
    if (available) {
      available.inUse = true;
      available.lastUsed = Date.now();
      available.useCount++;
      logger.debug(`Acquired existing connection ${available.id}`);
      return available;
    }

    // Create new connection if under limit
    if (this.connections.size < this.config.maxConnections) {
      const conn = await this.createConnection();
      conn.inUse = true;
      logger.info(`Created new connection ${conn.id}, pool size: ${this.connections.size}`);
      return conn;
    }

    // Wait for a connection to become available
    logger.warn('Connection pool exhausted, waiting for available connection');
    return this.waitForConnection();
  }

  /**
   * Release a connection back to the pool
   */
  release(connectionId: string): void {
    const conn = this.connections.get(connectionId);
    if (conn) {
      conn.inUse = false;
      conn.lastUsed = Date.now();
      logger.debug(`Released connection ${connectionId}`);
    }
  }

  /**
   * Execute a function with automatic connection management
   */
  async execute<T>(fn: (client: F5iControlClient) => Promise<T>): Promise<T> {
    const conn = await this.acquire();
    try {
      return await fn(conn.client);
    } finally {
      this.release(conn.id);
    }
  }

  /**
   * Execute with retry logic
   */
  async executeWithRetry<T>(
    fn: (client: F5iControlClient) => Promise<T>,
    options: { maxRetries?: number; retryDelay?: number } = {}
  ): Promise<T> {
    const maxRetries = options.maxRetries ?? this.config.maxRetries;
    const retryDelay = options.retryDelay ?? this.config.retryDelay;

    let lastError: Error | undefined;

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        return await this.execute(fn);
      } catch (error: any) {
        lastError = error;
        
        // Don't retry on authentication errors
        if (error.message?.includes('Authentication failed')) {
          throw error;
        }

        if (attempt < maxRetries) {
          logger.warn(`F5 operation failed (attempt ${attempt + 1}/${maxRetries + 1}), retrying in ${retryDelay}ms: ${error.message}`);
          await this.sleep(retryDelay * (attempt + 1)); // Exponential backoff
        }
      }
    }

    throw lastError;
  }

  /**
   * Get pool statistics
   */
  getStats(): {
    total: number;
    available: number;
    inUse: number;
    unhealthy: number;
    averageUseCount: number;
  } {
    const conns = Array.from(this.connections.values());
    return {
      total: conns.length,
      available: conns.filter(c => !c.inUse).length,
      inUse: conns.filter(c => c.inUse).length,
      unhealthy: conns.filter(c => c.healthStatus === 'unhealthy').length,
      averageUseCount: conns.reduce((sum, c) => sum + c.useCount, 0) / conns.length || 0
    };
  }

  /**
   * Destroy all connections and cleanup
   */
  async destroy(): Promise<void> {
    if (this.healthCheckTimer) {
      clearInterval(this.healthCheckTimer);
      this.healthCheckTimer = null;
    }
    if (this.cleanupTimer) {
      clearInterval(this.cleanupTimer);
      this.cleanupTimer = null;
    }

    // Close all connections and revoke tokens
    const closePromises: Promise<void>[] = [];
    for (const [id, conn] of this.connections) {
      closePromises.push(
        (async () => {
          try {
            await conn.client.close();
            logger.debug(`Closed connection ${id}`);
          } catch (error: any) {
            logger.error(`Error closing connection ${id}: ${error.message}`);
          }
        })()
      );
    }

    await Promise.all(closePromises);
    this.connections.clear();
    logger.info('Connection pool destroyed');
  }

  private async createConnection(): Promise<PooledConnection> {
    const id = `conn-${++this.connectionCounter}`;
    const client = new F5iControlClient(
      F5_CONFIG.HOST,
      F5_CONFIG.USERNAME,
      F5_CONFIG.PASSWORD,
      F5_CONFIG.VERIFY_SSL
    );

    // Test connection
    try {
      await Promise.race([
        client.testConnectivity(),
        this.createTimeoutPromise(this.config.connectionTimeout)
      ]);
    } catch (error) {
      throw new Error(`Failed to create F5 connection: ${error}`);
    }

    const conn: PooledConnection = {
      id,
      client,
      inUse: false,
      createdAt: Date.now(),
      lastUsed: Date.now(),
      healthStatus: 'healthy',
      useCount: 0
    };

    this.connections.set(id, conn);
    return conn;
  }

  private findAvailableConnection(): PooledConnection | null {
    for (const conn of this.connections.values()) {
      if (!conn.inUse && conn.healthStatus === 'healthy') {
        return conn;
      }
    }
    return null;
  }

  private async waitForConnection(timeout = 30000): Promise<PooledConnection> {
    const startTime = Date.now();
    
    while (Date.now() - startTime < timeout) {
      const conn = this.findAvailableConnection();
      if (conn) {
        conn.inUse = true;
        conn.lastUsed = Date.now();
        return conn;
      }
      await this.sleep(100);
    }

    throw new Error('Timeout waiting for available F5 connection');
  }

  private startHealthChecks(): void {
    this.healthCheckTimer = setInterval(async () => {
      for (const [id, conn] of this.connections) {
        if (conn.inUse) continue; // Skip connections in use

        try {
          await conn.client.testConnectivity();
          if (conn.healthStatus !== 'healthy') {
            logger.info(`Connection ${id} recovered`);
            conn.healthStatus = 'healthy';
          }
        } catch (error) {
          logger.warn(`Connection ${id} health check failed`);
          conn.healthStatus = 'unhealthy';
          
          // Remove and recreate unhealthy connections
          this.connections.delete(id);
          try {
            await this.createConnection();
          } catch (createError: any) {
            logger.error('Failed to recreate connection:', createError);
          }
        }
      }
    }, this.config.healthCheckInterval);
  }

  private startCleanup(): void {
    this.cleanupTimer = setInterval(() => {
      const now = Date.now();
      
      for (const [id, conn] of this.connections) {
        // Remove idle connections above minimum
        if (!conn.inUse && 
            this.connections.size > this.config.minConnections &&
            now - conn.lastUsed > this.config.idleTimeout) {
          this.connections.delete(id);
          logger.debug(`Cleaned up idle connection ${id}`);
        }
      }
    }, this.config.idleTimeout / 2);
  }

  private createTimeoutPromise(ms: number): Promise<never> {
    return new Promise((_, reject) => {
      setTimeout(() => reject(new Error(`Connection timeout after ${ms}ms`)), ms);
    });
  }

  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// Singleton instance
let connectionPool: F5ConnectionPool | null = null;

export function getConnectionPool(config?: Partial<ConnectionPoolConfig>): F5ConnectionPool {
  if (!connectionPool) {
    connectionPool = new F5ConnectionPool(config);
  }
  return connectionPool;
}

export function resetConnectionPool(): void {
  if (connectionPool) {
    connectionPool.destroy();
    connectionPool = null;
  }
}
