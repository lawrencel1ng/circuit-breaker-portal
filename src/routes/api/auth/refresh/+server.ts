/**
 * Authentication API - Token Refresh
 * Refreshes access token using refresh token
 */

import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { prisma } from '$lib/server/db';
import { getSessionManager } from '$lib/server/auth/session';
import { logger } from '$lib/server/logger';
import { getCookieOptions } from '$lib/server/auth/cookie-config';

// POST /api/auth/refresh - Refresh access token
export const POST: RequestHandler = async ({ request, cookies }) => {
  try {
    const refreshToken = cookies.get('refresh_token');
    const sessionId = cookies.get('session_id');

    if (!refreshToken || !sessionId) {
      throw error(401, 'Refresh token required');
    }

    const sessionManager = getSessionManager();
    const refreshedSession = await sessionManager.refreshSession(sessionId, refreshToken);

    if (!refreshedSession) {
      // Clear invalid cookies
      cookies.delete('access_token', { path: '/' });
      cookies.delete('refresh_token', { path: '/' });
      cookies.delete('session_id', { path: '/' });
      
      throw error(401, 'Invalid or expired session');
    }

    // Update session in database
    await prisma.session.updateMany({
      where: { id: sessionId },
      data: {
        token: refreshedSession.accessToken,
        refreshToken: refreshedSession.refreshToken
      }
    });

    // Update cookies using centralized config
    cookies.set('access_token', refreshedSession.accessToken, getCookieOptions('access'));
    cookies.set('refresh_token', refreshedSession.refreshToken, getCookieOptions('refresh'));

    return json({
      success: true,
      message: 'Token refreshed'
    });

  } catch (err: any) {
    if (err.status) throw err;
    logger.error('Token refresh error:', err);
    throw error(500, 'Internal server error');
  }
};
