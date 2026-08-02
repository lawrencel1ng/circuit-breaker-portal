<script lang="ts">
  import { Radio, Activity, Database, FileText, TrendingUp, Zap, Shield } from 'lucide-svelte';
  import TutorialTooltip from '$lib/components/TutorialTooltip.svelte';
  import { featureContent } from '$lib/data/featureContent';

  const content = featureContent['telemetry-streaming'];

  const consumers = [
    { name: 'Splunk', type: 'SIEM', status: 'active', events: '2.4M/day', latency: '<1s' },
    { name: 'Datadog', type: 'APM', status: 'active', events: '1.8M/day', latency: '<500ms' },
    { name: 'Azure Sentinel', type: 'Security', status: 'active', events: '890K/day', latency: '<2s' },
    { name: 'Elasticsearch', type: 'Logging', status: 'standby', events: '0', latency: '-' }
  ];

  const metrics = [
    { name: 'HTTP Requests', value: '4.2M', trend: '+12%', status: 'up' },
    { name: 'SSL Connections', value: '1.8M', trend: '+8%', status: 'up' },
    { name: 'WAF Blocks', value: '45.2K', trend: '-5%', status: 'down' },
    { name: 'Avg Latency', value: '23ms', trend: '-2ms', status: 'up' }
  ];
</script>

<svelte:head>
  <title>Telemetry Streaming - F5 Automation Control Center</title>
</svelte:head>

<div class="space-y-6">
  <div class="flex items-center justify-between">
    <div>
      <div class="flex items-center space-x-3">
        <h1 class="text-3xl font-bold text-gray-900 dark:text-white">Telemetry Streaming (TS)</h1>
        <TutorialTooltip
          title={content.title}
          description={content.description}
          problemSolved={content.problemSolved}
          benefits={content.benefits}
          variant="tip"
        />
      </div>
      <p class="text-gray-500 dark:text-gray-400 mt-1">
        Real-time streaming of F5 metrics, logs, and events to analytics platforms
      </p>
    </div>
  </div>

  <!-- Value Banner -->
  <div class="bg-gradient-to-r from-cyan-50 to-blue-50 dark:from-cyan-900/20 dark:to-blue-900/20 border border-cyan-200 dark:border-cyan-800 rounded-lg p-4">
    <div class="flex items-start space-x-3">
      <div class="p-2 bg-cyan-100 dark:bg-cyan-800 rounded-lg">
        <Radio class="h-5 w-5 text-cyan-600 dark:text-cyan-300" />
      </div>
      <div>
        <h3 class="font-semibold text-cyan-900 dark:text-cyan-300">Why This Matters</h3>
        <p class="text-sm text-cyan-800 dark:text-cyan-400 mt-1">
          {content.businessValue} Traditional log polling creates blind spots. 
          TS provides <strong>sub-second visibility</strong> for critical security and performance events.
        </p>
      </div>
    </div>
  </div>

  <!-- Metrics -->
  <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
    {#each metrics as metric}
      <div class="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4">
        <div class="flex items-center justify-between mb-2">
          <p class="text-sm text-gray-500 dark:text-gray-400">{metric.name}</p>
          <Activity class="h-5 w-5 text-gray-400" />
        </div>
        <div class="flex items-baseline space-x-2">
          <p class="text-2xl font-bold text-gray-900 dark:text-white">{metric.value}</p>
          <span class="text-sm {metric.status === 'up' ? 'text-green-600' : 'text-red-600'}">
            {metric.trend}
          </span>
        </div>
      </div>
    {/each}
  </div>

  <!-- Data Consumers -->
  <div class="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
    <h2 class="text-lg font-semibold text-gray-900 dark:text-white mb-4">Data Consumers</h2>
    <div class="space-y-4">
      {#each consumers as consumer}
        <div class="flex items-center justify-between p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
          <div class="flex items-center space-x-3">
            <div class="w-10 h-10 bg-indigo-100 dark:bg-indigo-900/30 rounded-lg flex items-center justify-center">
              <Database class="h-5 w-5 text-indigo-600" />
            </div>
            <div>
              <p class="font-medium text-gray-900 dark:text-white">{consumer.name}</p>
              <p class="text-sm text-gray-500">{consumer.type}</p>
            </div>
          </div>
          <div class="flex items-center space-x-6">
            <div class="text-right">
              <p class="text-sm font-medium text-gray-900 dark:text-white">{consumer.events}</p>
              <p class="text-xs text-gray-500">Events</p>
            </div>
            <div class="text-right">
              <p class="text-sm font-medium text-gray-900 dark:text-white">{consumer.latency}</p>
              <p class="text-xs text-gray-500">Latency</p>
            </div>
            <span class="px-2 py-1 text-xs rounded-full {consumer.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}">
              {consumer.status}
            </span>
          </div>
        </div>
      {/each}
    </div>
  </div>

  <!-- Log Types -->
  <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
    <div class="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4">
      <div class="flex items-center space-x-2 mb-3">
        <FileText class="h-5 w-5 text-blue-500" />
        <h3 class="font-medium text-gray-900 dark:text-white">Access Logs</h3>
      </div>
      <p class="text-sm text-gray-600 dark:text-gray-400">HTTP request/response details, client IPs, response times</p>
    </div>
    <div class="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4">
      <div class="flex items-center space-x-2 mb-3">
        <Shield class="h-5 w-5 text-red-500" />
        <h3 class="font-medium text-gray-900 dark:text-white">Security Events</h3>
      </div>
      <p class="text-sm text-gray-600 dark:text-gray-400">WAF violations, bot attacks, DDoS mitigation actions</p>
    </div>
    <div class="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4">
      <div class="flex items-center space-x-2 mb-3">
        <Zap class="h-5 w-5 text-yellow-500" />
        <h3 class="font-medium text-gray-900 dark:text-white">System Metrics</h3>
      </div>
      <p class="text-sm text-gray-600 dark:text-gray-400">CPU, memory, connection counts, SSL handshake rates</p>
    </div>
  </div>

  <!-- Use Cases -->
  <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
    {#each content.useCases as useCase, i}
      <div class="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4">
        <h3 class="font-medium text-gray-900 dark:text-white mb-2">Use Case {i + 1}</h3>
        <p class="text-sm text-gray-600 dark:text-gray-400">{useCase}</p>
      </div>
    {/each}
  </div>
</div>
