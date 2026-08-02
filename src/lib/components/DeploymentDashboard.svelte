<script lang="ts">
  import { onMount } from 'svelte';
  import { Activity, Server, Shield, Globe, AlertTriangle, CheckCircle, Clock } from 'lucide-svelte';
  import type { DeployedService } from '$lib/types';

  export let deployedServices: DeployedService[] = [];

  let currentTime = new Date();

  onMount(() => {
    const interval = setInterval(() => {
      currentTime = new Date();
    }, 1000);
    return () => clearInterval(interval);
  });

  function getHealthColor(health: string) {
    switch (health) {
      case 'healthy': return 'text-green-600 bg-green-100 dark:bg-green-900 dark:text-green-200';
      case 'degraded': return 'text-yellow-600 bg-yellow-100 dark:bg-yellow-900 dark:text-yellow-200';
      case 'unhealthy': return 'text-red-600 bg-red-100 dark:bg-red-900 dark:text-red-200';
      default: return 'text-gray-600 bg-gray-100 dark:bg-gray-900 dark:text-gray-200';
    }
  }

  function getStatusColor(status: string) {
    switch (status) {
      case 'active': return 'text-green-600 bg-green-100 dark:bg-green-900 dark:text-green-200';
      case 'inactive': return 'text-gray-600 bg-gray-100 dark:bg-gray-900 dark:text-gray-200';
      case 'maintenance': return 'text-yellow-600 bg-yellow-100 dark:bg-yellow-900 dark:text-yellow-200';
      default: return 'text-gray-600 bg-gray-100 dark:bg-gray-900 dark:text-gray-200';
    }
  }

  function formatTraffic(traffic: number) {
    if (traffic >= 1000000) return `${(traffic / 1000000).toFixed(1)}M`;
    if (traffic >= 1000) return `${(traffic / 1000).toFixed(1)}K`;
    return traffic.toString();
  }

  function formatResponseTime(time: number) {
    return `${time}ms`;
  }

  function formatErrorRate(rate: number) {
    return `${rate.toFixed(2)}%`;
  }

  // Calculate overall stats
  $: totalServices = deployedServices.length;
  $: activeServices = deployedServices.filter(s => s.status === 'active').length;
  $: healthyServices = deployedServices.filter(s => s.health === 'healthy').length;
  $: totalTraffic = deployedServices.reduce((sum, s) => sum + s.traffic, 0);
  $: avgResponseTime = deployedServices.length > 0 
    ? deployedServices.reduce((sum, s) => sum + s.responseTime, 0) / deployedServices.length 
    : 0;
</script>

