import { prisma } from '$lib/server/db';
import type { LayoutServerLoad } from './$types';

// Helper function to safely parse JSON fields that might already be objects
function parseJsonField(field: any): any {
  if (field === null || field === undefined) {
    return {};
  }
  if (typeof field === 'string') {
    try {
      return JSON.parse(field);
    } catch {
      return {};
    }
  }
  // If it's already an object, return it
  return field;
}

export const load: LayoutServerLoad = async () => {
  const [
    workflowRules,
    changeWindows,
    lanes,
    applications,
    automationLogs,
    auditLogs,
    systemLogs,
    globalSettings,
    alertConfig,
    systemSettings,
    approvalRequests
  ] = await Promise.all([
    prisma.workflowRule.findMany(),
    prisma.changeWindow.findMany(),
    prisma.lane.findMany({ orderBy: { name: 'asc' } }),
    prisma.application.findMany({ 
      include: { deployments: true },
      orderBy: { createdAt: 'desc' }
    }),
    prisma.log.findMany({ 
      where: { type: 'automation' },
      orderBy: { timestamp: 'desc' },
      take: 50 
    }),
    prisma.log.findMany({ 
      where: { type: 'audit' },
      orderBy: { timestamp: 'desc' },
      take: 50 
    }),
    prisma.log.findMany({ 
      where: { type: 'system' },
      orderBy: { timestamp: 'desc' },
      take: 50 
    }),
    prisma.globalSettings.findUnique({ where: { id: 'default' } }),
    prisma.alertConfig.findUnique({ where: { id: 'default' } }),
    prisma.systemSettings.findUnique({ where: { id: 'default' } }),
    prisma.approvalRequest.findMany({ orderBy: { timestamp: 'desc' } })
  ]);

  // Construct Circuit Breaker Config
  const circuitBreakerConfig: import('../lib/types').CircuitBreakerConfig = {
    lanes: (lanes || []).map((lane: any) => ({
      ...lane,
      edgeLoadBalancer: parseJsonField(lane.edgeLoadBalancer),
      enterpriseLoadBalancer: parseJsonField(lane.enterpriseLoadBalancer),
      edgeCircuitBreaker: parseJsonField(lane.edgeCircuitBreaker),
      enterpriseCircuitBreaker: parseJsonField(lane.enterpriseCircuitBreaker),
      deployments: (applications || [])
        .filter((app: any) => (app.deployedLanes || '').includes(lane.id) || (app.deployedLanes || '').includes(lane.name))
        .flatMap((app: any) => app.deployments || [])
    })) || [],
    applications: (applications || []).map((app: any) => ({
      ...app,
      deployedLanes: (app.deployedLanes || '').split(',').map((s: string) => s.trim()).filter(Boolean)
    })),
    automationLogs: (automationLogs || []).map((l: any) => ({
      ...l,
      details: l.message || JSON.stringify(l.details),
      lane: l.lane || 'unknown'
    })),
    globalSettings: globalSettings ? {
      dnsServer: globalSettings.dnsServer,
      ntpServer: globalSettings.ntpServer,
      syslogServer: globalSettings.syslogServer,
      healthCheckInterval: globalSettings.healthCheckInterval,
      circuitBreakerThreshold: globalSettings.circuitBreakerThreshold,
      autoFailoverEnabled: globalSettings.autoFailoverEnabled
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
      channels: parseJsonField(alertConfig.channels),
      rules: parseJsonField(alertConfig.rules)
    } : {
      enabled: true,
      channels: [],
      rules: []
    },
    systemSettings: systemSettings ? {
      maintenanceMode: systemSettings.maintenanceMode || false,
      maintenanceMessage: systemSettings.maintenanceMessage || '',
      systemName: systemSettings.systemName || 'F5 Control Center',
      dataRetentionDays: systemSettings.dataRetentionDays || 90,
      theme: (systemSettings.theme as 'light' | 'dark' | 'system') || 'system'
    } : {
      maintenanceMode: false,
      maintenanceMessage: 'System is undergoing scheduled maintenance.',
      systemName: 'OCBC Circuit Breaker Portal',
      dataRetentionDays: 90,
      theme: 'system'
    }
  };

  return {
    workflowRules: (workflowRules || []).map((rule: any) => ({
      ...rule,
      actionType: rule.actionType,
      approverRole: rule.approverRole
    })),
    changeWindows: (changeWindows || []).map((window: any) => ({
      ...window,
      type: window.type
    })),
    circuitBreakerConfig,
    approvalRequests: (approvalRequests || []).map((req: any) => ({
      ...req,
      timestamp: req.timestamp.toISOString(),
      data: parseJsonField(req.data),
      comments: req.comments ? parseJsonField(req.comments) : undefined
    })),
    logs: {
      audit: auditLogs,
      system: systemLogs
    }
  };
};
