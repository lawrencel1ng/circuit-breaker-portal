<script lang="ts">
  import { swgStore } from '$lib/stores/swgStore';
  import { notificationStore } from '$lib/stores/notificationStore';
  import { Globe, UserCheck, FileText, Lock, Shield, Trash2, Plus, Save, Activity, Play, CheckCircle, XCircle, Clipboard } from 'lucide-svelte';

  // Proxy State
  let proxyIp = $swgStore.proxyListener.ip;
  let proxyPort = $swgStore.proxyListener.port;
  let proxyEnabled = $swgStore.proxyListener.enabled;

  // SSL State
  let caCert = $swgStore.sslConfig.caCert;
  let sslIntercept = $swgStore.sslConfig.intercept;
  let newBypassUrl = '';

  // Auth State
  let authEnabled = $swgStore.authentication.enabled;
  let authScheme = $swgStore.authentication.scheme;
  let authRealm = $swgStore.authentication.realm;

  // Logging State
  let logEnabled = $swgStore.logging.enabled;
  let logLevel = $swgStore.logging.level;
  let logDest = $swgStore.logging.destination;

  // ICAP State
  let icapEnabled = $swgStore.icap?.enabled ?? false;
  let icapUri = $swgStore.icap?.serverUri ?? '';
  let icapPreview = $swgStore.icap?.previewSize ?? 1024;
  let icapFailOpen = $swgStore.icap?.failOpen ?? true;

  // SIEM State
  let siemEnabled = $swgStore.siem?.enabled ?? false;
  let siemIp = $swgStore.siem?.serverIp ?? '';
  let siemPort = $swgStore.siem?.port ?? 514;
  let siemProto = $swgStore.siem?.protocol ?? 'udp';
  let siemFormat = $swgStore.siem?.format ?? 'cef';

  // Test Connectivity State
  let testUrl = 'https://microsoft.com';
  let isTesting = false;
  let testResult: { success: boolean; message: string; details?: string } | null = null;

  function saveConfig() {
    swgStore.updateProxyListener({ ip: proxyIp, port: proxyPort, enabled: proxyEnabled });
    swgStore.updateSSLConfig({ caCert, intercept: sslIntercept });
    swgStore.updateAuthentication({ enabled: authEnabled, scheme: authScheme, realm: authRealm });
    swgStore.updateLogging({ enabled: logEnabled, level: logLevel, destination: logDest });
    
    if (swgStore.updateICAP) {
      swgStore.updateICAP({ enabled: icapEnabled, serverUri: icapUri, previewSize: icapPreview, failOpen: icapFailOpen });
    }
    if (swgStore.updateSIEM) {
      swgStore.updateSIEM({ enabled: siemEnabled, serverIp: siemIp, port: siemPort, protocol: siemProto, format: siemFormat });
    }
    
    notificationStore.add({
      type: 'success',
      title: 'Configuration Saved',
      message: 'All proxy settings have been updated.'
    });
  }

  function addBypass() {
    if (newBypassUrl && !$swgStore.sslConfig.bypassList.includes(newBypassUrl)) {
      swgStore.addBypassUrl(newBypassUrl);
      newBypassUrl = '';
      notificationStore.add({ type: 'success', title: 'URL Added', message: 'Added to SSL Bypass.' });
    }
  }

  function removeBypass(url: string) {
    swgStore.removeBypassUrl(url);
    notificationStore.add({ type: 'info', title: 'URL Removed', message: 'Removed from SSL Bypass.' });
  }

  function testConnectivity() {
    isTesting = true;
    testResult = null;
    
    // Simulate connectivity test
    setTimeout(() => {
      isTesting = false;
      testResult = {
        success: true,
        message: 'Connection successful',
        details: `curl -vkx ${proxyIp}:${proxyPort} ${testUrl}`
      };
    }, 1500);
  }

  function copyCurlCommand() {
    const cmd = `curl -vkx ${proxyIp}:${proxyPort} ${testUrl}`;
    navigator.clipboard.writeText(cmd);
    notificationStore.add({ type: 'success', title: 'Copied', message: 'cURL command copied to clipboard' });
  }
