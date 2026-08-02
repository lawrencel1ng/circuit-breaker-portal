<script lang="ts">
  import { onMount } from 'svelte';
  import { Globe, Cloud, MapPin, Activity, Zap, Shield } from 'lucide-svelte';

  let selectedRegion = 'global';
  let trafficData = {
    global: { total: 125000, healthy: 98000, degraded: 15000, down: 12000 },
    aws: { total: 45000, healthy: 42000, degraded: 2000, down: 1000 },
    azure: { total: 38000, healthy: 35000, degraded: 2000, down: 1000 },
    gcp: { total: 42000, healthy: 39000, degraded: 2000, down: 1000 }
  };

  let regions = [
    { id: 'us-east-1', name: 'US East (N. Virginia)', provider: 'AWS', status: 'healthy', latency: 45 },
    { id: 'us-west-2', name: 'US West (Oregon)', provider: 'AWS', status: 'healthy', latency: 52 },
    { id: 'eastus', name: 'East US', provider: 'Azure', status: 'degraded', latency: 38 },
    { id: 'westeurope', name: 'West Europe', provider: 'Azure', status: 'healthy', latency: 67 },
    { id: 'asia-southeast1', name: 'Asia Southeast', provider: 'GCP', status: 'healthy', latency: 89 },
    { id: 'europe-west1', name: 'Europe West', provider: 'GCP', status: 'healthy', latency: 72 }
  ];

  let routingRules = [
    { id: 'rule1', name: 'Geographic Routing', priority: 1, condition: 'User Location', action: 'Route to nearest region', status: 'active' },
    { id: 'rule2', name: 'Health-based Failover', priority: 2, condition: 'Region health < 95%', action: 'Failover to backup', status: 'active' },
    { id: 'rule3', name: 'Latency Optimization', priority: 3, condition: 'Response time > 200ms', action: 'Switch to faster region', status: 'active' }
  ];

  function getStatusColor(status: string) {
    switch (status) {
      case 'healthy': return 'text-green-600 bg-green-100 dark:bg-green-900 dark:text-green-200';
      case 'degraded': return 'text-yellow-600 bg-yellow-100 dark:bg-yellow-900 dark:text-yellow-200';
      case 'down': return 'text-red-600 bg-red-100 dark:bg-red-900 dark:text-red-200';
      default: return 'text-gray-600 bg-gray-100 dark:bg-gray-900 dark:text-gray-200';
    }
  }

  function getProviderColor(provider: string) {
    switch (provider) {
      case 'AWS': return 'text-orange-600 bg-orange-100 dark:bg-orange-900 dark:text-orange-200';
      case 'Azure': return 'text-blue-600 bg-blue-100 dark:bg-blue-900 dark:text-blue-200';
      case 'GCP': return 'text-green-600 bg-green-100 dark:bg-green-900 dark:text-green-200';
      default: return 'text-gray-600 bg-gray-100 dark:bg-gray-900 dark:text-gray-200';
    }
  }

  function formatTraffic(traffic: number) {
    if (traffic >= 1000000) return `${(traffic / 1000000).toFixed(1)}M`;
    if (traffic >= 1000) return `${(traffic / 1000).toFixed(1)}K`;
    return traffic.toString();
  }

  onMount(() => {
    // Simulate real-time updates
    const interval = setInterval(() => {
      regions = regions.map(region => ({
        ...region,
        latency: region.latency + (Math.random() - 0.5) * 10
      }));
    }, 5000);

    return () => clearInterval(interval);
  });
</script>

<svelte:head>
  <title>Multi-Cloud Traffic Management - F5 Control Center</title>
</svelte:head>

