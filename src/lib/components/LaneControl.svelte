<script lang="ts">
  import { Power, Server, AlertTriangle } from 'lucide-svelte';
  import type { Lane } from '$lib/types';

  export let lane: Lane;
  export let onToggle: (laneId: string, level: 'edge' | 'enterprise', status: string) => void;
  export let onFlipDown: () => void;

  function handleEdgeToggle() {
    const newStatus = lane.edgeStatus === 'active' ? 'inactive' : 'active';
    onToggle(lane.id, 'edge', newStatus);
  }

  function handleEnterpriseToggle() {
    const newStatus = lane.enterpriseStatus === 'active' ? 'inactive' : 'active';
    onToggle(lane.id, 'enterprise', newStatus);
  }

  function getStatusColor(status: string) {
    switch (status) {
      case 'active':
        return 'text-success-600';
      case 'inactive':
        return 'text-warning-600';
      case 'closed':
        return 'text-danger-600';
      default:
        return 'text-gray-600';
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
</script>

<div class="card p-6">
  <!-- Lane Header -->
  <div class="flex items-center justify-between mb-6">
    <h3 class="text-lg font-semibold text-gray-900 dark:text-white">{lane.name}</h3>
    <div class="flex items-center space-x-2">
      <div class="w-2 h-2 rounded-full {getHealthColor(lane.healthStatus)}"></div>
      <span class="text-sm font-medium {getHealthColor(lane.healthStatus)}">
        {lane.healthStatus}
      </span>
    </div>
  </div>

  <!-- Edge Circuit Breaker Control -->
  <div class="mb-6">
    <div class="flex items-center justify-between mb-3">
      <div class="flex items-center space-x-2">
        <Server class="h-4 w-4 text-gray-500" />
        <span class="text-sm font-medium text-gray-700 dark:text-gray-300">Edge Circuit Breaker</span>
      </div>
      <span class="text-xs px-2 py-1 rounded-full {lane.edgeStatus === 'active' ? 'bg-success-100 text-success-800 dark:bg-success-900 dark:text-success-200' : lane.edgeStatus === 'inactive' ? 'bg-warning-100 text-warning-800 dark:bg-warning-900 dark:text-warning-200' : 'bg-danger-100 text-danger-800 dark:bg-danger-900 dark:text-danger-200'}">
        {lane.edgeStatus}
      </span>
    </div>
    <div class="flex items-center justify-between">
      <span class="text-sm text-gray-600 dark:text-gray-400">Enable/Disable</span>
      <button
        class="relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2
          {lane.edgeStatus === 'active' ? 'bg-primary-600' : 'bg-gray-200 dark:bg-gray-700'}"
        on:click={handleEdgeToggle}
        aria-label={`Toggle edge circuit breaker for ${lane.name}`}
        disabled={lane.edgeStatus === 'closed'}
      >
        <span
          class="inline-block h-4 w-4 transform rounded-full bg-white transition-transform
            {lane.edgeStatus === 'active' ? 'translate-x-6' : 'translate-x-1'}"
        ></span>
      </button>
    </div>
  </div>

  <!-- Enterprise Circuit Breaker Control -->
  <div class="mb-6">
    <div class="flex items-center justify-between mb-3">
      <div class="flex items-center space-x-2">
        <Power class="h-4 w-4 text-gray-500" />
        <span class="text-sm font-medium text-gray-700 dark:text-gray-300">Enterprise Circuit Breaker</span>
      </div>
      <span class="text-xs px-2 py-1 rounded-full {lane.enterpriseStatus === 'active' ? 'bg-success-100 text-success-800 dark:bg-success-900 dark:text-success-200' : lane.enterpriseStatus === 'inactive' ? 'bg-warning-100 text-warning-800 dark:bg-warning-900 dark:text-warning-200' : 'bg-danger-100 text-danger-800 dark:bg-danger-900 dark:text-danger-200'}">
        {lane.enterpriseStatus}
      </span>
    </div>
    <div class="flex items-center justify-between">
      <span class="text-sm text-gray-600 dark:text-gray-400">Enable/Disable</span>
      <button
        class="relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2
          {lane.enterpriseStatus === 'active' ? 'bg-primary-600' : 'bg-gray-200 dark:bg-gray-700'}"
        on:click={handleEnterpriseToggle}
        aria-label={`Toggle enterprise circuit breaker for ${lane.name}`}
        disabled={lane.enterpriseStatus === 'closed'}
      >
        <span
          class="inline-block h-4 w-4 transform rounded-full bg-white transition-transform
            {lane.enterpriseStatus === 'active' ? 'translate-x-6' : 'translate-x-1'}"
        ></span>
      </button>
    </div>
  </div>

  <!-- Lane Statistics -->
  <div class="mb-6 space-y-2">
    <div class="flex justify-between text-sm">
      <span class="text-gray-600 dark:text-gray-400">Traffic Distribution</span>
      <span class="font-medium text-gray-900 dark:text-white">{lane.trafficDistribution.toFixed(1)}%</span>
    </div>
    <div class="flex justify-between text-sm">
      <span class="text-gray-600 dark:text-gray-400">Deployments</span>
      <span class="font-medium text-gray-900 dark:text-white">{lane.deployments.length}</span>
    </div>
    <div class="flex justify-between text-sm">
      <span class="text-gray-600 dark:text-gray-400">Total Servers</span>
      <span class="font-medium text-gray-900 dark:text-white">
        {lane.deployments.reduce((total, dep) => total + dep.servers.length, 0)}
      </span>
    </div>
  </div>

  <!-- Flip Down Button -->
  <div class="border-t border-gray-200 dark:border-gray-700 pt-4">
    <button
      class="w-full btn-danger flex items-center justify-center space-x-2"
      on:click={onFlipDown}
      disabled={lane.edgeStatus === 'closed' && lane.enterpriseStatus === 'closed'}
    >
      <AlertTriangle class="h-4 w-4" />
      <span>Flip Down Lane</span>
    </button>
    <p class="text-xs text-gray-500 dark:text-gray-400 mt-2 text-center">
      This will close both circuit breakers for this lane
    </p>
  </div>
</div>
