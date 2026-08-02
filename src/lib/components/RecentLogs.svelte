<script lang="ts">
  import { Clock, User, Activity } from 'lucide-svelte';
  import type { CircuitBreakerConfig, AutomationLog } from '$lib/types';

  export let config: CircuitBreakerConfig | undefined;

  $: recentLogs = config?.automationLogs?.slice(0, 5) || [];

  function getStatusColor(status: string) {
    switch (status) {
      case 'success':
        return 'text-success-600';
      case 'error':
        return 'text-danger-600';
      case 'warning':
        return 'text-warning-600';
      default:
        return 'text-gray-600';
    }
  }

  function getStatusIcon(status: string) {
    switch (status) {
      case 'success':
        return '✓';
      case 'error':
        return '✗';
      case 'warning':
        return '⚠';
      default:
        return '•';
    }
  }

  function formatTimestamp(timestamp: string) {
    return new Date(timestamp).toLocaleString();
  }
</script>

<div class="card p-6">
  <div class="flex items-center justify-between mb-4">
    <h3 class="text-lg font-semibold text-gray-900 dark:text-white">Recent Activity</h3>
    <a href="/logs" class="text-sm text-primary-600 hover:text-primary-700 dark:text-primary-400 dark:hover:text-primary-300">
      View all logs
    </a>
  </div>

  <div class="space-y-4">
    {#each recentLogs as log (log.id)}
      <div class="flex items-start space-x-3 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
        <div class="flex-shrink-0 mt-1">
          <div class="w-2 h-2 rounded-full {getStatusColor(log.status)}"></div>
        </div>
        <div class="flex-1 min-w-0">
          <div class="flex items-center space-x-2 mb-1">
            <span class="text-sm font-medium text-gray-900 dark:text-white">
              {log.action.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
            </span>
            <span class="text-xs {getStatusColor(log.status)}">
              {getStatusIcon(log.status)}
            </span>
          </div>
          <p class="text-sm text-gray-600 dark:text-gray-400 mb-2">
            {log.details}
          </p>
          <div class="flex items-center space-x-4 text-xs text-gray-500 dark:text-gray-400">
            <div class="flex items-center space-x-1">
              <Clock class="h-3 w-3" />
              <span>{formatTimestamp(log.timestamp)}</span>
            </div>
            <div class="flex items-center space-x-1">
              <User class="h-3 w-3" />
              <span>{log.user}</span>
            </div>
            <div class="flex items-center space-x-1">
              <Activity class="h-3 w-3" />
              <span>{log.lane}</span>
            </div>
          </div>
        </div>
      </div>
    {/each}

    {#if recentLogs.length === 0}
      <div class="text-center py-8">
        <Activity class="h-12 w-12 text-gray-400 mx-auto mb-4" />
        <p class="text-gray-500 dark:text-gray-400">No recent activity</p>
      </div>
    {/if}
  </div>
</div>
