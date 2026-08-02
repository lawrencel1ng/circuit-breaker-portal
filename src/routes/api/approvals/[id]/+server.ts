import { json, error } from '@sveltejs/kit';
import { prisma } from '$lib/server/db';
import { logger } from '$lib/server/logger';
import { getAS3Service } from '$lib/server/f5/as3-service';
import { getWebSocketManager } from '$lib/server/websocket/server';
import type { RequestHandler } from './$types';

/**
 * Execute deployment from approval request data
 */
async function executeApprovedDeployment(approvalRequest: any, user: any) {
  const as3Service = getAS3Service();
  const wsManager = getWebSocketManager();
  
  // Parse the request data
  const requestData = typeof approvalRequest.data === 'string' 
    ? JSON.parse(approvalRequest.data) 
    : approvalRequest.data;
  
  // Broadcast deployment start
  wsManager?.broadcast({
    type: 'deployment_update',
    timestamp: new Date().toISOString(),
    data: {
      approvalId: approvalRequest.id,
      status: 'deploying',
      progress: 30,
      message: 'Deploying AS3 declaration'
    }
  }, 'deployments');
  
  let result: { success: boolean; message: string; details?: any };
  
  switch (approvalRequest.type) {
    case 'f5_deployment':
    case 'application_deployment':
      result = await as3Service.deployVirtualServer({
        name: requestData.applicationName || requestData.name,
        ip: requestData.vipAddress || requestData.virtualServer?.ip,
        port: requestData.port || requestData.virtualServer?.port || 80,
        ssl: requestData.ssl || false,
        poolMembers: requestData.servers || requestData.pool?.members || []
      });
      break;
    case 'swg_config':
      result = await as3Service.deploySWG(requestData);
      break;
    case 'sslo_config':
      result = await as3Service.deploySSLO(requestData);
      break;
    default:
      throw new Error(`Unknown deployment type: ${approvalRequest.type}`);
  }
  
  if (!result.success) {
    throw new Error(result.message);
  }
  
  // Broadcast deployment complete
  wsManager?.broadcast({
    type: 'deployment_update',
    timestamp: new Date().toISOString(),
    data: {
      approvalId: approvalRequest.id,
      status: 'completed',
      progress: 100,
      message: 'Deployment completed successfully'
    }
  }, 'deployments');
  
  return { success: true, status: 'deployed' };
}

export const PUT: RequestHandler = async ({ params, request, locals }) => {
  const { id } = params;
  const data = await request.json();
  
  // Get authenticated user
  const user = locals.user;
  if (!user) {
    throw error(401, 'Unauthorized');
  }

  try {
    // Fetch the approval request
    const approvalRequest = await prisma.approvalRequest.findUnique({ 
      where: { id }
    });
    
    if (!approvalRequest) {
      throw error(404, 'Approval request not found');
    }
    
    // If approving, trigger the deployment
    if (data.status === 'approved') {
      try {
        const deploymentResult = await executeApprovedDeployment(approvalRequest, user);
        logger.info(`Deployment triggered for approval ${id}`, deploymentResult);
        
        // Add deployment info to response
        data.deploymentResult = deploymentResult;
      } catch (deployError: any) {
        logger.error('Failed to execute approved deployment', deployError);
        return json({ 
          error: 'Failed to execute deployment', 
          details: deployError.message 
        }, { status: 500 });
      }
    }

    const updatedRequest = await prisma.approvalRequest.update({
      where: { id },
      data: {
        status: data.status,
        comments: JSON.stringify([
          ...(typeof approvalRequest.comments === 'string' 
            ? JSON.parse(approvalRequest.comments || '[]') 
            : []),
          {
            timestamp: new Date().toISOString(),
            user: user.username,
            message: data.comment || `Request ${data.status}`,
            status: data.status
          }
        ])
      }
    });

    // Create audit log
    await prisma.log.create({
      data: {
        type: 'audit',
        action: 'approval_decision',
        status: 'success',
        user: user.username,
        details: JSON.stringify({ 
          requestId: id, 
          decision: data.status,
          deploymentResult: data.deploymentResult 
        }),
        message: `Request "${updatedRequest.title}" was ${data.status} by ${user.username}`
      }
    });

    return json(updatedRequest);
  } catch (err: any) {
    logger.error('Failed to update approval request', err);
    return json({ error: 'Failed to update approval request', details: err.message }, { status: 500 });
  }
};
