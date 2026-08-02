import { json } from '@sveltejs/kit';
import { prisma } from '$lib/server/db';
import { logger } from '$lib/server/logger';
import type { RequestHandler } from './$types';

export const PUT: RequestHandler = async ({ params, request }) => {
  const { id } = params;
  const data = await request.json();

  try {
    const updatedWindow = await prisma.changeWindow.update({
      where: { id },
      data: data
    });
    return json(updatedWindow);
  } catch (error) {
    logger.error('Failed to update change window', error);
    return json({ error: 'Failed to update change window' }, { status: 500 });
  }
};

export const DELETE: RequestHandler = async ({ params }) => {
  const { id } = params;

  try {
    await prisma.changeWindow.delete({
      where: { id }
    });
    return json({ success: true });
  } catch (error) {
    logger.error('Failed to delete change window', error);
    return json({ error: 'Failed to delete change window' }, { status: 500 });
  }
};
