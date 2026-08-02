<script lang="ts">
  import { onMount } from 'svelte';
  import { 
    Brain, Shield, Eye, Zap, AlertTriangle, TrendingUp, 
    Lock, Server, Activity, CheckCircle, XCircle, Clock,
    Filter, Globe, Database
  } from 'lucide-svelte';
  import TutorialTooltip from '$lib/components/TutorialTooltip.svelte';
  import { featureContent } from '$lib/data/featureContent';

  // Get educational content
  const gatewayContent = featureContent['ai-gateway'];
  const securityContent = featureContent['llm-security'];
  const observabilityContent = featureContent['ai-observability'];

  // Real-time metrics
  let metrics = {
    totalRequests: 125847,
    blockedThreats: 2341,
    piiDetected: 456,
    avgLatency: 145,
    cacheHitRate: 34,
    activeSessions: 1234
  };

  // AI models being used
  const aiModels = [
    { name: 'GPT-4', provider: 'OpenAI', requests: 45230, status: 'healthy', latency: 120 },
    { name: 'Claude 3', provider: 'Anthropic', requests: 32100, status: 'healthy', latency: 95 },
    { name: 'Azure OpenAI', provider: 'Microsoft', requests: 28500, status: 'healthy', latency: 110 },
    { name: 'Gemini Pro', provider: 'Google', requests: 15000, status: 'degraded', latency: 180 },
    { name: 'Llama 3', provider: 'Local', requests: 12017, status: 'healthy', latency: 85 }
  ];

  // Security events
  let securityEvents = [
    { id: 1, timestamp: '2 min ago', type: 'prompt_injection', severity: 'high', description: 'Jailbreak attempt detected', blocked: true, user: 'dev-user-42' },
    { id: 2, timestamp: '5 min ago', type: 'pii_leak', severity: 'medium', description: 'SSN detected in prompt', blocked: true, user: 'analyst-007' },
    { id: 3, timestamp: '12 min ago', type: 'data_exfil', severity: 'high', description: 'Attempt to extract training data', blocked: true, user: 'external-tester' },
    { id: 4, timestamp: '18 min ago', type: 'policy_violation', severity: 'low', description: 'Unauthorized model access attempt', blocked: true, user: 'contractor-15' },
    { id: 5, timestamp: '25 min ago', type: 'prompt_injection', severity: 'medium', description: 'Indirect injection via document', blocked: true, user: 'dev-user-88' }
  ];

  // Policy enforcement stats
  const policyStats = [
    { name: 'PII Detection', status: 'active', blocks: 456, icon: Lock },
    { name: 'Prompt Injection', status: 'active', blocks: 1234, icon: Shield },
    { name: 'Data Exfiltration', status: 'active', blocks: 89, icon: Database },
    { name: 'Model Routing', status: 'active', blocks: 2341, icon: Globe }
  ];

  function getSeverityColor(severity: string) {
    switch (severity) {
      case 'high': return 'text-red-600 bg-red-100 dark:bg-red-900 dark:text-red-200';
      case 'medium': return 'text-yellow-600 bg-yellow-100 dark:bg-yellow-900 dark:text-yellow-200';
      case 'low': return 'text-blue-600 bg-blue-100 dark:bg-blue-900 dark:text-blue-200';
      default: return 'text-gray-600 bg-gray-100 dark:bg-gray-900 dark:text-gray-200';
    }
  }

  function getEventIcon(type: string) {
    switch (type) {
      case 'prompt_injection': return Shield;
      case 'pii_leak': return Lock;
      case 'data_exfil': return AlertTriangle;
      case 'policy_violation': return XCircle;
      default: return Activity;
    }
  }

  onMount(() => {
    // Simulate real-time updates
    const interval = setInterval(() => {
      metrics.totalRequests += Math.floor(Math.random() * 10);
      metrics.activeSessions += Math.floor((Math.random() - 0.5) * 5);
    }, 3000);

    return () => clearInterval(interval);
  });
