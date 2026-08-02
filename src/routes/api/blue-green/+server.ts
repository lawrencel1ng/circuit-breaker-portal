/**
 * Blue/Green Deployment API Endpoints
 * REST API for managing blue/green deployments
 */

import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { getBlueGreenService } from '$lib/server/deployment/blue-green';
import { getRBACEngine, Resource, Action } from '$lib/server/auth/rbac';
import { getAuthAuditLogger } from '$lib/server/auth/audit';
import { logger } from '$lib/server/logger';

// GET /api/blue-green - List all deployments
export const GET: RequestHandler = async ({ url, locals }) => {
  try {
    const user = locals.user;
    if (!user) {
      throw error(401, 'Unauthorized');
    }

    // Check permission (user is guaranteed to have required fields from auth middleware)
    const rbac = getRBACEngine();
    const check = rbac.checkAccess(user as any, Resource.BLUE_GREEN, Action.READ);
    if (!check.allowed) {
      throw error(403, 'Access denied');
    }

    const service = getBlueGreenService();
    
    // Filter by application if provided
    const applicationId = url.searchParams.get('applicationId');
    
    let deployments;
    if (applicationId) {
      deployments = service.getDeploymentsByApplication(applicationId);
    } else {
      deployments = service.getAllDeployments();
    }

    return json({ deployments });

  } catch (err: any) {
    logger.error('Failed to list deployments:', err);
    throw error(500, err.message);
  }
};

// POST /api/blue-green - Create new deployment
export const POST: RequestHandler = async ({ request, locals }) => {
  try {
    const user = locals.user;
    if (!user) {
      throw error(401, 'Unauthorized');
    }

    // Check permission
    const rbac = getRBACEngine();
    const check = rbac.checkAccess(user as any, Resource.BLUE_GREEN, Action.CREATE);
    if (!check.allowed) {
      // Log permission denied
      const auditLogger = getAuthAuditLogger();
      auditLogger.logPermissionDenied(
        user.id,
        user.username,
        locals.ipAddress || 'unknown',
        request.headers.get('user-agent') || 'unknown',
        Resource.BLUE_GREEN,
        Action.CREATE
      );
      throw error(403, 'Access denied');
    }

    const body = await request.json();
    
    // Validate required fields
    if (!body.name || !body.applicationId || !body.applicationName) {
      throw error(400, 'Missing required fields: name, applicationId, applicationName');
    }

    if (!body.blueLane || !body.greenLane) {
      throw error(400, 'Missing required fields: blueLane, greenLane');
    }

    const service = getBlueGreenService();
    
    const deployment = await service.createDeployment({
      name: body.name,
      description: body.description,
      applicationId: body.applicationId,
      applicationName: body.applicationName,
      blueLane: body.blueLane,
      greenLane: body.greenLane,
      activeLane: body.activeLane || 'blue',
      config: {
        trafficSplitStrategy: body.config?.trafficSplitStrategy || 'instant',
        healthCheck: {
          enabled: body.config?.healthCheck?.enabled ?? true,
          url: body.config?.healthCheck?.url || '/health',
          method: body.config?.healthCheck?.method || 'GET',
          expectedStatus: body.config?.healthCheck?.expectedStatus || 200,
          timeout: body.config?.healthCheck?.timeout || 30000,
          interval: body.config?.healthCheck?.interval || 5000,
          retries: body.config?.healthCheck?.retries || 3,
          consecutiveSuccesses: body.config?.healthCheck?.consecutiveSuccesses || 2
        },
        rollback: {
          automatic: body.config?.rollback?.automatic ?? true,
          healthCheckFailures: body.config?.rollback?.healthCheckFailures || 3,
          errorRateThreshold: body.config?.rollback?.errorRateThreshold || 10,
          latencyThreshold: body.config?.rollback?.latencyThreshold || 5000
        },
        notifications: {
          onStart: body.config?.notifications?.onStart ?? true,
          onSuccess: body.config?.notifications?.onSuccess ?? true,
          onFailure: body.config?.notifications?.onFailure ?? true,
          channels: body.config?.notifications?.channels || ['email']
        },
        hooks: body.config?.hooks
      },
      tags: body.tags
    }, user.username);

    logger.info(`Deployment ${deployment.id} created by ${user.username}`);

    return json({ deployment }, { status: 201 });

  } catch (err: any) {
    if (err.status) throw err;
    logger.error('Failed to create deployment:', err);
    throw error(500, err.message);
  }
};
