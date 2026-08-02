/**
 * Configuration Template Store
 * Manages reusable AS3, DO, and TS templates for rapid deployment
 * Enterprise-grade template library with version control and approval workflows
 */

import { writable, type Writable } from 'svelte/store';


export type TemplateType = 'as3' | 'do' | 'ts' | 'fast' | 'terraform' | 'ansible';
export type TemplateCategory = 
  | 'web-application' 
  | 'api-gateway' 
  | 'microservices' 
  | 'legacy-migration'
  | 'security-policy'
  | 'compliance'
  | 'custom';

export type TemplateStatus = 'draft' | 'pending-approval' | 'approved' | 'rejected' | 'deprecated';

export interface ConfigTemplate {
  id: string;
  name: string;
  description: string;
  type: TemplateType;
  category: TemplateCategory;
  status: TemplateStatus;
  version: string;
  
  // Template content
  content: string;
  schema: any; // JSON schema for validation
  
  // Variables for parameterization
  variables: TemplateVariable[];
  
  // Metadata
  createdAt: number;
  createdBy: string;
  updatedAt: number;
  updatedBy: string;
  approvedAt?: number;
  approvedBy?: string;
  
  // Usage tracking
  usageCount: number;
  lastUsedAt?: number;
  successRate: number; // 0-100
  
  // Approval workflow
  approvers: string[];
  approvalNotes?: string;
  
  // Tags and search
  tags: string[];
  
  // Documentation
  documentation?: string;
  examples?: TemplateExample[];
  
  // Validation
  validated: boolean;
  validationResult?: ValidationResult;
}

export interface TemplateVariable {
  name: string;
  type: 'string' | 'number' | 'boolean' | 'select' | 'multiselect' | 'ip' | 'port' | 'certificate';
  label: string;
  description?: string;
  required: boolean;
  defaultValue?: any;
  options?: string[]; // For select/multiselect
  validation?: {
    pattern?: string;
    min?: number;
    max?: number;
    minLength?: number;
    maxLength?: number;
  };
}

export interface TemplateExample {
  name: string;
  description: string;
  variables: Record<string, any>;
  expectedResult?: string;
}

export interface ValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
  timestamp: number;
}

export interface TemplateDeployment {
  id: string;
  templateId: string;
  templateName: string;
  variables: Record<string, any>;
  status: 'pending' | 'validating' | 'deploying' | 'completed' | 'failed';
  targetDevices: string[];
  deployedAt?: number;
  deployedBy: string;
  result?: any;
  error?: string;
}

