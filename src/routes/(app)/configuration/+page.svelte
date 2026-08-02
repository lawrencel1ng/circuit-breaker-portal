<script lang="ts">
  import { onMount } from 'svelte';
  import { 
    GitCompare, 
    AlertTriangle, 
    CheckCircle, 
    RefreshCw, 
    History,
    Settings,
    Download,
    Eye,
    RotateCcw,
    Shield,
    FileText,
    Clock
  } from 'lucide-svelte';
  import { notificationStore } from '$lib/stores/notificationStore';

  // Types
  interface DriftDetection {
    id: string;
    name: string;
    baselineConfig: string;
    currentConfig: string;
    driftDetected: boolean;
    severity: 'critical' | 'high' | 'medium' | 'low';
    status: 'active' | 'resolved' | 'ignored';
    detectedAt: string;
    lastChecked: string;
    driftItems: DriftItem[];
    autoRemediation: boolean;
  }

  interface DriftItem {
    id: string;
    path: string;
    expected: any;
    actual: any;
    type: 'value_change' | 'missing' | 'added' | 'type_change';
    severity: 'critical' | 'high' | 'medium' | 'low';
    remediationAction: 'auto' | 'manual' | 'alert';
  }

  interface BaselineConfig {
    id: string;
    name: string;
    description: string;
    createdAt: string;
    createdBy: string;
    gitCommit?: string;
    configSnapshot: string;
  }

  // State
  let driftDetections: DriftDetection[] = [];
  let baselines: BaselineConfig[] = [];
  let selectedDetection: DriftDetection | null = null;
  let loading = true;
  let activeTab: 'detections' | 'baselines' | 'settings' = 'detections';
  let filterSeverity: string = 'all';
  let filterStatus: string = 'all';
  let showDetailModal = false;

  // Settings
  let settings = {
    enabled: true,
    checkInterval: 'hourly',
    autoRemediation: false,
    notifyOnDrift: true,
    gitIntegration: false,
    gitRepo: ''
  };

  onMount(async () => {
    await loadData();
  });

  async function loadData() {
    loading = true;
    try {
      // In production, these would be real API calls
      // const driftRes = await fetch('/api/drift?type=detections');
      // driftDetections = await driftRes.json();
      
      // Mock data for demonstration
      driftDetections = [
        {
          id: 'drift-1',
          name: 'Production Virtual Server Config',
          baselineConfig: 'baseline-prod-v1.2',
          currentConfig: 'current-prod',
          driftDetected: true,
          severity: 'high',
          status: 'active',
          detectedAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
          lastChecked: new Date().toISOString(),
          autoRemediation: false,
          driftItems: [
            {
              id: 'item-1',
              path: 'ltm/virtual/vs_app_1/destination',
              expected: '10.1.10.100:443',
              actual: '10.1.10.105:443',
              type: 'value_change',
              severity: 'high',
              remediationAction: 'manual'
            },
            {
              id: 'item-2',
              path: 'ltm/pool/pool_app_1/members',
              expected: '3 members',
              actual: '2 members',
              type: 'missing',
              severity: 'medium',
              remediationAction: 'auto'
            }
          ]
        },
        {
          id: 'drift-2',
          name: 'SSL Profile Configuration',
          baselineConfig: 'baseline-ssl-v1.0',
          currentConfig: 'current-ssl',
          driftDetected: true,
          severity: 'critical',
          status: 'active',
          detectedAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
          lastChecked: new Date().toISOString(),
          autoRemediation: true,
          driftItems: [
            {
              id: 'item-3',
              path: 'ltm/profile/clientssl/clientssl-secure/ciphers',
              expected: 'DEFAULT',
              actual: 'ALL',
              type: 'value_change',
              severity: 'critical',
              remediationAction: 'auto'
            }
          ]
        },
        {
          id: 'drift-3',
          name: 'WAF Policy Rules',
          baselineConfig: 'baseline-waf-v2.1',
          currentConfig: 'current-waf',
          driftDetected: false,
          severity: 'low',
          status: 'resolved',
          detectedAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
          lastChecked: new Date().toISOString(),
          autoRemediation: false,
          driftItems: []
        }
      ];

      baselines = [
        {
          id: 'baseline-prod-v1.2',
          name: 'Production Baseline v1.2',
          description: 'Production configuration snapshot after Feb maintenance',
          createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
          createdBy: 'admin',
          gitCommit: 'abc123def456',
          configSnapshot: 'ucs-backup-2026-01-15'
        },
        {
          id: 'baseline-ssl-v1.0',
          name: 'SSL Baseline v1.0',
          description: 'Secure SSL profile configurations',
          createdAt: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString(),
          createdBy: 'security-admin',
          gitCommit: 'xyz789abc012',
          configSnapshot: 'ssl-config-2025-12-20'
        },
        {
          id: 'baseline-waf-v2.1',
          name: 'WAF Policy Baseline v2.1',
          description: 'WAF policy configuration with updated signatures',
          createdAt: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString(),
          createdBy: 'security-admin',
          configSnapshot: 'waf-policy-2026-02-03'
        }
      ];
    } catch (error) {
      notificationStore.add({
        type: 'error',
        title: 'Error',
        message: 'Failed to load drift detection data'
      });
    } finally {
      loading = false;
    }
  }

  async function runDetection() {
    notificationStore.add({
      type: 'info',
      title: 'Running Drift Detection',
      message: 'Scanning configurations for drift...'
    });
    
    // Simulate API call
    setTimeout(() => {
      notificationStore.add({
        type: 'success',
        title: 'Detection Complete',
        message: 'Drift detection scan completed successfully'
      });
      loadData();
    }, 2000);
  }

  async function remediateDrift(detectionId: string, itemId?: string) {
    notificationStore.add({
      type: 'info',
      title: 'Remediating Drift',
      message: itemId ? 'Applying fix for specific item...' : 'Applying all automatic fixes...'
    });
    
    setTimeout(() => {
      notificationStore.add({
        type: 'success',
        title: 'Remediation Complete',
        message: 'Drift has been remediated'
      });
      loadData();
    }, 1500);
  }

  async function ignoreDrift(detectionId: string) {
    notificationStore.add({
      type: 'info',
      title: 'Ignoring Drift',
      message: 'Marking drift as ignored...'
    });
    loadData();
  }

  async function createBaseline() {
    notificationStore.add({
      type: 'info',
      title: 'Creating Baseline',
      message: 'Capturing current configuration...'
    });
    
    setTimeout(() => {
      notificationStore.add({
        type: 'success',
        title: 'Baseline Created',
        message: 'New baseline configuration has been saved'
      });
      loadData();
    }, 2000);
  }

  function showDetails(detection: DriftDetection) {
    selectedDetection = detection;
    showDetailModal = true;
  }

  function getSeverityColor(severity: string): string {
    switch (severity) {
      case 'critical': return 'text-red-600 bg-red-100 dark:bg-red-900 dark:text-red-200';
      case 'high': return 'text-orange-600 bg-orange-100 dark:bg-orange-900 dark:text-orange-200';
      case 'medium': return 'text-yellow-600 bg-yellow-100 dark:bg-yellow-900 dark:text-yellow-200';
      case 'low': return 'text-blue-600 bg-blue-100 dark:bg-blue-900 dark:text-blue-200';
      default: return 'text-gray-600 bg-gray-100 dark:bg-gray-900 dark:text-gray-200';
    }
  }

  function getStatusColor(status: string): string {
    switch (status) {
      case 'active': return 'text-red-600 bg-red-50 border-red-200 dark:bg-red-900/20 dark:border-red-800';
      case 'resolved': return 'text-green-600 bg-green-50 border-green-200 dark:bg-green-900/20 dark:border-green-800';
      case 'ignored': return 'text-gray-600 bg-gray-50 border-gray-200 dark:bg-gray-700 dark:border-gray-600';
      default: return '';
    }
  }

  function getDriftTypeLabel(type: string): string {
    switch (type) {
      case 'value_change': return 'Value Changed';
      case 'missing': return 'Missing';
      case 'added': return 'Added';
      case 'type_change': return 'Type Changed';
      default: return type;
    }
  }

  $: filteredDetections = driftDetections.filter(d => {
    if (filterSeverity !== 'all' && d.severity !== filterSeverity) return false;
    if (filterStatus !== 'all' && d.status !== filterStatus) return false;
    return true;
  });

  $: activeDrifts = driftDetections.filter(d => d.status === 'active' && d.driftDetected).length;
  $: criticalDrifts = driftDetections.filter(d => d.severity === 'critical' && d.status === 'active').length;
