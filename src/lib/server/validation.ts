/**
 * Validation schemas using Zod
 */

import { z } from 'zod';

// Custom IP validator with length limit (prevent ReDoS)
const ipSchema = z.string()
  .max(45, 'IP address too long') // IPv6 max length is 45 characters
  .regex(
    /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/,
    'Invalid IP address'
  );

// Lane validation
export const laneUpdateSchema = z.object({
  edgeStatus: z.enum(['active', 'inactive', 'closed']).optional(),
  enterpriseStatus: z.enum(['active', 'inactive', 'closed']).optional(),
  healthStatus: z.enum(['healthy', 'degraded', 'down']).optional(),
  action: z.string().optional(),
  message: z.string().optional(),
  user: z.string().optional()
});

// SWG Config validation
export const swgConfigSchema = z.object({
  proxyListener: z.object({
    ip: ipSchema,
    port: z.number().int().min(1).max(65535),
    enabled: z.boolean(),
    vlan: z.array(z.string())
  }).optional(),
  sslConfig: z.object({
    caCert: z.string().optional(),
    intercept: z.boolean(),
    bypassList: z.array(z.string())
  }).optional(),
  authentication: z.object({
    enabled: z.boolean(),
    scheme: z.enum(['ntlm', 'kerberos', 'basic', 'ldap', 'saml']),
    realm: z.string(),
    ldapConfig: z.object({
      server: z.string(),
      bindDn: z.string(),
      searchBase: z.string()
    }).optional()
  }).optional(),
  siem: z.object({
    enabled: z.boolean(),
    serverIp: ipSchema.optional(),
    port: z.number().int().min(1).max(65535).optional(),
    protocol: z.enum(['tcp', 'udp', 'tls']).optional(),
    format: z.enum(['cef', 'leef', 'syslog']).optional()
  }).optional(),
  icap: z.object({
    enabled: z.boolean(),
    serverUri: z.string().optional(),
    previewSize: z.number().int().optional(),
    failOpen: z.boolean().optional()
  }).optional()
});

// URL filtering validation
export const blockedUrlSchema = z.object({
  url: z.string().min(1).max(500),
  group: z.string().default('dg-blocked-urls'),
  addedBy: z.string().optional()
});

// Policy validation
export const policyRuleSchema = z.object({
  name: z.string().min(1).max(100),
  enabled: z.boolean().default(true),
  condition: z.object({
    type: z.enum(['TLS_ClientHello', 'HTTP_URI', 'Category', 'User_ID']),
    operator: z.enum(['equals', 'contains', 'substring']),
    value: z.string().min(1)
  }),
  action: z.enum(['allow', 'reject', 'intercept', 'bypass']),
  logEnabled: z.boolean().default(true)
});

// F5 deployment validation
export const f5DeploySchema = z.object({
  type: z.enum(['swg', 'sslo', 'as3']),
  dryRun: z.boolean().default(false),
  config: z.record(z.string(), z.any())
});

// Session validation
export const sessionSchema = z.object({
  sessionId: z.string(),
  user: z.string(),
  clientIp: ipSchema,
  vsName: z.string().optional()
});

// Log validation
export const accessLogSchema = z.object({
  clientIp: ipSchema,
  user: z.string().optional(),
  method: z.enum(['GET', 'POST', 'PUT', 'DELETE', 'CONNECT', 'HEAD', 'OPTIONS', 'PATCH']),
  url: z.string().min(1),
  action: z.enum(['allow', 'block', 'bypass']),
  rule: z.string().optional(),
  category: z.string().optional(),
  bytesIn: z.number().int().min(0).default(0),
  bytesOut: z.number().int().min(0).default(0),
  duration: z.number().int().min(0).default(0)
});