</script>

<svelte:head>
  <title>F5 Calypso AI Gateway - F5 Control Center</title>
</svelte:head>

<div class="space-y-6">
  <!-- Header -->
  <div class="bg-gradient-to-r from-violet-600 to-purple-600 rounded-xl p-6 text-white">
    <div class="flex items-center justify-between">
      <div>
        <div class="flex items-center space-x-3 mb-2">
          <Brain class="h-8 w-8" />
          <h1 class="text-3xl font-bold">F5 Calypso AI Gateway</h1>
          <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-pink-100 text-pink-800 dark:bg-pink-900 dark:text-pink-200">
            Future Roadmap
          </span>
        </div>
        <p class="text-violet-100">Secure, govern, and optimize enterprise AI adoption</p>
        <p class="text-violet-200 text-sm mt-2">
          <strong>Requirements:</strong> F5 Calypso, AWAF with AI, API Gateway
        </p>
      </div>
      <div class="flex items-center space-x-6">
        <div class="text-center">
          <div class="text-2xl font-bold">{(metrics.totalRequests / 1000).toFixed(0)}K</div>
          <div class="text-sm text-violet-100">AI Requests</div>
        </div>
        <div class="text-center">
          <div class="text-2xl font-bold text-green-300">{metrics.blockedThreats}</div>
          <div class="text-sm text-violet-100">Threats Blocked</div>
        </div>
        <div class="text-center">
          <div class="text-2xl font-bold">{metrics.activeSessions}</div>
          <div class="text-sm text-violet-100">Active Sessions</div>
        </div>
      </div>
    </div>
  </div>

  <!-- Value Proposition Banner -->
  <div class="bg-gradient-to-r from-violet-50 to-purple-50 dark:from-violet-900/20 dark:to-purple-900/20 border border-violet-200 dark:border-violet-800 rounded-lg p-4">
    <div class="flex items-start space-x-3">
      <div class="p-2 bg-violet-100 dark:bg-violet-800 rounded-lg">
        <Brain class="h-5 w-5 text-violet-600 dark:text-violet-300" />
      </div>
      <div>
        <h3 class="font-semibold text-violet-900 dark:text-violet-300">Why F5 Calypso in the AI Era</h3>
        <p class="text-sm text-violet-800 dark:text-violet-400 mt-1">
          Enterprises are adopting AI at unprecedented speed, but security teams can't keep up. 
          <strong>F5 Calypso provides the security and governance layer that enterprises desperately need</strong> — 
          preventing data leakage, blocking prompt injection attacks, and ensuring compliance while enabling innovation.
        </p>
      </div>
    </div>
  </div>

  <!-- Key Capabilities Grid -->
  <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
    <!-- AI Gateway -->
    <div class="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6 hover:shadow-md transition-shadow h-full">
      <div class="flex items-center justify-between mb-4">
        <div class="flex items-center space-x-3">
          <div class="w-10 h-10 bg-violet-100 dark:bg-violet-900 rounded-lg flex items-center justify-center">
            <Server class="h-5 w-5 text-violet-600 dark:text-violet-400" />
          </div>
          <h3 class="font-semibold text-gray-900 dark:text-white">AI Gateway</h3>
        </div>
        <TutorialTooltip
          title={gatewayContent.title}
          description={gatewayContent.description}
          problemSolved={gatewayContent.problemSolved}
          benefits={gatewayContent.benefits}
          variant="info"
        />
      </div>
      <p class="text-sm text-gray-600 dark:text-gray-400">
        Unified control point for all AI traffic. Route requests to optimal models, enforce rate limits, and maintain complete visibility.
      </p>
    </div>

    <!-- LLM Security -->
    <div class="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6 hover:shadow-md transition-shadow h-full">
      <div class="flex items-center justify-between mb-4">
        <div class="flex items-center space-x-3">
          <div class="w-10 h-10 bg-red-100 dark:bg-red-900 rounded-lg flex items-center justify-center">
            <Shield class="h-5 w-5 text-red-600 dark:text-red-400" />
          </div>
          <h3 class="font-semibold text-gray-900 dark:text-white">LLM Security</h3>
        </div>
        <TutorialTooltip
          title={securityContent.title}
          description={securityContent.description}
          problemSolved={securityContent.problemSolved}
          benefits={securityContent.benefits}
          variant="warning"
        />
      </div>
      <p class="text-sm text-gray-600 dark:text-gray-400">
        Real-time protection against prompt injection, jailbreaks, and data exfiltration. Prevent AI from being weaponized against you.
      </p>
    </div>

    <!-- Observability -->
    <div class="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6 hover:shadow-md transition-shadow h-full">
      <div class="flex items-center justify-between mb-4">
        <div class="flex items-center space-x-3">
          <div class="w-10 h-10 bg-blue-100 dark:bg-blue-900 rounded-lg flex items-center justify-center">
            <Eye class="h-5 w-5 text-blue-600 dark:text-blue-400" />
          </div>
          <h3 class="font-semibold text-gray-900 dark:text-white">AI Observability</h3>
        </div>
        <TutorialTooltip
          title={observabilityContent.title}
          description={observabilityContent.description}
          problemSolved={observabilityContent.problemSolved}
          benefits={observabilityContent.benefits}
          variant="tip"
        />
      </div>
      <p class="text-sm text-gray-600 dark:text-gray-400">
        Complete visibility into AI usage, token consumption, model performance, and response quality across your organization.
      </p>
    </div>
  </div>

  <!-- AI Models in Use -->
  <div class="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
    <div class="px-6 py-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
      <div>
        <h2 class="text-xl font-semibold text-gray-900 dark:text-white">AI Models in Use</h2>
        <p class="text-sm text-gray-600 dark:text-gray-400">Monitored and secured LLM providers</p>
      </div>
      <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
        5 Active Models
      </span>
    </div>
    <div class="overflow-x-auto">
      <table class="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
        <thead class="bg-gray-50 dark:bg-gray-700">
          <tr>
            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Model</th>
            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Provider</th>
            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Requests</th>
            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Latency</th>
            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Status</th>
          </tr>
        </thead>
        <tbody class="divide-y divide-gray-200 dark:divide-gray-700">
          {#each aiModels as model}
            <tr class="hover:bg-gray-50 dark:hover:bg-gray-700">
              <td class="px-6 py-4 whitespace-nowrap">
                <div class="flex items-center">
                  <Brain class="h-4 w-4 text-gray-400 mr-2" />
                  <span class="text-sm font-medium text-gray-900 dark:text-white">{model.name}</span>
                </div>
              </td>
              <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-400">{model.provider}</td>
              <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">{model.requests.toLocaleString()}</td>
              <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">{model.latency}ms</td>
              <td class="px-6 py-4 whitespace-nowrap">
                <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium {model.status === 'healthy' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}">
                  {model.status}
                </span>
              </td>
            </tr>
          {/each}
        </tbody>
      </table>
    </div>
  </div>

  <!-- Security Events & Policy Stats -->
  <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
    <!-- Security Events -->
    <div class="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
      <div class="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
        <div class="flex items-center space-x-2">
          <Shield class="h-5 w-5 text-red-500" />
          <h2 class="text-xl font-semibold text-gray-900 dark:text-white">Security Events</h2>
        </div>
        <p class="text-sm text-gray-600 dark:text-gray-400 mt-1">Blocked threats in real-time</p>
      </div>
      <div class="p-6">
        <div class="space-y-3">
          {#each securityEvents as event}
            {@const EventIcon = getEventIcon(event.type)}
            <div class="flex items-start space-x-3 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
              <div class="flex-shrink-0">
                <div class="w-8 h-8 {event.blocked ? 'bg-green-100 dark:bg-green-900' : 'bg-red-100 dark:bg-red-900'} rounded-full flex items-center justify-center">
                  {#if event.blocked}
                    <CheckCircle class="h-4 w-4 text-green-600 dark:text-green-400" />
                  {:else}
                    <XCircle class="h-4 w-4 text-red-600 dark:text-red-400" />
                  {/if}
                </div>
              </div>
              <div class="flex-1 min-w-0">
                <div class="flex items-center justify-between">
                  <p class="text-sm font-medium text-gray-900 dark:text-white truncate">{event.description}</p>
                  <span class="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium {getSeverityColor(event.severity)}">
                    {event.severity}
                  </span>
                </div>
                <div class="flex items-center mt-1 text-xs text-gray-500 dark:text-gray-400">
                  <span>{event.timestamp}</span>
                  <span class="mx-2">•</span>
                  <span>{event.user}</span>
                  <span class="mx-2">•</span>
                  <span class="text-green-600 dark:text-green-400 font-medium">Blocked</span>
                </div>
              </div>
            </div>
          {/each}
        </div>
      </div>
    </div>

    <!-- Policy Enforcement -->
    <div class="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
      <div class="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
        <div class="flex items-center space-x-2">
          <Filter class="h-5 w-5 text-blue-500" />
          <h2 class="text-xl font-semibold text-gray-900 dark:text-white">Policy Enforcement</h2>
        </div>
        <p class="text-sm text-gray-600 dark:text-gray-400 mt-1">Active security policies</p>
      </div>
      <div class="p-6">
        <div class="grid grid-cols-2 gap-4">
          {#each policyStats as policy}
            {@const Icon = policy.icon}
            <div class="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
              <div class="flex items-center justify-between mb-2">
                <Icon class="h-5 w-5 text-blue-600 dark:text-blue-400" />
                <span class="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800">
                  {policy.status}
                </span>
              </div>
              <p class="text-sm font-medium text-gray-900 dark:text-white">{policy.name}</p>
              <p class="text-2xl font-bold text-blue-600 dark:text-blue-400 mt-1">{policy.blocks.toLocaleString()}</p>
              <p class="text-xs text-gray-500 dark:text-gray-400">violations blocked</p>
            </div>
          {/each}
        </div>
      </div>
    </div>
  </div>

  <!-- NTT Value Proposition -->
  <div class="bg-gradient-to-r from-indigo-600 to-violet-600 rounded-xl p-6 text-white">
    <div class="flex items-start space-x-4">
      <div class="flex-shrink-0">
        <div class="w-12 h-12 bg-white/20 rounded-lg flex items-center justify-center">
          <span class="text-2xl">🏆</span>
        </div>
      </div>
      <div>
        <h3 class="text-xl font-bold">NTT + F5 Calypso: The AI Security Advantage</h3>
        <p class="text-indigo-100 mt-2">
          As the first F5 partner to integrate Calypso AI Gateway, NTT provides a complete <strong>AI Security & Governance</strong> solution. 
          Our proprietary NTT AI Governance Framework helps enterprises adopt AI confidently while meeting regulatory requirements.
        </p>
        <div class="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
          <div class="bg-white/10 backdrop-blur-sm rounded-lg p-3">
            <p class="font-semibold">🔒 Security First</p>
            <p class="text-sm text-indigo-100">Block prompt injection & data leakage</p>
          </div>
          <div class="bg-white/10 backdrop-blur-sm rounded-lg p-3">
            <p class="font-semibold">📊 Full Visibility</p>
            <p class="text-sm text-indigo-100">Monitor all AI usage organization-wide</p>
          </div>
          <div class="bg-white/10 backdrop-blur-sm rounded-lg p-3">
            <p class="font-semibold">⚡ Rapid Deployment</p>
            <p class="text-sm text-indigo-100">Production-ready in days, not months</p>
          </div>
        </div>
      </div>
    </div>
  </div>
</div>
