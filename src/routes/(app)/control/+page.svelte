<script lang="ts">
  import { onMount } from 'svelte';
  import { circuitBreakerStore, circuitBreakerActions } from '$lib/stores/circuitBreakerStore';
  import { notificationStore } from '$lib/stores/notificationStore';
  import LaneControl from '$lib/components/LaneControl.svelte';
  import QuickActions from '$lib/components/QuickActions.svelte';
  import GlobalSettings from '$lib/components/GlobalSettings.svelte';
  import type { CircuitBreakerConfig, Lane } from '$lib/types';

  let config: CircuitBreakerConfig | undefined;
  let lanes: Lane[] = [];
  let showConfirmModal = false;
  let laneToFlip: string | null = null;

  $: config = $circuitBreakerStore;
  $: lanes = $circuitBreakerStore?.lanes || [];

  function handleLaneToggle(laneId: string, level: 'edge' | 'enterprise', status: string) {
    const lane = lanes.find(l => l.id === laneId);
    if (!lane) return;

    // Type guard for status
    if (status !== 'active' && status !== 'inactive' && status !== 'closed') {
        console.error('Invalid status:', status);
        return;
    }
    const validStatus = status as 'active' | 'inactive' | 'closed';

    const newEdgeStatus = level === 'edge' ? validStatus : lane.edgeStatus;
    const newEnterpriseStatus = level === 'enterprise' ? validStatus : lane.enterpriseStatus;

    circuitBreakerActions.updateLaneStatus(laneId, newEdgeStatus, newEnterpriseStatus);
    
    notificationStore.add({
      type: 'success',
      title: 'Lane Updated',
      message: `${lane.name} ${level} status changed to ${status}`
    });
  }

  function handleFlipDownLane(laneId: string) {
    laneToFlip = laneId;
    showConfirmModal = true;
  }

  function confirmFlipDown() {
    if (laneToFlip) {
      circuitBreakerActions.flipDownLane(laneToFlip);
      notificationStore.add({
        type: 'warning',
        title: 'Lane Flipped Down',
        message: `Lane ${laneToFlip} has been manually closed`
      });
    }
    showConfirmModal = false;
    laneToFlip = null;
  }

  function cancelFlipDown() {
    showConfirmModal = false;
    laneToFlip = null;
  }

  function handleQuickAction(action: string) {
    switch (action) {
      case 'activate_all':
        lanes.forEach(lane => {
          if (lane.edgeStatus !== 'active' || lane.enterpriseStatus !== 'active') {
            circuitBreakerActions.updateLaneStatus(lane.id, 'active', 'active');
          }
        });
        notificationStore.add({
          type: 'success',
          title: 'All Lanes Activated',
          message: 'All lanes have been activated'
        });
        break;
      case 'failover_lane2':
        // Simulate failover to lane 2
        lanes.forEach(lane => {
          if (lane.id !== 'lane2') {
            circuitBreakerActions.updateLaneStatus(lane.id, 'inactive', 'inactive');
          } else {
            circuitBreakerActions.updateLaneStatus(lane.id, 'active', 'active');
          }
        });
        notificationStore.add({
          type: 'info',
          title: 'Failover Initiated',
          message: 'Traffic failed over to Lane 2'
        });
        break;
      case 'maintenance_mode':
        if (!config) return;
        const newMaintenanceMode = !config.systemSettings.maintenanceMode;
        circuitBreakerStore.update(cfg => ({
          ...cfg,
          systemSettings: {
            ...cfg.systemSettings,
            maintenanceMode: newMaintenanceMode
          }
        }));
        notificationStore.add({
          type: 'info',
          title: 'Maintenance Mode',
          message: `Maintenance mode ${newMaintenanceMode ? 'enabled' : 'disabled'}`
        });
        break;
    }
  }
</script>

<svelte:head>
  <title>Control Panel - OCBC Circuit Breaker Portal</title>
</svelte:head>

<div class="space-y-8">
  <!-- Header -->
  <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between">
    <div>
      <div class="flex items-center space-x-3 mb-2">
        <h1 class="text-3xl font-bold text-gray-900 dark:text-white">Circuit Breaker Control Panel</h1>
        <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
          Ready to Integrate
        </span>
      </div>
      <p class="mt-2 text-gray-600 dark:text-gray-400">
        Manage lane status, circuit breakers, and system-wide settings
      </p>
      <p class="text-sm text-gray-500 dark:text-gray-400 mt-1">
        <strong>Requirements:</strong> F5 BIG-IP with iControl REST API, GTM/LTM modules
      </p>
    </div>
  </div>

  <!-- Quick Actions -->
  <QuickActions onAction={handleQuickAction} />

  <!-- Lane Controls -->
  <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
    {#each lanes as lane (lane.id)}
      <LaneControl 
        {lane} 
        onToggle={handleLaneToggle}
        onFlipDown={() => handleFlipDownLane(lane.id)}
      />
    {/each}
  </div>

  <!-- Global Settings -->
  <GlobalSettings {config} />
</div>

<!-- Confirmation Modal -->
{#if showConfirmModal}
  <div class="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
    <div class="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white dark:bg-gray-800">
      <div class="mt-3 text-center">
        <div class="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-danger-100 dark:bg-danger-900">
          <svg class="h-6 w-6 text-danger-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
          </svg>
        </div>
        <h3 class="text-lg font-medium text-gray-900 dark:text-white mt-4">
          Flip Down Lane
        </h3>
        <div class="mt-2 px-7 py-3">
          <p class="text-sm text-gray-500 dark:text-gray-400">
            Are you sure you want to flip down {laneToFlip}? This will close both edge and enterprise circuit breakers for this lane.
          </p>
        </div>
        <div class="items-center px-4 py-3">
          <button
            class="px-4 py-2 bg-danger-500 text-white text-base font-medium rounded-md w-24 shadow-sm hover:bg-danger-600 focus:outline-none focus:ring-2 focus:ring-danger-300 mr-2"
            on:click={confirmFlipDown}
          >
            Yes
          </button>
          <button
            class="px-4 py-2 bg-gray-300 text-gray-800 text-base font-medium rounded-md w-24 shadow-sm hover:bg-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-300"
            on:click={cancelFlipDown}
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  </div>
{/if}
