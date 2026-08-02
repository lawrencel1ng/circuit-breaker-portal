/**
 * Authentication API - Login
 * Handles user login with username/password
 */

import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { compare } from 'bcryptjs';
import { prisma } from '$lib/server/db';
import { getSessionManager } from '$lib/server/auth/session';
import { getAuthAuditLogger } from '$lib/server/auth/audit';
import { logger } from '$lib/server/logger';
import { getCookieOptions } from '$lib/server/auth/cookie-config';
import { getAuthRateLimiter, createRateLimitKey } from '$lib/server/rate-limiter';

// POST /api/auth/login - Authenticate user
export const POST: RequestHandler = async ({ request, cookies, getClientAddress }) => {
  const ipAddress = getClientAddress();
  
  try {
    const { username, password } = await request.json();
    const userAgent = request.headers.get('user-agent') || 'unknown';

    // Validate input
    if (!username || !password) {
      throw error(400, 'Username and password are required');
    }

    // Check rate limit
    try {
      const rateLimiter = getAuthRateLimiter();
      const rateLimitKey = createRateLimitKey(ipAddress, username);
      const rateLimitResult = rateLimiter.check(rateLimitKey);
      
      if (!rateLimitResult.allowed) {
        logger.warn(`Rate limit exceeded for login attempt from ${ipAddress}`);
        throw error(429, 'Too many login attempts. Please try again later.');
      }
    } catch (rateLimitErr: any) {
      // If rate limiter fails, log but don't block login
      logger.error('Rate limiter error:', rateLimitErr);
    }

    // Find user
    const user = await prisma.user.findUnique({
      where: { username: username.toLowerCase() }
    });

    if (!user) {
      // Log failed login attempt
      const audit = getAuthAuditLogger();
      audit.logLogin(username, ipAddress, userAgent, false, undefined, {
        reason: 'User not found'
      });
      
      throw error(401, 'Invalid credentials');
    }

    if (!user.isActive) {
      const audit = getAuthAuditLogger();
      audit.logLogin(username, ipAddress, userAgent, false, user.id, {
        reason: 'Account disabled'
      });
      
      throw error(401, 'Account is disabled');
    }

    // Verify password
    const validPassword = await compare(password, user.passwordHash);
    
    if (!validPassword) {
      // Log failed login
      const audit = getAuthAuditLogger();
      audit.logLogin(username, ipAddress, userAgent, false, user.id, {
        reason: 'Invalid password'
      });
      
      throw error(401, 'Invalid credentials');
    }

    // Reset rate limit on successful login (best effort)
    try {
      const rateLimiter = getAuthRateLimiter();
      const rateLimitKey = createRateLimitKey(ipAddress, username);
      rateLimiter.reset(rateLimitKey);
    } catch {
      // Ignore rate limiter errors on reset
    }

    // Update last login
    await prisma.user.update({
      where: { id: user.id },
      data: { lastLogin: new Date() }
    });

    // Create session
    const sessionManager = getSessionManager();
    const roles = JSON.parse(user.roles);
    
    const session = await sessionManager.createSession(
      {
        id: user.id,
        username: user.username,
        email: user.email,
        roles,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
        isActive: user.isActive
      },
      ipAddress,
      userAgent
    );

    // Also save session to database
    await prisma.session.create({
      data: {
        userId: user.id,
        token: session.accessToken,
        refreshToken: session.refreshToken,
        ipAddress,
        userAgent,
        expiresAt: new Date(session.expiresAt)
      }
    });

    // Set cookies using centralized config
    cookies.set('access_token', session.accessToken, getCookieOptions('access'));
    cookies.set('refresh_token', session.refreshToken, getCookieOptions('refresh'));
    cookies.set('session_id', session.id, getCookieOptions('session'));

    // Log successful login
    const audit = getAuthAuditLogger();
    audit.logLogin(username, ipAddress, userAgent, true, user.id);

    logger.info(`User ${username} logged in from ${ipAddress}`);

    return json({
      success: true,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        roles
      }
    });

  } catch (err: any) {
    if (err.status) throw err;
    logger.error('Login error:', err);
    // Show detailed error in development
    const message = process.env.NODE_ENV === 'development' 
      ? `Server error: ${err.message}` 
      : 'Internal server error';
    throw error(500, message);
  }
};
