export interface CircuitBreakerConfig {
  lanes: Lane[];
  applications: Application[];
  automationLogs: AutomationLog[];
  globalSettings: GlobalSettings;
  alertConfig: AlertConfig;
  systemSettings: SystemSettings;
}

export interface AlertConfig {
  enabled: boolean;
  channels: AlertChannel[];
  rules: AlertRule[];
}

export interface AlertChannel {
  id: string;
  type: 'email' | 'slack' | 'pagerduty' | 'webhook';
  name: string;
  target: string;
  enabled: boolean;
}

export interface AlertRule {
  id: string;
  metric: 'error_rate' | 'latency' | 'traffic_drop' | 'health_change';
  condition: 'gt' | 'lt' | 'eq';
  threshold: number;
  duration: number; // in minutes
  severity: 'info' | 'warning' | 'critical';
  enabled: boolean;
}

export interface SystemSettings {
  maintenanceMode: boolean;
  maintenanceMessage: string;
  systemName: string;
  dataRetentionDays: number;
  theme: 'light' | 'dark' | 'system';
}

export interface Lane {
  id: string;
  name: string;
  edgeStatus: 'active' | 'inactive' | 'closed';
  enterpriseStatus: 'active' | 'inactive' | 'closed';
  edgeLoadBalancer: LoadBalancerConfig;
  enterpriseLoadBalancer: LoadBalancerConfig;
  edgeCircuitBreaker: CircuitBreakerGSLBConfig;
  enterpriseCircuitBreaker: CircuitBreakerGSLBConfig;
  deployments: Deployment[];
  trafficDistribution: number;
  healthStatus: 'healthy' | 'degraded' | 'down';
}

export interface LoadBalancerConfig {
  virtualServers: VirtualServer[];
  pools: Pool[];
  poolMembers?: PoolMember[];
}

export interface VirtualServer {
  id?: string;
  name: string;
  ip: string;
  port: number;
  status: 'enabled' | 'disabled';
}

export interface Pool {
  id?: string;
  name: string;
  members: PoolMember[] | number; // Allow number for backward compatibility
  status?: 'enabled' | 'disabled';
}

export interface PoolMember {
  id?: string;
  name: string;
  ip: string;
  port: number;
  status: 'enabled' | 'disabled';
  health?: 'up' | 'down';
}

export interface CircuitBreakerGSLBConfig {
  wideIPs: WideIP[];
  pools: Pool[];
}

export interface WideIP {
  id?: string;
  name: string;
  domain?: string;
  ip?: string;
  status: 'active' | 'inactive' | 'enabled' | 'disabled';
}

export interface Deployment {
  id: string;
  name: string;
  servers: Server[] | string[]; // Allow string[] for backward compatibility
  status: 'running' | 'stopped' | 'deploying' | 'standby';
}

export interface Server {
  name: string;
  ip: string;
  status: 'running' | 'stopped';
  health: 'healthy' | 'unhealthy';
}

export interface Application {
  id: string;
  name: string;
  description: string;
  deployedLanes: string[];
  deploymentType?: 'Virtual Servers' | 'Pool Members' | 'Wide IPs';
  status: 'deployed' | 'deploying' | 'failed' | 'running';
  createdAt?: string;
  version?: string;
  lastDeployed?: string;
  health?: 'healthy' | 'unhealthy' | 'degraded';
  plannedExecutionTime?: string;
}

export interface AutomationLog {
  id: string;
  timestamp: string;
  lane: string;
  action: string;
  user: string;
  details: string;
  status: 'success' | 'error' | 'warning';
}

export interface GlobalSettings {
  dnsServer: string;
  ntpServer: string;
  syslogServer: string;
  healthCheckInterval: number;
  circuitBreakerThreshold: number;
  autoFailoverEnabled: boolean;
  maintenanceMode?: boolean;
  maintenanceMessage?: string;
}

