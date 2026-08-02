import { json } from '@sveltejs/kit';
import { prisma } from '$lib/server/db';
import { logger } from '$lib/server/logger';
import type { RequestHandler } from './$types';

// GET /api/swg/policies - Get all policies with rules
export const GET: RequestHandler = async () => {
  try {
    const policies = await prisma.sWGPolicy.findMany({
      include: {
        rules: {
          orderBy: { priority: 'asc' }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    return json({
      policies: policies.map(p => ({
        id: p.id,
        name: p.name,
        description: p.description,
        layer: p.layer,
        enabled: p.enabled,
        rules: p.rules.map(r => ({
          id: r.id,
          name: r.name,
          enabled: r.enabled,
          priority: r.priority,
          condition: {
            type: r.conditionType,
            operator: r.conditionOperator,
            value: r.conditionValue
          },
          action: r.action,
          logEnabled: r.logEnabled
        }))
      }))
    });
  } catch (error) {
    logger.error('Failed to fetch policies', error);
    return json({ error: 'Failed to fetch policies' }, { status: 500 });
  }
};

// POST /api/swg/policies - Create new policy
export const POST: RequestHandler = async ({ request }) => {
  try {
    const data = await request.json();
    const { name, description, layer = 'layer3', enabled = true, rules = [] } = data;

    if (!name) {
      return json({ error: 'Policy name is required' }, { status: 400 });
    }

    const policy = await prisma.sWGPolicy.create({
      data: {
        name,
        description,
        layer,
        enabled,
        rules: {
          create: rules.map((r: any, index: number) => ({
            name: r.name,
            enabled: r.enabled ?? true,
            priority: r.priority ?? index,
            conditionType: r.condition?.type || 'HTTP_URI',
            conditionOperator: r.condition?.operator || 'contains',
            conditionValue: r.condition?.value || '',
            action: r.action || 'allow',
            logEnabled: r.logEnabled ?? true
          }))
        }
      },
      include: {
        rules: true
      }
    });

    return json({ success: true, policy });
  } catch (error) {
    logger.error('Failed to create policy', error);
    return json({ error: 'Failed to create policy' }, { status: 500 });
  }
};
