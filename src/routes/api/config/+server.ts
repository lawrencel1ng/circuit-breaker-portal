import { json } from '@sveltejs/kit';
import { prisma } from '$lib/server/db';
import { logger } from '$lib/server/logger';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async () => {
  try {
    const [
      lanes,
      applications,
      logs,
      globalSettings,
      alertConfig,
      systemSettings
    ] = await Promise.all([
      prisma.lane.findMany({ orderBy: { name: 'asc' } }),
      prisma.application.findMany({ 
        include: { deployments: true },
        orderBy: { createdAt: 'desc' }
      }),
      prisma.log.findMany({ 
        where: { type: 'automation' },
        orderBy: { timestamp: 'desc' },
        take: 100 
      }),
      prisma.globalSettings.findUnique({ where: { id: 'default' } }),
      prisma.alertConfig.findUnique({ where: { id: 'default' } }),
      prisma.systemSettings.findUnique({ where: { id: 'default' } })
    ]);

    // Parse JSON strings and construct the config object matching CircuitBreakerConfig interface
    const parsedLanes = lanes?.map((lane: any) => {
      try {
        return {
          ...lane,
          id: lane.id,
          edgeLoadBalancer: JSON.parse(lane.edgeLoadBalancer || '{}'),
          enterpriseLoadBalancer: JSON.parse(lane.enterpriseLoadBalancer || '{}'),
          edgeCircuitBreaker: JSON.parse(lane.edgeCircuitBreaker || '{}'),
          enterpriseCircuitBreaker: JSON.parse(lane.enterpriseCircuitBreaker || '{}'),
          deployments: applications?.filter((app: any) => app.deployedLanes.includes(lane.id))
            .flatMap((app: any) => app.deployments?.map((d: any) => ({
              ...d,
              servers: typeof d.servers === 'string' ? JSON.parse(d.servers) : d.servers
            })) || []) || []
        };
      } catch (e) {
        logger.error('Failed to parse lane data', e);
        return lane;
      }
    }) || [];

    const parsedApplications = applications?.map((app: any) => ({
      ...app,
      deployedLanes: app.deployedLanes?.split(',') || [],
      deployments: app.deployments?.map((d: any) => ({
        ...d,
        servers: typeof d.servers === 'string' ? JSON.parse(d.servers) : d.servers
      })) || []
    })) || [];

    const config = {
      lanes: parsedLanes,
      applications: parsedApplications,
      automationLogs: logs.map((l: any) => ({
        ...l,
        details: l.message || l.details || '',
        lane: l.lane || 'unknown'
      })) || [],
      globalSettings: globalSettings ? {
        ...globalSettings,
        id: undefined // Remove id from response
      } : {
        dnsServer: '10.1.1.53',
        ntpServer: '10.1.1.123',
        syslogServer: '10.1.1.200',
        healthCheckInterval: 10,
        circuitBreakerThreshold: 3,
        autoFailoverEnabled: true
      },
      alertConfig: alertConfig ? {
        enabled: alertConfig.enabled,
        channels: JSON.parse(alertConfig.channels || '[]'),
        rules: JSON.parse(alertConfig.rules || '[]')
      } : {
        enabled: true,
        channels: [],
        rules: []
      },
      systemSettings: systemSettings ? {
        ...systemSettings,
        id: undefined // Remove id from response
      } : {
        maintenanceMode: false,
        maintenanceMessage: 'System is undergoing scheduled maintenance.',
        systemName: 'OCBC Circuit Breaker Portal',
        dataRetentionDays: 90,
        theme: 'system'
      }
    };

    return json(config);
  } catch (error) {
    logger.error('Failed to fetch config', error);
    return json({ error: 'Failed to fetch configuration' }, { status: 500 });
  }
};