export interface SWGConfig {
  proxyListener: ProxyListener;
  sslConfig: SSLConfig;
  authentication: AuthenticationConfig;
  logging: LoggingConfig;
  urlFiltering: URLFilteringConfig;
  policies: SecurityPolicy[];
  icap: ICAPConfig;
  siem: SIEMConfig;
  blockPages: BlockPageConfig;
  threatFeeds: ThreatFeedConfig;
  pki: PKIConfig;
}

export interface ProxyListener {
  ip: string;
  port: number;
  enabled: boolean;
  vlan: string[];
}

export interface BlockPageConfig {
  customTemplate: string;
  contactEmail: string;
  showCategory: boolean;
  showIP: boolean;
}

export interface ThreatFeedConfig {
  autoUpdate: boolean;
  updateInterval: 'hourly' | 'daily' | 'weekly';
  licenseKey: string;
  lastUpdate: string;
  status: 'active' | 'expired' | 'error';
}

export interface PKIConfig {
  crlEnabled: boolean;
  ocspEnabled: boolean;
  ocspResponderURL: string;
  crlDistributionPoint: string;
  certExpiryAlertDays: number;
}

export interface AuthenticationConfig {
  enabled: boolean;
  scheme: 'ntlm' | 'kerberos' | 'basic' | 'saml' | 'ldap';
  realm: string;
  ldapConfig?: {
    server: string;
    bindDn: string;
    searchBase: string;
  };
}

export interface LoggingConfig {
  enabled: boolean;
  destination: 'local' | 'remote';
  ip?: string;
  level: 'info' | 'debug' | 'error';
}

export interface ICAPConfig {
  enabled: boolean;
  serverUri: string;
  previewSize: number;
  failOpen: boolean;
}

export interface SIEMConfig {
  enabled: boolean;
  serverIp: string;
  port: number;
  protocol: 'tcp' | 'udp' | 'tls';
  format: 'cef' | 'leef' | 'syslog';
}

export interface SSLConfig {
  caCert: string;
  intercept: boolean;
  bypassList: string[];
}

export interface URLFilteringConfig {
  blockedDataGroup: string;
  blockedUrls: string[];
  categories: WebCategory[];
}

export interface WebCategory {
  id: string;
  name: string;
  count: number;
  status: 'blocked' | 'allowed';
}

export interface SecurityPolicy {
  id: string;
  name: string;
  rules: PolicyRule[];
}

export interface PolicyRule {
  id: string;
  name: string;
  condition: {
    type: 'TLS_ClientHello' | 'HTTP_URI' | 'Category' | 'User_ID';
    operator: 'equals' | 'contains' | 'substring';
    value: string;
  };
  action: 'allow' | 'reject' | 'intercept' | 'bypass';
  enabled: boolean;
}

// Deployment Portal Types
export interface DeploymentRequest {
  id: string;
  timestamp: string;
  developer: string;
  applicationName: string;
  applicationType: string;
  securityLevel: string;
  environment: string;
  description: string;
  status: 'pending' | 'approved' | 'deploying' | 'deployed' | 'failed';
  vipAddress: string | null;
  monitoringUrl: string | null;
  as3Declaration: AS3Declaration | null;
}

export interface DeployedService {
  id: string;
  name: string;
  vipAddress: string;
  port: number;
  protocol: string;
  status: string;
  health: string;
  traffic: number;
  responseTime: number;
  errorRate: number;
  deployedAt: string;
  lastUpdated: string;
  poolMembers: Array<{
    name: string;
    ip: string;
    port: number;
    status: string;
    health: string;
  }>;
  sslProfile: string;
  wafPolicy: string;
  monitoringUrl: string;
}

export interface AS3Declaration {
  id: string;
  requestId?: string;
  declaration: any;
}

// Audit Log Types
export interface AuditLogEntry {
  id: string;
  timestamp: string;
  type: 'auth' | 'deployment' | 'config' | 'lane';
  action: string;
  user: string;
  target?: string;
  status: 'success' | 'failure';
  details?: string;
  ip?: string;
}
