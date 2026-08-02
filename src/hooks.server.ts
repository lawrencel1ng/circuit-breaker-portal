/**
 * SvelteKit Server Hooks
 * Handles authentication, authorization, and security for all requests
 */

import type { Handle, HandleServerError } from '@sveltejs/kit';
import { getSessionManager } from '$lib/server/auth/session';
import { getRBACEngine, Resource, Action, type User } from '$lib/server/auth/rbac';
import { getAuthAuditLogger } from '$lib/server/auth/audit';
import { logger } from '$lib/server/logger';
import { getCookieOptions } from '$lib/server/auth/cookie-config';
import { validateEnv } from '$lib/server/config/env-validation';

// Validate environment variables on startup (once)
let envValidated = false;
if (!envValidated) {
  const result = validateEnv();
  if (!result.valid) {
    console.error('Environment validation failed:');
    result.errors.forEach(err => console.error(`  - ${err}`));
    if (process.env.NODE_ENV === 'production') {
      process.exit(1);
    }
  }
  envValidated = true;
}

// Public paths that don't require authentication
const PUBLIC_PATHS = [
  '/login',
  '/auth/login',
  '/auth/callback',
  '/auth/logout',
  '/api/auth/login',
  '/api/auth/refresh',
  '/api/health',  // Health check endpoint
  '/health',
  '/_app',  // Static assets
  '/favicon'
];

// API paths with special handling
const API_PUBLIC_PATHS = [
  '/api/auth/login',
  '/api/auth/refresh',
  '/api/auth/logout'
];

export const handle: Handle = async ({ event, resolve }) => {
  const startTime = Date.now();
  const { request, url, locals, cookies } = event;
  const path = url.pathname;

  // Check if path is public
  const isPublicPath = PUBLIC_PATHS.some(publicPath => 
    path === publicPath || path.startsWith(publicPath + '/')
  );

  const isApiPublicPath = API_PUBLIC_PATHS.some(publicPath => 
    path === publicPath
  );

  // Extract client info
  const ipAddress = getClientIp(request);
  const userAgent = request.headers.get('user-agent') || 'unknown';

  // Initialize locals
  locals.user = null;
  locals.session = null;
  locals.ipAddress = ipAddress;

  // Try to authenticate if not a public path
  if (!isPublicPath && !isApiPublicPath) {
    try {
      const authResult = await authenticateRequest(event);
      
      if (!authResult.success || !authResult.user) {
        // For API requests, return 401
        if (path.startsWith('/api/')) {
          return new Response(JSON.stringify({ 
            error: 'Unauthorized',
            message: authResult.error 
          }), {
            status: 401,
            headers: { 'Content-Type': 'application/json' }
          });
        }
        
        // For page requests, redirect to login
        return new Response(null, {
          status: 302,
          headers: { Location: '/login?redirect=' + encodeURIComponent(path) }
        });
      }

      locals.user = authResult.user;
      locals.session = authResult.session;
    } catch (authError: any) {
      // Handle auth system errors gracefully
      logger.error('Authentication system error:', authError.message);
      
      if (path.startsWith('/api/')) {
        return new Response(JSON.stringify({ 
          error: 'Authentication system error',
          message: process.env.NODE_ENV === 'development' ? authError.message : 'Internal server error'
        }), {
          status: 500,
          headers: { 'Content-Type': 'application/json' }
        });
      }
      
      // For page requests, redirect to login with error
      return new Response(null, {
        status: 302,
        headers: { Location: '/login?error=auth_system_error' }
      });
    }
  }

  // Check authorization for API routes
  if (path.startsWith('/api/') && locals.user) {
    const authzResult = await authorizeApiRequest(event, locals.user);
    
    if (!authzResult.allowed) {
      // Log permission denied
      const auditLogger = getAuthAuditLogger();
      auditLogger.logPermissionDenied(
        locals.user.id,
        locals.user.username,
        ipAddress,
        userAgent,
        authzResult.resource || 'unknown',
        authzResult.action || 'unknown',
        locals.session?.id
      );

      return new Response(JSON.stringify({
        error: 'Forbidden',
        message: authzResult.reason || 'Access denied'
      }), {
        status: 403,
        headers: { 'Content-Type': 'application/json' }
      });
    }
  }

  // Add security headers
  const response = await resolve(event);
  
  // Add security headers
  response.headers.set('X-Frame-Options', 'DENY');
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  response.headers.set('Permissions-Policy', 'geolocation=(), microphone=(), camera=()');
  
  // CSP header (customize as needed)
  response.headers.set(
    'Content-Security-Policy',
    "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; font-src 'self'; connect-src 'self' /api;"
  );

  // Log request
  const duration = Date.now() - startTime;
  logger.debug(`${request.method} ${path} - ${response.status} - ${duration}ms - ${locals.user?.username || 'anonymous'}`);

  return response;
};

