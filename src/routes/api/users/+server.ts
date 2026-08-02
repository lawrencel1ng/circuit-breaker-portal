/**
 * Users API
 * Manage users (admin only)
 */

import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { hash } from 'bcryptjs';
import { prisma } from '$lib/server/db';
import { getRBACEngine, Resource, Action } from '$lib/server/auth/rbac';
import { logger } from '$lib/server/logger';

// GET /api/users - List all users
export const GET: RequestHandler = async ({ locals }) => {
  try {
    const user = locals.user;
    if (!user) {
      throw error(401, 'Unauthorized');
    }

    // Check permission
    const rbac = getRBACEngine();
    const check = rbac.checkAccess(user as any, Resource.USER, Action.READ);
    if (!check.allowed) {
      throw error(403, 'Access denied');
    }

    const users = await prisma.user.findMany({
      select: {
        id: true,
        username: true,
        email: true,
        firstName: true,
        lastName: true,
        roles: true,
        isActive: true,
        lastLogin: true,
        createdAt: true
      },
      orderBy: { createdAt: 'desc' }
    });

    // Parse roles for each user
    const usersWithParsedRoles = users.map(u => ({
      ...u,
      roles: JSON.parse(u.roles)
    }));

    return json({ users: usersWithParsedRoles });

  } catch (err: any) {
    if (err.status) throw err;
    logger.error('Failed to list users:', err);
    throw error(500, err.message);
  }
};

// POST /api/users - Create new user
export const POST: RequestHandler = async ({ request, locals }) => {
  try {
    const currentUser = locals.user;
    if (!currentUser) {
      throw error(401, 'Unauthorized');
    }

    // Check permission
    const rbac = getRBACEngine();
    const check = rbac.checkAccess(currentUser as any, Resource.USER, Action.CREATE);
    if (!check.allowed) {
      throw error(403, 'Access denied');
    }

    const body = await request.json();

    // Validate required fields
    if (!body.username || !body.email || !body.password) {
      throw error(400, 'Missing required fields: username, email, password');
    }

    // Check if username exists
    const existingUsername = await prisma.user.findUnique({
      where: { username: body.username.toLowerCase() }
    });

    if (existingUsername) {
      throw error(409, 'Username already exists');
    }

    // Check if email exists
    const existingEmail = await prisma.user.findUnique({
      where: { email: body.email.toLowerCase() }
    });

    if (existingEmail) {
      throw error(409, 'Email already exists');
    }

    // Hash password
    const hashedPassword = await hash(body.password, 10);

    // Create user
    const user = await prisma.user.create({
      data: {
        username: body.username.toLowerCase(),
        email: body.email.toLowerCase(),
        passwordHash: hashedPassword,
        firstName: body.firstName,
        lastName: body.lastName,
        roles: JSON.stringify(body.roles || ['viewer']),
        isActive: body.isActive ?? true
      },
      select: {
        id: true,
        username: true,
        email: true,
        firstName: true,
        lastName: true,
        roles: true,
        isActive: true,
        createdAt: true
      }
    });

    logger.info(`User ${user.username} created by ${currentUser.username}`);

    return json({ 
      user: { ...user, roles: JSON.parse(user.roles) }
    }, { status: 201 });

  } catch (err: any) {
    if (err.status) throw err;
    logger.error('Failed to create user:', err);
    throw error(500, err.message);
  }
};
