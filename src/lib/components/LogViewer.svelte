<script lang="ts">
  import { onMount } from 'svelte';
  import { Search, Filter, Download, Calendar, User, Activity, AlertCircle, CheckCircle, AlertTriangle } from 'lucide-svelte';
  import type { CircuitBreakerConfig, AutomationLog } from '$lib/types';

  export let config: CircuitBreakerConfig | undefined;

  let searchTerm = '';
  let selectedLane = 'all';
  let selectedAction = 'all';
  let selectedStatus = 'all';
  let dateFrom = '';
  let dateTo = '';
  let filteredLogs: AutomationLog[] = [];

  // Set default date range to 7 days ago to current date
  onMount(() => {
    const now = new Date();
    const sevenDaysAgo = new Date(now.getTime() - (7 * 24 * 60 * 60 * 1000));
    
    // Format dates for datetime-local input (YYYY-MM-DDTHH:MM)
    dateTo = now.toISOString().slice(0, 16);
    dateFrom = sevenDaysAgo.toISOString().slice(0, 16);
  });

  const lanes = [
    { value: 'all', label: 'All Lanes' },
    { value: 'lane1', label: 'Lane 1' },
    { value: 'lane2', label: 'Lane 2' },
    { value: 'lane3', label: 'Lane 3' }
  ];

  const actions = [
    { value: 'all', label: 'All Actions' },
    { value: 'lane_activated', label: 'Lane Activated' },
    { value: 'lane_deactivated', label: 'Lane Deactivated' },
    { value: 'lane_flipped_down', label: 'Lane Flipped Down' },
    { value: 'application_deployed', label: 'Application Deployed' },
    { value: 'configuration_changed', label: 'Configuration Changed' },
    { value: 'health_check_failed', label: 'Health Check Failed' },
    { value: 'circuit_breaker_triggered', label: 'Circuit Breaker Triggered' }
  ];

  const statuses = [
    { value: 'all', label: 'All Statuses' },
    { value: 'success', label: 'Success' },
    { value: 'warning', label: 'Warning' },
    { value: 'error', label: 'Error' }
  ];

  $: filteredLogs = filterLogs();

  function filterLogs() {
    if (!config) return [];
    let logs = config.automationLogs || [];

    // Search filter
    if (searchTerm) {
      logs = logs.filter(log => 
        log.details.toLowerCase().includes(searchTerm.toLowerCase()) ||
        log.action.toLowerCase().includes(searchTerm.toLowerCase()) ||
        log.user.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Lane filter
    if (selectedLane !== 'all') {
      logs = logs.filter(log => log.lane === selectedLane);
    }

    // Action filter
    if (selectedAction !== 'all') {
      logs = logs.filter(log => log.action === selectedAction);
    }

    // Status filter
    if (selectedStatus !== 'all') {
      logs = logs.filter(log => log.status === selectedStatus);
    }

    // Date filters
    if (dateFrom) {
      logs = logs.filter(log => new Date(log.timestamp) >= new Date(dateFrom));
    }
    if (dateTo) {
      logs = logs.filter(log => new Date(log.timestamp) <= new Date(dateTo));
    }

    return logs;
  }

  function getStatusIcon(status: string) {
    switch (status) {
      case 'success':
        return CheckCircle;
      case 'error':
        return AlertCircle;
      case 'warning':
        return AlertTriangle;
      default:
        return Activity;
    }
  }

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

  function formatTimestamp(timestamp: string) {
    return new Date(timestamp).toLocaleString();
  }

  function exportLogs() {
    const csvContent = [
      ['Timestamp', 'Lane', 'Action', 'User', 'Details', 'Status'],
      ...filteredLogs.map(log => [
        log.timestamp,
        log.lane,
        log.action,
        log.user,
        log.details,
        log.status
      ])
    ].map(row => row.map(field => `"${field}"`).join(',')).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `circuit-breaker-logs-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  }

  function clearFilters() {
    searchTerm = '';
    selectedLane = 'all';
    selectedAction = 'all';
    selectedStatus = 'all';
    dateFrom = '';
    dateTo = '';
  }
</script>

{#if config}
<div class="space-y-6">
  <!-- Filters -->
  <div class="card p-6">
    <div class="flex items-center justify-between mb-4">
      <h3 class="text-lg font-semibold text-gray-900 dark:text-white">Filter Logs</h3>
      <div class="flex items-center space-x-2">
        <button
          class="btn-secondary text-sm"
          on:click={clearFilters}
        >
          Clear Filters
        </button>
        <button
          class="btn-primary text-sm flex items-center space-x-2"
          on:click={exportLogs}
        >
          <Download class="h-4 w-4" />
          <span>Export CSV</span>
        </button>
      </div>
    </div>

    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      <!-- Search -->
      <div>
        <label for="logs-search" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Search
        </label>
        <div class="relative">
          <Search class="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            id="logs-search"
            type="text"
            bind:value={searchTerm}
            placeholder="Search logs..."
            class="w-full pl-10 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 dark:bg-gray-700 dark:text-white"
          />
        </div>
      </div>

      <!-- Lane Filter -->
      <div>
        <label for="logs-lane" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Lane
        </label>
        <select
          id="logs-lane"
          bind:value={selectedLane}
          class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 dark:bg-gray-700 dark:text-white"
        >
          {#each lanes as lane (lane.value)}
            <option value={lane.value}>{lane.label}</option>
          {/each}
        </select>
      </div>

      <!-- Action Filter -->
      <div>
        <label for="logs-action" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Action
        </label>
        <select
          id="logs-action"
          bind:value={selectedAction}
          class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 dark:bg-gray-700 dark:text-white"
        >
          {#each actions as action (action.value)}
            <option value={action.value}>{action.label}</option>
          {/each}
        </select>
      </div>

      <!-- Status Filter -->
      <div>
        <label for="logs-status" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Status
        </label>
        <select
          id="logs-status"
          bind:value={selectedStatus}
          class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 dark:bg-gray-700 dark:text-white"
        >
          {#each statuses as status (status.value)}
            <option value={status.value}>{status.label}</option>
          {/each}
        </select>
      </div>

      <!-- Date From -->
      <div>
        <label for="logs-from" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          From Date
        </label>
        <input
          id="logs-from"
          type="datetime-local"
          bind:value={dateFrom}
          class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 dark:bg-gray-700 dark:text-white"
        />
      </div>

      <!-- Date To -->
      <div>
        <label for="logs-to" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          To Date
        </label>
        <input
          id="logs-to"
          type="datetime-local"
          bind:value={dateTo}
          class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 dark:bg-gray-700 dark:text-white"
        />
      </div>
    </div>
  </div>

  <!-- Logs List -->
  <div class="card p-6">
    <div class="flex items-center justify-between mb-4">
      <h3 class="text-lg font-semibold text-gray-900 dark:text-white">
        Logs ({filteredLogs.length})
      </h3>
    </div>

    <div class="space-y-4">
      {#each filteredLogs as log (log.id)}
        <div class="flex items-start space-x-4 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
          <div class="flex-shrink-0 mt-1">
            <svelte:component this={getStatusIcon(log.status)} class="h-5 w-5 {getStatusColor(log.status)}" />
          </div>
          <div class="flex-1 min-w-0">
            <div class="flex items-center space-x-2 mb-1">
              <span class="text-sm font-medium text-gray-900 dark:text-white">
                {log.action.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
              </span>
              <span class="text-xs px-2 py-1 rounded-full bg-primary-100 text-primary-800 dark:bg-primary-900 dark:text-primary-200">
                {log.lane}
              </span>
            </div>
            <p class="text-sm text-gray-600 dark:text-gray-400 mb-2">
              {log.details}
            </p>
            <div class="flex items-center space-x-4 text-xs text-gray-500 dark:text-gray-400">
              <div class="flex items-center space-x-1">
                <Calendar class="h-3 w-3" />
                <span>{formatTimestamp(log.timestamp)}</span>
              </div>
              <div class="flex items-center space-x-1">
                <User class="h-3 w-3" />
                <span>{log.user}</span>
              </div>
            </div>
          </div>
        </div>
      {/each}

      {#if filteredLogs.length === 0}
        <div class="text-center py-8">
          <Activity class="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <p class="text-gray-500 dark:text-gray-400">No logs found matching your filters</p>
        </div>
      {/if}
    </div>
  </div>
</div>
{/if}
