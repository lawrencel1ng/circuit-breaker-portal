import { json } from '@sveltejs/kit';
import { prisma } from '$lib/server/db';
import { logger } from '$lib/server/logger';
import type { RequestHandler } from './$types';

// GET /api/swg/logs - Get access logs
export const GET: RequestHandler = async ({ url }) => {
  try {
    const action = url.searchParams.get('action');
    const user = url.searchParams.get('user');
    const clientIp = url.searchParams.get('clientIp');
    const limit = parseInt(url.searchParams.get('limit') || '100');
    const offset = parseInt(url.searchParams.get('offset') || '0');

    const where: any = {};
    if (action) where.action = action;
    if (user) where.user = { contains: user, mode: 'insensitive' };
    if (clientIp) where.clientIp = { contains: clientIp };

    const [logs, total] = await Promise.all([
      prisma.sWGAccessLog.findMany({
        where,
        orderBy: { timestamp: 'desc' },
        take: limit,
        skip: offset
      }),
      prisma.sWGAccessLog.count({ where })
    ]);

    return json({
      logs: logs.map(l => ({
        id: l.id,
        timestamp: l.timestamp.toISOString(),
        clientIp: l.clientIp,
        user: l.user,
        method: l.method,
        url: l.url,
        action: l.action,
        rule: l.rule,
        category: l.category,
        bytesIn: l.bytesIn,
        bytesOut: l.bytesOut,
        duration: l.duration
      })),
      total,
      limit,
      offset
    });
  } catch (error) {
    logger.error('Failed to fetch access logs', error);
    return json({ error: 'Failed to fetch access logs' }, { status: 500 });
  }
};

// POST /api/swg/logs - Create access log entry
export const POST: RequestHandler = async ({ request }) => {
  try {
    const data = await request.json();
    const {
      clientIp,
      user,
      method,
      url,
      action,
      rule,
      category,
      bytesIn = 0,
      bytesOut = 0,
      duration = 0
    } = data;

    const log = await prisma.sWGAccessLog.create({
      data: {
        clientIp: clientIp || '0.0.0.0',
        user,
        method: method || 'GET',
        url: url || '/',
        action: action || 'allow',
        rule,
        category,
        bytesIn,
        bytesOut,
        duration
      }
    });

    return json({ success: true, log });
  } catch (error) {
    logger.error('Failed to create access log', error);
    return json({ error: 'Failed to create access log' }, { status: 500 });
  }
};
