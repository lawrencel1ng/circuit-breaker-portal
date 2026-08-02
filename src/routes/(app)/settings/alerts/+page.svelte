<script lang="ts">
  import { circuitBreakerStore } from '$lib/stores/circuitBreakerStore';
  import { Bell, Plus, Trash2, Mail, Hash, Activity } from 'lucide-svelte';
  import { notificationStore } from '$lib/stores/notificationStore';
  import type { AlertChannel, AlertRule } from '$lib/types';

  $: config = $circuitBreakerStore;
  $: alertConfig = config?.alertConfig;

  let newChannel: Partial<AlertChannel> = {
    type: 'email',
    enabled: true
  };

  let newRule: Partial<AlertRule> = {
    metric: 'error_rate',
    condition: 'gt',
    threshold: 5,
    duration: 5,
    severity: 'warning',
    enabled: true
  };

  function addChannel() {
    if (!newChannel.name || !newChannel.target) return;
    
    circuitBreakerStore.update(c => ({
      ...c,
      alertConfig: {
        ...c.alertConfig,
        channels: [
          ...c.alertConfig.channels,
          { ...newChannel, id: `c_${Date.now()}` } as AlertChannel
        ]
      }
    }));

    notificationStore.add({
      type: 'success',
      title: 'Channel Added',
      message: `Alert channel ${newChannel.name} has been created.`
    });

    newChannel = { type: 'email', enabled: true, name: '', target: '' };
  }

  function removeChannel(id: string) {
    circuitBreakerStore.update(c => ({
      ...c,
      alertConfig: {
        ...c.alertConfig,
        channels: c.alertConfig.channels.filter(ch => ch.id !== id)
      }
    }));
  }

  function addRule() {
    circuitBreakerStore.update(c => ({
      ...c,
      alertConfig: {
        ...c.alertConfig,
        rules: [
          ...c.alertConfig.rules,
          { ...newRule, id: `r_${Date.now()}` } as AlertRule
        ]
      }
    }));

    notificationStore.add({
      type: 'success',
      title: 'Rule Added',
      message: 'New alert rule has been configured.'
    });
  }

  function removeRule(id: string) {
    circuitBreakerStore.update(c => ({
      ...c,
      alertConfig: {
        ...c.alertConfig,
        rules: c.alertConfig.rules.filter(r => r.id !== id)
      }
    }));
  }
</script>