// Pre-built enterprise templates
export const enterpriseTemplates: Record<string, Partial<ConfigTemplate>> = {
  'https-application': {
    name: 'HTTPS Web Application',
    description: 'Standard HTTPS application with WAF, SSL offloading, and health monitoring',
    type: 'as3',
    category: 'web-application',
    variables: [
      { name: 'tenant', type: 'string', label: 'Tenant Name', required: true, defaultValue: 'my-tenant' },
      { name: 'appName', type: 'string', label: 'Application Name', required: true },
      { name: 'vip', type: 'ip', label: 'Virtual IP', required: true },
      { name: 'port', type: 'port', label: 'Service Port', required: true, defaultValue: 443 },
      { name: 'poolMembers', type: 'string', label: 'Pool Members (comma-separated)', required: true },
      { name: 'sslCert', type: 'certificate', label: 'SSL Certificate', required: true },
      { name: 'enableWaf', type: 'boolean', label: 'Enable WAF', required: false, defaultValue: true },
      { name: 'enableCaching', type: 'boolean', label: 'Enable Caching', required: false, defaultValue: false }
    ],
    tags: ['https', 'web', 'waf', 'ssl', 'production-ready'],
    content: `{
  "class": "AS3",
  "declaration": {
    "class": "ADC",
    "schemaVersion": "3.0.0",
    "{{tenant}}": {
      "class": "Tenant",
      "{{appName}}": {
        "class": "Application",
        "template": "https",
        "serviceMain": {
          "class": "Service_HTTPS",
          "virtualAddresses": ["{{vip}}"],
          "virtualPort": {{port}},
          "pool": "web_pool",
          "serverTLS": "webtls",
          {{#enableWaf}}
          "policyWAF": {
            "bigip": "/Common/WAF_Policy"
          },
          {{/enableWaf}}
          {{#enableCaching}}
          "profileHTTPCompression": "basic",
          {{/enableCaching}}
          "profileMultiplex": "basic"
        },
        "web_pool": {
          "class": "Pool",
          "monitors": ["http"],
          "members": [{{#poolMembers}}"{{.}}"{{^last}},{{/last}}{{/poolMembers}}]
        },
        "webtls": {
          "class": "TLS_Server",
          "certificates": [{
            "certificate": "webcert"
          }]
        },
        "webcert": {
          "class": "Certificate",
          "certificate": "{{sslCert}}"
        }
      }
    }
  }
}`
  },
  
  'api-gateway': {
    name: 'API Gateway with Rate Limiting',
    description: 'API gateway configuration with rate limiting, OAuth validation, and path-based routing',
    type: 'as3',
    category: 'api-gateway',
    variables: [
      { name: 'tenant', type: 'string', label: 'Tenant Name', required: true, defaultValue: 'api-tenant' },
      { name: 'gatewayName', type: 'string', label: 'Gateway Name', required: true },
      { name: 'vip', type: 'ip', label: 'Virtual IP', required: true },
      { name: 'rateLimit', type: 'number', label: 'Rate Limit (req/min)', required: true, defaultValue: 1000 },
      { name: 'enableOAuth', type: 'boolean', label: 'Enable OAuth', required: false, defaultValue: true },
      { name: 'oauthProvider', type: 'select', label: 'OAuth Provider', required: false, options: ['Azure AD', 'Okta', 'Auth0'], defaultValue: 'Azure AD' },
      { name: 'backendServices', type: 'string', label: 'Backend Services JSON', required: true }
    ],
    tags: ['api', 'gateway', 'oauth', 'rate-limiting', 'microservices'],
    content: `{
  "class": "AS3",
  "declaration": {
    "class": "ADC",
    "schemaVersion": "3.0.0",
    "{{tenant}}": {
      "class": "Tenant",
      "{{gatewayName}}": {
        "class": "Application",
        "template": "generic",
        "api_service": {
          "class": "Service_HTTPS",
          "virtualAddresses": ["{{vip}}"],
          "virtualPort": 443,
          "pool": "api_pool",
          "policyEndpoint": "rate_limit_policy",
          {{#enableOAuth}}
          "policyIAM": "oauth_policy",
          {{/enableOAuth}}
          "profileTrafficLog": {
            "bigip": "/Common/request-log"
          }
        },
        "rate_limit_policy": {
          "class": "Endpoint_Policy",
          "rules": [{
            "name": "rate_limit",
            "conditions": [],
            "actions": [{
              "type": "rateLimit",
              "rate": {{rateLimit}}
            }]
          }]
        }
      }
    }
  }
}`
  },
  
  'microservice-ingress': {
    name: 'Kubernetes Microservice Ingress',
    description: 'Container Ingress Services configuration for Kubernetes microservices',
    type: 'as3',
    category: 'microservices',
    variables: [
      { name: 'namespace', type: 'string', label: 'Kubernetes Namespace', required: true },
      { name: 'serviceName', type: 'string', label: 'Service Name', required: true },
      { name: 'ingressClass', type: 'string', label: 'Ingress Class', required: true, defaultValue: 'f5' },
      { name: 'enableIstio', type: 'boolean', label: 'Enable Istio Integration', required: false, defaultValue: false },
      { name: 'sslMode', type: 'select', label: 'SSL Mode', required: true, options: ['edge', 'passthrough', 'reencrypt'], defaultValue: 'edge' }
    ],
    tags: ['kubernetes', 'microservices', 'cicd', 'devops', 'cloud-native'],
    content: `{
  "class": "AS3",
  "declaration": {
    "class": "ADC",
    "schemaVersion": "3.0.0",
    "k8s": {
      "class": "Tenant",
      "{{namespace}}": {
        "class": "Application",
        "{{serviceName}}": {
          "class": "Service_HTTP",
          "virtualAddresses": ["10.1.1.100"],
          "pool": "{{serviceName}}_pool"
        }
      }
    }
  }
}`
  },
  
  'device-onboarding': {
    name: 'F5 Device Onboarding (DO)',
    description: 'Declarative Onboarding template for new F5 device provisioning',
    type: 'do',
    category: 'legacy-migration',
    variables: [
      { name: 'hostname', type: 'string', label: 'Device Hostname', required: true },
      { name: 'mgmtIp', type: 'ip', label: 'Management IP', required: true },
      { name: 'ntpServers', type: 'string', label: 'NTP Servers', required: true, defaultValue: 'pool.ntp.org' },
      { name: 'dnsServers', type: 'string', label: 'DNS Servers', required: true, defaultValue: '8.8.8.8' },
      { name: 'vlanName', type: 'string', label: 'VLAN Name', required: true },
      { name: 'vlanTag', type: 'number', label: 'VLAN Tag', required: true },
      { name: 'selfIp', type: 'ip', label: 'Self IP', required: true },
      { name: 'licenseKey', type: 'string', label: 'License Key', required: true }
    ],
    tags: ['onboarding', 'provisioning', 'day-0', 'do', 'infrastructure'],
    content: `{
  "schemaVersion": "1.0.0",
  "class": "Device",
  "label": "{{hostname}} Onboarding",
  "async": true,
  "Common": {
    "class": "Tenant",
    "hostname": "{{hostname}}",
    "myLicense": {
      "class": "License",
      "licenseKey": "{{licenseKey}}"
    },
    "myDns": {
      "class": "DNS",
      "nameServers": ["{{dnsServers}}"],
      "search": ["local"]
    },
    "myNtp": {
      "class": "NTP",
      "servers": ["{{ntpServers}}"],
      "timezone": "UTC"
    },
    "{{vlanName}}": {
      "class": "VLAN",
      "tag": {{vlanTag}},
      "mtu": 1500,
      "interfaces": [{
        "name": "1.1",
        "tagged": false
      }]
    },
    "{{vlanName}}-self": {
      "class": "SelfIp",
      "address": "{{selfIp}}/24",
      "vlan": "{{vlanName}}",
      "allowService": "default",
      "trafficGroup": "traffic-group-local-only"
    }
  }
}`
  },
  
  'security-policy': {
    name: 'AWAF Security Policy',
    description: 'Advanced WAF policy template with OWASP Top 10 protection',
    type: 'as3',
    category: 'security-policy',
    variables: [
      { name: 'policyName', type: 'string', label: 'Policy Name', required: true },
      { name: 'enforcementMode', type: 'select', label: 'Enforcement Mode', required: true, options: ['transparent', 'blocking'], defaultValue: 'blocking' },
      { name: 'template', type: 'select', label: 'Policy Template', required: true, options: ['OWASP', 'Financial', 'Healthcare', 'API'], defaultValue: 'OWASP' },
      { name: 'enableBotDefense', type: 'boolean', label: 'Enable Bot Defense', required: false, defaultValue: true },
      { name: 'enableDataGuard', type: 'boolean', label: 'Enable Data Guard', required: false, defaultValue: true }
    ],
    tags: ['security', 'waf', 'owasp', 'compliance', 'protection'],
    content: `{
  "class": "WAF_Policy",
  "name": "{{policyName}}",
  "template": "{{template}}",
  "enforcementMode": "{{enforcementMode}}",
  "general": {
    "allowedResponseCodes": [200, 201, 204, 301, 302, 401, 403, 404, 500],
    "maskCreditCardNumbersInLogs": {{enableDataGuard}}
  },
  "botDefense": {
    "enabled": {{enableBotDefense}}
  }
}`
  },
  
  'compliance-audit': {
    name: 'Compliance Audit Configuration',
    description: 'Telemetry Streaming configuration for compliance auditing and SIEM integration',
    type: 'ts',
    category: 'compliance',
    variables: [
      { name: 'splunkHost', type: 'string', label: 'Splunk Host', required: false },
      { name: 'splunkPort', type: 'port', label: 'Splunk Port', required: false, defaultValue: 8088 },
      { name: 'splunkToken', type: 'string', label: 'Splunk HEC Token', required: false },
      { name: 'enableAwsS3', type: 'boolean', label: 'Enable AWS S3 Archive', required: false, defaultValue: false },
      { name: 's3Bucket', type: 'string', label: 'S3 Bucket Name', required: false },
      { name: 'logTypes', type: 'multiselect', label: 'Log Types', required: true, options: ['ltm', 'asm', 'apm', 'audit', 'event'], defaultValue: ['ltm', 'asm'] }
    ],
    tags: ['compliance', 'audit', 'siem', 'logging', 'security'],
    content: `{
  "class": "Telemetry",
  "schemaVersion": "1.0.0",
  "controls": {
    "class": "Controls",
    "logLevel": "info"
  },
  "My_System": {
    "class": "Telemetry_System",
    "systemPoller": {
      "interval": 60
    }
  },
  "My_Listener": {
    "class": "Telemetry_Listener",
    "port": 6514
  }
}`
  }
};

