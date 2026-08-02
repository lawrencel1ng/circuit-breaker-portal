<script lang="ts">
  import { circuitBreakerStore } from '$lib/stores/circuitBreakerStore';
  import { Settings, Save, Server, Database, Shield } from 'lucide-svelte';
  import { notificationStore } from '$lib/stores/notificationStore';
  import type { SystemSettings } from '$lib/types';

  $: config = $circuitBreakerStore;
  $: settings = config?.systemSettings;

  let localSettings: SystemSettings = {
    maintenanceMode: false,
    maintenanceMessage: '',
    systemName: '',
    dataRetentionDays: 90,
    theme: 'system'
  };

  // Sync with store when loaded
  $: if (settings && localSettings.systemName === '') {
    localSettings = { ...settings };
  }

  function saveSettings() {
    circuitBreakerStore.update(c => ({
      ...c,
      systemSettings: { ...localSettings }
    }));

    notificationStore.add({
      type: 'success',
      title: 'Settings Saved',
      message: 'System configuration has been updated successfully.'
    });
  }
</script>

<div class="space-y-6">
  <div>
    <h1 class="text-2xl font-semibold text-gray-900 dark:text-white">System Settings</h1>
    <p class="mt-1 text-sm text-gray-500 dark:text-gray-400">Manage global platform configuration and maintenance.</p>
  </div>

  <div class="bg-white dark:bg-gray-800 shadow rounded-lg divide-y divide-gray-200 dark:divide-gray-700">
    <!-- General Settings -->
    <div class="p-6">
      <h3 class="text-lg leading-6 font-medium text-gray-900 dark:text-white flex items-center mb-4">
        <Settings class="h-5 w-5 mr-2 text-indigo-500" />
        General Configuration
      </h3>
      <div class="grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-6">
        <div class="sm:col-span-4">
          <label for="system-name" class="block text-sm font-medium text-gray-700 dark:text-gray-300">System Name</label>
          <input type="text" bind:value={localSettings.systemName} class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white">
          <p class="mt-2 text-sm text-gray-500 dark:text-gray-400">Displayed in the header and email notifications.</p>
        </div>

        <div class="sm:col-span-2">
          <label for="theme" class="block text-sm font-medium text-gray-700 dark:text-gray-300">Default Theme</label>
          <select bind:value={localSettings.theme} class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white">
            <option value="light">Light</option>
            <option value="dark">Dark</option>
            <option value="system">System Default</option>
          </select>
        </div>
      </div>
    </div>

    <!-- Maintenance Mode -->
    <div class="p-6">
      <h3 class="text-lg leading-6 font-medium text-gray-900 dark:text-white flex items-center mb-4">
        <Shield class="h-5 w-5 mr-2 text-indigo-500" />
        Maintenance Mode
      </h3>
      <div class="flex items-start">
        <div class="flex items-center h-5">
          <input
            id="maintenance-mode"
            name="maintenance-mode"
            type="checkbox"
            bind:checked={localSettings.maintenanceMode}
            class="focus:ring-indigo-500 h-4 w-4 text-indigo-600 border-gray-300 rounded"
          />
        </div>
        <div class="ml-3 text-sm">
          <label for="maintenance-mode" class="font-medium text-gray-700 dark:text-gray-300">Enable Maintenance Mode</label>
          <p class="text-gray-500 dark:text-gray-400">When enabled, non-admin users will see a maintenance page.</p>
        </div>
      </div>

      {#if localSettings.maintenanceMode}
        <div class="mt-4">
          <label for="maintenance-message" class="block text-sm font-medium text-gray-700 dark:text-gray-300">Maintenance Message</label>
          <textarea
            id="maintenance-message"
            rows="3"
            bind:value={localSettings.maintenanceMessage}
            class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white"
          ></textarea>
        </div>
      {/if}
    </div>

    <!-- Data Retention -->
    <div class="p-6">
      <h3 class="text-lg leading-6 font-medium text-gray-900 dark:text-white flex items-center mb-4">
        <Database class="h-5 w-5 mr-2 text-indigo-500" />
        Data Retention
      </h3>
      <div class="max-w-xl">
        <label for="retention" class="block text-sm font-medium text-gray-700 dark:text-gray-300">Log Retention Period (Days)</label>
        <div class="mt-1 flex rounded-md shadow-sm">
          <input
            type="number"
            bind:value={localSettings.dataRetentionDays}
            class="flex-1 min-w-0 block w-full rounded-none rounded-l-md border-gray-300 focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white"
          />
          <span class="inline-flex items-center px-3 rounded-r-md border border-l-0 border-gray-300 bg-gray-50 text-gray-500 sm:text-sm dark:bg-gray-600 dark:border-gray-600 dark:text-gray-300">
            days
          </span>
        </div>
        <p class="mt-2 text-sm text-gray-500 dark:text-gray-400">Audit logs older than this will be archived.</p>
      </div>
    </div>

    <!-- Save Button -->
    <div class="px-4 py-3 bg-gray-50 dark:bg-gray-900/50 text-right sm:px-6 rounded-b-lg">
      <button
        on:click={saveSettings}
        class="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
      >
        <Save class="h-4 w-4 mr-2" />
        Save Changes
      </button>
    </div>
  </div>
</div>
