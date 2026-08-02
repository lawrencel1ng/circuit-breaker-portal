<script lang="ts">
  import { onMount } from 'svelte';
  import { 
    Clock, FileCode, Zap, Server, Shield, AlertTriangle, 
    CheckCircle, XCircle, Play, Pause, RotateCcw, Plus,
    ChevronRight, Activity, Globe, Layers, Settings
  } from 'lucide-svelte';
  import { scheduledAutomationStore, automationTemplates } from '$lib/stores/scheduledAutomationStore';
  import { configTemplateStore, enterpriseTemplates } from '$lib/stores/configTemplateStore';
  import { eventAutomationStore, eventAutomationPresets } from '$lib/stores/eventAutomationStore';
  import { batchOperationStore, batchOperationTemplates } from '$lib/stores/batchOperationStore';

  let activeTab = 'scheduled';
  let showCreateModal = false;
  let createType: 'scheduled' | 'template' | 'event' | 'batch' | null = null;

  // Statistics
  $: scheduledStats = scheduledAutomationStore.getStatistics();
  $: templateStats = configTemplateStore.getStatistics();
  $: eventStats = eventAutomationStore.getStatistics();
  $: batchStats = batchOperationStore.getStatistics();

  function switchTab(tab: string) {
    activeTab = tab;
  }

  function formatDuration(ms: number): string {
    if (ms < 60000) return `${Math.round(ms / 1000)}s`;
    if (ms < 3600000) return `${Math.round(ms / 60000)}m`;
    return `${Math.round(ms / 3600000)}h`;
  }

  function formatTime(timestamp: number): string {
    return new Date(timestamp).toLocaleString();
  }
</script>

<svelte:head>
  <title>Automation Orchestrator - F5 Control Center</title>
</svelte:head>