</script>

<div class="space-y-6 pb-20">
  
  <!-- Header / Save -->
  <div class="flex justify-end">
    <button
      on:click={saveConfig}
      class="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
    >
      <Save class="h-4 w-4 mr-2" />
      Save All Changes
    </button>
  </div>

  <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
    
    <!-- Explicit Proxy Listener -->
    <div class="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
      <div class="flex items-center justify-between mb-4">
        <div class="flex items-center space-x-3">
          <div class="p-2 bg-indigo-100 dark:bg-indigo-900 rounded-lg">
            <Globe class="h-6 w-6 text-indigo-600 dark:text-indigo-400" />
          </div>
          <div>
            <h2 class="text-lg font-semibold text-gray-900 dark:text-white">Explicit Proxy</h2>
            <p class="text-sm text-gray-500 dark:text-gray-400">Listener Configuration</p>
          </div>
        </div>
        <div class="flex items-center">
             <button
                class="relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-indigo-600 focus:ring-offset-2 {proxyEnabled ? 'bg-green-500' : 'bg-gray-200 dark:bg-gray-700'}"
                role="switch"
                aria-checked={proxyEnabled}
                on:click={() => proxyEnabled = !proxyEnabled}
            >
                <span class="sr-only">Enable Proxy</span>
                <span class="pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out {proxyEnabled ? 'translate-x-5' : 'translate-x-0'}"></span>
            </button>
        </div>
      </div>

      <div class="grid grid-cols-1 gap-4">
        <div>
          <label for="proxy-ip" class="block text-sm font-medium text-gray-700 dark:text-gray-300">IP Address</label>
          <input type="text" id="proxy-ip" bind:value={proxyIp} class="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2 border" />
        </div>
        <div>
          <label for="proxy-port" class="block text-sm font-medium text-gray-700 dark:text-gray-300">Port</label>
          <input type="number" id="proxy-port" bind:value={proxyPort} class="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2 border" />
        </div>
      </div>
    </div>

    <!-- Authentication -->
    <div class="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
      <div class="flex items-center justify-between mb-4">
        <div class="flex items-center space-x-3">
          <div class="p-2 bg-blue-100 dark:bg-blue-900 rounded-lg">
            <UserCheck class="h-6 w-6 text-blue-600 dark:text-blue-400" />
          </div>
          <div>
            <h2 class="text-lg font-semibold text-gray-900 dark:text-white">Authentication</h2>
            <p class="text-sm text-gray-500 dark:text-gray-400">User Identity & Access</p>
          </div>
        </div>
        <div class="flex items-center">
             <button
                class="relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-blue-600 focus:ring-offset-2 {authEnabled ? 'bg-blue-600' : 'bg-gray-200 dark:bg-gray-700'}"
                role="switch"
                aria-checked={authEnabled}
                on:click={() => authEnabled = !authEnabled}
            >
                <span class="sr-only">Enable Auth</span>
                <span class="pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out {authEnabled ? 'translate-x-5' : 'translate-x-0'}"></span>
            </button>
        </div>
      </div>

      <div class="grid grid-cols-1 gap-4">
        <div>
          <label for="auth-scheme" class="block text-sm font-medium text-gray-700 dark:text-gray-300">Scheme</label>
          <select id="auth-scheme" bind:value={authScheme} class="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2 border">
            <option value="ntlm">NTLM (Windows Auth)</option>
            <option value="kerberos">Kerberos</option>
            <option value="basic">Basic</option>
            <option value="ldap">LDAP</option>
            <option value="saml">SAML</option>
          </select>
        </div>
        <div>
          <label for="auth-realm" class="block text-sm font-medium text-gray-700 dark:text-gray-300">Realm / Domain</label>
          <input type="text" id="auth-realm" bind:value={authRealm} class="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2 border" />
        </div>
        {#if authScheme === 'ldap'}
        <div class="col-span-1">
          <label for="ldap-server" class="block text-sm font-medium text-gray-700 dark:text-gray-300">LDAP Server</label>
          <input id="ldap-server" type="text" placeholder="ldap://server:389" class="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2 border" />
        </div>
        {/if}
      </div>
    </div>

    <!-- SSL Interception -->
    <div class="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6 lg:col-span-2">
      <div class="flex items-center justify-between mb-4">
        <div class="flex items-center space-x-3">
          <div class="p-2 bg-yellow-100 dark:bg-yellow-900 rounded-lg">
            <Lock class="h-6 w-6 text-yellow-600 dark:text-yellow-400" />
          </div>
          <div>
            <h2 class="text-lg font-semibold text-gray-900 dark:text-white">SSL Interception</h2>
            <p class="text-sm text-gray-500 dark:text-gray-400">Decrypt and inspect encrypted traffic</p>
          </div>
        </div>
        <div class="flex items-center">
             <button
                class="relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-yellow-600 focus:ring-offset-2 {sslIntercept ? 'bg-yellow-500' : 'bg-gray-200 dark:bg-gray-700'}"
                role="switch"
                aria-checked={sslIntercept}
                on:click={() => sslIntercept = !sslIntercept}
            >
                <span class="sr-only">Enable SSL Interception</span>
                <span class="pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out {sslIntercept ? 'translate-x-5' : 'translate-x-0'}"></span>
            </button>
        </div>
      </div>

      <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label for="ca-cert" class="block text-sm font-medium text-gray-700 dark:text-gray-300">CA Certificate</label>
          <select id="ca-cert" bind:value={caCert} class="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2 border">
            <option>MyCompany IT CA</option>
            <option>Global Root CA</option>
            <option>Self-Signed-001</option>
          </select>
          <p class="mt-1 text-xs text-gray-500">Certificate used to re-sign intercepted traffic.</p>
        </div>
        
        <!-- Bypass List -->
        <div>
          <label for="ssl-bypass" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">SSL Bypass List (Do Not Intercept)</label>
          <div class="flex space-x-2 mb-2">
            <input id="ssl-bypass" type="text" bind:value={newBypassUrl} placeholder="e.g. bank.com" class="flex-1 rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2 border" />
            <button on:click={addBypass} class="p-2 bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 rounded-md">
              <Plus class="h-4 w-4" />
            </button>
          </div>
          <div class="h-32 overflow-y-auto border border-gray-200 dark:border-gray-700 rounded-md p-2 space-y-1">
            {#each $swgStore.sslConfig.bypassList as url}
              <div class="flex justify-between items-center text-sm bg-gray-50 dark:bg-gray-800 p-1.5 rounded">
                <span>{url}</span>
                <button on:click={() => removeBypass(url)} class="text-red-500 hover:text-red-700">
                  <Trash2 class="h-3 w-3" />
                </button>
              </div>
            {/each}
          </div>
        </div>
      </div>
    </div>

    <!-- Logging -->
    <div class="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
      <div class="flex items-center justify-between mb-4">
        <div class="flex items-center space-x-3">
          <div class="p-2 bg-gray-100 dark:bg-gray-700 rounded-lg">
            <FileText class="h-6 w-6 text-gray-600 dark:text-gray-400" />
          </div>
          <div>
            <h2 class="text-lg font-semibold text-gray-900 dark:text-white">Logging</h2>
            <p class="text-sm text-gray-500 dark:text-gray-400">Audit & Access Logs</p>
          </div>
        </div>
        <div class="flex items-center">
             <button
                class="relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-gray-600 focus:ring-offset-2 {logEnabled ? 'bg-gray-600' : 'bg-gray-200 dark:bg-gray-700'}"
                role="switch"
                aria-checked={logEnabled}
                on:click={() => logEnabled = !logEnabled}
            >
                <span class="sr-only">Enable Logging</span>
                <span class="pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out {logEnabled ? 'translate-x-5' : 'translate-x-0'}"></span>
            </button>
        </div>
      </div>

      <div class="grid grid-cols-1 gap-4">
        <div>
          <label for="log-dest" class="block text-sm font-medium text-gray-700 dark:text-gray-300">Destination</label>
          <select id="log-dest" bind:value={logDest} class="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2 border">
            <option value="local">Local (/var/log/swg)</option>
            <option value="remote">Remote Syslog</option>
          </select>
        </div>
        <div>
          <label for="log-level" class="block text-sm font-medium text-gray-700 dark:text-gray-300">Log Level</label>
          <select id="log-level" bind:value={logLevel} class="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2 border">
            <option value="info">Info (Access Logs)</option>
            <option value="debug">Debug (Full Headers)</option>
            <option value="error">Error Only</option>
          </select>
        </div>
      </div>
    </div>

    <!-- ICAP Integration -->
    <div class="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
      <div class="flex items-center justify-between mb-4">
        <div class="flex items-center space-x-3">
          <div class="p-2 bg-red-100 dark:bg-red-900 rounded-lg">
            <Shield class="h-6 w-6 text-red-600 dark:text-red-400" />
          </div>
          <div>
            <h2 class="text-lg font-semibold text-gray-900 dark:text-white">ICAP Integration</h2>
            <p class="text-sm text-gray-500 dark:text-gray-400">DLP & Anti-Malware</p>
          </div>
        </div>
        <div class="flex items-center">
             <button
                class="relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-red-600 focus:ring-offset-2 {icapEnabled ? 'bg-red-600' : 'bg-gray-200 dark:bg-gray-700'}"
                role="switch"
                aria-checked={icapEnabled}
                on:click={() => icapEnabled = !icapEnabled}
            >
                <span class="sr-only">Enable ICAP</span>
                <span class="pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out {icapEnabled ? 'translate-x-5' : 'translate-x-0'}"></span>
            </button>
        </div>
      </div>

      <div class="grid grid-cols-1 gap-4">
        <div>
          <label for="icap-uri" class="block text-sm font-medium text-gray-700 dark:text-gray-300">ICAP Server URI</label>
          <input id="icap-uri" type="text" bind:value={icapUri} placeholder="icap://server:1344/reqmod" class="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2 border" />
        </div>
        <div class="grid grid-cols-2 gap-4">
            <div>
                <label for="icap-preview" class="block text-sm font-medium text-gray-700 dark:text-gray-300">Preview Size (Bytes)</label>
                <input id="icap-preview" type="number" bind:value={icapPreview} class="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2 border" />
            </div>
            <div class="flex items-center mt-6">
                <input id="fail-open" type="checkbox" bind:checked={icapFailOpen} class="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded" />
                <label for="fail-open" class="ml-2 block text-sm text-gray-900 dark:text-gray-300">Fail Open (Allow if ICAP down)</label>
            </div>
        </div>
      </div>
    </div>

    <!-- SIEM Integration -->
    <div class="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
      <div class="flex items-center justify-between mb-4">
        <div class="flex items-center space-x-3">
          <div class="p-2 bg-purple-100 dark:bg-purple-900 rounded-lg">
            <Globe class="h-6 w-6 text-purple-600 dark:text-purple-400" />
          </div>
          <div>
            <h2 class="text-lg font-semibold text-gray-900 dark:text-white">SIEM Export</h2>
            <p class="text-sm text-gray-500 dark:text-gray-400">Splunk / QRadar / ArcSight</p>
          </div>
        </div>
        <div class="flex items-center">
             <button
                class="relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-purple-600 focus:ring-offset-2 {siemEnabled ? 'bg-purple-600' : 'bg-gray-200 dark:bg-gray-700'}"
                role="switch"
                aria-checked={siemEnabled}
                on:click={() => siemEnabled = !siemEnabled}
            >
                <span class="sr-only">Enable SIEM</span>
                <span class="pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out {siemEnabled ? 'translate-x-5' : 'translate-x-0'}"></span>
            </button>
        </div>
      </div>

      <div class="grid grid-cols-1 gap-4">
        <div class="grid grid-cols-2 gap-4">
            <div>
                <label for="siem-ip" class="block text-sm font-medium text-gray-700 dark:text-gray-300">SIEM Server IP</label>
                <input id="siem-ip" type="text" bind:value={siemIp} class="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2 border" />
            </div>
            <div>
                <label for="siem-port" class="block text-sm font-medium text-gray-700 dark:text-gray-300">Port</label>
                <input id="siem-port" type="number" bind:value={siemPort} class="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2 border" />
            </div>
        </div>
        <div class="grid grid-cols-2 gap-4">
             <div>
              <label for="siem-proto" class="block text-sm font-medium text-gray-700 dark:text-gray-300">Protocol</label>
              <select id="siem-proto" bind:value={siemProto} class="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2 border">
                <option value="udp">UDP</option>
                <option value="tcp">TCP</option>
                <option value="tls">TLS (Secure)</option>
              </select>
            </div>
            <div>
              <label for="siem-format" class="block text-sm font-medium text-gray-700 dark:text-gray-300">Format</label>
              <select id="siem-format" bind:value={siemFormat} class="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2 border">
                <option value="cef">CEF (ArcSight)</option>
                <option value="leef">LEEF (QRadar)</option>
                <option value="syslog">Raw Syslog</option>
              </select>
            </div>
        </div>
      </div>
    </div>

    <!-- Test Connectivity -->
    <div class="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6 lg:col-span-2">
      <div class="flex items-center justify-between mb-4">
        <div class="flex items-center space-x-3">
          <div class="p-2 bg-green-100 dark:bg-green-900 rounded-lg">
            <Activity class="h-6 w-6 text-green-600 dark:text-green-400" />
          </div>
          <div>
            <h2 class="text-lg font-semibold text-gray-900 dark:text-white">Test Connectivity</h2>
            <p class="text-sm text-gray-500 dark:text-gray-400">Verify proxy configuration and SSL interception</p>
          </div>
        </div>
      </div>

      <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label for="test-url" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Test URL</label>
          <div class="flex space-x-2">
            <input 
              id="test-url"
              type="text" 
              bind:value={testUrl} 
              placeholder="https://example.com" 
              class="flex-1 rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2 border" 
            />
            <button 
              on:click={testConnectivity}
              disabled={isTesting}
              class="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50"
            >
              {#if isTesting}
                <svg class="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                  <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Testing...
              {:else}
                <Play class="h-4 w-4 mr-2" />
                Test
              {/if}
            </button>
          </div>
          <p class="mt-2 text-xs text-gray-500">
            Configure client browser proxy to {proxyIp}:{proxyPort}
          </p>
        </div>
        
        {#if testResult}
          <div class="bg-gray-50 dark:bg-gray-900 rounded-lg p-4">
            <div class="flex items-center mb-2">
              {#if testResult.success}
                <CheckCircle class="h-5 w-5 text-green-500 mr-2" />
                <span class="text-green-600 font-medium">{testResult.message}</span>
              {:else}
                <XCircle class="h-5 w-5 text-red-500 mr-2" />
                <span class="text-red-600 font-medium">{testResult.message}</span>
              {/if}
            </div>
            {#if testResult.details}
              <div class="mt-2">
                <p class="text-xs text-gray-500 mb-1">Test Command:</p>
                <div class="flex items-center space-x-2">
                  <code class="flex-1 bg-gray-100 dark:bg-gray-800 p-2 rounded text-xs font-mono text-gray-700 dark:text-gray-300 overflow-x-auto">
                    {testResult.details}
                  </code>
                  <button 
                    on:click={copyCurlCommand}
                    class="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
                    title="Copy to clipboard"
                  >
                    <Clipboard class="h-4 w-4" />
                  </button>
                </div>
              </div>
            {/if}
          </div>
        {/if}
      </div>
    </div>

  </div>
</div>
