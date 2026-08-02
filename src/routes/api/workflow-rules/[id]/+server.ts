import { json } from '@sveltejs/kit';
import { prisma } from '$lib/server/db';
import { logger } from '$lib/server/logger';
import type { RequestHandler } from './$types';

export const PUT: RequestHandler = async ({ params, request }) => {
  const { id } = params;
  const data = await request.json();

  try {
    const updatedRule = await prisma.workflowRule.update({
      where: { id },
      data: {
        requiresApproval: data.requiresApproval,
        approverRole: data.approverRole
      }
    });

    // Audit Log
    await prisma.log.create({
      data: {
        type: 'audit',
        action: 'UPDATE_WORKFLOW',
        status: 'success',
        user: 'admin', // Mock user
        details: JSON.stringify(updatedRule),
        message: `Updated workflow rule: ${updatedRule.name}`
      }
    });

    return json(updatedRule);
  } catch (error) {
    logger.error('Failed to update workflow rule', error);
    return json({ error: 'Failed to update workflow rule' }, { status: 500 });
  }
};
