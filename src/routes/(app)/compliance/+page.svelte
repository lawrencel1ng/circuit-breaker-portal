<script lang="ts">
  import { Shield, CheckCircle, AlertTriangle, FileText, Clock, Lock } from 'lucide-svelte';
  import TutorialTooltip from '$lib/components/TutorialTooltip.svelte';

  const content = {
    title: 'Compliance & Governance Automation',
    description: 'Automated compliance monitoring for PCI-DSS, SOC 2, ISO 27001, and MAS TRM with continuous validation and audit-ready reporting.',
    problemSolved: 'Compliance audits are manual, time-consuming (2-4 weeks preparation), and reactive. Organizations struggle to maintain continuous compliance across hundreds of F5 devices.',
    benefits: [
      '90% reduction in audit preparation time',
      'Real-time compliance scoring',
      'Automated evidence collection',
      'Pre-built banking compliance templates',
      'Drift detection with auto-remediation'
    ]
  };

  const frameworks = [
    { 
      name: 'PCI-DSS', 
      version: '4.0', 
      score: 94, 
      status: 'compliant',
      controls: 78,
      passed: 73,
      failed: 5
    },
    { 
      name: 'SOC 2 Type II', 
      version: '2024', 
      score: 91, 
      status: 'compliant',
      controls: 64,
      passed: 58,
      failed: 6
    },
    { 
      name: 'MAS TRM', 
      version: '3.0', 
      score: 89, 
      status: 'at-risk',
      controls: 52,
      passed: 46,
      failed: 6
    },
    { 
      name: 'ISO 27001', 
      version: '2022', 
      score: 96, 
      status: 'compliant',
      controls: 45,
      passed: 43,
      failed: 2
    }
  ];

  const findings = [
    { severity: 'high', control: 'PCI 1.2.1', title: 'Default deny firewall policy', resource: 'bigip-prod-01', age: '2 days' },
    { severity: 'medium', control: 'MAS 6.2', title: 'SSL cipher strength below 128-bit', resource: 'vip-legacy-app', age: '5 days' },
    { severity: 'low', control: 'SOC CC6.1', title: 'Logging retention < 1 year', resource: 'audit-policy', age: '12 days' }
  ];
</script>

<svelte:head>
  <title>Compliance & Governance - F5 Automation Control Center</title>
</svelte:head>

