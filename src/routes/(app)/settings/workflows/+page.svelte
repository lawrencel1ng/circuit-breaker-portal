<script lang="ts">
  import { workflowStore } from '$lib/stores/workflowStore';
  import { Shield, GitPullRequest, Settings, Check, ToggleLeft, ToggleRight, UserCog } from 'lucide-svelte';

  function toggleRule(id: string) {
    workflowStore.toggleApproval(id);
  }
</script>

<svelte:head>
  <title>Workflow Settings - Circuit Breaker Portal</title>
</svelte:head>

<div class="space-y-6">
  <!-- Header -->
  <div class="bg-gradient-to-r from-purple-800 to-indigo-900 rounded-xl p-8 text-white shadow-lg">
    <div class="flex items-center space-x-4">
      <div class="p-3 bg-white/10 rounded-lg backdrop-blur-sm">
        <GitPullRequest class="h-8 w-8 text-purple-300" />
      </div>
      <div>
        <h1 class="text-3xl font-bold">Workflow Governance</h1>
        <p class="text-purple-100 mt-2 text-lg">
          Configure approval gates and role-based delegation for critical system actions.
        </p>
      </div>
    </div>
  </div>

  <!-- Rules Grid -->
  <div class="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
    <div class="p-6 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
      <h2 class="text-lg font-medium text-gray-900 dark:text-white">Approval Policies</h2>
      <button class="text-sm text-indigo-600 dark:text-indigo-400 font-medium hover:text-indigo-500">
        Reset to Defaults
      </button>
    </div>

    <div class="divide-y divide-gray-200 dark:divide-gray-700">
      {#each $workflowStore as rule}
        <div class="p-6 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-gray-750 transition-colors">
          <div class="flex items-start space-x-4">
            <div class="p-2 rounded-lg {rule.requiresApproval ? 'bg-indigo-100 text-indigo-600 dark:bg-indigo-900/30 dark:text-indigo-400' : 'bg-gray-100 text-gray-500 dark:bg-gray-700 dark:text-gray-400'}">
              <Shield class="h-6 w-6" />
            </div>
            <div>
              <h3 class="text-lg font-medium text-gray-900 dark:text-white flex items-center">
                {rule.name}
                {#if rule.requiresApproval}
                  <span class="ml-3 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300">
                    Active Gate
                  </span>
                {/if}
              </h3>
              <p class="text-sm text-gray-500 dark:text-gray-400 mt-1">{rule.description}</p>
              
              <div class="mt-2 flex items-center space-x-4 text-xs text-gray-500">
                <span class="flex items-center bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded">
                  <UserCog class="h-3 w-3 mr-1" />
                  Approver: <span class="font-bold ml-1 uppercase">{rule.approverRole}</span>
                </span>
                <span class="font-mono text-gray-400">ID: {rule.actionType}</span>
              </div>
            </div>
          </div>

          <div class="flex items-center">
            <button
              on:click={() => toggleRule(rule.id)}
              class="relative inline-flex flex-shrink-0 h-6 w-11 border-2 border-transparent rounded-full cursor-pointer transition-colors ease-in-out duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 {rule.requiresApproval ? 'bg-indigo-600' : 'bg-gray-200 dark:bg-gray-700'}"
            >
              <span class="sr-only">Toggle approval</span>
              <span 
                aria-hidden="true" 
                class="pointer-events-none inline-block h-5 w-5 rounded-full bg-white shadow transform ring-0 transition ease-in-out duration-200 {rule.requiresApproval ? 'translate-x-5' : 'translate-x-0'}"
              ></span>
            </button>
            <span class="ml-3 text-sm font-medium text-gray-900 dark:text-white min-w-[80px]">
              {rule.requiresApproval ? 'Required' : 'Disabled'}
            </span>
          </div>
        </div>
      {/each}
    </div>
  </div>
</div>
