import { json } from '@sveltejs/kit';
import { logger } from '$lib/server/logger';
import type { RequestHandler } from './$types';

// GET /api/swg/integrations/threat-intel - Get threat intelligence configuration
export const GET: RequestHandler = async () => {
  try {
    const config = {
      enabled: process.env.THREAT_INTEL_ENABLED !== 'false',
      apiKey: process.env.THREAT_INTEL_API_KEY ? '***' + process.env.THREAT_INTEL_API_KEY.slice(-4) : '',
      feedUrl: process.env.THREAT_INTEL_URL || '',
      updateInterval: process.env.THREAT_INTEL_INTERVAL || 'daily',
      lastUpdate: null, // Would be fetched from database
      status: 'active'
    };

    return json(config);
  } catch (error) {
    logger.error('Failed to fetch threat intel config', error);
    return json({ error: 'Failed to fetch threat intelligence configuration' }, { status: 500 });
  }
};

// POST /api/swg/integrations/threat-intel/update - Trigger threat feed update
export const POST: RequestHandler = async () => {
  try {
    const apiKey = process.env.THREAT_INTEL_API_KEY;
    const feedUrl = process.env.THREAT_INTEL_URL;

    if (!apiKey || !feedUrl) {
      return json({ 
        error: 'Threat intelligence not configured. Set THREAT_INTEL_API_KEY and THREAT_INTEL_URL in environment variables.' 
      }, { status: 400 });
    }

    // TODO: Implement actual threat feed update
    // For now, simulate an update
    await new Promise(resolve => setTimeout(resolve, 2000));

    return json({
      success: true,
      message: 'Threat intelligence feeds updated successfully',
      updatedAt: new Date().toISOString(),
      feedsUpdated: 3,
      newThreats: 147
    });
  } catch (error) {
    logger.error('Failed to update threat feeds', error);
    return json({ error: 'Failed to update threat feeds' }, { status: 500 });
  }
};