<div class="space-y-6">
  <div class="flex items-center justify-between">
    <div>
      <div class="flex items-center space-x-3">
        <h1 class="text-3xl font-bold text-gray-900 dark:text-white">Compliance & Governance</h1>
        <TutorialTooltip
          title={content.title}
          description={content.description}
          problemSolved={content.problemSolved}
          benefits={content.benefits}
          variant="tip"
        />
      </div>
      <p class="text-gray-500 dark:text-gray-400 mt-1">
        Automated compliance monitoring and audit-ready reporting
      </p>
    </div>
  </div>

  <!-- Value Banner -->
  <div class="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
    <div class="flex items-start space-x-3">
      <div class="p-2 bg-blue-100 dark:bg-blue-800 rounded-lg">
        <Shield class="h-5 w-5 text-blue-600 dark:text-blue-300" />
      </div>
      <div>
        <h3 class="font-semibold text-blue-900 dark:text-blue-300">Compliance Status</h3>
        <p class="text-sm text-blue-800 dark:text-blue-400 mt-1">
          Overall compliance score: <strong>93%</strong> across 4 frameworks. 
          <strong>13 findings</strong> require attention. 
          Last audit: <strong>Passed PCI-DSS assessment</strong> with 0 critical findings.
        </p>
      </div>
    </div>
  </div>

  <!-- Framework Cards -->
  <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
    {#each frameworks as fw}
      <div class="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4">
        <div class="flex items-center justify-between mb-3">
          <div class="flex items-center space-x-2">
            <Shield class="h-5 w-5 {fw.score >= 90 ? 'text-green-500' : fw.score >= 80 ? 'text-amber-500' : 'text-red-500'}" />
            <h3 class="font-semibold text-gray-900 dark:text-white">{fw.name}</h3>
          </div>
          <span class="text-xs text-gray-500">{fw.version}</span>
        </div>
        <div class="mb-3">
          <div class="flex items-center justify-between mb-1">
            <span class="text-sm text-gray-500">Compliance Score</span>
            <span class="text-lg font-bold {fw.score >= 90 ? 'text-green-600' : fw.score >= 80 ? 'text-amber-600' : 'text-red-600'}">{fw.score}%</span>
          </div>
          <div class="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
            <div class="{fw.score >= 90 ? 'bg-green-500' : fw.score >= 80 ? 'bg-amber-500' : 'bg-red-500'} h-2 rounded-full" style="width: {fw.score}%"></div>
          </div>
        </div>
        <div class="flex items-center justify-between text-sm">
          <span class="text-gray-500">{fw.controls} controls</span>
          <span class="{fw.status === 'compliant' ? 'text-green-600' : 'text-amber-600'}">{fw.status}</span>
        </div>
      </div>
    {/each}
  </div>

  <!-- Findings & Evidence -->
  <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
    <!-- Open Findings -->
    <div class="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
      <div class="flex items-center space-x-2 mb-4">
        <AlertTriangle class="h-5 w-5 text-amber-500" />
        <h2 class="text-lg font-semibold text-gray-900 dark:text-white">Open Findings</h2>
      </div>
      <div class="space-y-3">
        {#each findings as finding}
          <div class="flex items-start space-x-3 p-3 border border-gray-200 dark:border-gray-700 rounded-lg">
            <div class="w-2 h-2 rounded-full mt-2 flex-shrink-0 
              {finding.severity === 'high' ? 'bg-red-500' : finding.severity === 'medium' ? 'bg-amber-500' : 'bg-blue-500'}"></div>
            <div class="flex-1">
              <div class="flex items-center justify-between">
                <p class="font-medium text-gray-900 dark:text-white">{finding.title}</p>
                <span class="text-xs px-2 py-0.5 rounded-full 
                  {finding.severity === 'high' ? 'bg-red-100 text-red-800' : finding.severity === 'medium' ? 'bg-amber-100 text-amber-800' : 'bg-blue-100 text-blue-800'}">
                  {finding.severity}
                </span>
              </div>
              <p class="text-sm text-gray-500">{finding.control} • {finding.resource}</p>
              <p class="text-xs text-gray-400 mt-1">Detected {finding.age} ago</p>
            </div>
          </div>
        {/each}
      </div>
    </div>

    <!-- Audit Evidence -->
    <div class="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
      <div class="flex items-center space-x-2 mb-4">
        <FileText class="h-5 w-5 text-blue-500" />
        <h2 class="text-lg font-semibold text-gray-900 dark:text-white">Audit Evidence Collection</h2>
      </div>
      <div class="space-y-3">
        <div class="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-750 rounded-lg">
          <div class="flex items-center space-x-3">
            <CheckCircle class="h-5 w-5 text-green-500" />
            <div>
              <p class="font-medium text-gray-900 dark:text-white">Firewall Rule Inventory</p>
              <p class="text-sm text-gray-500">PCI-DSS Requirement 1.1</p>
            </div>
          </div>
          <span class="text-sm text-green-600">Auto-collected</span>
        </div>
        <div class="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-750 rounded-lg">
          <div class="flex items-center space-x-3">
            <CheckCircle class="h-5 w-5 text-green-500" />
            <div>
              <p class="font-medium text-gray-900 dark:text-white">SSL Certificate Audit</p>
              <p class="text-sm text-gray-500">MAS TRM Requirement 9.2</p>
            </div>
          </div>
          <span class="text-sm text-green-600">Auto-collected</span>
        </div>
        <div class="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-750 rounded-lg">
          <div class="flex items-center space-x-3">
            <Clock class="h-5 w-5 text-amber-500" />
            <div>
              <p class="font-medium text-gray-900 dark:text-white">Access Review Documentation</p>
              <p class="text-sm text-gray-500">SOC 2 CC6.2</p>
            </div>
          </div>
          <span class="text-sm text-amber-600">Pending review</span>
        </div>
        <div class="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-750 rounded-lg">
          <div class="flex items-center space-x-3">
            <CheckCircle class="h-5 w-5 text-green-500" />
            <div>
              <p class="font-medium text-gray-900 dark:text-white">WAF Policy Configuration</p>
              <p class="text-sm text-gray-500">PCI-DSS Requirement 6.6</p>
            </div>
          </div>
          <span class="text-sm text-green-600">Auto-collected</span>
        </div>
      </div>
      <button class="w-full mt-4 btn-primary">
        Generate Audit Report
      </button>
    </div>
  </div>

  <!-- Compliance Timeline -->
  <div class="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
    <h2 class="text-lg font-semibold text-gray-900 dark:text-white mb-4">Upcoming Compliance Activities</h2>
    <div class="space-y-4">
      <div class="flex items-center space-x-4">
        <div class="w-3 h-3 bg-red-500 rounded-full"></div>
        <div class="flex-1">
          <p class="font-medium text-gray-900 dark:text-white">PCI-DSS Quarterly Scan</p>
          <p class="text-sm text-gray-500">External vulnerability assessment required</p>
        </div>
        <span class="text-sm text-red-600 font-medium">Due in 5 days</span>
      </div>
      <div class="flex items-center space-x-4">
        <div class="w-3 h-3 bg-amber-500 rounded-full"></div>
        <div class="flex-1">
          <p class="font-medium text-gray-900 dark:text-white">MAS TRM Control Review</p>
          <p class="text-sm text-gray-500">Annual technology risk management assessment</p>
        </div>
        <span class="text-sm text-amber-600 font-medium">Due in 3 weeks</span>
      </div>
      <div class="flex items-center space-x-4">
        <div class="w-3 h-3 bg-blue-500 rounded-full"></div>
        <div class="flex-1">
          <p class="font-medium text-gray-900 dark:text-white">SOC 2 Evidence Collection</p>
          <p class="text-sm text-gray-500">Gather artifacts for auditor review</p>
        </div>
        <span class="text-sm text-blue-600 font-medium">Due in 6 weeks</span>
      </div>
    </div>
  </div>

  <!-- Business Value Summary -->
  <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
    <div class="bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
      <h3 class="font-semibold text-green-900 dark:text-green-300 mb-2">Time Savings</h3>
      <p class="text-sm text-green-800 dark:text-green-400">
        Automated evidence collection reduces audit preparation from <strong>4 weeks to 2 days</strong> — 
        saving 120+ hours of manual work per audit.
      </p>
    </div>
    <div class="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
      <h3 class="font-semibold text-blue-900 dark:text-blue-300 mb-2">Continuous Compliance</h3>
      <p class="text-sm text-blue-800 dark:text-blue-400">
        Real-time monitoring catches compliance drift within <strong>minutes</strong> instead of months, 
        preventing audit findings before they occur.
      </p>
    </div>
    <div class="bg-gradient-to-r from-purple-50 to-violet-50 dark:from-purple-900/20 dark:to-violet-900/20 border border-purple-200 dark:border-purple-800 rounded-lg p-4">
      <h3 class="font-semibold text-purple-900 dark:text-purple-300 mb-2">Audit Confidence</h3>
      <p class="text-sm text-purple-800 dark:text-purple-400">
        Pre-built banking templates for MAS TRM and PCI-DSS ensure <strong>100% coverage</strong> of 
        required controls with validated configurations.
      </p>
    </div>
  </div>
</div>
