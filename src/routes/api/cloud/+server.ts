/**
 * Multi-Cloud Traffic Management API
 * REST API for cloud provider management and routing
 */

import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { getMultiCloudService } from '$lib/server/cloud/service';
import { getRBACEngine, Resource, Action } from '$lib/server/auth/rbac';
import { logger } from '$lib/server/logger';

// GET /api/cloud - Get cloud providers, regions, and routing configuration
export const GET: RequestHandler = async ({ url, locals }) => {
  try {
    const user = locals.user;
    if (!user) {
      throw error(401, 'Unauthorized');
    }

    // Check permission
    const rbac = getRBACEngine();
    const check = rbac.checkAccess(user as any, Resource.CLOUD, Action.READ);
    if (!check.allowed) {
      throw error(403, 'Access denied');
    }

    const service = getMultiCloudService();
    const type = url.searchParams.get('type');

    switch (type) {
      case 'providers':
        return json({ providers: service.getAllProviders() });
      
      case 'regions':
        return json({ regions: service.getAllRegions() });
      
      case 'rules':
        return json({ rules: service.getAllRules() });
      
      case 'policy':
        return json({ policy: service.getActivePolicy() });
      
      case 'distribution':
        return json({ distribution: service.getTrafficDistribution() });
      
      case 'metrics':
        const limit = parseInt(url.searchParams.get('limit') || '100');
        return json({ metrics: service.getMetrics({
          start: new Date(Date.now() - 24 * 60 * 60 * 1000), // Last 24 hours
          end: new Date()
        }).slice(-limit) });
      
      case 'health':
        return json({ healthChecks: service.getHealthChecks() });
      
      case 'failover':
        return json({ config: service.getFailoverConfig() });
      
      case 'events':
        const eventLimit = parseInt(url.searchParams.get('limit') || '50');
        return json({ events: service.getScalingEvents(eventLimit) });
      
      case 'stats':
        return json({ stats: service.getGlobalStats() });
      
      default:
        // Return overview
        return json({
          providers: service.getAllProviders(),
          regions: service.getAllRegions(),
          rules: service.getAllRules(),
          stats: service.getGlobalStats(),
          policy: service.getActivePolicy()
        });
    }

  } catch (err: any) {
    logger.error('Failed to get cloud data:', err);
    throw error(500, err.message);
  }
};

// POST /api/cloud - Create or update cloud configuration
export const POST: RequestHandler = async ({ request, locals }) => {
  try {
    const user = locals.user;
    if (!user) {
      throw error(401, 'Unauthorized');
    }

    const body = await request.json();
    const { action, type } = body;

    const service = getMultiCloudService();
    const rbac = getRBACEngine();

    switch (action) {
      case 'update-region':
        const regionCheck = rbac.checkAccess(user as any, Resource.CLOUD, Action.UPDATE);
        if (!regionCheck.allowed) throw error(403, 'Access denied');
        
        if (!body.regionId || !body.updates) {
          throw error(400, 'Missing regionId or updates');
        }
        
        const updatedRegion = service.updateRegion(body.regionId, body.updates);
        logger.info(`Region ${body.regionId} updated by ${user.username}`);
        return json({ region: updatedRegion });
      
      case 'create-rule':
        const createCheck = rbac.checkAccess(user as any, Resource.CLOUD, Action.CREATE);
        if (!createCheck.allowed) throw error(403, 'Access denied');
        
        if (!body.rule) {
          throw error(400, 'Missing rule data');
        }
        
        const newRule = service.createRule(body.rule);
        logger.info(`Routing rule created by ${user.username}`);
        return json({ rule: newRule }, { status: 201 });
      
      case 'update-rule':
        const updateCheck = rbac.checkAccess(user as any, Resource.CLOUD, Action.UPDATE);
        if (!updateCheck.allowed) throw error(403, 'Access denied');
        
        if (!body.ruleId || !body.updates) {
          throw error(400, 'Missing ruleId or updates');
        }
        
        const updatedRule = service.updateRule(body.ruleId, body.updates);
        logger.info(`Routing rule ${body.ruleId} updated by ${user.username}`);
        return json({ rule: updatedRule });
      
      case 'delete-rule':
        const deleteCheck = rbac.checkAccess(user as any, Resource.CLOUD, Action.DELETE);
        if (!deleteCheck.allowed) throw error(403, 'Access denied');
        
        if (!body.ruleId) {
          throw error(400, 'Missing ruleId');
        }
        
        service.deleteRule(body.ruleId);
        logger.info(`Routing rule ${body.ruleId} deleted by ${user.username}`);
        return json({ success: true });
      
      case 'update-distribution':
        const distCheck = rbac.checkAccess(user as any, Resource.CLOUD, Action.UPDATE);
        if (!distCheck.allowed) throw error(403, 'Access denied');
        
        if (!body.distribution) {
          throw error(400, 'Missing distribution data');
        }
        
        service.updateTrafficDistribution(body.distribution);
        logger.info(`Traffic distribution updated by ${user.username}`);
        return json({ success: true });
      
      case 'update-failover':
        const failoverCheck = rbac.checkAccess(user as any, Resource.CLOUD, Action.UPDATE);
        if (!failoverCheck.allowed) throw error(403, 'Access denied');
        
        if (!body.config) {
          throw error(400, 'Missing failover config');
        }
        
        const updatedConfig = service.updateFailoverConfig(body.config);
        logger.info(`Failover config updated by ${user.username}`);
        return json({ config: updatedConfig });
      
      case 'trigger-failover':
        const execCheck = rbac.checkAccess(user as any, Resource.CLOUD, Action.EXECUTE);
        if (!execCheck.allowed) throw error(403, 'Access denied');
        
        if (!body.regionId) {
          throw error(400, 'Missing regionId');
        }
        
        // Trigger manual failover
        const region = service.getRegion(body.regionId);
        if (!region) {
          throw error(404, 'Region not found');
        }
        
        service.updateRegion(body.regionId, { status: 'down' });
        logger.info(`Manual failover triggered for ${body.regionId} by ${user.username}`);
        return json({ success: true, message: 'Failover triggered' });
      
      default:
        throw error(400, 'Invalid action');
    }

  } catch (err: any) {
    if (err.status) throw err;
    logger.error('Failed to process cloud request:', err);
    throw error(500, err.message);
  }
};
