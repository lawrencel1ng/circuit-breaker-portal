<script lang="ts">
  import { onMount } from 'svelte';
  import { deploymentStore, deploymentActions } from '$lib/stores/deploymentStore';
  import DeploymentRequestForm from '$lib/components/DeploymentRequestForm.svelte';
  import TutorialTooltip from '$lib/components/TutorialTooltip.svelte';
  import { featureContent } from '$lib/data/featureContent';

  const content = featureContent['self-service-deployment'];

  let activeTab = 'request';
  let deployments = [];
  let deployedServices = [];

  onMount(() => {
    // Store is already initialized with initialState
    // No need to call initialize
  });

  $: {
    deployments = $deploymentStore?.deploymentRequests || [];
    deployedServices = $deploymentStore?.deployedServices || [];
  }

  function switchTab(tab: string) {
    activeTab = tab;
  }
</script>

<svelte:head>
  <title>Self-Service Deployment Portal - OCBC DevOps</title>
</svelte:head>

<div class="min-h-screen bg-gray-50 dark:bg-gray-900">
  <!-- Header -->
  <div class="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700">
    <div class="container mx-auto px-4 py-6">
      <div class="flex items-center justify-between">
        <div class="flex items-center space-x-4">
          <div class="w-12 h-12 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
            <span class="text-white font-bold text-xl">F5</span>
          </div>
          <div>
            <div class="flex items-center space-x-3">
              <h1 class="text-2xl font-bold text-gray-900 dark:text-white">
                Self-Service Deployment Portal
              </h1>
              <TutorialTooltip
                title={content.title}
                description={content.description}
                problemSolved={content.problemSolved}
                benefits={content.benefits}
                variant="tip"
              />
              <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                Ready to Integrate
              </span>
            </div>
            <p class="text-sm text-gray-600 dark:text-gray-400">
              DevOps Vending Machine for F5 Services
            </p>
            <p class="text-xs text-gray-500 dark:text-gray-400 mt-1">
              <strong>Requirements:</strong> F5 BIG-IP with AS3 Extension, iControl REST API
            </p>
          </div>
        </div>
        <div class="flex items-center space-x-4">
          <div class="text-right">
            <div class="text-sm text-gray-500 dark:text-gray-400">Active Services</div>
            <div class="text-2xl font-bold text-blue-600 dark:text-blue-400">2</div>
          </div>
          <div class="text-right">
            <div class="text-sm text-gray-500 dark:text-gray-400">Pending Requests</div>
            <div class="text-2xl font-bold text-orange-600 dark:text-orange-400">1</div>
          </div>
        </div>
      </div>
    </div>
  </div>

  <!-- Value Proposition Banner -->
  <div class="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 border-b border-blue-200 dark:border-blue-800">
    <div class="container mx-auto px-4 py-3">
      <div class="flex items-center space-x-3">
        <div class="p-1.5 bg-blue-100 dark:bg-blue-800 rounded">
          <svg class="h-4 w-4 text-blue-600 dark:text-blue-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
          </svg>
        </div>
        <p class="text-sm text-blue-800 dark:text-blue-300">
          <strong>Why this matters:</strong> {content.businessValue} Deploy applications in minutes instead of weeks.
        </p>
      </div>
    </div>
  </div>

  <!-- Navigation Tabs -->
  <div class="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
    <div class="container mx-auto px-4">
      <nav class="flex space-x-8">
        <button
          class="py-4 px-1 border-b-2 font-medium text-sm transition-colors duration-200
            {activeTab === 'request' 
              ? 'border-blue-500 text-blue-600 dark:text-blue-400' 
              : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'}"
          on:click={() => switchTab('request')}
        >
          <div class="flex items-center space-x-2">
            <svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
            <span>New Deployment</span>
          </div>
        </button>
        <button
          class="py-4 px-1 border-b-2 font-medium text-sm transition-colors duration-200
            {activeTab === 'dashboard' 
              ? 'border-blue-500 text-blue-600 dark:text-blue-400' 
              : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'}"
          on:click={() => switchTab('dashboard')}
        >
          <div class="flex items-center space-x-2">
            <svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
            <span>Dashboard</span>
          </div>
        </button>
        <button
          class="py-4 px-1 border-b-2 font-medium text-sm transition-colors duration-200
            {activeTab === 'history' 
              ? 'border-blue-500 text-blue-600 dark:text-blue-400' 
              : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'}"
          on:click={() => switchTab('history')}
        >
          <div class="flex items-center space-x-2">
            <svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span>History</span>
          </div>
        </button>
      </nav>
    </div>
  </div>

  <!-- Main Content -->
  <div class="container mx-auto px-4 py-8">
    {#if activeTab === 'request'}
      <DeploymentRequestForm />
    {:else if activeTab === 'dashboard'}
      <div class="space-y-6">
        <div class="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-4">Deployed Services</h3>
          <p class="text-gray-600 dark:text-gray-400">
            Service dashboard will be loaded here...
          </p>
        </div>
      </div>
    {:else if activeTab === 'history'}
      <div class="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
        <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-4">Deployment History</h3>
        <p class="text-gray-600 dark:text-gray-400">
          Deployment history will be loaded here...
        </p>
      </div>
    {/if}
  </div>
</div>