</script>

<svelte:head>
  <title>Configuration Drift Detection - F5 Control Center</title>
</svelte:head>

<div class="space-y-6">
  <!-- Header -->
  <div class="bg-gradient-to-r from-purple-600 to-indigo-600 rounded-xl p-6 text-white">
    <div class="flex items-center justify-between">
      <div>
        <h1 class="text-3xl font-bold">Configuration Drift Detection</h1>
        <p class="text-purple-100 mt-2">Detect and remediate unauthorized configuration changes</p>
      </div>
      <div class="flex items-center space-x-4">
        <div class="text-center">
          <div class="text-2xl font-bold">{activeDrifts}</div>
          <div class="text-sm text-purple-100">Active Drifts</div>
        </div>
        <div class="text-center">
          <div class="text-2xl font-bold {criticalDrifts > 0 ? 'text-red-300' : ''}">{criticalDrifts}</div>
          <div class="text-sm text-purple-100">Critical</div>
        </div>
      </div>
    </div>
  </div>

  <!-- Actions Bar -->
  <div class="flex flex-wrap items-center justify-between gap-4">
    <div class="flex items-center space-x-2">
      <button
        on:click={runDetection}
        class="btn-primary flex items-center space-x-2"
      >
        <RefreshCw class="h-4 w-4" />
        <span>Run Detection</span>
      </button>
      <button
        on:click={createBaseline}
        class="btn-secondary flex items-center space-x-2"
      >
        <Download class="h-4 w-4" />
        <span>Create Baseline</span>
      </button>
    </div>
    
    <div class="flex items-center space-x-2">
      <select
        bind:value={filterSeverity}
        class="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
      >
        <option value="all">All Severities</option>
        <option value="critical">Critical</option>
        <option value="high">High</option>
        <option value="medium">Medium</option>
        <option value="low">Low</option>
      </select>
      <select
        bind:value={filterStatus}
        class="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
      >
        <option value="all">All Statuses</option>
        <option value="active">Active</option>
        <option value="resolved">Resolved</option>
        <option value="ignored">Ignored</option>
      </select>
    </div>
  </div>

  <!-- Tabs -->
  <div class="border-b border-gray-200 dark:border-gray-700">
    <nav class="flex space-x-8">
      <button
        class="py-4 px-1 border-b-2 font-medium text-sm {activeTab === 'detections' ? 'border-purple-500 text-purple-600 dark:text-purple-400' : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400'}"
        on:click={() => activeTab = 'detections'}
      >
        <div class="flex items-center space-x-2">
          <GitCompare class="h-4 w-4" />
          <span>Drift Detections</span>
          {#if activeDrifts > 0}
            <span class="bg-red-500 text-white text-xs rounded-full px-2 py-0.5">{activeDrifts}</span>
          {/if}
        </div>
      </button>
      <button
        class="py-4 px-1 border-b-2 font-medium text-sm {activeTab === 'baselines' ? 'border-purple-500 text-purple-600 dark:text-purple-400' : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400'}"
        on:click={() => activeTab = 'baselines'}
      >
        <div class="flex items-center space-x-2">
          <History class="h-4 w-4" />
          <span>Baselines</span>
        </div>
      </button>
      <button
        class="py-4 px-1 border-b-2 font-medium text-sm {activeTab === 'settings' ? 'border-purple-500 text-purple-600 dark:text-purple-400' : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400'}"
        on:click={() => activeTab = 'settings'}
      >
        <div class="flex items-center space-x-2">
          <Settings class="h-4 w-4" />
          <span>Settings</span>
        </div>
      </button>
    </nav>
  </div>

  <!-- Content -->
  {#if loading}
    <div class="flex items-center justify-center py-12">
      <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
    </div>
  {:else if activeTab === 'detections'}
    <div class="space-y-4">
      {#each filteredDetections as detection}
        <div class="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
          <div class="p-6">
            <div class="flex items-start justify-between">
              <div class="flex-1">
                <div class="flex items-center space-x-3 mb-2">
                  <h3 class="text-lg font-semibold text-gray-900 dark:text-white">{detection.name}</h3>
                  <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium {getSeverityColor(detection.severity)}">
                    {detection.severity}
                  </span>
                  <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border {getStatusColor(detection.status)}">
                    {detection.status}
                  </span>
                </div>
                <p class="text-sm text-gray-600 dark:text-gray-400 mb-4">
                  Baseline: <code class="bg-gray-100 dark:bg-gray-700 px-1 rounded">{detection.baselineConfig}</code>
                </p>
                <div class="flex items-center space-x-4 text-sm text-gray-500 dark:text-gray-400">
                  <span class="flex items-center">
                    <Clock class="h-4 w-4 mr-1" />
                    Detected: {new Date(detection.detectedAt).toLocaleString()}
                  </span>
                  <span class="flex items-center">
                    <AlertTriangle class="h-4 w-4 mr-1" />
                    {detection.driftItems.length} drift items
                  </span>
                  {#if detection.autoRemediation}
                    <span class="flex items-center text-green-600 dark:text-green-400">
                      <CheckCircle class="h-4 w-4 mr-1" />
                      Auto-remediation enabled
                    </span>
                  {/if}
                </div>
              </div>
              <div class="flex items-center space-x-2">
                <button
                  on:click={() => showDetails(detection)}
                  class="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
                  title="View Details"
                >
                  <Eye class="h-5 w-5" />
                </button>
                {#if detection.status === 'active'}
                  <button
                    on:click={() => remediateDrift(detection.id)}
                    class="p-2 text-green-600 hover:text-green-800 dark:hover:text-green-400 rounded-lg hover:bg-green-50 dark:hover:bg-green-900"
                    title="Remediate"
                  >
                    <RotateCcw class="h-5 w-5" />
                  </button>
                  <button
                    on:click={() => ignoreDrift(detection.id)}
                    class="p-2 text-gray-600 hover:text-gray-800 dark:hover:text-gray-400 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
                    title="Ignore"
                  >
                    <Shield class="h-5 w-5" />
                  </button>
                {/if}
              </div>
            </div>
          </div>
        </div>
      {:else}
        <div class="text-center py-12 bg-gray-50 dark:bg-gray-800 rounded-lg">
          <CheckCircle class="h-12 w-12 text-green-500 mx-auto mb-4" />
          <h3 class="text-lg font-medium text-gray-900 dark:text-white">No Drift Detected</h3>
          <p class="text-gray-500 dark:text-gray-400">All configurations are in sync with baselines</p>
        </div>
      {/each}
    </div>
  {:else if activeTab === 'baselines'}
    <div class="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
      <div class="p-6">
        <div class="space-y-4">
          {#each baselines as baseline}
            <div class="flex items-center justify-between p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
              <div>
                <div class="flex items-center space-x-2">
                  <FileText class="h-5 w-5 text-gray-400" />
                  <h3 class="font-medium text-gray-900 dark:text-white">{baseline.name}</h3>
                </div>
                <p class="text-sm text-gray-600 dark:text-gray-400 mt-1">{baseline.description}</p>
                <div class="flex items-center space-x-4 mt-2 text-sm text-gray-500 dark:text-gray-400">
                  <span>Created: {new Date(baseline.createdAt).toLocaleDateString()}</span>
                  <span>By: {baseline.createdBy}</span>
                  {#if baseline.gitCommit}
                    <span class="font-mono text-xs bg-gray-100 dark:bg-gray-700 px-1 rounded">{baseline.gitCommit}</span>
                  {/if}
                </div>
              </div>
              <div class="flex items-center space-x-2">
                <button class="text-blue-600 hover:text-blue-800 dark:text-blue-400 text-sm font-medium">
                  Compare
                </button>
                <button class="text-blue-600 hover:text-blue-800 dark:text-blue-400 text-sm font-medium">
                  Restore
                </button>
              </div>
            </div>
          {/each}
        </div>
      </div>
    </div>
  {:else if activeTab === 'settings'}
    <div class="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
      <div class="p-6 space-y-6">
        <div>
          <h3 class="text-lg font-medium text-gray-900 dark:text-white mb-4">Detection Settings</h3>
          <div class="space-y-4">
            <div class="flex items-center justify-between">
              <div>
                <div class="font-medium text-gray-900 dark:text-white">Enable Drift Detection</div>
                <div class="text-sm text-gray-500 dark:text-gray-400">Automatically scan for configuration drift</div>
              </div>
              <label class="relative inline-flex items-center cursor-pointer">
                <input type="checkbox" bind:checked={settings.enabled} class="sr-only peer">
                <div class="w-11 h-6 bg-gray-200 peer-focus:ring-4 peer-focus:ring-purple-300 dark:peer-focus:ring-purple-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-purple-600"></div>
              </label>
            </div>
            
            <div class="flex items-center justify-between">
              <div>
                <div class="font-medium text-gray-900 dark:text-white">Check Interval</div>
                <div class="text-sm text-gray-500 dark:text-gray-400">How often to check for drift</div>
              </div>
              <select bind:value={settings.checkInterval} class="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white">
                <option value="realtime">Real-time</option>
                <option value="hourly">Hourly</option>
                <option value="daily">Daily</option>
                <option value="weekly">Weekly</option>
              </select>
            </div>
            
            <div class="flex items-center justify-between">
              <div>
                <div class="font-medium text-gray-900 dark:text-white">Auto-remediation</div>
                <div class="text-sm text-gray-500 dark:text-gray-400">Automatically fix non-critical drift</div>
              </div>
              <label class="relative inline-flex items-center cursor-pointer">
                <input type="checkbox" bind:checked={settings.autoRemediation} class="sr-only peer">
                <div class="w-11 h-6 bg-gray-200 peer-focus:ring-4 peer-focus:ring-purple-300 dark:peer-focus:ring-purple-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-purple-600"></div>
              </label>
            </div>
          </div>
        </div>
        
        <hr class="border-gray-200 dark:border-gray-700">
        
        <div>
          <h3 class="text-lg font-medium text-gray-900 dark:text-white mb-4">Notifications</h3>
          <div class="flex items-center justify-between">
            <div>
              <div class="font-medium text-gray-900 dark:text-white">Notify on Drift</div>
              <div class="text-sm text-gray-500 dark:text-gray-400">Send notifications when drift is detected</div>
            </div>
            <label class="relative inline-flex items-center cursor-pointer">
              <input type="checkbox" bind:checked={settings.notifyOnDrift} class="sr-only peer">
              <div class="w-11 h-6 bg-gray-200 peer-focus:ring-4 peer-focus:ring-purple-300 dark:peer-focus:ring-purple-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-purple-600"></div>
            </label>
          </div>
        </div>
        
        <hr class="border-gray-200 dark:border-gray-700">
        
        <div>
          <h3 class="text-lg font-medium text-gray-900 dark:text-white mb-4">Git Integration</h3>
          <div class="space-y-4">
            <div class="flex items-center justify-between">
              <div>
                <div class="font-medium text-gray-900 dark:text-white">Enable Git Integration</div>
                <div class="text-sm text-gray-500 dark:text-gray-400">Store baselines in Git repository</div>
              </div>
              <label class="relative inline-flex items-center cursor-pointer">
                <input type="checkbox" bind:checked={settings.gitIntegration} class="sr-only peer">
                <div class="w-11 h-6 bg-gray-200 peer-focus:ring-4 peer-focus:ring-purple-300 dark:peer-focus:ring-purple-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-purple-600"></div>
              </label>
            </div>
            
            {#if settings.gitIntegration}
              <div>
                <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Git Repository URL</label>
                <input
                  type="text"
                  bind:value={settings.gitRepo}
                  placeholder="https://github.com/org/f5-configs.git"
                  class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                />
              </div>
            {/if}
          </div>
        </div>
      </div>
    </div>
  {/if}
</div>

<!-- Detail Modal -->
{#if showDetailModal && selectedDetection}
  <div class="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
    <div class="bg-white dark:bg-gray-800 rounded-xl shadow-xl max-w-4xl w-full max-h-[90vh] overflow-auto">
      <div class="p-6 border-b border-gray-200 dark:border-gray-700">
        <div class="flex items-center justify-between">
          <div class="flex items-center space-x-3">
            <h2 class="text-xl font-semibold text-gray-900 dark:text-white">{selectedDetection.name}</h2>
            <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium {getSeverityColor(selectedDetection.severity)}">
              {selectedDetection.severity}
            </span>
          </div>
          <button
            on:click={() => showDetailModal = false}
            class="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
          >
            <span class="sr-only">Close</span>
            <svg class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>
      
      <div class="p-6">
        <div class="space-y-4">
          {#each selectedDetection.driftItems as item}
            <div class="p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
              <div class="flex items-center justify-between mb-2">
                <code class="text-sm bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded">{item.path}</code>
                <div class="flex items-center space-x-2">
                  <span class="inline-flex items-center px-2 py-1 rounded text-xs font-medium {getSeverityColor(item.severity)}">
                    {item.severity}
                  </span>
                  <span class="text-xs text-gray-500 dark:text-gray-400">{getDriftTypeLabel(item.type)}</span>
                </div>
              </div>
              
              <div class="grid grid-cols-2 gap-4 mt-3">
                <div>
                  <div class="text-xs text-gray-500 dark:text-gray-400 mb-1">Expected</div>
                  <code class="block text-sm bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300 px-2 py-1 rounded">{JSON.stringify(item.expected)}</code>
                </div>
                <div>
                  <div class="text-xs text-gray-500 dark:text-gray-400 mb-1">Actual</div>
                  <code class="block text-sm bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300 px-2 py-1 rounded">{JSON.stringify(item.actual)}</code>
                </div>
              </div>
              
              <div class="flex items-center justify-end mt-3 space-x-2">
                {#if item.remediationAction === 'auto'}
                  <button
                    on:click={() => selectedDetection && remediateDrift(selectedDetection.id, item.id)}
                    class="text-sm text-green-600 hover:text-green-800 dark:text-green-400 font-medium"
                  >
                    Auto-fix
                  </button>
                {:else}
                  <span class="text-sm text-gray-500">Manual fix required</span>
                {/if}
              </div>
            </div>
          {/each}
        </div>
      </div>
      
      <div class="p-6 border-t border-gray-200 dark:border-gray-700 flex justify-end space-x-3">
        <button
          on:click={() => showDetailModal = false}
          class="btn-secondary"
        >
          Close
        </button>
        {#if selectedDetection && selectedDetection.status === 'active'}
          <button
            on:click={() => { if (selectedDetection) remediateDrift(selectedDetection.id); showDetailModal = false; }}
            class="btn-primary"
          >
            Remediate All
          </button>
        {/if}
      </div>
    </div>
  </div>
{/if}
