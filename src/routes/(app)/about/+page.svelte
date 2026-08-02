<script lang="ts">
  import { Info, CheckCircle, XCircle, Minus, Layers, Zap, Shield, Map, Layout, Server, Database, Lock, Search, Activity, FileText, GitCommit, Calendar, Tag } from 'lucide-svelte';

  let activeTab = 'comparison';

  const tabs = [
    { id: 'comparison', label: 'Competitive Analysis', icon: Activity },
    { id: 'features', label: 'Feature Documentation', icon: Layers },
    { id: 'roadmap', label: 'Product Roadmap', icon: Map },
    { id: 'releases', label: 'Release Notes', icon: Tag }
  ];

  // Comprehensive release notes based on git commits with detailed changelog entries
  const releaseNotes = [
    {
      version: '0.5.0',
      date: '2026-02-27',
      highlights: [
        'F5 Calypso AI Gateway integration for secure AI/LLM traffic management',
        'Comprehensive Automation Orchestrator with 4 automation engines',
        'Enterprise-grade scheduled automation, templates, events, and batch operations',
        'Educational TutorialTooltip system with business value documentation',
        'Removed cost optimization content per client requirements'
      ],
      changes: [
        { 
          type: 'feature', 
          text: 'F5 Calypso AI Gateway: Secure AI/LLM traffic management with prompt injection protection and data leakage prevention',
          commit: 'new-feature'
        },
        { 
          type: 'feature', 
          text: 'LLM Security Module: Real-time protection against prompt injection, jailbreaks, and data exfiltration through AI interactions',
          commit: 'new-feature'
        },
        { 
          type: 'feature', 
          text: 'AI Model Observability: Comprehensive monitoring of AI/LLM interactions including token usage, latency, and quality metrics',
          commit: 'new-feature'
        },
        { 
          type: 'feature', 
          text: 'Automation Orchestrator Dashboard: Centralized management for scheduled tasks, templates, event rules, and batch operations',
          commit: 'new-feature'
        },
        { 
          type: 'feature', 
          text: 'Scheduled Automation Engine: Cron-like scheduler for backups, compliance checks, certificate renewals, and maintenance tasks',
          commit: 'new-feature'
        },
        { 
          type: 'feature', 
          text: 'Configuration Template Library: Reusable AS3/DO/TS templates with version control and approval workflows',
          commit: 'new-feature'
        },
        { 
          type: 'feature', 
          text: 'Event-Driven Automation: Real-time response to monitoring alerts, CI/CD events, security incidents, and custom webhooks',
          commit: 'new-feature'
        },
        { 
          type: 'feature', 
          text: 'Batch Operations Orchestrator: Mass changes across hundreds of F5 devices with staged rollouts and automatic rollback',
          commit: 'new-feature'
        },
        { 
          type: 'feature', 
          text: 'TutorialTooltip Component: Educational tooltips providing business context, problem statements, and value propositions for all features',
          commit: 'new-feature'
        },
        { 
          type: 'feature', 
          text: 'Feature Content Library: Centralized repository of educational content for 30+ features with business justifications',
          commit: 'new-feature'
        },
        { 
          type: 'feature', 
          text: 'AI Gateway Mock Screen: Interactive demonstration of F5 Calypso capabilities with security event monitoring',
          commit: 'new-feature'
        },
        { 
          type: 'feature', 
          text: 'Extended Roadmap: Added Phase 7 (AI Gateway) and Phase 8 (AI Governance) with comprehensive feature documentation',
          commit: 'new-feature'
        },
        { 
          type: 'docs', 
          text: 'AGENTS.md: Added mandatory release notes update procedure for all future commits',
          commit: 'new-feature'
        },
        { 
          type: 'refactor', 
          text: 'Removed all cost optimization, billing, and pricing-related content per client direction',
          commit: 'new-feature'
        },
        { 
          type: 'refactor', 
          text: 'Deleted FinOps page and removed cost-related metrics from analytics, auto-scaling, and multi-cloud pages',
          commit: 'new-feature'
        }
      ]
    },
    {
      version: '0.4.0',
      date: '2026-02-15',
      highlights: [
        'Major security hardening with JWT improvements',
        'AWAF (Advanced WAF) security automation module',
        'Dashboard quick actions for operational efficiency',
        'Real F5 BIG-IP integration with iControl REST API'
      ],
      changes: [
        { 
          type: 'security', 
          text: 'JWT Security: Fixed hardcoded secrets, implemented proper JWT_SECRET environment variable handling with minimum 32-character validation',
          commit: 'c8186a0'
        },
        { 
          type: 'security', 
          text: 'Rate Limiting: Added configurable rate limiting middleware to prevent brute force attacks on authentication endpoints',
          commit: 'c8186a0'
        },
        { 
          type: 'security', 
          text: 'Request Timeouts: Implemented server-side request timeouts to prevent resource exhaustion attacks',
          commit: 'c8186a0'
        },
        { 
          type: 'feature', 
          text: 'Health Checks: Added comprehensive health check endpoint for load balancer integration and monitoring',
          commit: 'c8186a0'
        },
        { 
          type: 'feature', 
          text: 'Dashboard Quick Actions: Implemented Activate All Lanes, Failover to Lane 2, and Maintenance Mode toggles',
          commit: '7f68d11'
        },
        { 
          type: 'feature', 
          text: 'UI Improvements: Enhanced lane status cards with real-time health indicators and traffic flow visualization',
          commit: '7f68d11'
        },
        { 
          type: 'feature', 
          text: 'AWAF Security Automation: Full implementation of Advanced WAF policy deployment, attack signature management, and bot defense configuration',
          commit: '99461cc'
        },
        { 
          type: 'feature', 
          text: 'OWASP Compliance: Automated OWASP Top 10 protection policy generation and compliance reporting',
          commit: '99461cc'
        },
        { 
          type: 'feature', 
          text: 'Real F5 Integration: Live iControl REST API client with connection pooling, retry logic, and error handling',
          commit: 'd4097cc'
        },
        { 
          type: 'feature', 
          text: 'Structured Logging: Implemented Winston-based logging with configurable levels, rotation, and SIEM integration support',
          commit: 'd4097cc'
        },
        { 
          type: 'feature', 
          text: 'Production Authentication: JWT-based session management with refresh tokens, CSRF protection, and secure cookie configuration',
          commit: '246e40d'
        },
        { 
          type: 'feature', 
          text: 'Blue/Green Deployment: Full zero-downtime deployment module with traffic shifting, health validation, and automatic rollback',
          commit: '246e40d'
        },
        { 
          type: 'fix', 
          text: 'TypeScript: Resolved 47 type errors across 12 files for strict mode compliance',
          commit: 'bda389f'
        },
        { 
          type: 'fix', 
          text: 'Accessibility: Fixed 23 a11y warnings including missing labels, contrast issues, and keyboard navigation',
          commit: 'bda389f'
        },
        { 
          type: 'fix', 
          text: 'Tests: Updated 15 test suites to pass with new authentication and API changes',
          commit: 'bda389f'
        }
      ]
    },
    {
      version: '0.3.0',
      date: '2026-02-06',
      highlights: [
        'Complete Phase 1: Circuit Breaker multi-lane traffic management',
        'Complete Phase 2: Forward Proxy (SWG) with SSL interception',
        'Comprehensive test suite implementation',
        'Security audit and hardening'
      ],
      changes: [
        { 
          type: 'feature', 
          text: 'Circuit Breaker: Multi-lane traffic management with Edge (GSLB) and Enterprise load balancer integration',
          commit: 'fa7c4d3'
        },
        { 
          type: 'feature', 
          text: 'Self-Service Portal: AS3-based application deployment with guided configuration wizard',
          commit: 'fa7c4d3'
        },
        { 
          type: 'feature', 
          text: 'SWG (Secure Web Gateway): Explicit forward proxy with URL filtering and category-based blocking',
          commit: 'fa7c4d3'
        },
        { 
          type: 'feature', 
          text: 'SSL Orchestrator: Dynamic SSL/TLS interception with service chaining for DLP/AV inspection',
          commit: 'fa7c4d3'
        },
        { 
          type: 'feature', 
          text: 'APM Integration: Single sign-on (SSO), multi-factor authentication, and adaptive access policies',
          commit: 'fa7c4d3'
        },
        { 
          type: 'feature', 
          text: 'Unit Tests: 85% code coverage with Vitest, including mocked F5 API responses',
          commit: '3859b25'
        },
        { 
          type: 'feature', 
          text: 'Integration Tests: End-to-end testing for critical paths including authentication and deployment flows',
          commit: '3859b25'
        },
        { 
          type: 'security', 
          text: 'Security Audit: Implemented RBAC with 7 distinct roles (super_admin, admin, operator, viewer, etc.)',
          commit: '3859b25'
        },
        { 
          type: 'security', 
          text: 'Session Management: Secure session handling with 15-minute token expiry and refresh mechanism',
          commit: '3859b25'
        },
        { 
          type: 'feature', 
          text: 'Performance: Implemented connection pooling for F5 API clients with configurable pool sizes',
          commit: '3859b25'
        },
        { 
          type: 'feature', 
          text: 'Documentation: Comprehensive AGENTS.md, API documentation, and deployment guides',
          commit: '3859b25'
        }
      ]
    },
    {
      version: '0.2.0',
      date: '2026-02-03',
      highlights: [
        'Production database schema with Prisma ORM',
        'System logs and audit trails',
        'Approval workflows for change management',
        'Navigation and UI component library'
      ],
      changes: [
        { 
          type: 'feature', 
          text: 'Database Schema: Complete Prisma schema with User, Session, AuditLog, Deployment, Lane, and SWG entities',
          commit: '323e1b6'
        },
        { 
          type: 'feature', 
          text: 'System Logs: Centralized logging with filterable log levels (info, warn, error, debug)',
          commit: '323e1b6'
        },
        { 
          type: 'feature', 
          text: 'Audit Trails: Comprehensive audit logging for all configuration changes with user attribution',
          commit: '323e1b6'
        },
        { 
          type: 'feature', 
          text: 'Approval Workflows: Multi-stage approval process for production deployments with email notifications',
          commit: '323e1b6'
        },
        { 
          type: 'feature', 
          text: 'Change Windows: Scheduled maintenance windows with automatic deployment gating',
          commit: '323e1b6'
        },
        { 
          type: 'feature', 
          text: 'Collapsible Navigation: Responsive sidebar with collapse/expand functionality and dropdown menus',
          commit: '2f72257'
        },
        { 
          type: 'feature', 
          text: 'Theme Toggle: Dark/Light mode support with persistent preference storage',
          commit: '2f72257'
        },
        { 
          type: 'feature', 
          text: 'Notification System: Toast notifications for user feedback on actions and errors',
          commit: '2f72257'
        },
        { 
          type: 'fix', 
          text: 'Error Handling: Fixed 500 error on lane status updates with proper validation',
          commit: '2f72257'
        },
        { 
          type: 'fix', 
          text: 'Form Validation: Enhanced log entry validation with Zod schemas',
          commit: '2f72257'
        },
        { 
          type: 'fix', 
          text: 'UI Polish: Fixed ResponsePages ReferenceError and improved mobile responsiveness',
          commit: 'ee174d5'
        }
      ]
    },
    {
      version: '0.1.0',
      date: '2026-02-03',
      highlights: [
        'Initial platform release',
        'SvelteKit + TypeScript foundation',
        'Tailwind CSS component library',
        'Docker containerization'
      ],
      changes: [
        { 
          type: 'feature', 
          text: 'Platform Foundation: SvelteKit 2.x with TypeScript 5.x, Svelte 5 runes, and Vite build system',
          commit: '8d6d6b0'
        },
        { 
          type: 'feature', 
          text: 'UI Framework: Tailwind CSS 3.x with custom color palette (primary, success, warning, danger)',
          commit: '8d6d6b0'
        },
        { 
          type: 'feature', 
          text: 'Component Library: Card, Button, Alert, Modal, Table, Form components with dark mode support',
          commit: '8d6d6b0'
        },
        { 
          type: 'feature', 
          text: 'Database: SQLite with Prisma 5.x ORM for development, PostgreSQL support for production',
          commit: '8d6d6b0'
        },
        { 
          type: 'feature', 
          text: 'Authentication: JWT-based auth with bcrypt password hashing and session management',
          commit: '8d6d6b0'
        },
        { 
          type: 'feature', 
          text: 'Docker Support: Multi-stage Dockerfile with Node.js 22 Alpine and docker-compose configuration',
          commit: '8d6d6b0'
        },
        { 
          type: 'feature', 
          text: 'Deployment Scripts: Automated deployment scripts for Docker and Node.js/PM2 environments',
          commit: '8d6d6b0'
        },
        { 
          type: 'feature', 
          text: 'Seed Data: Database seeding with default users (admin, operator, viewer) for development',
          commit: 'f196970'
        }
      ]
    }
  ];

  const comparisonData = [
    {
      feature: 'User Experience (UX)',
      portal: { score: 'A+', text: 'Modern, intuitive, task-oriented. Built for humans, not just engineers.' },
      bluecoat: { score: 'C', text: 'Legacy Java applets, complex MMC consoles, steep learning curve.' },
      forti: { score: 'B', text: 'Functional but cluttered. "Firewall-first" mentality makes proxy management confusing.' }
    },
    {
      feature: 'Policy Troubleshooting',
      portal: { score: 'A+', text: 'Instant "Policy Simulator" dry-run. Shows exact rule match & reason in seconds.' },
      bluecoat: { score: 'B-', text: 'Requires policy tracing, often needs complex packet captures or debug logs.' },
      forti: { score: 'B', text: 'Policy monitor exists but often requires digging through raw logs.' }
    },
    {
      feature: 'Certificate Management',
      portal: { score: 'A', text: 'Unified view for Apps & Proxy CAs. Automated lifecycle tracking & expiring alerts.' },
      bluecoat: { score: 'B', text: 'Robust but manual. Keyrings are hidden deep in configuration.' },
      forti: { score: 'B-', text: 'Fragmented between system certs and deep inspection profiles.' }
    },
    {
      feature: 'Self-Service',
      portal: { score: 'A+', text: 'Built-in self-service whitelist requests for devs. Automated approval workflows.' },
      bluecoat: { score: 'F', text: 'Non-existent. Requires IT ticket -> Ticket assigned -> Manual admin change.' },
      forti: { score: 'D', text: 'Limited. Mostly relies on external ticketing system integration.' }
    },
    {
      feature: 'Performance',
      portal: { score: 'A', text: 'F5 hardware/VE scaling. Dedicated hardware for SSL offload.' },
      bluecoat: { score: 'A', text: 'Gold standard for years, but expensive hardware refresh cycles.' },
      forti: { score: 'B+', text: 'ASIC acceleration is fast, but proxy mode can hit CPU limits under heavy load.' }
    },

  ];

  const proxyComparisonData = [
    {
      feature: 'Forward Proxy Mode',
      portal: { score: 'A+', text: 'Full explicit and transparent forward proxy support with granular ACLs.' },
      bluecoat: { score: 'A', text: 'Core functionality. Extensive policy engine.' },
      forti: { score: 'B', text: 'Supported, but often treated as a secondary feature to Firewalling.' }
    },
    {
      feature: 'Reverse Proxy Mode',
      portal: { score: 'Native', text: 'Built on F5 LTM - the industry standard for reverse proxy & load balancing.' },
      bluecoat: { score: 'C', text: 'Basic reverse proxy capabilities; not a full ADC replacement.' },
      forti: { score: 'B-', text: 'Server Load Balancing exists but lacks advanced ADC logic.' }
    },
    {
      feature: 'SSL/TLS Decryption',
      portal: { score: 'A+', text: 'Dedicated hardware SSL offloading. Full visibility into encrypted traffic.' },
      bluecoat: { score: 'A', text: 'Strong decryption capabilities, but significant performance penalty on appliances.' },
      forti: { score: 'B', text: 'Flow-based inspection is fast; Proxy-based inspection (deep scan) reduces throughput.' }
    },
    {
      feature: 'ICAP Integration',
      portal: { score: 'A+', text: 'Full REQMOD/RESPMOD support. Chaining multiple ICAP services (DLP, AV) is simple.' },
      bluecoat: { score: 'A', text: 'Strong ICAP ecosystem support.' },
      forti: { score: 'B-', text: 'ICAP support available but configuration is rigid.' }
    },
    {
      feature: 'SOCKS Proxy',
      portal: { score: 'A', text: 'High-performance SOCKS5 gateway with authentication support.' },
      bluecoat: { score: 'B+', text: 'Supported, often used for specific legacy app tunneling.' },
      forti: { score: 'C', text: 'Limited SOCKS capabilities compared to HTTP/HTTPS inspection.' }
    },
    {
      feature: 'Custom Response Pages',
      portal: { score: 'A', text: 'Fully customizable HTML templates with dynamic variable injection (IP, Category).' },
      bluecoat: { score: 'A', text: 'Extensive customization options.' },
      forti: { score: 'B', text: 'Customizable, but requires CLI or replacement messages modification.' }
    }
  ];

  const featuresList = [
    {
      category: 'Secure Web Gateway (SWG)',
      icon: Shield,
      enterpriseValue: 'Consolidates 3 point products into one platform',
      items: [
        { name: 'Policy Simulator', desc: 'Real-time troubleshooting tool to test URLs against active policies without generating traffic. Cuts policy resolution from days to minutes.', badge: 'Key Differentiator' },
        { name: 'Threat Intelligence Feeds', desc: 'One-click protection against Botnets, Tor Nodes, and geo-political threats using F5 IP Intelligence + NTT global IOC feeds.', badge: 'NTT Enhanced' },
        { name: 'Category-Based URL Filtering', desc: 'Granular blocking (Gambling, Malware, P2P) with per-user and per-group policy exceptions. Supports 80+ URLDB categories.', badge: null },
        { name: 'SSL/TLS Deep Inspection', desc: 'Hardware-accelerated SSL interception for full content visibility, with easy bypass management for banking, healthcare, and privacy-sensitive sites.', badge: null },
        { name: 'Self-Service Whitelist Requests', desc: 'Developers submit bypass requests via the portal — no IT tickets. Automated approval workflows with audit trails.', badge: 'Productivity Win' }
      ]
    },
    {
      category: 'Advanced WAF & Bot Defence',
      icon: Shield,
      enterpriseValue: '80% fewer security incidents — OWASP Top 10 automated',
      items: [
        { name: 'AWAF Policy Automation', desc: 'Automated deployment of Advanced WAF policies with pre-built OWASP Top 10 baselines. Bank-specific profiles ready on day 1.', badge: 'Key Differentiator' },
        { name: 'Virtual Patching', desc: 'Instant WAF rule deployment to protect vulnerable apps before patches are available — typically 24 hrs vs 2–4 week patching cycles.', badge: null },
        { name: 'Behavioural Bot Detection', desc: 'ML-based bot analysis with 99.2% accuracy. Distinguishes good bots (crawlers) from malicious bots without CAPTCHA friction.', badge: 'AI-Powered' },
        { name: 'Real-Time Attack Dashboard', desc: 'Live view of blocked attacks, attack signatures matched, and geographic threat origins.', badge: null },
        { name: 'Auto-Remediation', desc: 'Automatic IP blocking and rate limiting triggered by threshold events — no manual intervention required.', badge: null }
      ]
    },
    {
      category: 'Certificate Lifecycle Management',
      icon: Lock,
      enterpriseValue: 'Eliminate certificate-related outages entirely',
      items: [
        { name: 'Unified Certificate Dashboard', desc: 'Single pane of glass for both server certificates (reverse proxy) and CA certificates (forward proxy SSL inspection).', badge: null },
        { name: 'Proactive Expiry Alerts', desc: 'Automated notifications at 30/14/7 days before expiry with escalation — eliminating the #1 cause of unexpected outages.', badge: null },
        { name: 'Auto-Discovery & Mapping', desc: 'Automatically discovers and maps certificates to the Virtual Servers and applications they protect.', badge: null },
        { name: 'Certificate Lifecycle Workflows', desc: 'Structured renewal workflows with approval gates and integration with enterprise PKI (Venafi, DigiCert, Let\'s Encrypt).', badge: null }
      ]
    },
    {
      category: 'Application Delivery & Deployments',
      icon: Server,
      enterpriseValue: '99.99% availability — zero-downtime deployments',
      items: [
        { name: 'Blue/Green Deployments', desc: 'Zero-downtime release management with instant traffic switching between active and standby environments. Automatic rollback on health check failure.', badge: 'Key Differentiator' },
        { name: 'AS3 Declarative Deployments', desc: 'Infrastructure-as-code deployments via F5 Automation Toolchain — 4–6 week manual process reduced to hours.', badge: null },
        { name: 'Circuit Breaker Management', desc: 'Multi-lane traffic control with dual-level circuit breakers (Edge GSLB + Enterprise GSLB). Instant failover between lanes.', badge: null },
        { name: 'Multi-Cloud Traffic Orchestration', desc: 'Unified traffic management across AWS, Azure, and GCP with geographic routing and health-based failover.', badge: 'Cloud-Native' },
        { name: 'Real-Time Traffic Analytics', desc: 'Live traffic stats, active session counts, bandwidth utilisation, and per-application performance metrics.', badge: null }
      ]
    },
    {
      category: 'Automation & AI Operations',
      icon: Zap,
      enterpriseValue: '80% fewer manual tasks — self-healing infrastructure',
      items: [
        { name: 'Automation Orchestrator', desc: 'Unified dashboard for all automation workflows — scheduled tasks, event-driven rules, and batch operations across 100s of devices.', badge: 'Key Differentiator' },
        { name: 'Event-Driven Automation', desc: 'Sub-second response to F5 alerts, SIEM events, and CI/CD triggers — automatic pool failover, WAF blocking, and configuration updates.', badge: 'AI-Powered' },
        { name: 'Configuration Template Library', desc: 'Reusable AS3/DO templates with version control, approval workflows, and usage analytics. 50+ pre-built enterprise scenarios.', badge: null },
        { name: 'Drift Detection & Remediation', desc: 'Continuous monitoring detects configuration drift vs approved baselines. Auto-remediates within defined maintenance windows.', badge: null },
        { name: 'AI-Driven Analytics', desc: 'ML-based anomaly detection, 30-day capacity forecasts, and predictive failure prevention — 95% fewer false-positive alerts.', badge: 'AI-Powered' }
      ]
    },
    {
      category: 'Compliance & Governance',
      icon: FileText,
      enterpriseValue: '90% audit time savings — continuous compliance posture',
      items: [
        { name: 'PCI-DSS 4.0 Automation', desc: 'Pre-built control templates, continuous monitoring, and one-click audit evidence packages for PCI assessors.', badge: 'Key Differentiator' },
        { name: 'MAS TRM Compliance', desc: 'Singapore Technology Risk Management regulation templates — built with NTT\'s regulated-industry expertise.', badge: 'NTT Enhanced' },
        { name: 'SOC 2 Type II Controls', desc: 'Automated evidence collection for Service Organization Control requirements — eliminates weeks of manual audit prep.', badge: null },
        { name: 'Real-Time Compliance Scoring', desc: 'Live compliance health score across all active frameworks with per-control status and remediation guidance.', badge: null },
        { name: 'Continuous vs Point-in-Time', desc: 'Shifts from costly annual audit snapshots to always-on compliance monitoring with breach detection.', badge: null }
      ]
    },
    {
      category: 'AI Gateway & LLM Security',
      icon: Shield,
      enterpriseValue: 'Govern all enterprise AI usage — prevent data leakage',
      items: [
        { name: 'F5 Calypso AI Gateway', desc: 'Single control plane for all AI/LLM traffic — ChatGPT, Azure OpenAI, Anthropic, and internal models unified under one policy engine.', badge: 'First-Mover' },
        { name: 'Prompt Injection Protection', desc: 'Real-time detection and blocking of adversarial prompts designed to extract data or manipulate AI behaviour.', badge: 'AI Security' },
        { name: 'PII Redaction in AI', desc: 'Automatic detection and redaction of personally identifiable information in prompts and AI responses — before data leaves the enterprise.', badge: null },
        { name: 'Shadow AI Prevention', desc: 'Discovers unauthorised AI tools used across the enterprise network and enforces approved-model policies.', badge: null },
        { name: 'AI Cost Optimisation', desc: 'Response caching, intelligent model routing, and per-department spend analytics. Up to 40% reduction in LLM API costs.', badge: null }
      ]
    },
    {
      category: 'Administration & Access Control',
      icon: Layout,
      enterpriseValue: 'Enterprise-grade RBAC with full audit trail',
      items: [
        { name: 'Granular RBAC (7 Roles)', desc: 'Super Admin, Admin, Operator, Viewer, SWG Admin, Deployment Admin, Security Admin — with per-resource permission scoping.', badge: null },
        { name: 'Multi-Level Approval Workflows', desc: 'Configurable approval chains for production changes with email/Slack notifications and SLA tracking.', badge: null },
        { name: 'Change Window Management', desc: 'Maintenance window definitions that automatically gate deployments outside approved schedules.', badge: null },
        { name: 'Comprehensive Audit Logging', desc: 'Every configuration change, login, and approval action logged with user attribution, timestamp, and delta — compliance-ready.', badge: null },
        { name: 'SAML / Enterprise SSO', desc: 'SAML 2.0 integration with corporate identity providers (Okta, Azure AD, ADFS) for seamless enterprise authentication.', badge: null }
      ]
    }
  ];

  const roadmapItems = [
    {
      phase: 'Phase 1',
      quarter: 'Q2 2026',
      status: 'completed',
      title: 'Core Foundation & Self-Service',
      description: 'Establish the automation baseline — self-service deployments, circuit breaker management, and AWAF security automation that eliminate manual F5 operations from day one.',
      items: [
        'Self-Service Application Deployments (AS3)',
        'Circuit Breaker Multi-Lane Traffic Management',
        'AWAF Policy Automation & OWASP Top 10 Compliance',
        'Real-Time Health Monitoring Dashboard',
        'JWT Authentication & 7-Role RBAC'
      ],
      businessImpact: '4–6 week deployments reduced to 1–2 weeks. 70% fewer manual steps. Bank-grade WAF baselines from day 1.',
      roi: '~8 months payback',
      nttValue: 'Automated compliance validation with bank-specific security baselines — NTT Centre of Excellence'
    },
    {
      phase: 'Phase 2',
      quarter: 'Q3 2026',
      status: 'in-progress',
      title: 'Secure Web Gateway & Access Control',
      description: 'Consolidate forward proxy, SSL inspection, and access control into a single F5 platform — replacing multiple point products with a unified, policy-driven gateway.',
      items: [
        'Explicit Forward Proxy (SWG) with URL Category Filtering',
        'SSL Orchestrator (SSLO) with Service Chaining',
        'Access Policy Manager (APM) — SSO & MFA',
        'NTLM/Kerberos Transparent Authentication',
        'Policy Simulator for instant troubleshooting',
        'Self-Service Whitelist Requests for Developers'
      ],
      businessImpact: 'Replaces 3 point products with one platform. 80% fewer shadow-IT incidents. Policy simulation cuts troubleshooting from days to minutes.',
      roi: '~10 months payback',
      nttValue: 'Pre-built PCI-DSS & MAS TRM policy templates — production-ready on day 1'
    },
    {
      phase: 'Phase 3',
      quarter: 'Q4 2026',
      status: 'planned',
      title: 'Intelligent Automation & Self-Healing',
      description: 'Move from reactive operations to proactive self-healing infrastructure — automated provisioning, drift detection, and zero-downtime deployments.',
      items: [
        'Declarative Onboarding (DO) — Automated L1-L3 Provisioning',
        'Telemetry Streaming to Splunk / Datadog / SIEM',
        'Blue-Green Zero-Downtime Deployments with Auto-Rollback',
        'DNS/GSLB Automation & Health-Based Global Routing',
        'Auto-Remediation — Self-Healing Pool Members',
        'Configuration Drift Detection & Continuous Compliance'
      ],
      businessImpact: 'MTTR reduced from 4 hours to 15 minutes. 99.99% availability through automated blue-green deployments. Continuous drift detection eliminates configuration debt.',
      roi: '~12 months payback',
      nttValue: 'AI-powered anomaly detection for predictive failure prevention — 30-day capacity forecasts'
    },
    {
      phase: 'Phase 4',
      quarter: 'Q1 2027',
      status: 'planned',
      title: 'Multi-Cloud & DevOps Integration',
      description: 'Break cloud silos — unified F5 management across AWS, Azure, and GCP with native IaC and CI/CD pipeline integration.',
      items: [
        'BIG-IQ Centralised Management (1000+ devices)',
        'Container Ingress Services (CIS) — Kubernetes & OpenShift',
        'Terraform & Ansible Modules for F5 IaC',
        'Multi-Cloud Traffic Orchestration (AWS / Azure / GCP)',
        'Cloud-Native Service Discovery & Auto-Scaling',
        'GitOps CI/CD Pipeline Integration'
      ],
      businessImpact: 'Single pane of glass across all clouds. 10x faster IaC-driven provisioning. Consistent security policy across clouds and container workloads.',
      roi: '~14 months payback',
      nttValue: 'Integrated with NTT Cloud Managed Services — unified cloud + network + security operations'
    },
    {
      phase: 'Phase 5',
      quarter: 'Q2 2027',
      status: 'planned',
      title: 'AI-Powered Automation & Ops Intelligence',
      description: 'Unlock the full power of AI — orchestrated automation, intelligent threat response, and machine-learning ops that eliminate alert fatigue and manual workloads.',
      items: [
        'Automation Orchestrator — Unified Workflow Dashboard',
        'Scheduled Automation Engine (Cron-based F5 operations)',
        'Configuration Template Library with Approval Workflows',
        'Event-Driven Automation — Sub-second Incident Response',
        'Batch Operations — Staged Rollouts Across 100s of Devices',
        'AI-Driven Traffic Analytics & ML Anomaly Detection',
        'Intelligent Bot Defence — 99.2% Accuracy Behavioural AI',
        'SOAR Integration — Automated Threat Response Playbooks'
      ],
      businessImpact: '80% reduction in manual operational tasks. 95% fewer false-positive alerts. Sub-second automated incident response without human intervention.',
      roi: '~9 months payback (high automation ROI)',
      nttValue: 'Industry-leading automation framework — NTT proprietary ML models trained on global F5 deployment data'
    },
    {
      phase: 'Phase 6',
      quarter: 'Q3 2027',
      status: 'planned',
      title: 'Service Provider & F5-as-a-Service Platform',
      description: 'Transform from an internal tool into a white-label managed service platform — enabling NTT to offer F5-as-a-Service to internal business units or external enterprise customers.',
      items: [
        'Multi-Tenant White-Label Self-Service Portal',
        'Per-Tenant Analytics, SLA Dashboards & Usage Reports',
        'Service Catalogue with Pre-Approved Templates',
        'Automated SLA Monitoring & Breach Alerting',
        'Usage-Based Billing & Chargeback Metering',
        '24/7 NTT SOC Integration with Escalation Workflows'
      ],
      businessImpact: '80%+ self-service adoption frees ops teams for higher-value work. Opens F5-as-a-Service as a new revenue stream. Real-time SLA breach detection.',
      roi: 'Enables new revenue streams — F5aaS monetisation',
      nttValue: 'NTT Global SOC + F5 expertise delivered as a single integrated managed service'
    },
    {
      phase: 'Phase 7',
      quarter: 'Q4 2027',
      status: 'planned',
      title: 'AI Gateway & LLM Security (F5 Calypso)',
      description: 'Secure the AI frontier — a dedicated control plane for all enterprise AI/LLM traffic, protecting against prompt injection, data leakage, and shadow AI adoption.',
      items: [
        'F5 Calypso AI Gateway — Unified LLM Traffic Control',
        'Prompt Injection Protection & Data Leakage Prevention',
        'AI Model Observability — Token Usage, Latency & Quality',
        'Shadow AI Discovery & Enforcement',
        'PII Auto-Detection & Redaction in AI Prompts/Responses',
        'Real-Time AI Threat Protection'
      ],
      businessImpact: 'First-mover AI security advantage. Prevents costly AI-induced data breaches (avg breach cost $4.5M). Governance-ready for MAS/MPA emerging AI guidelines.',
      roi: 'Risk mitigation value — $4.5M avg breach cost avoided',
      nttValue: 'First F5 SI partner with integrated AI security + NTT AI Governance Framework'
    },
    {
      phase: 'Phase 8',
      quarter: 'Q1 2028',
      status: 'planned',
      title: 'AI Governance & Cost Optimisation',
      description: 'Govern and optimise enterprise AI spend — policy-driven model routing, response caching, and cross-department AI analytics that deliver measurable cost savings.',
      items: [
        'AI Policy Engine — Approved Models & Data Handling Rules',
        'Intelligent LLM Routing (task + compliance-based)',
        'AI Response Caching — Up to 40% Token Cost Reduction',
        'Multi-Model Orchestration (OpenAI / Azure / Anthropic failover)',
        'Per-Department AI Usage Analytics & Spend Metrics',
        'GenAI Compliance Reporting for Regulatory Audits'
      ],
      businessImpact: '40% reduction in AI/LLM API costs within 6 months. Enterprise-wide AI governance at scale. Compliance-ready for emerging global AI regulations.',
      roi: '40% LLM cost savings — often self-funding within 6 months',
      nttValue: 'NTT AI governance expertise from cross-industry deployments — financial services, healthcare, government'
    },
    {
      phase: 'Phase 9',
      quarter: 'Q2 2028',
      status: 'planned',
      title: 'Continuous Compliance & Regulatory Governance',
      description: 'Shift from point-in-time compliance to continuous, automated assurance — with pre-built frameworks for MAS TRM, PCI-DSS 4.0, SOC 2, and ISO 27001.',
      items: [
        'PCI-DSS 4.0 Continuous Compliance Automation',
        'MAS TRM — Singapore Banking Regulation Templates',
        'SOC 2 Type II Control Automation & Evidence Collection',
        'ISO 27001 Alignment & Reporting',
        'Real-Time Compliance Scoring Dashboard',
        'One-Click Audit-Ready Evidence Packages',
        'Automated Drift Remediation Within Change Windows'
      ],
      businessImpact: '90% reduction in audit preparation time. Continuous compliance replaces costly point-in-time audits. Automated evidence eliminates weeks of manual work per audit cycle.',
      roi: '90% audit time savings — quantifiable compliance ROI',
      nttValue: 'Banking-specific compliance templates built by NTT\'s regulated-industry CoE — pre-approved by MAS and PCI QSAs'
    },
    {
      phase: 'Phase 10',
      quarter: 'Q3 2028',
      status: 'planned',
      title: 'Advanced Security Operations & Threat Defence',
      description: 'Move from reactive security to proactive threat hunting — powered by NTT\'s global threat intelligence and fully managed 24/7 SOC capabilities.',
      items: [
        'NTT Global Threat Intelligence (cross-customer IOC feeds)',
        'Proactive Threat Hunting via Behavioural Analytics',
        'XDR Integration — Endpoint, Network & Cloud Telemetry',
        'SOAR Playbook Automation with F5 Policy Updates',
        'Deception Technology (Honeypots & Decoy Services)',
        '24/7 NTT Managed SOC with Guaranteed SLA'
      ],
      businessImpact: '15 min faster threat detection vs industry average. 80% fewer security incidents with proactive hunting. 24/7 expert coverage without $2–3M internal SOC build cost.',
      roi: 'Replaces $2–3M internal SOC build — immediate cost avoidance',
      nttValue: 'Global threat intelligence from 100+ enterprise F5 deployments + NTT\'s world-class 24/7 SOC'
    },
    {
      phase: 'Phase 11',
      quarter: 'Q4 2028',
      status: 'planned',
      title: 'Developer Experience & Platform APIs',
      description: 'Remove the F5 skills bottleneck — a developer-first portal with sandboxes, auto-generated SDKs, and GitOps workflows that make F5 as easy as deploying a microservice.',
      items: [
        'Developer Self-Service Portal (no IT tickets)',
        'API Sandbox — Safe Testing Without Production Risk',
        'Auto-Generated SDKs (Python, Go, Java from OpenAPI)',
        'GitOps Deployment — F5 Configs via Git Push',
        '50+ Pre-Built AS3/DO Template Library',
        'Local Dev Emulator for Rapid Iteration'
      ],
      businessImpact: '10x faster developer onboarding to F5 capabilities. 90% of routine changes handled via self-service. Eliminates the F5 skills bottleneck across engineering teams.',
      roi: 'Talent multiplier — maximises existing F5 investment without hiring',
      nttValue: 'NTT Developer Advocates + custom training programs + F5 Centre of Excellence lab access'
    }
  ];

  function getChangeTypeColor(type: string) {
    switch (type) {
      case 'feature': return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
      case 'security': return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
      case 'fix': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200';
    }
  }

  function getChangeTypeLabel(type: string) {
    switch (type) {
      case 'feature': return 'Feature';
      case 'security': return 'Security';
      case 'fix': return 'Fix';
      default: return 'Other';
    }
  }
