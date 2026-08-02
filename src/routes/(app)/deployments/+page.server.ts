import { prisma } from '$lib/server/db';
import { logger } from '$lib/server/logger';
import type { PageServerLoad, Actions } from './$types';
import { fail } from '@sveltejs/kit';

export const load: PageServerLoad = async () => {
  const applications = await prisma.application.findMany({
    include: {
      deployments: true
    },
    orderBy: {
      createdAt: 'desc'
    }
  });

  return {
    applications
  };
};

export const actions: Actions = {
  create: async ({ request }) => {
    const data = await request.formData();
    const appDataJson = data.get('appData');

    if (!appDataJson || typeof appDataJson !== 'string') {
      return fail(400, { message: 'Missing application data' });
    }

    try {
      const appData = JSON.parse(appDataJson);
      
      const newApp = await prisma.application.create({
        data: {
          name: appData.name,
          description: appData.description || '',
          deployedLanes: appData.deployedLanes || [],
          deploymentType: appData.deploymentType,
          status: 'running', // Mocking successful deployment
          version: appData.version,
          health: 'healthy',
          plannedExecutionTime: appData.plannedExecutionTime ? new Date(appData.plannedExecutionTime) : null,
          deployments: {
            create: {
              name: `${appData.name}-v${appData.version}`,
              status: 'running',
              servers: appData.servers || [] // assuming servers are passed in appData
            }
          }
        }
      });

      return { success: true, application: newApp };
    } catch (error) {
      logger.error('Deployment error', error);
      return fail(500, { message: 'Failed to deploy application' });
    }
  }
};
