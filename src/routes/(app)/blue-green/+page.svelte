<script lang="ts">
  import { onMount, onDestroy } from 'svelte';
  import { Play, RotateCcw, CheckCircle, Activity, Server, Plus, RefreshCw } from 'lucide-svelte';
  import { notificationStore } from '$lib/stores/notificationStore';

  let deployments: any[] = [];
  let applications: any[] = [];
  let isLoading = true;
  let isCreating = false;
  let refreshInterval: NodeJS.Timeout;

  // Form state for new deployment
  let newDeployment = {
    name: '',
    applicationId: '',
    config: {
      trafficSplitStrategy: 'gradual',
      healthCheck: {
        enabled: true,
        url: '/health',
        method: 'GET',
        expectedStatus: 200,
        timeout: 30000,
        interval: 5000,
        retries: 3,
        consecutiveSuccesses: 2
      },
      rollback: {
        automatic: true,
        healthCheckFailures: 3,
        errorRateThreshold: 10,
        latencyThreshold: 5000
      },
      notifications: {
        onStart: true,
        onSuccess: true,
        onFailure: true,
        channels: ['email']
      }
    }
  };

  onMount(async () => {
    await loadData();
    
    // Auto-refresh every 5 seconds
    refreshInterval = setInterval(loadData, 5000);
  });

  onDestroy(() => {
    if (refreshInterval) clearInterval(refreshInterval);
  });

  async function loadData() {
    try {
      const [deploymentsRes, appsRes] = await Promise.all([
        fetch('/api/blue-green'),
        fetch('/api/config') // Get applications
      ]);

      if (deploymentsRes.ok) {
        const data = await deploymentsRes.json();
        deployments = data.deployments || [];
      }

      if (appsRes.ok) {
        const data = await appsRes.json();
        applications = data.applications || [];
      }
    } catch (err) {
      console.error('Failed to load data:', err);
    } finally {
      isLoading = false;
    }
  }

  async function createDeployment() {
    if (!newDeployment.name || !newDeployment.applicationId) {
      notificationStore.add({
        type: 'error',
        title: 'Validation Error',
        message: 'Please fill in all required fields'
      });
      return;
    }

    const app = applications.find(a => a.id === newDeployment.applicationId);
    if (!app) return;

    try {
      const response = await fetch('/api/blue-green', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newDeployment.name,
          applicationId: newDeployment.applicationId,
          applicationName: app.name,
          blueLane: {
            id: 'lane-1',
            name: 'Lane 1',
            targetVersion: '1.0',
            healthStatus: 'unknown',
            serverCount: 3,
            healthyServerCount: 3
          },
          greenLane: {
            id: 'lane-2',
            name: 'Lane 2',
            targetVersion: '2.0',
            healthStatus: 'unknown',
            serverCount: 3,
            healthyServerCount: 0
          },
          activeLane: 'blue',
          config: newDeployment.config
        })
      });

      if (response.ok) {
        notificationStore.add({
          type: 'success',
          title: 'Deployment Created',
          message: 'Blue/Green deployment created successfully'
        });
        
        // Reset form
        newDeployment = {
          name: '',
          applicationId: '',
          config: newDeployment.config
        };
        isCreating = false;
        
        // Refresh list
        await loadData();
      } else {
        const error = await response.json();
        throw new Error(error.error || 'Failed to create deployment');
      }
    } catch (err: any) {
      notificationStore.add({
        type: 'error',
        title: 'Error',
        message: err.message
      });
    }
  }

  async function startDeployment(id: string) {
    try {
      const response = await fetch(`/api/blue-green/${id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'start' })
      });

      if (response.ok) {
        notificationStore.add({
          type: 'success',
          title: 'Deployment Started',
          message: 'Blue/Green deployment pipeline started'
        });
        await loadData();
      }
    } catch (err) {
      notificationStore.add({
        type: 'error',
        title: 'Error',
        message: 'Failed to start deployment'
      });
    }
  }

  async function rollbackDeployment(id: string) {
    try {
      const response = await fetch(`/api/blue-green/${id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'rollback' })
      });

      if (response.ok) {
        notificationStore.add({
          type: 'info',
          title: 'Rollback Initiated',
          message: 'Rolling back to previous version'
        });
        await loadData();
      }
    } catch (err) {
      notificationStore.add({
        type: 'error',
        title: 'Error',
        message: 'Failed to rollback deployment'
      });
    }
  }

  function getStatusColor(status: string) {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'deploying': return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
      case 'health_check': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
      case 'shifting': return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200';
      case 'failed': return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
      case 'rolling_back': return 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300';
    }
  }

  function formatStatus(status: string) {
    return status.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  }
