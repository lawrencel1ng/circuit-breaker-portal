import { json, error } from '@sveltejs/kit';
import { getAWAFService } from '$lib/server/f5/awaf-service';
import { logger } from '$lib/server/logger';
import type { RequestHandler } from './$types';

/**
 * GET /api/waf/[id] - Get specific WAF policy details
 */
export const GET: RequestHandler = async ({ params, url, locals }) => {
  const user = locals.user;
  if (!user) {
    throw error(401, 'Unauthorized');
  }

  const { id } = params;
  const path = url.searchParams.get('path');

  try {
    const awafService = getAWAFService();

    switch (path) {
      case 'violations': {
        const violations = await awafService.getViolations(id);
        return json(violations);
      }
      
      case 'bot-defense': {
        const config = await awafService.getBotDefenseConfig(id);
        return json(config);
      }
      
      case 'export': {
        const format = (url.searchParams.get('format') as 'json' | 'xml') || 'json';
        const content = await awafService.exportPolicy(id, format);
        return json({ content, format });
      }
      
      default:
        const policy = await awafService.getPolicy(id);
        if (!policy) {
          return json({ error: 'Policy not found' }, { status: 404 });
        }
        return json(policy);
    }
  } catch (err: any) {
    logger.error(`WAF Policy API Error for ${id}`, { error: err.message });
    return json({ error: 'Failed to fetch policy data', details: err.message }, { status: 500 });
  }
};

/**
 * PATCH /api/waf/[id] - Update specific policy
 */
export const PATCH: RequestHandler = async ({ params, request, locals }) => {
  const user = locals.user;
  if (!user) {
    throw error(401, 'Unauthorized');
  }

  const { id } = params;

  try {
    const awafService = getAWAFService();
    const data = await request.json();

    // Update bot defense config
    if (data.botDefense) {
      await awafService.updateBotDefenseConfig(id, data.botDefense);
      logger.info(`User ${user.username} updated bot defense for policy ${id}`);
      return json({ success: true });
    }

    // Update general policy
    const policy = await awafService.updatePolicy(id, data);
    logger.info(`User ${user.username} updated WAF policy ${id}`);
    return json(policy);
  } catch (err: any) {
    logger.error(`WAF Policy Update Error for ${id}`, { error: err.message });
    return json({ error: 'Update failed', details: err.message }, { status: 500 });
  }
};
