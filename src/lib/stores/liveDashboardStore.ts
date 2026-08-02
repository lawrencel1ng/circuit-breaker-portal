/**
 * Live Dashboard Store
 * Provides real-time updates for dashboard metrics via WebSocket
 */

import { writable, derived, type Readable } from 'svelte/store';
import { getWebSocketManager, type WebSocketMessage } from './realtimeStore';
import type { Lane, CircuitBreakerConfig } from '../types';

// Live metrics interface
export interface LiveMetrics {
  timestamp: string;
  activeLanes: number;
  totalApplications: number;
  totalServers: number;
  uptime: number;
  throughput: number;
  avgResponseTime: number;
  errorRate: number;
  cpuUtilization: number;
  memoryUtilization: number;
  networkThroughput: number;
}

// System health status
export interface SystemHealth {
  status: 'healthy' | 'degraded' | 'critical' | 'down';
  lastChecked: string;
  components: {
    f5Connection: 'up' | 'down' | 'degraded';
    database: 'up' | 'down';
    websocket: 'up' | 'down';
    api: 'up' | 'down';
  };
  issues: SystemIssue[];
}

export interface SystemIssue {
  id: string;
  severity: 'critical' | 'warning' | 'info';
  component: string;
  message: string;
  timestamp: string;
  acknowledged: boolean;
}

// Traffic metrics
export interface TrafficMetrics {
  totalRequests: number;
  requestsPerSecond: number;
  activeConnections: number;
  bytesIn: number;
  bytesOut: number;
  topVirtualServers: Array<{
    name: string;
    requests: number;
    connections: number;
  }>;
}

// Alert/notification
export interface SystemAlert {
  id: string;
  type: 'info' | 'warning' | 'critical' | 'success';
  title: string;
  message: string;
  timestamp: string;
  acknowledged: boolean;
  source: string;
}

// Initial states
const initialMetrics: LiveMetrics = {
  timestamp: new Date().toISOString(),
  activeLanes: 0,
  totalApplications: 0,
  totalServers: 0,
  uptime: 99.9,
  throughput: 0,
  avgResponseTime: 0,
  errorRate: 0,
  cpuUtilization: 0,
  memoryUtilization: 0,
  networkThroughput: 0
};

const initialHealth: SystemHealth = {
  status: 'healthy',
  lastChecked: new Date().toISOString(),
  components: {
    f5Connection: 'up',
    database: 'up',
    websocket: 'up',
    api: 'up'
  },
  issues: []
};

const initialTraffic: TrafficMetrics = {
  totalRequests: 0,
  requestsPerSecond: 0,
  activeConnections: 0,
  bytesIn: 0,
  bytesOut: 0,
  topVirtualServers: []
};

// Create stores
export const liveMetrics = writable<LiveMetrics>(initialMetrics);
export const systemHealth = writable<SystemHealth>(initialHealth);
export const trafficMetrics = writable<TrafficMetrics>(initialTraffic);
export const systemAlerts = writable<SystemAlert[]>([]);
export const liveLanes = writable<Lane[]>([]);
export const isRealtimeConnected = writable<boolean>(false);

// Derived stores
export const activeAlerts = derived(systemAlerts, $alerts => 
  $alerts.filter(a => !a.acknowledged)
);

export const criticalAlerts = derived(systemAlerts, $alerts =>
  $alerts.filter(a => a.type === 'critical' && !a.acknowledged)
);

export const healthScore = derived(systemHealth, $health => {
  let score = 100;
  if ($health.components.f5Connection !== 'up') score -= 25;
  if ($health.components.database !== 'up') score -= 25;
  if ($health.components.websocket !== 'up') score -= 15;
  if ($health.components.api !== 'up') score -= 15;
  score -= $health.issues.filter(i => i.severity === 'critical').length * 10;
  score -= $health.issues.filter(i => i.severity === 'warning').length * 5;
  return Math.max(0, score);
});

// WebSocket message handlers
function handleMetricsMessage(message: WebSocketMessage) {
  if (message.data && message.type === 'metrics') {
    liveMetrics.update(current => ({
      ...current,
      ...message.data,
      timestamp: message.timestamp
    }));
  }
}

