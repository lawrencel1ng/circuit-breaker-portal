<script lang="ts">
  import { onMount } from 'svelte';
  import { 
    Database, 
    Cloud, 
    Clock, 
    Download, 
    Upload, 
    Play,
    Trash2,
    AlertTriangle,
    CheckCircle,
    RefreshCw,
    Settings,
    History,
    Shield,
    Server,
    Archive,
    FileJson,
    HardDrive
  } from 'lucide-svelte';
  import { notificationStore } from '$lib/stores/notificationStore';

  // Types
  interface Backup {
    id: string;
    name: string;
    type: 'ucs' | 'scf' | 'as3' | 'afm' | 'apm' | 'asm' | 'full' | 'selective';
    status: 'pending' | 'in_progress' | 'completed' | 'failed' | 'cancelled';
    size: number;
    createdAt: string;
    completedAt?: string;
    destination: string;
    encryption: boolean;
    retentionDays: number;
    expiresAt: string;
  }

  interface BackupDestination {
    id: string;
    name: string;
    type: 'local' | 'nfs' | 's3' | 'azure_blob' | 'gcs';
    path: string;
    healthy: boolean;
    lastTested?: string;
    credentialsConfigured: boolean;
  }

  interface BackupSchedule {
    id: string;
    name: string;
    type: 'ucs' | 'scf' | 'as3' | 'full';
    frequency: 'hourly' | 'daily' | 'weekly' | 'monthly';
    time: string;
    retentionDays: number;
    destinations: string[];
    enabled: boolean;
    lastRun?: string;
    nextRun?: string;
  }

  interface RestoreJob {
    id: string;
    backupId: string;
    backupName: string;
    status: 'pending' | 'in_progress' | 'completed' | 'failed';
    startedAt: string;
    completedAt?: string;
    initiatedBy: string;
  }

  interface DRPlan {
    id: string;
    name: string;
    description: string;
    rpo: number; // Recovery Point Objective in minutes
    rto: number; // Recovery Time Objective in minutes
    failoverType: 'active_active' | 'active_passive' | 'manual';
    lastTested?: string;
    testResult?: 'passed' | 'failed';
  }

  // State
  let backups: Backup[] = [];
  let destinations: BackupDestination[] = [];
  let schedules: BackupSchedule[] = [];
  let restores: RestoreJob[] = [];
  let drPlans: DRPlan[] = [];
  let loading = true;
  let activeTab: 'backups' | 'destinations' | 'schedules' | 'restore' | 'dr' = 'backups';
  let showCreateModal = false;
  let showScheduleModal = false;
  let showDRModal = false;

  // Stats
  let stats = {
    totalBackups: 0,
    totalSize: 0,
    successRate: 0,
    lastBackup: ''
  };

  onMount(async () => {
    await loadData();
  });

  async function loadData() {
    loading = true;
    try {
      // Mock data for demonstration
      backups = [
        {
          id: 'backup-1',
          name: 'Daily UCS Backup - Feb 18',
          type: 'ucs',
          status: 'completed',
          size: 1024 * 1024 * 1024 * 2.5, // 2.5 GB
          createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
          completedAt: new Date(Date.now() - 1.9 * 60 * 60 * 1000).toISOString(),
          destination: 's3-primary',
          encryption: true,
          retentionDays: 30,
          expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
        },
        {
          id: 'backup-2',
          name: 'AS3 Declarations Backup',
          type: 'as3',
          status: 'completed',
          size: 1024 * 1024 * 15, // 15 MB
          createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
          completedAt: new Date(Date.now() - 24 * 60 * 60 * 1000 + 5 * 60 * 1000).toISOString(),
          destination: 'local-storage',
          encryption: true,
          retentionDays: 90,
          expiresAt: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString()
        },
        {
          id: 'backup-3',
          name: 'Weekly Full Backup',
          type: 'full',
          status: 'in_progress',
          size: 0,
          createdAt: new Date().toISOString(),
          destination: 's3-primary',
          encryption: true,
          retentionDays: 90,
          expiresAt: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString()
        },
        {
          id: 'backup-4',
          name: 'Pre-Change Backup',
          type: 'ucs',
          status: 'completed',
          size: 1024 * 1024 * 1024 * 2.3,
          createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
          completedAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000 + 10 * 60 * 1000).toISOString(),
          destination: 'nfs-backup',
          encryption: true,
          retentionDays: 60,
          expiresAt: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toISOString()
        }
      ];

      destinations = [
        {
          id: 's3-primary',
          name: 'Primary S3 Bucket',
          type: 's3',
          path: 's3://f5-backups-primary',
          healthy: true,
          lastTested: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
          credentialsConfigured: true
        },
        {
          id: 'local-storage',
          name: 'Local Backup Storage',
          type: 'local',
          path: '/var/backups/f5',
          healthy: true,
          credentialsConfigured: true
        },
        {
          id: 'nfs-backup',
          name: 'NFS Backup Server',
          type: 'nfs',
          path: 'nfs://backup-server:/exports/f5',
          healthy: false,
          lastTested: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
          credentialsConfigured: true
        }
      ];

      schedules = [
        {
          id: 'sched-1',
          name: 'Daily UCS Backup',
          type: 'ucs',
          frequency: 'daily',
          time: '02:00',
          retentionDays: 30,
          destinations: ['s3-primary', 'local-storage'],
          enabled: true,
          lastRun: new Date(Date.now() - 22 * 60 * 60 * 1000).toISOString(),
          nextRun: new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString()
        },
        {
          id: 'sched-2',
          name: 'Weekly Full Backup',
          type: 'full',
          frequency: 'weekly',
          time: '00:00',
          retentionDays: 90,
          destinations: ['s3-primary'],
          enabled: true,
          lastRun: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
          nextRun: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString()
        },
        {
          id: 'sched-3',
          name: 'Hourly AS3 Backup',
          type: 'as3',
          frequency: 'hourly',
          time: '00:00',
          retentionDays: 7,
          destinations: ['local-storage'],
          enabled: false
        }
      ];

      restores = [
        {
          id: 'restore-1',
          backupId: 'backup-4',
          backupName: 'Pre-Change Backup',
          status: 'completed',
          startedAt: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000).toISOString(),
          completedAt: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000 + 15 * 60 * 1000).toISOString(),
          initiatedBy: 'admin'
        }
      ];

      drPlans = [
        {
          id: 'dr-1',
          name: 'Primary Site Failover',
          description: 'Failover to secondary data center',
          rpo: 15,
          rto: 30,
          failoverType: 'active_passive',
          lastTested: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
          testResult: 'passed'
        },
        {
          id: 'dr-2',
          name: 'Cloud DR Plan',
          description: 'Failover to cloud infrastructure',
          rpo: 60,
          rto: 120,
          failoverType: 'manual'
        }
      ];

      stats = {
        totalBackups: 156,
        totalSize: 1024 * 1024 * 1024 * 156.7,
        successRate: 98.5,
        lastBackup: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString()
      };
    } catch (error) {
      notificationStore.add({
        type: 'error',
        title: 'Error',
        message: 'Failed to load backup data'
      });
    } finally {
      loading = false;
    }
  }

  async function createBackup(type: Backup['type']) {
    notificationStore.add({
      type: 'info',
      title: 'Creating Backup',
      message: `Starting ${type.toUpperCase()} backup...`
    });
    
    setTimeout(() => {
      notificationStore.add({
        type: 'success',
        title: 'Backup Created',
        message: 'Backup completed successfully'
      });
      loadData();
    }, 2000);
  }

  async function restoreBackup(backupId: string) {
    notificationStore.add({
      type: 'info',
      title: 'Restoring Backup',
      message: 'Starting restore process...'
    });
    
    setTimeout(() => {
      notificationStore.add({
        type: 'success',
        title: 'Restore Complete',
        message: 'Configuration restored successfully'
      });
      loadData();
    }, 3000);
  }

  async function deleteBackup(backupId: string) {
    notificationStore.add({
      type: 'info',
      title: 'Deleting Backup',
      message: 'Removing backup file...'
    });
    loadData();
  }

  async function testDestination(destinationId: string) {
    notificationStore.add({
      type: 'info',
      title: 'Testing Destination',
      message: 'Verifying destination connectivity...'
    });
    
    setTimeout(() => {
      notificationStore.add({
        type: 'success',
        title: 'Test Complete',
        message: 'Destination is healthy'
      });
      loadData();
    }, 1500);
  }

  async function executeDRPlan(planId: string) {
    notificationStore.add({
      type: 'warning',
      title: 'DR Plan Execution',
      message: 'Initiating disaster recovery procedures...'
    });
    
    setTimeout(() => {
      notificationStore.add({
        type: 'success',
        title: 'DR Complete',
        message: 'Failover executed successfully'
      });
    }, 5000);
  }

  function formatBytes(bytes: number): string {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  function getStatusColor(status: string): string {
    switch (status) {
      case 'completed':
      case 'passed':
        return 'text-green-600 bg-green-100 dark:bg-green-900 dark:text-green-200';
      case 'in_progress':
        return 'text-blue-600 bg-blue-100 dark:bg-blue-900 dark:text-blue-200';
      case 'failed':
        return 'text-red-600 bg-red-100 dark:bg-red-900 dark:text-red-200';
      case 'pending':
        return 'text-yellow-600 bg-yellow-100 dark:bg-yellow-900 dark:text-yellow-200';
      default:
        return 'text-gray-600 bg-gray-100 dark:bg-gray-900 dark:text-gray-200';
    }
  }

  function getTypeIcon(type: string) {
    switch (type) {
      case 'ucs':
      case 'full':
        return Archive;
      case 'as3':
        return FileJson;
      case 's3':
      case 'gcs':
      case 'azure_blob':
        return Cloud;
      case 'nfs':
        return HardDrive;
      default:
        return Database;
    }
  }

  $: completedBackups = backups.filter(b => b.status === 'completed');
  $: inProgressBackups = backups.filter(b => b.status === 'in_progress');
</script>

<svelte:head>
  <title>Backup & Disaster Recovery - F5 Control Center</title>
</svelte:head>

<div class="space-y-6">
  <!-- Header -->
  <div class="bg-gradient-to-r from-blue-600 to-cyan-600 rounded-xl p-6 text-white">
    <div class="flex items-center justify-between">
      <div>
        <h1 class="text-3xl font-bold">Backup & Disaster Recovery</h1>
        <p class="text-blue-100 mt-2">Automated backups and disaster recovery management</p>
      </div>
      <div class="flex items-center space-x-6">
        <div class="text-center">
          <div class="text-2xl font-bold">{stats.successRate}%</div>
          <div class="text-sm text-blue-100">Success Rate</div>
        </div>
        <div class="text-center">
          <div class="text-2xl font-bold">{formatBytes(stats.totalSize)}</div>
          <div class="text-sm text-blue-100">Total Size</div>
        </div>
        <div class="text-center">
          <div class="text-2xl font-bold">{completedBackups.length}</div>
          <div class="text-sm text-blue-100">Backups</div>
        </div>
      </div>
    </div>
  </div>

  <!-- Quick Actions -->
  <div class="flex flex-wrap items-center justify-between gap-4">
    <div class="flex items-center space-x-2">
      <button
        on:click={() => showCreateModal = true}
        class="btn-primary flex items-center space-x-2"
      >
        <Download class="h-4 w-4" />
        <span>Create Backup</span>
      </button>
      <button
        on:click={() => activeTab = 'restore'}
        class="btn-secondary flex items-center space-x-2"
      >
        <Upload class="h-4 w-4" />
        <span>Restore</span>
      </button>
    </div>
    
    <button
      on:click={loadData}
      class="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
    >
      <RefreshCw class="h-5 w-5" />
    </button>
  </div>

  <!-- Tabs -->
  <div class="border-b border-gray-200 dark:border-gray-700">
    <nav class="flex space-x-8">
      <button
        class="py-4 px-1 border-b-2 font-medium text-sm {activeTab === 'backups' ? 'border-blue-500 text-blue-600 dark:text-blue-400' : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400'}"
        on:click={() => activeTab = 'backups'}
      >
        <div class="flex items-center space-x-2">
          <Archive class="h-4 w-4" />
          <span>Backups</span>
          {#if inProgressBackups.length > 0}
            <span class="bg-blue-500 text-white text-xs rounded-full px-2 py-0.5">{inProgressBackups.length}</span>
          {/if}
        </div>
      </button>
      <button
        class="py-4 px-1 border-b-2 font-medium text-sm {activeTab === 'destinations' ? 'border-blue-500 text-blue-600 dark:text-blue-400' : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400'}"
        on:click={() => activeTab = 'destinations'}
      >
        <div class="flex items-center space-x-2">
          <Cloud class="h-4 w-4" />
          <span>Destinations</span>
        </div>
      </button>
      <button
        class="py-4 px-1 border-b-2 font-medium text-sm {activeTab === 'schedules' ? 'border-blue-500 text-blue-600 dark:text-blue-400' : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400'}"
        on:click={() => activeTab = 'schedules'}
      >
        <div class="flex items-center space-x-2">
          <Clock class="h-4 w-4" />
          <span>Schedules</span>
        </div>
      </button>
      <button
        class="py-4 px-1 border-b-2 font-medium text-sm {activeTab === 'restore' ? 'border-blue-500 text-blue-600 dark:text-blue-400' : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400'}"
        on:click={() => activeTab = 'restore'}
      >
        <div class="flex items-center space-x-2">
          <History class="h-4 w-4" />
          <span>Restore History</span>
        </div>
      </button>
      <button
        class="py-4 px-1 border-b-2 font-medium text-sm {activeTab === 'dr' ? 'border-blue-500 text-blue-600 dark:text-blue-400' : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400'}"
        on:click={() => activeTab = 'dr'}
      >
        <div class="flex items-center space-x-2">
          <Shield class="h-4 w-4" />
          <span>DR Plans</span>
        </div>
      </button>
    </nav>
  </div>

  <!-- Content -->
  {#if loading}
    <div class="flex items-center justify-center py-12">
      <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
    </div>
  {:else if activeTab === 'backups'}
    <div class="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
      <div class="overflow-x-auto">
        <table class="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
          <thead class="bg-gray-50 dark:bg-gray-700">
            <tr>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Name</th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Type</th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Status</th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Size</th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Created</th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Expires</th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Actions</th>
            </tr>
          </thead>
          <tbody class="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
            {#each backups as backup}
              <tr class="hover:bg-gray-50 dark:hover:bg-gray-700">
                <td class="px-6 py-4 whitespace-nowrap">
                  <div class="flex items-center">
                    <svelte:component this={getTypeIcon(backup.type)} class="h-5 w-5 text-gray-400 mr-3" />
                    <div>
                      <div class="text-sm font-medium text-gray-900 dark:text-white">{backup.name}</div>
                      <div class="text-xs text-gray-500 dark:text-gray-400">{backup.destination}</div>
                    </div>
                  </div>
                </td>
                <td class="px-6 py-4 whitespace-nowrap">
                  <span class="text-sm text-gray-900 dark:text-white uppercase">{backup.type}</span>
                </td>
                <td class="px-6 py-4 whitespace-nowrap">
                  <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium {getStatusColor(backup.status)}">
                    {backup.status.replace('_', ' ')}
                  </span>
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                  {backup.size > 0 ? formatBytes(backup.size) : '-'}
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                  {new Date(backup.createdAt).toLocaleString()}
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                  {new Date(backup.expiresAt).toLocaleDateString()}
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm font-medium">
                  <div class="flex items-center space-x-2">
                    <button
                      on:click={() => restoreBackup(backup.id)}
                      class="text-blue-600 hover:text-blue-900 dark:text-blue-400"
                      title="Restore"
                    >
                      <Upload class="h-4 w-4" />
                    </button>
                    <button
                      on:click={() => deleteBackup(backup.id)}
                      class="text-red-600 hover:text-red-900 dark:text-red-400"
                      title="Delete"
                    >
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
  {:else if activeTab === 'destinations'}
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {#each destinations as dest}
        <div class="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <div class="flex items-start justify-between mb-4">
            <div class="flex items-center space-x-3">
              <div class="w-10 h-10 rounded-full {dest.healthy ? 'bg-green-100 dark:bg-green-900' : 'bg-red-100 dark:bg-red-900'} flex items-center justify-center">
                <svelte:component this={getTypeIcon(dest.type)} class="h-5 w-5 {dest.healthy ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}" />
              </div>
              <div>
                <h3 class="font-medium text-gray-900 dark:text-white">{dest.name}</h3>
                <p class="text-sm text-gray-500 dark:text-gray-400">{dest.type.toUpperCase()}</p>
              </div>
            </div>
            <span class="inline-flex items-center px-2 py-1 rounded text-xs font-medium {dest.healthy ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'}">
              {dest.healthy ? 'Healthy' : 'Unhealthy'}
            </span>
          </div>
          
          <div class="space-y-2 text-sm">
            <div class="flex justify-between">
              <span class="text-gray-500 dark:text-gray-400">Path:</span>
              <code class="text-gray-900 dark:text-white text-xs">{dest.path}</code>
            </div>
            <div class="flex justify-between">
              <span class="text-gray-500 dark:text-gray-400">Credentials:</span>
              <span class="{dest.credentialsConfigured ? 'text-green-600' : 'text-red-600'}">
                {dest.credentialsConfigured ? '✓ Configured' : '✗ Missing'}
              </span>
            </div>
            {#if dest.lastTested}
              <div class="flex justify-between">
                <span class="text-gray-500 dark:text-gray-400">Last Tested:</span>
                <span class="text-gray-900 dark:text-white">{new Date(dest.lastTested).toLocaleDateString()}</span>
              </div>
            {/if}
          </div>
          
          <div class="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
            <button
              on:click={() => testDestination(dest.id)}
              class="text-sm text-blue-600 hover:text-blue-800 dark:text-blue-400 font-medium"
            >
              Test Connection
            </button>
          </div>
        </div>
      {/each}
    </div>
  {:else if activeTab === 'schedules'}
    <div class="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
      <div class="p-6">
        <div class="space-y-4">
          {#each schedules as schedule}
            <div class="flex items-center justify-between p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
              <div class="flex items-center space-x-4">
                <div class="w-10 h-10 rounded-full {schedule.enabled ? 'bg-blue-100 dark:bg-blue-900' : 'bg-gray-100 dark:bg-gray-700'} flex items-center justify-center">
                  <Clock class="h-5 w-5 {schedule.enabled ? 'text-blue-600 dark:text-blue-400' : 'text-gray-400'}" />
                </div>
                <div>
                  <h3 class="font-medium text-gray-900 dark:text-white">{schedule.name}</h3>
                  <div class="flex items-center space-x-4 text-sm text-gray-500 dark:text-gray-400 mt-1">
                    <span class="flex items-center">
                      <Database class="h-3 w-3 mr-1" />
                      {schedule.type.toUpperCase()}
                    </span>
                    <span class="flex items-center">
                      <RefreshCw class="h-3 w-3 mr-1" />
                      {schedule.frequency}
                    </span>
                    <span>{schedule.time}</span>
                  </div>
                  {#if schedule.nextRun}
                    <div class="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      Next run: {new Date(schedule.nextRun).toLocaleString()}
                    </div>
                  {/if}
                </div>
              </div>
              <div class="flex items-center space-x-3">
                <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium {schedule.enabled ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200'}">
                  {schedule.enabled ? 'Enabled' : 'Disabled'}
                </span>
                <button class="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
                  <Settings class="h-4 w-4" />
                </button>
              </div>
            </div>
          {/each}
        </div>
      </div>
    </div>
  {:else if activeTab === 'restore'}
    <div class="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
      <div class="overflow-x-auto">
        <table class="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
          <thead class="bg-gray-50 dark:bg-gray-700">
            <tr>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Backup</th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Status</th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Started</th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Duration</th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Initiated By</th>
            </tr>
          </thead>
          <tbody class="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
            {#each restores as restore}
              <tr class="hover:bg-gray-50 dark:hover:bg-gray-700">
                <td class="px-6 py-4 whitespace-nowrap">
                  <div class="text-sm font-medium text-gray-900 dark:text-white">{restore.backupName}</div>
                </td>
                <td class="px-6 py-4 whitespace-nowrap">
                  <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium {getStatusColor(restore.status)}">
                    {restore.status.replace('_', ' ')}
                  </span>
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                  {new Date(restore.startedAt).toLocaleString()}
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                  {#if restore.completedAt}
                    {Math.round((new Date(restore.completedAt).getTime() - new Date(restore.startedAt).getTime()) / 60000)} min
                  {:else}
                    -
                  {/if}
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                  {restore.initiatedBy}
                </td>
              </tr>
            {/each}
          </tbody>
        </table>
      </div>
    </div>
  {:else if activeTab === 'dr'}
    <div class="space-y-6">
      {#each drPlans as plan}
        <div class="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <div class="flex items-start justify-between">
            <div>
              <div class="flex items-center space-x-3 mb-2">
                <h3 class="text-lg font-semibold text-gray-900 dark:text-white">{plan.name}</h3>
                {#if plan.testResult}
                  <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium {plan.testResult === 'passed' ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'}">
                    Last Test: {plan.testResult}
                  </span>
                {/if}
              </div>
              <p class="text-gray-600 dark:text-gray-400 mb-4">{plan.description}</p>
              <div class="flex items-center space-x-6 text-sm">
                <div>
                  <span class="text-gray-500 dark:text-gray-400">RPO:</span>
                  <span class="font-medium text-gray-900 dark:text-white ml-1">{plan.rpo} min</span>
                </div>
                <div>
                  <span class="text-gray-500 dark:text-gray-400">RTO:</span>
                  <span class="font-medium text-gray-900 dark:text-white ml-1">{plan.rto} min</span>
                </div>
                <div>
                  <span class="text-gray-500 dark:text-gray-400">Type:</span>
                  <span class="font-medium text-gray-900 dark:text-white ml-1">{plan.failoverType.replace('_', '-')}</span>
                </div>
                {#if plan.lastTested}
                  <div>
                    <span class="text-gray-500 dark:text-gray-400">Last Tested:</span>
                    <span class="font-medium text-gray-900 dark:text-white ml-1">{new Date(plan.lastTested).toLocaleDateString()}</span>
                  </div>
                {/if}
              </div>
            </div>
            <div class="flex items-center space-x-2">
              <button
                on:click={() => executeDRPlan(plan.id)}
                class="btn-danger flex items-center space-x-2"
              >
                <Play class="h-4 w-4" />
                <span>Execute DR</span>
              </button>
            </div>
          </div>
        </div>
      {/each}
    </div>
  {/if}
</div>

<!-- Create Backup Modal -->
{#if showCreateModal}
  <div class="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
    <div class="bg-white dark:bg-gray-800 rounded-xl shadow-xl max-w-lg w-full">
      <div class="p-6 border-b border-gray-200 dark:border-gray-700">
        <h2 class="text-xl font-semibold text-gray-900 dark:text-white">Create Backup</h2>
      </div>
      <div class="p-6 space-y-4">
        <div>
          <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Backup Type</label>
          <div class="grid grid-cols-2 gap-3">
            <button on:click={() => createBackup('ucs')} class="p-4 border border-gray-200 dark:border-gray-700 rounded-lg hover:border-blue-500 dark:hover:border-blue-400 text-left">
              <Archive class="h-6 w-6 text-blue-600 mb-2" />
              <div class="font-medium text-gray-900 dark:text-white">UCS</div>
              <div class="text-sm text-gray-500">Full system config</div>
            </button>
            <button on:click={() => createBackup('as3')} class="p-4 border border-gray-200 dark:border-gray-700 rounded-lg hover:border-blue-500 dark:hover:border-blue-400 text-left">
              <FileJson class="h-6 w-6 text-blue-600 mb-2" />
              <div class="font-medium text-gray-900 dark:text-white">AS3</div>
              <div class="text-sm text-gray-500">Declarations only</div>
            </button>
          </div>
        </div>
      </div>
      <div class="p-6 border-t border-gray-200 dark:border-gray-700 flex justify-end space-x-3">
        <button on:click={() => showCreateModal = false} class="btn-secondary">Cancel</button>
      </div>
    </div>
  </div>
{/if}
