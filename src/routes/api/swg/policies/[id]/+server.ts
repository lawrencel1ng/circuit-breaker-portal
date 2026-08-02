import { json } from '@sveltejs/kit';
import { prisma } from '$lib/server/db';
import { logger } from '$lib/server/logger';
import type { RequestHandler } from './$types';

// GET /api/swg/policies/[id] - Get specific policy
export const GET: RequestHandler = async ({ params }) => {
  try {
    const policy = await prisma.sWGPolicy.findUnique({
      where: { id: params.id },
      include: {
        rules: {
          orderBy: { priority: 'asc' }
        }
      }
    });

    if (!policy) {
      return json({ error: 'Policy not found' }, { status: 404 });
    }

    return json({
      policy: {
        id: policy.id,
        name: policy.name,
        description: policy.description,
        layer: policy.layer,
        enabled: policy.enabled,
        rules: policy.rules.map(r => ({
          id: r.id,
          name: r.name,
          enabled: r.enabled,
          priority: r.priority,
          condition: {
            type: r.conditionType,
            operator: r.conditionOperator,
            value: r.conditionValue
          },
          action: r.action,
          logEnabled: r.logEnabled
        }))
      }
    });
  } catch (error) {
    logger.error('Failed to fetch policy', error);
    return json({ error: 'Failed to fetch policy' }, { status: 500 });
  }
};

// PUT /api/swg/policies/[id] - Update policy
export const PUT: RequestHandler = async ({ params, request }) => {
  try {
    const data = await request.json();
    const { name, description, layer, enabled } = data;

    const policy = await prisma.sWGPolicy.update({
      where: { id: params.id },
      data: {
        name,
        description,
        layer,
        enabled
      },
      include: {
        rules: true
      }
    });

    return json({ success: true, policy });
  } catch (error) {
    logger.error('Failed to update policy', error);
    return json({ error: 'Failed to update policy' }, { status: 500 });
  }
};

// DELETE /api/swg/policies/[id] - Delete policy
export const DELETE: RequestHandler = async ({ params }) => {
  try {
    await prisma.sWGPolicy.delete({
      where: { id: params.id }
    });

    return json({ success: true });
  } catch (error) {
    logger.error('Failed to delete policy', error);
    return json({ error: 'Failed to delete policy' }, { status: 500 });
  }
};
