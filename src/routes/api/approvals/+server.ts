import { json } from '@sveltejs/kit';
import { prisma } from '$lib/server/db';
import { logger } from '$lib/server/logger';
import type { RequestHandler } from './$types';

export const POST: RequestHandler = async ({ request }) => {
  const data = await request.json();

  try {
    const newRequest = await prisma.approvalRequest.create({
      data: {
        type: data.type,
        title: data.title,
        description: data.description,
        requester: data.requester,
        status: 'pending',
        data: data.data,
        timestamp: new Date()
      }
    });
    
    // Log
    await prisma.log.create({
      data: {
        type: 'audit',
        action: 'approval_request',
        status: 'success',
        user: data.requester,
        details: JSON.stringify(newRequest),
        message: `Created approval request: ${data.title}`
      }
    });

    return json(newRequest);
  } catch (error) {
    logger.error('Approval API Error', error);
    return json({ error: 'Failed to create approval request' }, { status: 500 });
  }
};

export const GET: RequestHandler = async () => {
  const requests = await prisma.approvalRequest.findMany({
    orderBy: { timestamp: 'desc' }
  });
  return json(requests);
};
