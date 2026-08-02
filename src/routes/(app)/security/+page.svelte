<script lang="ts">
  import { onMount, onDestroy } from 'svelte';
  import { Shield, AlertTriangle, CheckCircle, XCircle, Eye, Lock, Zap, Activity, Globe, Ban, Search, Download, Plus, Settings, FileText } from 'lucide-svelte';
  import { getWebSocketManager } from '$lib/stores/realtimeStore';

  // Types
  interface WAFPolicy {
    id: string;
    name: string;
    description?: string;
    template: string;
    enforcementMode: 'transparent' | 'blocking';
    status: 'active' | 'inactive' | 'pending';
    virtualServers: string[];
    modifiedAt: string;
  }

  interface SecurityEvent {
    id: string;
    timestamp: string;
    policyName: string;
    violation: string;
    severity: 'critical' | 'high' | 'medium' | 'low';
    clientIp: string;
    method: string;
    uri: string;
    action: 'blocked' | 'alerted' | 'learned';
  }

  interface SecurityStats {
    totalRequests: number;
    blockedRequests: number;
    alertedRequests: number;
    topViolations: { name: string; count: number }[];
    topAttackingIPs: { ip: string; count: number }[];
    topAttackedURLs: { url: string; count: number }[];
  }

  // State
  let policies: WAFPolicy[] = [];
  let events: SecurityEvent[] = [];
  let stats: SecurityStats | null = null;
  let loading = true;
  let error: string | null = null;
  let selectedPolicy: WAFPolicy | null = null;
  let showCreateModal = false;
  let showIPBlockModal = false;
  let activeTab: 'overview' | 'policies' | 'events' | 'geo-blocking' = 'overview';
  let ipToBlock = '';
  let blockReason = '';
  let timeRange: '1h' | '24h' | '7d' | '30d' = '24h';
  let wsUnsubscribe: (() => void) | null = null;

  // Form state for new policy
  let newPolicy = {
    name: '',
    description: '',
    template: 'enhanced',
    enforcementMode: 'transparent',
    language: 'utf-8'
  };

  async function fetchData() {
    try {
      loading = true;
      error = null;

      // Fetch policies, events, and stats in parallel
      const [policiesRes, eventsRes, statsRes] = await Promise.all([
        fetch('/api/waf'),
        fetch(`/api/waf?path=events&limit=50`),
        fetch(`/api/waf?path=stats&timeRange=${timeRange}`)
      ]);

      if (!policiesRes.ok) throw new Error('Failed to fetch policies');
      if (!eventsRes.ok) throw new Error('Failed to fetch events');
      if (!statsRes.ok) throw new Error('Failed to fetch stats');

      policies = await policiesRes.json();
      events = await eventsRes.json();
      stats = await statsRes.json();
    } catch (err: any) {
      error = err.message;
      console.error('Security dashboard error', err);
    } finally {
      loading = false;
    }
  }

  async function createPolicy() {
    try {
      const res = await fetch('/api/waf', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'createPolicy',
          policy: newPolicy
        })
      });

      if (!res.ok) throw new Error('Failed to create policy');

      const policy = await res.json();
      policies = [...policies, policy];
      showCreateModal = false;
      newPolicy = { name: '', description: '', template: 'enhanced', enforcementMode: 'transparent', language: 'utf-8' };
    } catch (err: any) {
      alert('Failed to create policy: ' + err.message);
    }
  }

  async function blockIP() {
    try {
      const res = await fetch('/api/waf', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'blockIP',
          ip: ipToBlock,
          reason: blockReason
        })
      });

      if (!res.ok) throw new Error('Failed to block IP');

      showIPBlockModal = false;
      ipToBlock = '';
      blockReason = '';
      alert('IP blocked successfully');
    } catch (err: any) {
      alert('Failed to block IP: ' + err.message);
    }
  }

  async function deletePolicy(policyId: string) {
    if (!confirm('Are you sure you want to delete this policy?')) return;

    try {
      const res = await fetch(`/api/waf?policyId=${policyId}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed to delete policy');
      policies = policies.filter(p => p.id !== policyId);
    } catch (err: any) {
      alert('Failed to delete policy: ' + err.message);
    }
  }

  async function exportPolicy(policy: WAFPolicy) {
    try {
      const res = await fetch(`/api/waf/${policy.id}?path=export`);
      if (!res.ok) throw new Error('Failed to export policy');
      
      const data = await res.json();
      const blob = new Blob([data.content], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${policy.name.replace(/\s+/g, '_')}_policy.json`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err: any) {
      alert('Failed to export policy: ' + err.message);
    }
  }

  function formatTimeAgo(timestamp: string): string {
    const date = new Date(timestamp);
    const now = new Date();
    const diff = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (diff < 60) return 'Just now';
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    return `${Math.floor(diff / 86400)}d ago`;
  }

  function getSeverityColor(severity: string) {
    switch (severity) {
      case 'critical': return 'text-red-600 bg-red-100 dark:bg-red-900 dark:text-red-200';
      case 'high': return 'text-orange-600 bg-orange-100 dark:bg-orange-900 dark:text-orange-200';
      case 'medium': return 'text-yellow-600 bg-yellow-100 dark:bg-yellow-900 dark:text-yellow-200';
      case 'low': return 'text-green-600 bg-green-100 dark:bg-green-900 dark:text-green-200';
      default: return 'text-gray-600 bg-gray-100 dark:bg-gray-900 dark:text-gray-200';
    }
  }

  function getActionColor(action: string) {
    switch (action) {
      case 'blocked': return 'text-red-600 bg-red-100 dark:bg-red-900 dark:text-red-200';
      case 'alerted': return 'text-orange-600 bg-orange-100 dark:bg-orange-900 dark:text-orange-200';
      case 'learned': return 'text-blue-600 bg-blue-100 dark:bg-blue-900 dark:text-blue-200';
      default: return 'text-gray-600 bg-gray-100 dark:bg-gray-900 dark:text-gray-200';
    }
  }

  function getTemplateBadge(template: string) {
    const colors: Record<string, string> = {
      'rapid_deployment': 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200',
      'fundamental': 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
      'enhanced': 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
      'comprehensive': 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200',
      'custom': 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200'
    };
    return colors[template] || colors.custom;
  }

  onMount(() => {
    fetchData();

    // Subscribe to real-time security events
    const ws = getWebSocketManager();
    if (ws) {
      wsUnsubscribe = ws.subscribe('security', (message) => {
        if (message.type === 'security_event') {
          events = [message.data, ...events.slice(0, 49)];
        }
      });
    }

    // Refresh data every 30 seconds
    const interval = setInterval(fetchData, 30000);

    return () => {
      clearInterval(interval);
      if (wsUnsubscribe) wsUnsubscribe();
    };
  });

  onDestroy(() => {
    if (wsUnsubscribe) wsUnsubscribe();
  });
</script>

<svelte:head>
  <title>Security Automation - F5 Control Center</title>
</svelte:head>

<div class="space-y-6">
  <!-- Header -->
  <div class="bg-gradient-to-r from-red-600 to-orange-600 rounded-xl p-6 text-white">
    <div class="flex items-center justify-between">
      <div>
        <div class="flex items-center space-x-3 mb-2">
          <h1 class="text-3xl font-bold">Security Automation</h1>
          <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
            Active
          </span>
        </div>
        <p class="text-red-100">Advanced WAF Policy Management & Threat Protection</p>
      </div>
      <div class="flex items-center space-x-6">
        <div class="text-center">
          <div class="text-2xl font-bold">{stats?.totalRequests.toLocaleString() || '0'}</div>
          <div class="text-sm text-red-100">Total Requests</div>
        </div>
        <div class="text-center">
          <div class="text-2xl font-bold">{stats?.blockedRequests.toLocaleString() || '0'}</div>
          <div class="text-sm text-red-100">Blocked</div>
        </div>
        <div class="text-center">
          <div class="text-2xl font-bold">
            {stats ? Math.round((stats.blockedRequests / stats.totalRequests) * 100) : 0}%
          </div>
          <div class="text-sm text-red-100">Block Rate</div>
        </div>
      </div>
    </div>
  </div>

  <!-- Tabs -->
  <div class="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
    <div class="border-b border-gray-200 dark:border-gray-700">
      <nav class="flex -mb-px">
        {#each ['overview', 'policies', 'events', 'geo-blocking'] as const as tab}
          <button
            class="py-4 px-6 border-b-2 font-medium text-sm transition-colors {activeTab === tab 
              ? 'border-red-500 text-red-600 dark:text-red-400' 
              : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'}"
            on:click={() => activeTab = tab}
          >
            {tab.charAt(0).toUpperCase() + tab.slice(1).replace('-', ' ')}
          </button>
        {/each}
      </nav>
    </div>

    <!-- Tab Content -->
    <div class="p-6">
      {#if loading}
        <div class="flex justify-center py-12">
          <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600"></div>
        </div>
      {:else if error}
        <div class="bg-red-50 dark:bg-red-900 border border-red-200 dark:border-red-700 rounded-lg p-4">
          <div class="flex items-center">
            <AlertTriangle class="h-5 w-5 text-red-600 dark:text-red-400 mr-2" />
            <span class="text-red-800 dark:text-red-200">{error}</span>
          </div>
          <button 
            class="mt-2 text-red-600 dark:text-red-400 hover:underline"
            on:click={fetchData}
          >
            Retry
          </button>
        </div>
      {:else}
        <!-- Overview Tab -->
        {#if activeTab === 'overview'}
          <div class="space-y-6">
            <!-- Quick Stats -->
            <div class="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div class="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                <div class="flex items-center justify-between">
                  <div>
                    <p class="text-sm text-gray-600 dark:text-gray-400">Active Policies</p>
                    <p class="text-2xl font-bold text-gray-900 dark:text-white">{policies.length}</p>
                  </div>
                  <Shield class="h-8 w-8 text-red-500" />
                </div>
              </div>
              <div class="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                <div class="flex items-center justify-between">
                  <div>
                    <p class="text-sm text-gray-600 dark:text-gray-400">Recent Events</p>
                    <p class="text-2xl font-bold text-gray-900 dark:text-white">{events.length}</p>
                  </div>
                  <Activity class="h-8 w-8 text-blue-500" />
                </div>
              </div>
              <div class="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                <div class="flex items-center justify-between">
                  <div>
                    <p class="text-sm text-gray-600 dark:text-gray-400">Top Violation</p>
                    <p class="text-sm font-bold text-gray-900 dark:text-white">
                      {stats?.topViolations[0]?.name || 'None'}
                    </p>
                  </div>
                  <AlertTriangle class="h-8 w-8 text-orange-500" />
                </div>
              </div>
              <div class="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                <div class="flex items-center justify-between">
                  <div>
                    <p class="text-sm text-gray-600 dark:text-gray-400">Top Attacker</p>
                    <p class="text-sm font-bold text-gray-900 dark:text-white">
                      {stats?.topAttackingIPs[0]?.ip || 'None'}
                    </p>
                  </div>
                  <Ban class="h-8 w-8 text-red-500" />
                </div>
              </div>
            </div>

            <!-- Top Violations Chart -->
            <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div class="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                <h3 class="text-lg font-semibold mb-4 text-gray-900 dark:text-white">Top Violations</h3>
                <div class="space-y-3">
                  {#each (stats?.topViolations || []).slice(0, 5) as violation}
                    <div class="flex items-center justify-between">
                      <span class="text-sm text-gray-700 dark:text-gray-300">{violation.name}</span>
                      <div class="flex items-center space-x-2">
                        <span class="text-sm font-medium text-gray-900 dark:text-white">{violation.count}</span>
                        <div class="w-24 bg-gray-200 dark:bg-gray-600 rounded-full h-2">
                          <div 
                            class="bg-red-600 h-2 rounded-full"
                            style="width: {Math.min((violation.count / (stats?.topViolations[0]?.count || 1)) * 100, 100)}%"
                          ></div>
                        </div>
                      </div>
                    </div>
                  {/each}
                </div>
              </div>

              <div class="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                <h3 class="text-lg font-semibold mb-4 text-gray-900 dark:text-white">Top Attacking IPs</h3>
                <div class="space-y-3">
                  {#each (stats?.topAttackingIPs || []).slice(0, 5) as attacker}
                    <div class="flex items-center justify-between">
                      <span class="text-sm text-gray-700 dark:text-gray-300 font-mono">{attacker.ip}</span>
                      <div class="flex items-center space-x-2">
                        <span class="text-sm font-medium text-gray-900 dark:text-white">{attacker.count}</span>
                        <button 
                          class="text-red-600 hover:text-red-800 dark:text-red-400"
                          on:click={() => { ipToBlock = attacker.ip; showIPBlockModal = true; }}
                        >
                          <Ban class="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  {/each}
                </div>
              </div>
            </div>

            <!-- Recent Events -->
            <div>
              <h3 class="text-lg font-semibold mb-4 text-gray-900 dark:text-white">Recent Security Events</h3>
              <div class="space-y-2">
                {#each events.slice(0, 5) as event}
                  <div class="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                    <div class="flex items-center space-x-3">
                      {#if event.severity === 'critical'}
                        <XCircle class="h-5 w-5 text-red-500" />
                      {:else if event.severity === 'high'}
                        <AlertTriangle class="h-5 w-5 text-orange-500" />
                      {:else}
                        <Shield class="h-5 w-5 text-blue-500" />
                      {/if}
                      <div>
                        <div class="text-sm font-medium text-gray-900 dark:text-white">
                          {event.violation} from {event.clientIp}
                        </div>
                        <div class="text-xs text-gray-500 dark:text-gray-400">
                          {event.method} {event.uri} • {formatTimeAgo(event.timestamp)}
                        </div>
                      </div>
                    </div>
                    <div class="flex items-center space-x-2">
                      <span class="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium {getActionColor(event.action)}">
                        {event.action}
                      </span>
                      <span class="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium {getSeverityColor(event.severity)}">
                        {event.severity}
                      </span>
                    </div>
                  </div>
                {/each}
              </div>
            </div>
          </div>
        {/if}

        <!-- Policies Tab -->
        {#if activeTab === 'policies'}
          <div class="space-y-4">
            <div class="flex justify-between items-center">
              <h3 class="text-lg font-semibold text-gray-900 dark:text-white">WAF Policies</h3>
              <button 
                class="inline-flex items-center px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                on:click={() => showCreateModal = true}
              >
                <Plus class="h-4 w-4 mr-2" />
                Create Policy
              </button>
            </div>

            <div class="overflow-x-auto">
              <table class="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                <thead class="bg-gray-50 dark:bg-gray-700">
                  <tr>
                    <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Name</th>
                    <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Template</th>
                    <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Mode</th>
                    <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Status</th>
                    <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Virtual Servers</th>
                    <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Actions</th>
                  </tr>
                </thead>
                <tbody class="divide-y divide-gray-200 dark:divide-gray-700">
                  {#each policies as policy}
                    <tr class="hover:bg-gray-50 dark:hover:bg-gray-700">
                      <td class="px-6 py-4">
                        <div class="text-sm font-medium text-gray-900 dark:text-white">{policy.name}</div>
                        <div class="text-xs text-gray-500 dark:text-gray-400">{policy.description || 'No description'}</div>
                      </td>
                      <td class="px-6 py-4">
                        <span class="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium {getTemplateBadge(policy.template)}">
                          {policy.template}
                        </span>
                      </td>
                      <td class="px-6 py-4">
                        <span class="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium {policy.enforcementMode === 'blocking' ? 'bg-red-100 text-red-800' : 'bg-yellow-100 text-yellow-800'}">
                          {policy.enforcementMode}
                        </span>
                      </td>
                      <td class="px-6 py-4">
                        <span class="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium {policy.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}">
                          {policy.status}
                        </span>
                      </td>
                      <td class="px-6 py-4 text-sm text-gray-900 dark:text-white">
                        {policy.virtualServers.length}
                      </td>
                      <td class="px-6 py-4">
                        <div class="flex items-center space-x-2">
                          <button 
                            class="text-blue-600 hover:text-blue-900 dark:text-blue-400"
                            on:click={() => selectedPolicy = policy}
                            title="View Details"
                          >
                            <Eye class="h-4 w-4" />
                          </button>
                          <button 
                            class="text-green-600 hover:text-green-900 dark:text-green-400"
                            on:click={() => exportPolicy(policy)}
                            title="Export Policy"
                          >
                            <Download class="h-4 w-4" />
                          </button>
                          <button 
                            class="text-red-600 hover:text-red-900 dark:text-red-400"
                            on:click={() => deletePolicy(policy.id)}
                            title="Delete Policy"
                          >
                            <XCircle class="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  {/each}
                </tbody>
              </table>
            </div>
          </div>
        {/if}

        <!-- Events Tab -->
        {#if activeTab === 'events'}
          <div class="space-y-4">
            <div class="flex justify-between items-center">
              <h3 class="text-lg font-semibold text-gray-900 dark:text-white">Security Events</h3>
              <div class="flex items-center space-x-2">
                <select 
                  bind:value={timeRange}
                  on:change={fetchData}
                  class="rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white text-sm"
                >
                  <option value="1h">Last Hour</option>
                  <option value="24h">Last 24 Hours</option>
                  <option value="7d">Last 7 Days</option>
                  <option value="30d">Last 30 Days</option>
                </select>
                <button 
                  class="inline-flex items-center px-3 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
                  on:click={() => showIPBlockModal = true}
                >
                  <Ban class="h-4 w-4 mr-1" />
                  Block IP
                </button>
              </div>
            </div>

            <div class="space-y-2">
              {#each events as event}
                <div class="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                  <div class="flex items-center space-x-3">
                    {#if event.severity === 'critical'}
                      <XCircle class="h-5 w-5 text-red-500" />
                    {:else if event.severity === 'high'}
                      <AlertTriangle class="h-5 w-5 text-orange-500" />
                    {:else}
                      <Shield class="h-5 w-5 text-blue-500" />
                    {/if}
                    <div>
                      <div class="text-sm font-medium text-gray-900 dark:text-white">
                        {event.violation}
                      </div>
                      <div class="text-xs text-gray-500 dark:text-gray-400">
                        {event.clientIp} • {event.method} {event.uri} • {formatTimeAgo(event.timestamp)}
                      </div>
                    </div>
                  </div>
                  <div class="flex items-center space-x-2">
                    <span class="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium {getActionColor(event.action)}">
                      {event.action}
                    </span>
                    <span class="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium {getSeverityColor(event.severity)}">
                      {event.severity}
                    </span>
                  </div>
                </div>
              {/each}
            </div>
          </div>
        {/if}

        <!-- Geo-blocking Tab -->
        {#if activeTab === 'geo-blocking'}
          <div class="text-center py-12">
            <Globe class="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 class="text-lg font-medium text-gray-900 dark:text-white mb-2">Geo-blocking Management</h3>
            <p class="text-gray-500 dark:text-gray-400 mb-4">Configure country-based access restrictions</p>
            <button class="inline-flex items-center px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700">
              <Settings class="h-4 w-4 mr-2" />
              Configure Rules
            </button>
          </div>
        {/if}
      {/if}
    </div>
  </div>
</div>

<!-- Create Policy Modal -->
{#if showCreateModal}
  <div class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
    <div class="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-lg">
      <h2 class="text-xl font-bold mb-4 text-gray-900 dark:text-white">Create WAF Policy</h2>
      <div class="space-y-4">
        <div>
          <label for="policy-name" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Name</label>
          <input 
            id="policy-name"
            type="text" 
            bind:value={newPolicy.name}
            class="w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
            placeholder="e.g., Production API Policy"
          />
        </div>
        <div>
          <label for="policy-description" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Description</label>
          <textarea 
            id="policy-description"
            bind:value={newPolicy.description}
            class="w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
            rows="2"
            placeholder="Policy description..."
          ></textarea>
        </div>
        <div>
          <label for="policy-template" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Template</label>
          <select 
            id="policy-template"
            bind:value={newPolicy.template}
            class="w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
          >
            <option value="rapid_deployment">Rapid Deployment</option>
            <option value="fundamental">Fundamental</option>
            <option value="enhanced">Enhanced</option>
            <option value="comprehensive">Comprehensive</option>
            <option value="custom">Custom</option>
          </select>
        </div>
        <div>
          <label for="enforcement-mode" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Enforcement Mode</label>
          <select 
            id="enforcement-mode"
            bind:value={newPolicy.enforcementMode}
            class="w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
          >
            <option value="transparent">Transparent (Monitor Only)</option>
            <option value="blocking">Blocking</option>
          </select>
        </div>
      </div>
      <div class="flex justify-end space-x-3 mt-6">
        <button 
          class="px-4 py-2 text-gray-700 dark:text-gray-300 hover:text-gray-900"
          on:click={() => showCreateModal = false}
        >
          Cancel
        </button>
        <button 
          class="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
          on:click={createPolicy}
          disabled={!newPolicy.name}
        >
          Create Policy
        </button>
      </div>
    </div>
  </div>
{/if}

<!-- Block IP Modal -->
{#if showIPBlockModal}
  <div class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
    <div class="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-md">
      <h2 class="text-xl font-bold mb-4 text-gray-900 dark:text-white">Block IP Address</h2>
      <div class="space-y-4">
        <div>
          <label for="ip-address" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">IP Address</label>
          <input 
            id="ip-address"
            type="text" 
            bind:value={ipToBlock}
            class="w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white font-mono"
            placeholder="e.g., 192.168.1.100"
          />
        </div>
        <div>
          <label for="block-reason" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Reason</label>
          <textarea 
            id="block-reason"
            bind:value={blockReason}
            class="w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
            rows="2"
            placeholder="Reason for blocking..."
          ></textarea>
        </div>
      </div>
      <div class="flex justify-end space-x-3 mt-6">
        <button 
          class="px-4 py-2 text-gray-700 dark:text-gray-300 hover:text-gray-900"
          on:click={() => showIPBlockModal = false}
        >
          Cancel
        </button>
        <button 
          class="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
          on:click={blockIP}
          disabled={!ipToBlock}
        >
          Block IP
        </button>
      </div>
    </div>
  </div>
{/if}
