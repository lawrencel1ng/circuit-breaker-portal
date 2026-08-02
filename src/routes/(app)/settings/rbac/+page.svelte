<script lang="ts">
  import { Shield, Plus, Check, X } from 'lucide-svelte';

  let roles = [
    { 
      id: 1, 
      name: 'Administrator', 
      description: 'Full access to all resources and settings.',
      usersCount: 3,
      permissions: {
        users: true,
        rbac: true,
        saml: true,
        deployments: true,
        circuitBreakers: true
      }
    },
    { 
      id: 2, 
      name: 'Operator', 
      description: 'Can manage deployments and circuit breakers.',
      usersCount: 8,
      permissions: {
        users: false,
        rbac: false,
        saml: false,
        deployments: true,
        circuitBreakers: true
      }
    },
    { 
      id: 3, 
      name: 'Viewer', 
      description: 'Read-only access to dashboards and logs.',
      usersCount: 15,
      permissions: {
        users: false,
        rbac: false,
        saml: false,
        deployments: false,
        circuitBreakers: false
      }
    }
  ];
</script>

<div class="space-y-6">
  <div class="flex items-center justify-between">
    <div>
      <h1 class="text-2xl font-semibold text-gray-900 dark:text-white">RBAC Access Control</h1>
      <p class="mt-1 text-sm text-gray-500 dark:text-gray-400">Manage roles and permissions for the platform.</p>
    </div>
    <button class="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500">
      <Plus class="h-4 w-4 mr-2" />
      Create Role
    </button>
  </div>

  <div class="grid gap-6 lg:grid-cols-2 xl:grid-cols-3">
    {#each roles as role}
      <div class="bg-white dark:bg-gray-800 shadow rounded-lg border border-gray-200 dark:border-gray-700 flex flex-col">
        <div class="p-6 flex-1">
          <div class="flex items-center justify-between">
            <div class="flex items-center space-x-3">
              <div class="p-2 bg-indigo-100 dark:bg-indigo-900/50 rounded-lg text-indigo-600 dark:text-indigo-400">
                <Shield class="h-6 w-6" />
              </div>
              <h3 class="text-lg font-medium text-gray-900 dark:text-white">{role.name}</h3>
            </div>
            <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300">
              {role.usersCount} users
            </span>
          </div>
          <p class="mt-4 text-sm text-gray-500 dark:text-gray-400">
            {role.description}
          </p>
          
          <div class="mt-6">
            <h4 class="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Permissions</h4>
            <ul class="space-y-2">
              <li class="flex items-center justify-between text-sm">
                <span class="text-gray-600 dark:text-gray-300">User Management</span>
                {#if role.permissions.users}
                  <Check class="h-4 w-4 text-green-500" />
                {:else}
                  <X class="h-4 w-4 text-gray-300 dark:text-gray-600" />
                {/if}
              </li>
              <li class="flex items-center justify-between text-sm">
                <span class="text-gray-600 dark:text-gray-300">RBAC Config</span>
                {#if role.permissions.rbac}
                  <Check class="h-4 w-4 text-green-500" />
                {:else}
                  <X class="h-4 w-4 text-gray-300 dark:text-gray-600" />
                {/if}
              </li>
              <li class="flex items-center justify-between text-sm">
                <span class="text-gray-600 dark:text-gray-300">Deployments</span>
                {#if role.permissions.deployments}
                  <Check class="h-4 w-4 text-green-500" />
                {:else}
                  <X class="h-4 w-4 text-gray-300 dark:text-gray-600" />
                {/if}
              </li>
            </ul>
          </div>
        </div>
        <div class="bg-gray-50 dark:bg-gray-900/50 px-6 py-4 border-t border-gray-200 dark:border-gray-700 rounded-b-lg">
          <button class="text-sm font-medium text-indigo-600 dark:text-indigo-400 hover:text-indigo-900 dark:hover:text-indigo-300">
            Edit Role
          </button>
        </div>
      </div>
    {/each}
  </div>
</div>
