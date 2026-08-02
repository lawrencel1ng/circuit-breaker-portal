<script lang="ts">
  import { Server, Plus, Trash2, Edit, Save, X } from 'lucide-svelte';
  import { circuitBreakerStore } from '$lib/stores/circuitBreakerStore';
  import type { CircuitBreakerConfig, Lane, VirtualServer, Pool, PoolMember } from '$lib/types';

  export let config: CircuitBreakerConfig | undefined;

  let selectedLane: string = 'lane1';
  let selectedLevel: 'edge' | 'enterprise' = 'edge';
  let showVirtualServerForm = false;
  let showPoolForm = false;
  let editingVirtualServer: VirtualServer | null = null;
  let editingPool: Pool | null = null;

  $: currentLane = config?.lanes?.find(l => l.id === selectedLane);
  $: currentLoadBalancer = currentLane ? 
    (selectedLevel === 'edge' ? currentLane.edgeLoadBalancer : currentLane.enterpriseLoadBalancer) : 
    null;

  function addVirtualServer() {
    editingVirtualServer = {
      name: '',
      ip: '',
      port: 80,
      status: 'enabled'
    };
    showVirtualServerForm = true;
  }

  function addPool() {
    editingPool = {
      name: '',
      members: []
    };
    showPoolForm = true;
  }

  function saveVirtualServer() {
    if (editingVirtualServer && currentLoadBalancer && config) {
      const updatedLanes = config.lanes.map(lane => {
        if (lane.id === selectedLane) {
          const updatedLoadBalancer = {
            ...currentLoadBalancer,
            virtualServers: [...currentLoadBalancer.virtualServers, editingVirtualServer]
          };
          return {
            ...lane,
            [selectedLevel === 'edge' ? 'edgeLoadBalancer' : 'enterpriseLoadBalancer']: updatedLoadBalancer
          };
        }
        return lane;
      });
      
      circuitBreakerStore.update(cfg => ({
        ...cfg,
        lanes: updatedLanes
      }));
    }
    showVirtualServerForm = false;
    editingVirtualServer = null;
  }

  function savePool() {
    if (editingPool && currentLoadBalancer && config) {
      const updatedLanes = config.lanes.map(lane => {
        if (lane.id === selectedLane) {
          const updatedLoadBalancer = {
            ...currentLoadBalancer,
            pools: [...currentLoadBalancer.pools, editingPool]
          };
          return {
            ...lane,
            [selectedLevel === 'edge' ? 'edgeLoadBalancer' : 'enterpriseLoadBalancer']: updatedLoadBalancer
          };
        }
        return lane;
      });
      
      circuitBreakerStore.update(cfg => ({
        ...cfg,
        lanes: updatedLanes
      }));
    }
    showPoolForm = false;
    editingPool = null;
  }

  function cancelEdit() {
    showVirtualServerForm = false;
    showPoolForm = false;
    editingVirtualServer = null;
    editingPool = null;
  }
</script>

