<script lang="ts">
  import { Shield, Lock, Eye, Server, ArrowRight, CheckCircle, AlertTriangle } from 'lucide-svelte';
  import TutorialTooltip from '$lib/components/TutorialTooltip.svelte';
  import { featureContent } from '$lib/data/featureContent';

  const content = featureContent['ssl-orchestrator'];

  const serviceChain = [
    { id: 'dlp', name: 'DLP Inspection', type: 'Data Loss Prevention', status: 'active', icon: Shield },
    { id: 'av', name: 'Antivirus Scan', type: 'Malware Detection', status: 'active', icon: Shield },
    { id: 'ips', name: 'IPS Engine', type: 'Intrusion Prevention', status: 'standby', icon: AlertTriangle }
  ];

  const trafficFlows = [
    { source: 'User', destination: 'Banking App', encrypted: true, inspected: true, bypass: false },
    { source: 'User', destination: 'Streaming Service', encrypted: true, inspected: false, bypass: true },
    { source: 'API Client', destination: 'Payment API', encrypted: true, inspected: true, bypass: false }
  ];
</script>

<svelte:head>
  <title>SSL Orchestrator - F5 Automation Control Center</title>
</svelte:head>

<div class="space-y-6">
  <div class="flex items-center justify-between">
    <div>
      <div class="flex items-center space-x-3">
        <h1 class="text-3xl font-bold text-gray-900 dark:text-white">SSL Orchestrator (SSLO)</h1>
        <TutorialTooltip
          title={content.title}
          description={content.description}
          problemSolved={content.problemSolved}
          benefits={content.benefits}
          variant="tip"
        />
      </div>
      <p class="text-gray-500 dark:text-gray-400 mt-1">
        Centralized SSL/TLS inspection with intelligent service chaining
      </p>
    </div>
  </div>

  <!-- Value Banner -->
  <div class="bg-gradient-to-r from-purple-50 to-indigo-50 dark:from-purple-900/20 dark:to-indigo-900/20 border border-purple-200 dark:border-purple-800 rounded-lg p-4">
    <div class="flex items-start space-x-3">
      <div class="p-2 bg-purple-100 dark:bg-purple-800 rounded-lg">
        <Eye class="h-5 w-5 text-purple-600 dark:text-purple-300" />
      </div>
      <div>
        <h3 class="font-semibold text-purple-900 dark:text-purple-300">Why This Matters</h3>
        <p class="text-sm text-purple-800 dark:text-purple-400 mt-1">
          {content.businessValue} Without SSLO, 70% of malware uses encryption to evade detection. 
          SSLO provides <strong>300% better performance</strong> than multiple decryption points.
        </p>
      </div>
    </div>
  </div>

  <!-- Service Chain Visualization -->
  <div class="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
    <h2 class="text-lg font-semibold text-gray-900 dark:text-white mb-4">Service Chain</h2>
    <div class="flex items-center justify-between">
      <div class="text-center">
        <div class="w-16 h-16 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center mx-auto">
          <Lock class="h-8 w-8 text-blue-600" />
        </div>
        <p class="text-sm mt-2 text-gray-700 dark:text-gray-300">Encrypted In</p>
      </div>
      
      <ArrowRight class="h-6 w-6 text-gray-400" />
      
      <div class="text-center">
        <div class="w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto">
          <Eye class="h-8 w-8 text-green-600" />
        </div>
        <p class="text-sm mt-2 text-gray-700 dark:text-gray-300">Decrypt</p>
      </div>
      
      {#each serviceChain as service}
        <ArrowRight class="h-6 w-6 text-gray-400" />
        <div class="text-center">
          <div class="w-16 h-16 {service.status === 'active' ? 'bg-purple-100 dark:bg-purple-900/30' : 'bg-gray-100 dark:bg-gray-700'} rounded-full flex items-center justify-center mx-auto">
            <svelte:component this={service.icon} class="h-8 w-8 {service.status === 'active' ? 'text-purple-600' : 'text-gray-400'}" />
          </div>
          <p class="text-sm mt-2 text-gray-700 dark:text-gray-300">{service.name}</p>
        </div>
      {/each}
      
      <ArrowRight class="h-6 w-6 text-gray-400" />
      
      <div class="text-center">
        <div class="w-16 h-16 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center mx-auto">
          <Lock class="h-8 w-8 text-blue-600" />
        </div>
        <p class="text-sm mt-2 text-gray-700 dark:text-gray-300">Encrypted Out</p>
      </div>
    </div>
  </div>

  <!-- Traffic Flow Rules -->
  <div class="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
    <h2 class="text-lg font-semibold text-gray-900 dark:text-white mb-4">Traffic Flow Rules</h2>
    <div class="overflow-x-auto">
      <table class="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
        <thead>
          <tr>
            <th class="px-4 py-2 text-left text-sm font-medium text-gray-500">Source</th>
            <th class="px-4 py-2 text-left text-sm font-medium text-gray-500">Destination</th>
            <th class="px-4 py-2 text-left text-sm font-medium text-gray-500">Inspection</th>
            <th class="px-4 py-2 text-left text-sm font-medium text-gray-500">Status</th>
          </tr>
        </thead>
        <tbody class="divide-y divide-gray-200 dark:divide-gray-700">
          {#each trafficFlows as flow}
            <tr>
              <td class="px-4 py-3 text-sm text-gray-900 dark:text-white">{flow.source}</td>
              <td class="px-4 py-3 text-sm text-gray-900 dark:text-white">{flow.destination}</td>
              <td class="px-4 py-3 text-sm">
                {#if flow.inspected}
                  <span class="px-2 py-1 text-xs rounded-full bg-green-100 text-green-800">Inspected</span>
                {:else}
                  <span class="px-2 py-1 text-xs rounded-full bg-gray-100 text-gray-800">Bypassed</span>
                {/if}
              </td>
              <td class="px-4 py-3 text-sm">
                <CheckCircle class="h-5 w-5 text-green-500" />
              </td>
            </tr>
          {/each}
        </tbody>
      </table>
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
