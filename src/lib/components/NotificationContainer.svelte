<script lang="ts">
  import { onMount } from 'svelte';
  import { notificationStore } from '$lib/stores/notificationStore';
  import { X, CheckCircle, AlertCircle, AlertTriangle, Info } from 'lucide-svelte';

  let notifications: any[] = [];

  notificationStore.subscribe(value => {
    notifications = value;
  });

  function removeNotification(id: string) {
    notificationStore.remove(id);
  }

  function getIcon(type: string) {
    switch (type) {
      case 'success':
        return CheckCircle;
      case 'error':
        return AlertCircle;
      case 'warning':
        return AlertTriangle;
      default:
        return Info;
    }
  }

  function getIconClass(type: string) {
    switch (type) {
      case 'success':
        return 'text-success-600';
      case 'error':
        return 'text-danger-600';
      case 'warning':
        return 'text-warning-600';
      default:
        return 'text-primary-600';
    }
  }
</script>

<!-- Notification Container -->
<div class="fixed top-4 right-4 z-50 space-y-2 max-w-md">
  {#each notifications as notification (notification.id)}
    <div
      class="w-full bg-white dark:bg-gray-800 shadow-lg rounded-lg pointer-events-auto ring-1 ring-black ring-opacity-5 overflow-hidden transform transition-all duration-300 ease-in-out"
      class:translate-x-0={notification.show}
      class:translate-x-full={!notification.show}
    >
      <div class="p-4">
        <div class="flex items-start">
          <div class="flex-shrink-0">
            <svelte:component
              this={getIcon(notification.type)}
              class="h-6 w-6 {getIconClass(notification.type)}"
            />
          </div>
          <div class="ml-3 flex-1 min-w-0 pt-0.5">
            <p class="text-sm font-medium text-gray-900 dark:text-white break-words">
              {notification.title}
            </p>
            <p class="mt-1 text-sm text-gray-500 dark:text-gray-400 break-words">
              {notification.message}
            </p>
          </div>
          <div class="ml-4 flex-shrink-0 flex">
            <button
              class="bg-white dark:bg-gray-800 rounded-md inline-flex text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
              on:click={() => removeNotification(notification.id)}
            >
              <span class="sr-only">Close</span>
              <X class="h-5 w-5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  {/each}
</div>