{#if config}
<div class="card p-6">
  <div class="flex items-center justify-between mb-6">
    <div class="flex items-center space-x-2">
      <Server class="h-5 w-5 text-gray-500" />
      <h3 class="text-lg font-semibold text-gray-900 dark:text-white">Load Balancer Configuration</h3>
    </div>
  </div>

  <!-- Lane and Level Selection -->
  <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
    <div>
      <label for="lb-select-lane" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
        Select Lane
      </label>
      <select
        id="lb-select-lane"
        bind:value={selectedLane}
        class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 dark:bg-gray-700 dark:text-white"
      >
        {#each config?.lanes || [] as lane (lane.id)}
          <option value={lane.id}>{lane.name}</option>
        {/each}
      </select>
    </div>
    <div>
      <label for="lb-select-level" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
        Select Level
      </label>
      <select
        id="lb-select-level"
        bind:value={selectedLevel}
        class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 dark:bg-gray-700 dark:text-white"
      >
        <option value="edge">Edge Load Balancer</option>
        <option value="enterprise">Enterprise Load Balancer</option>
      </select>
    </div>
  </div>

  {#if currentLoadBalancer}
    <!-- Virtual Servers -->
    <div class="mb-8">
      <div class="flex items-center justify-between mb-4">
        <h4 class="text-md font-medium text-gray-900 dark:text-white">Virtual Servers</h4>
        <button
          class="btn-primary text-sm flex items-center space-x-2"
          on:click={addVirtualServer}
        >
          <Plus class="h-4 w-4" />
          <span>Add Virtual Server</span>
        </button>
      </div>

      <div class="space-y-3">
        {#each currentLoadBalancer.virtualServers as vs (vs.name)}
          <div class="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
            <div class="flex-1">
              <div class="flex items-center space-x-3">
                <span class="font-medium text-gray-900 dark:text-white">{vs.name}</span>
                <span class="text-sm text-gray-500 dark:text-gray-400">{vs.ip}:{vs.port}</span>
                <span class="status-indicator {vs.status === 'enabled' ? 'status-active' : 'status-inactive'}">
                  {vs.status}
                </span>
              </div>
            </div>
            <div class="flex items-center space-x-2">
              <button class="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300" aria-label="Edit virtual server">
                <Edit class="h-4 w-4" />
              </button>
              <button class="p-1 text-gray-400 hover:text-danger-600 dark:hover:text-danger-400" aria-label="Delete virtual server">
                <Trash2 class="h-4 w-4" />
              </button>
            </div>
          </div>
        {/each}
      </div>
    </div>

    <!-- Pools -->
    <div>
      <div class="flex items-center justify-between mb-4">
        <h4 class="text-md font-medium text-gray-900 dark:text-white">Pools</h4>
        <button
          class="btn-primary text-sm flex items-center space-x-2"
          on:click={addPool}
        >
          <Plus class="h-4 w-4" />
          <span>Add Pool</span>
        </button>
      </div>

      <div class="space-y-3">
        {#each currentLoadBalancer.pools as pool (pool.name)}
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
{/if}

<!-- Virtual Server Form Modal -->
{#if showVirtualServerForm}
  <div class="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
    <div class="relative top-20 mx-auto p-5 border w-full max-w-md shadow-lg rounded-md bg-white dark:bg-gray-800">
      <div class="space-y-4">
        <h4 class="text-lg font-medium text-gray-900 dark:text-white">Add Virtual Server</h4>
        
        {#if editingVirtualServer}
        <div>
          <label for="vs-name" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Name
          </label>
          <input
            id="vs-name"
            type="text"
            bind:value={editingVirtualServer.name}
            class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 dark:bg-gray-700 dark:text-white"
          />
        </div>

        <div>
          <label for="vs-ip" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            IP Address
          </label>
          <input
            id="vs-ip"
            type="text"
            bind:value={editingVirtualServer.ip}
            class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 dark:bg-gray-700 dark:text-white"
          />
        </div>

        <div>
          <label for="vs-port" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Port
          </label>
          <input
            id="vs-port"
            type="number"
            bind:value={editingVirtualServer.port}
            class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 dark:bg-gray-700 dark:text-white"
          />
        </div>
        {/if}

        <div class="flex justify-end space-x-3">
          <button class="btn-secondary" on:click={cancelEdit}>Cancel</button>
          <button class="btn-primary" on:click={saveVirtualServer}>Save</button>
        </div>
      </div>
    </div>
  </div>
{/if}

<!-- Pool Form Modal -->
{#if showPoolForm}
  <div class="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
    <div class="relative top-20 mx-auto p-5 border w-full max-w-md shadow-lg rounded-md bg-white dark:bg-gray-800">
      <div class="space-y-4">
        <h4 class="text-lg font-medium text-gray-900 dark:text-white">Add Pool</h4>
        
        {#if editingPool}
        <div>
          <label for="pool-name" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Pool Name
          </label>
          <input
            id="pool-name"
            type="text"
            bind:value={editingPool.name}
            class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 dark:bg-gray-700 dark:text-white"
          />
        </div>
        {/if}

        <div class="flex justify-end space-x-3">
          <button class="btn-secondary" on:click={cancelEdit}>Cancel</button>
          <button class="btn-primary" on:click={savePool}>Save</button>
        </div>
      </div>
    </div>
  </div>
{/if}
