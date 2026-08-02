<script lang="ts">
  import { swgStore } from '$lib/stores/swgStore';
  import { notificationStore } from '$lib/stores/notificationStore';
  import type { PolicyRule } from '$lib/types';
  import { Plus, GripVertical, ShieldAlert, CheckCircle, EyeOff, UserX, X, Edit, Trash2, Lock, Globe, Tag, Shield, ArrowUp, ArrowDown } from 'lucide-svelte';

  let selectedPolicyId = $swgStore.policies[0].id;
  
  // Modal State
  let isModalOpen = false;
  let editingRuleId: string | null = null;
  
  // Form Data
  let ruleName = '';
  let ruleType: 'TLS_ClientHello' | 'HTTP_URI' | 'Category' | 'User_ID' = 'HTTP_URI';
  let ruleOp: 'equals' | 'contains' | 'substring' = 'contains';
  let ruleValue = '';
  let ruleAction: 'allow' | 'reject' | 'intercept' | 'bypass' = 'reject';

  $: currentPolicy = $swgStore.policies.find(p => p.id === selectedPolicyId) || $swgStore.policies[0];

  function getActionColor(action: string) {
    switch (action) {
      case 'allow': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'reject': return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
      case 'intercept': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
      case 'bypass': return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
      default: return 'bg-gray-100 text-gray-800';
    }
  }

  function getConditionIcon(type: string) {
    switch (type) {
      case 'TLS_ClientHello': return Lock;
      case 'HTTP_URI': return Globe;
      case 'Category': return Tag;
      case 'User_ID': return UserX;
      default: return Shield;
    }
  }

  function openModal(rule?: PolicyRule) {
    if (rule) {
      editingRuleId = rule.id;
      ruleName = rule.name;
      ruleType = rule.condition.type;
      ruleOp = rule.condition.operator;
      ruleValue = rule.condition.value;
      ruleAction = rule.action;
    } else {
      editingRuleId = null;
      ruleName = '';
      ruleType = 'HTTP_URI';
      ruleOp = 'contains';
      ruleValue = '';
      ruleAction = 'reject';
    }
    isModalOpen = true;
  }

  function closeModal() {
    isModalOpen = false;
  }

  function saveRule() {
    if (!ruleName || !ruleValue) {
        notificationStore.add({ type: 'error', title: 'Validation Error', message: 'Name and Value are required.' });
        return;
    }

    const newRule: PolicyRule = {
      id: editingRuleId || `r${Date.now()}`,
      name: ruleName,
      condition: {
        type: ruleType,
        operator: ruleOp,
        value: ruleValue
      },
      action: ruleAction,
      enabled: true
    };

    if (editingRuleId) {
      swgStore.updatePolicyRule(selectedPolicyId, editingRuleId, newRule);
      notificationStore.add({ type: 'success', title: 'Rule Updated', message: 'Policy rule modified successfully.' });
    } else {
      swgStore.addPolicyRule(selectedPolicyId, newRule);
      notificationStore.add({ type: 'success', title: 'Rule Added', message: 'New security rule created.' });
    }
    closeModal();
  }

  function deleteRule(ruleId: string) {
    if (confirm('Are you sure you want to delete this rule?')) {
        swgStore.removePolicyRule(selectedPolicyId, ruleId);
        notificationStore.add({ type: 'info', title: 'Rule Deleted', message: 'Rule removed from policy.' });
    }
  }

  function toggleRule(rule: PolicyRule) {
      swgStore.updatePolicyRule(selectedPolicyId, rule.id, { enabled: !rule.enabled });
  }

  function moveRuleUp(index: number) {
    if (index > 0) {
      swgStore.reorderPolicyRules(selectedPolicyId, index, index - 1);
    }
  }

  function moveRuleDown(index: number) {
    const rules = currentPolicy.rules;
    if (index < rules.length - 1) {
      swgStore.reorderPolicyRules(selectedPolicyId, index, index + 1);
    }
  }
</script>