<div class="space-y-6">
  <div>
    <h1 class="text-2xl font-semibold text-gray-900 dark:text-white">Alerting & Notifications</h1>
    <p class="mt-1 text-sm text-gray-500 dark:text-gray-400">Configure how and when you want to be notified of system events.</p>
  </div>

  <!-- Notification Channels -->
  <div class="bg-white dark:bg-gray-800 shadow sm:rounded-lg">
    <div class="px-4 py-5 sm:p-6">
      <h3 class="text-lg leading-6 font-medium text-gray-900 dark:text-white flex items-center">
        <Bell class="h-5 w-5 mr-2 text-indigo-500" />
        Notification Channels
      </h3>
      <div class="mt-2 max-w-xl text-sm text-gray-500 dark:text-gray-400">
        <p>Set up destinations for your alerts (Email, Slack, PagerDuty).</p>
      </div>

      <!-- Add Channel Form -->
      <div class="mt-5 grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-6 items-end bg-gray-50 dark:bg-gray-700/30 p-4 rounded-lg">
        <div class="sm:col-span-2">
          <label for="channel-name" class="block text-sm font-medium text-gray-700 dark:text-gray-300">Name</label>
          <input type="text" bind:value={newChannel.name} placeholder="e.g. DevOps Team" class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white">
        </div>
        <div class="sm:col-span-1">
          <label for="channel-type" class="block text-sm font-medium text-gray-700 dark:text-gray-300">Type</label>
          <select bind:value={newChannel.type} class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white">
            <option value="email">Email</option>
            <option value="slack">Slack</option>
            <option value="pagerduty">PagerDuty</option>
            <option value="webhook">Webhook</option>
          </select>
        </div>
        <div class="sm:col-span-2">
          <label for="channel-target" class="block text-sm font-medium text-gray-700 dark:text-gray-300">Target</label>
          <input type="text" bind:value={newChannel.target} placeholder="email@example.com or webhook URL" class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white">
        </div>
        <div class="sm:col-span-1">
          <button on:click={addChannel} class="w-full inline-flex justify-center items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700">
            <Plus class="h-4 w-4" />
            Add
          </button>
        </div>
      </div>

      <!-- Channels List -->
      <div class="mt-6">
        <ul class="divide-y divide-gray-200 dark:divide-gray-700">
          {#if alertConfig}
            {#each alertConfig.channels as channel}
              <li class="py-4 flex items-center justify-between">
                <div class="flex items-center">
                  <div class="flex-shrink-0 h-10 w-10 rounded-full bg-indigo-100 dark:bg-indigo-900/50 flex items-center justify-center">
                    {#if channel.type === 'email'}
                      <Mail class="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
                    {:else if channel.type === 'slack'}
                      <Hash class="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
                    {:else}
                      <Activity class="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
                    {/if}
                  </div>
                  <div class="ml-4">
                    <h4 class="text-sm font-medium text-gray-900 dark:text-white">{channel.name}</h4>
                    <p class="text-sm text-gray-500 dark:text-gray-400">{channel.type} • {channel.target}</p>
                  </div>
                </div>
                <div class="flex items-center space-x-4">
                  <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium {channel.enabled ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' : 'bg-gray-100 text-gray-800'}">
                    {channel.enabled ? 'Active' : 'Disabled'}
                  </span>
                  <button on:click={() => removeChannel(channel.id)} class="text-red-600 hover:text-red-900 dark:hover:text-red-400">
                    <Trash2 class="h-5 w-5" />
                  </button>
                </div>
              </li>
            {/each}
          {/if}
        </ul>
      </div>
    </div>
  </div>

  <!-- Alert Rules -->
  <div class="bg-white dark:bg-gray-800 shadow sm:rounded-lg">
    <div class="px-4 py-5 sm:p-6">
      <h3 class="text-lg leading-6 font-medium text-gray-900 dark:text-white flex items-center">
        <Activity class="h-5 w-5 mr-2 text-indigo-500" />
        Alert Rules
      </h3>
      <div class="mt-2 max-w-xl text-sm text-gray-500 dark:text-gray-400">
        <p>Define conditions that trigger alerts.</p>
      </div>

      <!-- Add Rule Form -->
      <div class="mt-5 grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-6 items-end bg-gray-50 dark:bg-gray-700/30 p-4 rounded-lg">
        <div class="sm:col-span-2">
          <label for="metric" class="block text-sm font-medium text-gray-700 dark:text-gray-300">If Metric</label>
          <select bind:value={newRule.metric} class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white">
            <option value="error_rate">Error Rate (%)</option>
            <option value="latency">Latency (ms)</option>
            <option value="traffic_drop">Traffic Drop (%)</option>
            <option value="health_change">Health Status Change</option>
          </select>
        </div>
        <div class="sm:col-span-1">
          <label for="condition" class="block text-sm font-medium text-gray-700 dark:text-gray-300">Is</label>
          <select bind:value={newRule.condition} class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white">
            <option value="gt">Greater than</option>
            <option value="lt">Less than</option>
            <option value="eq">Equal to</option>
          </select>
        </div>
        <div class="sm:col-span-1">
          <label for="threshold" class="block text-sm font-medium text-gray-700 dark:text-gray-300">Value</label>
          <input type="number" bind:value={newRule.threshold} class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white">
        </div>
        <div class="sm:col-span-1">
          <label for="severity" class="block text-sm font-medium text-gray-700 dark:text-gray-300">Severity</label>
          <select bind:value={newRule.severity} class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white">
            <option value="info">Info</option>
            <option value="warning">Warning</option>
            <option value="critical">Critical</option>
          </select>
        </div>
        <div class="sm:col-span-1">
          <button on:click={addRule} class="w-full inline-flex justify-center items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700">
            <Plus class="h-4 w-4" />
            Add
          </button>
        </div>
      </div>

      <!-- Rules List -->
      <div class="mt-6">
        <ul class="divide-y divide-gray-200 dark:divide-gray-700">
          {#if alertConfig}
            {#each alertConfig.rules as rule}
              <li class="py-4 flex items-center justify-between">
                <div class="flex items-center">
                  <div class="ml-4">
                    <h4 class="text-sm font-medium text-gray-900 dark:text-white flex items-center">
                      {#if rule.severity === 'critical'}
                        <span class="w-2 h-2 bg-red-500 rounded-full mr-2"></span>
                      {:else if rule.severity === 'warning'}
                        <span class="w-2 h-2 bg-yellow-500 rounded-full mr-2"></span>
                      {:else}
                        <span class="w-2 h-2 bg-blue-500 rounded-full mr-2"></span>
                      {/if}
                      If {rule.metric} {rule.condition === 'gt' ? '>' : rule.condition === 'lt' ? '<' : '='} {rule.threshold}
                    </h4>
                    <p class="text-sm text-gray-500 dark:text-gray-400">Duration: {rule.duration} mins</p>
                  </div>
                </div>
                <div class="flex items-center space-x-4">
                  <button on:click={() => removeRule(rule.id)} class="text-red-600 hover:text-red-900 dark:hover:text-red-400">
                    <Trash2 class="h-5 w-5" />
                  </button>
                </div>
              </li>
            {/each}
          {/if}
        </ul>
      </div>
    </div>
  </div>
</div>
