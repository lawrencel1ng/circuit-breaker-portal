import { json, error } from '@sveltejs/kit';
import { getAWAFService } from '$lib/server/f5/awaf-service';
import { logger } from '$lib/server/logger';
import type { RequestHandler } from './$types';

/**
 * GET /api/waf - Get all WAF policies and stats
 */
export const GET: RequestHandler = async ({ url, locals }) => {
  const user = locals.user;
  if (!user) {
    throw error(401, 'Unauthorized');
  }

  try {
    const awafService = getAWAFService();
    const path = url.searchParams.get('path');

    // Route to specific handlers based on path
    switch (path) {
      case 'stats': {
        const timeRange = (url.searchParams.get('timeRange') as '1h' | '24h' | '7d' | '30d') || '24h';
        const stats = await awafService.getSecurityStats(timeRange);
        return json(stats);
      }
      
      case 'events': {
        const policyId = url.searchParams.get('policyId') || undefined;
        const severity = url.searchParams.get('severity') || undefined;
        const limit = parseInt(url.searchParams.get('limit') || '100');
        const events = await awafService.getSecurityEvents({ policyId, severity, limit });
        return json(events);
      }
      
      case 'signatures': {
        const policyId = url.searchParams.get('policyId') || undefined;
        const signatures = await awafService.getSignatures(policyId);
        return json(signatures);
      }
      
      case 'geo-blocking': {
        const rules = await awafService.getGeoBlockingRules();
        return json(rules);
      }
      
      default:
        // Return all policies
        const policies = await awafService.getPolicies();
        return json(policies);
    }
  } catch (err: any) {
    logger.error('WAF API Error', { error: err.message, path: url.searchParams.get('path') });
    return json({ error: 'Failed to fetch WAF data', details: err.message }, { status: 500 });
  }
};

/**
 * POST /api/waf - Create new WAF policy or perform actions
 */
export const POST: RequestHandler = async ({ request, locals }) => {
  const user = locals.user;
  if (!user) {
    throw error(401, 'Unauthorized');
  }

  try {
    const awafService = getAWAFService();
    const data = await request.json();
    const action = data.action;

    switch (action) {
      case 'createPolicy': {
        const policy = await awafService.createPolicy(data.policy);
        logger.info(`User ${user.username} created WAF policy: ${policy.name}`);
        return json(policy, { status: 201 });
      }
      
      case 'blockIP': {
        await awafService.blockIP(data.ip, data.reason, data.duration);
        logger.info(`User ${user.username} blocked IP: ${data.ip}`);
        return json({ success: true, message: `IP ${data.ip} blocked` });
      }
      
      case 'unblockIP': {
        await awafService.unblockIP(data.ip);
        logger.info(`User ${user.username} unblocked IP: ${data.ip}`);
        return json({ success: true, message: `IP ${data.ip} unblocked` });
      }
      
      case 'attachToVirtualServer': {
        await awafService.attachToVirtualServer(data.policyId, data.virtualServer);
        logger.info(`User ${user.username} attached policy ${data.policyId} to ${data.virtualServer}`);
        return json({ success: true });
      }
      
      case 'detachFromVirtualServer': {
        await awafService.detachFromVirtualServer(data.policyId, data.virtualServer);
        logger.info(`User ${user.username} detached policy ${data.policyId} from ${data.virtualServer}`);
        return json({ success: true });
      }
      
      case 'importPolicy': {
        const policy = await awafService.importPolicy(data.content, data.name);
        logger.info(`User ${user.username} imported WAF policy: ${policy.name}`);
        return json(policy, { status: 201 });
      }
      
      default:
        return json({ error: 'Unknown action' }, { status: 400 });
    }
  } catch (err: any) {
    logger.error('WAF API POST Error', { error: err.message });
    return json({ error: 'Operation failed', details: err.message }, { status: 500 });
  }
};

/**
 * PATCH /api/waf - Update WAF policy or settings
 */
export const PATCH: RequestHandler = async ({ request, locals }) => {
  const user = locals.user;
  if (!user) {
    throw error(401, 'Unauthorized');
  }

  try {
    const awafService = getAWAFService();
    const data = await request.json();

    if (data.policyId && data.updates) {
      // Update policy
      const policy = await awafService.updatePolicy(data.policyId, data.updates);
      logger.info(`User ${user.username} updated WAF policy: ${data.policyId}`);
      return json(policy);
    }
    
    if (data.policyId && data.violationName) {
      // Update violation
      await awafService.updateViolation(
        data.policyId, 
        data.violationName, 
        data.settings
      );
      logger.info(`User ${user.username} updated violation ${data.violationName}`);
      return json({ success: true });
    }
    
    if (data.geoBlockingRule) {
      // Update geo-blocking
      await awafService.updateGeoBlockingRule(data.geoBlockingRule);
      logger.info(`User ${user.username} updated geo-blocking rule`);
      return json({ success: true });
    }

    return json({ error: 'Invalid update request' }, { status: 400 });
  } catch (err: any) {
    logger.error('WAF API PATCH Error', { error: err.message });
    return json({ error: 'Update failed', details: err.message }, { status: 500 });
  }
};

/**
 * DELETE /api/waf - Delete WAF policy
 */
export const DELETE: RequestHandler = async ({ url, locals }) => {
  const user = locals.user;
  if (!user) {
    throw error(401, 'Unauthorized');
  }

  const policyId = url.searchParams.get('policyId');
  if (!policyId) {
    return json({ error: 'Policy ID required' }, { status: 400 });
  }

  try {
    const awafService = getAWAFService();
    await awafService.deletePolicy(policyId);
    logger.info(`User ${user.username} deleted WAF policy: ${policyId}`);
    return json({ success: true });
  } catch (err: any) {
    logger.error('WAF API DELETE Error', { error: err.message, policyId });
    return json({ error: 'Delete failed', details: err.message }, { status: 500 });
  }
};
