<script lang="ts">
  import { FileText, Upload, Plus, Trash2, Shield, AlertTriangle, CheckCircle, Download } from 'lucide-svelte';
  import { notificationStore } from '$lib/stores/notificationStore';

  let certificates = [
    { id: 'cert_001', name: 'MyCompany Root CA', type: 'Root CA', expires: '2028-12-31', status: 'valid', issuer: 'Self-Signed' },
    { id: 'cert_002', name: 'Global Intercept CA', type: 'Intermediate', expires: '2025-06-15', status: 'valid', issuer: 'MyCompany Root CA' },
    { id: 'cert_003', name: 'Legacy Proxy CA', type: 'Root CA', expires: '2023-01-01', status: 'expired', issuer: 'Self-Signed' }
  ];

  let isUploadModalOpen = false;
  let newCertName = '';
  let newCertFile: FileList | null = null;

  function deleteCert(id: string) {
    certificates = certificates.filter(c => c.id !== id);
    notificationStore.add({ type: 'info', title: 'Certificate Removed', message: 'The certificate has been deleted.' });
  }

  function handleUpload() {
    // Mock upload logic
    if (newCertName) {
      certificates = [...certificates, {
        id: `cert_${Math.random().toString(36).substr(2, 9)}`,
        name: newCertName,
        type: 'Intermediate',
        expires: '2026-01-01',
        status: 'valid',
        issuer: 'Uploaded CA'
      }];
      isUploadModalOpen = false;
      newCertName = '';
      notificationStore.add({ type: 'success', title: 'Certificate Uploaded', message: 'New CA certificate added successfully.' });
    }
  }
</script>

<div class="space-y-6">
  <!-- Header / Actions -->
  <div class="flex justify-between items-center">
    <div>
      <h2 class="text-lg font-medium text-gray-900 dark:text-white">Certificate Authority (CA) Management</h2>
      <p class="text-sm text-gray-500 dark:text-gray-400">Manage certificates used for SSL interception and signing.</p>
    </div>
    <div class="flex space-x-3">
      <button class="inline-flex items-center px-4 py-2 border border-gray-300 dark:border-gray-600 shadow-sm text-sm font-medium rounded-md text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none">
        <Plus class="h-4 w-4 mr-2" />
        Generate CSR
      </button>
      <button 
        on:click={() => isUploadModalOpen = !isUploadModalOpen}
        class="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none"
      >
        <Upload class="h-4 w-4 mr-2" />
        Upload Certificate
      </button>
    </div>
  </div>

  <!-- Upload Section (Collapsible) -->
  {#if isUploadModalOpen}
    <div class="bg-gray-50 dark:bg-gray-800/50 p-4 rounded-lg border border-gray-200 dark:border-gray-700 animate-in fade-in slide-in-from-top-2">
      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label for="cert-name" class="block text-sm font-medium text-gray-700 dark:text-gray-300">Certificate Name</label>
          <input id="cert-name" type="text" bind:value={newCertName} class="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2 border" placeholder="e.g. Finance Dept CA" />
        </div>
        <div>
          <label for="cert-file" class="block text-sm font-medium text-gray-700 dark:text-gray-300">Certificate File (.pem, .crt)</label>
          <input id="cert-file" type="file" class="mt-1 block w-full text-sm text-gray-500 dark:text-gray-400 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100 dark:file:bg-indigo-900/50 dark:file:text-indigo-300" />
        </div>
      </div>
      <div class="mt-4 flex justify-end space-x-3">
        <button on:click={() => isUploadModalOpen = false} class="px-3 py-2 text-sm text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white">Cancel</button>
        <button on:click={handleUpload} class="px-3 py-2 bg-indigo-600 text-white text-sm rounded-md hover:bg-indigo-700">Import</button>
      </div>
    </div>
  {/if}

  <!-- Certificates List -->
  <div class="bg-white dark:bg-gray-800 shadow-sm rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
    <table class="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
      <thead class="bg-gray-50 dark:bg-gray-900">
        <tr>
          <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Name / ID</th>
          <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Type</th>
          <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Issuer</th>
          <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Status</th>
          <th scope="col" class="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Actions</th>
        </tr>
      </thead>
      <tbody class="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
        {#each certificates as cert}
          <tr>
            <td class="px-6 py-4 whitespace-nowrap">
              <div class="flex items-center">
                <div class="flex-shrink-0 h-10 w-10 bg-indigo-100 dark:bg-indigo-900/30 rounded-full flex items-center justify-center">
                  <Shield class="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
                </div>
                <div class="ml-4">
                  <div class="text-sm font-medium text-gray-900 dark:text-white">{cert.name}</div>
                  <div class="text-xs text-gray-500 dark:text-gray-400 font-mono">{cert.id}</div>
                </div>
              </div>
            </td>
            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
              <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium {cert.type === 'Root CA' ? 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300' : 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300'}">
                {cert.type}
              </span>
            </td>
            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">{cert.issuer}</td>
            <td class="px-6 py-4 whitespace-nowrap">
              {#if cert.status === 'valid'}
                <div class="flex items-center text-sm text-green-600 dark:text-green-400">
                  <CheckCircle class="h-4 w-4 mr-1.5" />
                  <span>Valid until {cert.expires}</span>
                </div>
              {:else}
                <div class="flex items-center text-sm text-red-600 dark:text-red-400">
                  <AlertTriangle class="h-4 w-4 mr-1.5" />
                  <span>Expired {cert.expires}</span>
                </div>
              {/if}
            </td>
            <td class="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
              <div class="flex items-center justify-end space-x-2">
                <button class="text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400" title="Download Public Key">
                  <Download class="h-4 w-4" />
                </button>
                <button on:click={() => deleteCert(cert.id)} class="text-gray-400 hover:text-red-600 dark:hover:text-red-400" title="Delete">
                  <Trash2 class="h-4 w-4" />
                </button>
              </div>
            </td>
          </tr>
        {/each}
      </tbody>
    </table>
  </div>
</div>
