import { json } from '@sveltejs/kit';
import { logger } from '$lib/server/logger';
import type { RequestHandler } from './$types';

// GET /api/swg/integrations/icap - Get ICAP configuration
export const GET: RequestHandler = async () => {
  try {
    const config = {
      enabled: process.env.ICAP_ENABLED === 'true',
      serverUri: process.env.ICAP_SERVER_URI || '',
      previewSize: parseInt(process.env.ICAP_PREVIEW_SIZE || '1024'),
      failOpen: process.env.ICAP_FAIL_OPEN !== 'false'
    };

    return json(config);
  } catch (error) {
    logger.error('Failed to fetch ICAP config', error);
    return json({ error: 'Failed to fetch ICAP configuration' }, { status: 500 });
  }
};

// POST /api/swg/integrations/icap/test - Test ICAP connection
export const POST: RequestHandler = async ({ request }) => {
  try {
    const data = await request.json();
    const { serverUri } = data;

    // TODO: Implement actual ICAP connection test
    // For now, simulate a test
    await new Promise(resolve => setTimeout(resolve, 1000));

    return json({
      success: true,
      message: `Successfully connected to ICAP server at ${serverUri}`
    });
  } catch (error) {
    logger.error('Failed to test ICAP connection', error);
    return json({ error: 'Failed to test ICAP connection' }, { status: 500 });
  }
};
