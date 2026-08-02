/**
 * Cookie Configuration
 * Centralized cookie settings for consistency across the application
 */

// Cookie security settings
export const COOKIE_CONFIG = {
  // Use secure cookies in production by default
  // Can be overridden by COOKIE_SECURE environment variable
  secure: process.env.COOKIE_SECURE === 'true' || process.env.NODE_ENV === 'production',
  
  // Always use httpOnly for sensitive cookies
  httpOnly: true,
  
  // Strict same-site to prevent CSRF
  sameSite: 'strict' as const,
  
  // Default paths
  path: '/',
  
  // Max ages for different cookie types (in seconds)
  maxAge: {
    accessToken: 60 * 15,        // 15 minutes
    refreshToken: 60 * 60 * 24 * 7,  // 7 days
    sessionId: 60 * 60 * 24 * 7      // 7 days
  }
};

// Helper function to get standard cookie options
export function getCookieOptions(type: 'access' | 'refresh' | 'session'): {
  path: string;
  httpOnly: boolean;
  secure: boolean;
  sameSite: 'strict';
  maxAge: number;
} {
  return {
    path: COOKIE_CONFIG.path,
    httpOnly: COOKIE_CONFIG.httpOnly,
    secure: COOKIE_CONFIG.secure,
    sameSite: COOKIE_CONFIG.sameSite,
    maxAge: COOKIE_CONFIG.maxAge[type === 'access' ? 'accessToken' : type === 'refresh' ? 'refreshToken' : 'sessionId']
  };
}