</script>

<svelte:head>
  <title>Blue/Green Deployment - F5 Control Center</title>
</svelte:head>

<div class="space-y-6">
  <!-- Header -->
  <div class="bg-gradient-to-r from-purple-600 to-blue-600 rounded-xl p-6 text-white">
    <div class="flex items-center justify-between">
      <div>
        <h1 class="text-3xl font-bold">Blue/Green Deployment</h1>
        <p class="text-purple-100 mt-2">Zero-downtime application updates with automated traffic shifting</p>
      </div>
      <button
        on:click={() => isCreating = true}
        class="flex items-center space-x-2 px-4 py-2 bg-white/20 hover:bg-white/30 rounded-lg transition-colors"
      >
        <Plus class="h-5 w-5" />
        <span>New Deployment</span>
      </button>
    </div>
  </div>

  <!-- Create Deployment Form -->
  {#if isCreating}
    <div class="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
      <h2 class="text-lg font-semibold text-gray-900 dark:text-white mb-4">Create New Deployment</h2>
      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label for="deployment-name" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Deployment Name</label>
          <input
            id="deployment-name"
            type="text"
            bind:value={newDeployment.name}
            class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md dark:bg-gray-700 dark:text-white"
            placeholder="e.g., Mobile API v2.0"
          />
        </div>
        <div>
          <label for="application-id" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Application</label>
          <select
            id="application-id"
            bind:value={newDeployment.applicationId}
            class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md dark:bg-gray-700 dark:text-white"
          >
            <option value="">Select application...</option>
            {#each applications as app}
              <option value={app.id}>{app.name}</option>
            {/each}
          </select>
        </div>
      </div>
      <div class="flex justify-end space-x-3 mt-4">
        <button
          on:click={() => isCreating = false}
          class="px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md"
        >
          Cancel
        </button>
        <button
          on:click={createDeployment}
          class="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
        >
          Create Deployment
        </button>
      </div>
    </div>
  {/if}

  <!-- Deployments List -->
  <div class="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
    <div class="px-6 py-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
      <h2 class="text-lg font-semibold text-gray-900 dark:text-white">Deployments</h2>
      <button
        on:click={loadData}
        class="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
        title="Refresh"
      >
        <RefreshCw class="h-4 w-4" />
      </button>
    </div>

    {#if isLoading}
      <div class="p-8 text-center">
        <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto"></div>
        <p class="mt-2 text-gray-500">Loading deployments...</p>
      </div>
    {:else if deployments.length === 0}
      <div class="p-8 text-center">
        <Activity class="h-12 w-12 text-gray-400 mx-auto mb-4" />
        <h3 class="text-lg font-medium text-gray-900 dark:text-white">No Deployments</h3>
        <p class="text-gray-500 mt-1">Create your first Blue/Green deployment</p>
      </div>
    {:else}
      <div class="divide-y divide-gray-200 dark:divide-gray-700">
        {#each deployments as deployment}
          <div class="p-6">
            <div class="flex items-start justify-between">
              <div>
                <h3 class="text-lg font-medium text-gray-900 dark:text-white">{deployment.name}</h3>
                <p class="text-sm text-gray-500">{deployment.applicationName}</p>
              </div>
              <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium {getStatusColor(deployment.status)}">
                {formatStatus(deployment.status)}
              </span>
            </div>

            <!-- Traffic Split Visualization -->
            <div class="mt-4">
              <div class="flex items-center justify-between text-sm text-gray-600 dark:text-gray-400 mb-2">
                <span>Blue ({deployment.activeLane === 'blue' ? 'Active' : 'Standby'})</span>
                <span>{100 - deployment.trafficSplit}%</span>
              </div>
              <div class="w-full h-4 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden flex">
                <div
                  class="h-full bg-blue-500 transition-all duration-500"
                  style="width: {100 - deployment.trafficSplit}%"
                ></div>
                <div
                  class="h-full bg-green-500 transition-all duration-500"
                  style="width: {deployment.trafficSplit}%"
                ></div>
              </div>
              <div class="flex items-center justify-between text-sm text-gray-600 dark:text-gray-400 mt-2">
                <span>{deployment.trafficSplit}%</span>
                <span>Green ({deployment.activeLane === 'green' ? 'Active' : 'Standby'})</span>
              </div>
            </div>

            <!-- Progress -->
            {#if deployment.status !== 'idle' && deployment.status !== 'completed' && deployment.status !== 'failed'}
              <div class="mt-4">
                <div class="flex items-center justify-between text-sm mb-1">
                  <span class="text-gray-600 dark:text-gray-400">Progress</span>
                  <span class="text-gray-900 dark:text-white">{deployment.progress}%</span>
                </div>
                <div class="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                  <div
                    class="h-full bg-indigo-600 transition-all duration-500"
                    style="width: {deployment.progress}%"
                  ></div>
                </div>
              </div>
            {/if}

            <!-- Actions -->
            <div class="mt-4 flex items-center space-x-3">
              {#if deployment.status === 'idle'}
                <button
                  on:click={() => startDeployment(deployment.id)}
                  class="flex items-center space-x-1 px-3 py-1.5 bg-indigo-600 text-white text-sm rounded-md hover:bg-indigo-700"
                >
                  <Play class="h-4 w-4" />
                  <span>Start</span>
                </button>
              {/if}
              
              {#if ['deploying', 'health_check', 'shifting'].includes(deployment.status)}
                <button
                  on:click={() => rollbackDeployment(deployment.id)}
                  class="flex items-center space-x-1 px-3 py-1.5 bg-red-600 text-white text-sm rounded-md hover:bg-red-700"
                >
                  <RotateCcw class="h-4 w-4" />
                  <span>Rollback</span>
                </button>
              {/if}

              {#if deployment.status === 'completed'}
                <span class="flex items-center space-x-1 text-green-600 text-sm">
                  <CheckCircle class="h-4 w-4" />
                  <span>Completed</span>
                </span>
              {/if}
            </div>

            <!-- Pipeline Stages -->
            {#if deployment.pipeline}
              <div class="mt-4 flex items-center space-x-2">
                {#each deployment.pipeline as stage, index}
                  <div class="flex items-center">
                    <div
                      class="w-8 h-8 rounded-full flex items-center justify-center text-xs font-medium
                        {stage.status === 'completed' ? 'bg-green-500 text-white' : 
                         stage.status === 'running' ? 'bg-blue-500 text-white animate-pulse' :
                         stage.status === 'failed' ? 'bg-red-500 text-white' :
                         'bg-gray-200 dark:bg-gray-700 text-gray-500'}"
                    >
                      {index + 1}
                    </div>
                    {#if index < deployment.pipeline.length - 1}
                      <div class="w-8 h-0.5 bg-gray-200 dark:bg-gray-700 mx-1"></div>
                    {/if}
                  </div>
                {/each}
              </div>
            {/if}
          </div>
        {/each}
      </div>
    {/if}
  </div>

  <!-- Info Card -->
  <div class="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4 border border-blue-200 dark:border-blue-800">
    <h3 class="text-sm font-medium text-blue-900 dark:text-blue-200 mb-2">About Blue/Green Deployment</h3>
    <p class="text-sm text-blue-700 dark:text-blue-300">
      Blue/Green deployment is a technique that reduces downtime and risk by running two identical production environments. 
      Blue is the current live environment, while Green is the new version. Traffic is gradually shifted from Blue to Green 
      while monitoring health metrics. If issues are detected, automatic rollback occurs.
    </p>
  </div>
</div>