function createConfigTemplateStore() {
  const { subscribe, set, update } = writable<ConfigTemplate[]>([]);
  const deploymentStore = writable<TemplateDeployment[]>([]);
  let templateIdCounter = 0;
  let deploymentIdCounter = 0;

  // Initialize with enterprise templates
  const initialTemplates: ConfigTemplate[] = Object.entries(enterpriseTemplates).map(([id, tmpl], index) => ({
    id: `template-${index + 1}`,
    name: tmpl.name || 'Unnamed Template',
    description: tmpl.description || '',
    type: tmpl.type || 'as3',
    category: tmpl.category || 'custom',
    status: 'approved',
    version: '1.0.0',
    content: tmpl.content || '{}',
    schema: {},
    variables: tmpl.variables || [],
    createdAt: Date.now() - Math.random() * 90 * 24 * 60 * 60 * 1000,
    createdBy: 'system',
    updatedAt: Date.now(),
    updatedBy: 'system',
    approvedAt: Date.now(),
    approvedBy: 'admin',
    usageCount: Math.floor(Math.random() * 50),
    successRate: 85 + Math.floor(Math.random() * 15),
    approvers: ['admin', 'security-team'],
    tags: tmpl.tags || [],
    examples: tmpl.examples || [],
    validated: true,
    validationResult: { valid: true, errors: [], warnings: [], timestamp: Date.now() }
  }));

  set(initialTemplates);

  return {
    subscribe,
    deployments: { subscribe: deploymentStore.subscribe },

    // Create new template
    createTemplate: (template: Partial<ConfigTemplate>, createdBy: string): ConfigTemplate => {
      const id = `template-${++templateIdCounter}-${Date.now()}`;
      const newTemplate: ConfigTemplate = {
        id,
        name: 'New Template',
        description: '',
        type: 'as3',
        category: 'custom',
        status: 'draft',
        version: '1.0.0',
        content: '{}',
        schema: {},
        variables: [],
        createdAt: Date.now(),
        createdBy,
        updatedAt: Date.now(),
        updatedBy: createdBy,
        usageCount: 0,
        successRate: 0,
        approvers: [],
        tags: [],
        validated: false,
        ...template
      };

      update(templates => [...templates, newTemplate]);
      console.log(`Config template created: ${newTemplate.name} (${id})`);
      return newTemplate;
    },

    // Create from enterprise template
    createFromTemplate(templateKey: keyof typeof enterpriseTemplates, createdBy: string): ConfigTemplate | null {
      const tmpl = enterpriseTemplates[templateKey];
      if (!tmpl) return null;

      const id = `template-${++templateIdCounter}-${Date.now()}`;
      const newTemplate: ConfigTemplate = {
        id,
        name: tmpl.name || 'Unnamed Template',
        description: tmpl.description || '',
        type: tmpl.type || 'as3',
        category: tmpl.category || 'custom',
        status: 'draft',
        version: '1.0.0',
        content: tmpl.content || '{}',
        schema: {},
        variables: tmpl.variables || [],
        createdAt: Date.now(),
        createdBy,
        updatedAt: Date.now(),
        updatedBy: createdBy,
        usageCount: 0,
        successRate: 0,
        approvers: [],
        tags: [...(tmpl.tags || [])],
        validated: false
      };

      update(templates => [...templates, newTemplate]);
      console.log(`Config template created from enterprise template: ${newTemplate.name} (${id})`);
      return newTemplate;
    },

    // Update template
    updateTemplate: (id: string, updates: Partial<ConfigTemplate>, updatedBy: string) => {
      update(templates => {
        const index = templates.findIndex(t => t.id === id);
        if (index === -1) return templates;

        const newTemplates = [...templates];
        newTemplates[index] = {
          ...newTemplates[index],
          ...updates,
          updatedAt: Date.now(),
          updatedBy
        };
        return newTemplates;
      });
    },

    // Submit for approval
    submitForApproval: (id: string, approvers: string[], notes?: string) => {
      update(templates => {
        const index = templates.findIndex(t => t.id === id);
        if (index === -1) return templates;

        const newTemplates = [...templates];
        newTemplates[index] = {
          ...newTemplates[index],
          status: 'pending-approval',
          approvers,
          approvalNotes: notes
        };
        return newTemplates;
      });
    },

    // Approve or reject template
    reviewTemplate: (id: string, approved: boolean, reviewedBy: string, notes?: string) => {
      update(templates => {
        const index = templates.findIndex(t => t.id === id);
        if (index === -1) return templates;

        const newTemplates = [...templates];
        const template = newTemplates[index];
        
        if (approved) {
          template.status = 'approved';
          template.approvedAt = Date.now();
          template.approvedBy = reviewedBy;
          template.version = incrementVersion(template.version);
        } else {
          template.status = 'rejected';
        }
        
        if (notes) {
          template.approvalNotes = notes;
        }

        return newTemplates;
      });
    },

    // Validate template
    validateTemplate: (id: string): ValidationResult => {
      let result: ValidationResult = { valid: false, errors: [], warnings: [], timestamp: Date.now() };
      
      update(templates => {
        const index = templates.findIndex(t => t.id === id);
        if (index === -1) return templates;

        const template = templates[index];
        const errors: string[] = [];
        const warnings: string[] = [];

        // Basic validation
        if (!template.content || template.content === '{}') {
          errors.push('Template content is empty');
        }

        if (!template.name || template.name.length < 3) {
          errors.push('Template name must be at least 3 characters');
        }

        if (template.variables.length === 0) {
          warnings.push('Template has no variables defined');
        }

        // Try to parse JSON
        try {
          JSON.parse(template.content.replace(/\{\{[^}]+\}\}/g, '"placeholder"'));
        } catch (e) {
          errors.push('Invalid JSON structure in template content');
        }

        result = {
          valid: errors.length === 0,
          errors,
          warnings,
          timestamp: Date.now()
        };

        const newTemplates = [...templates];
        newTemplates[index] = {
          ...template,
          validated: true,
          validationResult: result
        };

        return newTemplates;
      });

      return result;
    },

    // Deploy template
    deployTemplate: (templateId: string, variables: Record<string, any>, targetDevices: string[], deployedBy: string): TemplateDeployment => {
      const deploymentId = `deploy-${++deploymentIdCounter}-${Date.now()}`;
      
      let templateName = '';
      subscribe(templates => {
        const t = templates.find(t => t.id === templateId);
        if (t) templateName = t.name;
      })();

      const deployment: TemplateDeployment = {
        id: deploymentId,
        templateId,
        templateName,
        variables,
        status: 'pending',
        targetDevices,
        deployedBy
      };

      deploymentStore.update(deployments => [deployment, ...deployments]);

      // Simulate deployment
      setTimeout(() => {
        deploymentStore.update(deployments => {
          const index = deployments.findIndex(d => d.id === deploymentId);
          if (index === -1) return deployments;

          const newDeployments = [...deployments];
          newDeployments[index] = {
            ...newDeployments[index],
            status: 'validating'
          };
          return newDeployments;
        });

        // After validation, deploy
        setTimeout(() => {
          deploymentStore.update(deployments => {
            const index = deployments.findIndex(d => d.id === deploymentId);
            if (index === -1) return deployments;

            const newDeployments = [...deployments];
            const success = Math.random() > 0.1; // 90% success rate
            
            newDeployments[index] = {
              ...newDeployments[index],
              status: success ? 'completed' : 'failed',
              deployedAt: Date.now(),
              result: success ? 'Deployment successful' : undefined,
              error: success ? undefined : 'Failed to apply configuration'
            };
            return newDeployments;
          });

          // Update template usage count
          if (Math.random() > 0.1) {
            update(templates => {
              const index = templates.findIndex(t => t.id === templateId);
              if (index === -1) return templates;

              const newTemplates = [...templates];
              newTemplates[index] = {
                ...newTemplates[index],
                usageCount: newTemplates[index].usageCount + 1,
                lastUsedAt: Date.now()
              };
              return newTemplates;
            });
          }
        }, 3000);
      }, 1000);

      return deployment;
    },

    // Delete template
    deleteTemplate: (id: string) => {
      update(templates => templates.filter(t => t.id !== id));
      console.log(`Config template deleted: ${id}`);
    },

    // Get templates by category
    getByCategory: (category: TemplateCategory): ConfigTemplate[] => {
      let result: ConfigTemplate[] = [];
      subscribe(templates => { result = templates.filter(t => t.category === category); })();
      return result;
    },

    // Get templates by type
    getByType: (type: TemplateType): ConfigTemplate[] => {
      let result: ConfigTemplate[] = [];
      subscribe(templates => { result = templates.filter(t => t.type === type); })();
      return result;
    },

    // Get approved templates only
    getApproved: (): ConfigTemplate[] => {
      let result: ConfigTemplate[] = [];
      subscribe(templates => { result = templates.filter(t => t.status === 'approved'); })();
      return result;
    },

    // Search templates
    search: (query: string): ConfigTemplate[] => {
      let result: ConfigTemplate[] = [];
      const lowerQuery = query.toLowerCase();
      subscribe(templates => {
        result = templates.filter(t =>
          t.name.toLowerCase().includes(lowerQuery) ||
          t.description.toLowerCase().includes(lowerQuery) ||
          t.tags.some(tag => tag.toLowerCase().includes(lowerQuery))
        );
      })();
      return result;
    },

    // Get statistics
    getStatistics: () => {
      let result = {
        total: 0,
        byType: {} as Record<TemplateType, number>,
        byCategory: {} as Record<TemplateCategory, number>,
        byStatus: {} as Record<TemplateStatus, number>,
        totalDeployments: 0
      };

      subscribe(templates => {
        result.total = templates.length;
        templates.forEach(t => {
          result.byType[t.type] = (result.byType[t.type] || 0) + 1;
          result.byCategory[t.category] = (result.byCategory[t.category] || 0) + 1;
          result.byStatus[t.status] = (result.byStatus[t.status] || 0) + 1;
        });
      })();

      deploymentStore.subscribe(deployments => {
        result.totalDeployments = deployments.length;
      })();

      return result;
    }
  };
}

// Helper function to increment version
function incrementVersion(version: string): string {
  const parts = version.split('.');
  if (parts.length === 3) {
    const patch = parseInt(parts[2]) + 1;
    return `${parts[0]}.${parts[1]}.${patch}`;
  }
  return '1.0.0';
}

export const configTemplateStore = createConfigTemplateStore();
