<script lang="ts">
  import { swgStore } from '$lib/stores/swgStore';
  import { notificationStore } from '$lib/stores/notificationStore';
  import { ShieldAlert, RefreshCw, Key, AlertTriangle, CheckCircle, Clock, Save } from 'lucide-svelte';

  // Threat Feeds
  let autoUpdate = $swgStore.threatFeeds.autoUpdate;
  let updateInterval = $swgStore.threatFeeds.updateInterval;
  let licenseKey = $swgStore.threatFeeds.licenseKey;
  
  // PKI
  let crlEnabled = $swgStore.pki.crlEnabled;
  let ocspEnabled = $swgStore.pki.ocspEnabled;
  let ocspResponder = $swgStore.pki.ocspResponderURL;
  let crlPoint = $swgStore.pki.crlDistributionPoint;
  let expiryDays = $swgStore.pki.certExpiryAlertDays;

  function saveConfig() {
    swgStore.updateThreatFeeds({ autoUpdate, updateInterval, licenseKey });
    swgStore.updatePKI({ crlEnabled, ocspEnabled, ocspResponderURL: ocspResponder, crlDistributionPoint: crlPoint, certExpiryAlertDays: expiryDays });
    
    notificationStore.add({
      type: 'success',
      title: 'Enterprise Settings Saved',
      message: 'Threat intelligence and PKI settings updated.'
    });
  }

  function triggerUpdate() {
    notificationStore.add({
      type: 'info',
      title: 'Update Started',
      message: 'Downloading latest threat definitions...'
    });
    
    setTimeout(() => {
        notificationStore.add({
            type: 'success',
            title: 'Update Complete',
            message: 'Threat database is now current.'
        });
        swgStore.updateThreatFeeds({ lastUpdate: new Date().toISOString().replace('T', ' ').substring(0, 19), status: 'active' });
    }, 2000);
  }
</script>

<div class="space-y-6">
  <div class="flex justify-between items-center">
    <div>
        <h2 class="text-lg font-semibold text-gray-900 dark:text-white flex items-center">
            <ShieldAlert class="h-5 w-5 mr-2 text-indigo-500" />
            Enterprise Security
        </h2>
        <p class="text-sm text-gray-500 dark:text-gray-400">Threat Intelligence & PKI Management</p>
    </div>
    <button
      on:click={saveConfig}
      class="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
    >
      <Save class="h-4 w-4 mr-2" />
      Save Settings
    </button>
  </div>

  <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
    
    <!-- Threat Intelligence -->
    <div class="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
        <div class="flex items-center justify-between mb-4">
            <h3 class="text-md font-medium text-gray-900 dark:text-white flex items-center">
                <RefreshCw class="h-4 w-4 mr-2" />
                Threat Intelligence Feeds
            </h3>
            <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium {$swgStore.threatFeeds.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}">
                {$swgStore.threatFeeds.status === 'active' ? 'Active' : 'Expired'}
            </span>
        </div>

        <div class="space-y-4">
            <div class="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700">
                <div class="flex items-center">
                    <Clock class="h-5 w-5 text-gray-400 mr-3" />
                    <div>
                        <p class="text-sm font-medium text-gray-900 dark:text-white">Last Update</p>
                        <p class="text-xs text-gray-500">{$swgStore.threatFeeds.lastUpdate}</p>
                    </div>
                </div>
                <button on:click={triggerUpdate} class="text-indigo-600 hover:text-indigo-900 text-sm font-medium">Check Now</button>
            </div>

            <div>
                <label for="license-key" class="block text-sm font-medium text-gray-700 dark:text-gray-300">License Key</label>
                <div class="mt-1 flex rounded-md shadow-sm">
                    <input id="license-key" type="text" bind:value={licenseKey} class="flex-1 min-w-0 block w-full px-3 py-2 rounded-none rounded-l-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm border" />
                    <span class="inline-flex items-center px-3 rounded-r-md border border-l-0 border-gray-300 bg-gray-50 dark:bg-gray-700 text-gray-500 sm:text-sm">
                        <Key class="h-4 w-4" />
                    </span>
                </div>
            </div>

            <div class="grid grid-cols-2 gap-4">
                 <div class="flex items-center mt-6">
                    <input id="auto-update" type="checkbox" bind:checked={autoUpdate} class="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded" />
                    <label for="auto-update" class="ml-2 block text-sm text-gray-900 dark:text-gray-300">Auto-Update</label>
                </div>
                <div>
                    <label for="update-interval" class="block text-sm font-medium text-gray-700 dark:text-gray-300">Interval</label>
                    <select id="update-interval" bind:value={updateInterval} class="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2 border">
                        <option value="hourly">Hourly</option>
                        <option value="daily">Daily</option>
                        <option value="weekly">Weekly</option>
                    </select>
                </div>
            </div>
        </div>
    </div>

    <!-- PKI / Certificate Management -->
    <div class="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
        <h3 class="text-md font-medium text-gray-900 dark:text-white mb-4 flex items-center">
            <Key class="h-4 w-4 mr-2" />
            Certificate Management (PKI)
        </h3>
        
        <div class="space-y-4">
            <div class="flex items-center space-x-6">
                <div class="flex items-center">
                    <input id="crl-check" type="checkbox" bind:checked={crlEnabled} class="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded" />
                    <label for="crl-check" class="ml-2 block text-sm text-gray-900 dark:text-gray-300">Enable CRL Check</label>
                </div>
                <div class="flex items-center">
                    <input id="ocsp-check" type="checkbox" bind:checked={ocspEnabled} class="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded" />
                    <label for="ocsp-check" class="ml-2 block text-sm text-gray-900 dark:text-gray-300">Enable OCSP</label>
                </div>
            </div>

            <div>
                <label for="ocsp-responder" class="block text-sm font-medium text-gray-700 dark:text-gray-300">OCSP Responder URL</label>
                <input id="ocsp-responder" type="text" bind:value={ocspResponder} placeholder="http://ocsp.digicert.com" class="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2 border" />
            </div>

            <div>
                <label for="crl-point" class="block text-sm font-medium text-gray-700 dark:text-gray-300">CRL Distribution Point</label>
                <input id="crl-point" type="text" bind:value={crlPoint} placeholder="http://crl.digicert.com/ca3.crl" class="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2 border" />
            </div>

             <div>
                <label for="expiry-days" class="block text-sm font-medium text-gray-700 dark:text-gray-300">Certificate Expiry Alert (Days)</label>
                <div class="mt-1 relative rounded-md shadow-sm">
                    <input id="expiry-days" type="number" bind:value={expiryDays} class="block w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2 border" />
                    <div class="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                        <AlertTriangle class="h-4 w-4 text-yellow-500" />
                    </div>
                </div>
            </div>
        </div>
    </div>

  </div>
</div>
