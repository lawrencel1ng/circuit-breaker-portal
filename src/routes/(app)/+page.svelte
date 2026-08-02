<script lang="ts">
  import { onMount, onDestroy } from 'svelte';
  import { circuitBreakerStore, circuitBreakerActions } from '$lib/stores/circuitBreakerStore';
  import { notificationStore } from '$lib/stores/notificationStore';
  import { initializeRealtimeUpdates, liveMetrics, systemHealth, isRealtimeConnected } from '$lib/stores/liveDashboardStore';
  import LaneCard from '$lib/components/LaneCard.svelte';
  import TrafficFlowDiagram from '$lib/components/TrafficFlowDiagram.svelte';
  import DashboardCharts from '$lib/components/DashboardCharts.svelte';
  import QuickStats from '$lib/components/QuickStats.svelte';
  import RecentLogs from '$lib/components/RecentLogs.svelte';
  import DemoScenarios from '$lib/components/DemoScenarios.svelte';
  import SystemHealthMonitor from '$lib/components/SystemHealthMonitor.svelte';
  import type { CircuitBreakerConfig, Lane } from '$lib/types';
  import { Activity, Zap, AlertTriangle, TrendingUp, Wifi, WifiOff, ChevronDown, ChevronUp } from 'lucide-svelte';

  let config: CircuitBreakerConfig | undefined = undefined;
  let lanes: Lane[] = [];
  let cleanupRealtime: (() => void) | undefined;
  let expandedPhases: Record<string, boolean> = {};

  $: config = $circuitBreakerStore;
  $: lanes = $circuitBreakerStore?.lanes || [];

  function togglePhase(phaseId: string) {
    expandedPhases[phaseId] = !expandedPhases[phaseId];
    expandedPhases = { ...expandedPhases };
  }

  onMount(() => {
    // Initialize real-time WebSocket updates
    cleanupRealtime = initializeRealtimeUpdates();
    
    // Load initial configuration
    circuitBreakerActions.loadConfig();

    // Simulate real-time updates (disabled during demo scenarios)
    const interval = setInterval(() => {
      // Only simulate health changes if no demo scenario is running
      if (!document.querySelector('[data-demo-running="true"]')) {
        circuitBreakerStore.update(currentConfig => {
          const updatedLanes = currentConfig.lanes.map(lane => {
            // Simulate occasional health changes
            if (Math.random() < 0.05) { // Reduced frequency
              const healthStatuses = ['healthy', 'degraded', 'down'] as const;
              const randomHealth = healthStatuses[Math.floor(Math.random() * healthStatuses.length)];
              return { ...lane, healthStatus: randomHealth };
            }
            return lane;
          });
          return { ...currentConfig, lanes: updatedLanes };
        });
      }
    }, 15000); // Update every 15 seconds

    return () => {
      clearInterval(interval);
      if (cleanupRealtime) cleanupRealtime();
    };
  });
  
  onDestroy(() => {
    if (cleanupRealtime) cleanupRealtime();
  });

  function getOverallStatus() {
    const activeLanes = lanes.filter(lane => lane.edgeStatus === 'active' && lane.enterpriseStatus === 'active');
    const healthyLanes = activeLanes.filter(lane => lane.healthStatus === 'healthy');
    
    if (healthyLanes.length === activeLanes.length && activeLanes.length > 0) {
      return 'healthy';
    } else if (healthyLanes.length > 0) {
      return 'degraded';
    } else {
      return 'down';
    }
  }

  function getStatusColor(status: string) {
    switch (status) {
      case 'healthy': return 'text-green-600 dark:text-green-400';
      case 'degraded': return 'text-yellow-600 dark:text-yellow-400';
      case 'down': return 'text-red-600 dark:text-red-400';
      default: return 'text-gray-600 dark:text-gray-400';
    }
  }

  function getStatusIcon(status: string) {
    switch (status) {
      case 'healthy': return '🟢';
      case 'degraded': return '🟡';
      case 'down': return '🔴';
      default: return '⚪';
    }
  }


  function getStatusText(status: string) {
    switch (status) {
      case 'healthy':
        return 'All Systems Operational';
      case 'degraded':
        return 'Some Issues Detected';
      case 'down':
        return 'System Down';
      default:
        return 'Unknown Status';
    }
  }

  // Quick Actions Handlers
  function handleActivateAllLanes() {
    lanes.forEach(lane => {
      if (lane.edgeStatus !== 'active' || lane.enterpriseStatus !== 'active') {
        circuitBreakerActions.updateLaneStatus(lane.id, 'active', 'active');
      }
    });
    notificationStore.add({
      type: 'success',
      title: 'All Lanes Activated',
      message: 'All circuit breaker lanes have been activated'
    });
  }

  function handleFailoverToLane2() {
    lanes.forEach(lane => {
      if (lane.id !== 'lane-2') {
        circuitBreakerActions.updateLaneStatus(lane.id, 'inactive', 'inactive');
      } else {
        circuitBreakerActions.updateLaneStatus(lane.id, 'active', 'active');
      }
    });
    notificationStore.add({
      type: 'info',
      title: 'Failover Initiated',
      message: 'Traffic has been failed over to Lane 2'
    });
  }

  function handleToggleMaintenanceMode() {
    if (!config) return;
    const newMaintenanceMode = !config.systemSettings.maintenanceMode;
    circuitBreakerStore.update(cfg => ({
      ...cfg,
      systemSettings: {
        ...cfg.systemSettings,
        maintenanceMode: newMaintenanceMode
      }
    }));
    notificationStore.add({
      type: 'info',
      title: 'Maintenance Mode',
      message: `Maintenance mode ${newMaintenanceMode ? 'enabled' : 'disabled'}`
    });
  }

  // Roadmap data
  const roadmapPhases = [
    {
      id: 'phase1',
      name: 'Phase 1: Core Foundation',
      status: 'completed',
      color: 'green',
      quarter: 'Q2 2026',
      items: [
        { name: 'Self-Service Application Deployments (AS3)', desc: 'Declarative L4-L7 app services via F5 Automation Toolchain' },
        { name: 'Circuit Breaker Management', desc: 'Multi-lane traffic control with iControl REST API integration' },
        { name: 'AWAF Policy Automation', desc: 'Automated WAF policy deployment with OWASP Top 10 compliance' },
        { name: 'Basic Monitoring Dashboard', desc: 'Real-time health monitoring and alerting' }
      ],
      businessImpact: ['4–6 week → 1–2 week deployments', '70% fewer manual deployment steps', 'Audit-ready WAF baselines from day 1'],
      roi: '~8 months payback',
      enterpriseValue: 'Operational Excellence',
      requirements: 'F5 BIG-IP LTM, AWAF, AS3 Extension',
      differentiator: 'NTT Value: Automated compliance validation with bank-specific security baselines'
    },
    {
      id: 'phase2',
      name: 'Phase 2: Secure Web Gateway',
      status: 'in_progress',
      color: 'indigo',
      quarter: 'Q3 2026',
      items: [
        { name: 'Explicit Forward Proxy (SWG)', desc: 'Layer 3/7 proxy with URL filtering and content inspection' },
        { name: 'SSL Orchestrator (SSLO)', desc: 'Dynamic SSL/TLS interception with service chaining' },
        { name: 'Access Policy Manager (APM)', desc: 'SSO, MFA, and adaptive authentication workflows' },
        { name: 'NTLM/Kerberos Integration', desc: 'Transparent authentication with legacy systems' },
        { name: 'Layered Security Policies', desc: 'Multi-tier policy enforcement with dynamic bypass rules' }
      ],
      businessImpact: ['Single platform replaces 3 point products', '80% fewer shadow-IT incidents', 'Policy Simulator cuts troubleshooting from days to minutes'],
      roi: '~10 months payback',
      enterpriseValue: 'Consolidated Security Stack',
      requirements: 'F5 SWG, SSLO, APM, URLDB License',
      differentiator: 'NTT Value: Pre-built banking compliance policy templates (PCI-DSS, MAS TRM)'
    },
    {
      id: 'phase3',
      name: 'Phase 3: Intelligent Automation',
      status: 'planned',
      color: 'amber',
      quarter: 'Q4 2026',
      items: [
        { name: 'Declarative Onboarding (DO)', desc: 'Automated L1-L3 device provisioning and licensing' },
        { name: 'Telemetry Streaming (TS)', desc: 'Real-time metrics to Splunk/Datadog/SIEM' },
        { name: 'Blue-Green Deployments', desc: 'Zero-downtime app deployments with automatic rollback' },
        { name: 'DNS/GSLB Automation', desc: 'Global traffic management with health-based routing' },
        { name: 'Auto-Remediation', desc: 'Self-healing pool member management' },
        { name: 'Configuration Drift Detection', desc: 'Continuous compliance monitoring with auto-remediation' }
      ],
      businessImpact: ['MTTR 4 hrs → 15 mins (auto-remediation)', '99.99% availability via blue-green rollouts', 'Continuous drift detection eliminates config debt'],
      roi: '~12 months payback',
      enterpriseValue: 'Self-Healing Infrastructure',
      requirements: 'DO/TS Extensions, BIG-IP DNS, iControl REST',
      differentiator: 'NTT Value: AI-powered anomaly detection for predictive failure prevention'
    },
    {
      id: 'phase4',
      name: 'Phase 4: Multi-Cloud & DevOps',
      status: 'planned',
      color: 'cyan',
      quarter: 'Q1 2027',
      items: [
        { name: 'BIG-IQ Centralized Management', desc: 'Unified control across 1000+ devices' },
        { name: 'Container Ingress Services (CIS)', desc: 'Kubernetes/OpenShift integration' },
        { name: 'Terraform/Ansible Modules', desc: 'Infrastructure-as-code for F5 deployments' },
        { name: 'Multi-Cloud Routing', desc: 'AWS/Azure/GCP traffic orchestration' },
        { name: 'Service Discovery', desc: 'Auto-scaling integration with cloud-native apps' },
        { name: 'CI/CD Pipeline Integration', desc: 'GitOps workflow for app delivery' }
      ],
      businessImpact: ['Single pane of glass across AWS/Azure/GCP', '10x faster IaC-driven provisioning', 'Consistent policy across all clouds and containers'],
      roi: '~14 months payback',
      enterpriseValue: 'Cloud-Agnostic Flexibility',
      requirements: 'BIG-IQ, CIS, Terraform Provider, Cloud Provider APIs',
      differentiator: 'NTT Value: NTT Cloud Managed Services integration with unified management'
    },
    {
      id: 'phase5',
      name: 'Phase 5: Intelligent Automation & AI Ops',
      status: 'planned',
      color: 'violet',
      quarter: 'Q2 2027',
      items: [
        { name: 'Automation Orchestrator', desc: 'Unified dashboard for all automation workflows' },
        { name: 'Scheduled Automation Engine', desc: 'Cron-like scheduler for recurring F5 operations' },
        { name: 'Configuration Template Library', desc: 'Reusable AS3/DO templates with approval workflows' },
        { name: 'Event-Driven Automation', desc: 'Real-time response to alerts and CI/CD events' },
        { name: 'Batch Operations', desc: 'Mass changes across hundreds of devices with staged rollouts' },
        { name: 'AI-Driven Traffic Analytics', desc: 'ML-based traffic pattern analysis' },
        { name: 'Intelligent Bot Defense', desc: 'Advanced bot mitigation with behavioral AI (99.2% accuracy)' },
        { name: 'Automated Threat Response', desc: 'SOAR integration for instant mitigation' }
      ],
      businessImpact: ['80% reduction in manual operational tasks', '95% fewer false-positive security alerts', 'Sub-second automated incident response'],
      roi: '~9 months payback',
      enterpriseValue: 'AI-Powered Operations',
      requirements: 'BIG-IQ, AWAF with AI, SOAR Platform, Automation Engine',
      differentiator: 'NTT Value: Industry-leading automation framework with 80% reduction in manual tasks'
    },
    {
      id: 'phase6',
      name: 'Phase 6: Service Provider Platform',
      status: 'planned',
      color: 'rose',
      quarter: 'Q3 2027',
      items: [
        { name: 'Multi-Tenant Portal', desc: 'White-label customer self-service portal with complete isolation' },
        { name: 'Customer Analytics', desc: 'Per-tenant visibility, SLA dashboards, and usage reporting' },
        { name: 'Service Catalog', desc: 'Pre-approved service templates marketplace with approval gates' },
        { name: 'SLA Monitoring', desc: 'Automated SLA compliance tracking with breach alerts' },
        { name: 'Usage-Based Billing', desc: 'Automated metering and chargeback for internal/external tenants' },
        { name: 'Managed Service Integration', desc: '24/7 NTT SOC integration with escalation workflows' }
      ],
      businessImpact: ['80%+ self-service adoption frees ops team', 'F5-as-a-Service new revenue stream', 'Per-tenant SLA breach detection in real time'],
      roi: 'Enables new revenue streams',
      enterpriseValue: 'F5-as-a-Service Monetisation',
      requirements: 'BIG-IQ Centralized Management, Custom Development',
      differentiator: 'NTT Value: NTT Global SOC + F5 expertise as an integrated service'
    },
    {
      id: 'phase7',
      name: 'Phase 7: AI Gateway & LLM Security',
      status: 'planned',
      color: 'violet',
      quarter: 'Q4 2027',
      items: [
        { name: 'F5 Calypso AI Gateway', desc: 'Unified control point for all AI/LLM traffic' },
        { name: 'LLM Security & Prompt Protection', desc: 'Block prompt injection and data leakage in real time' },
        { name: 'AI Model Observability', desc: 'Monitor token usage, latency, quality, and cost per model' },
        { name: 'Shadow AI Prevention', desc: 'Discover and control unauthorized AI tool usage enterprise-wide' },
        { name: 'PII Detection in AI', desc: 'Automatic redaction of sensitive data in prompts and responses' },
        { name: 'AI Threat Protection', desc: 'Real-time defense against AI-specific attacks and model abuse' }
      ],
      businessImpact: ['First-mover AI security advantage', 'Prevent costly data leakage via LLM', 'Governance-ready for MAS/MPA AI guidelines'],
      roi: 'Risk mitigation value (avg breach cost ~$4.5M)',
      enterpriseValue: 'Secure AI Adoption',
      requirements: 'F5 Calypso, AWAF with AI, API Gateway',
      differentiator: 'NTT Value: First F5 partner with integrated AI security + NTT AI governance framework'
    },
    {
      id: 'phase8',
      name: 'Phase 8: AI Governance & Optimisation',
      status: 'planned',
      color: 'fuchsia',
      quarter: 'Q1 2028',
      items: [
        { name: 'AI Policy Engine', desc: 'Enforce approved models and data handling rules per department' },
        { name: 'Intelligent LLM Routing', desc: 'Route prompts to optimal model based on task and compliance rules' },
        { name: 'AI Response Caching', desc: 'Cache common AI responses to reduce token costs by up to 40%' },
        { name: 'Multi-Model Orchestration', desc: 'Seamless failover between OpenAI, Azure, Anthropic, and others' },
        { name: 'AI Usage Analytics', desc: 'Per-department AI adoption, utilisation, and spend metrics' },
        { name: 'GenAI Compliance Reporting', desc: 'Audit trails to satisfy emerging regulatory AI requirements' }
      ],
      businessImpact: ['40% reduction in AI/LLM API costs', 'Enterprise-wide AI governance at scale', 'Compliance-ready for emerging AI regulations'],
      roi: '40% LLM cost savings within 6 months',
      enterpriseValue: 'AI Cost & Compliance Control',
      requirements: 'F5 Calypso, BIG-IQ, Data Lake',
      differentiator: 'NTT Value: AI governance expertise + cross-industry AI best practices from global deployments'
    },
    {
      id: 'phase9',
      name: 'Phase 9: Compliance & Governance',
      status: 'planned',
      color: 'sky',
      quarter: 'Q2 2028',
      items: [
        { name: 'PCI-DSS 4.0 Automation', desc: 'Payment card industry compliance templates with continuous monitoring' },
        { name: 'MAS TRM Compliance', desc: 'Singapore banking Technology Risk Management regulation support' },
        { name: 'SOC 2 Type II Controls', desc: 'Service organization control automation with evidence collection' },
        { name: 'ISO 27001 Alignment', desc: 'Information security management compliance reporting' },
        { name: 'Continuous Compliance Scoring', desc: 'Real-time compliance health score across all frameworks' },
        { name: 'Automated Audit Evidence', desc: 'One-click audit-ready evidence packages for regulators' },
        { name: 'Drift Remediation', desc: 'Auto-fix non-compliant configurations within defined windows' }
      ],
      businessImpact: ['90% reduction in audit preparation time', 'Continuous compliance vs point-in-time checks', 'Automated evidence eliminates manual audit burden'],
      roi: '90% compliance audit time savings',
      enterpriseValue: 'Continuous Regulatory Compliance',
      requirements: 'BIG-IQ, AWAF, APM',
      differentiator: 'NTT Value: Banking-specific compliance templates + audit-ready reports pre-built for MAS TRM and PCI-DSS 4.0'
    },
    {
      id: 'phase10',
      name: 'Phase 10: Advanced Security SOC',
      status: 'planned',
      color: 'orange',
      quarter: 'Q3 2028',
      items: [
        { name: 'NTT Global Threat Intelligence', desc: 'Cross-customer IOC feeds from NTT\'s global managed security network' },
        { name: 'Threat Hunting', desc: 'Proactive adversary detection using behavioural analytics' },
        { name: 'XDR Integration', desc: 'Extended detection and response across endpoint, network, and cloud' },
        { name: 'SOAR Playbook Automation', desc: 'Automated incident response playbooks with F5 policy updates' },
        { name: 'Deception Technology', desc: 'Honeypots and decoy services to detect lateral movement' },
        { name: '24/7 NTT SOC Service', desc: 'Fully managed security operations with guaranteed SLA' }
      ],
      businessImpact: ['15 min faster threat detection vs industry average', '80% fewer security incidents with proactive hunting', '24/7 expert coverage without hiring a 10-person SOC'],
      roi: 'Replaces $2–3M internal SOC build cost',
      enterpriseValue: 'Managed Threat Defence',
      requirements: 'AWAF with AI, BIG-IQ, SOAR Platform, NTT SOC',
      differentiator: 'NTT Value: Global threat intelligence from 100+ enterprise deployments + 24/7 NTT SOC'
    },
    {
      id: 'phase11',
      name: 'Phase 11: Developer Experience',
      status: 'planned',
      color: 'pink',
      quarter: 'Q4 2028',
      items: [
        { name: 'Developer Self-Service Portal', desc: 'Self-service API access and documentation without IT tickets' },
        { name: 'API Sandbox Environment', desc: 'Test F5 configurations safely without production risk' },
        { name: 'Auto-Generated SDKs', desc: 'Python, Go, Java SDKs auto-generated from OpenAPI specs' },
        { name: 'GitOps Integration', desc: 'Deploy F5 configs via Git push with automated validation' },
        { name: 'Pre-Built AS3/DO Templates', desc: 'Curated template library for 50+ common enterprise scenarios' },
        { name: 'Local Dev Emulator', desc: 'Run F5 logic locally for rapid development cycles' }
      ],
      businessImpact: ['10x faster developer onboarding to F5', '90% of routine changes via self-service', 'Eliminates the F5 skills bottleneck across teams'],
      roi: 'Talent multiplier — maximises existing F5 investment',
      enterpriseValue: 'Developer-Led Infrastructure',
      requirements: 'AS3, DO, CIS, BIG-IQ API',
      differentiator: 'NTT Value: Developer advocates + custom training programs + NTT Centre of Excellence'
    }
  ];
