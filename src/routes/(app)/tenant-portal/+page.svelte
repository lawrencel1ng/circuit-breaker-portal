<script lang="ts">
  import { Building2, Users, BarChart3, Shield, Settings } from 'lucide-svelte';
  import TutorialTooltip from '$lib/components/TutorialTooltip.svelte';
  import { featureContent } from '$lib/data/featureContent';

  const content = featureContent['multi-tenant-portal'];

  const tenants = [
    { name: 'Retail Banking Division', users: 234, apps: 12, usage: 'High', status: 'active' },
    { name: 'Investment Banking', users: 89, apps: 8, usage: 'Medium', status: 'active' },
    { name: 'Wealth Management', users: 156, apps: 6, usage: 'Medium', status: 'active' },
    { name: 'Insurance Division', users: 67, apps: 4, usage: 'Low', status: 'pending' }
  ];

  const services = [
    { name: 'Load Balancing', usage: '78% utilization' },
    { name: 'WAF Protection', usage: '45 apps protected' },
    { name: 'SSL Orchestrator', usage: '2.4 Gbps processed' },
    { name: 'APM Access', usage: '546 users authenticated' }
  ];
</script>

<svelte:head>
  <title>Multi-Tenant Portal - F5 Automation Control Center</title>
</svelte:head>

<div class="space-y-6">
  <div class="flex items-center justify-between">
    <div>
      <div class="flex items-center space-x-3">
        <h1 class="text-3xl font-bold text-gray-900 dark:text-white">Multi-Tenant Portal</h1>
        <TutorialTooltip
          title={content.title}
          description={content.description}
          problemSolved={content.problemSolved}
          benefits={content.benefits}
          variant="tip"
        />
      </div>
      <p class="text-gray-500 dark:text-gray-400 mt-1">
        White-label platform for F5-as-a-Service delivery
      </p>
    </div>
  </div>

  <!-- Value Banner -->
  <div class="bg-gradient-to-r from-rose-50 to-pink-50 dark:from-rose-900/20 dark:to-pink-900/20 border border-rose-200 dark:border-rose-800 rounded-lg p-4">
    <div class="flex items-start space-x-3">
      <div class="p-2 bg-rose-100 dark:bg-rose-800 rounded-lg">
        <Building2 class="h-5 w-5 text-rose-600 dark:text-rose-300" />
      </div>
      <div>
        <h3 class="font-semibold text-rose-900 dark:text-rose-300">Why This Matters</h3>
        <p class="text-sm text-rose-800 dark:text-rose-400 mt-1">
          {content.businessValue} Enable service provider models with complete tenant isolation.
        </p>
      </div>
    </div>
  </div>

  <!-- Stats -->
  <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
    <div class="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4">
      <div class="flex items-center justify-between">
        <div>
          <p class="text-sm text-gray-500 dark:text-gray-400">Active Tenants</p>
          <p class="text-2xl font-bold text-gray-900 dark:text-white">4</p>
        </div>
        <Building2 class="h-8 w-8 text-blue-500" />
      </div>
    </div>
    <div class="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4">
      <div class="flex items-center justify-between">
        <div>
          <p class="text-sm text-gray-500 dark:text-gray-400">Total Users</p>
          <p class="text-2xl font-bold text-gray-900 dark:text-white">546</p>
        </div>
        <Users class="h-8 w-8 text-green-500" />
      </div>
    </div>
    <div class="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4">
      <div class="flex items-center justify-between">
        <div>
          <p class="text-sm text-gray-500 dark:text-gray-400">Applications</p>
          <p class="text-2xl font-bold text-gray-900 dark:text-white">30</p>
        </div>
        <BarChart3 class="h-8 w-8 text-purple-500" />
      </div>
    </div>
  </div>

  <!-- Tenants -->
  <div class="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
    <h2 class="text-lg font-semibold text-gray-900 dark:text-white mb-4">Business Units</h2>
    <div class="overflow-x-auto">
      <table class="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
        <thead>
          <tr>
            <th class="px-4 py-2 text-left text-sm font-medium text-gray-500">Division</th>
            <th class="px-4 py-2 text-left text-sm font-medium text-gray-500">Users</th>
            <th class="px-4 py-2 text-left text-sm font-medium text-gray-500">Apps</th>
            <th class="px-4 py-2 text-left text-sm font-medium text-gray-500">Usage Level</th>
            <th class="px-4 py-2 text-left text-sm font-medium text-gray-500">Status</th>
          </tr>
        </thead>
        <tbody class="divide-y divide-gray-200 dark:divide-gray-700">
          {#each tenants as tenant}
            <tr>
              <td class="px-4 py-3 text-sm font-medium text-gray-900 dark:text-white">{tenant.name}</td>
              <td class="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">{tenant.users}</td>
              <td class="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">{tenant.apps}</td>
              <td class="px-4 py-3 text-sm text-gray-900 dark:text-white">{tenant.usage}</td>
              <td class="px-4 py-3 text-sm">
                <span class="px-2 py-1 text-xs rounded-full {tenant.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-amber-100 text-amber-800'}">
                  {tenant.status}
                </span>
              </td>
            </tr>
          {/each}
        </tbody>
      </table>
    </div>
  </div>

  <!-- Service Catalog -->
  <div class="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
    <h2 class="text-lg font-semibold text-gray-900 dark:text-white mb-4">Service Catalog</h2>
    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
      {#each services as service}
        <div class="flex items-center justify-between p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
          <div>
            <p class="font-medium text-gray-900 dark:text-white">{service.name}</p>
            <p class="text-sm text-gray-500">{service.usage}</p>
          </div>
        </div>
      {/each}
    </div>
  </div>

  <!-- Use Cases -->
  <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
    {#each content.useCases as useCase, i}
      <div class="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4">
        <h3 class="font-medium text-gray-900 dark:text-white mb-2">Use Case {i + 1}</h3>
        <p class="text-sm text-gray-600 dark:text-gray-400">{useCase}</p>
      </div>
    {/each}
  </div>
</div>
