<script lang="ts">
  import { Play, RotateCcw, Wrench } from 'lucide-svelte';

  export let onAction: (action: string) => void;
</script>

<div class="card p-6">
  <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-4">Quick Actions</h3>
  
  <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
    <button
      class="flex items-center justify-center space-x-2 p-4 bg-success-50 dark:bg-success-900/20 border border-success-200 dark:border-success-800 rounded-lg hover:bg-success-100 dark:hover:bg-success-900/30 transition-colors duration-200"
      on:click={() => onAction('activate_all')}
    >
      <Play class="h-5 w-5 text-success-600" />
      <span class="font-medium text-success-700 dark:text-success-300">Activate All Lanes</span>
    </button>

    <button
      class="flex items-center justify-center space-x-2 p-4 bg-warning-50 dark:bg-warning-900/20 border border-warning-200 dark:border-warning-800 rounded-lg hover:bg-warning-100 dark:hover:bg-warning-900/30 transition-colors duration-200"
      on:click={() => onAction('failover_lane2')}
    >
      <RotateCcw class="h-5 w-5 text-warning-600" />
      <span class="font-medium text-warning-700 dark:text-warning-300">Failover to Lane 2</span>
    </button>

    <button
      class="flex items-center justify-center space-x-2 p-4 bg-primary-50 dark:bg-primary-900/20 border border-primary-200 dark:border-primary-800 rounded-lg hover:bg-primary-100 dark:hover:bg-primary-900/30 transition-colors duration-200"
      on:click={() => onAction('maintenance_mode')}
    >
      <Wrench class="h-5 w-5 text-primary-600" />
      <span class="font-medium text-primary-700 dark:text-primary-300">Toggle Maintenance Mode</span>
    </button>
  </div>

  <div class="mt-4 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
    <p class="text-sm text-gray-600 dark:text-gray-400">
      <strong>Note:</strong> These actions will affect all lanes and should be used with caution. 
      Changes will be logged and may trigger automated responses.
    </p>
  </div>
</div>