</script>

<svelte:head>
  <title>F5 Automation Control Center</title>
</svelte:head>

<div class="space-y-8">
  <!-- Header -->
  <div class="text-center bg-gradient-to-r from-blue-600 to-blue-800 dark:from-blue-800 dark:to-blue-900 rounded-xl p-8 text-white">
    <div class="mb-4">
      <h1 class="text-4xl font-bold mb-2">
        F5 Automation Control Center
      </h1>
      <p class="text-xl text-blue-100">
        NTT Enterprise Automation & Orchestration Platform
      </p>
      <p class="text-sm text-blue-200 mt-2">
        Enterprise-grade automation, monitoring, and orchestration for F5 BIG-IP infrastructure
      </p>
    </div>
    
          <!-- System Status Badge -->
          <div class="inline-flex items-center px-6 py-3 bg-white/20 backdrop-blur-sm rounded-full">
            <span class="text-2xl mr-3">{getStatusIcon(getOverallStatus())}</span>
            <span class="text-lg font-semibold">{getStatusText(getOverallStatus())}</span>
          </div>
          
          <!-- Demo Status Indicator -->
          <div class="mt-4 text-sm text-blue-100">
            <span class="inline-flex items-center px-3 py-1 bg-white/10 rounded-full">
              <span class="w-2 h-2 bg-green-400 rounded-full mr-2 animate-pulse"></span>
              Demo Mode Active
            </span>
          </div>
    
    <p class="text-sm text-blue-100 mt-4">
      Last updated: {new Date().toLocaleTimeString()}
    </p>
  </div>

  <!-- F5 Integration Roadmap -->
  <div class="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
    <div class="flex items-center justify-between mb-6">
      <div>
        <h2 class="text-2xl font-bold text-gray-900 dark:text-white">F5 Integration Roadmap</h2>
        <p class="text-sm text-gray-500 dark:text-gray-400 mt-1">
          Comprehensive automation journey from core deployment to AI-powered managed services
        </p>
      </div>
      <div class="flex items-center space-x-4 text-sm">
        <div class="flex items-center space-x-1">
          <div class="w-3 h-3 bg-green-500 rounded-full"></div>
          <span class="text-gray-600 dark:text-gray-400">Completed</span>
        </div>
        <div class="flex items-center space-x-1">
          <div class="w-3 h-3 bg-indigo-500 rounded-full"></div>
          <span class="text-gray-600 dark:text-gray-400">In Progress</span>
        </div>
        <div class="flex items-center space-x-1">
          <div class="w-3 h-3 bg-gray-400 rounded-full"></div>
          <span class="text-gray-600 dark:text-gray-400">Planned</span>
        </div>
      </div>
    </div>

    <!-- Horizontal Timeline -->
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
      {#each roadmapPhases as phase}
        <div class="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden hover:shadow-md transition-shadow flex flex-col">
          <!-- Phase Header -->
          <button
            class="w-full p-4 text-left bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
            on:click={() => togglePhase(phase.id)}
          >
            <div class="flex items-center justify-between">
              <div class="flex items-center space-x-2">
                <div class="w-3 h-3 rounded-full flex-shrink-0" class:bg-green-500={phase.status === 'completed'} class:bg-indigo-500={phase.status === 'in_progress'} class:bg-gray-400={phase.status === 'planned'}></div>
                <h3 class="text-sm font-bold text-gray-900 dark:text-white">{phase.name}</h3>
              </div>
              {#if expandedPhases[phase.id]}
                <ChevronUp class="w-4 h-4 text-gray-500 flex-shrink-0" />
              {:else}
                <ChevronDown class="w-4 h-4 text-gray-500 flex-shrink-0" />
              {/if}
            </div>
            <div class="mt-2 flex items-center justify-between">
              <span class="text-xs text-gray-500 dark:text-gray-400">{phase.items.length} capabilities</span>
              <span class="text-xs font-medium px-2 py-0.5 rounded-full
                {phase.status === 'completed' ? 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300' :
                 phase.status === 'in_progress' ? 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-300' :
                 'bg-gray-100 text-gray-600 dark:bg-gray-600 dark:text-gray-300'}">{phase.quarter}</span>
            </div>
            <!-- Enterprise Value Badge -->
            <div class="mt-2 text-xs font-semibold text-amber-700 dark:text-amber-400">
              ↗ {phase.enterpriseValue}
            </div>
          </button>

          <!-- Phase Content -->
          <div class="p-3 space-y-2 bg-white dark:bg-gray-800 {expandedPhases[phase.id] ? '' : 'max-h-40 overflow-hidden'}" class:expanded={expandedPhases[phase.id]}>
            {#each phase.items as item}
              <div class="text-xs">
                <div class="font-medium text-gray-800 dark:text-gray-200">{item.name}</div>
                {#if expandedPhases[phase.id]}
                  <div class="text-gray-500 dark:text-gray-400 mt-1 leading-relaxed">{item.desc}</div>
                {/if}
              </div>
            {/each}
          </div>

          <!-- Business Impact (shown when expanded) -->
          {#if expandedPhases[phase.id]}
            <div class="mx-3 mb-2 p-2 bg-green-50 dark:bg-green-900/20 rounded border border-green-200 dark:border-green-800">
              <div class="text-xs font-semibold text-green-800 dark:text-green-300 mb-1">Business Impact</div>
              {#each phase.businessImpact as impact}
                <div class="text-xs text-green-700 dark:text-green-400 flex items-start">
                  <span class="mr-1 mt-0.5">✓</span>{impact}
                </div>
              {/each}
              <div class="mt-1.5 text-xs font-medium text-green-800 dark:text-green-300 border-t border-green-200 dark:border-green-700 pt-1">
                ROI: {phase.roi}
              </div>
            </div>
          {/if}

          <!-- Footer -->
          <div class="px-3 pb-3 bg-white dark:bg-gray-800 mt-auto">
            <div class="text-xs text-gray-500 dark:text-gray-500 border-t border-gray-200 dark:border-gray-700 pt-2">
              <span class="font-medium">Req:</span> {phase.requirements}
            </div>
            {#if expandedPhases[phase.id]}
              <div class="mt-2 p-2 bg-blue-50 dark:bg-blue-900/20 rounded text-xs text-blue-700 dark:text-blue-300">
                <span class="font-semibold">🏆 {phase.differentiator}</span>
              </div>
            {/if}
          </div>
        </div>
      {/each}
    </div>

    <!-- NTT Differentiation Banner -->
    <div class="mt-6 p-5 bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20 border border-amber-200 dark:border-amber-800 rounded-lg">
      <div class="flex items-start space-x-3 mb-4">
        <div class="flex-shrink-0 w-10 h-10 bg-amber-500 rounded-full flex items-center justify-center">
          <span class="text-white text-lg">⭐</span>
        </div>
        <div>
          <h3 class="text-lg font-semibold text-amber-900 dark:text-amber-300">NTT Differentiation: The Only End-to-End F5 Platform SI</h3>
          <p class="text-sm text-amber-800 dark:text-amber-400 mt-1">
            While most SIs offer basic F5 deployment services, NTT provides a <strong>comprehensive automation platform</strong>
            with proprietary orchestration, AI-powered operations, and 24/7 SOC integration — evolving from a deployment
            tool to a <strong>white-label F5-as-a-Service provider portal</strong> for internal business units or external customers.
          </p>
        </div>
      </div>
      <!-- ROI Metrics Grid -->
      <div class="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div class="bg-white/70 dark:bg-gray-800/50 rounded-lg p-3 text-center border border-amber-200 dark:border-amber-700">
          <div class="text-2xl font-bold text-amber-700 dark:text-amber-300">80%</div>
          <div class="text-xs text-amber-600 dark:text-amber-400 mt-0.5">Reduction in manual ops tasks</div>
        </div>
        <div class="bg-white/70 dark:bg-gray-800/50 rounded-lg p-3 text-center border border-amber-200 dark:border-amber-700">
          <div class="text-2xl font-bold text-amber-700 dark:text-amber-300">15 min</div>
          <div class="text-xs text-amber-600 dark:text-amber-400 mt-0.5">MTTR (vs 4 hrs industry avg)</div>
        </div>
        <div class="bg-white/70 dark:bg-gray-800/50 rounded-lg p-3 text-center border border-amber-200 dark:border-amber-700">
          <div class="text-2xl font-bold text-amber-700 dark:text-amber-300">90%</div>
          <div class="text-xs text-amber-600 dark:text-amber-400 mt-0.5">Audit preparation time saved</div>
        </div>
        <div class="bg-white/70 dark:bg-gray-800/50 rounded-lg p-3 text-center border border-amber-200 dark:border-amber-700">
          <div class="text-2xl font-bold text-amber-700 dark:text-amber-300">40%</div>
          <div class="text-xs text-amber-600 dark:text-amber-400 mt-0.5">AI/LLM API cost reduction</div>
        </div>
      </div>
      <!-- USP Tags -->
      <div class="mt-3 flex flex-wrap gap-2">
        {#each ['Only SI with integrated AI Security', 'Banking-specific MAS TRM templates', 'White-label F5-as-a-Service', '24/7 NTT Global SOC', 'Cross-customer Threat Intelligence', 'GitOps & IaC native'] as usp}
          <span class="px-2 py-1 text-xs font-medium bg-amber-100 dark:bg-amber-900/40 text-amber-800 dark:text-amber-300 rounded-full border border-amber-300 dark:border-amber-700">
            ✓ {usp}
          </span>
        {/each}
      </div>
    </div>
  </div>

  <!-- System Health Monitor -->
  <SystemHealthMonitor />

  <!-- Key Metrics Dashboard -->
  <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
    <!-- Active Lanes -->
    <div class="card p-6 bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20 border-green-200 dark:border-green-700">
      <div class="flex items-center justify-between">
        <div>
          <div class="flex items-center space-x-2">
            <p class="text-sm font-medium text-green-600 dark:text-green-400">Active Lanes</p>
            {#if $isRealtimeConnected}
              <Wifi class="h-3 w-3 text-green-500" />
            {:else}
              <WifiOff class="h-3 w-3 text-gray-400" />
            {/if}
          </div>
          <p class="text-3xl font-bold text-green-700 dark:text-green-300">
            {$liveMetrics.activeLanes || lanes.filter(l => l.edgeStatus === 'active' && l.enterpriseStatus === 'active').length}
          </p>
        </div>
        <div class="w-12 h-12 bg-green-500 rounded-full flex items-center justify-center">
          <Activity class="h-6 w-6 text-white" />
        </div>
      </div>
    </div>

    <!-- Applications -->
    <div class="card p-6 bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 border-blue-200 dark:border-blue-700">
      <div class="flex items-center justify-between">
        <div>
          <p class="text-sm font-medium text-blue-600 dark:text-blue-400">Total Applications</p>
          <p class="text-3xl font-bold text-blue-700 dark:text-blue-300">
            {$liveMetrics.totalApplications || config?.applications?.length || 0}
          </p>
        </div>
        <div class="w-12 h-12 bg-blue-500 rounded-full flex items-center justify-center">
          <Zap class="h-6 w-6 text-white" />
        </div>
      </div>
    </div>

    <!-- Servers -->
    <div class="card p-6 bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-800/20 border-purple-200 dark:border-purple-700">
      <div class="flex items-center justify-between">
        <div>
          <p class="text-sm font-medium text-purple-600 dark:text-purple-400">Total Servers</p>
          <p class="text-3xl font-bold text-purple-700 dark:text-purple-300">
            {$liveMetrics.totalServers || lanes.reduce((total, lane) => total + (lane.edgeLoadBalancer?.poolMembers?.length || 0) + (lane.enterpriseLoadBalancer?.poolMembers?.length || 0), 0)}
          </p>
        </div>
        <div class="w-12 h-12 bg-purple-500 rounded-full flex items-center justify-center">
          <TrendingUp class="h-6 w-6 text-white" />
        </div>
      </div>
    </div>

    <!-- System Health Score -->
    <div class="card p-6 bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-900/20 dark:to-orange-800/20 border-orange-200 dark:border-orange-700">
      <div class="flex items-center justify-between">
        <div>
          <p class="text-sm font-medium text-orange-600 dark:text-orange-400">System Health</p>
          <div class="flex items-baseline space-x-1">
            <p class="text-3xl font-bold text-orange-700 dark:text-orange-300">
              {$systemHealth.status === 'healthy' ? '98' : $systemHealth.status === 'degraded' ? '75' : '45'}%
            </p>
            <span class="text-sm text-orange-600 dark:text-orange-400 capitalize">{$systemHealth.status}</span>
          </div>
        </div>
        <div class="w-12 h-12 bg-orange-500 rounded-full flex items-center justify-center">
          <AlertTriangle class="h-6 w-6 text-white" />
        </div>
      </div>
      {#if $systemHealth.issues.length > 0}
        <div class="mt-3 text-xs text-orange-600 dark:text-orange-400">
          {$systemHealth.issues.length} active issue{$systemHealth.issues.length !== 1 ? 's' : ''}
        </div>
      {/if}
    </div>
  </div>

          <!-- Dashboard Charts -->
          <DashboardCharts {config} />

          <!-- Quick Stats -->
          <QuickStats {config} />

  <!-- Traffic Flow Diagram -->
  <div class="card p-6">
    <h2 class="text-xl font-semibold text-gray-900 dark:text-white mb-4">Traffic Flow Overview</h2>
    <TrafficFlowDiagram {lanes} />
  </div>

  <!-- Demo Scenarios -->
  <DemoScenarios />

  <!-- Lane Overview -->
  <div class="card p-6">
    <div class="flex items-center justify-between mb-6">
      <h2 class="text-xl font-semibold text-gray-900 dark:text-white">Lane Status Overview</h2>
      <div class="text-sm text-gray-500 dark:text-gray-400">
        Last updated: {new Date().toLocaleTimeString()}
      </div>
    </div>
    
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {#each lanes as lane (lane.id)}
        <LaneCard {lane} />
      {/each}
    </div>
  </div>

  <!-- Recent Activity -->
  <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
    <RecentLogs {config} />
    
    <!-- Quick Actions -->
    <div class="card p-6">
      <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-4">Quick Actions</h3>
      <div class="space-y-3">
        <button
          class="w-full btn-primary text-left"
          on:click={handleActivateAllLanes}
        >
          Activate All Lanes
        </button>
        <button
          class="w-full btn-secondary text-left"
          on:click={handleFailoverToLane2}
        >
          Failover to Lane 2
        </button>
        <button
          class="w-full btn-secondary text-left"
          on:click={handleToggleMaintenanceMode}
        >
          {config?.systemSettings?.maintenanceMode ? 'Exit' : 'Enter'} Maintenance Mode
        </button>
      </div>
    </div>
  </div>
</div>

<style>
  .expanded {
    max-height: none !important;
  }
</style>
