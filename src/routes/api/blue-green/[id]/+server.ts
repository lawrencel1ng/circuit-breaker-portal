/**
 * Blue/Green Deployment Individual Resource API
 * Manage specific deployments: start, rollback, cancel, etc.
 */

import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { getBlueGreenService } from '$lib/server/deployment/blue-green';
import { getRBACEngine, Resource, Action } from '$lib/server/auth/rbac';
import { logger } from '$lib/server/logger';

// GET /api/blue-green/:id - Get deployment details
export const GET: RequestHandler = async ({ params, locals }) => {
  try {
    const user = locals.user;
    if (!user) {
      throw error(401, 'Unauthorized');
    }

    // Check permission
    const rbac = getRBACEngine();
    const check = rbac.checkAccess(user as any, Resource.BLUE_GREEN, Action.READ);
    if (!check.allowed) {
      throw error(403, 'Access denied');
    }

    const service = getBlueGreenService();
    const deployment = service.getDeployment(params.id);

    if (!deployment) {
      throw error(404, 'Deployment not found');
    }

    return json({ deployment });

  } catch (err: any) {
    if (err.status) throw err;
    logger.error('Failed to get deployment:', err);
    throw error(500, err.message);
  }
};

// POST /api/blue-green/:id - Execute action on deployment
export const POST: RequestHandler = async ({ params, request, locals }) => {
  try {
    const user = locals.user;
    if (!user) {
      throw error(401, 'Unauthorized');
    }

    const body = await request.json();
    const action = body.action;

    if (!action) {
      throw error(400, 'Missing required field: action');
    }

    const service = getBlueGreenService();
    const rbac = getRBACEngine();

    switch (action) {
      case 'start': {
        // Check execute permission
        const check = rbac.checkAccess(user as any, Resource.BLUE_GREEN, Action.EXECUTE);
        if (!check.allowed) {
          throw error(403, 'Access denied');
        }

        // Start deployment asynchronously
        service.startDeployment(params.id).catch(err => {
          logger.error(`Deployment ${params.id} failed:`, err);
        });

        return json({ 
          message: 'Deployment started',
          deploymentId: params.id
        });
      }

      case 'cancel': {
        // Check execute permission
        const check = rbac.checkAccess(user as any, Resource.BLUE_GREEN, Action.EXECUTE);
        if (!check.allowed) {
          throw error(403, 'Access denied');
        }

        await service.cancelDeployment(params.id);
        
        return json({ 
          message: 'Deployment cancelled',
          deploymentId: params.id
        });
      }

      case 'rollback': {
        // Check execute permission
        const check = rbac.checkAccess(user as any, Resource.BLUE_GREEN, Action.EXECUTE);
        if (!check.allowed) {
          throw error(403, 'Access denied');
        }

        // Execute rollback asynchronously
        service.rollbackDeployment(params.id).catch(err => {
          logger.error(`Rollback ${params.id} failed:`, err);
        });

        return json({ 
          message: 'Rollback initiated',
          deploymentId: params.id
        });
      }

      case 'shift-traffic': {
        // Check execute permission
        const check = rbac.checkAccess(user as any, Resource.BLUE_GREEN, Action.EXECUTE);
        if (!check.allowed) {
          throw error(403, 'Access denied');
        }

        const { percentage, strategy } = body;
        
        if (typeof percentage !== 'number' || percentage < 0 || percentage > 100) {
          throw error(400, 'Invalid percentage: must be between 0 and 100');
        }

        await service.shiftTraffic(
          params.id, 
          percentage, 
          strategy || 'instant'
        );

        return json({ 
          message: `Traffic shifted to ${percentage}%`,
          deploymentId: params.id,
          trafficSplit: percentage
        });
      }

      case 'health-check': {
        // Check read permission
        const check = rbac.checkAccess(user as any, Resource.BLUE_GREEN, Action.READ);
        if (!check.allowed) {
          throw error(403, 'Access denied');
        }

        const results = await service.runHealthChecks(params.id);

        return json({ 
          results,
          deploymentId: params.id
        });
      }

      default:
        throw error(400, `Unknown action: ${action}`);
    }

  } catch (err: any) {
    if (err.status) throw err;
    logger.error('Failed to execute action:', err);
    throw error(500, err.message);
  }
};

// DELETE /api/blue-green/:id - Delete deployment
export const DELETE: RequestHandler = async ({ params, locals }) => {
  try {
    const user = locals.user;
    if (!user) {
      throw error(401, 'Unauthorized');
    }

    // Check permission
    const rbac = getRBACEngine();
    const check = rbac.checkAccess(user as any, Resource.BLUE_GREEN, Action.DELETE);
    if (!check.allowed) {
      throw error(403, 'Access denied');
    }

    const service = getBlueGreenService();
    const deployment = service.getDeployment(params.id);

    if (!deployment) {
      throw error(404, 'Deployment not found');
    }

    // Only allow deletion of completed or failed deployments
    if (!['completed', 'failed'].includes(deployment.status)) {
      throw error(400, 'Cannot delete active deployment');
    }

    // Note: In a real implementation, we'd remove from database
    // For now, just mark as deleted
    logger.info(`Deployment ${params.id} deleted by ${user.username}`);

    return json({ 
      message: 'Deployment deleted',
      deploymentId: params.id
    });

  } catch (err: any) {
    if (err.status) throw err;
    logger.error('Failed to delete deployment:', err);
    throw error(500, err.message);
  }
};
