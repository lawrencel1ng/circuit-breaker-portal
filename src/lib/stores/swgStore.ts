import { writable } from 'svelte/store';
import type { SWGConfig, PolicyRule } from '$lib/types';

// API Base URL
const API_BASE = '/api/swg';

// Helper function for API calls
async function apiCall(endpoint: string, options: RequestInit = {}) {
  const response = await fetch(`${API_BASE}${endpoint}`, {
    headers: {
      'Content-Type': 'application/json',
      ...options.headers
    },
    ...options
  });
  
  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Unknown error' }));
    throw new Error(error.error || `HTTP ${response.status}`);
  }
  
  return response.json();
}

// Load configuration from API
async function loadConfig(): Promise<SWGConfig> {
  try {
    const [config, urlFiltering, policies] = await Promise.all([
      apiCall('/config'),
      apiCall('/url-filtering'),
      apiCall('/policies')
    ]);

    return {
      proxyListener: config.proxyListener,
      sslConfig: config.sslConfig,
      authentication: config.authentication,
      logging: config.logging,
      siem: config.siem,
      icap: config.icap,
      blockPages: config.blockPages,
      threatFeeds: config.threatFeeds,
      pki: config.pki || {
        crlEnabled: true,
        ocspEnabled: true,
        ocspResponderURL: 'http://ocsp.digicert.com',
        crlDistributionPoint: 'http://crl.digicert.com/ca3.crl',
        certExpiryAlertDays: 30
      },
      urlFiltering: {
        blockedDataGroup: 'dg-blocked-urls',
        blockedUrls: urlFiltering.blockedUrls || [],
        categories: urlFiltering.categories || []
      },
      policies: policies.policies || []
    };
  } catch (error) {
    console.error('Failed to load SWG config:', error);
    // Return default config if API fails
    return defaultConfig;
  }
}

const defaultConfig: SWGConfig = {
  proxyListener: {
    ip: '10.1.10.51',
    port: 8080,
    enabled: true,
    vlan: ['vlan30', 'vlan40']
  },
  authentication: {
    enabled: true,
    scheme: 'ntlm',
    realm: 'CORP.LOCAL',
    ldapConfig: {
      server: 'ldap.corp.local',
      bindDn: 'cn=admin,dc=corp,dc=local',
      searchBase: 'dc=corp,dc=local'
    }
  },
  logging: {
    enabled: true,
    destination: 'local',
    level: 'info'
  },
  siem: {
    enabled: false,
    serverIp: '10.1.60.20',
    port: 514,
    protocol: 'udp',
    format: 'cef'
  },
  icap: {
    enabled: false,
    serverUri: 'icap://10.1.50.100:1344/reqmod',
    previewSize: 1024,
    failOpen: true
  },
  blockPages: {
    customTemplate: '<h1>Access Denied</h1><p>The requested URL has been blocked by corporate policy.</p>',
    contactEmail: 'security@bank.com',
    showCategory: true,
    showIP: true
  },
  threatFeeds: {
    autoUpdate: true,
    updateInterval: 'daily',
    licenseKey: 'XXXX-XXXX-XXXX-XXXX',
    lastUpdate: '2024-05-20 03:00:00',
    status: 'active'
  },
  pki: {
    crlEnabled: true,
    ocspEnabled: true,
    ocspResponderURL: 'http://ocsp.digicert.com',
    crlDistributionPoint: 'http://crl.digicert.com/ca3.crl',
    certExpiryAlertDays: 30
  },
  sslConfig: {
    caCert: 'MyCompany IT CA',
    intercept: true,
    bypassList: ['microsoft.com']
  },
  urlFiltering: {
    blockedDataGroup: 'dg-blocked-urls',
    blockedUrls: ['f5.com', 'gambling.com', 'malware.site'],
    categories: [
      { id: 'cat_malware', name: 'Malware & Phishing', count: 8500, status: 'blocked' },
      { id: 'cat_gambling', name: 'Gambling', count: 420, status: 'blocked' },
      { id: 'cat_adult', name: 'Adult Content', count: 3200, status: 'blocked' },
      { id: 'cat_social', name: 'Social Networking', count: 1200, status: 'allowed' },
      { id: 'cat_streaming', name: 'Streaming Media', count: 540, status: 'allowed' },
      { id: 'cat_shopping', name: 'Shopping', count: 890, status: 'allowed' }
    ]
  },
  policies: [
    {
      id: 'p1',
      name: 'Layer 2 SSL Bypass Policy',
      rules: [
        {
          id: 'r1',
          name: 'ssl-bypass-test',
          condition: {
            type: 'TLS_ClientHello',
            operator: 'substring',
            value: '/Common/dg-ssl-bypass'
          },
          action: 'bypass',
          enabled: true
        }
      ]
    },
    {
      id: 'p2',
      name: 'Layer 3 SWG Policy',
      rules: [
        {
          id: 'r2',
          name: 'block-urls',
          condition: {
            type: 'HTTP_URI',
            operator: 'contains',
            value: '/Common/dg-blocked-urls'
          },
          action: 'reject',
          enabled: true
        },
        {
          id: 'r3',
          name: 'deny-users',
          condition: {
            type: 'User_ID',
            operator: 'equals',
            value: '/Common/dg_deny_users'
          },
          action: 'reject',
          enabled: true
        }
      ]
    }
  ]
};

