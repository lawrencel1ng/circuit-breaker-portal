/**
 * Authentication API - Logout
 * Handles user logout and session invalidation
 */

import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { prisma } from '$lib/server/db';
import { getSessionManager } from '$lib/server/auth/session';
import { getAuthAuditLogger } from '$lib/server/auth/audit';
import { logger } from '$lib/server/logger';

// POST /api/auth/logout - Logout user
export const POST: RequestHandler = async ({ request, cookies, locals, getClientAddress }) => {
  try {
    const sessionId = cookies.get('session_id');
    const accessToken = cookies.get('access_token');
    const ipAddress = getClientAddress();
    const userAgent = request.headers.get('user-agent') || 'unknown';

    // Invalidate session in database
    if (sessionId) {
      await prisma.session.updateMany({
        where: { id: sessionId },
        data: { isValid: false }
      });
    }

    // Also invalidate in memory
    const sessionManager = getSessionManager();
    if (sessionId) {
      await sessionManager.invalidateSession(sessionId, 'logout');
    }

    // Clear cookies
    cookies.delete('access_token', { path: '/' });
    cookies.delete('refresh_token', { path: '/' });
    cookies.delete('session_id', { path: '/' });

    // Log logout
    if (locals.user) {
      const audit = getAuthAuditLogger();
      audit.logLogout(
        locals.user.id,
        locals.user.username,
        sessionId || 'unknown',
        ipAddress,
        userAgent
      );
      
      logger.info(`User ${locals.user.username} logged out`);
    }

    return json({ success: true, message: 'Logged out successfully' });

  } catch (err: any) {
    if (err.status) throw err;
    logger.error('Logout error:', err);
    throw error(500, 'Internal server error');
  }
};
