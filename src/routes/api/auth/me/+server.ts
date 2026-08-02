/**
 * Authentication API - Current User
 * Returns the currently authenticated user
 */

import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

// GET /api/auth/me - Get current user
export const GET: RequestHandler = async ({ locals }) => {
  try {
    if (!locals.user) {
      throw error(401, 'Not authenticated');
    }

    return json({
      user: locals.user
    });

  } catch (err: any) {
    if (err.status) throw err;
    throw error(500, 'Internal server error');
  }
};
