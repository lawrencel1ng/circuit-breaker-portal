<script lang="ts">
  import { Shield, Settings, List, Lock, Activity, Globe, UserCheck, FileText, Play, Server, AlertOctagon } from 'lucide-svelte';
  import ProxyConfig from '$lib/components/swg/ProxyConfig.svelte';
  import URLListManager from '$lib/components/swg/URLListManager.svelte';
  import PolicyEditor from '$lib/components/swg/PolicyEditor.svelte';
  import AccessLogs from '$lib/components/swg/AccessLogs.svelte';
  import SelfServiceWhitelist from '$lib/components/swg/SelfServiceWhitelist.svelte';
  import PolicySimulator from '$lib/components/swg/PolicySimulator.svelte';
  import ThreatIntelligence from '$lib/components/swg/ThreatIntelligence.svelte';
  import EnterpriseConfig from '$lib/components/swg/EnterpriseConfig.svelte';
  import ResponsePages from '$lib/components/swg/ResponsePages.svelte';
  import { swgStore } from '$lib/stores/swgStore';

  let activeTab = 'dashboard';

  const tabs = [
    { id: 'dashboard', label: 'Dashboard', icon: Activity },
    { id: 'threats', label: 'Threat Intelligence', icon: Globe },
    { id: 'config', label: 'Proxy Config', icon: Settings },
    { id: 'filtering', label: 'URL Filtering', icon: List },
    { id: 'policies', label: 'Policies', icon: Shield },
    { id: 'simulator', label: 'Simulator', icon: Play },
    { id: 'self-service', label: 'Self-Service', icon: UserCheck },
    { id: 'logs', label: 'Logs', icon: FileText },
    { id: 'system', label: 'System', icon: Server }
  ];

  // Mock Data for Dashboard
  const activeSessions = [
    { id: 'sess_001', user: 'user01', ip: '10.10.20.105', duration: '14m 22s', traffic: '15.4 MB' },
    { id: 'sess_002', user: 'admin', ip: '10.10.20.101', duration: '2h 10m', traffic: '142.1 MB' },
    { id: 'sess_003', user: 'guest', ip: '10.10.20.112', duration: '0m 45s', traffic: '0.2 MB' }
  ];
</script>

<svelte:head>
  <title>Secure Web Gateway - Circuit Breaker Portal</title>
</svelte:head>

<div class="space-y-6">
  <!-- Header -->
  <div class="bg-gradient-to-r from-indigo-600 to-indigo-800 rounded-xl p-8 text-white shadow-lg">
    <div class="flex items-center justify-between">
      <div>
        <h1 class="text-3xl font-bold mb-2 flex items-center">
          <Globe class="h-8 w-8 mr-3" />
          Secure Web Gateway
        </h1>
        <p class="text-indigo-100 text-lg">
          Forward Proxy, URL Filtering, and SSL Interception Management
        </p>
      </div>
      <div class="flex items-center space-x-4">
        <div class="text-right">
          <p class="text-xs text-indigo-200 uppercase tracking-wider font-semibold">System Status</p>
          <div class="flex items-center justify-end space-x-2">
            <span class="w-3 h-3 bg-green-400 rounded-full animate-pulse"></span>
            <span class="font-medium">Operational</span>
          </div>
        </div>
      </div>
    </div>
  </div>

  <!-- Navigation Tabs -->
  <div class="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
    <nav class="flex divide-x divide-gray-200 dark:divide-gray-700" aria-label="Tabs">
      {#each tabs as tab}
        <button
          on:click={() => activeTab = tab.id}
          class="flex-1 group relative min-w-0 overflow-hidden py-4 px-4 text-center text-sm font-medium hover:bg-gray-50 dark:hover:bg-gray-750 focus:z-10 focus:outline-none transition-colors duration-200
            {activeTab === tab.id ? 'text-indigo-600 dark:text-indigo-400' : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'}"
        >
          <div class="flex flex-col items-center justify-center">
            <svelte:component this={tab.icon} class="h-6 w-6 mb-1 {activeTab === tab.id ? 'text-indigo-600 dark:text-indigo-400' : 'text-gray-400 group-hover:text-gray-500'}" />
            <span>{tab.label}</span>
          </div>
          <span
            aria-hidden="true"
            class="absolute inset-x-0 bottom-0 h-0.5 {activeTab === tab.id ? 'bg-indigo-500' : 'bg-transparent'}"
          ></span>
        </button>
      {/each}
    </nav>
  </div>

  <!-- Content Area -->
  <div class="min-h-[600px]">
    {#if activeTab === 'dashboard'}
      <div class="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        <!-- Key Metrics -->
        <div class="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
          <div class="flex items-center justify-between mb-4">
            <h3 class="text-gray-500 dark:text-gray-400 text-sm font-medium">Blocked Requests (24h)</h3>
            <Shield class="h-5 w-5 text-red-500" />
          </div>
          <p class="text-3xl font-bold text-gray-900 dark:text-white">1,248</p>
          <div class="mt-2 text-sm text-red-600 flex items-center">
            <span>↑ 12% from yesterday</span>
          </div>
        </div>

        <div class="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
          <div class="flex items-center justify-between mb-4">
            <h3 class="text-gray-500 dark:text-gray-400 text-sm font-medium">Active Users</h3>
            <UserCheck class="h-5 w-5 text-blue-500" />
          </div>
          <p class="text-3xl font-bold text-gray-900 dark:text-white">432</p>
          <div class="mt-2 text-sm text-green-600 flex items-center">
            <span>+24 currently online</span>
          </div>
        </div>

        <div class="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
          <div class="flex items-center justify-between mb-4">
            <h3 class="text-gray-500 dark:text-gray-400 text-sm font-medium">Bandwidth Saved</h3>
            <Activity class="h-5 w-5 text-green-500" />
          </div>
          <p class="text-3xl font-bold text-gray-900 dark:text-white">14.2 GB</p>
          <div class="mt-2 text-sm text-gray-500 dark:text-gray-400">
            <span>Via caching & compression</span>
          </div>
        </div>
      </div>

      <div class="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
        <div class="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <h3 class="text-lg font-medium text-gray-900 dark:text-white">Active Sessions</h3>
        </div>
        <div class="overflow-x-auto">
          <table class="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead class="bg-gray-50 dark:bg-gray-900/50">
              <tr>
                <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Session ID</th>
                <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">User</th>
                <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Source IP</th>
                <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Duration</th>
                <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Traffic</th>
              </tr>
            </thead>
            <tbody class="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
              {#each activeSessions as session}
                <tr>
                  <td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-indigo-600 dark:text-indigo-400">{session.id}</td>
                  <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">{session.user}</td>
                  <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">{session.ip}</td>
                  <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">{session.duration}</td>
                  <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">{session.traffic}</td>
                </tr>
              {/each}
            </tbody>
          </table>
        </div>
      </div>
    {:else if activeTab === 'threats'}
      <ThreatIntelligence />
    {:else if activeTab === 'config'}
      <ProxyConfig />
    {:else if activeTab === 'filtering'}
      <URLListManager />
    {:else if activeTab === 'policies'}
      <PolicyEditor />
    {:else if activeTab === 'simulator'}
      <PolicySimulator />
    {:else if activeTab === 'self-service'}
      <SelfServiceWhitelist />
    {:else if activeTab === 'logs'}
      <AccessLogs />
    {:else if activeTab === 'system'}
      <div class="space-y-8">
        <EnterpriseConfig />
        <ResponsePages />
      </div>
    {/if}
  </div>
</div>
