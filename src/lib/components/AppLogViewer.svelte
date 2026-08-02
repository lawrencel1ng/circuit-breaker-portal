<script lang="ts">
  import { Search, Filter, Download, Info, AlertTriangle, AlertCircle, Terminal } from 'lucide-svelte';
  import { logStore } from '$lib/stores/logStore';

  let searchTerm = '';
  let selectedLevel = 'all';

  $: logs = $logStore.appLogs;
  
  $: filteredLogs = logs.filter(log => {
    const matchesSearch = 
      log.message.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (log.component || '').toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesLevel = selectedLevel === 'all' || log.level === selectedLevel;

    return matchesSearch && matchesLevel;
  });

  function getLevelColor(level: string) {
    switch (level) {
      case 'info': return 'text-blue-600 bg-blue-100 dark:bg-blue-900/30 dark:text-blue-300';
      case 'warn': return 'text-yellow-600 bg-yellow-100 dark:bg-yellow-900/30 dark:text-yellow-300';
      case 'error': return 'text-red-600 bg-red-100 dark:bg-red-900/30 dark:text-red-300';
      case 'debug': return 'text-gray-600 bg-gray-100 dark:bg-gray-700 dark:text-gray-300';
      default: return 'text-gray-600';
    }
  }

  function getLevelIcon(level: string) {
    switch (level) {
      case 'info': return Info;
      case 'warn': return AlertTriangle;
      case 'error': return AlertCircle;
      case 'debug': return Terminal;
      default: return Info;
    }
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
        placeholder="Search application logs..."
      />
    </div>
    <div class="flex items-center space-x-3">
      <select
        bind:value={selectedLevel}
        class="block w-full pl-3 pr-10 py-2 text-base border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md border"
      >
        <option value="all">All Levels</option>
        <option value="info">Info</option>
        <option value="warn">Warning</option>
        <option value="error">Error</option>
        <option value="debug">Debug</option>
      </select>
    </div>
  </div>

  <!-- Logs Stream Style -->
  <div class="bg-gray-900 rounded-lg shadow-sm border border-gray-700 overflow-hidden font-mono text-sm">
    <div class="p-4 border-b border-gray-800 flex justify-between items-center">
      <span class="text-gray-400">Application Output</span>
      <span class="text-xs text-gray-500">{filteredLogs.length} events</span>
    </div>
    <div class="max-h-[600px] overflow-y-auto p-4 space-y-2">
      {#each filteredLogs as log}
        <div class="flex items-start space-x-3 hover:bg-gray-800/50 p-1 rounded">
          <span class="text-gray-500 shrink-0 w-36">{new Date(log.timestamp).toISOString().split('T')[1].replace('Z','')}</span>
          <span class={`uppercase font-bold text-xs px-2 py-0.5 rounded shrink-0 w-16 text-center ${getLevelColor(log.level)}`}>
            {log.level}
          </span>
          <span class="text-purple-400 shrink-0 w-32">[{log.component}]</span>
          <span class="text-gray-300 break-all">{log.message}</span>
          {#if log.details}
             <span class="text-gray-500 text-xs">{JSON.stringify(log.details)}</span>
          {/if}
        </div>
      {/each}
      {#if filteredLogs.length === 0}
        <div class="text-gray-500 italic text-center py-8">No logs found matching filters.</div>
      {/if}
    </div>
  </div>
</div>
