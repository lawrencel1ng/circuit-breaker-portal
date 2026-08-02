<script lang="ts">
  import { themeStore } from '$lib/stores/themeStore';
  import { Moon, Sun, AlertCircle } from 'lucide-svelte';
  import { goto } from '$app/navigation';
  import { page } from '$app/stores';

  let username = '';
  let password = '';
  let error = '';
  let isLoading = false;

  // Get redirect URL from query params
  const redirectUrl = $page.url.searchParams.get('redirect') || '/';
  
  // Check for system errors
  const systemError = $page.url.searchParams.get('error');
  if (systemError === 'auth_system_error') {
    error = 'Authentication system is not properly configured. Please contact an administrator.';
  }

  async function handleLogin() {
    isLoading = true;
    error = '';
    
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Login failed');
      }

      // Successful login - redirect
      goto(redirectUrl);

    } catch (err: any) {
      error = err.message || 'An error occurred during login';
      console.error('Login error:', err);
      isLoading = false;
    }
  }

  function quickLogin() {
    username = 'admin';
    password = 'admin123';
  }
</script>

<div class="min-h-screen flex items-start justify-center bg-white dark:bg-gray-900 py-12 px-4 sm:px-6 lg:px-8 pt-24 transition-colors duration-200">
  <!-- Theme Toggle (Absolute Top Right) -->
  <button
    on:click={themeStore.toggle}
    class="absolute top-4 right-4 p-2 rounded-full bg-white dark:bg-gray-800 text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white shadow-sm border border-gray-200 dark:border-gray-700 transition-colors"
    title={$themeStore ? 'Light Mode' : 'Dark Mode'}
  >
    {#if $themeStore}
      <Sun class="h-5 w-5" />
    {:else}
      <Moon class="h-5 w-5" />
    {/if}
  </button>

  <div class="max-w-md w-full space-y-8">
    <div class="flex flex-col items-center">
      <div class="h-24 w-24 bg-indigo-600 rounded-xl flex items-center justify-center shadow-lg">
        <svg class="h-14 w-14 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
        </svg>
      </div>
      <h2 class="mt-6 text-center text-3xl font-extrabold text-gray-900 dark:text-white">
        F5 Automation Control Center
      </h2>
      <p class="mt-2 text-center text-sm text-gray-600 dark:text-gray-400">
        Sign in to your account
      </p>
    </div>
    
    <div class="bg-white dark:bg-gray-800 py-8 px-4 shadow sm:rounded-lg sm:px-10 border border-gray-200 dark:border-gray-700">
      <form class="space-y-6" on:submit|preventDefault={handleLogin}>
        <div>
          <label for="username" class="block text-sm font-medium text-gray-700 dark:text-gray-300">
            Username
          </label>
          <div class="mt-1">
            <input
              id="username"
              name="username"
              type="text"
              required
              bind:value={username}
              class="appearance-none block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm dark:bg-gray-700 dark:text-white transition-colors"
            />
          </div>
        </div>

        <div>
          <label for="password" class="block text-sm font-medium text-gray-700 dark:text-gray-300">
            Password
          </label>
          <div class="mt-1">
            <input
              id="password"
              name="password"
              type="password"
              required
              bind:value={password}
              class="appearance-none block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm dark:bg-gray-700 dark:text-white transition-colors"
            />
          </div>
        </div>

        <div class="flex items-center justify-between">
          <div class="text-sm">
            <button type="button" on:click={quickLogin} class="font-medium text-indigo-600 hover:text-indigo-500 dark:text-indigo-400 dark:hover:text-indigo-300 transition-colors">
              Quick Login (admin/admin123)
            </button>
          </div>
        </div>

        {#if error}
          <div class="rounded-md bg-red-50 dark:bg-red-900/20 p-4">
            <div class="flex">
              <div class="flex-shrink-0">
                <AlertCircle class="h-5 w-5 text-red-400" />
              </div>
              <div class="ml-3">
                <h3 class="text-sm font-medium text-red-800 dark:text-red-200">
                  {error}
                </h3>
              </div>
            </div>
          </div>
        {/if}

        <div>
          <button
            type="submit"
            disabled={isLoading}
            class="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {#if isLoading}
              <svg class="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Signing in...
            {:else}
              Sign in
            {/if}
          </button>
        </div>
      </form>
    </div>

    <!-- Demo Info -->
    <div class="mt-6 bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4 border border-blue-200 dark:border-blue-800">
      <h3 class="text-sm font-medium text-blue-900 dark:text-blue-200 mb-2">Demo Credentials</h3>
      <div class="text-xs text-blue-700 dark:text-blue-300 space-y-1">
        <p><strong>admin / admin123</strong> - Super Administrator (Full Access)</p>
        <p><strong>operator / operator123</strong> - Operator (Execute Only)</p>
        <p><strong>viewer / viewer123</strong> - Viewer (Read Only)</p>
      </div>
    </div>
  </div>
</div>
