<script lang="ts">
  import { onMount, onDestroy } from 'svelte';
  import { 
    Activity, 
    Database, 
    Wifi, 
    Server, 
    AlertCircle, 
    CheckCircle, 
    XCircle,
    RefreshCw,
    Bell
  } from 'lucide-svelte';
  import { 
    systemHealth, 
    healthScore, 
    activeAlerts, 
    criticalAlerts,
    isRealtimeConnected,
    liveDashboardActions,
    type SystemIssue,
    type SystemAlert
  } from '$lib/stores/liveDashboardStore';
  import { notificationStore } from '$lib/stores/notificationStore';

  let showDetails = false;
  let showAlerts = false;
  let refreshInterval: ReturnType<typeof setInterval>;

  onMount(() => {
    // Auto-refresh every 30 seconds
    refreshInterval = setInterval(() => {
      liveDashboardActions.requestRefresh();
    }, 30000);
  });

  onDestroy(() => {
    if (refreshInterval) clearInterval(refreshInterval);
  });

  function getStatusColor(status: string): string {
    switch (status) {
      case 'up':
      case 'healthy':
        return 'text-green-500';
      case 'down':
      case 'critical':
        return 'text-red-500';
      case 'degraded':
        return 'text-yellow-500';
      default:
        return 'text-gray-500';
    }
  }

  function getStatusBg(status: string): string {
    switch (status) {
      case 'up':
      case 'healthy':
        return 'bg-green-100 dark:bg-green-900';
      case 'down':
      case 'critical':
        return 'bg-red-100 dark:bg-red-900';
      case 'degraded':
        return 'bg-yellow-100 dark:bg-yellow-900';
      default:
        return 'bg-gray-100 dark:bg-gray-700';
    }
  }

  function getHealthScoreColor(score: number): string {
    if (score >= 90) return 'text-green-500';
    if (score >= 70) return 'text-yellow-500';
    if (score >= 50) return 'text-orange-500';
    return 'text-red-500';
  }

  function getSeverityColor(severity: string): string {
    switch (severity) {
      case 'critical':
        return 'text-red-600 bg-red-100 dark:bg-red-900 dark:text-red-200';
      case 'warning':
        return 'text-yellow-600 bg-yellow-100 dark:bg-yellow-900 dark:text-yellow-200';
      default:
        return 'text-blue-600 bg-blue-100 dark:bg-blue-900 dark:text-blue-200';
    }
  }

  function getAlertTypeColor(type: string): string {
    switch (type) {
      case 'critical':
        return 'text-red-600 bg-red-50 border-red-200 dark:bg-red-900/20 dark:border-red-800';
      case 'warning':
        return 'text-yellow-600 bg-yellow-50 border-yellow-200 dark:bg-yellow-900/20 dark:border-yellow-800';
      case 'success':
        return 'text-green-600 bg-green-50 border-green-200 dark:bg-green-900/20 dark:border-green-800';
      default:
        return 'text-blue-600 bg-blue-50 border-blue-200 dark:bg-blue-900/20 dark:border-blue-800';
    }
  }

  function handleRefresh() {
    liveDashboardActions.requestRefresh();
    notificationStore.add({
      type: 'info',
      title: 'Refreshing',
      message: 'System status refresh requested'
    });
  }

  function acknowledgeAlert(alertId: string) {
    liveDashboardActions.acknowledgeAlert(alertId);
  }

  function dismissIssue(issueId: string) {
    liveDashboardActions.dismissIssue(issueId);
  }

  $: healthScoreValue = $healthScore;
  $: criticalCount = $criticalAlerts.length;
  $: activeCount = $activeAlerts.length;
</script>

