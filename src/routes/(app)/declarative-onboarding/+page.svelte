<script lang="ts">
  import { 
    Server, 
    Play, 
    CheckCircle, 
    AlertCircle, 
    Copy, 
    RefreshCw,
    Terminal,
    FileJson,
    Settings
  } from 'lucide-svelte';
  import TutorialTooltip from '$lib/components/TutorialTooltip.svelte';
  import { featureContent } from '$lib/data/featureContent';

  const content = featureContent['declarative-onboarding'];

  let selectedTemplate = 'standard';
  let isDeploying = false;
  let deploymentStatus: 'idle' | 'in-progress' | 'success' | 'error' = 'idle';
  let selectedDevice: string | null = null;

  const templates = [
    { id: 'standard', name: 'Standard Production', description: 'LTM + DNS + basic networking' },
    { id: 'security', name: 'Security-First', description: 'LTM + AWAF + SSLO + AFM' },
    { id: 'dns', name: 'DNS/GSLB Focus', description: 'DNS + GTM + global routing' }
  ];

  const devices = [
    { id: 'bigip-01', name: 'bigip-prod-01.ntt.lab', status: 'factory', ip: '10.1.1.10' },
    { id: 'bigip-02', name: 'bigip-prod-02.ntt.lab', status: 'factory', ip: '10.1.1.11' },
    { id: 'bigip-03', name: 'bigip-dr-01.ntt.lab', status: 'factory', ip: '10.2.1.10' }
  ];

  async function deployConfiguration() {
    if (!selectedDevice) return;
    isDeploying = true;
    deploymentStatus = 'in-progress';
    await new Promise(resolve => setTimeout(resolve, 3000));
    deploymentStatus = 'success';
    isDeploying = false;
  }
</script>

<svelte:head>
  <title>Declarative Onboarding - F5 Automation Control Center</title>
</svelte:head>

<div class="space-y-6">
  <!-- Header -->
  <div class="flex items-center justify-between">
    <div>
      <div class="flex items-center space-x-3">
        <h1 class="text-3xl font-bold text-gray-900 dark:text-white">Declarative Onboarding (DO)</h1>
        <TutorialTooltip
          title={content.title}
          description={content.description}
          problemSolved={content.problemSolved}
          benefits={content.benefits}
          variant="tip"
          position="right"
        />
      </div>
      <p class="text-gray-500 dark:text-gray-400 mt-1">
        Automated L1-L3 device provisioning from factory state to production-ready
      </p>
    </div>
  </div>

  <!-- Value Proposition Banner -->
  <div class="bg-gradient-to-r from-indigo-50 to-blue-50 dark:from-indigo-900/20 dark:to-blue-900/20 border border-indigo-200 dark:border-indigo-800 rounded-lg p-4">
    <div class="flex items-start space-x-3">
      <div class="p-2 bg-indigo-100 dark:bg-indigo-800 rounded-lg">
        <Terminal class="h-5 w-5 text-indigo-600 dark:text-indigo-300" />
      </div>
      <div>
        <h3 class="font-semibold text-indigo-900 dark:text-indigo-300">Why This Matters</h3>
        <p class="text-sm text-indigo-800 dark:text-indigo-400 mt-1">
          {content.businessValue} Manual provisioning takes 4-6 hours per device. 
          With DO, you can provision devices in <strong>under 5 minutes</strong> with zero configuration errors.
        </p>
      </div>
    </div>
  </div>

  <!-- Mock Implementation -->
  <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
    <div class="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
      <h2 class="text-lg font-semibold text-gray-900 dark:text-white mb-4">Target Devices</h2>
      <div class="space-y-3">
        {#each devices as device}
          <button
            class="w-full p-4 border-2 rounded-lg text-left transition-colors {selectedDevice === device.id ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/20' : 'border-gray-200 dark:border-gray-700'}"
            on:click={() => selectedDevice = device.id}
          >
            <div class="flex items-center justify-between">
              <div>
                <p class="font-medium text-gray-900 dark:text-white">{device.name}</p>
                <p class="text-sm text-gray-500">{device.ip}</p>
              </div>
              <span class="px-2 py-1 text-xs rounded-full bg-yellow-100 text-yellow-800">Factory Reset</span>
            </div>
          </button>
        {/each}
      </div>

      <button
        on:click={deployConfiguration}
        disabled={!selectedDevice || isDeploying}
        class="w-full btn-primary mt-6 disabled:opacity-50"
      >
        {isDeploying ? 'Deploying...' : 'Deploy Configuration'}
      </button>

      {#if deploymentStatus === 'success'}
        <div class="mt-3 p-3 bg-green-50 dark:bg-green-900/20 rounded-lg flex items-center space-x-2">
          <CheckCircle class="h-5 w-5 text-green-500" />
          <span class="text-green-700 dark:text-green-300">Device onboarded successfully!</span>
        </div>
      {/if}
    </div>

    <div class="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
      <h2 class="text-lg font-semibold text-gray-900 dark:text-white mb-4">Configuration Preview</h2>
      <div class="bg-gray-900 rounded-lg p-4">
        <code class="text-sm text-green-400 font-mono">&#123; class: "DO", declaration: &#123; schemaVersion: "1.0.0" &#125; &#125;</code>
      </div>
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
