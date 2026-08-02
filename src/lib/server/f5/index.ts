/**
 * F5 Integration Services
 * Export all F5 services for easy importing
 */

export { F5iControlClient, getF5Client, resetF5Client } from './icontrol-client';
export { SWGService, getSWGService } from './swg-service';
export { SSLOService, getSSLOService } from './sslo-service';
export { APMService, getAPMService } from './apm-service';
export { AS3Service, getAS3Service } from './as3-service';
export { AWAFService, getAWAFService, resetAWAFService } from './awaf-service';
export { F5_CONFIG } from './config';

// Connection Pool
export { F5ConnectionPool, getConnectionPool, resetConnectionPool } from './connection-pool';
export type { ConnectionPoolConfig, PooledConnection } from './connection-pool';

// Job Queue
export { F5JobQueue, getJobQueue, resetJobQueue, createDeploymentJob } from './job-queue';
export type { 
  F5Job, 
  JobStatus, 
  JobType, 
  JobStep, 
  JobOptions, 
  JobStepDefinition,
  JobContext 
} from './job-queue';

// Transaction Manager
export { F5TransactionManager, getTransactionManager, resetTransactionManager, TransactionExecutor } from './transaction';
export type { 
  Transaction, 
  TransactionSnapshot, 
  TransactionOperation, 
  TransactionOptions 
} from './transaction';

// Re-export types
export type { F5AuthToken, F5ApiResponse } from './icontrol-client';
export type { SWGExplicitProxyConfig, SWGSSLConfig, SWGAuthenticationConfig } from './swg-service';
export type { SSLOTopology, SSLOServiceChain, SSLORule } from './sslo-service';
export type { APMAuthConfig, APMPerRequestRule, APMSession } from './apm-service';
export type { AS3Declaration, AS3Tenant, AS3Application } from './as3-service';
export type { 
  WAFPolicy, 
  AttackSignature, 
  SecurityEvent, 
  IPReputation, 
  GeoBlockingRule,
  BotDefenseConfig,
  Violation 
} from './awaf-service';
