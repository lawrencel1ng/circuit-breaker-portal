<script lang="ts">
  import { Globe, Plus, Trash2, Edit } from 'lucide-svelte';
  import { circuitBreakerStore } from '$lib/stores/circuitBreakerStore';
  import type { CircuitBreakerConfig, Lane, WideIP, Pool } from '$lib/types';

  export let config: CircuitBreakerConfig | undefined;

  let selectedLane: string = 'lane1';
  let selectedLevel: 'edge' | 'enterprise' = 'edge';
  let showWideIPForm = false;
  let editingWideIP: WideIP | null = null;

  $: currentLane = config?.lanes?.find(l => l.id === selectedLane);
  $: currentCircuitBreaker = currentLane ? 
    (selectedLevel === 'edge' ? currentLane.edgeCircuitBreaker : currentLane.enterpriseCircuitBreaker) : 
    null;

  function addWideIP() {
    editingWideIP = {
      name: '',
      domain: '',
      status: 'active'
    };
    showWideIPForm = true;
  }

  function saveWideIP() {
    if (editingWideIP && currentCircuitBreaker && config) {
      const updatedLanes = config.lanes.map(lane => {
        if (lane.id === selectedLane) {
          const updatedCircuitBreaker = {
            ...currentCircuitBreaker,
            wideIPs: [...currentCircuitBreaker.wideIPs, editingWideIP]
          };
          return {
            ...lane,
            [selectedLevel === 'edge' ? 'edgeCircuitBreaker' : 'enterpriseCircuitBreaker']: updatedCircuitBreaker
          };
        }
        return lane;
      });
      
      circuitBreakerStore.update(cfg => ({
        ...cfg,
        lanes: updatedLanes
      }));
    }
    showWideIPForm = false;
    editingWideIP = null;
  }

  function cancelEdit() {
    showWideIPForm = false;
    editingWideIP = null;
  }
</script>

{#if config}
<div class="card p-6">
  <div class="flex items-center justify-between mb-6">
    <div class="flex items-center space-x-2">
      <Globe class="h-5 w-5 text-gray-500" />
      <h3 class="text-lg font-semibold text-gray-900 dark:text-white">GSLB Configuration</h3>
    </div>
  </div>

  <!-- Lane and Level Selection -->
  <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
    <div>
      <label for="gslb-select-lane" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
        Select Lane
      </label>
      <select
        id="gslb-select-lane"
        bind:value={selectedLane}
        class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 dark:bg-gray-700 dark:text-white"
      >
        {#each config?.lanes || [] as lane (lane.id)}
          <option value={lane.id}>{lane.name}</option>
        {/each}
      </select>
    </div>
    <div>
      <label for="gslb-select-level" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
        Select Level
      </label>
      <select
        id="gslb-select-level"
        bind:value={selectedLevel}
        class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 dark:bg-gray-700 dark:text-white"
      >
        <option value="edge">Edge Circuit Breaker</option>
        <option value="enterprise">Enterprise Circuit Breaker</option>
      </select>
    </div>
  </div>

  {#if currentCircuitBreaker}
    <!-- Wide IPs -->
    <div class="mb-8">
      <div class="flex items-center justify-between mb-4">
        <h4 class="text-md font-medium text-gray-900 dark:text-white">Wide IPs</h4>
        <button
          class="btn-primary text-sm flex items-center space-x-2"
          on:click={addWideIP}
        >
          <Plus class="h-4 w-4" />
          <span>Add Wide IP</span>
        </button>
      </div>

      <div class="space-y-3">
        {#each currentCircuitBreaker.wideIPs as wideIP (wideIP.name)}
          <div class="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
            <div class="flex-1">
              <div class="flex items-center space-x-3">
                <span class="font-medium text-gray-900 dark:text-white">{wideIP.name}</span>
                <span class="text-sm text-gray-500 dark:text-gray-400">{wideIP.domain}</span>
                <span class="status-indicator {wideIP.status === 'active' ? 'status-active' : 'status-inactive'}">
                  {wideIP.status}
                </span>
              </div>
            </div>
            <div class="flex items-center space-x-2">
              <button class="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300" aria-label="Edit Wide IP">
                <Edit class="h-4 w-4" />
              </button>
              <button class="p-1 text-gray-400 hover:text-danger-600 dark:hover:text-danger-400" aria-label="Delete Wide IP">
                <Trash2 class="h-4 w-4" />
              </button>
            </div>
          </div>
        {/each}
      </div>
    </div>

    <!-- GSLB Pools -->
    <div>
      <div class="flex items-center justify-between mb-4">
        <h4 class="text-md font-medium text-gray-900 dark:text-white">GSLB Pools</h4>
      </div>

      <div class="space-y-3">
        {#each currentCircuitBreaker.pools as pool (pool.name)}
          <div class="p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
            <div class="flex items-center justify-between mb-2">
              <span class="font-medium text-gray-900 dark:text-white">{pool.name}</span>
              <div class="flex items-center space-x-2">
                <button class="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300" aria-label="Edit pool">
                  <Edit class="h-4 w-4" />
                </button>
                <button class="p-1 text-gray-400 hover:text-danger-600 dark:hover:text-danger-400" aria-label="Delete pool">
                  <Trash2 class="h-4 w-4" />
                </button>
              </div>
            </div>
            <div class="text-sm text-gray-500 dark:text-gray-400">
              {typeof pool.members === 'number' ? pool.members : pool.members.length} member{(typeof pool.members === 'number' ? pool.members : pool.members.length) !== 1 ? 's' : ''}
            </div>
          </div>
        {/each}
      </div>
    </div>
  {/if}
</div>

<!-- Wide IP Form Modal -->
{#if showWideIPForm}
  <div class="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
    <div class="relative top-20 mx-auto p-5 border w-full max-w-md shadow-lg rounded-md bg-white dark:bg-gray-800">
      <div class="space-y-4">
        <h4 class="text-lg font-medium text-gray-900 dark:text-white">Add Wide IP</h4>
        
        {#if editingWideIP}
        <div>
          <label for="wideip-name" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Name
          </label>
          <input
            id="wideip-name"
            type="text"
            bind:value={editingWideIP.name}
            class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 dark:bg-gray-700 dark:text-white"
          />
        </div>

        <div>
          <label for="wideip-domain" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Domain
          </label>
          <input
            id="wideip-domain"
            type="text"
            bind:value={editingWideIP.domain}
            class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 dark:bg-gray-700 dark:text-white"
          />
        </div>

        <div>
          <label for="wideip-status" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Status
          </label>
          <select
            id="wideip-status"
            bind:value={editingWideIP.status}
            class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 dark:bg-gray-700 dark:text-white"
          >
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
        </div>
        {/if}

        <div class="flex justify-end space-x-3">
          <button class="btn-secondary" on:click={cancelEdit}>Cancel</button>
          <button class="btn-primary" on:click={saveWideIP}>Save</button>
        </div>
      </div>
    </div>          
  </div>
{/if}
{/if}