function handleHealthMessage(message: WebSocketMessage) {
  if (message.data && message.type === 'health') {
    systemHealth.update(current => ({
      ...current,
      ...message.data,
      lastChecked: message.timestamp
    }));
  }
}

function handleTrafficMessage(message: WebSocketMessage) {
  if (message.data && message.type === 'traffic') {
    trafficMetrics.update(current => ({
      ...current,
      ...message.data
    }));
  }
}

function handleAlertMessage(message: WebSocketMessage) {
  if (message.data && message.type === 'alert') {
    const alert: SystemAlert = {
      id: message.data.id || `alert_${Date.now()}`,
      type: message.data.severity || 'info',
      title: message.data.title || 'System Alert',
      message: message.data.message,
      timestamp: message.timestamp,
      acknowledged: false,
      source: message.data.source || 'system'
    };
    
    systemAlerts.update(alerts => {
      // Prevent duplicate alerts
      const exists = alerts.some(a => a.id === alert.id);
      if (exists) return alerts;
      return [alert, ...alerts].slice(0, 100); // Keep last 100 alerts
    });
  }
}

function handleLaneUpdate(message: WebSocketMessage) {
  if (message.data && message.type === 'lane_update') {
    liveLanes.update(lanes => {
      const index = lanes.findIndex(l => l.id === message.data.id);
      if (index >= 0) {
        lanes[index] = { ...lanes[index], ...message.data };
        return [...lanes];
      }
      return [...lanes, message.data];
    });
  }
}

function handleConnectionStatus(connected: boolean) {
  isRealtimeConnected.set(connected);
  systemHealth.update(health => ({
    ...health,
    components: {
      ...health.components,
      websocket: connected ? 'up' : 'down'
    }
  }));
}

// Initialize WebSocket subscriptions
export function initializeRealtimeUpdates(): () => void {
  const ws = getWebSocketManager();
  if (!ws) return () => {};

  // Subscribe to different channels
  const unsubMetrics = ws.subscribe('metrics', handleMetricsMessage);
  const unsubHealth = ws.subscribe('health', handleHealthMessage);
  const unsubTraffic = ws.subscribe('traffic', handleTrafficMessage);
  const unsubAlerts = ws.subscribe('alerts', handleAlertMessage);
  const unsubLanes = ws.subscribe('circuit-breakers', handleLaneUpdate);
  const unsubSystem = ws.subscribe('system', (msg) => {
    if (msg.type === 'connection_status') {
      handleConnectionStatus(msg.data.connected);
    }
  });

  // Mark as connected when initialized
  isRealtimeConnected.set(true);

  // Return cleanup function
  return () => {
    unsubMetrics();
    unsubHealth();
    unsubTraffic();
    unsubAlerts();
    unsubLanes();
    unsubSystem();
    isRealtimeConnected.set(false);
  };
}

// Actions
export const liveDashboardActions = {
  acknowledgeAlert: (alertId: string) => {
    systemAlerts.update(alerts =>
      alerts.map(a => a.id === alertId ? { ...a, acknowledged: true } : a)
    );
  },

  acknowledgeAllAlerts: () => {
    systemAlerts.update(alerts =>
      alerts.map(a => ({ ...a, acknowledged: true }))
    );
  },

  clearOldAlerts: (maxAgeMinutes: number = 60) => {
    const cutoff = new Date(Date.now() - maxAgeMinutes * 60 * 1000);
    systemAlerts.update(alerts =>
      alerts.filter(a => new Date(a.timestamp) > cutoff || !a.acknowledged)
    );
  },

  dismissIssue: (issueId: string) => {
    systemHealth.update(health => ({
      ...health,
      issues: health.issues.filter(i => i.id !== issueId)
    }));
  },

  // Request manual refresh from server
  requestRefresh: () => {
    const ws = getWebSocketManager();
    if (ws) {
      ws.send({ type: 'request_refresh', channels: ['metrics', 'health', 'traffic'] });
    }
  }
};

// Helper to format bytes
export function formatBytes(bytes: number, decimals = 2): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}

// Helper to format duration
export function formatDuration(ms: number): string {
  if (ms < 1000) return `${ms}ms`;
  if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`;
  if (ms < 3600000) return `${(ms / 60000).toFixed(0)}m`;
  return `${(ms / 3600000).toFixed(1)}h`;
}
