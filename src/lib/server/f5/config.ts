/**
 * F5 Configuration
 * Environment-based configuration for F5 integrations
 */

export const F5_CONFIG = {
  // iControl REST API
  HOST: process.env.F5_HOST || 'https://bigip-mgmt.bank.com',
  USERNAME: process.env.F5_USERNAME || 'admin',
  PASSWORD: process.env.F5_PASSWORD || '',
  VERIFY_SSL: process.env.F5_VERIFY_SSL !== 'false',
  TOKEN_TIMEOUT: parseInt(process.env.F5_TOKEN_TIMEOUT || '3600'),
  
  // Partitions
  PARTITION: process.env.F5_PARTITION || 'Common',
  
  // SSL Orchestrator
  SSLO: {
    ENABLED: process.env.SSLO_ENABLED !== 'false',
    API_URL: process.env.SSLO_API_URL || 'https://bigip-mgmt.bank.com/mgmt/shared/ssl-orchestrator',
    TOPOLOGY_NAME: process.env.SSLO_TOPOLOGY_NAME || 'swg-topology',
    SERVICE_CHAIN: process.env.SSLO_SERVICE_CHAIN || 'swg-service-chain',
  },
  
  // Secure Web Gateway
  SWG: {
    ENABLED: process.env.SWG_ENABLED !== 'false',
    EXPLICIT_PROXY_VS: process.env.SWG_EXPLICIT_PROXY_VS || 'vs_swg_explicit',
    EXPLICIT_PROXY_IP: process.env.SWG_EXPLICIT_PROXY_IP || '10.1.10.51',
    EXPLICIT_PROXY_PORT: parseInt(process.env.SWG_EXPLICIT_PROXY_PORT || '8080'),
    INTERCEPT_PROFILE: process.env.SWG_INTERCEPT_PROFILE || 'swg-intercept',
    FORWARD_PROXY_PROFILE: process.env.SWG_FORWARD_PROXY_PROFILE || 'swg-forward-proxy',
  },
  
  // Access Policy Manager
  APM: {
    ENABLED: process.env.APM_ENABLED !== 'false',
    ACCESS_PROFILE: process.env.APM_ACCESS_PROFILE || 'swg-access-profile',
    PER_REQUEST_POLICY: process.env.APM_PER_REQUEST_POLICY || 'swg-per-request-policy',
    NTLM_AUTH: {
      SERVERS: process.env.APM_NTLM_SERVERS?.split(',') || ['10.1.10.10'],
      DOMAIN: process.env.APM_NTLM_DOMAIN || 'CORP',
    },
    LDAP_AUTH: {
      SERVER: process.env.APM_LDAP_SERVER || 'ldap://10.1.10.10:389',
      BIND_DN: process.env.APM_LDAP_BIND_DN || '',
      BIND_PASSWORD: process.env.APM_LDAP_BIND_PASSWORD || '',
      SEARCH_BASE: process.env.APM_LDAP_SEARCH_BASE || 'dc=corp,dc=local',
    },
    KERBEROS_AUTH: {
      REALM: process.env.APM_KERBEROS_REALM || 'CORP.LOCAL',
      KDC: process.env.APM_KERBEROS_KDC || '10.1.10.10',
    },
  },
  
  // AS3 (Application Services 3 Extension)
  AS3: {
    ENABLED: process.env.AS3_ENABLED !== 'false',
    API_URL: process.env.AS3_API_URL || 'https://bigip-mgmt.bank.com/mgmt/shared/appsvcs',
    TENANT: process.env.AS3_TENANT || 'SWG',
    APPLICATION: process.env.AS3_APPLICATION || 'SecureWebGateway',
  },
  
  // Data Groups
  DATA_GROUPS: {
    BLOCKED_URLS: process.env.DG_BLOCKED_URLS || 'dg-blocked-urls',
    SSL_BYPASS: process.env.DG_SSL_BYPASS || 'dg-ssl-bypass',
    DENY_USERS: process.env.DG_DENY_USERS || 'dg-deny-users',
    ALLOWED_CATEGORIES: process.env.DG_ALLOWED_CATEGORIES || 'dg-allowed-categories',
  },
  
  // Logging
  LOGGING: {
    HSL_POOL: process.env.F5_HSL_POOL || 'hsl-pool',
    REQUEST_LOGGING: process.env.F5_REQUEST_LOGGING || 'swg-request-logging',
    RESPONSE_LOGGING: process.env.F5_RESPONSE_LOGGING || 'swg-response-logging',
  },
  
  // SSL/TLS
  SSL: {
    CA_CERT: process.env.F5_CA_CERT || 'swg-ca-cert',
    CA_KEY: process.env.F5_CA_KEY || 'swg-ca-key',
    INTERCEPT_PROFILE: process.env.F5_SSL_INTERCEPT_PROFILE || 'swg-ssl-intercept',
    BYPASS_PROFILE: process.env.F5_SSL_BYPASS_PROFILE || 'swg-ssl-bypass',
  },
  
  // ICAP
  ICAP: {
    ENABLED: process.env.ICAP_ENABLED === 'true',
    SERVERS: process.env.ICAP_SERVERS?.split(',') || [],
    FAIL_OPEN: process.env.ICAP_FAIL_OPEN !== 'false',
  },
  
  // SIEM
  SIEM: {
    ENABLED: process.env.SIEM_ENABLED === 'true',
    SERVERS: process.env.SIEM_SERVERS?.split(',') || [],
    FORMAT: process.env.SIEM_FORMAT || 'cef',
  },
};

export default F5_CONFIG;
