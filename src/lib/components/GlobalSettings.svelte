<script lang="ts">
  import { Settings, Clock, Shield, AlertTriangle } from 'lucide-svelte';
  import { circuitBreakerStore } from '$lib/stores/circuitBreakerStore';
  import type { CircuitBreakerConfig } from '$lib/types';

  export let config: CircuitBreakerConfig | undefined;

  function updateSetting(key: string, value: any) {
    circuitBreakerStore.update(cfg => ({
      ...cfg,
      globalSettings: {
        ...cfg.globalSettings,
        [key]: value
      }
    }));
  }

  function handleHealthCheckIntervalChange(event: Event) {
    const target = event.target as HTMLInputElement;
    updateSetting('healthCheckInterval', parseInt(target.value));
  }

  function handleCircuitBreakerThresholdChange(event: Event) {
    const target = event.target as HTMLInputElement;
    updateSetting('circuitBreakerThreshold', parseInt(target.value));
  }

  function toggleAutoFailover() {
    if (config) {
      updateSetting('autoFailoverEnabled', !config.globalSettings.autoFailoverEnabled);
    }
  }

  function toggleMaintenanceMode() {
    if (config) {
      updateSetting('maintenanceMode', !config.globalSettings.maintenanceMode);
    }
  }
</script>

{#if config}
<div class="card p-6">
  <div class="flex items-center space-x-2 mb-6">
    <Settings class="h-5 w-5 text-gray-500" />
    <h3 class="text-lg font-semibold text-gray-900 dark:text-white">Global Settings</h3>
  </div>

  <div class="space-y-6">
    <!-- Health Check Interval -->
    <div>
      <div class="flex items-center space-x-2 mb-2">
        <Clock class="h-4 w-4 text-gray-500" />
        <label for="health-interval" class="text-sm font-medium text-gray-700 dark:text-gray-300">
          Health Check Interval
        </label>
      </div>
      <div class="flex items-center space-x-4">
        <input
          id="health-interval"
          type="range"
          min="5"
          max="60"
          value={config?.globalSettings?.healthCheckInterval || 10}
          on:input={handleHealthCheckIntervalChange}
          class="flex-1 h-2 bg-gray-200 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer slider"
        />
        <span class="text-sm font-medium text-gray-900 dark:text-white w-12">
          {config?.globalSettings?.healthCheckInterval || 10}s
        </span>
      </div>
      <p class="text-xs text-gray-500 dark:text-gray-400 mt-1">
        How often to check server health (5-60 seconds)
      </p>
    </div>

    <!-- Circuit Breaker Threshold -->
    <div>
      <div class="flex items-center space-x-2 mb-2">
        <AlertTriangle class="h-4 w-4 text-gray-500" />
        <label for="cb-threshold" class="text-sm font-medium text-gray-700 dark:text-gray-300">
          Circuit Breaker Threshold
        </label>
      </div>
      <div class="flex items-center space-x-4">
        <input
          id="cb-threshold"
          type="range"
          min="1"
          max="10"
          value={config?.globalSettings?.circuitBreakerThreshold || 3}
          on:input={handleCircuitBreakerThresholdChange}
          class="flex-1 h-2 bg-gray-200 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer slider"
        />
        <span class="text-sm font-medium text-gray-900 dark:text-white w-12">
          {config?.globalSettings?.circuitBreakerThreshold || 3}
        </span>
      </div>
      <p class="text-xs text-gray-500 dark:text-gray-400 mt-1">
        Number of consecutive failures before triggering circuit breaker (1-10)
      </p>
    </div>

    <!-- Auto Failover -->
    <div class="flex items-center justify-between">
      <div class="flex items-center space-x-2">
        <Shield class="h-4 w-4 text-gray-500" />
        <div>
          <span class="text-sm font-medium text-gray-700 dark:text-gray-300">
            Auto Failover
          </span>
          <p class="text-xs text-gray-500 dark:text-gray-400">
            Automatically failover to healthy lanes when issues are detected
          </p>
        </div>
      </div>
      <button
        class="relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2
          {config?.globalSettings?.autoFailoverEnabled ? 'bg-primary-600' : 'bg-gray-200 dark:bg-gray-700'}"
        on:click={toggleAutoFailover}
        aria-label="Toggle auto failover"
      >
        <span
          class="inline-block h-4 w-4 transform rounded-full bg-white transition-transform
            {config?.globalSettings?.autoFailoverEnabled ? 'translate-x-6' : 'translate-x-1'}"
        ></span>
      </button>
    </div>

    <!-- Maintenance Mode -->
    <div class="flex items-center justify-between">
      <div class="flex items-center space-x-2">
        <Settings class="h-4 w-4 text-gray-500" />
        <div>
          <span class="text-sm font-medium text-gray-700 dark:text-gray-300">
            Maintenance Mode
          </span>
          <p class="text-xs text-gray-500 dark:text-gray-400">
            Enable maintenance mode to prevent automatic changes
          </p>
        </div>
      </div>
      <button
        class="relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2
          {config?.globalSettings?.maintenanceMode ? 'bg-primary-600' : 'bg-gray-200 dark:bg-gray-700'}"
        on:click={toggleMaintenanceMode}
        aria-label="Toggle maintenance mode"
      >
        <span
          class="inline-block h-4 w-4 transform rounded-full bg-white transition-transform
            {config?.globalSettings?.maintenanceMode ? 'translate-x-6' : 'translate-x-1'}"
        ></span>
      </button>
    </div>
  </div>

  <!-- Current Status Summary -->
  <div class="mt-6 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
    <h4 class="text-sm font-medium text-gray-900 dark:text-white mb-2">Current Configuration</h4>
    <div class="grid grid-cols-2 gap-4 text-xs text-gray-600 dark:text-gray-400">
      <div>Health checks every {config?.globalSettings?.healthCheckInterval || 10}s</div>
      <div>Circuit breaker threshold: {config?.globalSettings?.circuitBreakerThreshold || 3}</div>
      <div>Auto failover: {config?.globalSettings?.autoFailoverEnabled ? 'Enabled' : 'Disabled'}</div>
      <div>Maintenance mode: {config?.globalSettings?.maintenanceMode ? 'Enabled' : 'Disabled'}</div>
    </div>
  </div>
</div>
{/if}

<style>
  .slider::-webkit-slider-thumb {
    appearance: none;
    height: 20px;
    width: 20px;
    border-radius: 50%;
    background: #3b82f6;
    cursor: pointer;
    border: 2px solid #ffffff;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  }

  .slider::-moz-range-thumb {
    height: 20px;
    width: 20px;
    border-radius: 50%;
    background: #3b82f6;
    cursor: pointer;
    border: 2px solid #ffffff;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  }
</style>
