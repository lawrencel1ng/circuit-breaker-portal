<script lang="ts">
  import { Shield, Globe, Zap, AlertTriangle, CheckCircle, RefreshCw, Server, Map, Activity } from 'lucide-svelte';
  
  let feeds = [
    {
      id: 'f1',
      name: 'IP Intelligence - Reputation',
      provider: 'Webroot & F5',
      description: 'Blocks IP addresses known to be sources of spam, phishing, or malware.',
      categories: ['Spam Sources', 'Phishing', 'Windows Exploits', 'Web Attacks', 'Scanners'],
      enabled: true,
      lastUpdated: '10 mins ago',
      count: '14,205 IPs'
    },
    {
      id: 'f2',
      name: 'Botnet Command & Control',
      provider: 'F5 Threat Labs',
      description: 'Prevents infected internal hosts from communicating with C&C servers.',
      categories: ['Botnets', 'C&C Servers', 'DGA Domains'],
      enabled: true,
      lastUpdated: '2 mins ago',
      count: '4,102 Domains'
    },
    {
      id: 'f3',
      name: 'Tor Exit Nodes',
      provider: 'Emerging Threats',
      description: 'Blocks traffic from known Tor exit nodes to prevent anonymized attacks.',
      categories: ['Anonymizers', 'Tor Nodes', 'Proxy Services'],
      enabled: false,
      lastUpdated: '1 hour ago',
      count: '2,500 IPs'
    },
    {
      id: 'f4',
      name: 'Geo-Location Blocking',
      provider: 'MaxMind',
      description: 'Blocks traffic from high-risk countries defined in corporate policy.',
      categories: ['North Korea', 'Iran', 'Russia', 'China'],
      enabled: true,
      lastUpdated: 'Daily',
      count: '4 Countries'
    }
  ];
  
  let riskScore = 85;
  
  function toggleFeed(id: string) {
    feeds = feeds.map(f => {
      if (f.id === id) {
        return { ...f, enabled: !f.enabled };
      }
      return f;
    });
    calculateScore();
  }
  
  function calculateScore() {
    const enabledCount = feeds.filter(f => f.enabled).length;
    riskScore = Math.floor((enabledCount / feeds.length) * 100);
  }
</script>

<div class="space-y-6">
  <!-- Header / Score -->
  <div class="bg-gradient-to-r from-slate-800 to-slate-900 rounded-xl p-6 text-white shadow-lg">
    <div class="flex items-center justify-between">
      <div>
        <h2 class="text-2xl font-bold flex items-center mb-2">
          <Shield class="h-8 w-8 text-indigo-400 mr-3" />
          Global Threat Intelligence
        </h2>
        <p class="text-slate-300 max-w-2xl">
          Real-time threat feeds automatically protect your network from known malicious actors. 
          Powered by F5 IP Intelligence and partner feeds.
        </p>
      </div>
      
      <div class="text-center bg-white/10 rounded-lg p-4 backdrop-blur-sm border border-white/10">
        <div class="text-xs text-slate-300 uppercase tracking-wider font-semibold mb-1">Protection Score</div>
        <div class="text-4xl font-bold {riskScore > 80 ? 'text-green-400' : riskScore > 50 ? 'text-yellow-400' : 'text-red-400'}">
          {riskScore}/100
        </div>
      </div>
    </div>
  </div>
  
  <!-- Feeds Grid -->
  <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
    {#each feeds as feed}
      <div class="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6 flex flex-col h-full transition-all duration-200 {feed.enabled ? 'ring-1 ring-indigo-500 border-indigo-500' : ''}">
        <div class="flex items-start justify-between mb-4">
          <div class="flex items-center">
            <div class="p-2 rounded-lg {feed.enabled ? 'bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400' : 'bg-gray-100 dark:bg-gray-700 text-gray-500'}">
              {#if feed.id === 'f1'}<Globe class="h-6 w-6" />{/if}
              {#if feed.id === 'f2'}<Zap class="h-6 w-6" />{/if}
              {#if feed.id === 'f3'}<Activity class="h-6 w-6" />{/if}
              {#if feed.id === 'f4'}<Map class="h-6 w-6" />{/if}
            </div>
            <div class="ml-3">
              <h3 class="text-lg font-medium text-gray-900 dark:text-white">{feed.name}</h3>
              <p class="text-xs text-gray-500 dark:text-gray-400">Provider: {feed.provider}</p>
            </div>
          </div>
          
          <button 
            on:click={() => toggleFeed(feed.id)}
            class="relative inline-flex flex-shrink-0 h-6 w-11 border-2 border-transparent rounded-full cursor-pointer transition-colors ease-in-out duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 {feed.enabled ? 'bg-indigo-600' : 'bg-gray-200 dark:bg-gray-700'}"
          >
            <span class="sr-only">Use setting</span>
            <span 
              aria-hidden="true" 
              class="pointer-events-none inline-block h-5 w-5 rounded-full bg-white shadow transform ring-0 transition ease-in-out duration-200 {feed.enabled ? 'translate-x-5' : 'translate-x-0'}"
            ></span>
          </button>
        </div>
        
        <p class="text-gray-600 dark:text-gray-300 text-sm mb-4 flex-grow">
          {feed.description}
        </p>
        
        <div class="space-y-3">
          <div class="flex flex-wrap gap-2">
            {#each feed.categories as cat}
              <span class="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300">
                {cat}
              </span>
            {/each}
          </div>
          
          <div class="pt-4 border-t border-gray-100 dark:border-gray-700 flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
            <span class="flex items-center">
              <RefreshCw class="h-3 w-3 mr-1" /> Updated: {feed.lastUpdated}
            </span>
            <span class="flex items-center">
              <Server class="h-3 w-3 mr-1" /> {feed.count} Objects
            </span>
          </div>
        </div>
      </div>
    {/each}
  </div>
  
  <!-- Alert Section -->
  <div class="bg-yellow-50 dark:bg-yellow-900/20 border-l-4 border-yellow-400 p-4">
    <div class="flex">
      <div class="flex-shrink-0">
        <AlertTriangle class="h-5 w-5 text-yellow-400" />
      </div>
      <div class="ml-3">
        <p class="text-sm text-yellow-700 dark:text-yellow-200">
          <span class="font-bold">Recommendation:</span> Enable "Tor Exit Nodes" blocking to prevent anonymized traffic from bypassing security controls.
          <button class="ml-2 font-medium underline text-yellow-700 dark:text-yellow-200 hover:text-yellow-600" on:click={() => { if(!feeds[2].enabled) toggleFeed('f3'); }}>Enable Now</button>
        </p>
      </div>
    </div>
  </div>
</div>