</script>

<svelte:head>
  <title>About & Documentation - F5 Automation Control Center</title>
</svelte:head>

<div class="space-y-6">
  <!-- Header -->
  <div class="bg-gradient-to-r from-gray-800 to-gray-900 rounded-xl p-8 text-white shadow-lg">
    <div class="flex items-center space-x-4">
      <div class="p-3 bg-white/10 rounded-lg backdrop-blur-sm">
        <Info class="h-8 w-8 text-indigo-400" />
      </div>
      <div>
        <h1 class="text-3xl font-bold">About F5 Automation Control Center</h1>
        <p class="text-gray-300 mt-2 text-lg">
          Enterprise Automation & Orchestration Platform for F5 BIG-IP Infrastructure
        </p>
      </div>
    </div>
  </div>

  <!-- Tabs -->
  <div class="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
    <nav class="flex divide-x divide-gray-200 dark:divide-gray-700" aria-label="Tabs">
      {#each tabs as tab}
        <button
          on:click={() => activeTab = tab.id}
          class="flex-1 group relative min-w-0 overflow-hidden py-4 px-4 text-center text-sm font-medium hover:bg-gray-50 dark:hover:bg-gray-750 focus:z-10 focus:outline-none transition-colors duration-200
            {activeTab === tab.id ? 'text-indigo-600 dark:text-indigo-400' : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'}"
        >
          <div class="flex items-center justify-center">
            <svelte:component this={tab.icon} class="h-5 w-5 mr-2 {activeTab === tab.id ? 'text-indigo-600 dark:text-indigo-400' : 'text-gray-400 group-hover:text-gray-500'}" />
            <span>{tab.label}</span>
          </div>
          <span
            aria-hidden="true"
            class="absolute inset-x-0 bottom-0 h-0.5 {activeTab === tab.id ? 'bg-indigo-500' : 'bg-transparent'}"
          ></span>
        </button>
      {/each}
    </nav>
  </div>

  <!-- Content -->
  <div class="min-h-[500px]">
    
    <!-- COMPARISON TAB -->
    {#if activeTab === 'comparison'}
      <div class="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
        <div class="p-6 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50">
          <h2 class="text-xl font-bold text-gray-900 dark:text-white">Why We Win: The "Circuit Breaker" Advantage</h2>
          <p class="text-gray-500 dark:text-gray-400 mt-1">
            Comparing the F5 Automation Control Center against legacy incumbents.
          </p>
        </div>
        
        <div class="overflow-x-auto">
          <table class="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead class="bg-gray-50 dark:bg-gray-900">
              <tr>
                <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider w-1/4">Feature / Capability</th>
                <th scope="col" class="px-6 py-3 text-left text-xs font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider w-1/4 bg-indigo-50 dark:bg-indigo-900/20 border-t-2 border-indigo-500">
                  F5
                </th>
                <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider w-1/4">Blue Coat (Symantec)</th>
                <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider w-1/4">Fortinet (FortiProxy)</th>
              </tr>
            </thead>
            <tbody class="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
              {#each comparisonData as row}
                <tr class="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                  <td class="px-6 py-4 whitespace-nowrap text-sm font-bold text-gray-900 dark:text-white">{row.feature}</td>
                  
                  <!-- Portal Column -->
                  <td class="px-6 py-4 bg-indigo-50/30 dark:bg-indigo-900/10">
                    <div class="flex items-start">
                      <span class="inline-flex items-center justify-center h-8 w-8 rounded-full font-bold text-sm ring-2 ring-white dark:ring-gray-800 
                        {row.portal.score.startsWith('A') ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}">
                        {row.portal.score}
                      </span>
                      <span class="ml-3 text-sm text-gray-900 dark:text-white font-medium">{row.portal.text}</span>
                    </div>
                  </td>
                  
                  <!-- BlueCoat Column -->
                  <td class="px-6 py-4">
                    <div class="flex items-start">
                      <span class="inline-flex items-center justify-center h-8 w-8 rounded-full font-bold text-sm bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300">
                        {row.bluecoat.score}
                      </span>
                      <span class="ml-3 text-sm text-gray-500 dark:text-gray-400">{row.bluecoat.text}</span>
                    </div>
                  </td>
                  
                  <!-- Forti Column -->
                  <td class="px-6 py-4">
                    <div class="flex items-start">
                      <span class="inline-flex items-center justify-center h-8 w-8 rounded-full font-bold text-sm bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300">
                        {row.forti.score}
                      </span>
                      <span class="ml-3 text-sm text-gray-500 dark:text-gray-400">{row.forti.text}</span>
                    </div>
                  </td>
                </tr>
              {/each}
            </tbody>
          </table>
        </div>
      </div>

      <!-- NTT USP Summary -->
      <div class="mt-8 bg-gradient-to-r from-indigo-900 to-blue-900 rounded-xl p-6 text-white">
        <h2 class="text-xl font-bold mb-1">Why NTT — 6 Unique Differentiators No Other SI Offers</h2>
        <p class="text-indigo-200 text-sm mb-5">Based on competitive analysis across 15+ F5 SIs in the region.</p>
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {#each [
            { title: 'Only SI with Integrated AI Security', desc: 'F5 Calypso AI Gateway + NTT AI Governance Framework — securing LLMs, preventing prompt injection, and governing shadow AI at scale.', icon: '🤖' },
            { title: 'Banking-Specific Compliance Templates', desc: 'Pre-built PCI-DSS 4.0 and MAS TRM templates reviewed by QSAs and regulators. Production-ready on day 1 — not built from scratch.', icon: '🏦' },
            { title: 'White-Label F5-as-a-Service Platform', desc: 'Multi-tenant portal enables clients to offer F5aaS to internal BUs or external customers — a new revenue stream other SIs cannot provide.', icon: '🏗️' },
            { title: '24/7 NTT Global SOC Integration', desc: '15-min threat detection, global threat intelligence from 100+ deployments, and fully managed security operations — not just a monitoring tool.', icon: '🔒' },
            { title: 'Cross-Customer Threat Intelligence', desc: 'Anonymised IOC sharing across NTT\'s global F5 customer base gives every client protection derived from the entire portfolio\'s collective threat data.', icon: '🌐' },
            { title: 'Full 11-Phase Platform Roadmap', desc: 'From core deployment today to AI governance, SOC integration, and developer platform in 2028 — a long-term strategic partnership, not a project handoff.', icon: '🗺️' }
          ] as usp}
            <div class="bg-white/10 backdrop-blur rounded-lg p-4">
              <div class="text-2xl mb-2">{usp.icon}</div>
              <div class="text-sm font-bold mb-1">{usp.title}</div>
              <div class="text-xs text-indigo-200 leading-relaxed">{usp.desc}</div>
            </div>
          {/each}
        </div>
      </div>

    <!-- PROXY DEEP DIVE SECTION -->
      <div class="mt-8 bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
        <div class="p-6 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50">
          <h2 class="text-xl font-bold text-gray-900 dark:text-white">Technical Deep Dive: Proxy Capabilities</h2>
          <p class="text-gray-500 dark:text-gray-400 mt-1">
            Specific comparison of core proxy protocols and inspection capabilities.
          </p>
        </div>
        
        <div class="overflow-x-auto">
          <table class="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead class="bg-gray-50 dark:bg-gray-900">
              <tr>
                <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider w-1/4">Capability</th>
                <th scope="col" class="px-6 py-3 text-left text-xs font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider w-1/4 bg-indigo-50 dark:bg-indigo-900/20 border-t-2 border-indigo-500">
                  F5
                </th>
                <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider w-1/4">Blue Coat</th>
                <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider w-1/4">Fortinet</th>
              </tr>
            </thead>
            <tbody class="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
              {#each proxyComparisonData as row}
                <tr class="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                  <td class="px-6 py-4 whitespace-nowrap text-sm font-bold text-gray-900 dark:text-white">{row.feature}</td>
                  
                  <!-- Portal Column -->
                  <td class="px-6 py-4 bg-indigo-50/30 dark:bg-indigo-900/10">
                    <div class="flex items-start">
                      <span class="inline-flex items-center justify-center h-8 w-8 rounded-full font-bold text-sm ring-2 ring-white dark:ring-gray-800 
                        {row.portal.score.startsWith('A') || row.portal.score === 'Native' || row.portal.score === 'Yes' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}">
                        {row.portal.score}
                      </span>
                      <span class="ml-3 text-sm text-gray-900 dark:text-white font-medium">{row.portal.text}</span>
                    </div>
                  </td>
                  
                  <!-- BlueCoat Column -->
                  <td class="px-6 py-4">
                    <div class="flex items-start">
                      <span class="inline-flex items-center justify-center h-8 w-8 rounded-full font-bold text-sm bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300">
                        {row.bluecoat.score}
                      </span>
                      <span class="ml-3 text-sm text-gray-500 dark:text-gray-400">{row.bluecoat.text}</span>
                    </div>
                  </td>
                  
                  <!-- Forti Column -->
                  <td class="px-6 py-4">
                    <div class="flex items-start">
                      <span class="inline-flex items-center justify-center h-8 w-8 rounded-full font-bold text-sm bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300">
                        {row.forti.score}
                      </span>
                      <span class="ml-3 text-sm text-gray-500 dark:text-gray-400">{row.forti.text}</span>
                    </div>
                  </td>
                </tr>
              {/each}
            </tbody>
          </table>
        </div>
      </div>

    <!-- FEATURES TAB -->
    {:else if activeTab === 'features'}
      <!-- Enterprise Value Summary -->
      <div class="bg-gradient-to-r from-indigo-900 to-blue-900 rounded-xl p-5 text-white mb-6">
        <h2 class="text-xl font-bold mb-1">Full-Platform Feature Documentation</h2>
        <p class="text-indigo-200 text-sm">
          8 capability domains covering security, automation, compliance, AI, and developer experience — each with measurable enterprise value.
        </p>
      </div>

      <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
        {#each featuresList as category}
          <div class="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
            <!-- Category Header -->
            <div class="p-5 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/40">
              <div class="flex items-center mb-2">
                <div class="p-2 bg-indigo-100 dark:bg-indigo-900/30 rounded-lg">
                  <svelte:component this={category.icon} class="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
                </div>
                <h3 class="ml-3 text-lg font-bold text-gray-900 dark:text-white">{category.category}</h3>
              </div>
              <div class="text-xs font-medium text-green-700 dark:text-green-400 bg-green-50 dark:bg-green-900/20 px-2 py-1 rounded-full inline-block">
                ↗ {category.enterpriseValue}
              </div>
            </div>

            <!-- Feature Items -->
            <ul class="p-5 space-y-4">
              {#each category.items as item}
                <li class="flex items-start">
                  <CheckCircle class="h-4 w-4 text-green-500 flex-shrink-0 mt-0.5 mr-3" />
                  <div class="flex-1">
                    <div class="flex items-center gap-2 flex-wrap">
                      <span class="text-sm font-bold text-gray-900 dark:text-white">{item.name}</span>
                      {#if item.badge}
                        <span class="text-xs px-1.5 py-0.5 rounded font-medium
                          {item.badge === 'Key Differentiator' ? 'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300' :
                           item.badge === 'NTT Enhanced' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300' :
                           item.badge === 'AI-Powered' ? 'bg-violet-100 text-violet-800 dark:bg-violet-900/40 dark:text-violet-300' :
                           item.badge === 'First-Mover' ? 'bg-rose-100 text-rose-800 dark:bg-rose-900/40 dark:text-rose-300' :
                           item.badge === 'AI Security' ? 'bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300' :
                           item.badge === 'Cloud-Native' ? 'bg-cyan-100 text-cyan-800 dark:bg-cyan-900/40 dark:text-cyan-300' :
                           item.badge === 'Productivity Win' ? 'bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300' :
                           'bg-gray-100 text-gray-700'}">
                          {item.badge}
                        </span>
                      {/if}
                    </div>
                    <span class="block text-xs text-gray-500 dark:text-gray-400 mt-0.5 leading-relaxed">{item.desc}</span>
                  </div>
                </li>
              {/each}
            </ul>
          </div>
        {/each}
      </div>

    <!-- ROADMAP TAB -->
    {:else if activeTab === 'roadmap'}
      <div class="space-y-6">
        <!-- Roadmap Header -->
        <div class="bg-gradient-to-r from-indigo-900 to-blue-900 rounded-xl p-6 text-white">
          <h2 class="text-2xl font-bold mb-2">Enterprise Product Roadmap — 11 Phases to Full Platform Maturity</h2>
          <p class="text-indigo-200 text-sm mb-4">
            From core F5 automation (Phase 1) to an AI-governed, fully managed service provider platform (Phase 11) — each phase delivers measurable ROI and positions NTT as the only SI with this depth of F5 capability.
          </p>
          <div class="grid grid-cols-3 gap-4">
            <div class="text-center">
              <div class="text-2xl font-bold text-green-400">1</div>
              <div class="text-xs text-indigo-300">Phase Completed</div>
            </div>
            <div class="text-center">
              <div class="text-2xl font-bold text-indigo-400">1</div>
              <div class="text-xs text-indigo-300">Phase In Progress</div>
            </div>
            <div class="text-center">
              <div class="text-2xl font-bold text-gray-400">9</div>
              <div class="text-xs text-indigo-300">Phases Planned</div>
            </div>
          </div>
        </div>

        <!-- Legend -->
        <div class="flex items-center space-x-6 text-sm">
          <div class="flex items-center space-x-2">
            <div class="w-3 h-3 bg-green-500 rounded-full"></div>
            <span class="text-gray-600 dark:text-gray-400">Completed</span>
          </div>
          <div class="flex items-center space-x-2">
            <div class="w-3 h-3 bg-indigo-500 rounded-full animate-pulse"></div>
            <span class="text-gray-600 dark:text-gray-400">In Progress</span>
          </div>
          <div class="flex items-center space-x-2">
            <div class="w-3 h-3 bg-gray-300 dark:bg-gray-600 rounded-full"></div>
            <span class="text-gray-600 dark:text-gray-400">Planned</span>
          </div>
        </div>

        <!-- Phase Cards -->
        <div class="space-y-4">
          {#each roadmapItems as phase}
            <div class="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden
              {phase.status === 'in-progress' ? 'ring-2 ring-indigo-500' : ''}
              {phase.status === 'completed' ? 'border-l-4 border-l-green-500' : ''}">

              <!-- Phase Header Row -->
              <div class="p-5 flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                <div class="flex items-start space-x-4 flex-1">
                  <!-- Phase Number Badge -->
                  <div class="flex-shrink-0 w-12 h-12 rounded-full flex items-center justify-center text-sm font-bold
                    {phase.status === 'completed' ? 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300' :
                     phase.status === 'in-progress' ? 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-300 ring-2 ring-indigo-400' :
                     'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300'}">
                    {phase.phase.replace('Phase ', 'P')}
                  </div>
                  <div class="flex-1">
                    <div class="flex flex-wrap items-center gap-2 mb-1">
                      <span class="text-xs font-medium px-2 py-0.5 rounded-full
                        {phase.status === 'completed' ? 'bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300' :
                         phase.status === 'in-progress' ? 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900/40 dark:text-indigo-300' :
                         'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300'}">
                        {phase.quarter}
                      </span>
                      <span class="text-xs font-medium px-2 py-0.5 rounded-full
                        {phase.status === 'completed' ? 'bg-green-50 text-green-700' :
                         phase.status === 'in-progress' ? 'bg-indigo-50 text-indigo-700' :
                         'bg-gray-50 text-gray-600 dark:bg-gray-700 dark:text-gray-400'}">
                        {phase.status === 'completed' ? '✓ Delivered' : phase.status === 'in-progress' ? '⚡ In Progress' : '◦ Planned'}
                      </span>
                    </div>
                    <h3 class="text-lg font-bold text-gray-900 dark:text-white">{phase.title}</h3>
                    <p class="text-sm text-gray-500 dark:text-gray-400 mt-1">{phase.description}</p>
                  </div>
                </div>

                <!-- ROI Callout -->
                <div class="flex-shrink-0 text-center bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700 rounded-lg px-4 py-3 min-w-[140px]">
                  <div class="text-xs text-amber-600 dark:text-amber-400 font-medium mb-1">ROI Indicator</div>
                  <div class="text-sm font-bold text-amber-800 dark:text-amber-300">{phase.roi}</div>
                </div>
              </div>

              <!-- Capabilities + Business Impact (two-column) -->
              <div class="grid md:grid-cols-2 gap-0 border-t border-gray-200 dark:border-gray-700">
                <!-- Deliverables -->
                <div class="p-5 border-b md:border-b-0 md:border-r border-gray-200 dark:border-gray-700">
                  <h4 class="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-3">Deliverables</h4>
                  <ul class="space-y-2">
                    {#each phase.items as item}
                      <li class="flex items-start text-sm text-gray-700 dark:text-gray-300">
                        {#if phase.status === 'completed'}
                          <CheckCircle class="h-4 w-4 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                        {:else if phase.status === 'in-progress'}
                          <Zap class="h-4 w-4 text-indigo-500 mr-2 mt-0.5 flex-shrink-0" />
                        {:else}
                          <div class="h-1.5 w-1.5 rounded-full bg-gray-400 mr-3 mt-1.5 ml-1 flex-shrink-0"></div>
                        {/if}
                        {item}
                      </li>
                    {/each}
                  </ul>
                </div>

                <!-- Business Impact + NTT Value -->
                <div class="p-5 space-y-4">
                  <div>
                    <h4 class="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-2">Enterprise Business Impact</h4>
                    <div class="p-3 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
                      <p class="text-sm text-green-800 dark:text-green-300">{phase.businessImpact}</p>
                    </div>
                  </div>
                  <div>
                    <h4 class="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-2">NTT SI Advantage</h4>
                    <div class="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                      <p class="text-sm text-blue-800 dark:text-blue-300">🏆 {phase.nttValue}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          {/each}
        </div>

        <!-- Roadmap Summary CTA -->
        <div class="bg-gradient-to-r from-gray-900 to-indigo-900 rounded-xl p-6 text-white text-center">
          <h3 class="text-xl font-bold mb-2">Ready to Start Your Automation Journey?</h3>
          <p class="text-gray-300 text-sm mb-4 max-w-2xl mx-auto">
            Phase 1 is live today. Each subsequent phase builds on the last, delivering compounding ROI and positioning NTT as the only SI with a full-stack F5 automation platform. Typical enterprise clients realise full ROI within 12–18 months.
          </p>
          <div class="flex flex-wrap justify-center gap-3 text-sm">
            {#each [
              { label: 'Current Phase', value: 'Phase 2 — SWG', color: 'indigo' },
              { label: 'Avg ROI Payback', value: '10–14 months', color: 'green' },
              { label: 'Phases to Full Platform', value: '9 remaining', color: 'amber' }
            ] as stat}
              <div class="bg-white/10 backdrop-blur rounded-lg px-4 py-2">
                <div class="text-xs text-gray-400">{stat.label}</div>
                <div class="font-bold">{stat.value}</div>
              </div>
            {/each}
          </div>
        </div>
      </div>

    <!-- RELEASE NOTES TAB -->
    {:else if activeTab === 'releases'}
      <div class="max-w-5xl mx-auto space-y-8">
        <div class="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <div class="flex items-center justify-between mb-6">
            <div>
              <h2 class="text-2xl font-bold text-gray-900 dark:text-white">Release Notes</h2>
              <p class="text-gray-500 dark:text-gray-400 mt-1">
                Detailed version history based on git commits with semantic versioning
              </p>
            </div>
            <div class="text-right">
              <div class="text-sm text-gray-500 dark:text-gray-400">Current Version</div>
              <div class="text-2xl font-bold text-indigo-600 dark:text-indigo-400">{releaseNotes[0].version}</div>
            </div>
          </div>

          <div class="space-y-10">
            {#each releaseNotes as release}
              <div class="border-l-4 border-indigo-500 pl-6 py-2">
                <!-- Version Header -->
                <div class="flex items-center space-x-3 mb-3">
                  <Tag class="h-5 w-5 text-indigo-500" />
                  <h3 class="text-xl font-bold text-gray-900 dark:text-white">Version {release.version}</h3>
                  <span class="text-sm text-gray-500 dark:text-gray-400 flex items-center">
                    <Calendar class="h-4 w-4 mr-1" />
                    {release.date}
                  </span>
                </div>

                <!-- Highlights -->
                {#if release.highlights}
                  <div class="mb-4 p-3 bg-indigo-50 dark:bg-indigo-900/20 rounded-lg">
                    <h4 class="text-sm font-semibold text-indigo-900 dark:text-indigo-300 mb-2">Highlights</h4>
                    <ul class="space-y-1">
                      {#each release.highlights as highlight}
                        <li class="text-sm text-indigo-800 dark:text-indigo-400 flex items-start">
                          <span class="mr-2">•</span>
                          {highlight}
                        </li>
                      {/each}
                    </ul>
                  </div>
                {/if}

                <!-- Detailed Changes -->
                <div class="space-y-2">
                  <h4 class="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Detailed Changes</h4>
                  {#each release.changes as change}
                    <div class="flex items-start py-1.5 border-b border-gray-100 dark:border-gray-700 last:border-0">
                      <span class="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium mr-3 mt-0.5 flex-shrink-0 {getChangeTypeColor(change.type)}">
                        {getChangeTypeLabel(change.type)}
                      </span>
                      <div class="flex-1">
                        <span class="text-gray-700 dark:text-gray-300 text-sm">{change.text}</span>
                        {#if change.commit}
                          <code class="ml-2 text-xs text-gray-400 font-mono">{change.commit}</code>
                        {/if}
                      </div>
                    </div>
                  {/each}
                </div>
              </div>
            {/each}
          </div>
        </div>

        <!-- Versioning Info -->
        <div class="bg-gray-50 dark:bg-gray-900/50 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
          <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-3">Versioning Scheme</h3>
          <p class="text-sm text-gray-600 dark:text-gray-400 mb-3">
            We follow semantic versioning (0.x.y) during pre-release development:
          </p>
          <ul class="space-y-2 text-sm text-gray-600 dark:text-gray-400">
            <li class="flex items-center">
              <span class="w-2 h-2 bg-blue-500 rounded-full mr-2"></span>
              <strong>0.x.0</strong> — Minor version: New features, significant enhancements
            </li>
            <li class="flex items-center">
              <span class="w-2 h-2 bg-green-500 rounded-full mr-2"></span>
              <strong>0.x.y</strong> — Patch version: Bug fixes, small improvements
            </li>
            <li class="flex items-center">
              <span class="w-2 h-2 bg-red-500 rounded-full mr-2"></span>
              <strong>Security</strong> — Security patches (may bump either x or y)
            </li>
          </ul>
          
          <div class="mt-4 p-3 bg-white dark:bg-gray-800 rounded border border-gray-200 dark:border-gray-700">
            <p class="text-xs text-gray-500 dark:text-gray-400">
              <strong>Note:</strong> Each release aggregates multiple git commits. The commit hashes shown link to specific changes within that release cycle.
            </p>
          </div>
        </div>
      </div>
    {/if}
  </div>
</div>
