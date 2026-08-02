/**
 * WebSocket Connection Endpoint
 * Handles WebSocket upgrade requests
 */

import { error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { getWebSocketManager } from '$lib/server/websocket/server';
import { getRBACEngine, Resource, Action } from '$lib/server/auth/rbac';

// This endpoint handles the WebSocket upgrade
export const GET: RequestHandler = async ({ request, locals }) => {
  // Check authentication
  const user = locals.user;
  if (!user) {
    throw error(401, 'Unauthorized');
  }

  // Check permission
  const rbac = getRBACEngine();
  const check = rbac.checkAccess(user as any, Resource.SYSTEM, Action.READ);
  if (!check.allowed) {
    throw error(403, 'Access denied');
  }

  // The actual WebSocket upgrade is handled by the WebSocketManager
  // This endpoint just validates permissions before the upgrade
  
  return new Response(null, {
    status: 426, // Upgrade Required
    headers: {
      'Upgrade': 'websocket',
      'Connection': 'Upgrade'
    }
  });
};