<div class="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
  <!-- Header -->
  <div class="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
    <div class="flex items-center justify-between">
      <div class="flex items-center space-x-3">
        <div class="w-10 h-10 rounded-full {getStatusBg($systemHealth.status)} flex items-center justify-center">
          <Activity class="h-5 w-5 {getStatusColor($systemHealth.status)}" />
        </div>
        <div>
          <h2 class="text-lg font-semibold text-gray-900 dark:text-white">System Health</h2>
          <p class="text-sm text-gray-500 dark:text-gray-400">
            Last checked: {new Date($systemHealth.lastChecked).toLocaleTimeString()}
          </p>
        </div>
      </div>
      <div class="flex items-center space-x-4">
        <!-- Health Score -->
        <div class="text-center">
          <div class="text-2xl font-bold {getHealthScoreColor(healthScoreValue)}">
            {healthScoreValue}%
          </div>
          <div class="text-xs text-gray-500 dark:text-gray-400">Health Score</div>
        </div>
        
        <!-- Real-time indicator -->
        <div class="flex items-center space-x-2">
          <span class="relative flex h-3 w-3">
            {#if $isRealtimeConnected}
              <span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
              <span class="relative inline-flex rounded-full h-3 w-3 bg-green-500"></span>
            {:else}
              <span class="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
            {/if}
          </span>
          <span class="text-sm text-gray-600 dark:text-gray-400">
            {$isRealtimeConnected ? 'Live' : 'Offline'}
          </span>
        </div>
        
        <button
          on:click={handleRefresh}
          class="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
        >
          <RefreshCw class="h-5 w-5" />
        </button>
      </div>
    </div>
  </div>

  <!-- Component Status -->
  <div class="p-6">
    <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
      <!-- F5 Connection -->
      <div class="flex items-center space-x-3 p-3 rounded-lg border border-gray-200 dark:border-gray-700">
        <div class="w-8 h-8 rounded-full {getStatusBg($systemHealth.components.f5Connection)} flex items-center justify-center">
          <Server class="h-4 w-4 {getStatusColor($systemHealth.components.f5Connection)}" />
        </div>
        <div>
          <div class="text-sm font-medium text-gray-900 dark:text-white">F5 Connection</div>
          <div class="text-xs {getStatusColor($systemHealth.components.f5Connection)}">
            {$systemHealth.components.f5Connection === 'up' ? 'Connected' : $systemHealth.components.f5Connection}
          </div>
        </div>
      </div>

      <!-- Database -->
      <div class="flex items-center space-x-3 p-3 rounded-lg border border-gray-200 dark:border-gray-700">
        <div class="w-8 h-8 rounded-full {getStatusBg($systemHealth.components.database)} flex items-center justify-center">
          <Database class="h-4 w-4 {getStatusColor($systemHealth.components.database)}" />
        </div>
        <div>
          <div class="text-sm font-medium text-gray-900 dark:text-white">Database</div>
          <div class="text-xs {getStatusColor($systemHealth.components.database)}">
            {$systemHealth.components.database === 'up' ? 'Operational' : 'Down'}
          </div>
        </div>
      </div>

      <!-- WebSocket -->
      <div class="flex items-center space-x-3 p-3 rounded-lg border border-gray-200 dark:border-gray-700">
        <div class="w-8 h-8 rounded-full {getStatusBg($systemHealth.components.websocket)} flex items-center justify-center">
          <Wifi class="h-4 w-4 {getStatusColor($systemHealth.components.websocket)}" />
        </div>
        <div>
          <div class="text-sm font-medium text-gray-900 dark:text-white">WebSocket</div>
          <div class="text-xs {getStatusColor($systemHealth.components.websocket)}">
            {$systemHealth.components.websocket === 'up' ? 'Connected' : 'Disconnected'}
          </div>
        </div>
      </div>

      <!-- API -->
      <div class="flex items-center space-x-3 p-3 rounded-lg border border-gray-200 dark:border-gray-700">
        <div class="w-8 h-8 rounded-full {getStatusBg($systemHealth.components.api)} flex items-center justify-center">
          <Activity class="h-4 w-4 {getStatusColor($systemHealth.components.api)}" />
        </div>
        <div>
          <div class="text-sm font-medium text-gray-900 dark:text-white">API</div>
          <div class="text-xs {getStatusColor($systemHealth.components.api)}">
            {$systemHealth.components.api === 'up' ? 'Operational' : 'Down'}
          </div>
        </div>
      </div>
    </div>

    <!-- Alerts Section -->
    {#if activeCount > 0}
      <div class="mt-6">
        <button
          on:click={() => showAlerts = !showAlerts}
          class="flex items-center justify-between w-full p-3 rounded-lg border {criticalCount > 0 ? 'bg-red-50 border-red-200 dark:bg-red-900/20 dark:border-red-800' : 'bg-yellow-50 border-yellow-200 dark:bg-yellow-900/20 dark:border-yellow-800'}"
        >
          <div class="flex items-center space-x-3">
            <Bell class="h-5 w-5 {criticalCount > 0 ? 'text-red-600 dark:text-red-400' : 'text-yellow-600 dark:text-yellow-400'}" />
            <div>
              <span class="font-medium {criticalCount > 0 ? 'text-red-900 dark:text-red-200' : 'text-yellow-900 dark:text-yellow-200'}">
                {activeCount} Active Alert{activeCount !== 1 ? 's' : ''}
              </span>
              {#if criticalCount > 0}
                <span class="ml-2 text-sm text-red-700 dark:text-red-300">({criticalCount} critical)</span>
              {/if}
            </div>
          </div>
          <span class="text-sm text-gray-500">{showAlerts ? 'Hide' : 'Show'}</span>
        </button>

        {#if showAlerts}
          <div class="mt-3 space-y-2">
            {#each $activeAlerts.slice(0, 5) as alert}
              <div class="flex items-center justify-between p-3 rounded-lg border {getAlertTypeColor(alert.type)}">
                <div class="flex items-start space-x-3">
                  {#if alert.type === 'critical'}
                    <AlertCircle class="h-5 w-5 text-red-600 dark:text-red-400 flex-shrink-0" />
                  {:else if alert.type === 'warning'}
                    <AlertCircle class="h-5 w-5 text-yellow-600 dark:text-yellow-400 flex-shrink-0" />
                  {:else if alert.type === 'success'}
                    <CheckCircle class="h-5 w-5 text-green-600 dark:text-green-400 flex-shrink-0" />
                  {:else}
                    <Activity class="h-5 w-5 text-blue-600 dark:text-blue-400 flex-shrink-0" />
                  {/if}
                  <div>
                    <div class="font-medium">{alert.title}</div>
                    <div class="text-sm opacity-80">{alert.message}</div>
                    <div class="text-xs opacity-60 mt-1">
                      {new Date(alert.timestamp).toLocaleString()} • {alert.source}
                    </div>
                  </div>
                </div>
                <button
                  on:click={() => acknowledgeAlert(alert.id)}
                  class="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                >
                  <XCircle class="h-5 w-5" />
                </button>
              </div>
            {/each}
            
            {#if $activeAlerts.length > 5}
              <div class="text-center text-sm text-gray-500 dark:text-gray-400 py-2">
                +{$activeAlerts.length - 5} more alerts
              </div>
            {/if}
            
            <button
              on:click={() => liveDashboardActions.acknowledgeAllAlerts()}
              class="w-full py-2 text-sm text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-200 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700"
            >
              Acknowledge All Alerts
            </button>
          </div>
        {/if}
      </div>
    {/if}

    <!-- Issues Section -->
    {#if $systemHealth.issues.length > 0}
      <div class="mt-6">
        <button
          on:click={() => showDetails = !showDetails}
          class="flex items-center justify-between w-full"
        >
          <span class="text-sm font-medium text-gray-900 dark:text-white">
            Active Issues ({$systemHealth.issues.length})
          </span>
          <span class="text-sm text-gray-500">{showDetails ? 'Hide' : 'Show'}</span>
        </button>

        {#if showDetails}
          <div class="mt-3 space-y-2">
            {#each $systemHealth.issues as issue}
              <div class="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                <div class="flex items-center space-x-3">
                  <span class="inline-flex items-center px-2 py-1 rounded text-xs font-medium {getSeverityColor(issue.severity)}">
                    {issue.severity}
                  </span>
                  <div>
                    <div class="text-sm font-medium text-gray-900 dark:text-white">{issue.component}</div>
                    <div class="text-sm text-gray-600 dark:text-gray-400">{issue.message}</div>
                    <div class="text-xs text-gray-500 dark:text-gray-500">
                      {new Date(issue.timestamp).toLocaleString()}
                    </div>
                  </div>
                </div>
                {#if !issue.acknowledged}
                  <button
                    on:click={() => dismissIssue(issue.id)}
                    class="text-sm text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
                  >
                    Dismiss
                  </button>
                {/if}
              </div>
            {/each}
          </div>
        {/if}
      </div>
    {/if}
  </div>
</div>
