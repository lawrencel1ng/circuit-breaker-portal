import { json } from '@sveltejs/kit';
import { prisma } from '$lib/server/db';
import { logger } from '$lib/server/logger';
import type { RequestHandler } from './$types';

export const POST: RequestHandler = async ({ request }) => {
  const data = await request.json();

  try {
    const newLog = await prisma.log.create({
      data: {
        type: data.type || 'automation',
        action: data.action,
        status: data.status,
        user: data.user,
        lane: data.lane,
        details: typeof data.details === 'object' ? JSON.stringify(data.details) : data.details,
        message: data.message || (typeof data.details === 'string' ? data.details : JSON.stringify(data.details)),
        timestamp: new Date()
      }
    });

    return json({
      ...newLog,
      details: newLog.details // Return as is
    });
  } catch (error) {
    logger.error('Failed to create log', error);
    return json({ error: 'Failed to create log' }, { status: 500 });
  }
};

export const GET: RequestHandler = async ({ url }) => {
  const type = url.searchParams.get('type') || 'automation';
  
  const logs = await prisma.log.findMany({
    where: { type },
    orderBy: { timestamp: 'desc' },
    take: 100
  });

  return json(logs.map(l => ({
    ...l,
    details: l.message || JSON.stringify(l.details)
  })));
};