<div class="h-full flex flex-col space-y-6 relative">
  <!-- Policy Selector -->
  <div class="flex items-center space-x-4">
    <div class="flex-1">
      <label for="policy-select" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Select Policy Context</label>
      <select
        id="policy-select"
        bind:value={selectedPolicyId}
        class="block w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2 border"
      >
        {#each $swgStore.policies as policy}
          <option value={policy.id}>{policy.name}</option>
        {/each}
      </select>
    </div>
    <div class="flex-shrink-0 pt-6">
        <button
            on:click={() => openModal()}
            class="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
        >
            <Plus class="h-4 w-4 mr-2" />
            Add Rule
        </button>
    </div>
  </div>

  <!-- Rules List -->
  <div class="bg-white dark:bg-gray-800 shadow overflow-hidden sm:rounded-md border border-gray-200 dark:border-gray-700">
    <ul class="divide-y divide-gray-200 dark:divide-gray-700">
      {#each currentPolicy.rules as rule, index (rule.id)}
        <li>
          <div class="px-4 py-4 sm:px-6 hover:bg-gray-50 dark:hover:bg-gray-750 transition-colors">
            <div class="flex items-center justify-between">
              <div class="flex items-center flex-1 min-w-0">
                <div class="flex flex-col items-center mr-3">
                  <button 
                    on:click={() => moveRuleUp(index)}
                    disabled={index === 0}
                    class="p-1 text-gray-400 hover:text-gray-600 disabled:opacity-30 disabled:cursor-not-allowed"
                  >
                    <ArrowUp class="h-4 w-4" />
                  </button>
                  <span class="text-xs text-gray-400 font-mono">{index + 1}</span>
                  <button 
                    on:click={() => moveRuleDown(index)}
                    disabled={index === currentPolicy.rules.length - 1}
                    class="p-1 text-gray-400 hover:text-gray-600 disabled:opacity-30 disabled:cursor-not-allowed"
                  >
                    <ArrowDown class="h-4 w-4" />
                  </button>
                </div>
                <div class="flex-shrink-0">
                    <svelte:component this={getConditionIcon(rule.condition.type)} class="h-6 w-6 text-gray-500" />
                </div>
                <div class="ml-4 truncate">
                  <div class="flex items-center">
                    <p class="text-sm font-medium text-indigo-600 dark:text-indigo-400 truncate">{rule.name}</p>
                    <span class="ml-2 px-2 inline-flex text-xs leading-5 font-semibold rounded-full {getActionColor(rule.action)}">
                      {rule.action.toUpperCase()}
                    </span>
                    {#if !rule.enabled}
                        <span class="ml-2 px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-gray-100 text-gray-800">
                            DISABLED
                        </span>
                    {/if}
                  </div>
                  <div class="mt-1 flex items-center text-sm text-gray-500 dark:text-gray-400">
                    <span class="truncate">
                      If <strong>{rule.condition.type}</strong> {rule.condition.operator} <code>{rule.condition.value}</code>
                    </span>
                  </div>
                </div>
              </div>
              <div class="ml-4 flex-shrink-0 flex items-center space-x-2">
                <button on:click={() => toggleRule(rule)} class="p-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-400 hover:text-gray-600">
                    {#if rule.enabled}
                        <CheckCircle class="h-5 w-5 text-green-500" />
                    {:else}
                        <X class="h-5 w-5 text-gray-400" />
                    {/if}
                </button>
                <button on:click={() => openModal(rule)} class="p-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-400 hover:text-blue-500">
                    <Edit class="h-5 w-5" />
                </button>
                <button on:click={() => deleteRule(rule.id)} class="p-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-400 hover:text-red-500">
                    <Trash2 class="h-5 w-5" />
                </button>
              </div>
            </div>
          </div>
        </li>
      {/each}
      {#if currentPolicy.rules.length === 0}
        <li class="px-4 py-8 text-center text-gray-500 dark:text-gray-400">
            No rules defined for this policy.
        </li>
      {/if}
    </ul>
  </div>

  <!-- Modal Overlay -->
  {#if isModalOpen}
    <div class="fixed inset-0 z-50 overflow-y-auto" aria-labelledby="modal-title" role="dialog" aria-modal="true">
        <div class="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <!-- Background backdrop -->
            <div class="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" aria-hidden="true" on:click={closeModal}></div>

            <span class="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>

            <div class="inline-block align-bottom bg-white dark:bg-gray-800 rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg w-full">
                <div class="bg-white dark:bg-gray-800 px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                    <div class="sm:flex sm:items-start">
                        <div class="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left w-full">
                            <h3 class="text-lg leading-6 font-medium text-gray-900 dark:text-white" id="modal-title">
                                {editingRuleId ? 'Edit Rule' : 'Add New Rule'}
                            </h3>
                            <div class="mt-4 space-y-4">
                                <!-- Name -->
                                <div>
                                    <label for="rule-name" class="block text-sm font-medium text-gray-700 dark:text-gray-300">Rule Name</label>
                                    <input type="text" id="rule-name" bind:value={ruleName} class="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2 border" />
                                </div>

                                <!-- Condition -->
                                <div class="grid grid-cols-2 gap-4">
                                    <div>
                                        <label for="rule-type" class="block text-sm font-medium text-gray-700 dark:text-gray-300">Type</label>
                                        <select id="rule-type" bind:value={ruleType} class="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2 border">
                                            <option value="HTTP_URI">HTTP URI</option>
                                            <option value="TLS_ClientHello">TLS ClientHello</option>
                                            <option value="Category">Category</option>
                                            <option value="User_ID">User ID</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label for="rule-op" class="block text-sm font-medium text-gray-700 dark:text-gray-300">Operator</label>
                                        <select id="rule-op" bind:value={ruleOp} class="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2 border">
                                            <option value="contains">Contains</option>
                                            <option value="equals">Equals</option>
                                            <option value="substring">Substring</option>
                                        </select>
                                    </div>
                                </div>

                                <div>
                                    <label for="rule-value" class="block text-sm font-medium text-gray-700 dark:text-gray-300">Value</label>
                                    <input type="text" id="rule-value" bind:value={ruleValue} class="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2 border" placeholder="e.g. example.com or /Common/dg_group" />
                                </div>

                                <!-- Action -->
                                <div>
                                    <label for="rule-action" class="block text-sm font-medium text-gray-700 dark:text-gray-300">Action</label>
                                    <select id="rule-action" bind:value={ruleAction} class="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2 border">
                                        <option value="allow">Allow</option>
                                        <option value="reject">Reject</option>
                                        <option value="intercept">Intercept (SSL)</option>
                                        <option value="bypass">Bypass (SSL)</option>
                                    </select>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                <div class="bg-gray-50 dark:bg-gray-700 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                    <button type="button" on:click={saveRule} class="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-indigo-600 text-base font-medium text-white hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:ml-3 sm:w-auto sm:text-sm">
                        Save
                    </button>
                    <button type="button" on:click={closeModal} class="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm">
                        Cancel
                    </button>
                </div>
            </div>
        </div>
    </div>
  {/if}
</div>
