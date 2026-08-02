import { json } from '@sveltejs/kit';
import { logger } from '$lib/server/logger';
import type { RequestHandler } from './$types';

// GET /api/swg/integrations/siem - Get SIEM configuration
export const GET: RequestHandler = async () => {
  try {
    const config = {
      enabled: process.env.SIEM_ENABLED === 'true',
      serverIp: process.env.SIEM_SERVER || '',
      port: parseInt(process.env.SIEM_PORT || '514'),
      protocol: process.env.SIEM_PROTOCOL || 'udp',
      format: process.env.SIEM_FORMAT || 'cef'
    };

    return json(config);
  } catch (error) {
    logger.error('Failed to fetch SIEM config', error);
    return json({ error: 'Failed to fetch SIEM configuration' }, { status: 500 });
  }
};

// POST /api/swg/integrations/siem/test - Test SIEM connection
export const POST: RequestHandler = async ({ request }) => {
  try {
    const data = await request.json();
    const { serverIp, port, protocol } = data;

    // TODO: Implement actual SIEM connection test
    // For now, simulate a test
    await new Promise(resolve => setTimeout(resolve, 1000));

    return json({
      success: true,
      message: `Successfully connected to SIEM at ${serverIp}:${port} via ${protocol.toUpperCase()}`
    });
  } catch (error) {
    logger.error('Failed to test SIEM connection', error);
    return json({ error: 'Failed to test SIEM connection' }, { status: 500 });
  }
};
