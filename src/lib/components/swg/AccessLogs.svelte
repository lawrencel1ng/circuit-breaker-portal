<script lang="ts">
  import { Search, Filter, Download, AlertCircle, CheckCircle, Ban, Clock } from 'lucide-svelte';

  // Mock Log Data
  const logs = [
    { id: 'log_001', timestamp: '2023-10-27 10:45:12', clientIp: '10.10.20.105', user: 'user01', method: 'CONNECT', url: 'www.google.com:443', action: 'allow', rule: 'Default Allow', category: 'Search Engines' },
    { id: 'log_002', timestamp: '2023-10-27 10:45:15', clientIp: '10.10.20.105', user: 'user01', method: 'GET', url: 'www.google.com/search?q=test', action: 'allow', rule: 'Default Allow', category: 'Search Engines' },
    { id: 'log_003', timestamp: '2023-10-27 10:46:01', clientIp: '10.10.20.112', user: 'guest', method: 'GET', url: 'www.gambling-site.com', action: 'block', rule: 'Block Gambling', category: 'Gambling' },
    { id: 'log_004', timestamp: '2023-10-27 10:46:05', clientIp: '10.10.20.101', user: 'admin', method: 'GET', url: 'api.internal.corp/data', action: 'allow', rule: 'Internal Whitelist', category: 'Internal' },
    { id: 'log_005', timestamp: '2023-10-27 10:47:30', clientIp: '10.10.20.105', user: 'user01', method: 'GET', url: 'malware-distribution.net/payload', action: 'block', rule: 'Threat Intelligence', category: 'Malware' },
    { id: 'log_006', timestamp: '2023-10-27 10:48:11', clientIp: '10.10.20.105', user: 'user01', method: 'CONNECT', url: 'bank.com:443', action: 'bypass', rule: 'Finance Bypass', category: 'Finance' },
  ];

  let searchQuery = '';
  let filterAction = 'all';

  $: filteredLogs = logs.filter(log => {
    const matchesSearch = 
      log.url.toLowerCase().includes(searchQuery.toLowerCase()) || 
      log.user.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.clientIp.includes(searchQuery);
    
    const matchesAction = filterAction === 'all' || log.action === filterAction;
    
    return matchesSearch && matchesAction;
  });

  function getActionColor(action: string) {
    switch (action) {
      case 'allow': return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300';
      case 'block': return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300';
      case 'bypass': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300';
    }
  }

  function getActionIcon(action: string) {
    switch (action) {
      case 'allow': return CheckCircle;
      case 'block': return Ban;
      case 'bypass': return AlertCircle; // Or LockOpen
      default: return CheckCircle;
    }
  }
</script>

<div class="space-y-4">
  <!-- Filters Bar -->
  <div class="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 flex flex-col sm:flex-row space-y-3 sm:space-y-0 sm:space-x-4 justify-between">
    <div class="flex-1 relative rounded-md shadow-sm">
      <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
        <Search class="h-5 w-5 text-gray-400" />
      </div>
      <input
        type="text"
        bind:value={searchQuery}
        class="focus:ring-indigo-500 focus:border-indigo-500 block w-full pl-10 sm:text-sm border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-md p-2 border"
        placeholder="Search by URL, User, or IP..."
      />
    </div>
    
    <div class="flex items-center space-x-3">
      <div class="relative">
        <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <Filter class="h-4 w-4 text-gray-400" />
        </div>
        <select
          bind:value={filterAction}
          class="pl-10 block w-full pl-3 pr-10 py-2 text-base border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md border"
        >
          <option value="all">All Actions</option>
          <option value="allow">Allowed</option>
          <option value="block">Blocked</option>
          <option value="bypass">SSL Bypass</option>
        </select>
      </div>
      
      <button class="inline-flex items-center px-4 py-2 border border-gray-300 dark:border-gray-600 shadow-sm text-sm font-medium rounded-md text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none">
        <Download class="h-4 w-4 mr-2" />
        Export
      </button>
    </div>
  </div>

  <!-- Logs Table -->
  <div class="bg-white dark:bg-gray-800 shadow-sm rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
    <div class="overflow-x-auto">
      <table class="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
        <thead class="bg-gray-50 dark:bg-gray-900">
          <tr>
            <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Time</th>
            <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Client</th>
            <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Request</th>
            <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Action</th>
            <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Category/Rule</th>
          </tr>
        </thead>
        <tbody class="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
          {#each filteredLogs as log}
            <tr class="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
              <td class="px-6 py-4 whitespace-nowrap text-xs text-gray-500 dark:text-gray-400 font-mono">
                {log.timestamp}
              </td>
              <td class="px-6 py-4 whitespace-nowrap">
                <div class="text-sm font-medium text-gray-900 dark:text-white">{log.user}</div>
                <div class="text-xs text-gray-500 dark:text-gray-400">{log.clientIp}</div>
              </td>
              <td class="px-6 py-4">
                <div class="flex items-center space-x-2">
                  <span class="px-2 inline-flex text-xs leading-5 font-semibold rounded bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200">
                    {log.method}
                  </span>
                  <span class="text-sm text-gray-900 dark:text-white truncate max-w-xs" title={log.url}>
                    {log.url}
                  </span>
                </div>
              </td>
              <td class="px-6 py-4 whitespace-nowrap">
                <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium {getActionColor(log.action)} capitalize">
                  <svelte:component this={getActionIcon(log.action)} class="w-3 h-3 mr-1" />
                  {log.action}
                </span>
              </td>
              <td class="px-6 py-4 whitespace-nowrap">
                <div class="text-sm text-gray-900 dark:text-white">{log.category}</div>
                <div class="text-xs text-gray-500 dark:text-gray-400">{log.rule}</div>
              </td>
            </tr>
          {/each}
          {#if filteredLogs.length === 0}
            <tr>
              <td colspan="5" class="px-6 py-10 text-center text-gray-500 dark:text-gray-400">
                No logs found matching your criteria.
              </td>
            </tr>
          {/if}
        </tbody>
      </table>
    </div>
    <!-- Pagination -->
    <div class="bg-white dark:bg-gray-800 px-4 py-3 border-t border-gray-200 dark:border-gray-700 sm:px-6">
      <div class="flex items-center justify-between">
        <div class="flex-1 flex justify-between sm:hidden">
          <button class="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50">Previous</button>
          <button class="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50">Next</button>
        </div>
        <div class="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
          <div>
            <p class="text-sm text-gray-700 dark:text-gray-300">
              Showing <span class="font-medium">1</span> to <span class="font-medium">{filteredLogs.length}</span> of <span class="font-medium">{logs.length}</span> results
            </p>
          </div>
          <div>
            <nav class="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
              <button class="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-sm font-medium text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700">
                <span class="sr-only">Previous</span>
                <!-- Heroicon name: solid/chevron-left -->
                <svg class="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                  <path fill-rule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clip-rule="evenodd" />
                </svg>
              </button>
              <button class="relative inline-flex items-center px-4 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-sm font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700">1</button>
              <button class="relative inline-flex items-center px-4 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-sm font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700">2</button>
              <button class="relative inline-flex items-center px-4 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-sm font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700">3</button>
              <button class="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-sm font-medium text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700">
                <span class="sr-only">Next</span>
                <!-- Heroicon name: solid/chevron-right -->
                <svg class="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                  <path fill-rule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clip-rule="evenodd" />
                </svg>
              </button>
            </nav>
          </div>
        </div>
      </div>
    </div>
  </div>
</div>
