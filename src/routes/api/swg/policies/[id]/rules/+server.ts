import { json } from '@sveltejs/kit';
import { prisma } from '$lib/server/db';
import { logger } from '$lib/server/logger';
import type { RequestHandler } from './$types';

// GET /api/swg/policies/[id]/rules - Get rules for a policy
export const GET: RequestHandler = async ({ params }) => {
  try {
    const rules = await prisma.sWGPolicyRule.findMany({
      where: { policyId: params.id },
      orderBy: { priority: 'asc' }
    });

    return json({
      rules: rules.map(r => ({
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
    });
  } catch (error) {
    logger.error('Failed to fetch rules', error);
    return json({ error: 'Failed to fetch rules' }, { status: 500 });
  }
};

// POST /api/swg/policies/[id]/rules - Add rule to policy
export const POST: RequestHandler = async ({ params, request }) => {
  try {
    const data = await request.json();
    const { name, enabled = true, priority, condition, action = 'allow', logEnabled = true } = data;

    if (!name) {
      return json({ error: 'Rule name is required' }, { status: 400 });
    }

    // Get current max priority if not specified
    let rulePriority = priority;
    if (rulePriority === undefined) {
      const lastRule = await prisma.sWGPolicyRule.findFirst({
        where: { policyId: params.id },
        orderBy: { priority: 'desc' }
      });
      rulePriority = (lastRule?.priority || 0) + 1;
    }

    const rule = await prisma.sWGPolicyRule.create({
      data: {
        policyId: params.id,
        name,
        enabled,
        priority: rulePriority,
        conditionType: condition?.type || 'HTTP_URI',
        conditionOperator: condition?.operator || 'contains',
        conditionValue: condition?.value || '',
        action,
        logEnabled
      }
    });

    return json({ success: true, rule });
  } catch (error) {
    logger.error('Failed to create rule', error);
    return json({ error: 'Failed to create rule' }, { status: 500 });
  }
};

// PUT /api/swg/policies/[id]/rules/reorder - Reorder rules
export const PUT: RequestHandler = async ({ params, request }) => {
  try {
    const data = await request.json();
    const { oldIndex, newIndex } = data;

    if (oldIndex === undefined || newIndex === undefined) {
      return json({ error: 'oldIndex and newIndex are required' }, { status: 400 });
    }

    const rules = await prisma.sWGPolicyRule.findMany({
      where: { policyId: params.id },
      orderBy: { priority: 'asc' }
    });

    if (oldIndex < 0 || oldIndex >= rules.length || newIndex < 0 || newIndex >= rules.length) {
      return json({ error: 'Invalid index' }, { status: 400 });
    }

    // Move rule in array
    const [movedRule] = rules.splice(oldIndex, 1);
    rules.splice(newIndex, 0, movedRule);

    // Update priorities
    await prisma.$transaction(
      rules.map((rule, index) =>
        prisma.sWGPolicyRule.update({
          where: { id: rule.id },
          data: { priority: index }
        })
      )
    );

    return json({ success: true });
  } catch (error) {
    logger.error('Failed to reorder rules', error);
    return json({ error: 'Failed to reorder rules' }, { status: 500 });
  }
};