<div class="space-y-6">
  <!-- Header -->
  <div class="bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl p-6 text-white">
    <div class="flex items-center justify-between">
      <div>
        <div class="flex items-center space-x-3 mb-2">
          <h1 class="text-3xl font-bold">Multi-Cloud Traffic Management</h1>
          <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200">
            Phase 2
          </span>
        </div>
        <p class="text-blue-100">Intelligent routing across AWS, Azure, and GCP</p>
        <p class="text-blue-200 text-sm mt-2">
          <strong>Requirements:</strong> F5 GTM, cloud provider APIs, custom iRules
        </p>
      </div>
      <div class="flex items-center space-x-6">
        <div class="text-center">
          <div class="text-2xl font-bold">{formatTraffic(trafficData.global.total)}</div>
          <div class="text-sm text-blue-100">Total Traffic</div>
        </div>
        <div class="text-center">
          <div class="text-2xl font-bold">6</div>
          <div class="text-sm text-blue-100">Active Regions</div>
        </div>
        <div class="text-center">
          <div class="text-2xl font-bold">99.2%</div>
          <div class="text-sm text-blue-100">Uptime</div>
        </div>
      </div>
    </div>
  </div>

  <!-- Global Traffic Map -->
  <div class="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
    <h2 class="text-xl font-semibold text-gray-900 dark:text-white mb-4">Global Traffic Distribution</h2>
    <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
      <div class="bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-900/20 dark:to-orange-800/20 rounded-lg p-4">
        <div class="flex items-center justify-between mb-2">
          <h3 class="font-semibold text-orange-800 dark:text-orange-200">AWS</h3>
          <Cloud class="h-6 w-6 text-orange-600" />
        </div>
        <div class="text-2xl font-bold text-orange-700 dark:text-orange-300">
          {formatTraffic(trafficData.aws.total)}
        </div>
        <div class="text-sm text-orange-600 dark:text-orange-400">
          {Math.round((trafficData.aws.total / trafficData.global.total) * 100)}% of total traffic
        </div>
      </div>

      <div class="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 rounded-lg p-4">
        <div class="flex items-center justify-between mb-2">
          <h3 class="font-semibold text-blue-800 dark:text-blue-200">Azure</h3>
          <Cloud class="h-6 w-6 text-blue-600" />
        </div>
        <div class="text-2xl font-bold text-blue-700 dark:text-blue-300">
          {formatTraffic(trafficData.azure.total)}
        </div>
        <div class="text-sm text-blue-600 dark:text-blue-400">
          {Math.round((trafficData.azure.total / trafficData.global.total) * 100)}% of total traffic
        </div>
      </div>

      <div class="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20 rounded-lg p-4">
        <div class="flex items-center justify-between mb-2">
          <h3 class="font-semibold text-green-800 dark:text-green-200">GCP</h3>
          <Cloud class="h-6 w-6 text-green-600" />
        </div>
        <div class="text-2xl font-bold text-green-700 dark:text-green-300">
          {formatTraffic(trafficData.gcp.total)}
        </div>
        <div class="text-sm text-green-600 dark:text-green-400">
          {Math.round((trafficData.gcp.total / trafficData.global.total) * 100)}% of total traffic
        </div>
      </div>
    </div>
  </div>

  <!-- Regions Overview -->
  <div class="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
    <div class="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
      <h2 class="text-xl font-semibold text-gray-900 dark:text-white">Active Regions</h2>
      <p class="text-sm text-gray-600 dark:text-gray-400 mt-1">
        Real-time monitoring of all cloud regions
      </p>
    </div>
    <div class="overflow-x-auto">
      <table class="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
        <thead class="bg-gray-50 dark:bg-gray-700">
          <tr>
            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
              Region
            </th>
            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
              Provider
            </th>
            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
              Status
            </th>
            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
              Latency
            </th>
            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
              Actions
            </th>
          </tr>
        </thead>
        <tbody class="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
          {#each regions as region (region.id)}
            <tr class="hover:bg-gray-50 dark:hover:bg-gray-700">
              <td class="px-6 py-4 whitespace-nowrap">
                <div class="flex items-center">
                  <MapPin class="h-4 w-4 text-gray-400 mr-2" />
                  <span class="text-sm font-medium text-gray-900 dark:text-white">
                    {region.name}
                  </span>
                </div>
              </td>
              <td class="px-6 py-4 whitespace-nowrap">
                <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium {getProviderColor(region.provider)}">
                  {region.provider}
                </span>
              </td>
              <td class="px-6 py-4 whitespace-nowrap">
                <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium {getStatusColor(region.status)}">
                  {region.status}
                </span>
              </td>
              <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                {region.latency.toFixed(0)}ms
              </td>
              <td class="px-6 py-4 whitespace-nowrap text-sm font-medium">
                <button class="text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300 mr-3">
                  Configure
                </button>
                <button class="text-green-600 hover:text-green-900 dark:text-green-400 dark:hover:text-green-300">
                  Monitor
                </button>
              </td>
            </tr>
          {/each}
        </tbody>
      </table>
    </div>
  </div>

  <!-- Routing Rules -->
  <div class="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
    <div class="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
      <h2 class="text-xl font-semibold text-gray-900 dark:text-white">Intelligent Routing Rules</h2>
      <p class="text-sm text-gray-600 dark:text-gray-400 mt-1">
        Automated traffic routing based on performance and health metrics
      </p>
    </div>
    <div class="p-6">
      <div class="space-y-4">
        {#each routingRules as rule (rule.id)}
          <div class="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
            <div class="flex items-center space-x-4">
              <div class="flex-shrink-0">
                <div class="w-8 h-8 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center">
                  <span class="text-sm font-medium text-blue-600 dark:text-blue-400">
                    {rule.priority}
                  </span>
                </div>
              </div>
              <div>
                <h3 class="text-sm font-medium text-gray-900 dark:text-white">{rule.name}</h3>
                <p class="text-sm text-gray-500 dark:text-gray-400">
                  {rule.condition} → {rule.action}
                </p>
              </div>
            </div>
            <div class="flex items-center space-x-3">
              <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                {rule.status}
              </span>
              <button class="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
                <Zap class="h-4 w-4" />
              </button>
            </div>
          </div>
        {/each}
      </div>
    </div>
  </div>
</div>