/**
 * Authenticate the request
 */
async function authenticateRequest(event: any): Promise<{ 
  success: boolean; 
  user?: User; 
  session?: any;
  error?: string;
}> {
  const { request, cookies } = event;
  
  const sessionManager = getSessionManager();
  
  // Try to get token from Authorization header
  const authHeader = request.headers.get('authorization');
  let token = sessionManager.parseAuthHeader(authHeader);
  
  // If no token in header, try cookie
  if (!token) {
    token = cookies.get('access_token') || null;
  }

  if (!token) {
    return { success: false, error: 'No authentication token provided' };
  }

  // Validate token
  const session = await sessionManager.validateAccessToken(token);
  
  if (!session) {
    // Try to refresh using refresh token
    const refreshToken = cookies.get('refresh_token');
    const sessionId = cookies.get('session_id');
    
    if (refreshToken && sessionId) {
      const refreshedSession = await sessionManager.refreshSession(sessionId, refreshToken);
      
      if (refreshedSession) {
        // Update cookies with new tokens using centralized config
        event.cookies.set('access_token', refreshedSession.accessToken, getCookieOptions('access'));
        event.cookies.set('refresh_token', refreshedSession.refreshToken, getCookieOptions('refresh'));

        // Create user object from session
        const user: User = {
          id: refreshedSession.userId,
          username: refreshedSession.username,
          email: refreshedSession.email,
          roles: refreshedSession.roles,
          createdAt: new Date(),
          updatedAt: new Date(),
          isActive: true
        };

        return { success: true, user, session: refreshedSession };
      }
    }
    
    return { success: false, error: 'Invalid or expired session' };
  }

  // Create user object from session
  const user = {
    id: session.userId,
    username: session.username,
    email: session.email,
    roles: session.roles,
    createdAt: new Date(),
    updatedAt: new Date(),
    isActive: true
  } satisfies User;

  return { success: true, user, session };
}

/**
 * Authorize API request based on path and method
 */
async function authorizeApiRequest(event: any, user: App.Locals['user']): Promise<{
  allowed: boolean;
  reason?: string;
  resource?: string;
  action?: string;
}> {
  const { request, url } = event;
  const path = url.pathname;
  const method = request.method;

  const rbac = getRBACEngine();

  // Map API paths to resources and actions
  const mapping = mapApiToResource(path, method);
  
  if (!mapping) {
    // Unknown API path, allow for now (should be restricted in production)
    return { allowed: true };
  }

  const result = rbac.checkAccess(user as any, mapping.resource, mapping.action, mapping.conditions);
  
  if (!result.allowed) {
    return {
      allowed: false,
      reason: result.reason,
      resource: mapping.resource,
      action: mapping.action
    };
  }

  return { allowed: true };
}

/**
 * Map API path and method to resource and action
 */
