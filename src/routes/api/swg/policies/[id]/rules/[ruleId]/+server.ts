import { json } from '@sveltejs/kit';
import { prisma } from '$lib/server/db';
import { logger } from '$lib/server/logger';
import type { RequestHandler } from './$types';

// GET /api/swg/policies/[id]/rules/[ruleId] - Get specific rule
export const GET: RequestHandler = async ({ params }) => {
  try {
    const rule = await prisma.sWGPolicyRule.findUnique({
      where: { id: params.ruleId }
    });

    if (!rule || rule.policyId !== params.id) {
      return json({ error: 'Rule not found' }, { status: 404 });
    }

    return json({
      rule: {
        id: rule.id,
        name: rule.name,
        enabled: rule.enabled,
        priority: rule.priority,
        condition: {
          type: rule.conditionType,
          operator: rule.conditionOperator,
          value: rule.conditionValue
        },
        action: rule.action,
        logEnabled: rule.logEnabled
      }
    });
  } catch (error) {
    logger.error('Failed to fetch rule', error);
    return json({ error: 'Failed to fetch rule' }, { status: 500 });
  }
};

// PUT /api/swg/policies/[id]/rules/[ruleId] - Update rule
export const PUT: RequestHandler = async ({ params, request }) => {
  try {
    const data = await request.json();
    const { name, enabled, priority, condition, action, logEnabled } = data;

    const rule = await prisma.sWGPolicyRule.update({
      where: { id: params.ruleId },
      data: {
        name,
        enabled,
        priority,
        conditionType: condition?.type,
        conditionOperator: condition?.operator,
        conditionValue: condition?.value,
        action,
        logEnabled
      }
    });

    return json({ success: true, rule });
  } catch (error) {
    logger.error('Failed to update rule', error);
    return json({ error: 'Failed to update rule' }, { status: 500 });
  }
};

// DELETE /api/swg/policies/[id]/rules/[ruleId] - Delete rule
export const DELETE: RequestHandler = async ({ params }) => {
  try {
    await prisma.sWGPolicyRule.delete({
      where: { id: params.ruleId }
    });

    return json({ success: true });
  } catch (error) {
    logger.error('Failed to delete rule', error);
    return json({ error: 'Failed to delete rule' }, { status: 500 });
  }
};
