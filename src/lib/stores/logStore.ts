import { writable } from 'svelte/store';

export type LogLevel = 'info' | 'warn' | 'error' | 'debug';

export interface AuditLog {
  id: string;
  timestamp: string;
  user: string;
  action: string;
  target?: string; // The resource being acted upon (e.g., "Workflow: SWG Whitelist")
  details: string;
  status: 'success' | 'failure';
  ipAddress?: string;
}

export interface AppLog {
  id: string;
  timestamp: string;
  level: LogLevel;
  component?: string;
  message: string;
  details?: any;
}

function createLogStore() {
  const { subscribe, update, set } = writable({
    auditLogs: [] as AuditLog[],
    appLogs: [] as AppLog[]
  });

  return {
    subscribe,
    
    setLogs: (audit: AuditLog[], system: AppLog[]) => set({ auditLogs: audit, appLogs: system }),

    loadLogs: async () => {
      if (typeof window === 'undefined' || typeof fetch === 'undefined') return;

      try {
        const [auditRes, systemRes] = await Promise.all([
          fetch('/api/logs?type=audit'),
          fetch('/api/logs?type=system')
        ]);

        const auditLogs = auditRes.ok ? await auditRes.json() : [];
        const systemLogs = systemRes.ok ? await systemRes.json() : [];

        set({
          auditLogs: auditLogs.map((l: any) => ({
            id: l.id,
            timestamp: l.timestamp,
            user: l.user,
            action: l.action,
            target: l.lane, // Mapping 'lane' to 'target' conceptually for now
            details: l.message,
            status: l.status,
            ipAddress: 'N/A' // Not capturing IP yet
          })),
          appLogs: systemLogs.map((l: any) => ({
            id: l.id,
            timestamp: l.timestamp,
            level: (l.status === 'failure' ? 'error' : 'info') as LogLevel,
            component: 'System',
            message: l.message,
            details: l.details
          }))
        });

      } catch (error) {
        console.error('Failed to load logs:', error);
      }
    },

    addAuditLog: async (log: Omit<AuditLog, 'id' | 'timestamp'>) => {
      try {
        const response = await fetch('/api/logs', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            type: 'audit',
            action: log.action,
            status: log.status,
            user: log.user,
            lane: log.target,
            details: log.details,
            message: log.details
          })
        });

        if (response.ok) {
           const newLog = await response.json();
           update(state => ({
             ...state,
             auditLogs: [{
                id: newLog.id,
                timestamp: newLog.timestamp,
                user: newLog.user,
                action: newLog.action,
                target: newLog.lane,
                details: newLog.message,
                status: newLog.status,
                ipAddress: 'N/A'
             }, ...state.auditLogs]
           }));
        }
      } catch (error) {
        console.error('Failed to add audit log:', error);
      }
    },

    addAppLog: async (log: Omit<AppLog, 'id' | 'timestamp'>) => {
      try {
        const response = await fetch('/api/logs', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            type: 'system',
            action: log.component || 'System',
            status: log.level === 'error' ? 'failure' : 'success',
            user: 'system',
            details: log.details,
            message: log.message
          })
        });

        if (response.ok) {
          const newLog = await response.json();
           update(state => ({
             ...state,
             appLogs: [{
                id: newLog.id,
                timestamp: newLog.timestamp,
                level: (newLog.status === 'failure' ? 'error' : 'info') as LogLevel,
                component: newLog.action,
                message: newLog.message,
                details: newLog.details
             }, ...state.appLogs]
           }));
        }
      } catch (error) {
         console.error('Failed to add app log:', error);
      }
    }
  };
}

export const logStore = createLogStore();
