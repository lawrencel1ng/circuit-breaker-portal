import type { CircuitBreakerConfig, AutomationLog } from '$lib/types';
import { circuitBreakerStore } from '$lib/stores/circuitBreakerStore';

function log(action: string, lane: string, details: string, status: AutomationLog['status'] = 'success') {
  circuitBreakerStore.update(cfg => ({
    ...cfg,
    automationLogs: [
      {
        id: `log_${Date.now()}_${Math.random().toString(36).slice(2)}`,
        timestamp: new Date().toISOString(),
        lane,
        action,
        user: 'demo-simulator',
        details,
        status
      },
      ...cfg.automationLogs
    ]
  }));
}

export const DemoScenarios = {
  async flipDownLane(laneId: string) {
    log('lane_flipdown_requested', laneId, `Flip-down initiated for ${laneId}`);
    await new Promise(r => setTimeout(r, 800));
    circuitBreakerStore.update(cfg => ({
      ...cfg,
      lanes: cfg.lanes.map(l => l.id === laneId ? { ...l, edgeStatus: 'closed', enterpriseStatus: 'closed', healthStatus: 'down', trafficDistribution: 0 } : l)
    }));
    log('lane_flipped_down', laneId, `${laneId} closed; failing over traffic`, 'warning');
    await new Promise(r => setTimeout(r, 600));
    circuitBreakerStore.update(cfg => {
      const active = cfg.lanes.filter(l => l.id !== laneId);
      const share = active.length ? Math.round((100 / active.length) * 10) / 10 : 0;
      return {
        ...cfg,
        lanes: cfg.lanes.map(l => l.id === laneId ? l : { ...l, trafficDistribution: share })
      };
    });
    log('traffic_redistributed', 'all', `Traffic redistributed from ${laneId} to remaining lanes`);
  },

  async failoverToLane(targetLaneId: string) {
    log('failover_requested', targetLaneId, `Failover to ${targetLaneId} requested`);
    await new Promise(r => setTimeout(r, 500));
    circuitBreakerStore.update(cfg => ({
      ...cfg,
      lanes: cfg.lanes.map(l => ({
        ...l,
        edgeStatus: l.id === targetLaneId ? 'active' : 'inactive',
        enterpriseStatus: l.id === targetLaneId ? 'active' : 'inactive',
        trafficDistribution: l.id === targetLaneId ? 100 : 0
      }))
    }));
    log('failover_completed', targetLaneId, `All traffic routed to ${targetLaneId}`);
  },

  async healthIncident(laneId: string) {
    log('health_check_failed', laneId, `Multiple health checks failing on ${laneId}`, 'warning');
    await new Promise(r => setTimeout(r, 800));
    circuitBreakerStore.update(cfg => ({
      ...cfg,
      lanes: cfg.lanes.map(l => l.id === laneId ? { ...l, healthStatus: 'down' } : l)
    }));
    log('circuit_breaker_triggered', laneId, `Circuit breaker tripped for ${laneId}`, 'error');
    await new Promise(r => setTimeout(r, 600));
    circuitBreakerStore.update(cfg => ({
      ...cfg,
      lanes: cfg.lanes.map(l => l.id === laneId ? { ...l, edgeStatus: 'closed', enterpriseStatus: 'closed', trafficDistribution: 0 } : l)
    }));
    log('lane_flipped_down', laneId, `${laneId} closed due to health failure`, 'error');
    await new Promise(r => setTimeout(r, 400));
    circuitBreakerStore.update(cfg => {
      const active = cfg.lanes.filter(l => l.id !== laneId);
      const share = active.length ? Math.round((100 / active.length) * 10) / 10 : 0;
      return {
        ...cfg,
        lanes: cfg.lanes.map(l => l.id === laneId ? l : { ...l, trafficDistribution: share })
      };
    });
    log('traffic_redistributed', 'all', `Traffic redistributed from ${laneId} to remaining lanes`);
  },

  async rollingDeployment(appName = 'Payments API', lanes: string[] = ['lane1','lane2','lane3']) {
    for (const laneId of lanes) {
      log('deployment_started', laneId, `Deploying ${appName} to ${laneId}`);
      await new Promise(r => setTimeout(r, 700));
      circuitBreakerStore.update(cfg => ({
        ...cfg,
        lanes: cfg.lanes.map(l => l.id === laneId ? {
          ...l,
          deployments: [
            ...l.deployments,
            {
              id: `dep_${Date.now()}_${Math.random().toString(36).slice(2)}`,
              name: `${appName} - ${laneId.toUpperCase()}`,
              servers: [],
              status: 'running'
            }
          ]
        } : l)
      }));
      log('deployment_completed', laneId, `${appName} deployed to ${laneId}`);
    }
  },

  async maintenanceWindow(laneId: string) {
    log('maintenance_scheduled', laneId, `Maintenance scheduled for ${laneId}`);
    circuitBreakerStore.update(cfg => ({
      ...cfg,
      globalSettings: { ...cfg.globalSettings, maintenanceMode: true }
    }));
    await new Promise(r => setTimeout(r, 500));
    
    // Flip down the lane for maintenance
    log('lane_flipdown_requested', laneId, `Flip-down initiated for maintenance on ${laneId}`);
    await new Promise(r => setTimeout(r, 400));
    circuitBreakerStore.update(cfg => ({
      ...cfg,
      lanes: cfg.lanes.map(l => l.id === laneId ? { ...l, edgeStatus: 'closed', enterpriseStatus: 'closed', healthStatus: 'down', trafficDistribution: 0 } : l)
    }));
    log('lane_flipped_down', laneId, `${laneId} closed for maintenance`, 'warning');
    
    // Redistribute traffic
    await new Promise(r => setTimeout(r, 300));
    circuitBreakerStore.update(cfg => {
      const active = cfg.lanes.filter(l => l.id !== laneId);
      const share = active.length ? Math.round((100 / active.length) * 10) / 10 : 0;
      return {
        ...cfg,
        lanes: cfg.lanes.map(l => l.id === laneId ? l : { ...l, trafficDistribution: share })
      };
    });
    log('traffic_redistributed', 'all', `Traffic redistributed from ${laneId} to remaining lanes`);
    
    log('maintenance_in_progress', laneId, `Maintenance in progress on ${laneId}`);
    await new Promise(r => setTimeout(r, 1200));
    circuitBreakerStore.update(cfg => ({
      ...cfg,
      lanes: cfg.lanes.map(l => l.id === laneId ? { ...l, edgeStatus: 'active', enterpriseStatus: 'active', healthStatus: 'healthy' } : l)
    }));
    log('maintenance_completed', laneId, `Maintenance completed on ${laneId}`);
    circuitBreakerStore.update(cfg => ({
      ...cfg,
      globalSettings: { ...cfg.globalSettings, maintenanceMode: false }
    }));
  },

  async resetAll() {
    log('system_reset', 'all', 'Resetting all lanes to healthy state');
    await new Promise(r => setTimeout(r, 500));
    circuitBreakerStore.update(cfg => ({
      ...cfg,
      lanes: cfg.lanes.map((l, index) => ({
        ...l,
        edgeStatus: 'active',
        enterpriseStatus: 'active',
        healthStatus: 'healthy',
        trafficDistribution: index === 0 ? 40 : index === 1 ? 35 : 25
      })),
      globalSettings: { ...cfg.globalSettings, maintenanceMode: false }
    }));
    log('system_reset_completed', 'all', 'All lanes reset to healthy state');
  }
};
