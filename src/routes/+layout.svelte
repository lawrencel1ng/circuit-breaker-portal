<script lang="ts">
  import '../app.css';
  import { onMount } from 'svelte';
  import { circuitBreakerStore, circuitBreakerActions } from '$lib/stores/circuitBreakerStore';
  import { workflowStore } from '$lib/stores/workflowStore';
  import { changeWindowStore } from '$lib/stores/changeWindowStore';
  import { approvalStore } from '$lib/stores/approvalStore';
  import { logStore } from '$lib/stores/logStore';
  import { themeStore } from '$lib/stores/themeStore';
  import NotificationContainer from '$lib/components/NotificationContainer.svelte';
  import type { LayoutData } from './$types';

  export let data: LayoutData;

  $: if (data.workflowRules) {
    workflowStore.setRules(data.workflowRules);
  }

  $: if (data.changeWindows) {
    changeWindowStore.setWindows(data.changeWindows);
  }

  $: if (data.circuitBreakerConfig) {
    circuitBreakerStore.set(data.circuitBreakerConfig);
  }

  $: if (data.approvalRequests) {
    approvalStore.setRequests(data.approvalRequests);
  }

  $: if (data.logs) {
    const auditLogs = data.logs.audit.map((l: any) => ({
      id: l.id,
      timestamp: new Date(l.timestamp).toISOString(),
      user: l.user,
      action: l.action,
      target: l.lane,
      details: l.message || (typeof l.details === 'string' ? l.details : JSON.stringify(l.details)),
      status: l.status,
      ipAddress: 'N/A'
    }));

    const appLogs = data.logs.system.map((l: any) => ({
      id: l.id,
      timestamp: new Date(l.timestamp).toISOString(),
      level: (l.status === 'failure' ? 'error' : 'info') as 'info' | 'warn' | 'error' | 'debug',
      component: 'System',
      message: l.message || '',
      details: l.details
    }));

    logStore.setLogs(auditLogs, appLogs);
  }

  onMount(() => {
    // Initialize theme
    themeStore.init();
    
    // Only load data if user is authenticated (not on login page)
    // The data is already loaded server-side via layout.server.ts
    const isLoginPage = window.location.pathname === '/login' || window.location.pathname.startsWith('/auth/');
    
    if (!isLoginPage && typeof window !== 'undefined' && typeof fetch !== 'undefined') {
      circuitBreakerActions.loadConfig();
      approvalStore.loadRequests();
      logStore.loadLogs();
    }
  });
</script>

<slot />

<NotificationContainer />
