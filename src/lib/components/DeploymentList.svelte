<script lang="ts">
  import { Calendar, Server, Database, Globe, MoreVertical, Trash2, RefreshCw } from 'lucide-svelte';
  import type { Application } from '$lib/types';

  export let applications: Application[];

  function getDeploymentTypeIcon(type: string) {
    switch (type) {
      case 'Virtual Servers':
        return Server;
      case 'Pool Members':
        return Database;
      case 'Wide IPs':
        return Globe;
      default:
        return Server;
    }
  }

  function getStatusColor(status: string) {
    switch (status) {
      case 'deployed':
        return 'bg-success-100 text-success-800 dark:bg-success-900 dark:text-success-200';
      case 'deploying':
        return 'bg-warning-100 text-warning-800 dark:bg-warning-900 dark:text-warning-200';
      case 'failed':
        return 'bg-danger-100 text-danger-800 dark:bg-danger-900 dark:text-danger-200';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
    }
  }

  function formatDate(dateString: string) {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  function handleRedeploy(app: Application) {
    // In a real application, this would trigger a redeployment
    console.log('Redeploying application:', app.name);
  }

  function handleDelete(app: Application) {
    // In a real application, this would delete the application
    console.log('Deleting application:', app.name);
  }
</script>

<div class="space-y-6">
  {#if applications.length === 0}
    <div class="text-center py-12">
      <Server class="h-12 w-12 text-gray-400 mx-auto mb-4" />
      <h3 class="text-lg font-medium text-gray-900 dark:text-white mb-2">No Applications Deployed</h3>
      <p class="text-gray-500 dark:text-gray-400">Get started by deploying your first application.</p>
    </div>
  {:else}
    <div class="grid grid-cols-1 gap-6">
      {#each applications as app (app.id)}
        <div class="card p-6">
          <div class="flex items-start justify-between">
            <div class="flex-1">
              <div class="flex items-center space-x-3 mb-2">
                <svelte:component this={getDeploymentTypeIcon(app.deploymentType || '')} class="h-5 w-5 text-gray-500" />
                <h3 class="text-lg font-semibold text-gray-900 dark:text-white">{app.name}</h3>
                <span class="status-indicator {getStatusColor(app.status)}">
                  {app.status}
                </span>
              </div>
              
              <p class="text-gray-600 dark:text-gray-400 mb-4">{app.description}</p>
              
              <div class="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                <div>
                  <div class="text-sm text-gray-500 dark:text-gray-400">Deployment Type</div>
                  <div class="text-sm font-medium text-gray-900 dark:text-white">{app.deploymentType}</div>
                </div>
                <div>
                  <div class="text-sm text-gray-500 dark:text-gray-400">Deployed Lanes</div>
                  <div class="text-sm font-medium text-gray-900 dark:text-white">
                    {app.deployedLanes.length} lane{app.deployedLanes.length !== 1 ? 's' : ''}
                  </div>
                </div>
                <div>
                  <div class="text-sm text-gray-500 dark:text-gray-400">Created</div>
                  <div class="text-sm font-medium text-gray-900 dark:text-white">
                    {formatDate(app.createdAt || '')}
                  </div>
                </div>
              </div>

              <!-- Deployed Lanes -->
              <div class="mb-4">
                <div class="text-sm text-gray-500 dark:text-gray-400 mb-2">Deployed Lanes</div>
                <div class="flex flex-wrap gap-2">
                  {#each app.deployedLanes as laneId}
                    <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-primary-100 text-primary-800 dark:bg-primary-900 dark:text-primary-200">
                      {laneId.replace('lane', 'Lane ')}
                    </span>
                  {/each}
                </div>
              </div>
            </div>

            <!-- Actions -->
            <div class="flex items-center space-x-2 ml-4">
              <button
                class="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                on:click={() => handleRedeploy(app)}
                title="Redeploy"
              >
                <RefreshCw class="h-4 w-4" />
              </button>
              <button
                class="p-2 text-gray-400 hover:text-danger-600 dark:hover:text-danger-400"
                on:click={() => handleDelete(app)}
                title="Delete"
              >
                <Trash2 class="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      {/each}
    </div>
  {/if}
</div>
