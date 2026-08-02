<script lang="ts">
  import { Play, RotateCcw, ShieldAlert, Wrench, Loader2 } from 'lucide-svelte';
  import { DemoScenarios as Sim } from '$lib/utils/demoScenarios';
  import { notificationStore } from '$lib/stores/notificationStore';


  let running = false;
  let currentScenario = '';

  async function run(fn: () => Promise<void>, title: string) {
    if (running) return;
    running = true;
    currentScenario = title;
    notificationStore.add({ type: 'info', title, message: 'Simulation started' });
    try {
      await fn();
      notificationStore.add({ type: 'success', title, message: 'Simulation completed successfully' });
    } catch (e) {
      console.error('Demo scenario failed:', e);
      notificationStore.add({ type: 'error', title, message: 'Simulation failed - check console for details' });
    } finally {
      running = false;
      currentScenario = '';
    }
  }
</script>

<div class="card p-6">
  <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-4">Demo Scenarios</h3>

  <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">

    <button class="btn-danger flex items-center justify-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed" 
      aria-label="Flip down Lane 1"
      on:click={() => run(() => Sim.flipDownLane('lane1'), 'Flip Down Lane 1')} 
      disabled={running}>
      {#if running && currentScenario === 'Flip Down Lane 1'}
        <Loader2 class="h-4 w-4 animate-spin" />
      {:else}
        <ShieldAlert class="h-4 w-4" />
      {/if}
      <span>Flip Down L1</span>
    </button>

    <button class="btn-secondary flex items-center justify-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed" 
      aria-label="Failover to Lane 2"
      on:click={() => run(() => Sim.failoverToLane('lane2'), 'Failover to Lane 2')} 
      disabled={running}>
      {#if running && currentScenario === 'Failover to Lane 2'}
        <Loader2 class="h-4 w-4 animate-spin" />
      {:else}
        <RotateCcw class="h-4 w-4" />
      {/if}
      <span>Failover → L2</span>
    </button>

    <button class="btn-secondary flex items-center justify-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed" 
      aria-label="Health incident Lane 3"
      on:click={() => run(() => Sim.healthIncident('lane3'), 'Health Incident L3')} 
      disabled={running}>
      {#if running && currentScenario === 'Health Incident L3'}
        <Loader2 class="h-4 w-4 animate-spin" />
      {:else}
        <Play class="h-4 w-4" />
      {/if}
      <span>Health Incident L3</span>
    </button>

    <button class="btn-secondary flex items-center justify-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed" 
      aria-label="Rolling deployment"
      on:click={() => run(() => Sim.rollingDeployment('Payments API'), 'Rolling Deployment')} 
      disabled={running}>
      {#if running && currentScenario === 'Rolling Deployment'}
        <Loader2 class="h-4 w-4 animate-spin" />
      {:else}
        <Play class="h-4 w-4" />
      {/if}
      <span>Rolling Deploy</span>
    </button>

    <button class="btn-secondary flex items-center justify-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed" 
      aria-label="Maintenance window Lane 1"
      on:click={() => run(() => Sim.maintenanceWindow('lane1'), 'Maintenance Window L1')} 
      disabled={running}>
      {#if running && currentScenario === 'Maintenance Window L1'}
        <Loader2 class="h-4 w-4 animate-spin" />
      {:else}
        <Wrench class="h-4 w-4" />
      {/if}
      <span>Maintenance L1</span>
    </button>

    <button class="btn-primary flex items-center justify-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed" 
      aria-label="Reset all lanes"
      on:click={() => run(() => Sim.resetAll(), 'Reset All Lanes')} 
      disabled={running}>
      {#if running && currentScenario === 'Reset All Lanes'}
        <Loader2 class="h-4 w-4 animate-spin" />
      {:else}
        <RotateCcw class="h-4 w-4" />
      {/if}
      <span>Reset All</span>
    </button>
  </div>

  {#if running}
    <div class="mt-4 p-3 bg-primary-50 dark:bg-primary-900/20 border border-primary-200 dark:border-primary-800 rounded-lg" data-demo-running="true">
      <div class="flex items-center space-x-2">
        <Loader2 class="h-4 w-4 animate-spin text-primary-600" />
        <span class="text-sm font-medium text-primary-700 dark:text-primary-300">
          Running: {currentScenario}
        </span>
      </div>
    </div>
  {/if}

  <p class="text-xs text-gray-500 dark:text-gray-400 mt-3">Each scenario simulates config pushes with delays, updates lanes, and writes automation logs.</p>
</div>
