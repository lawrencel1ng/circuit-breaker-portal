/**
 * F5 Integration API Endpoints
 * Provides REST API for F5 SWG, SSLO, APM, and AS3 integrations
 */

import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import {
  getSWGService,
  getSSLOService,
  getAPMService,
  getAS3Service,
  getF5Client,
  F5_CONFIG
} from '$lib/server/f5';

// GET /api/f5/status - Get F5 connectivity status
export const GET: RequestHandler = async () => {
  try {
    const [f5Status, swgStatus, ssloStatus, apmStatus, as3Status] = await Promise.all([
      getF5Client().testConnectivity().catch(() => ({ success: false, message: 'Not configured' })),
      getSWGService().testConnectivity().catch(() => ({ success: false, message: 'Not configured' })),
      getSSLOService().testConnectivity().catch(() => ({ success: false, message: 'Not configured' })),
      getAPMService().testConnectivity().catch(() => ({ success: false, message: 'Not configured' })),
      getAS3Service().testConnectivity().catch(() => ({ success: false, message: 'Not configured' }))
    ]);

    return json({
      configured: !!F5_CONFIG.HOST,
      host: F5_CONFIG.HOST,
      services: {
        f5: f5Status,
        swg: swgStatus,
        sslo: ssloStatus,
        apm: apmStatus,
        as3: as3Status
      }
    });
  } catch (error: any) {
    return json({
      configured: false,
      error: error.message
    }, { status: 500 });
  }
};

// POST /api/f5/deploy - Deploy configuration to F5
export const POST: RequestHandler = async ({ request }) => {
  try {
    const data = await request.json();
    const { type, config, dryRun = false } = data;

    if (!type) {
      return json({ error: 'Deployment type is required (swg, sslo, as3)' }, { status: 400 });
    }

    let result;

    switch (type) {
      case 'swg':
        if (dryRun) {
          const declaration = getAS3Service().buildSWGDeclaration(config);
          result = await getAS3Service().validate(declaration);
        } else {
          result = await getAS3Service().deploySWG(config);
        }
        break;

      case 'sslo':
        if (dryRun) {
          const declaration = getAS3Service().buildSSLODeclaration(config);
          result = await getAS3Service().validate(declaration);
        } else {
          result = await getAS3Service().deploySSLO(config);
        }
        break;

      case 'as3':
        if (dryRun) {
          result = await getAS3Service().validate(config);
        } else {
          result = await getAS3Service().deploy(config);
        }
        break;

      default:
        return json({ error: `Unknown deployment type: ${type}` }, { status: 400 });
    }

    return json(result);
  } catch (error: any) {
    return json({ error: error.message }, { status: 500 });
  }
};
