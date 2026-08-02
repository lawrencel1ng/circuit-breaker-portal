import { json, error } from '@sveltejs/kit';
import { getAWAFService } from '$lib/server/f5/awaf-service';
import { logger } from '$lib/server/logger';
import type { RequestHandler } from './$types';

/**
 * GET /api/waf/[id]/signatures - Get signatures for a policy
 */
export const GET: RequestHandler = async ({ params, locals }) => {
  const user = locals.user;
  if (!user) {
    throw error(401, 'Unauthorized');
  }

  const { id } = params;

  try {
    const awafService = getAWAFService();
    const signatures = await awafService.getSignatures(id);
    return json(signatures);
  } catch (err: any) {
    logger.error(`Failed to get signatures for policy ${id}`, { error: err.message });
    return json({ error: 'Failed to get signatures', details: err.message }, { status: 500 });
  }
};

/**
 * PATCH /api/waf/[id]/signatures - Update signature settings
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

    await awafService.updateSignatureStatus(
      id,
      data.signatureId,
      data.enabled,
      data.autoLearn
    );

    logger.info(
      `User ${user.username} updated signature ${data.signatureId} in policy ${id}`,
      { enabled: data.enabled, autoLearn: data.autoLearn }
    );

    return json({ success: true });
  } catch (err: any) {
    logger.error(`Failed to update signature for policy ${id}`, { error: err.message });
    return json({ error: 'Update failed', details: err.message }, { status: 500 });
  }
};
