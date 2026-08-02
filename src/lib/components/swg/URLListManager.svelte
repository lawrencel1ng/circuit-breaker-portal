<script lang="ts">
  import { swgStore } from '$lib/stores/swgStore';
  import { notificationStore } from '$lib/stores/notificationStore';
  import { Plus, Trash2, Search, Upload, Download, List, Tag, Edit2, Save, X } from 'lucide-svelte';

  let newUrl = '';
  let searchQuery = '';
  let selectedGroup = 'dg-blocked-urls'; // Default group
  let activeTab = 'custom'; // 'custom' | 'categories'
  
  let editingUrl: string | null = null;
  let editValue = '';
  
  // Bulk Import State
  let showImportModal = false;
  let importText = '';
  let importProgress = { current: 0, total: 0 };
  let isImporting = false;

  $: filteredUrls = $swgStore.urlFiltering.blockedUrls.filter(url => 
    url.toLowerCase().includes(searchQuery.toLowerCase())
  );
  
  $: categories = $swgStore.urlFiltering.categories;

  function addUrl() {
    if (newUrl && !$swgStore.urlFiltering.blockedUrls.includes(newUrl)) {
      swgStore.addBlockedUrl(newUrl);
      notificationStore.add({
        type: 'success',
        title: 'URL Blocked',
        message: `Added ${newUrl} to ${selectedGroup}`
      });
      newUrl = '';
    }
  }

  function removeUrl(url: string) {
    swgStore.removeBlockedUrl(url);
    notificationStore.add({
      type: 'info',
      title: 'URL Unblocked',
      message: `Removed ${url} from ${selectedGroup}`
    });
  }

  function startEdit(url: string) {
    editingUrl = url;
    editValue = url;
  }

  function cancelEdit() {
    editingUrl = null;
    editValue = '';
  }

  function saveEdit() {
    if (editingUrl && editValue) {
        if (editValue !== editingUrl && $swgStore.urlFiltering.blockedUrls.includes(editValue)) {
            notificationStore.add({
                type: 'error',
                title: 'Duplicate URL',
                message: `${editValue} is already in the list.`
            });
            return;
        }
        
        if (editValue !== editingUrl) {
            swgStore.updateBlockedUrl(editingUrl, editValue);
            notificationStore.add({
                type: 'success',
                title: 'URL Updated',
                message: `Updated ${editingUrl} to ${editValue}`
            });
        }
        cancelEdit();
    }
  }

  function toggleCategory(catId: string) {
      const cat = categories.find(c => c.id === catId);
      if (cat) {
          swgStore.toggleCategory(catId);
          notificationStore.add({
              type: 'success',
              title: 'Category Updated',
              message: `${cat.name} is now ${cat.status === 'blocked' ? 'allowed' : 'blocked'}`
          });
      }
  }

  function openImportModal() {
    showImportModal = true;
    importText = '';
    importProgress = { current: 0, total: 0 };
  }

  function closeImportModal() {
    showImportModal = false;
    importText = '';
    importProgress = { current: 0, total: 0 };
    isImporting = false;
  }

  async function handleBulkImport() {
    if (!importText.trim()) {
      notificationStore.add({ type: 'error', title: 'Import Error', message: 'Please enter URLs to import' });
      return;
    }

    isImporting = true;
    const urls = importText.split('\n').map(u => u.trim()).filter(u => u.length > 0);
    importProgress.total = urls.length;
    importProgress.current = 0;

    let added = 0;
    let skipped = 0;

    for (const url of urls) {
      if (!$swgStore.urlFiltering.blockedUrls.includes(url)) {
        swgStore.addBlockedUrl(url);
        added++;
      } else {
        skipped++;
      }
      importProgress.current++;
      // Small delay to show progress
      await new Promise(resolve => setTimeout(resolve, 50));
    }

    isImporting = false;
    
    notificationStore.add({ 
      type: 'success', 
      title: 'Import Complete', 
      message: `Added ${added} URLs, skipped ${skipped} duplicates` 
    });
    
    closeImportModal();
  }

  function handleExport() {
    if (typeof window === 'undefined') return;
    
    const blob = new Blob([$swgStore.urlFiltering.blockedUrls.join('\n')], { type: 'text/plain' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${selectedGroup}.txt`;
    a.click();
    window.URL.revokeObjectURL(url);
  }
</script>

<div class="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6 h-full flex flex-col">
  <div class="flex items-center justify-between mb-6">
    <div>
      <h2 class="text-lg font-semibold text-gray-900 dark:text-white">URL Filtering Manager</h2>
      <p class="text-sm text-gray-500 dark:text-gray-400">Manage blocked URL lists and categories</p>
    </div>
    <div class="flex items-center space-x-2">
      <button on:click={handleExport} class="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200" title="Export List">
        <Download class="h-5 w-5" />
      </button>
      <button on:click={openImportModal} class="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200" title="Import List">
        <Upload class="h-5 w-5" />
      </button>
    </div>
  </div>

  <!-- Tabs -->
  <div class="flex space-x-1 rounded-lg bg-gray-100 dark:bg-gray-700 p-1 mb-6">
    <button
        class="flex-1 flex items-center justify-center rounded-md px-4 py-2 text-sm font-medium transition-all {activeTab === 'custom' ? 'bg-white text-gray-900 shadow dark:bg-gray-600 dark:text-white' : 'text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white'}"
        on:click={() => activeTab = 'custom'}
    >
        <List class="h-4 w-4 mr-2" />
        Custom URL Lists
    </button>
    <button
        class="flex-1 flex items-center justify-center rounded-md px-4 py-2 text-sm font-medium transition-all {activeTab === 'categories' ? 'bg-white text-gray-900 shadow dark:bg-gray-600 dark:text-white' : 'text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white'}"
        on:click={() => activeTab = 'categories'}
    >
        <Tag class="h-4 w-4 mr-2" />
        Web Categories
    </button>
  </div>

  {#if activeTab === 'custom'}
      <!-- Group Selector -->
      <div class="mb-6">
        <label for="group-select" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Target Data Group</label>
        <select id="group-select" bind:value={selectedGroup} class="block w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2 border">
          <option value="dg-blocked-urls">dg-blocked-urls (Global Block List)</option>
          <option value="dg-malware-sites">dg-malware-sites</option>
          <option value="dg-phishing-sites">dg-phishing-sites</option>
        </select>
      </div>

      <!-- Add URL -->
      <div class="flex space-x-2 mb-6">
        <div class="relative flex-1">
          <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Plus class="h-4 w-4 text-gray-400" />
          </div>
          <input type="text" bind:value={newUrl} class="block w-full pl-10 rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2 border" placeholder="Enter URL to block (e.g. gambling.com)" on:keydown={(e) => e.key === 'Enter' && addUrl()} />
        </div>
        <button on:click={addUrl} class="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500">
          Block
        </button>
      </div>

      <!-- Search -->
      <div class="relative mb-4">
        <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <Search class="h-4 w-4 text-gray-400" />
        </div>
        <input type="text" bind:value={searchQuery} class="block w-full pl-10 rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2 border" placeholder="Search blocked URLs..." />
      </div>

      <!-- List -->
      <div class="flex-1 overflow-y-auto border border-gray-200 dark:border-gray-700 rounded-md">
        <ul class="divide-y divide-gray-200 dark:divide-gray-700">
          {#each filteredUrls as url}
            <li class="flex items-center justify-between p-3 hover:bg-gray-50 dark:hover:bg-gray-750">
              {#if editingUrl === url}
                <div class="flex-1 flex items-center space-x-2 mr-2">
                    <input 
                        type="text" 
                        bind:value={editValue} 
                        class="block w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-1 border"
                        on:keydown={(e) => {
                            if (e.key === 'Enter') saveEdit();
                            if (e.key === 'Escape') cancelEdit();
                        }}
                    />
                </div>
                <div class="flex items-center space-x-2">
                    <button on:click={saveEdit} class="text-green-600 hover:text-green-700 transition-colors" title="Save">
                        <Save class="h-4 w-4" />
                    </button>
                    <button on:click={cancelEdit} class="text-gray-400 hover:text-gray-500 transition-colors" title="Cancel">
                        <X class="h-4 w-4" />
                    </button>
                </div>
              {:else}
                <span class="text-sm text-gray-900 dark:text-white font-medium">{url}</span>
                <div class="flex items-center space-x-2">
                    <button on:click={() => startEdit(url)} class="text-gray-400 hover:text-indigo-500 transition-colors" title="Edit">
                        <Edit2 class="h-4 w-4" />
                    </button>
                    <button on:click={() => removeUrl(url)} class="text-gray-400 hover:text-red-500 transition-colors" title="Delete">
                        <Trash2 class="h-4 w-4" />
                    </button>
                </div>
              {/if}
            </li>
          {/each}
          {#if filteredUrls.length === 0}
            <li class="p-8 text-center text-gray-500 dark:text-gray-400">
              No URLs found
            </li>
          {/if}
        </ul>
      </div>
  {:else}
      <!-- Categories List -->
      <div class="grid grid-cols-1 gap-4">
          {#each categories as cat}
              <div class="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-750 rounded-lg border border-gray-200 dark:border-gray-700">
                  <div class="flex items-center space-x-3">
                      <div class="p-2 rounded-lg {cat.status === 'blocked' ? 'bg-red-100 dark:bg-red-900' : 'bg-green-100 dark:bg-green-900'}">
                          <Tag class="h-5 w-5 {cat.status === 'blocked' ? 'text-red-600 dark:text-red-400' : 'text-green-600 dark:text-green-400'}" />
                      </div>
                      <div>
                          <h3 class="text-sm font-medium text-gray-900 dark:text-white">{cat.name}</h3>
                          <p class="text-xs text-gray-500 dark:text-gray-400">{cat.count} URLs</p>
                      </div>
                  </div>
                  <button
                      on:click={() => toggleCategory(cat.id)}
                      class="relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-indigo-600 focus:ring-offset-2 {cat.status === 'blocked' ? 'bg-red-600' : 'bg-green-500'}"
                  >
                      <span class="sr-only">Toggle Category</span>
                      <span class="pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out {cat.status === 'blocked' ? 'translate-x-5' : 'translate-x-0'}"></span>
                  </button>
              </div>
          {/each}
      </div>
  {/if}
</div>

<!-- Import Modal -->
{#if showImportModal}
  <div class="fixed inset-0 z-50 overflow-y-auto" aria-labelledby="modal-title" role="dialog" aria-modal="true">
    <div class="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
      <div class="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" aria-hidden="true" on:click={closeImportModal}></div>
      <span class="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>
      <div class="inline-block align-bottom bg-white dark:bg-gray-800 rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg w-full">
        <div class="bg-white dark:bg-gray-800 px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
          <h3 class="text-lg leading-6 font-medium text-gray-900 dark:text-white mb-4">Bulk Import URLs</h3>
          <p class="text-sm text-gray-500 mb-4">Enter one URL per line to add to the block list.</p>
          <textarea
            bind:value={importText}
            rows="10"
            class="block w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2 border"
            placeholder="example.com&#10;malware-site.com&#10;phishing.net"
          ></textarea>
          {#if isImporting}
            <div class="mt-4">
              <div class="flex justify-between text-sm text-gray-600 dark:text-gray-400 mb-1">
                <span>Importing...</span>
                <span>{importProgress.current} / {importProgress.total}</span>
              </div>
              <div class="w-full bg-gray-200 rounded-full h-2.5 dark:bg-gray-700">
                <div class="bg-indigo-600 h-2.5 rounded-full" style="width: {(importProgress.total > 0 ? (importProgress.current / importProgress.total) * 100 : 0)}%"></div>
              </div>
            </div>
          {/if}
        </div>
        <div class="bg-gray-50 dark:bg-gray-700 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
          <button
            type="button"
            on:click={handleBulkImport}
            disabled={isImporting}
            class="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-indigo-600 text-base font-medium text-white hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:ml-3 sm:w-auto sm:text-sm disabled:opacity-50"
          >
            {isImporting ? 'Importing...' : 'Import'}
          </button>
          <button
            type="button"
            on:click={closeImportModal}
            disabled={isImporting}
            class="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm disabled:opacity-50"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  </div>
{/if}
