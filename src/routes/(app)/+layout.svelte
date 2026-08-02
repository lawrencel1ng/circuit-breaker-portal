<script lang="ts">
  import { onMount } from 'svelte';
  import { goto } from '$app/navigation';
  import Navigation from '$lib/components/Navigation.svelte';
  import Header from '$lib/components/Header.svelte';
  import { logStore } from '$lib/stores/logStore';
  import { notificationStore } from '$lib/stores/notificationStore';

  let user: any = null;
  let isLoading = true;

  onMount(async () => {
    // Check if user is authenticated
    try {
      const response = await fetch('/api/auth/me');
      
      if (response.ok) {
        const data = await response.json();
        user = data.user;
        
        logStore.addAppLog({
          level: 'info',
          component: 'AppLayout',
          message: 'User authenticated',
          details: { username: user.username }
        });
      } else {
        // Not authenticated, redirect to login
        goto('/login');
      }
    } catch (err) {
      console.error('Auth check failed:', err);
      goto('/login');
    } finally {
      isLoading = false;
    }
  });

  async function handleLogout() {
    try {
      const response = await fetch('/api/auth/logout', {
        method: 'POST'
      });

      if (response.ok) {
        notificationStore.add({
          type: 'success',
          title: 'Logged Out',
          message: 'You have been successfully logged out'
        });
        goto('/login');
      }
    } catch (err) {
      console.error('Logout failed:', err);
    }
  }
</script>

{#if isLoading}
  <div class="flex h-screen items-center justify-center bg-gray-50 dark:bg-gray-900">
    <div class="flex flex-col items-center">
      <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      <p class="mt-4 text-gray-600 dark:text-gray-400">Loading...</p>
    </div>
  </div>
{:else if user}
  <div class="flex h-screen bg-gray-50 dark:bg-gray-900 overflow-hidden">
    <Navigation {user} onLogout={handleLogout} />
    
    <div class="flex flex-col flex-1 overflow-hidden">
      <Header {user} onLogout={handleLogout} />
      <main class="flex-1 overflow-y-auto p-8">
        <slot />
      </main>
    </div>
  </div>
{/if}
