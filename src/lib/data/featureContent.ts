/**
 * Educational content for all roadmap features
 * Used to provide contextual help and tutorials across the platform
 */

export interface FeatureContent {
  title: string;
  description: string;
  problemSolved: string;
  benefits: string[];
  useCases: string[];
  businessValue: string;
}

export const featureContent: Record<string, FeatureContent> = {
  // Phase 1: Core Foundation
  'self-service-deployment': {
    title: 'Self-Service Application Deployment',
    description: 'Enable application teams to deploy F5 configurations via an intuitive web interface using F5 AS3 (Application Services 3) declarative API.',
    problemSolved: 'Eliminates the bottleneck of manual ticket-based F5 configuration requests that can take days or weeks. Reduces dependency on specialized F5 engineers for routine deployments.',
    benefits: [
      'Reduce deployment time from weeks to minutes',
      'Eliminate configuration errors through validated templates',
      'Enable DevOps teams to self-serve infrastructure changes',
      'Maintain audit trail of all configuration changes',
      'Standardize deployments across environments'
    ],
    useCases: [
      'Developer needs to deploy a new microservice with load balancing',
      'QA team requires a test environment replica for validation',
      'Production deployment with zero-downtime cutover'
    ],
    businessValue: 'Accelerates time-to-market for new applications through streamlined deployment workflows.'
  },

  'circuit-breaker': {
    title: 'Circuit Breaker Management',
    description: 'Multi-lane traffic management system that provides granular control over traffic flow between Edge (GSLB) and Enterprise load balancers with automatic failover capabilities.',
    problemSolved: 'Traditional F5 deployments lack visibility into multi-tier traffic flows. When issues occur, operators struggle to identify which layer (Edge vs Enterprise) is causing problems and cannot quickly isolate traffic.',
    benefits: [
      'Visual traffic flow monitoring across all lanes',
      'One-click traffic isolation during incidents',
      'Automatic health-based failover between lanes',
      'Reduce MTTR (Mean Time to Repair) by 75%',
      'Prevent cascade failures through intelligent traffic management'
    ],
    useCases: [
      'Data center failure requires immediate traffic rerouting',
      'Blue-green deployment requires traffic splitting for canary testing',
      'DDoS attack requires isolating affected lanes while keeping others operational'
    ],
    businessValue: 'Provides operational confidence for complex deployments with automated failover and traffic management.'
  },

  'awaf-automation': {
    title: 'AWAF Policy Automation',
    description: 'Automated deployment and management of F5 Advanced WAF (Web Application Firewall) policies with OWASP Top 10 compliance and bot defense.',
    problemSolved: 'Manual WAF policy creation is complex, error-prone, and requires deep security expertise. Organizations struggle to maintain consistent security posture across hundreds of applications.',
    benefits: [
      'Automated OWASP Top 10 compliance validation',
      'One-click bot defense activation',
      'Standardized security policies across all applications',
      'Real-time attack monitoring and alerting',
      'Integration with threat intelligence feeds'
    ],
    useCases: [
      'New application requires immediate WAF protection before production',
      'Security audit requires proof of OWASP compliance',
      'Zero-day vulnerability requires rapid virtual patch deployment'
    ],
    businessValue: 'Reduces security incidents by 80% and ensures compliance with regulatory requirements.'
  },

  // Phase 2: Secure Web Gateway
  'forward-proxy': {
    title: 'Secure Web Gateway (SWG)',
    description: 'Enterprise forward proxy solution with URL filtering, content inspection, and granular access controls for outbound internet traffic.',
    problemSolved: 'Organizations need to control and monitor outbound web traffic for compliance, security, and productivity. Traditional solutions are complex to manage and lack integration with existing identity systems.',
    benefits: [
      'Category-based URL filtering with 100+ categories',
      'SSL/TLS decryption for comprehensive threat inspection',
      'Integration with Active Directory for user-based policies',
      'Bandwidth optimization through content caching',
      'Detailed audit logs for compliance reporting'
    ],
    useCases: [
      'Block access to malicious websites and phishing domains',
      'Prevent data exfiltration through web channels',
      'Enforce acceptable use policies for internet access',
      'PCI-DSS compliance requires monitoring outbound traffic'
    ],
    businessValue: 'Prevents data breaches and ensures regulatory compliance while maintaining user productivity.'
  },

  'ssl-orchestrator': {
    title: 'SSL Orchestrator (SSLO)',
    description: 'Centralized SSL/TLS inspection architecture that decrypts traffic once and intelligently steers it through multiple security services.',
    problemSolved: 'Multiple security tools (DLP, AV, IPS) each performing their own SSL decryption creates performance bottlenecks, certificate management nightmares, and security gaps.',
    benefits: [
      'Single point of decryption eliminates performance penalty',
      'Dynamic service chaining based on traffic type',
      'Simplified certificate lifecycle management',
      'Selective bypass for privacy-sensitive applications',
      'Visibility into encrypted threats'
    ],
    useCases: [
      'Inspect HTTPS traffic for malware without multiple decryption hops',
      'Route sensitive transactions through security inspection while bypassing low-risk traffic',
      'Maintain compliance while preserving privacy for healthcare data'
    ],
    businessValue: 'Improves security inspection performance by 300% while reducing operational complexity.'
  },

  'access-policy': {
    title: 'Access Policy Manager (APM)',
    description: 'Unified access control solution providing SSO, MFA, and adaptive authentication for applications and APIs.',
    problemSolved: 'Managing access to hundreds of applications with different authentication mechanisms creates user friction, security gaps, and administrative overhead.',
    benefits: [
      'Single sign-on (SSO) for all applications',
      'Multi-factor authentication (MFA) integration',
      'Risk-based adaptive authentication',
      'Granular per-application access policies',
      'Integration with identity providers (Azure AD, Okta)'
    ],
    useCases: [
      'Remote workforce requires secure access to internal applications',
      'Partner access needs time-limited, audited permissions',
      'High-risk transactions require step-up authentication'
    ],
    businessValue: 'Reduces helpdesk tickets by 40% and prevents unauthorized access to critical systems.'
  },

  // Phase 3: Intelligent Automation
  'declarative-onboarding': {
    title: 'Declarative Onboarding (DO)',
    description: 'Automated Layer 1-3 device provisioning that transforms F5 devices from factory state to production-ready in minutes using declarative JSON configurations.',
    problemSolved: 'Manual BIG-IP provisioning is time-consuming, error-prone, and inconsistent across devices. New deployments or disaster recovery scenarios require rapid, repeatable configuration.',
    benefits: [
      'Provision new F5 devices in minutes vs hours',
      'Consistent, repeatable configuration across all devices',
      'Infrastructure-as-code for network devices',
      'Automatic licensing and module provisioning',
      'Version-controlled device configurations'
    ],
    useCases: [
      'Rapid scale-out during high-traffic events',
      'Disaster recovery requiring immediate device replacement',
      'New data center deployment with multiple F5 instances'
    ],
    businessValue: 'Reduces device provisioning time by 90% and eliminates configuration drift.'
  },

  'telemetry-streaming': {
    title: 'Telemetry Streaming (TS)',
    description: 'Real-time streaming of F5 metrics, logs, and events to SIEM, monitoring, and analytics platforms with customizable data pipelines.',
    problemSolved: 'F5 devices generate valuable operational data, but extracting and normalizing it for external systems requires complex scripting and manual configuration.',
    benefits: [
      'Pre-built integrations with Splunk, Datadog, and ELK',
      'Customizable data filtering and transformation',
      'Sub-second latency for critical alerts',
      'Intelligent log filtering reduces data volume while preserving critical events',
      'Correlation of F5 data with application metrics'
    ],
    useCases: [
      'Security operations requires real-time WAF attack alerts',
      'Capacity planning needs historical traffic trend analysis',
      'Compliance audit requires automated log collection'
    ],
    businessValue: 'Enables proactive operations and reduces mean time to detect (MTTD) security incidents by 70%.'
  },

  'blue-green-deployment': {
    title: 'Blue-Green Deployment',
    description: 'Zero-downtime application deployment strategy that maintains two identical production environments and instantly switches traffic between them.',
    problemSolved: 'Traditional deployments require maintenance windows and carry risk of extended downtime if rollbacks are needed. Users experience interruptions during updates.',
    benefits: [
      'Zero-downtime deployments eliminate maintenance windows',
      'Instant rollback if issues are detected',
      'Validate production deployment before user traffic',
      'Reduce deployment risk and increase release frequency',
      'A/B testing capabilities for feature validation'
    ],
    useCases: [
      'Deploy critical banking application during business hours',
      'Test new feature with 5% of users before full rollout',
      'Emergency security patch requires immediate deployment'
    ],
    businessValue: 'Enables continuous deployment with 99.99% availability guarantees.'
  },

  'dns-gslb': {
    title: 'DNS/GSLB Automation',
    description: 'Global Server Load Balancing with automated health-based traffic routing across multiple data centers and cloud regions.',
    problemSolved: 'Manual DNS changes are slow and error-prone. Static DNS configurations cannot respond to real-time application health or performance conditions.',
    benefits: [
      'Automatic failover based on real-time health checks',
      'Geographic routing for lowest latency',
      'Weighted load distribution across data centers',
      'Integration with cloud auto-scaling groups',
      'DNSSEC support for security'
    ],
    useCases: [
      'Primary data center outage requires immediate traffic rerouting',
      'Global application requires geographic load distribution',
      'Cloud burst scenario needs hybrid traffic management'
    ],
    businessValue: 'Ensures continuous availability during infrastructure failures and optimizes global performance.'
  },

  'auto-remediation': {
    title: 'Pool Member Auto-Remediation',
    description: 'Intelligent self-healing system that automatically detects and responds to backend server failures without manual intervention.',
    problemSolved: 'Backend server failures require manual investigation and remediation, leading to extended outages and 3 AM wake-up calls for operations teams.',
    benefits: [
      'Automatic server disable on health check failure',
      'Intelligent restart of failed services',
      'Escalation to human operators for complex issues',
      'Predictive failure detection using trend analysis',
      'Integration with ITSM tools for ticket creation'
    ],
    useCases: [
      'Application server crashes and needs automatic restart',
      'Database connection pool exhaustion requires scaling',
      'Memory leak detected requiring service recycling'
    ],
    businessValue: 'Reduces operational toil by 60% and improves MTTR to under 2 minutes.'
  },

  'drift-detection': {
    title: 'Configuration Drift Detection',
    description: 'Continuous monitoring of F5 configurations against approved baselines with automated alerts and remediation options.',
    problemSolved: 'Manual configuration changes and emergency fixes accumulate over time, creating "snowflake" configurations that are difficult to maintain and audit.',
    benefits: [
      'Real-time drift detection with immediate alerting',
      'Automated remediation for known configuration issues',
      'Compliance reporting for audit requirements',
      'Visual diff showing exact configuration changes',
      'Integration with change management workflows'
    ],
    useCases: [
      'Unauthorized configuration change requires immediate notification',
      'Compliance audit requires proof of configuration compliance',
      'Post-incident review needs to identify configuration-related root causes'
    ],
    businessValue: 'Prevents security incidents from configuration errors and ensures audit compliance.'
  },

  // Phase 4: Multi-Cloud & DevOps
  'big-iq-management': {
    title: 'BIG-IQ Centralized Management',
    description: 'Unified management platform for controlling up to 1,000 F5 devices across hybrid and multi-cloud environments from a single pane of glass.',
    problemSolved: 'Managing dozens or hundreds of F5 devices individually is inefficient and error-prone. Lack of centralized visibility hampers troubleshooting and compliance.',
    benefits: [
      'Single dashboard for entire F5 fleet management',
      'Centralized policy deployment across all devices',
      'Unified license management and usage tracking',
      'Cross-device analytics and reporting',
      'Role-based access control for large teams'
    ],
    useCases: [
      'Enterprise with 100+ F5 devices needs unified management',
      'Multi-cloud deployment requires consistent policy enforcement',
      'Compliance requires centralized audit trail'
    ],
    businessValue: 'Reduces operational overhead by 50% for large-scale F5 deployments.'
  },

  'container-ingress': {
    title: 'Container Ingress Services (CIS)',
    description: 'Kubernetes-native ingress controller that integrates F5 BIG-IP with container orchestration platforms for advanced traffic management.',
    problemSolved: 'Basic Kubernetes ingress lacks enterprise features like advanced load balancing, WAF protection, and DDoS mitigation required for production workloads.',
    benefits: [
      'Native Kubernetes integration with CRDs',
      'Advanced L4-L7 traffic management for containers',
      'Automatic service discovery and pool member updates',
      'Consistent policies between containers and VMs',
      'Support for OpenShift, EKS, AKS, and GKE'
    ],
    useCases: [
      'Microservices application requires advanced traffic routing',
      'Containerized workloads need WAF protection',
      'Hybrid environment requires unified traffic management'
    ],
    businessValue: 'Enables enterprise-grade networking for cloud-native applications.'
  },

  'infrastructure-as-code': {
    title: 'Terraform & Ansible Modules',
    description: 'Official Infrastructure-as-Code modules for automating F5 deployments through CI/CD pipelines with version-controlled configurations.',
    problemSolved: 'Manual F5 configuration is not reproducible and cannot be integrated into DevOps workflows. Infrastructure changes lack version control and peer review.',
    benefits: [
      'Version-controlled infrastructure configurations',
      'Integration with GitOps workflows',
      'Automated testing of F5 configurations',
      'Consistent environments across dev/test/prod',
      'Peer review for infrastructure changes'
    ],
    useCases: [
      'DevOps team wants to include F5 in CI/CD pipeline',
      'Disaster recovery requires infrastructure recreation',
      'Multiple environments need consistent configurations'
    ],
    businessValue: 'Accelerates deployment velocity by 3x and eliminates configuration errors.'
  },

  // Phase 5: AI-Powered Operations
  'ai-analytics': {
    title: 'AI-Driven Traffic Analytics',
    description: 'Machine learning-powered analysis of traffic patterns to detect anomalies, predict failures, and optimize performance automatically.',
    problemSolved: 'Traditional threshold-based alerting generates too many false positives and misses subtle anomalies that indicate emerging problems.',
    benefits: [
      'Automatic baseline learning for dynamic thresholds',
      'Anomaly detection with 95% fewer false positives',
      'Predictive alerts before failures occur',
      'Capacity trend analysis and forecasting',
      'Automated root cause analysis'
    ],
    useCases: [
      'Early detection of DDoS attack before impact',
      'Predictive maintenance before hardware failure',
      'Automatic detection of application performance degradation'
    ],
    businessValue: 'Prevents outages and reduces alert fatigue by 80%.'
  },

  'bot-defense': {
    title: 'Intelligent Bot Defense',
    description: 'AI-powered bot detection and mitigation that distinguishes between good bots (search engines) and malicious bots (credential stuffing, scraping).',
    problemSolved: 'Traditional bot detection relies on static rules that are easily bypassed. Good bots get blocked while sophisticated bad bots evade detection.',
    benefits: [
      'Behavioral biometrics for bot detection',
      'Real-time threat intelligence integration',
      'Adaptive challenges that minimize user friction',
      'Protection against credential stuffing and account takeover',
      'API endpoint protection from automated attacks'
    ],
    useCases: [
      'E-commerce site targeted by credential stuffing attacks',
      'API endpoints flooded by scraping bots',
      'Login page overwhelmed by brute force attempts'
    ],
    businessValue: 'Prevents fraud losses and protects user accounts from compromise.'
  },

  // Phase 6: Service Provider Platform
  'multi-tenant-portal': {
    title: 'Multi-Tenant Portal',
    description: 'White-label customer portal that enables organizations to offer F5-as-a-Service to internal business units or external customers.',
    problemSolved: 'Large enterprises and service providers need to offer F5 services to multiple tenants while maintaining isolation and chargeback capabilities.',
    benefits: [
      'Complete tenant isolation and security',
      'Customizable branding per tenant',
      'Self-service capabilities for tenant admins',
      'Hierarchical RBAC across tenant boundaries',
      'API access for tenant automation'
    ],
    useCases: [
      'Service provider offers WAF-as-a-Service to customers',
      'Enterprise provides self-service to business units',
      'Partner portal for co-managed services'
    ],
    businessValue: 'Enables service provider business models with secure tenant isolation.'
  },



  'sla-monitoring': {
    title: 'SLA Monitoring & Compliance',
    description: 'Automated SLA tracking with real-time dashboards, breach alerting, and compliance reporting for service level agreements.',
    problemSolved: 'Manual SLA tracking is inaccurate and reactive. Customers lack visibility into service performance and compliance status.',
    benefits: [
      'Real-time SLA dashboard for customers',
      'Automated breach detection and alerting',
      'Historical compliance reporting',
      'Uptime calculations with maintenance window exclusion',
      'Customer-facing SLA status pages'
    ],
    useCases: [
      'Managed service provider needs to track SLA compliance',
      'Customer requires proof of 99.99% uptime guarantee',
      'Penalty calculations based on SLA breaches'
    ],
    businessValue: 'Ensures contractual compliance and builds customer trust.'
  },

  // Phase 7: AI Gateway & LLM Security (F5 Calypso)
  'ai-gateway': {
    title: 'F5 Calypso AI Gateway',
    description: 'Unified AI traffic management gateway that provides secure, governed access to LLMs and AI services with enterprise-grade controls.',
    problemSolved: 'Enterprises are rushing to adopt AI but face critical gaps: no visibility into AI usage, inability to prevent data leakage, exposure to prompt injection attacks, and lack of governance over which AI models employees use.',
    benefits: [
      'Single control point for all AI/LLM traffic',
      'Real-time visibility into AI model usage across the organization',
      'Unified API for accessing multiple LLM providers (OpenAI, Anthropic, Azure, etc.)',
      'Rate limiting and quota management per user/application',
      'Integration with existing identity and access management'
    ],
    useCases: [
      'Employee uses ChatGPT for work tasks - ensure no PII is leaked',
      'Application calls OpenAI API - enforce rate limits and monitor usage',
      'Different departments need different AI models - route intelligently',
      'Audit requires tracking all AI interactions - centralize logging'
    ],
    businessValue: 'Enables secure AI adoption at enterprise scale while preventing data breaches and regulatory violations.'
  },

  'llm-security': {
    title: 'LLM Security & Prompt Protection',
    description: 'Advanced security layer that protects against prompt injection, jailbreaks, and data exfiltration through AI interactions.',
    problemSolved: 'LLMs are vulnerable to sophisticated attacks: prompt injection can manipulate AI behavior, sensitive data can be leaked through prompts, and malicious outputs can harm users. Traditional security tools cannot inspect AI traffic.',
    benefits: [
      'Real-time prompt injection and jailbreak detection',
      'Automatic PII/sensitive data detection and redaction in prompts',
      'Output filtering to prevent harmful or non-compliant AI responses',
      'Protection against data exfiltration via AI channels',
      'Adaptive security policies based on AI model risk profiles'
    ],
    useCases: [
      'Block attempts to trick AI into revealing restricted information',
      'Prevent employees from accidentally pasting customer data into public AI',
      'Stop AI from generating harmful content or code vulnerabilities',
      'Detect and block attempts to use AI for social engineering'
    ],
    businessValue: 'Prevents AI-related security incidents and ensures compliance with data protection regulations when using AI.'
  },

  'ai-observability': {
    title: 'AI Model Observability',
    description: 'Comprehensive monitoring and analytics for AI/LLM interactions including token usage, latency, quality metrics, and cost tracking.',
    problemSolved: 'AI operations are a black box - organizations cannot see which models are being used, how much they are spending, or whether AI responses are accurate and appropriate.',
    benefits: [
      'Real-time dashboards for AI usage across all applications',
      'Token consumption tracking with per-user and per-app breakdowns',
      'Model performance monitoring (latency, error rates, availability)',
      'Response quality scoring and anomaly detection',
      'Historical analytics for capacity planning and budgeting'
    ],
    useCases: [
      'Track which departments are spending the most on AI tokens',
      'Identify slow AI models and route to faster alternatives',
      'Detect unusual AI usage patterns indicating misuse or attack',
      'Report on AI adoption metrics to leadership'
    ],
    businessValue: 'Provides operational visibility for AI initiatives and enables data-driven decisions about AI investments.'
  },

  // Phase 8: AI Governance & Optimization
  'ai-policy-engine': {
    title: 'AI Governance Policy Engine',
    description: 'Centralized policy framework for enforcing enterprise AI governance including approved models, allowed use cases, and data handling rules.',
    problemSolved: 'Enterprises lack control over AI usage - employees use unapproved AI services, sensitive data is processed by external models, and there is no enforcement of corporate AI policies.',
    benefits: [
      'Define approved AI models and providers per user group',
      'Enforce data classification rules (e.g., no PII to public LLMs)',
      'Block access to unauthorized AI services (shadow AI prevention)',
      'Require approval workflows for high-risk AI use cases',
      'Automated policy enforcement with real-time blocking'
    ],
    useCases: [
      'Finance team can only use Azure OpenAI (data stays in tenant)',
      'Block all access to public ChatGPT for compliance reasons',
      'Require manager approval for AI usage above certain token thresholds',
      'Prevent code from being sent to external AI coding assistants'
    ],
    businessValue: 'Ensures enterprise AI compliance and prevents unauthorized AI usage that could create legal or security risks.'
  },

  'ai-intelligent-routing': {
    title: 'Intelligent LLM Routing',
    description: 'Smart routing engine that optimizes AI requests across multiple models based on performance, cost, capability, and compliance requirements.',
    problemSolved: 'Different AI tasks require different models - using GPT-4 for simple tasks is wasteful, while using weak models for complex tasks produces poor results. Manual model selection is inefficient.',
    benefits: [
      'Automatic model selection based on task complexity and requirements',
      'Fallback routing when primary model is unavailable or slow',
      'Geographic routing for data residency compliance',
      'Load balancing across multiple AI providers for high availability',
      'A/B testing framework for comparing model performance'
    ],
    useCases: [
      'Route simple questions to cheaper models, complex analysis to GPT-4',
      'Use local models for sensitive data, cloud models for general queries',
      'Fail over to backup AI provider if OpenAI is experiencing issues',
      'Route EU user data to EU-hosted models for GDPR compliance'
    ],
    businessValue: 'Optimizes AI performance and resource utilization while ensuring compliance with data residency requirements.'
  },

  'ai-response-caching': {
    title: 'AI Response Caching & Optimization',
    description: 'Intelligent caching layer that stores and reuses AI responses for common queries, reducing token consumption and improving response times.',
    problemSolved: 'Organizations waste significant resources on repeated AI queries - the same questions get asked multiple times, and AI models regenerate identical responses.',
    benefits: [
      'Semantic caching recognizes similar questions and returns cached answers',
      'Reduce token consumption by up to 40% for repetitive queries',
      'Sub-millisecond response times for cached AI interactions',
      'Smart cache invalidation based on context freshness requirements',
      'Analytics on cache hit rates and optimization opportunities'
    ],
    useCases: [
      'Cache common developer questions about internal APIs and documentation',
      'Store and reuse standard policy explanations for customer service',
      'Avoid regenerating identical code patterns for software development',
      'Cache compliance guidance that does not change frequently'
    ],
    businessValue: 'Significantly reduces AI operational overhead while improving user experience through faster responses.'
  },

  // Automation Features
  'scheduled-automation': {
    title: 'Scheduled Automation Engine',
    description: 'Enterprise-grade cron-like scheduler for automating recurring F5 operations including backups, compliance checks, certificate renewals, and maintenance tasks.',
    problemSolved: 'Manual execution of routine maintenance tasks leads to forgotten backups, expired certificates, and compliance drift. Operations teams are overwhelmed with repetitive tasks.',
    benefits: [
      'Automated daily backups with configurable retention policies',
      'Proactive certificate expiry detection and renewal workflows',
      'Continuous compliance monitoring with automated remediation',
      'Scheduled configuration drift detection and alerting',
      'Maintenance windows with automatic rollback on failure'
    ],
    useCases: [
      'Daily automated backup of all F5 configurations before business hours',
      'Weekly certificate expiry checks with 30-day advance warning',
      'Hourly PCI-DSS compliance scans with immediate drift alerts',
      'Automated cleanup of inactive pool members after 90 days',
      'Monthly security posture reports delivered to stakeholders'
    ],
    businessValue: 'Eliminates 80% of routine manual tasks, ensures 100% compliance with backup policies, and prevents certificate-related outages.'
  },

  'config-templates': {
    title: 'Configuration Template Library',
    description: 'Centralized repository of reusable AS3, DO, and TS templates with version control, approval workflows, and automated validation for consistent deployments.',
    problemSolved: 'Each F5 deployment requires reinventing configurations, leading to inconsistencies, errors, and prolonged deployment times. No standardization across teams.',
    benefits: [
      'Pre-built templates for common application patterns (HTTPS, API Gateway, Microservices)',
      'Version-controlled templates with approval workflows',
      'Automated validation before deployment',
      'Parameterized templates for environment-specific values',
      'Template usage analytics and success rate tracking'
    ],
    useCases: [
      'Deploy new HTTPS application using standardized template in 5 minutes',
      'Roll out WAF policy updates across 50 applications using single template',
      'Onboard new F5 device using declarative onboarding template',
      'Standardize API gateway configurations across all microservices'
    ],
    businessValue: 'Reduces deployment time by 90%, eliminates configuration errors, and ensures consistent security posture across all applications.'
  },

  'event-driven-automation': {
    title: 'Event-Driven Automation',
    description: 'Real-time automation engine that responds to monitoring alerts, CI/CD events, security incidents, and custom webhooks to trigger immediate remediation actions.',
    problemSolved: 'Manual response to incidents is too slow - by the time an operator is alerted and takes action, the damage is done. Critical events require immediate automated response.',
    benefits: [
      'Auto-failover when pool members fail health checks',
      'DDoS mitigation with automatic IP blocking and traffic scrubbing',
      'Auto-scaling triggered by high CPU or latency thresholds',
      'GitOps integration - deploy F5 configs on code merge',
      'WAF auto-response to block attacking IPs immediately'
    ],
    useCases: [
      'Pool member fails 3 consecutive health checks → automatically disable and enable backup',
      'DDoS attack detected → block suspicious IPs and enable enhanced protection',
      'Code merged to main branch → validate and deploy F5 configuration changes',
      'Critical vulnerability announced → automatically apply virtual patch to WAF'
    ],
    businessValue: 'Reduces incident response time from minutes to seconds, prevents outages through proactive remediation, and enables true self-healing infrastructure.'
  },

  'batch-operations': {
    title: 'Batch Operations Orchestrator',
    description: 'Mass operations management for executing changes across hundreds of F5 devices with staged rollouts, approval gates, and automatic rollback capabilities.',
    problemSolved: 'Making the same change across dozens of F5 devices is error-prone and time-consuming. Rolling out updates without proper testing leads to widespread outages.',
    benefits: [
      'Staged rollouts with configurable batch sizes and delays',
      'Parallel execution across multiple devices for speed',
      'Automatic rollback if failure threshold exceeded',
      'Maintenance windows with scheduled execution',
      'Real-time progress tracking and per-device status'
    ],
    useCases: [
      'Deploy new SSL certificate to all 100 production load balancers in batches of 5',
      'Update WAF policy across all applications with automatic rollback on error',
      'Synchronize NTP configuration across all data centers',
      'Bulk license renewal for entire F5 fleet'
    ],
    businessValue: 'Reduces multi-device update time by 95%, eliminates human error in bulk operations, and prevents widespread outages through safe rollout practices.'
  },

  'automation-orchestrator': {
    title: 'Unified Automation Orchestrator',
    description: 'Centralized dashboard for managing all automation workflows including scheduled tasks, event rules, batch operations, and configuration templates from a single pane of glass.',
    problemSolved: 'Automation is scattered across multiple tools and interfaces - scheduled tasks in cron, event rules in monitoring, templates in git. No unified visibility or control.',
    benefits: [
      'Single dashboard for all automation workflows',
      'Cross-automation dependencies and chaining',
      'Centralized audit trail for all automated actions',
      'Role-based access control for automation management',
      'Automation analytics and optimization recommendations'
    ],
    useCases: [
      'View all running automation tasks across the enterprise',
      'Chain templates with event triggers and scheduled validation',
      'Audit all automated changes for compliance reporting',
      'Identify automation gaps and optimization opportunities'
    ],
    businessValue: 'Provides complete automation visibility, enables automation governance, and maximizes ROI from F5 automation investments.'
  }
};

// Helper function to get feature content by key
export function getFeatureContent(key: string): FeatureContent | undefined {
  return featureContent[key];
}

// Helper to get all features for a phase
export function getFeaturesByPhase(phase: string): string[] {
  const phaseMap: Record<string, string[]> = {
    'phase1': ['self-service-deployment', 'circuit-breaker', 'awaf-automation'],
    'phase2': ['forward-proxy', 'ssl-orchestrator', 'access-policy'],
    'phase3': ['declarative-onboarding', 'telemetry-streaming', 'blue-green-deployment', 'dns-gslb', 'auto-remediation', 'drift-detection'],
    'phase4': ['big-iq-management', 'container-ingress', 'infrastructure-as-code'],
    'phase5': ['ai-analytics', 'bot-defense', 'scheduled-automation', 'config-templates', 'event-driven-automation', 'batch-operations', 'automation-orchestrator'],
    'phase6': ['multi-tenant-portal', 'sla-monitoring'],
    'phase7': ['ai-gateway', 'llm-security', 'ai-observability'],
    'phase8': ['ai-policy-engine', 'ai-intelligent-routing', 'ai-response-caching']
  };
  return phaseMap[phase] || [];
}
