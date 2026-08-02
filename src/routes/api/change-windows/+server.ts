import { json } from '@sveltejs/kit';
import { prisma } from '$lib/server/db';
import { logger } from '$lib/server/logger';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async () => {
  const windows = await prisma.changeWindow.findMany({
    orderBy: { startTime: 'asc' }
  });
  return json(windows);
};

export const POST: RequestHandler = async ({ request }) => {
  const data = await request.json();

  try {
    const newWindow = await prisma.changeWindow.create({
      data: {
        name: data.name,
        type: data.type,
        dayOfWeek: data.dayOfWeek,
        startTime: data.startTime,
        endTime: data.endTime,
        isActive: data.isActive ?? true,
        description: data.description
      }
    });
    return json(newWindow);
  } catch (error) {
    logger.error('Failed to create change window', error);
    return json({ error: 'Failed to create change window' }, { status: 500 });
  }
};
