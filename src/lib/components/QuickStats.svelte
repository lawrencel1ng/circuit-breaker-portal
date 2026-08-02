<script lang="ts">
  import { Activity, Server, AlertTriangle, CheckCircle } from 'lucide-svelte';
  import type { CircuitBreakerConfig } from '$lib/types';

  export let config: CircuitBreakerConfig | undefined;

  $: totalLanes = config?.lanes?.length || 0;
  $: activeLanes = config?.lanes?.filter(lane => lane.edgeStatus === 'active' && lane.enterpriseStatus === 'active').length || 0;
  $: healthyLanes = config?.lanes?.filter(lane => lane.healthStatus === 'healthy').length || 0;
  $: totalDeployments = config?.lanes?.reduce((total, lane) => total + (lane.deployments?.length || 0), 0) || 0;
  $: totalServers = config?.lanes?.reduce((total, lane) => 
    total + (lane.deployments?.reduce((depTotal, dep) => {
      const servers = Array.isArray(dep.servers) ? dep.servers : [];
      return depTotal + servers.length;
    }, 0) || 0), 0) || 0;
  $: healthyServers = config?.lanes?.reduce((total, lane) => 
    total + (lane.deployments?.reduce((depTotal, dep) => {
      const servers = Array.isArray(dep.servers) ? dep.servers : [];
      return depTotal + servers.filter((s: any) => s.health === 'healthy').length;
    }, 0) || 0), 0) || 0;
</script>

<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
  <!-- Total Lanes -->
  <div class="card p-6">
    <div class="flex items-center">
      <div class="flex-shrink-0">
        <Activity class="h-8 w-8 text-primary-600" />
      </div>
      <div class="ml-4">
        <p class="text-sm font-medium text-gray-600 dark:text-gray-400">Total Lanes</p>
        <p class="text-2xl font-semibold text-gray-900 dark:text-white">{totalLanes}</p>
      </div>
    </div>
  </div>

  <!-- Active Lanes -->
  <div class="card p-6">
    <div class="flex items-center">
      <div class="flex-shrink-0">
        <CheckCircle class="h-8 w-8 text-success-600" />
      </div>
      <div class="ml-4">
        <p class="text-sm font-medium text-gray-600 dark:text-gray-400">Active Lanes</p>
        <p class="text-2xl font-semibold text-gray-900 dark:text-white">{activeLanes}</p>
        <p class="text-xs text-gray-500 dark:text-gray-400">
          {totalLanes > 0 ? ((activeLanes / totalLanes) * 100).toFixed(1) : 0}% availability
        </p>
      </div>
    </div>
  </div>

  <!-- Deployments -->
  <div class="card p-6">
    <div class="flex items-center">
      <div class="flex-shrink-0">
        <Server class="h-8 w-8 text-primary-600" />
      </div>
      <div class="ml-4">
        <p class="text-sm font-medium text-gray-600 dark:text-gray-400">Deployments</p>
        <p class="text-2xl font-semibold text-gray-900 dark:text-white">{totalDeployments}</p>
        <p class="text-xs text-gray-500 dark:text-gray-400">
          Across {activeLanes} active lanes
        </p>
      </div>
    </div>
  </div>

  <!-- Server Health -->
  <div class="card p-6">
    <div class="flex items-center">
      <div class="flex-shrink-0">
        <AlertTriangle class="h-8 w-8 {healthyServers === totalServers ? 'text-success-600' : 'text-warning-600'}" />
      </div>
      <div class="ml-4">
        <p class="text-sm font-medium text-gray-600 dark:text-gray-400">Server Health</p>
        <p class="text-2xl font-semibold text-gray-900 dark:text-white">
          {healthyServers}/{totalServers}
        </p>
        <p class="text-xs text-gray-500 dark:text-gray-400">
          {totalServers > 0 ? ((healthyServers / totalServers) * 100).toFixed(1) : 0}% healthy
        </p>
      </div>
    </div>
  </div>
</div>
