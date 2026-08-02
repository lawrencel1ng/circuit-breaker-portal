/**
 * Health Check Endpoint
 * Provides system health status for load balancers and monitoring
 */

import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { prisma } from '$lib/server/db';
import { isDatabaseConnected } from '$lib/server/db';
import { logger } from '$lib/server/logger';
import { getConnectionPool } from '$lib/server/f5/connection-pool';
import { getSessionManager } from '$lib/server/auth/session';

interface HealthStatus {
  status: 'healthy' | 'degraded' | 'unhealthy';
  timestamp: string;
  version: string;
  checks: {
    database: {
      status: 'healthy' | 'unhealthy';
      responseTime: number;
      message?: string;
    };
    f5Connection?: {
      status: 'healthy' | 'unhealthy' | 'disabled';
      message?: string;
      poolStats?: {
        total: number;
        available: number;
        inUse: number;
        unhealthy: number;
      };
    };
    sessionManager: {
      status: 'healthy' | 'unhealthy';
      activeSessions: number;
    };
  };
}

// Simple in-memory check to prevent health check spam
let lastCheck: { time: number; result: HealthStatus } | null = null;
const CACHE_TTL = 5000; // 5 seconds

// GET /api/health - Get system health status
export const GET: RequestHandler = async ({ url }) => {
  const startTime = Date.now();
  const detailed = url.searchParams.get('detailed') === 'true';
  
  // Return cached result if within TTL
  if (lastCheck && Date.now() - lastCheck.time < CACHE_TTL) {
    return json(lastCheck.result, { 
      status: lastCheck.result.status === 'healthy' ? 200 : 503 
    });
  }

  const checks: HealthStatus['checks'] = {
    database: { status: 'unhealthy', responseTime: 0 },
    sessionManager: { status: 'unhealthy', activeSessions: 0 }
  };

  // Database health check
  try {
    const dbStart = Date.now();
    await prisma.$queryRaw`SELECT 1`;
    checks.database = {
      status: 'healthy',
      responseTime: Date.now() - dbStart
    };
  } catch (error: any) {
    checks.database = {
      status: 'unhealthy',
      responseTime: Date.now() - startTime,
      message: error.message
    };
    logger.error('Health check: Database connection failed', error);
  }

  // Session manager health check
  try {
    const sessionManager = getSessionManager();
    const activeSessions = sessionManager.getAllActiveSessions().length;
    checks.sessionManager = {
      status: 'healthy',
      activeSessions
    };
  } catch (error: any) {
    checks.sessionManager = {
      status: 'unhealthy',
      activeSessions: 0
    };
    logger.error('Health check: Session manager error', error);
  }

  // F5 Connection health check (optional, only if enabled)
  if (process.env.F5_HEALTH_CHECK !== 'false') {
    try {
      const pool = getConnectionPool();
      const stats = pool.getStats();
      
      checks.f5Connection = {
        status: stats.unhealthy === stats.total && stats.total > 0 ? 'unhealthy' : 'healthy',
        poolStats: detailed ? stats : undefined,
        message: stats.unhealthy > 0 ? `${stats.unhealthy} unhealthy connections` : undefined
      };
    } catch (error: any) {
      // F5 connection is optional, mark as disabled if not configured
      if (error.message?.includes('Failed to create F5 connection')) {
        checks.f5Connection = {
          status: 'disabled',
          message: 'F5 not configured'
        };
      } else {
        checks.f5Connection = {
          status: 'unhealthy',
          message: error.message
        };
      }
    }
  }

  // Determine overall status
  let status: HealthStatus['status'] = 'healthy';
  
  if (checks.database.status === 'unhealthy') {
    status = 'unhealthy';
  } else if (checks.f5Connection?.status === 'unhealthy') {
    status = 'degraded';
  }

  const healthStatus: HealthStatus = {
    status,
    timestamp: new Date().toISOString(),
    version: process.env.npm_package_version || '0.0.1',
    checks
  };

  // Cache the result
  lastCheck = { time: Date.now(), result: healthStatus };

  // Return 503 if unhealthy, 200 otherwise
  const httpStatus = status === 'unhealthy' ? 503 : 200;
  
  return json(healthStatus, { status: httpStatus });
};

// HEAD /api/health - Lightweight health check for load balancers
export const HEAD: RequestHandler = async () => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    return new Response(null, { status: 200 });
  } catch {
    return new Response(null, { status: 503 });
  }
};