<div class="space-y-6">
  <!-- Stats Overview -->
  <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
    <div class="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
      <div class="flex items-center justify-between">
        <div>
          <p class="text-sm font-medium text-gray-600 dark:text-gray-400">Total Services</p>
          <p class="text-3xl font-bold text-gray-900 dark:text-white">{totalServices}</p>
        </div>
        <div class="w-12 h-12 bg-blue-100 dark:bg-blue-900 rounded-lg flex items-center justify-center">
          <Server class="h-6 w-6 text-blue-600 dark:text-blue-400" />
        </div>
      </div>
    </div>

    <div class="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
      <div class="flex items-center justify-between">
        <div>
          <p class="text-sm font-medium text-gray-600 dark:text-gray-400">Active Services</p>
          <p class="text-3xl font-bold text-green-600 dark:text-green-400">{activeServices}</p>
        </div>
        <div class="w-12 h-12 bg-green-100 dark:bg-green-900 rounded-lg flex items-center justify-center">
          <Activity class="h-6 w-6 text-green-600 dark:text-green-400" />
        </div>
      </div>
    </div>

    <div class="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
      <div class="flex items-center justify-between">
        <div>
          <p class="text-sm font-medium text-gray-600 dark:text-gray-400">Total Traffic</p>
          <p class="text-3xl font-bold text-blue-600 dark:text-blue-400">{formatTraffic(totalTraffic)}</p>
        </div>
        <div class="w-12 h-12 bg-blue-100 dark:bg-blue-900 rounded-lg flex items-center justify-center">
          <Globe class="h-6 w-6 text-blue-600 dark:text-blue-400" />
        </div>
      </div>
    </div>

    <div class="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
      <div class="flex items-center justify-between">
        <div>
          <p class="text-sm font-medium text-gray-600 dark:text-gray-400">Avg Response Time</p>
          <p class="text-3xl font-bold text-purple-600 dark:text-purple-400">{formatResponseTime(Math.round(avgResponseTime))}</p>
        </div>
        <div class="w-12 h-12 bg-purple-100 dark:bg-purple-900 rounded-lg flex items-center justify-center">
          <Clock class="h-6 w-6 text-purple-600 dark:text-purple-400" />
        </div>
      </div>
    </div>
  </div>

  <!-- Services List -->
  <div class="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
    <div class="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
      <h3 class="text-lg font-semibold text-gray-900 dark:text-white">Deployed Services</h3>
      <p class="text-sm text-gray-600 dark:text-gray-400 mt-1">
        Real-time monitoring of all deployed F5 services
      </p>
    </div>

    <div class="divide-y divide-gray-200 dark:divide-gray-700">
      {#each deployedServices as service (service.id)}
        <div class="p-6 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors duration-200">
          <div class="flex items-center justify-between">
            <div class="flex-1">
              <div class="flex items-center space-x-3 mb-2">
                <h4 class="text-lg font-medium text-gray-900 dark:text-white">{service.name}</h4>
                <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium {getStatusColor(service.status)}">
                  {service.status}
                </span>
                <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium {getHealthColor(service.health)}">
                  {#if service.health === 'healthy'}
                    <CheckCircle class="h-3 w-3 mr-1" />
                  {:else if service.health === 'degraded'}
                    <AlertTriangle class="h-3 w-3 mr-1" />
                  {:else}
                    <Activity class="h-3 w-3 mr-1" />
                  {/if}
                  {service.health}
                </span>
              </div>
              
              <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
                <div>
                  <span class="text-gray-500 dark:text-gray-400">VIP Address:</span>
                  <span class="ml-2 font-mono text-gray-900 dark:text-white">{service.vipAddress}:{service.port}</span>
                </div>
                <div>
                  <span class="text-gray-500 dark:text-gray-400">Protocol:</span>
                  <span class="ml-2 text-gray-900 dark:text-white">{service.protocol}</span>
                </div>
                <div>
                  <span class="text-gray-500 dark:text-gray-400">Traffic:</span>
                  <span class="ml-2 text-gray-900 dark:text-white">{formatTraffic(service.traffic)}/min</span>
                </div>
                <div>
                  <span class="text-gray-500 dark:text-gray-400">Response Time:</span>
                  <span class="ml-2 text-gray-900 dark:text-white">{formatResponseTime(service.responseTime)}</span>
                </div>
              </div>

              <!-- Pool Members -->
              <div class="mt-4">
                <h5 class="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Pool Members</h5>
                <div class="flex flex-wrap gap-2">
                  {#each service.poolMembers as member}
                    <div class="flex items-center space-x-2 px-3 py-1 bg-gray-100 dark:bg-gray-700 rounded-lg text-sm">
                      <div class="w-2 h-2 rounded-full {member.health === 'healthy' ? 'bg-green-500' : member.health === 'degraded' ? 'bg-yellow-500' : 'bg-red-500'}"></div>
                      <span class="font-mono text-gray-900 dark:text-white">{member.name}</span>
                      <span class="text-gray-500 dark:text-gray-400">({member.ip}:{member.port})</span>
                    </div>
                  {/each}
                </div>
              </div>

              <!-- Security & Monitoring -->
              <div class="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                <div>
                  <span class="text-gray-500 dark:text-gray-400">SSL Profile:</span>
                  <span class="ml-2 text-gray-900 dark:text-white">{service.sslProfile}</span>
                </div>
                <div>
                  <span class="text-gray-500 dark:text-gray-400">WAF Policy:</span>
                  <span class="ml-2 text-gray-900 dark:text-white">{service.wafPolicy}</span>
                </div>
                <div>
                  <span class="text-gray-500 dark:text-gray-400">Error Rate:</span>
                  <span class="ml-2 {service.errorRate > 1 ? 'text-red-600 dark:text-red-400' : 'text-gray-900 dark:text-white'}">
                    {formatErrorRate(service.errorRate)}
                  </span>
                </div>
              </div>

              <!-- Actions -->
              <div class="mt-4 flex items-center space-x-4">
                <a
                  href={service.monitoringUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  class="inline-flex items-center px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  <Activity class="h-4 w-4 mr-2" />
                  View Monitoring
                </a>
                <button
                  class="inline-flex items-center px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  <Shield class="h-4 w-4 mr-2" />
                  Security Details
                </button>
              </div>
            </div>
          </div>
        </div>
      {/each}
    </div>
  </div>
</div>


