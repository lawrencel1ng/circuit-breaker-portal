<script lang="ts">
  import { swgStore } from '$lib/stores/swgStore';
  import { notificationStore } from '$lib/stores/notificationStore';
  import { AlertOctagon, Mail, Layout, Save } from 'lucide-svelte';

  let customTemplate = $swgStore.blockPages.customTemplate;
  let contactEmail = $swgStore.blockPages.contactEmail;
  let showCategory = $swgStore.blockPages.showCategory;
  let showIP = $swgStore.blockPages.showIP;

  function saveConfig() {
    swgStore.updateBlockPages({ customTemplate, contactEmail, showCategory, showIP });
    notificationStore.add({
      type: 'success',
      title: 'Response Pages Updated',
      message: 'Block page template and settings saved.'
    });
  }

  // Preview helper
  $: blockedCategories = $swgStore.urlFiltering.categories.filter(c => c.status === 'blocked');
  $: categoryName = blockedCategories.length > 0 ? blockedCategories[0].name : 'Uncategorized';

  $: previewHtml = customTemplate
    .replace('{{category}}', showCategory ? `<b>${categoryName}</b>` : '')
    .replace('{{ip}}', showIP ? '10.10.10.10' : '')
    .replace('{{email}}', `<a href="mailto:${contactEmail}">${contactEmail}</a>`);

</script>

<div class="space-y-6">
  <div class="flex justify-between items-center">
    <div>
        <h2 class="text-lg font-semibold text-gray-900 dark:text-white flex items-center">
            <AlertOctagon class="h-5 w-5 mr-2 text-red-500" />
            User Response Pages
        </h2>
        <p class="text-sm text-gray-500 dark:text-gray-400">Customize what users see when access is denied.</p>
    </div>
    <button
      on:click={saveConfig}
      class="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
    >
      <Save class="h-4 w-4 mr-2" />
      Save Changes
    </button>
  </div>

  <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
    <!-- Editor -->
    <div class="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
        <h3 class="text-md font-medium text-gray-900 dark:text-white mb-4">Block Page Template</h3>
        <div class="space-y-4">
            <div>
                <label for="html-content" class="block text-sm font-medium text-gray-700 dark:text-gray-300">HTML Content</label>
                <textarea 
                    id="html-content"
                    bind:value={customTemplate} 
                    rows="10" 
                    class="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2 border font-mono text-xs"
                ></textarea>
                <p class="mt-1 text-xs text-gray-500">Available variables: <code>{ '{{category}}' }</code>, <code>{ '{{ip}}' }</code>, <code>{ '{{email}}' }</code></p>
            </div>
            
            <div class="grid grid-cols-2 gap-4">
                <div>
                    <label for="contact-email" class="block text-sm font-medium text-gray-700 dark:text-gray-300">Contact Email</label>
                    <input id="contact-email" type="email" bind:value={contactEmail} class="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2 border" />
                </div>
            </div>

            <div class="flex items-center space-x-6">
                <div class="flex items-center">
                    <input id="show-cat" type="checkbox" bind:checked={showCategory} class="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded" />
                    <label for="show-cat" class="ml-2 block text-sm text-gray-900 dark:text-gray-300">Show Block Category</label>
                </div>
                <div class="flex items-center">
                    <input id="show-ip" type="checkbox" bind:checked={showIP} class="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded" />
                    <label for="show-ip" class="ml-2 block text-sm text-gray-900 dark:text-gray-300">Show Client IP</label>
                </div>
            </div>
        </div>
    </div>

    <!-- Preview -->
    <div class="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6 flex flex-col">
        <h3 class="text-md font-medium text-gray-900 dark:text-white mb-4 flex items-center">
            <Layout class="h-4 w-4 mr-2" />
            Live Preview
        </h3>
        <div class="flex-1 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-4 bg-gray-50 dark:bg-gray-900 overflow-auto">
            <iframe 
                srcdoc={previewHtml} 
                title="Block Page Preview"
                class="w-full h-full bg-white border-0"
                sandbox="allow-same-origin"
            ></iframe>
        </div>
    </div>
  </div>
</div>
