<script lang="ts">
  import { Activity, Server, Users, AlertTriangle } from 'lucide-svelte';
  import type { Lane } from '$lib/types';

  export let lane: Lane;

  function getStatusColor(status: string) {
    switch (status) {
      case 'active':
        return 'bg-success-100 text-success-800 dark:bg-success-900 dark:text-success-200';
      case 'inactive':
        return 'bg-warning-100 text-warning-800 dark:bg-warning-900 dark:text-warning-200';
      case 'closed':
        return 'bg-danger-100 text-danger-800 dark:bg-danger-900 dark:text-danger-200';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
    }
  }

  function getHealthColor(health: string) {
    switch (health) {
      case 'healthy':
        return 'text-success-600';
      case 'degraded':
        return 'text-warning-600';
      case 'down':
        return 'text-danger-600';
      default:
        return 'text-gray-600';
    }
  }

  function getHealthIcon(health: string) {
    switch (health) {
      case 'healthy':
        return '●';
      case 'degraded':
        return '⚠';
      case 'down':
        return '●';
      default:
        return '○';
    }
  }
</script>

<div class="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6 hover:shadow-md transition-shadow duration-200">
  <!-- Lane Header -->
  <div class="flex items-center justify-between mb-4">
    <h3 class="text-lg font-semibold text-gray-900 dark:text-white">{lane.name}</h3>
    <div class="flex items-center space-x-2">
      <span class="text-sm {getHealthColor(lane.healthStatus)}">
        {getHealthIcon(lane.healthStatus)}
      </span>
      <span class="text-sm font-medium {getHealthColor(lane.healthStatus)}">
        {lane.healthStatus}
      </span>
    </div>
  </div>

  <!-- Status Indicators -->
  <div class="space-y-3 mb-4">
    <div class="flex items-center justify-between">
      <span class="text-sm text-gray-600 dark:text-gray-400">Edge Status</span>
      <span class="status-indicator {getStatusColor(lane.edgeStatus)}">
        {lane.edgeStatus}
      </span>
    </div>
    <div class="flex items-center justify-between">
      <span class="text-sm text-gray-600 dark:text-gray-400">Enterprise Status</span>
      <span class="status-indicator {getStatusColor(lane.enterpriseStatus)}">
        {lane.enterpriseStatus}
      </span>
    </div>
  </div>

  <!-- Traffic Distribution -->
  <div class="mb-4">
    <div class="flex items-center justify-between mb-2">
      <span class="text-sm text-gray-600 dark:text-gray-400">Traffic Distribution</span>
      <span class="text-sm font-medium text-gray-900 dark:text-white">
        {lane.trafficDistribution.toFixed(1)}%
      </span>
    </div>
    <div class="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
      <div
        class="bg-primary-600 h-2 rounded-full transition-all duration-300"
        style="width: {lane.trafficDistribution}%"
      ></div>
    </div>
  </div>

  <!-- Statistics -->
  <div class="grid grid-cols-2 gap-4 text-sm">
    <div class="flex items-center space-x-2">
      <Server class="h-4 w-4 text-gray-400" />
      <span class="text-gray-600 dark:text-gray-400">
        {lane.deployments?.length || 0} Deployments
      </span>
    </div>
    <div class="flex items-center space-x-2">
      <Users class="h-4 w-4 text-gray-400" />
      <span class="text-gray-600 dark:text-gray-400">
        {lane.deployments.reduce((total, dep) => total + dep.servers.length, 0)} Servers
      </span>
    </div>
  </div>

  <!-- Health Issues Warning -->
  {#if lane.healthStatus === 'degraded' || lane.healthStatus === 'down'}
    <div class="mt-4 p-3 bg-warning-50 dark:bg-warning-900/20 border border-warning-200 dark:border-warning-800 rounded-md">
      <div class="flex items-center space-x-2">
        <AlertTriangle class="h-4 w-4 text-warning-600" />
        <span class="text-sm text-warning-800 dark:text-warning-200">
          {lane.healthStatus === 'down' ? 'Lane is down - check servers' : 'Performance issues detected'}
        </span>
      </div>
    </div>
  {/if}
</div>
