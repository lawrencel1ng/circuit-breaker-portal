<script lang="ts">
  import { changeWindowStore } from '$lib/stores/changeWindowStore';
  import { Clock, Calendar, AlertTriangle, Plus, Trash2, CheckCircle, XCircle } from 'lucide-svelte';
  import { slide } from 'svelte/transition';

  let showAddForm = false;
  let newWindow = {
    name: '',
    type: 'allowed' as const,
    startTime: '00:00',
    endTime: '23:59',
    description: '',
    dayOfWeek: undefined as number | undefined
  };

  const days = [
    { value: 0, label: 'Sunday' },
    { value: 1, label: 'Monday' },
    { value: 2, label: 'Tuesday' },
    { value: 3, label: 'Wednesday' },
    { value: 4, label: 'Thursday' },
    { value: 5, label: 'Friday' },
    { value: 6, label: 'Saturday' }
  ];

  function handleAdd() {
    if (!newWindow.name || !newWindow.startTime || !newWindow.endTime) return;
    
    changeWindowStore.addWindow({
      ...newWindow,
      isActive: true
    });
    
    showAddForm = false;
    newWindow = {
      name: '',
      type: 'allowed',
      startTime: '00:00',
      endTime: '23:59',
      description: '',
      dayOfWeek: undefined
    };
  }

  function getDayLabel(day?: number) {
    if (day === undefined) return 'Every Day';
    return days.find(d => d.value === day)?.label || 'Unknown';
  }
</script>

<svelte:head>
  <title>Change Windows - Circuit Breaker Portal</title>
</svelte:head>

<div class="space-y-6">
  <!-- Header -->
  <div class="bg-gradient-to-r from-amber-700 to-orange-900 rounded-xl p-8 text-white shadow-lg">
    <div class="flex items-center space-x-4">
      <div class="p-3 bg-white/10 rounded-lg backdrop-blur-sm">
        <Clock class="h-8 w-8 text-amber-300" />
      </div>
      <div>
        <h1 class="text-3xl font-bold">Change Windows</h1>
        <p class="text-amber-100 mt-2 text-lg">
          Configure allowed deployment windows and restricted freeze periods.
        </p>
      </div>
    </div>
  </div>

  <!-- Action Bar -->
  <div class="flex justify-between items-center">
    <div class="text-sm text-gray-500 dark:text-gray-400">
      Manage when deployments can occur. Restricted windows take precedence over allowed windows.
    </div>
    <button
      on:click={() => showAddForm = !showAddForm}
      class="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
    >
      <Plus class="h-4 w-4 mr-2" />
      Add Window
    </button>
  </div>

  <!-- Add Form -->
  {#if showAddForm}
    <div transition:slide class="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
      <h3 class="text-lg font-medium text-gray-900 dark:text-white mb-4">New Change Window</h3>
      <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label for="name" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Name</label>
          <input
            id="name"
            type="text"
            bind:value={newWindow.name}
            class="w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 dark:bg-gray-700 dark:border-gray-600"
            placeholder="e.g. Weekend Maintenance"
          />
        </div>
        
        <div>
          <label for="type" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Type</label>
          <select
            id="type"
            bind:value={newWindow.type}
            class="w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 dark:bg-gray-700 dark:border-gray-600"
          >
            <option value="allowed">Allowed Window</option>
            <option value="restricted">Restricted (Freeze)</option>
          </select>
        </div>

        <div>
          <label for="dayOfWeek" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Day of Week</label>
          <select
            id="dayOfWeek"
            bind:value={newWindow.dayOfWeek}
            class="w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 dark:bg-gray-700 dark:border-gray-600"
          >
            <option value={undefined}>Every Day</option>
            {#each days as day}
              <option value={day.value}>{day.label}</option>
            {/each}
          </select>
        </div>

        <div class="grid grid-cols-2 gap-4">
          <div>
            <label for="startTime" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Start Time</label>
            <input
              id="startTime"
              type="time"
              bind:value={newWindow.startTime}
              class="w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 dark:bg-gray-700 dark:border-gray-600"
            />
          </div>
          <div>
            <label for="endTime" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">End Time</label>
            <input
              id="endTime"
              type="time"
              bind:value={newWindow.endTime}
              class="w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 dark:bg-gray-700 dark:border-gray-600"
            />
          </div>
        </div>

        <div class="md:col-span-2">
          <label for="description" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Description</label>
          <input
            id="description"
            type="text"
            bind:value={newWindow.description}
            class="w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 dark:bg-gray-700 dark:border-gray-600"
            placeholder="Brief description of this window"
          />
        </div>
      </div>
      
      <div class="mt-6 flex justify-end space-x-3">
        <button
          on:click={() => showAddForm = false}
          class="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md"
        >
          Cancel
        </button>
        <button
          on:click={handleAdd}
          class="px-4 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-md"
        >
          Create Window
        </button>
      </div>
    </div>
  {/if}

  <!-- Windows List -->
  <div class="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
    <div class="divide-y divide-gray-200 dark:divide-gray-700">
      {#each $changeWindowStore as window}
        <div class="p-6 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-gray-750 transition-colors">
          <div class="flex items-start space-x-4">
            <div class="p-2 rounded-lg {window.type === 'allowed' ? 'bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400' : 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400'}">
              {#if window.type === 'allowed'}
                <CheckCircle class="h-6 w-6" />
              {:else}
                <XCircle class="h-6 w-6" />
              {/if}
            </div>
            <div>
              <h3 class="text-lg font-medium text-gray-900 dark:text-white flex items-center">
                {window.name}
                <span class="ml-3 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium 
                  {window.type === 'allowed' ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300' : 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300'}">
                  {window.type === 'allowed' ? 'Allowed Window' : 'Restricted Period'}
                </span>
              </h3>
              <p class="text-sm text-gray-500 dark:text-gray-400 mt-1">{window.description}</p>
              
              <div class="mt-2 flex items-center space-x-4 text-xs text-gray-500 dark:text-gray-400">
                <span class="flex items-center bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded">
                  <Calendar class="h-3 w-3 mr-1" />
                  {getDayLabel(window.dayOfWeek)}
                </span>
                <span class="flex items-center bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded">
                  <Clock class="h-3 w-3 mr-1" />
                  {window.startTime} - {window.endTime}
                </span>
              </div>
            </div>
          </div>

          <div class="flex items-center space-x-4">
            <button
              on:click={() => changeWindowStore.toggleWindow(window.id)}
              class="relative inline-flex flex-shrink-0 h-6 w-11 border-2 border-transparent rounded-full cursor-pointer transition-colors ease-in-out duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 {window.isActive ? 'bg-indigo-600' : 'bg-gray-200 dark:bg-gray-700'}"
            >
              <span class="sr-only">Toggle window</span>
              <span 
                aria-hidden="true" 
                class="pointer-events-none inline-block h-5 w-5 rounded-full bg-white shadow transform ring-0 transition ease-in-out duration-200 {window.isActive ? 'translate-x-5' : 'translate-x-0'}"
              ></span>
            </button>
            
            <button
              on:click={() => changeWindowStore.removeWindow(window.id)}
              class="text-gray-400 hover:text-red-600 transition-colors"
            >
              <Trash2 class="h-5 w-5" />
            </button>
          </div>
        </div>
      {/each}
    </div>
  </div>
</div>
