import { writable } from 'svelte/store';
import type { CircuitBreakerConfig, Lane, Application, AutomationLog } from '../types';
import { notificationStore } from './notificationStore';

// Initial state skeleton
const initialState: CircuitBreakerConfig = {
  lanes: [],
  applications: [],
  automationLogs: [],
  globalSettings: {
    dnsServer: '10.1.1.53',
    ntpServer: '10.1.1.123',
    syslogServer: '10.1.1.200',
    healthCheckInterval: 10,
    circuitBreakerThreshold: 3,
    autoFailoverEnabled: true
  },
  alertConfig: {
    enabled: true,
    channels: [],
    rules: []
  },
  systemSettings: {
    maintenanceMode: false,
    maintenanceMessage: 'System is undergoing scheduled maintenance.',
    systemName: 'OCBC Circuit Breaker Portal',
    dataRetentionDays: 90,
    theme: 'system'
  }
};

// Create the store
export const circuitBreakerStore = writable<CircuitBreakerConfig>(initialState);

// Store methods
export const circuitBreakerActions = {
  loadConfig: async () => {
    if (typeof window === 'undefined' || typeof fetch === 'undefined') return;

    try {
      const response = await fetch('/api/config');
      if (!response.ok) {
        // Don't show error for auth failures (401) or redirects (302) - expected when not logged in
        if (response.status === 401 || response.status === 302 || response.status === 307) {
          console.debug('Config load skipped - not authenticated');
          return;
        }
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const config = await response.json();
      circuitBreakerStore.set(config);
    } catch (error) {
      console.error('Failed to load configuration:', error);
      notificationStore.add({
        type: 'error',
        title: 'Error',
        message: 'Failed to load configuration'
      });
    }
  },

  updateLaneStatus: async (laneId: string, edgeStatus: Lane['edgeStatus'], enterpriseStatus: Lane['enterpriseStatus']) => {
    try {
      const response = await fetch(`/api/lanes/${laneId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ edgeStatus, enterpriseStatus })
      });
      
      if (!response.ok) throw new Error('Failed to update lane status');
      
      const updatedLane = await response.json();
      
      circuitBreakerStore.update(config => ({
        ...config,
        lanes: config.lanes.map(l => l.id === laneId ? { ...l, ...updatedLane } : l)
      }));
      
      notificationStore.add({
        type: 'success',
        title: 'Lane Updated',
        message: `Lane ${updatedLane.name} status updated successfully`
      });

    } catch (error) {
      console.error('Failed to update lane status:', error);
      notificationStore.add({
        type: 'error',
        title: 'Update Failed',
        message: 'Failed to update lane status'
      });
    }
  },

  flipDownLane: async (laneId: string) => {
    try {
      const response = await fetch(`/api/lanes/${laneId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          edgeStatus: 'closed',
          enterpriseStatus: 'closed',
          healthStatus: 'down',
          action: 'lane_flipped_down',
          message: `Lane ${laneId} flipped down manually`
        })
      });

      if (!response.ok) throw new Error('Failed to flip down lane');
      
      const updatedLane = await response.json();
      
      circuitBreakerStore.update(config => ({
        ...config,
        lanes: config.lanes.map(l => l.id === laneId ? { ...l, ...updatedLane } : l)
      }));
      
      notificationStore.add({
        type: 'success',
        title: 'Lane Flipped Down',
        message: `Lane ${updatedLane.name} flipped down successfully`
      });
    } catch (error) {
      console.error('Failed to flip down lane:', error);
      notificationStore.add({
        type: 'error',
        title: 'Operation Failed',
        message: 'Failed to flip down lane'
      });
    }
  },

  addApplication: async (application: Omit<Application, 'id'>) => {
    try {
      const response = await fetch('/api/deployments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(application)
      });

      if (!response.ok) throw new Error('Failed to deploy application');
      
      const newApp = await response.json();
      
      circuitBreakerStore.update(config => ({
        ...config,
        applications: [newApp, ...config.applications]
      }));
      
      // Also add a log entry locally or fetch logs
      const logEntry: AutomationLog = {
        id: `log_${Date.now()}`,
        timestamp: new Date().toISOString(),
        lane: 'all',
        action: 'application_deployed',
        user: 'admin',
        details: `Application ${application.name} deployed`,
        status: 'success'
      };
      
      circuitBreakerStore.update(config => ({
        ...config,
        automationLogs: [logEntry, ...config.automationLogs]
      }));

      notificationStore.add({
        type: 'success',
        title: 'Deployment Started',
        message: `Application ${application.name} deployment initiated`
      });

    } catch (error) {
      console.error('Failed to add application:', error);
      notificationStore.add({
        type: 'error',
        title: 'Deployment Failed',
        message: 'Failed to deploy application'
      });
      throw error; // Re-throw to handle UI feedback
    }
  },

  addLogEntry: async (logEntry: Omit<AutomationLog, 'id'>) => {
    try {
      const response = await fetch('/api/logs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(logEntry)
      });

      if (!response.ok) throw new Error('Failed to add log entry');
      
      const newLog = await response.json();
      
      circuitBreakerStore.update(config => ({
        ...config,
        automationLogs: [newLog, ...config.automationLogs]
      }));
    } catch (error) {
      console.error('Failed to add log entry:', error);
    }
  }
};
