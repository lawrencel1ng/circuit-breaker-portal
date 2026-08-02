<script lang="ts">
  import { onMount } from 'svelte';
  import { circuitBreakerStore } from '$lib/stores/circuitBreakerStore';
  import LogViewer from '$lib/components/LogViewer.svelte'; // Existing Automation Logs
  import AuditLogViewer from '$lib/components/AuditLogViewer.svelte';
  import AppLogViewer from '$lib/components/AppLogViewer.svelte';
  import type { CircuitBreakerConfig } from '$lib/types';
  import { FileText, Terminal, Activity, ClipboardList } from 'lucide-svelte';

  let config: CircuitBreakerConfig | undefined;
  let activeTab = 'audit';

  $: config = $circuitBreakerStore;

  const tabs = [
    { id: 'audit', label: 'Audit Logs', icon: ClipboardList, desc: 'Track configuration changes and user actions' },
    { id: 'app', label: 'Application Logs', icon: Terminal, desc: 'Debug and system diagnostic events' },
    { id: 'automation', label: 'Automation Events', icon: Activity, desc: 'Circuit breaker and auto-scaling history' }
  ];
</script>

<svelte:head>
  <title>System Logs - OCBC Circuit Breaker Portal</title>
</svelte:head>

<div class="space-y-6">
  <!-- Header -->
  <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between">
    <div>
      <h1 class="text-3xl font-bold text-gray-900 dark:text-white">System Logs</h1>
      <p class="mt-2 text-gray-600 dark:text-gray-400">
        Centralized monitoring for audit trails, application debugging, and automation events.
      </p>
    </div>
  </div>

  <!-- Tabs -->
  <div class="border-b border-gray-200 dark:border-gray-700">
    <nav class="-mb-px flex space-x-8" aria-label="Tabs">
      {#each tabs as tab}
        <button
          on:click={() => activeTab = tab.id}
          class="group inline-flex items-center py-4 px-1 border-b-2 font-medium text-sm transition-colors duration-200
            {activeTab === tab.id
              ? 'border-indigo-500 text-indigo-600 dark:text-indigo-400'
              : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'}"
        >
          <svelte:component this={tab.icon} class="h-5 w-5 mr-2 {activeTab === tab.id ? 'text-indigo-500' : 'text-gray-400 group-hover:text-gray-500'}" />
          <span>{tab.label}</span>
        </button>
      {/each}
    </nav>
  </div>

  <!-- Content -->
  <div class="min-h-[600px]">
    {#if activeTab === 'audit'}
      <div class="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg mb-6 border border-blue-100 dark:border-blue-800">
        <h3 class="text-sm font-medium text-blue-800 dark:text-blue-300 mb-1">Audit Policy</h3>
        <p class="text-sm text-blue-600 dark:text-blue-400">
          All configuration changes, deployment requests, and security policy updates are immutable and retained for 365 days.
        </p>
      </div>
      <AuditLogViewer />
    {:else if activeTab === 'app'}
      <AppLogViewer />
    {:else if activeTab === 'automation'}
      <LogViewer {config} />
    {/if}
  </div>
</div>
