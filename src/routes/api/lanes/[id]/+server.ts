import { json } from '@sveltejs/kit';
import { prisma } from '$lib/server/db';
import { getF5Client } from '$lib/server/f5';
import { logger } from '$lib/server/logger';
import type { RequestHandler } from './$types';

export const PUT: RequestHandler = async ({ params, request }) => {
  const { id } = params;
  const data = await request.json();

  try {
    const f5Client = getF5Client();
    
    // Get current lane configuration from database
    const lane = await prisma.lane.findUnique({
      where: { id }
    });

    if (!lane) {
      return json({ error: 'Lane not found' }, { status: 404 });
    }

    // Update F5 GSLB Wide IP status if edgeStatus or enterpriseStatus changed
    if (data.edgeStatus || data.enterpriseStatus) {
      try {
        // Parse load balancer configs from JSON strings
        const edgeLB = typeof lane.edgeLoadBalancer === 'string' 
          ? JSON.parse(lane.edgeLoadBalancer) 
          : lane.edgeLoadBalancer;
        const enterpriseLB = typeof lane.enterpriseLoadBalancer === 'string'
          ? JSON.parse(lane.enterpriseLoadBalancer)
          : lane.enterpriseLoadBalancer;

        // Update Edge GSLB Wide IP
        if (edgeLB?.wideIPs?.[0]?.name) {
          const wideipName = edgeLB.wideIPs[0].name;
          const enabled = data.edgeStatus === 'active';
          
          await f5Client.patch(`tm/gtm/wideip/~Common~${wideipName}`, {
            enabled
          });
        }

        // Update Enterprise GSLB Wide IP
        if (enterpriseLB?.wideIPs?.[0]?.name) {
          const wideipName = enterpriseLB.wideIPs[0].name;
          const enabled = data.enterpriseStatus === 'active';
          
          await f5Client.patch(`tm/gtm/wideip/~Common~${wideipName}`, {
            enabled
          });
        }

        // Update pool members status
        if (edgeLB?.pools?.[0]?.name) {
          const poolName = edgeLB.pools[0].name;
          const session = data.edgeStatus === 'active' ? 'user-enabled' : 'user-disabled';
          
          // Get pool members and update their status
          const poolMembers = await f5Client.get(`tm/ltm/pool/~Common~${poolName}/members`);
          
          for (const member of poolMembers.items || []) {
            const memberName = (member as any).name;
            await f5Client.patch(
              `tm/ltm/pool/~Common~${poolName}/members/~Common~${memberName}`,
              { session }
            );
          }
        }
      } catch (f5Error) {
        logger.error('F5 API error', f5Error);
        // Continue with database update even if F5 fails
        // This ensures the portal state is consistent
      }
    }
    
    const updatedLane = await prisma.lane.update({
      where: { id },
      data: {
        edgeStatus: data.edgeStatus,
        enterpriseStatus: data.enterpriseStatus,
        healthStatus: data.healthStatus,
        // Allow updating other fields if needed
        ...data
      }
    });

    // Create a log entry for the update
    await prisma.log.create({
      data: {
        type: 'automation',
        action: data.action || 'lane_update',
        status: 'success',
        user: data.user || 'admin',
        lane: id,
        message: data.message || `Updated lane ${updatedLane.name}`,
        timestamp: new Date()
      }
    });

    return json(updatedLane);
  } catch (error) {
    logger.error('Failed to update lane', error);
    return json({ error: 'Failed to update lane' }, { status: 500 });
  }
};
