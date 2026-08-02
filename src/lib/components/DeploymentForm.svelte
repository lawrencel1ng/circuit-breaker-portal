<script lang="ts">
  import { X, Server, Database, Globe, AlertCircle } from 'lucide-svelte';
  import type { Application } from '$lib/types';
  import { z } from 'zod';

  export let onDeploy: (application: Omit<Application, 'id'>) => void;
  export let onCancel: () => void;

  const deploymentSchema = z.object({
    name: z.string().min(3, 'Name must be at least 3 characters'),
    description: z.string().min(5, 'Description must be at least 5 characters'),
    deployedLanes: z.array(z.string()).min(1, 'Select at least one lane'),
    deploymentType: z.enum(['Virtual Servers', 'Pool Members', 'Wide IPs']),
    plannedExecutionTime: z.string().optional()
  });

  let formData = {
    name: '',
    description: '',
    deployedLanes: [] as string[],
    deploymentType: 'Virtual Servers' as 'Virtual Servers' | 'Pool Members' | 'Wide IPs',
    plannedExecutionTime: ''
  };

  let errors: Record<string, string> = {};

  const lanes = [
    { id: 'lane1', name: 'Lane 1' },
    { id: 'lane2', name: 'Lane 2' },
    { id: 'lane3', name: 'Lane 3' }
  ];

  const deploymentTypes = [
    { value: 'Virtual Servers', label: 'Virtual Servers', icon: Server },
    { value: 'Pool Members', label: 'Pool Members', icon: Database },
    { value: 'Wide IPs', label: 'Wide IPs', icon: Globe }
  ];

  function handleLaneToggle(laneId: string) {
    if (formData.deployedLanes.includes(laneId)) {
      formData.deployedLanes = formData.deployedLanes.filter(id => id !== laneId);
    } else {
      formData.deployedLanes = [...formData.deployedLanes, laneId];
    }
  }

  function handleSubmit() {
    const result = deploymentSchema.safeParse(formData);
    if (!result.success) {
      errors = {};
      result.error.issues.forEach((err) => {
        if (err.path[0]) {
          errors[err.path[0].toString()] = err.message;
        }
      });
      return;
    }
    errors = {};

    onDeploy({
      ...formData,
      status: 'deployed',
      createdAt: new Date().toISOString()
    });
  }
</script>

<div class="space-y-6">
  <!-- Header -->
  <div class="flex items-center justify-between">
    <h2 class="text-xl font-semibold text-gray-900 dark:text-white">Deploy New Application</h2>
    <button
      class="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
      on:click={onCancel}
      aria-label="Close deployment form"
    >
      <X class="h-6 w-6" />
    </button>
  </div>

  <form on:submit|preventDefault={handleSubmit} class="space-y-6">
    <!-- Application Name -->
    <div>
      <label for="app-name" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
        Application Name
      </label>
      <input
        id="app-name"
        type="text"
        bind:value={formData.name}
        class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 dark:bg-gray-700 dark:text-white"
        placeholder="Enter application name"
      />
      {#if errors.name}
        <p class="mt-1 text-sm text-red-600 flex items-center">
          <AlertCircle class="h-4 w-4 mr-1" />
          {errors.name}
        </p>
      {/if}
    </div>

    <!-- Description -->
    <div>
      <label for="app-description" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
        Description
      </label>
      <textarea
        id="app-description"
        bind:value={formData.description}
        rows="3"
        class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 dark:bg-gray-700 dark:text-white"
        placeholder="Enter application description"
      ></textarea>
      {#if errors.description}
        <p class="mt-1 text-sm text-red-600 flex items-center">
          <AlertCircle class="h-4 w-4 mr-1" />
          {errors.description}
        </p>
      {/if}
    </div>

    <!-- Planned Execution Time -->
    <div>
      <label for="planned-time" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
        Planned Execution Time (Change Window)
      </label>
      <input
        id="planned-time"
        type="datetime-local"
        bind:value={formData.plannedExecutionTime}
        class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 dark:bg-gray-700 dark:text-white"
      />
      <p class="mt-1 text-xs text-gray-500 dark:text-gray-400">
        Specify when this deployment should be executed.
      </p>
    </div>

    <!-- Lanes -->
    <div>
      <span id="lanes-label" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
        Deployment Lanes
      </span>
      <div class="grid grid-cols-1 md:grid-cols-3 gap-4" role="group" aria-labelledby="lanes-label">
        {#each lanes as lane}
          <div 
            class="relative flex items-center p-4 border rounded-lg cursor-pointer transition-colors duration-200
              {formData.deployedLanes.includes(lane.id)
                ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20'
                : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'}"
            on:click={() => handleLaneToggle(lane.id)}
            role="button"
            tabindex="0"
            on:keydown={(e) => e.key === 'Enter' && handleLaneToggle(lane.id)}
          >
            <div class="flex-1">
              <h4 class="text-sm font-medium text-gray-900 dark:text-white">{lane.name}</h4>
            </div>
            {#if formData.deployedLanes.includes(lane.id)}
              <div class="absolute top-2 right-2 h-2 w-2 rounded-full bg-primary-500"></div>
            {/if}
          </div>
        {/each}
      </div>
      {#if errors.deployedLanes}
        <p class="mt-1 text-sm text-red-600 flex items-center">
          <AlertCircle class="h-4 w-4 mr-1" />
          {errors.deployedLanes}
        </p>
      {/if}
    </div>

    <!-- Deployment Type -->
    <fieldset>
      <legend class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
        Deployment Type
      </legend>
      <div class="space-y-3">
        {#each deploymentTypes as type (type.value)}
          <label class="flex items-center space-x-3 p-3 border border-gray-300 dark:border-gray-600 rounded-lg cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700
            {formData.deploymentType === type.value ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20' : ''}">
            <input
              type="radio"
              bind:group={formData.deploymentType}
              value={type.value}
              class="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 dark:border-gray-600"
            />
            <svelte:component this={type.icon} class="h-5 w-5 text-gray-500" />
            <span class="text-sm font-medium text-gray-700 dark:text-gray-300">{type.label}</span>
          </label>
        {/each}
      </div>
    </fieldset>

    <!-- Actions -->
    <div class="flex justify-end space-x-3 pt-4 border-t border-gray-200 dark:border-gray-700">
      <button
        type="button"
        class="btn-secondary"
        on:click={onCancel}
      >
        Cancel
      </button>
      <button
        type="submit"
        class="btn-primary"
        disabled={!formData.name || !formData.description || formData.deployedLanes.length === 0 || !formData.plannedExecutionTime}
      >
        Deploy Application
      </button>
    </div>
  </form>
</div>
