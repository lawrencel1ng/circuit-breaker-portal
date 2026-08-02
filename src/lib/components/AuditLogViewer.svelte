<script lang="ts">
  import { Search, Filter, Download, AlertCircle, CheckCircle, User, Globe, Target } from 'lucide-svelte';
  import { logStore } from '$lib/stores/logStore';

  let searchTerm = '';
  let selectedAction = 'all';

  $: logs = $logStore.auditLogs;
  
  $: filteredLogs = logs.filter(log => {
    const matchesSearch = 
      log.details.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.user.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (log.target || '').toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesAction = selectedAction === 'all' || log.action === selectedAction;

    return matchesSearch && matchesAction;
  });

  function exportLogs() {
    const csvContent = "data:text/csv;charset=utf-8," 
      + "Timestamp,User,Action,Target,Details,Status,IP\n"
      + filteredLogs.map(e => `${e.timestamp},${e.user},${e.action},${e.target},"${e.details}",${e.status},${e.ipAddress || ''}`).join("\n");
    
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "audit_logs.csv");
    document.body.appendChild(link);
    link.click();
  }
</script>

<div class="space-y-4">
  <!-- Filters -->
  <div class="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 flex flex-col sm:flex-row space-y-3 sm:space-y-0 sm:space-x-4 justify-between">
    <div class="flex-1 relative">
      <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
        <Search class="h-5 w-5 text-gray-400" />
      </div>
      <input
        type="text"
        bind:value={searchTerm}
        class="block w-full pl-10 sm:text-sm border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-md p-2 border focus:ring-indigo-500 focus:border-indigo-500"
        placeholder="Search audit logs..."
      />
    </div>
    <div class="flex items-center space-x-3">
      <button 
        on:click={exportLogs}
        class="inline-flex items-center px-4 py-2 border border-gray-300 dark:border-gray-600 shadow-sm text-sm font-medium rounded-md text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700"
      >
        <Download class="h-4 w-4 mr-2" />
        Export CSV
      </button>
    </div>
  </div>

  <!-- Table -->
  <div class="bg-white dark:bg-gray-800 shadow-sm rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
    <div class="overflow-x-auto">
      <table class="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
        <thead class="bg-gray-50 dark:bg-gray-900">
          <tr>
            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Timestamp</th>
            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">User</th>
            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Action</th>
            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Target</th>
            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Details</th>
            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Status</th>
          </tr>
        </thead>
        <tbody class="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
          {#each filteredLogs as log}
            <tr class="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
              <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                {new Date(log.timestamp).toLocaleString()}
              </td>
              <td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                <div class="flex items-center">
                  <User class="h-4 w-4 mr-2 text-gray-400" />
                  {log.user}
                </div>
              </td>
              <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                  {log.action}
                </span>
              </td>
              <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                <div class="flex items-center">
                  <Target class="h-4 w-4 mr-2 text-gray-400" />
                  {log.target}
                </div>
              </td>
              <td class="px-6 py-4 text-sm text-gray-500 dark:text-gray-400 max-w-md truncate">
                {log.details}
              </td>
              <td class="px-6 py-4 whitespace-nowrap text-sm">
                {#if log.status === 'success'}
                  <div class="flex items-center text-green-600 dark:text-green-400">
                    <CheckCircle class="h-4 w-4 mr-1" />
                    Success
                  </div>
                {:else}
                  <div class="flex items-center text-red-600 dark:text-red-400">
                    <AlertCircle class="h-4 w-4 mr-1" />
                    Failure
                  </div>
                {/if}
              </td>
            </tr>
          {/each}
        </tbody>
      </table>
    </div>
  </div>
</div>
