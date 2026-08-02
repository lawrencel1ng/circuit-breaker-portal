import { json } from '@sveltejs/kit';
import { prisma } from '$lib/server/db';
import { logger } from '$lib/server/logger';
import type { RequestHandler } from './$types';

// GET /api/swg/sessions - Get active sessions
export const GET: RequestHandler = async ({ url }) => {
  try {
    const status = url.searchParams.get('status') || 'active';
    const limit = parseInt(url.searchParams.get('limit') || '100');

    const sessions = await prisma.sWGSession.findMany({
      where: { status },
      orderBy: { lastSeen: 'desc' },
      take: limit
    });

    return json({
      sessions: sessions.map(s => ({
        id: s.id,
        sessionId: s.sessionId,
        user: s.user,
        clientIp: s.clientIp,
        vsName: s.vsName,
        startTime: s.startTime.toISOString(),
        duration: Math.floor((Date.now() - s.startTime.getTime()) / 1000), // seconds
        traffic: formatBytes(s.traffic),
        status: s.status
      }))
    });
  } catch (error) {
    logger.error('Failed to fetch sessions', error);
    return json({ error: 'Failed to fetch sessions' }, { status: 500 });
  }
};

// POST /api/swg/sessions - Create new session (for testing)
export const POST: RequestHandler = async ({ request }) => {
  try {
    const data = await request.json();
    const { sessionId, user, clientIp, vsName } = data;

    const session = await prisma.sWGSession.create({
      data: {
        sessionId: sessionId || `sess_${Date.now()}`,
        user: user || 'anonymous',
        clientIp: clientIp || '0.0.0.0',
        vsName: vsName || 'vs_swg_explicit',
        status: 'active'
      }
    });

    return json({ success: true, session });
  } catch (error) {
    logger.error('Failed to create session', error);
    return json({ error: 'Failed to create session' }, { status: 500 });
  }
};

// DELETE /api/swg/sessions - Close session by query param
export const DELETE: RequestHandler = async ({ url }) => {
  try {
    const id = url.searchParams.get('id');
    if (!id) {
      return json({ error: 'Session ID is required' }, { status: 400 });
    }
    
    await prisma.sWGSession.update({
      where: { id },
      data: { status: 'closed' }
    });

    return json({ success: true });
  } catch (error) {
    logger.error('Failed to close session', error);
    return json({ error: 'Failed to close session' }, { status: 500 });
  }
};

function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
}
