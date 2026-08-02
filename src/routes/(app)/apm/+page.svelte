<script lang="ts">
  import { Key, Shield, Users, Lock, Fingerprint, Globe } from 'lucide-svelte';
  import TutorialTooltip from '$lib/components/TutorialTooltip.svelte';
  import { featureContent } from '$lib/data/featureContent';

  const content = featureContent['access-policy'];

  const authMethods = [
    { name: 'Azure AD', type: 'SAML', status: 'connected', users: 1247 },
    { name: 'Okta', type: 'OIDC', status: 'connected', users: 892 },
    { name: 'Active Directory', type: 'LDAP', status: 'connected', users: 3456 },
    { name: 'RSA SecurID', type: 'RADIUS', status: 'standby', users: 0 }
  ];

  const accessPolicies = [
    { name: 'Banking Portal', auth: 'MFA Required', users: 5234, risk: 'High' },
    { name: 'Internal Wiki', auth: 'SSO', users: 8921, risk: 'Low' },
    { name: 'Payment API', auth: 'Certificate + MFA', users: 156, risk: 'Critical' }
  ];
</script>

<svelte:head>
  <title>Access Policy Manager - F5 Automation Control Center</title>
</svelte:head>

<div class="space-y-6">
  <div class="flex items-center justify-between">
    <div>
      <div class="flex items-center space-x-3">
        <h1 class="text-3xl font-bold text-gray-900 dark:text-white">Access Policy Manager (APM)</h1>
        <TutorialTooltip
          title={content.title}
          description={content.description}
          problemSolved={content.problemSolved}
          benefits={content.benefits}
          variant="tip"
        />
      </div>
      <p class="text-gray-500 dark:text-gray-400 mt-1">
        Unified access control with SSO, MFA, and adaptive authentication
      </p>
    </div>
  </div>

  <!-- Value Banner -->
  <div class="bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
    <div class="flex items-start space-x-3">
      <div class="p-2 bg-green-100 dark:bg-green-800 rounded-lg">
        <Shield class="h-5 w-5 text-green-600 dark:text-green-300" />
      </div>
      <div>
        <h3 class="font-semibold text-green-900 dark:text-green-300">Why This Matters</h3>
        <p class="text-sm text-green-800 dark:text-green-400 mt-1">
          {content.businessValue} APM reduces password-related helpdesk tickets by 40% 
          while strengthening security through risk-based authentication.
        </p>
      </div>
    </div>
  </div>

  <!-- Stats -->
  <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
    <div class="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4">
      <div class="flex items-center justify-between">
        <div>
          <p class="text-sm text-gray-500 dark:text-gray-400">Active Sessions</p>
          <p class="text-2xl font-bold text-gray-900 dark:text-white">14,832</p>
        </div>
        <Users class="h-8 w-8 text-blue-500" />
      </div>
    </div>
    <div class="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4">
      <div class="flex items-center justify-between">
        <div>
          <p class="text-sm text-gray-500 dark:text-gray-400">SSO Apps</p>
          <p class="text-2xl font-bold text-gray-900 dark:text-white">47</p>
        </div>
        <Globe class="h-8 w-8 text-indigo-500" />
      </div>
    </div>
    <div class="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4">
      <div class="flex items-center justify-between">
        <div>
          <p class="text-sm text-gray-500 dark:text-gray-400">MFA Enabled</p>
          <p class="text-2xl font-bold text-gray-900 dark:text-white">98.2%</p>
        </div>
        <Fingerprint class="h-8 w-8 text-green-500" />
      </div>
    </div>
    <div class="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4">
      <div class="flex items-center justify-between">
        <div>
          <p class="text-sm text-gray-500 dark:text-gray-400">Auth Success</p>
          <p class="text-2xl font-bold text-gray-900 dark:text-white">99.9%</p>
        </div>
        <Lock class="h-8 w-8 text-purple-500" />
      </div>
    </div>
  </div>

  <!-- Identity Providers -->
  <div class="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
    <h2 class="text-lg font-semibold text-gray-900 dark:text-white mb-4">Identity Providers</h2>
    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
      {#each authMethods as method}
        <div class="flex items-center justify-between p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
          <div class="flex items-center space-x-3">
            <div class="w-10 h-10 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center">
              <Key class="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <p class="font-medium text-gray-900 dark:text-white">{method.name}</p>
              <p class="text-sm text-gray-500">{method.type}</p>
            </div>
          </div>
          <div class="text-right">
            <span class="px-2 py-1 text-xs rounded-full {method.status === 'connected' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}">
              {method.status}
            </span>
            {#if method.users > 0}
              <p class="text-sm text-gray-500 mt-1">{method.users.toLocaleString()} users</p>
            {/if}
          </div>
        </div>
      {/each}
    </div>
  </div>

  <!-- Access Policies -->
  <div class="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
    <h2 class="text-lg font-semibold text-gray-900 dark:text-white mb-4">Access Policies</h2>
    <div class="overflow-x-auto">
      <table class="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
        <thead>
          <tr>
            <th class="px-4 py-2 text-left text-sm font-medium text-gray-500">Application</th>
            <th class="px-4 py-2 text-left text-sm font-medium text-gray-500">Authentication</th>
            <th class="px-4 py-2 text-left text-sm font-medium text-gray-500">Users</th>
            <th class="px-4 py-2 text-left text-sm font-medium text-gray-500">Risk Level</th>
          </tr>
        </thead>
        <tbody class="divide-y divide-gray-200 dark:divide-gray-700">
          {#each accessPolicies as policy}
            <tr>
              <td class="px-4 py-3 text-sm font-medium text-gray-900 dark:text-white">{policy.name}</td>
              <td class="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">{policy.auth}</td>
              <td class="px-4 py-3 text-sm text-gray-900 dark:text-white">{policy.users.toLocaleString()}</td>
              <td class="px-4 py-3 text-sm">
                <span class="px-2 py-1 text-xs rounded-full 
                  {policy.risk === 'Critical' ? 'bg-red-100 text-red-800' : 
                   policy.risk === 'High' ? 'bg-orange-100 text-orange-800' : 
                   'bg-green-100 text-green-800'}">
                  {policy.risk}
                </span>
              </td>
            </tr>
          {/each}
        </tbody>
      </table>
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
