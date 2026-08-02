<script lang="ts">
  import { Save, Upload, Info } from 'lucide-svelte';

  let samlConfig = {
    enabled: false,
    idpEntityId: '',
    idpSsoUrl: '',
    spEntityId: 'https://facc.example.com/saml/metadata',
    attributeMapping: {
      email: 'http://schemas.xmlsoap.org/ws/2005/05/identity/claims/emailaddress',
      name: 'http://schemas.xmlsoap.org/ws/2005/05/identity/claims/name',
      groups: 'http://schemas.xmlsoap.org/claims/Group'
    }
  };

  let isSaving = false;

  function handleSave() {
    isSaving = true;
    setTimeout(() => {
      isSaving = false;
      // Mock success notification
      alert('SAML configuration saved successfully.');
    }, 1000);
  }
</script>

<div class="space-y-6">
  <div class="flex items-center justify-between">
    <div>
      <h1 class="text-2xl font-semibold text-gray-900 dark:text-white">SAML v2 Configuration</h1>
      <p class="mt-1 text-sm text-gray-500 dark:text-gray-400">Configure Single Sign-On (SSO) integration.</p>
    </div>
    <div class="flex items-center space-x-3">
        <label class="flex items-center cursor-pointer">
            <div class="relative">
            <input type="checkbox" class="sr-only" bind:checked={samlConfig.enabled} />
            <div class="w-10 h-6 bg-gray-200 dark:bg-gray-700 rounded-full shadow-inner transition-colors {samlConfig.enabled ? 'bg-indigo-600 dark:bg-indigo-500' : ''}"></div>
            <div class="dot absolute w-4 h-4 bg-white rounded-full shadow left-1 top-1 transition transition-transform {samlConfig.enabled ? 'transform translate-x-4' : ''}"></div>
            </div>
            <div class="ml-3 text-sm font-medium text-gray-700 dark:text-gray-300">
            {samlConfig.enabled ? 'Enabled' : 'Disabled'}
            </div>
        </label>
    </div>
  </div>

  <div class="bg-white dark:bg-gray-800 shadow rounded-lg border border-gray-200 dark:border-gray-700">
    <div class="p-6 space-y-8">
      <!-- Identity Provider Settings -->
      <div>
        <h3 class="text-lg font-medium leading-6 text-gray-900 dark:text-white flex items-center">
            Identity Provider (IdP) Settings
            <Info class="h-4 w-4 ml-2 text-gray-400" />
        </h3>
        <div class="mt-4 grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-6">
          <div class="sm:col-span-4">
            <label for="idpEntityId" class="block text-sm font-medium text-gray-700 dark:text-gray-300">
              IdP Entity ID
            </label>
            <div class="mt-1">
              <input
                type="text"
                id="idpEntityId"
                bind:value={samlConfig.idpEntityId}
                disabled={!samlConfig.enabled}
                class="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 dark:border-gray-600 rounded-md dark:bg-gray-700 dark:text-white disabled:opacity-50"
                placeholder="e.g., https://sts.windows.net/..."
              />
            </div>
          </div>

          <div class="sm:col-span-4">
            <label for="idpSsoUrl" class="block text-sm font-medium text-gray-700 dark:text-gray-300">
              IdP Single Sign-On URL
            </label>
            <div class="mt-1">
              <input
                type="text"
                id="idpSsoUrl"
                bind:value={samlConfig.idpSsoUrl}
                disabled={!samlConfig.enabled}
                class="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 dark:border-gray-600 rounded-md dark:bg-gray-700 dark:text-white disabled:opacity-50"
                placeholder="e.g., https://login.microsoftonline.com/..."
              />
            </div>
          </div>

          <div class="sm:col-span-6">
            <label for="idpCert" class="block text-sm font-medium text-gray-700 dark:text-gray-300">
              IdP Certificate (X.509)
            </label>
            <div class="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 dark:border-gray-600 border-dashed rounded-md disabled:opacity-50">
              <div class="space-y-1 text-center">
                <Upload class="mx-auto h-12 w-12 text-gray-400" />
                <div class="flex text-sm text-gray-600 dark:text-gray-400">
                  <label for="idpCert" class="relative cursor-pointer bg-white dark:bg-gray-800 rounded-md font-medium text-indigo-600 dark:text-indigo-400 hover:text-indigo-500 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-indigo-500">
                    <span>Upload a file</span>
                    <input id="idpCert" name="idpCert" type="file" class="sr-only" disabled={!samlConfig.enabled}>
                  </label>
                  <p class="pl-1">or drag and drop</p>
                </div>
                <p class="text-xs text-gray-500 dark:text-gray-400">
                  PEM, CER, or CRT up to 10MB
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Service Provider Settings -->
      <div class="pt-8 border-t border-gray-200 dark:border-gray-700">
        <h3 class="text-lg font-medium leading-6 text-gray-900 dark:text-white">
            Service Provider (SP) Settings
        </h3>
        <div class="mt-4 grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-6">
          <div class="sm:col-span-4">
            <label for="spEntityId" class="block text-sm font-medium text-gray-700 dark:text-gray-300">
              SP Entity ID (Audience URI)
            </label>
            <div class="mt-1 flex rounded-md shadow-sm">
                <span class="inline-flex items-center px-3 rounded-l-md border border-r-0 border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-gray-500 dark:text-gray-400 sm:text-sm">
                    Entity ID
                </span>
                <input
                    type="text"
                    id="spEntityId"
                    bind:value={samlConfig.spEntityId}
                    readonly
                    class="flex-1 min-w-0 block w-full px-3 py-2 rounded-none rounded-r-md focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm border-gray-300 dark:border-gray-600 bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400"
                />
            </div>
            <p class="mt-2 text-sm text-gray-500 dark:text-gray-400">
                Use this value when configuring your Identity Provider.
            </p>
          </div>
        </div>
      </div>
      
      <!-- Attribute Mapping -->
      <div class="pt-8 border-t border-gray-200 dark:border-gray-700">
        <h3 class="text-lg font-medium leading-6 text-gray-900 dark:text-white">
            Attribute Mapping
        </h3>
        <div class="mt-4 grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-6">
            <div class="sm:col-span-3">
                <label for="map-email" class="block text-sm font-medium text-gray-700 dark:text-gray-300">Email Attribute</label>
                <div class="mt-1">
                    <input type="text" id="map-email" bind:value={samlConfig.attributeMapping.email} disabled={!samlConfig.enabled} class="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 dark:border-gray-600 rounded-md dark:bg-gray-700 dark:text-white disabled:opacity-50" />
                </div>
            </div>
            <div class="sm:col-span-3">
                <label for="map-name" class="block text-sm font-medium text-gray-700 dark:text-gray-300">Name Attribute</label>
                <div class="mt-1">
                    <input type="text" id="map-name" bind:value={samlConfig.attributeMapping.name} disabled={!samlConfig.enabled} class="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 dark:border-gray-600 rounded-md dark:bg-gray-700 dark:text-white disabled:opacity-50" />
                </div>
            </div>
             <div class="sm:col-span-3">
                <label for="map-groups" class="block text-sm font-medium text-gray-700 dark:text-gray-300">Groups Attribute</label>
                <div class="mt-1">
                    <input type="text" id="map-groups" bind:value={samlConfig.attributeMapping.groups} disabled={!samlConfig.enabled} class="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 dark:border-gray-600 rounded-md dark:bg-gray-700 dark:text-white disabled:opacity-50" />
                </div>
            </div>
        </div>
      </div>

    </div>
    <div class="px-4 py-3 bg-gray-50 dark:bg-gray-900/50 text-right sm:px-6 rounded-b-lg border-t border-gray-200 dark:border-gray-700">
      <button
        type="button"
        on:click={handleSave}
        disabled={isSaving}
        class="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 transition-colors"
      >
        {#if isSaving}
            Saving...
        {:else}
            <Save class="h-4 w-4 mr-2" />
            Save Configuration
        {/if}
      </button>
    </div>
  </div>
</div>