<div class="space-y-6">
  <!-- Header -->
  <div class="bg-gradient-to-r from-indigo-600 to-purple-600 rounded-xl p-6 text-white">
    <div class="flex items-center justify-between">
      <div>
        <h1 class="text-3xl font-bold">Automation Orchestrator</h1>
        <p class="text-indigo-100 mt-2">Centralized automation management for enterprise F5 operations</p>
      </div>
      <div class="flex items-center space-x-4">
        <div class="text-center">
          <div class="text-2xl font-bold">{$scheduledAutomationStore.length + $eventAutomationStore.length}</div>
          <div class="text-sm text-indigo-100">Active Rules</div>
        </div>
        <div class="text-center">
          <div class="text-2xl font-bold">{templateStats.total}</div>
          <div class="text-sm text-indigo-100">Templates</div>
        </div>
        <div class="text-center">
          <div class="text-2xl font-bold">{batchStats.total}</div>
          <div class="text-sm text-indigo-100">Batch Ops</div>
        </div>
      </div>
    </div>
  </div>

  <!-- Quick Actions -->
  <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
    <button 
      class="bg-white dark:bg-gray-800 rounded-lg p-4 shadow-sm border border-gray-200 dark:border-gray-700 hover:shadow-md transition-shadow text-left"
      on:click={() => { createType = 'scheduled'; showCreateModal = true; }}
    >
      <div class="flex items-center space-x-3">
        <div class="w-10 h-10 bg-blue-100 dark:bg-blue-900 rounded-lg flex items-center justify-center">
          <Clock class="h-5 w-5 text-blue-600 dark:text-blue-400" />
        </div>
        <div>
          <p class="font-medium text-gray-900 dark:text-white">Schedule Task</p>
          <p class="text-xs text-gray-500">Automated recurring jobs</p>
        </div>
      </div>
    </button>

    <button 
      class="bg-white dark:bg-gray-800 rounded-lg p-4 shadow-sm border border-gray-200 dark:border-gray-700 hover:shadow-md transition-shadow text-left"
      on:click={() => { createType = 'template'; showCreateModal = true; }}
    >
      <div class="flex items-center space-x-3">
        <div class="w-10 h-10 bg-green-100 dark:bg-green-900 rounded-lg flex items-center justify-center">
          <FileCode class="h-5 w-5 text-green-600 dark:text-green-400" />
        </div>
        <div>
          <p class="font-medium text-gray-900 dark:text-white">New Template</p>
          <p class="text-xs text-gray-500">Reusable configuration</p>
        </div>
      </div>
    </button>

    <button 
      class="bg-white dark:bg-gray-800 rounded-lg p-4 shadow-sm border border-gray-200 dark:border-gray-700 hover:shadow-md transition-shadow text-left"
      on:click={() => { createType = 'event'; showCreateModal = true; }}
    >
      <div class="flex items-center space-x-3">
        <div class="w-10 h-10 bg-amber-100 dark:bg-amber-900 rounded-lg flex items-center justify-center">
          <Zap class="h-5 w-5 text-amber-600 dark:text-amber-400" />
        </div>
        <div>
          <p class="font-medium text-gray-900 dark:text-white">Event Rule</p>
          <p class="text-xs text-gray-500">Trigger-based automation</p>
        </div>
      </div>
    </button>

    <button 
      class="bg-white dark:bg-gray-800 rounded-lg p-4 shadow-sm border border-gray-200 dark:border-gray-700 hover:shadow-md transition-shadow text-left"
      on:click={() => { createType = 'batch'; showCreateModal = true; }}
    >
      <div class="flex items-center space-x-3">
        <div class="w-10 h-10 bg-purple-100 dark:bg-purple-900 rounded-lg flex items-center justify-center">
          <Server class="h-5 w-5 text-purple-600 dark:text-purple-400" />
        </div>
        <div>
          <p class="font-medium text-gray-900 dark:text-white">Batch Operation</p>
          <p class="text-xs text-gray-500">Multi-device changes</p>
        </div>
      </div>
    </button>
  </div>

  <!-- Navigation Tabs -->
  <div class="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
    <div class="border-b border-gray-200 dark:border-gray-700">
      <nav class="flex -mb-px">
        <button
          class="py-4 px-6 border-b-2 font-medium text-sm transition-colors {activeTab === 'scheduled' ? 'border-indigo-500 text-indigo-600' : 'border-transparent text-gray-500 hover:text-gray-700'}"
          on:click={() => switchTab('scheduled')}
        >
          <div class="flex items-center space-x-2">
            <Clock class="h-4 w-4" />
            <span>Scheduled Tasks</span>
            <span class="bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full text-xs">{$scheduledAutomationStore.length}</span>
          </div>
        </button>
        <button
          class="py-4 px-6 border-b-2 font-medium text-sm transition-colors {activeTab === 'templates' ? 'border-indigo-500 text-indigo-600' : 'border-transparent text-gray-500 hover:text-gray-700'}"
          on:click={() => switchTab('templates')}
        >
          <div class="flex items-center space-x-2">
            <FileCode class="h-4 w-4" />
            <span>Templates</span>
            <span class="bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full text-xs">{templateStats.total}</span>
          </div>
        </button>
        <button
          class="py-4 px-6 border-b-2 font-medium text-sm transition-colors {activeTab === 'events' ? 'border-indigo-500 text-indigo-600' : 'border-transparent text-gray-500 hover:text-gray-700'}"
          on:click={() => switchTab('events')}
        >
          <div class="flex items-center space-x-2">
            <Zap class="h-4 w-4" />
            <span>Event Rules</span>
            <span class="bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full text-xs">{$eventAutomationStore.length}</span>
          </div>
        </button>
        <button
          class="py-4 px-6 border-b-2 font-medium text-sm transition-colors {activeTab === 'batch' ? 'border-indigo-500 text-indigo-600' : 'border-transparent text-gray-500 hover:text-gray-700'}"
          on:click={() => switchTab('batch')}
        >
          <div class="flex items-center space-x-2">
            <Layers class="h-4 w-4" />
            <span>Batch Operations</span>
            <span class="bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full text-xs">{batchStats.total}</span>
          </div>
        </button>
      </nav>
    </div>

    <div class="p-6">
      <!-- Scheduled Tasks Tab -->
      {#if activeTab === 'scheduled'}
        <div class="space-y-4">
          <div class="flex justify-between items-center">
            <h2 class="text-lg font-semibold text-gray-900 dark:text-white">Scheduled Automation Tasks</h2>
            <div class="flex space-x-2">
              <span class="text-sm text-gray-500">Active: {scheduledStats.active}</span>
              <span class="text-sm text-gray-500">Paused: {scheduledStats.paused}</span>
            </div>
          </div>
          
          <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {#each $scheduledAutomationStore as task}
              <div class="border border-gray-200 dark:border-gray-700 rounded-lg p-4 hover:shadow-md transition-shadow">
                <div class="flex items-start justify-between">
                  <div class="flex items-center space-x-2">
                    {#if task.status === 'pending'}
                      <Clock class="h-5 w-5 text-blue-500" />
                    {:else if task.status === 'running'}
                      <Activity class="h-5 w-5 text-green-500 animate-pulse" />
                    {:else if task.status === 'paused' || task.status === 'disabled'}
                      <Pause class="h-5 w-5 text-gray-400" />
                    {:else if task.status === 'failed'}
                      <XCircle class="h-5 w-5 text-red-500" />
                    {/if}
                    <h3 class="font-medium text-gray-900 dark:text-white">{task.name}</h3>
                  </div>
                  <span class="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium {task.status === 'pending' ? 'bg-green-100 text-green-800' : task.status === 'failed' ? 'bg-red-100 text-red-800' : 'bg-gray-100 text-gray-800'}">
                    {task.status}
                  </span>
                </div>
                <p class="text-sm text-gray-500 mt-2">{task.description}</p>
                <div class="mt-3 flex items-center text-xs text-gray-400">
                  <span class="capitalize">{task.frequency}</span>
                  <span class="mx-2">•</span>
                  <span>Next: {formatDuration(task.nextRunAt - Date.now())}</span>
                </div>
                {#if task.lastRunStatus}
                  <div class="mt-2 text-xs">
                    <span class={task.lastRunStatus === 'success' ? 'text-green-600' : 'text-red-600'}>
                      Last run: {task.lastRunStatus}
                    </span>
                  </div>
                {/if}
              </div>
            {/each}
          </div>
        </div>
      {/if}

      <!-- Templates Tab -->
      {#if activeTab === 'templates'}
        <div class="space-y-4">
          <div class="flex justify-between items-center">
            <h2 class="text-lg font-semibold text-gray-900 dark:text-white">Configuration Templates</h2>
            <div class="flex space-x-4 text-sm">
              <span class="text-green-600">Approved: {templateStats.byStatus?.approved || 0}</span>
              <span class="text-amber-600">Pending: {templateStats.byStatus?.['pending-approval'] || 0}</span>
              <span class="text-blue-600">Total Uses: {templateStats.totalDeployments}</span>
            </div>
          </div>
          
          <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {#each $configTemplateStore.slice(0, 6) as template}
              <div class="border border-gray-200 dark:border-gray-700 rounded-lg p-4 hover:shadow-md transition-shadow">
                <div class="flex items-start justify-between">
                  <div>
                    <span class="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium {template.type === 'as3' ? 'bg-blue-100 text-blue-800' : template.type === 'do' ? 'bg-green-100 text-green-800' : 'bg-purple-100 text-purple-800'}">
                      {template.type.toUpperCase()}
                    </span>
                    <h3 class="font-medium text-gray-900 dark:text-white mt-2">{template.name}</h3>
                  </div>
                  <span class="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium {template.status === 'approved' ? 'bg-green-100 text-green-800' : template.status === 'pending-approval' ? 'bg-amber-100 text-amber-800' : 'bg-gray-100 text-gray-800'}">
                    {template.status}
                  </span>
                </div>
                <p class="text-sm text-gray-500 mt-2 line-clamp-2">{template.description}</p>
                <div class="mt-3 flex items-center justify-between text-xs text-gray-400">
                  <span>{template.usageCount} uses</span>
                  <span>{template.successRate}% success</span>
                </div>
                <div class="mt-2 flex flex-wrap gap-1">
                  {#each template.tags.slice(0, 3) as tag}
                    <span class="px-2 py-0.5 bg-gray-100 dark:bg-gray-700 rounded text-xs">{tag}</span>
                  {/each}
                </div>
              </div>
            {/each}
          </div>
        </div>
      {/if}

      <!-- Event Rules Tab -->
      {#if activeTab === 'events'}
        <div class="space-y-4">
          <div class="flex justify-between items-center">
            <h2 class="text-lg font-semibold text-gray-900 dark:text-white">Event-Driven Automation</h2>
            <div class="flex space-x-4 text-sm">
              <span class="text-green-600">Enabled: {eventStats.enabledRules}</span>
              <span class="text-gray-500">Total Triggers: {eventStats.totalTriggers}</span>
              <span class="text-blue-600">Success: {eventStats.successRate.toFixed(1)}%</span>
            </div>
          </div>
          
          <div class="space-y-3">
            {#each $eventAutomationStore as rule}
              <div class="border border-gray-200 dark:border-gray-700 rounded-lg p-4 hover:shadow-md transition-shadow">
                <div class="flex items-center justify-between">
                  <div class="flex items-center space-x-3">
                    {#if rule.enabled}
                      <CheckCircle class="h-5 w-5 text-green-500" />
                    {:else}
                      <XCircle class="h-5 w-5 text-gray-400" />
                    {/if}
                    <div>
                      <h3 class="font-medium text-gray-900 dark:text-white">{rule.name}</h3>
                      <p class="text-sm text-gray-500">{rule.description}</p>
                    </div>
                  </div>
                  <div class="text-right">
                    <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium {rule.enabled ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}">
                      {rule.enabled ? 'Active' : 'Disabled'}
                    </span>
                    <p class="text-xs text-gray-400 mt-1">{rule.triggerCount} triggers</p>
                  </div>
                </div>
                <div class="mt-3 flex items-center space-x-4 text-xs text-gray-500">
                  <span class="flex items-center">
                    <Globe class="h-3 w-3 mr-1" />
                    {rule.source}
                  </span>
                  <span class="flex items-center">
                    <Zap class="h-3 w-3 mr-1" />
                    {rule.eventType}
                  </span>
                  <span class="flex items-center">
                    <Settings class="h-3 w-3 mr-1" />
                    {rule.executionMode}
                  </span>
                </div>
              </div>
            {/each}
          </div>
        </div>
      {/if}

      <!-- Batch Operations Tab -->
      {#if activeTab === 'batch'}
        <div class="space-y-4">
          <div class="flex justify-between items-center">
            <h2 class="text-lg font-semibold text-gray-900 dark:text-white">Batch Operations</h2>
            <div class="flex space-x-4 text-sm">
              <span class="text-blue-600">Running: {batchStats.running}</span>
              <span class="text-green-600">Completed: {batchStats.completed}</span>
              <span class="text-red-600">Failed: {batchStats.failed}</span>
            </div>
          </div>
          
          <div class="space-y-3">
            {#each $batchOperationStore as operation}
              <div class="border border-gray-200 dark:border-gray-700 rounded-lg p-4 hover:shadow-md transition-shadow">
                <div class="flex items-center justify-between">
                  <div class="flex items-center space-x-3">
                    {#if operation.status === 'running'}
                      <Activity class="h-5 w-5 text-blue-500 animate-pulse" />
                    {:else if operation.status === 'completed'}
                      <CheckCircle class="h-5 w-5 text-green-500" />
                    {:else if operation.status === 'failed'}
                      <XCircle class="h-5 w-5 text-red-500" />
                    {:else if operation.status === 'pending_approval'}
                      <Clock class="h-5 w-5 text-amber-500" />
                    {:else}
                      <Layers class="h-5 w-5 text-gray-400" />
                    {/if}
                    <div>
                      <h3 class="font-medium text-gray-900 dark:text-white">{operation.name}</h3>
                      <p class="text-sm text-gray-500">{operation.description}</p>
                    </div>
                  </div>
                  <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium 
                    {operation.status === 'completed' ? 'bg-green-100 text-green-800' : 
                     operation.status === 'running' ? 'bg-blue-100 text-blue-800' : 
                     operation.status === 'failed' ? 'bg-red-100 text-red-800' : 
                     operation.status === 'pending_approval' ? 'bg-amber-100 text-amber-800' :
                     'bg-gray-100 text-gray-800'}">
                    {operation.status}
                  </span>
                </div>
                
                <!-- Progress Bar -->
                <div class="mt-3">
                  <div class="flex justify-between text-xs text-gray-500 mb-1">
                    <span>{operation.completedDevices} of {operation.totalDevices} devices</span>
                    <span>{operation.progress}%</span>
                  </div>
                  <div class="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                    <div class="bg-indigo-600 h-2 rounded-full transition-all duration-300" style="width: {operation.progress}%"></div>
                  </div>
                </div>
                
                <div class="mt-3 flex items-center space-x-4 text-xs text-gray-500">
                  <span>Type: {operation.type}</span>
                  <span>Created: {formatTime(operation.createdAt)}</span>
                  {#if operation.summary}
                    <span class="text-green-600">{operation.summary.successRate}% success</span>
                  {/if}
                </div>
              </div>
            {/each}
          </div>
        </div>
      {/if}
    </div>
  </div>

  <!-- Automation Templates Gallery -->
  <div class="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
    <h2 class="text-lg font-semibold text-gray-900 dark:text-white mb-4">Quick-Start Automation Templates</h2>
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {#each Object.entries(automationTemplates) as [key, template]}
        <div class="border border-gray-200 dark:border-gray-700 rounded-lg p-4 hover:border-indigo-300 dark:hover:border-indigo-700 cursor-pointer transition-colors">
          <h3 class="font-medium text-gray-900 dark:text-white">{template.name}</h3>
          <p class="text-sm text-gray-500 mt-1 line-clamp-2">{template.description}</p>
          <div class="mt-3 flex items-center text-xs text-indigo-600">
            <span>Use template</span>
            <ChevronRight class="h-3 w-3 ml-1" />
          </div>
        </div>
      {/each}
    </div>
  </div>

  <!-- Enterprise Value Banner -->
  <div class="bg-gradient-to-r from-emerald-600 to-teal-600 rounded-xl p-6 text-white">
    <div class="flex items-start space-x-4">
      <div class="flex-shrink-0">
        <div class="w-12 h-12 bg-white/20 rounded-lg flex items-center justify-center">
          <span class="text-2xl">🚀</span>
        </div>
      </div>
      <div>
        <h3 class="text-xl font-bold">Enterprise Automation Benefits</h3>
        <div class="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
          <div class="bg-white/10 backdrop-blur-sm rounded-lg p-3">
            <p class="font-semibold">⏱️ Time Savings</p>
            <p class="text-sm text-emerald-100">Reduce manual tasks by 80%</p>
          </div>
          <div class="bg-white/10 backdrop-blur-sm rounded-lg p-3">
            <p class="font-semibold">🎯 Consistency</p>
            <p class="text-sm text-emerald-100">Eliminate configuration drift</p>
          </div>
          <div class="bg-white/10 backdrop-blur-sm rounded-lg p-3">
            <p class="font-semibold">🛡️ Compliance</p>
            <p class="text-sm text-emerald-100">Automated audit trails</p>
          </div>
        </div>
      </div>
    </div>
  </div>
</div>

<!-- Create Modal -->
{#if showCreateModal}
  <div class="fixed inset-0 bg-black/50 flex items-center justify-center z-50" on:click={() => showCreateModal = false}>
    <div class="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full mx-4 p-6" on:click|stopPropagation>
      <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-4">
        Create {createType === 'scheduled' ? 'Scheduled Task' : createType === 'template' ? 'Template' : createType === 'event' ? 'Event Rule' : 'Batch Operation'}
      </h3>
      <p class="text-sm text-gray-500 mb-4">
        Select a template to get started quickly, or create from scratch.
      </p>
      <div class="space-y-2 max-h-64 overflow-y-auto">
        {#if createType === 'scheduled'}
          {#each Object.entries(automationTemplates) as [key, template]}
            <button 
              class="w-full text-left p-3 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700"
              on:click={() => { showCreateModal = false; }}
            >
              <p class="font-medium text-gray-900 dark:text-white">{template.name}</p>
              <p class="text-xs text-gray-500">{template.description}</p>
            </button>
          {/each}
        {:else if createType === 'template'}
          {#each Object.entries(enterpriseTemplates) as [key, template]}
            <button 
              class="w-full text-left p-3 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700"
              on:click={() => { showCreateModal = false; }}
            >
              <p class="font-medium text-gray-900 dark:text-white">{template.name}</p>
              <p class="text-xs text-gray-500">{template.description}</p>
            </button>
          {/each}
        {:else if createType === 'event'}
          {#each Object.entries(eventAutomationPresets) as [key, preset]}
            <button 
              class="w-full text-left p-3 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700"
              on:click={() => { showCreateModal = false; }}
            >
              <p class="font-medium text-gray-900 dark:text-white">{preset.name}</p>
              <p class="text-xs text-gray-500">{preset.description}</p>
            </button>
          {/each}
        {:else if createType === 'batch'}
          {#each Object.entries(batchOperationTemplates) as [key, template]}
            <button 
              class="w-full text-left p-3 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700"
              on:click={() => { showCreateModal = false; }}
            >
              <p class="font-medium text-gray-900 dark:text-white">{template.name}</p>
              <p class="text-xs text-gray-500">{template.description}</p>
            </button>
          {/each}
        {/if}
      </div>
      <div class="mt-4 flex justify-end space-x-2">
        <button 
          class="px-4 py-2 text-sm text-gray-600 hover:text-gray-900"
          on:click={() => showCreateModal = false}
        >
          Cancel
        </button>
        <button 
          class="px-4 py-2 text-sm bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
          on:click={() => showCreateModal = false}
        >
          Create from Scratch
        </button>
      </div>
    </div>
  </div>
{/if}
