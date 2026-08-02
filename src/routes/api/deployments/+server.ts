import { json, error } from '@sveltejs/kit';
import { prisma } from '$lib/server/db';
import { logger } from '$lib/server/logger';
import { getAS3Service } from '$lib/server/f5/as3-service';
import { getWebSocketManager } from '$lib/server/websocket/server';
import type { RequestHandler } from './$types';

export const POST: RequestHandler = async ({ request, locals }) => {
  const appData = await request.json();
  
  // Get authenticated user
  const user = locals.user;
  if (!user) {
    throw error(401, 'Unauthorized');
  }

  try {
    // Start AS3 deployment
    const as3Service = getAS3Service();
    
    // Get WebSocket manager for real-time updates
    const wsManager = getWebSocketManager();

    // Deploy directly via AS3
    wsManager?.broadcast({
      type: 'deployment_update',
      timestamp: new Date().toISOString(),
      data: {
        status: 'deploying',
        progress: 25,
        message: 'Submitting AS3 declaration'
      }
    }, 'deployments');
    
    const result = await as3Service.deployVirtualServer({
      name: appData.name.replace(/[^a-zA-Z0-9]/g, '_'),
      ip: appData.vipAddress || '0.0.0.0',
      port: appData.port || 80,
      ssl: appData.ssl || false,
      poolMembers: appData.servers || []
    });
    
    if (!result.success) {
      logger.error('AS3 deployment failed', { error: result.message });
      return json({ 
        error: 'AS3 deployment failed', 
        details: result.message 
      }, { status: 400 });
    }

    // Create application record
    const newApp = await prisma.application.create({
      data: {
        name: appData.name,
        description: appData.description || '',
        deployedLanes: appData.deployedLanes || [],
        deploymentType: appData.deploymentType,
        status: 'deployed',
        version: appData.version,
        health: 'healthy',
        plannedExecutionTime: appData.plannedExecutionTime ? new Date(appData.plannedExecutionTime) : null,
        deployments: {
          create: {
            name: `${appData.name}-v${appData.version}`,
            status: 'running',
            servers: JSON.stringify(appData.servers || [])
          }
        }
      },
      include: {
        deployments: true
      }
    });
    
    wsManager?.broadcast({
      type: 'deployment_update',
      timestamp: new Date().toISOString(),
      data: {
        deploymentId: newApp.deployments[0].id,
        status: 'completed',
        progress: 100,
        message: 'Deployment completed successfully'
      }
    }, 'deployments');

    // Create Audit Log
    await prisma.log.create({
      data: {
        type: 'audit',
        action: 'deployment',
        status: 'success',
        user: user.username,
        details: JSON.stringify({ appId: newApp.id }),
        message: `Deployed ${newApp.name} via AS3`
      }
    });

    return json({ 
      ...newApp, 
      message: 'Deployment completed' 
    });
    
  } catch (error: any) {
    logger.error('Deployment API Error', error);
    return json({ error: 'Failed to deploy', details: error.message }, { status: 500 });
  }
};

// GET handler to list deployments
export const GET: RequestHandler = async ({ locals }) => {
  try {
    const user = locals.user;
    if (!user) {
      throw error(401, 'Unauthorized');
    }

    const applications = await prisma.application.findMany({
      include: { deployments: true },
      orderBy: { createdAt: 'desc' }
    });

    return json(applications);
  } catch (error: any) {
    logger.error('Failed to fetch deployments', error);
    return json({ error: 'Failed to fetch deployments' }, { status: 500 });
  }
};
