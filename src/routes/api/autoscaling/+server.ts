/**
 * Auto-Scaling API
 * REST API for auto-scaling policies and pool management
 */

import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { getAutoScalingService } from '$lib/server/autoscaling/service';
import { getRBACEngine, Resource, Action } from '$lib/server/auth/rbac';
import { logger } from '$lib/server/logger';

// GET /api/autoscaling - Get auto-scaling data
export const GET: RequestHandler = async ({ url, locals }) => {
  try {
    const user = locals.user;
    if (!user) {
      throw error(401, 'Unauthorized');
    }

    // Check permission
    const rbac = getRBACEngine();
    const check = rbac.checkAccess(user as any, Resource.AUTO_SCALING, Action.READ);
    if (!check.allowed) {
      throw error(403, 'Access denied');
    }

    const service = getAutoScalingService();
    const type = url.searchParams.get('type');

    switch (type) {
      case 'policies':
        return json({ policies: service.getAllPolicies() });
      
      case 'pool-members':
        return json({ members: service.getAllPoolMembers() });
      
      case 'events':
        const limit = parseInt(url.searchParams.get('limit') || '50');
        return json({ events: service.getScalingEvents(limit) });
      
      case 'metrics':
        return json({ metrics: service.getCurrentMetrics() });
      
      case 'metrics-history':
        const historyLimit = parseInt(url.searchParams.get('limit') || '100');
        return json({ metrics: service.getMetricsHistory(historyLimit) });
      
      case 'recommendations':
        return json({ recommendations: service.getRecommendations() });
      
      case 'predictive-config':
        return json({ config: service.getPredictiveConfig() });
      
      case 'forecast':
        return json({ forecast: service.getCapacityForecast() });
      
      case 'cost-config':
        return json({ config: service.getCostConfig() });
      
      case 'cost-analysis':
        return json({ analysis: service.getCostAnalysis() });
      
      case 'stats':
        return json({ stats: service.getScalingStats() });
      
      default:
        return json({
          policies: service.getAllPolicies(),
          members: service.getAllPoolMembers(),
          metrics: service.getCurrentMetrics(),
          stats: service.getScalingStats()
        });
    }

  } catch (err: any) {
    logger.error('Failed to get auto-scaling data:', err);
    throw error(500, err.message);
  }
};

// POST /api/autoscaling - Create or execute auto-scaling actions
export const POST: RequestHandler = async ({ request, locals }) => {
  try {
    const user = locals.user;
    if (!user) {
      throw error(401, 'Unauthorized');
    }

    const body = await request.json();
    const { action } = body;

    const service = getAutoScalingService();
    const rbac = getRBACEngine();

    switch (action) {
      case 'create-policy':
        const createCheck = rbac.checkAccess(user as any, Resource.AUTO_SCALING, Action.CREATE);
        if (!createCheck.allowed) throw error(403, 'Access denied');
        
        if (!body.policy) {
          throw error(400, 'Missing policy data');
        }
        
        const newPolicy = service.createPolicy(body.policy);
        logger.info(`Scaling policy created by ${user.username}`);
        return json({ policy: newPolicy }, { status: 201 });
      
      case 'update-policy':
        const updateCheck = rbac.checkAccess(user as any, Resource.AUTO_SCALING, Action.UPDATE);
        if (!updateCheck.allowed) throw error(403, 'Access denied');
        
        if (!body.policyId || !body.updates) {
          throw error(400, 'Missing policyId or updates');
        }
        
        const updatedPolicy = service.updatePolicy(body.policyId, body.updates);
        logger.info(`Scaling policy ${body.policyId} updated by ${user.username}`);
        return json({ policy: updatedPolicy });
      
      case 'delete-policy':
        const deleteCheck = rbac.checkAccess(user as any, Resource.AUTO_SCALING, Action.DELETE);
        if (!deleteCheck.allowed) throw error(403, 'Access denied');
        
        if (!body.policyId) {
          throw error(400, 'Missing policyId');
        }
        
        service.deletePolicy(body.policyId);
        logger.info(`Scaling policy ${body.policyId} deleted by ${user.username}`);
        return json({ success: true });
      
      case 'scale-out':
        const scaleOutCheck = rbac.checkAccess(user as any, Resource.AUTO_SCALING, Action.EXECUTE);
        if (!scaleOutCheck.allowed) throw error(403, 'Access denied');
        
        if (!body.policyId || !body.count) {
          throw error(400, 'Missing policyId or count');
        }
        
        const scaleOutEvent = await service.scaleOut(
          body.policyId, 
          body.count, 
          body.reason || `Manual scale-out by ${user.username}`
        );
        logger.info(`Scale-out executed by ${user.username}`);
        return json({ event: scaleOutEvent });
      
      case 'scale-in':
        const scaleInCheck = rbac.checkAccess(user as any, Resource.AUTO_SCALING, Action.EXECUTE);
        if (!scaleInCheck.allowed) throw error(403, 'Access denied');
        
        if (!body.policyId || !body.count) {
          throw error(400, 'Missing policyId or count');
        }
        
        const scaleInEvent = await service.scaleIn(
          body.policyId, 
          body.count, 
          body.reason || `Manual scale-in by ${user.username}`
        );
        logger.info(`Scale-in executed by ${user.username}`);
        return json({ event: scaleInEvent });
      
      case 'update-predictive-config':
        const predCheck = rbac.checkAccess(user as any, Resource.AUTO_SCALING, Action.UPDATE);
        if (!predCheck.allowed) throw error(403, 'Access denied');
        
        const predConfig = service.updatePredictiveConfig(body.config);
        logger.info(`Predictive config updated by ${user.username}`);
        return json({ config: predConfig });
      
      case 'update-cost-config':
        const costCheck = rbac.checkAccess(user as any, Resource.AUTO_SCALING, Action.UPDATE);
        if (!costCheck.allowed) throw error(403, 'Access denied');
        
        const costConfig = service.updateCostConfig(body.config);
        logger.info(`Cost config updated by ${user.username}`);
        return json({ config: costConfig });
      
      default:
        throw error(400, 'Invalid action');
    }

  } catch (err: any) {
    if (err.status) throw err;
    logger.error('Failed to process auto-scaling request:', err);
    throw error(500, err.message);
  }
};
