<script lang="ts">
  import { themeStore } from '$lib/stores/themeStore';
  import { Sun, Moon, LogOut, User } from 'lucide-svelte';

  export let user: any = null;
  export let onLogout: () => void = () => {};
</script>

<header class="h-20 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between px-6 shadow-sm z-20">
  <div class="flex items-center space-x-4">
    <div class="flex flex-col">
      <h1 class="text-2xl font-bold text-[#0072BC] leading-tight tracking-tight">
        FACC
      </h1>
      <span class="text-xs text-gray-500 dark:text-gray-400 font-medium">
        Enterprise Automation Platform
      </span>
    </div>
  </div>

  <div class="flex items-center space-x-4">
    {#if user}
      <!-- User Info -->
      <div class="flex items-center space-x-2 px-3 py-1 rounded-full bg-gray-100 dark:bg-gray-700">
        <User class="h-4 w-4 text-gray-500 dark:text-gray-400" />
        <span class="text-sm font-medium text-gray-700 dark:text-gray-300">
          {user.firstName || user.username}
        </span>
        <span class="text-xs text-gray-500 dark:text-gray-400 capitalize">
          ({user.roles?.[0]?.replace('_', ' ')})
        </span>
      </div>
    {/if}

    <!-- Dark Mode Toggle -->
    <button
      on:click={themeStore.toggle}
      class="p-2 rounded-full text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
      title={$themeStore ? 'Light Mode' : 'Dark Mode'}
    >
      {#if $themeStore}
        <Sun class="h-5 w-5" />
      {:else}
        <Moon class="h-5 w-5" />
      {/if}
    </button>

    <!-- Logout Button -->
    <button
      on:click={onLogout}
      class="flex items-center space-x-2 px-3 py-2 rounded-md text-sm font-medium text-gray-700 hover:text-red-600 dark:text-gray-200 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
      title="Logout"
    >
      <LogOut class="h-5 w-5" />
      <span>Logout</span>
    </button>
  </div>
</header>