function createSWGStore() {
  const { subscribe, set, update } = writable<SWGConfig>(defaultConfig);

  // Initialize store with API data
  if (typeof window !== 'undefined') {
    loadConfig().then(config => set(config));
  }

  return {
    subscribe,
    
    // Load configuration from API
    loadConfig: async () => {
      const config = await loadConfig();
      set(config);
      return config;
    },

    // Proxy Configuration
    updateProxyListener: async (config: Partial<SWGConfig['proxyListener']>) => {
      update(state => {
        const newState = {
          ...state,
          proxyListener: { ...state.proxyListener, ...config }
        };
        // Save to API
        apiCall('/config', {
          method: 'POST',
          body: JSON.stringify(newState)
        }).catch(console.error);
        return newState;
      });
    },

    // SSL Configuration
    updateSSLConfig: async (config: Partial<SWGConfig['sslConfig']>) => {
      update(state => {
        const newState = {
          ...state,
          sslConfig: { ...state.sslConfig, ...config }
        };
        apiCall('/config', {
          method: 'POST',
          body: JSON.stringify(newState)
        }).catch(console.error);
        return newState;
      });
    },

    // ICAP Configuration
    updateICAP: async (config: Partial<SWGConfig['icap']>) => {
      update(state => {
        const newState = {
          ...state,
          icap: { ...state.icap, ...config }
        };
        apiCall('/config', {
          method: 'POST',
          body: JSON.stringify(newState)
        }).catch(console.error);
        return newState;
      });
    },

    // SIEM Configuration
    updateSIEM: async (config: Partial<SWGConfig['siem']>) => {
      update(state => {
        const newState = {
          ...state,
          siem: { ...state.siem, ...config }
        };
        apiCall('/config', {
          method: 'POST',
          body: JSON.stringify(newState)
        }).catch(console.error);
        return newState;
      });
    },

    // Block Pages Configuration
    updateBlockPages: async (config: Partial<SWGConfig['blockPages']>) => {
      update(state => {
        const newState = {
          ...state,
          blockPages: { ...state.blockPages, ...config }
        };
        apiCall('/config', {
          method: 'POST',
          body: JSON.stringify(newState)
        }).catch(console.error);
        return newState;
      });
    },

    // Threat Feeds Configuration
    updateThreatFeeds: async (config: Partial<SWGConfig['threatFeeds']>) => {
      update(state => {
        const newState = {
          ...state,
          threatFeeds: { ...state.threatFeeds, ...config }
        };
        apiCall('/config', {
          method: 'POST',
          body: JSON.stringify(newState)
        }).catch(console.error);
        return newState;
      });
    },

    // PKI Configuration
    updatePKI: async (config: Partial<SWGConfig['pki']>) => {
      update(state => {
        const newState = {
          ...state,
          pki: { ...state.pki, ...config }
        };
        apiCall('/config', {
          method: 'POST',
          body: JSON.stringify(newState)
        }).catch(console.error);
        return newState;
      });
    },

    // Authentication Configuration
    updateAuthentication: async (config: Partial<SWGConfig['authentication']>) => {
      update(state => {
        const newState = {
          ...state,
          authentication: { ...state.authentication, ...config }
        };
        apiCall('/config', {
          method: 'POST',
          body: JSON.stringify(newState)
        }).catch(console.error);
        return newState;
      });
    },

    // Logging Configuration
    updateLogging: async (config: Partial<SWGConfig['logging']>) => {
      update(state => {
        const newState = {
          ...state,
          logging: { ...state.logging, ...config }
        };
        apiCall('/config', {
          method: 'POST',
          body: JSON.stringify(newState)
        }).catch(console.error);
        return newState;
      });
    },

    // SSL Bypass List
    addBypassUrl: async (url: string) => {
      update(state => {
        const newState = {
          ...state,
          sslConfig: {
            ...state.sslConfig,
            bypassList: [...state.sslConfig.bypassList, url]
          }
        };
        apiCall('/config', {
          method: 'POST',
          body: JSON.stringify(newState)
        }).catch(console.error);
        return newState;
      });
    },

    removeBypassUrl: async (url: string) => {
      update(state => {
        const newState = {
          ...state,
          sslConfig: {
            ...state.sslConfig,
            bypassList: state.sslConfig.bypassList.filter(u => u !== url)
          }
        };
        apiCall('/config', {
          method: 'POST',
          body: JSON.stringify(newState)
        }).catch(console.error);
        return newState;
      });
    },

    // URL Filtering - Blocked URLs
    addBlockedUrl: async (url: string, group = 'dg-blocked-urls') => {
      await apiCall('/url-filtering', {
        method: 'POST',
        body: JSON.stringify({ url, group })
      });
      
      update(state => ({
        ...state,
        urlFiltering: {
          ...state.urlFiltering,
          blockedUrls: [...state.urlFiltering.blockedUrls, url]
        }
      }));
    },

    removeBlockedUrl: async (url: string, group = 'dg-blocked-urls') => {
      await apiCall('/url-filtering', {
        method: 'DELETE',
        body: JSON.stringify({ url, group })
      });
      
      update(state => ({
        ...state,
        urlFiltering: {
          ...state.urlFiltering,
          blockedUrls: state.urlFiltering.blockedUrls.filter(u => u !== url)
        }
      }));
    },

    updateBlockedUrl: async (oldUrl: string, newUrl: string, group = 'dg-blocked-urls') => {
      await apiCall('/url-filtering', {
        method: 'PATCH',
        body: JSON.stringify({ oldUrl, newUrl, group })
      });
      
      update(state => ({
        ...state,
        urlFiltering: {
          ...state.urlFiltering,
          blockedUrls: state.urlFiltering.blockedUrls.map(u => u === oldUrl ? newUrl : u)
        }
      }));
    },

    // Categories
    toggleCategory: async (categoryId: string) => {
      update(state => ({
        ...state,
        urlFiltering: {
          ...state.urlFiltering,
          categories: state.urlFiltering.categories.map(c => 
            c.id === categoryId 
              ? { ...c, status: c.status === 'blocked' ? 'allowed' : 'blocked' }
              : c
          )
        }
      }));
    },

    // Policies
    addPolicy: async (policy: any) => {
      const result = await apiCall('/policies', {
        method: 'POST',
        body: JSON.stringify(policy)
      });
      
      update(state => ({
        ...state,
        policies: [...state.policies, result.policy]
      }));
    },

    updatePolicy: async (policyId: string, updates: any) => {
      await apiCall(`/policies/${policyId}`, {
        method: 'PUT',
        body: JSON.stringify(updates)
      });
      
      update(state => ({
        ...state,
        policies: state.policies.map(p => 
          p.id === policyId ? { ...p, ...updates } : p
        )
      }));
    },

    deletePolicy: async (policyId: string) => {
      await apiCall(`/policies/${policyId}`, {
        method: 'DELETE'
      });
      
      update(state => ({
        ...state,
        policies: state.policies.filter(p => p.id !== policyId)
      }));
    },

    // Policy Rules
    addPolicyRule: async (policyId: string, rule: PolicyRule) => {
      const result = await apiCall(`/policies/${policyId}/rules`, {
        method: 'POST',
        body: JSON.stringify(rule)
      });
      
      update(state => ({
        ...state,
        policies: state.policies.map(p => 
          p.id === policyId 
            ? { ...p, rules: [...p.rules, result.rule] }
            : p
        )
      }));
    },

    updatePolicyRule: async (policyId: string, ruleId: string, updates: Partial<PolicyRule>) => {
      await apiCall(`/policies/${policyId}/rules/${ruleId}`, {
        method: 'PUT',
        body: JSON.stringify(updates)
      });
      
      update(state => ({
        ...state,
        policies: state.policies.map(p => 
          p.id === policyId 
            ? { ...p, rules: p.rules.map(r => r.id === ruleId ? { ...r, ...updates } : r) }
            : p
        )
      }));
    },

    removePolicyRule: async (policyId: string, ruleId: string) => {
      await apiCall(`/policies/${policyId}/rules/${ruleId}`, {
        method: 'DELETE'
      });
      
      update(state => ({
        ...state,
        policies: state.policies.map(p => 
          p.id === policyId 
            ? { ...p, rules: p.rules.filter(r => r.id !== ruleId) }
            : p
        )
      }));
    },

    reorderPolicyRules: async (policyId: string, oldIndex: number, newIndex: number) => {
      await apiCall(`/policies/${policyId}/rules/reorder`, {
        method: 'PUT',
        body: JSON.stringify({ oldIndex, newIndex })
      });
      
      update(state => ({
        ...state,
        policies: state.policies.map(p => {
          if (p.id !== policyId) return p;
          const rules = [...p.rules];
          const [movedRule] = rules.splice(oldIndex, 1);
          rules.splice(newIndex, 0, movedRule);
          return { ...p, rules };
        })
      }));
    },

    // Sessions
    getSessions: async (status = 'active', limit = 100) => {
      return apiCall(`/sessions?status=${status}&limit=${limit}`);
    },

    closeSession: async (sessionId: string) => {
      return apiCall(`/sessions/${sessionId}`, {
        method: 'DELETE'
      });
    },

    // Logs
    getLogs: async (filters: any = {}) => {
      const params = new URLSearchParams();
      if (filters.action) params.append('action', filters.action);
      if (filters.user) params.append('user', filters.user);
      if (filters.clientIp) params.append('clientIp', filters.clientIp);
      if (filters.limit) params.append('limit', filters.limit.toString());
      if (filters.offset) params.append('offset', filters.offset.toString());
      
      return apiCall(`/logs?${params.toString()}`);
    },

    // Integrations
    testSIEMConnection: async (config: any) => {
      return apiCall('/integrations/siem/test', {
        method: 'POST',
        body: JSON.stringify(config)
      });
    },

    testICAPConnection: async (config: any) => {
      return apiCall('/integrations/icap/test', {
        method: 'POST',
        body: JSON.stringify(config)
      });
    },

    triggerThreatFeedUpdate: async () => {
      return apiCall('/integrations/threat-intel/update', {
        method: 'POST'
      });
    },

    reset: () => set(defaultConfig)
  };
}

export const swgStore = createSWGStore();