function mapApiToResource(path: string, method: string): { 
  resource: Resource; 
  action: any; 
  conditions?: any;
} | null {
  // Lanes
  if (path.match(/\/api\/lanes/)) {
    if (method === 'GET') return { resource: Resource.LANE, action: Action.READ };
    if (method === 'PUT' || method === 'PATCH') return { resource: Resource.LANE, action: Action.UPDATE };
    if (method === 'POST') return { resource: Resource.LANE, action: Action.CREATE };
    if (method === 'DELETE') return { resource: Resource.LANE, action: Action.DELETE };
  }

  // Deployments
  if (path.match(/\/api\/deployments/)) {
    if (method === 'GET') return { resource: Resource.DEPLOYMENT, action: Action.READ };
    if (method === 'POST') return { resource: Resource.DEPLOYMENT, action: Action.CREATE };
    if (method === 'PUT' || method === 'PATCH') return { resource: Resource.DEPLOYMENT, action: Action.UPDATE };
    if (method === 'DELETE') return { resource: Resource.DEPLOYMENT, action: Action.DELETE };
  }

  // Applications
  if (path.match(/\/api\/applications/)) {
    if (method === 'GET') return { resource: Resource.APPLICATION, action: Action.READ };
    if (method === 'POST') return { resource: Resource.APPLICATION, action: Action.CREATE };
    if (method === 'PUT' || method === 'PATCH') return { resource: Resource.APPLICATION, action: Action.UPDATE };
    if (method === 'DELETE') return { resource: Resource.APPLICATION, action: Action.DELETE };
  }

  // SWG Config
  if (path.match(/\/api\/swg\/config/)) {
    if (method === 'GET') return { resource: Resource.SWG_CONFIG, action: Action.READ };
    if (method === 'POST' || method === 'PUT' || method === 'PATCH') {
      return { resource: Resource.SWG_CONFIG, action: Action.UPDATE };
    }
  }

  // SWG Policies
  if (path.match(/\/api\/swg\/policies/)) {
    if (method === 'GET') return { resource: Resource.SWG_POLICY, action: Action.READ };
    if (method === 'POST') return { resource: Resource.SWG_POLICY, action: Action.CREATE };
    if (method === 'PUT' || method === 'PATCH') return { resource: Resource.SWG_POLICY, action: Action.UPDATE };
    if (method === 'DELETE') return { resource: Resource.SWG_POLICY, action: Action.DELETE };
  }

  // SWG URL Filtering
  if (path.match(/\/api\/swg\/url-filtering/)) {
    if (method === 'GET') return { resource: Resource.SWG_URL_FILTER, action: Action.READ };
    if (method === 'POST') return { resource: Resource.SWG_URL_FILTER, action: Action.CREATE };
    if (method === 'PUT' || method === 'PATCH') return { resource: Resource.SWG_URL_FILTER, action: Action.UPDATE };
    if (method === 'DELETE') return { resource: Resource.SWG_URL_FILTER, action: Action.DELETE };
  }

  // Users (admin only)
  if (path.match(/\/api\/users/)) {
    if (method === 'GET') return { resource: Resource.USER, action: Action.READ };
    if (method === 'POST') return { resource: Resource.USER, action: Action.CREATE };
    if (method === 'PUT' || method === 'PATCH') return { resource: Resource.USER, action: Action.UPDATE };
    if (method === 'DELETE') return { resource: Resource.USER, action: Action.DELETE };
  }

  // F5 Device operations
  if (path.match(/\/api\/f5/)) {
    if (method === 'GET') return { resource: Resource.F5_DEVICE, action: Action.READ };
    if (method === 'POST') return { resource: Resource.F5_DEVICE, action: Action.EXECUTE };
  }

  // Logs
  if (path.match(/\/api\/logs/)) {
    return { resource: Resource.LOG, action: Action.READ };
  }

  // Settings
  if (path.match(/\/api\/settings/)) {
    if (method === 'GET') return { resource: Resource.SETTING, action: Action.READ };
    if (method === 'POST' || method === 'PUT' || method === 'PATCH') {
      return { resource: Resource.SETTING, action: Action.UPDATE };
    }
  }

  // Blue/Green
  if (path.match(/\/api\/blue-green/)) {
    if (method === 'GET') return { resource: Resource.BLUE_GREEN, action: Action.READ };
    if (method === 'POST') return { resource: Resource.BLUE_GREEN, action: Action.EXECUTE };
    if (method === 'PUT' || method === 'PATCH') return { resource: Resource.BLUE_GREEN, action: Action.UPDATE };
  }

  // Auto Scaling
  if (path.match(/\/api\/auto-scaling/)) {
    if (method === 'GET') return { resource: Resource.AUTO_SCALING, action: Action.READ };
    if (method === 'POST') return { resource: Resource.AUTO_SCALING, action: Action.CREATE };
    if (method === 'PUT' || method === 'PATCH') return { resource: Resource.AUTO_SCALING, action: Action.UPDATE };
    if (method === 'DELETE') return { resource: Resource.AUTO_SCALING, action: Action.DELETE };
  }

  // Backup
  if (path.match(/\/api\/backup/)) {
    if (method === 'GET') return { resource: Resource.BACKUP, action: Action.READ };
    if (method === 'POST') return { resource: Resource.BACKUP, action: Action.CREATE };
    if (method === 'PUT' || method === 'PATCH') return { resource: Resource.BACKUP, action: Action.UPDATE };
    if (method === 'DELETE') return { resource: Resource.BACKUP, action: Action.DELETE };
  }

  // Multi-Cloud
  if (path.match(/\/api\/cloud/)) {
    if (method === 'GET') return { resource: Resource.CLOUD, action: Action.READ };
    if (method === 'POST') return { resource: Resource.CLOUD, action: Action.CREATE };
    if (method === 'PUT' || method === 'PATCH') return { resource: Resource.CLOUD, action: Action.UPDATE };
    if (method === 'DELETE') return { resource: Resource.CLOUD, action: Action.DELETE };
  }

  // Auto-scaling
  if (path.match(/\/api\/autoscaling/)) {
    if (method === 'GET') return { resource: Resource.AUTO_SCALING, action: Action.READ };
    if (method === 'POST') return { resource: Resource.AUTO_SCALING, action: Action.CREATE };
    if (method === 'PUT' || method === 'PATCH') return { resource: Resource.AUTO_SCALING, action: Action.UPDATE };
    if (method === 'DELETE') return { resource: Resource.AUTO_SCALING, action: Action.DELETE };
  }

  // Drift Detection
  if (path.match(/\/api\/drift/)) {
    if (method === 'GET') return { resource: Resource.SETTING, action: Action.READ };
    if (method === 'POST') return { resource: Resource.SETTING, action: Action.CREATE };
  }

  // WebSocket
  if (path.match(/\/api\/ws/)) {
    return { resource: Resource.SYSTEM, action: Action.READ };
  }

  return null;
}

/**
 * Get client IP address
 */
function getClientIp(request: Request): string {
  // Try X-Forwarded-For header (for proxied requests)
  const forwarded = request.headers.get('x-forwarded-for');
  if (forwarded) {
    return forwarded.split(',')[0].trim();
  }
  
  // Try X-Real-IP
  const realIp = request.headers.get('x-real-ip');
  if (realIp) {
    return realIp;
  }
  
  // Fallback (in production, this would be the connection remoteAddress)
  return 'unknown';
}

/**
 * Global error handler
 */
export const handleError: HandleServerError = ({ error, event }) => {
  const err = error as Error;
  
  logger.error('Unhandled error: ' + err.message, {
    stack: err.stack,
    path: event.url.pathname,
    method: event.request.method
  });

  // Don't expose internal errors to client
  return {
    message: 'An unexpected error occurred',
    code: 'INTERNAL_ERROR'
  };
};
