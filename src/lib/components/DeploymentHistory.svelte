<script lang="ts">
  import { Clock, CheckCircle, XCircle, AlertTriangle, Eye, Download } from 'lucide-svelte';
  import type { DeploymentRequest } from '$lib/types';

  export let deployments: DeploymentRequest[] = [];

  function getStatusColor(status: string) {
    switch (status) {
      case 'deployed': return 'text-green-600 bg-green-100 dark:bg-green-900 dark:text-green-200';
      case 'deploying': return 'text-blue-600 bg-blue-100 dark:bg-blue-900 dark:text-blue-200';
      case 'approved': return 'text-yellow-600 bg-yellow-100 dark:bg-yellow-900 dark:text-yellow-200';
      case 'pending': return 'text-gray-600 bg-gray-100 dark:bg-gray-900 dark:text-gray-200';
      case 'failed': return 'text-red-600 bg-red-100 dark:bg-red-900 dark:text-red-200';
      default: return 'text-gray-600 bg-gray-100 dark:bg-gray-900 dark:text-gray-200';
    }
  }

  function getSecurityLevelColor(level: string) {
    switch (level) {
      case 'low': return 'text-green-600 bg-green-100 dark:bg-green-900 dark:text-green-200';
      case 'medium': return 'text-yellow-600 bg-yellow-100 dark:bg-yellow-900 dark:text-yellow-200';
      case 'high': return 'text-orange-600 bg-orange-100 dark:bg-orange-900 dark:text-orange-200';
      case 'critical': return 'text-red-600 bg-red-100 dark:bg-red-900 dark:text-red-200';
      default: return 'text-gray-600 bg-gray-100 dark:bg-gray-900 dark:text-gray-200';
    }
  }

  function formatDate(dateString: string) {
    const date = new Date(dateString);
    return date.toLocaleString();
  }

  function viewAS3Declaration(declaration: any) {
    if (!declaration || typeof window === 'undefined') return;
    
    const newWindow = window.open('', '_blank', 'width=800,height=600');
    if (newWindow) {
      newWindow.document.write(`
        <html>
          <head>
            <title>AS3 Declaration - ${declaration.id}</title>
            <style>
              body { font-family: monospace; margin: 20px; background: #f5f5f5; }
              pre { background: white; padding: 20px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
            </style>
          </head>
          <body>
            <h2>AS3 Declaration: ${declaration.id}</h2>
            <pre>${JSON.stringify(declaration.declaration, null, 2)}</pre>
          </body>
        </html>
      `);
    }
  }

  function downloadAS3Declaration(declaration: any) {
    if (!declaration || typeof document === 'undefined') return;
    
    const dataStr = JSON.stringify(declaration.declaration, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `as3-declaration-${declaration.id}.json`;
    link.click();
    URL.revokeObjectURL(url);
  }
</script>

<div class="space-y-6">
  <!-- Header -->
  <div class="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
    <div class="flex items-center justify-between">
      <div>
        <h3 class="text-lg font-semibold text-gray-900 dark:text-white">Deployment History</h3>
        <p class="text-sm text-gray-600 dark:text-gray-400 mt-1">
          Track all deployment requests and their status
        </p>
      </div>
      <div class="text-sm text-gray-500 dark:text-gray-400">
        Total: {deployments.length} requests
      </div>
    </div>
  </div>

  <!-- Deployments List -->
  <div class="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
    <div class="overflow-x-auto">
      <table class="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
        <thead class="bg-gray-50 dark:bg-gray-700">
          <tr>
            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
              Request
            </th>
            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
              Application
            </th>
            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
              Security
            </th>
            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
              Status
            </th>
            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
              VIP Address
            </th>
            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
              Timestamp
            </th>
            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
              Actions
            </th>
          </tr>
        </thead>
        <tbody class="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
          {#each deployments as deployment (deployment.id)}
            <tr class="hover:bg-gray-50 dark:hover:bg-gray-700">
              <td class="px-6 py-4 whitespace-nowrap">
                <div class="flex items-center">
                  <div class="flex-shrink-0 h-10 w-10">
                    <div class="h-10 w-10 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center">
                      <span class="text-sm font-medium text-blue-600 dark:text-blue-400">
                        {deployment.id.split('-')[1]}
                      </span>
                    </div>
                  </div>
                  <div class="ml-4">
                    <div class="text-sm font-medium text-gray-900 dark:text-white">
                      {deployment.id}
                    </div>
                    <div class="text-sm text-gray-500 dark:text-gray-400">
                      {deployment.developer}
                    </div>
                  </div>
                </div>
              </td>
              <td class="px-6 py-4 whitespace-nowrap">
                <div class="text-sm font-medium text-gray-900 dark:text-white">
                  {deployment.applicationName}
                </div>
                <div class="text-sm text-gray-500 dark:text-gray-400">
                  {deployment.applicationType.toUpperCase()} • {deployment.environment}
                </div>
              </td>
              <td class="px-6 py-4 whitespace-nowrap">
                <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium {getSecurityLevelColor(deployment.securityLevel)}">
                  {deployment.securityLevel}
                </span>
              </td>
              <td class="px-6 py-4 whitespace-nowrap">
                <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium {getStatusColor(deployment.status)}">
                  {#if deployment.status === 'deployed'}
                    <CheckCircle class="h-3 w-3 mr-1" />
                  {:else if deployment.status === 'failed'}
                    <XCircle class="h-3 w-3 mr-1" />
                  {:else}
                    <Clock class="h-3 w-3 mr-1" />
                  {/if}
                  {deployment.status}
                </span>
              </td>
              <td class="px-6 py-4 whitespace-nowrap">
                {#if deployment.vipAddress}
                  <div class="text-sm font-mono text-gray-900 dark:text-white">
                    {deployment.vipAddress}
                  </div>
                {:else}
                  <span class="text-sm text-gray-400 dark:text-gray-500">-</span>
                {/if}
              </td>
              <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                {formatDate(deployment.timestamp)}
              </td>
              <td class="px-6 py-4 whitespace-nowrap text-sm font-medium">
                <div class="flex items-center space-x-2">
                  {#if deployment.as3Declaration}
                    <button
                      on:click={() => viewAS3Declaration(deployment.as3Declaration)}
                      class="text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300"
                      title="View AS3 Declaration"
                    >
                      <Eye class="h-4 w-4" />
                    </button>
                    <button
                      on:click={() => downloadAS3Declaration(deployment.as3Declaration)}
                      class="text-green-600 hover:text-green-900 dark:text-green-400 dark:hover:text-green-300"
                      title="Download AS3 Declaration"
                    >
                      <Download class="h-4 w-4" />
                    </button>
                  {/if}
                  {#if deployment.monitoringUrl}
                    <a
                      href={deployment.monitoringUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      class="text-purple-600 hover:text-purple-900 dark:text-purple-400 dark:hover:text-purple-300"
                      title="View Monitoring"
                    >
                      <svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                      </svg>
                    </a>
                  {/if}
                </div>
              </td>
            </tr>
          {/each}
        </tbody>
      </table>
    </div>
  </div>

  <!-- Empty State -->
  {#if deployments.length === 0}
    <div class="text-center py-12">
      <Clock class="mx-auto h-12 w-12 text-gray-400" />
      <h3 class="mt-2 text-sm font-medium text-gray-900 dark:text-white">No deployments yet</h3>
      <p class="mt-1 text-sm text-gray-500 dark:text-gray-400">
        Submit your first deployment request to get started.
      </p>
    </div>
  {/if}
</div>


