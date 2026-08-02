/**
 * Certificate Management Types
 * Type definitions for SSL/TLS certificate lifecycle management
 */

export type CertificateType = 'server' | 'client' | 'ca' | 'intermediate';
export type CertificateStatus = 'valid' | 'expiring_soon' | 'critical' | 'expired' | 'revoked' | 'pending';
export type CertificateProvider = 'letsencrypt' | 'digicert' | 'globalsign' | 'sectigo' | 'internal' | 'custom';
export type KeyAlgorithm = 'RSA_2048' | 'RSA_4096' | 'ECDSA_P256' | 'ECDSA_P384';

export interface Certificate {
  id: string;
  domain: string;
  subject: string;
  issuer: string;
  provider: CertificateProvider;
  type: CertificateType;
  status: CertificateStatus;
  
  // Validity
  validFrom: Date;
  validTo: Date;
  daysRemaining: number;
  
  // Configuration
  autoRenew: boolean;
  renewalDaysBefore: number; // days before expiry to renew
  keyAlgorithm: KeyAlgorithm;
  san?: string[]; // Subject Alternative Names
  
  // Deployment
  deploymentTargets: CertificateDeploymentTarget[];
  deployedAt?: Date;
  
  // Metadata
  serialNumber: string;
  fingerprint: string;
  keySize: number;
  signatureAlgorithm: string;
  
  // History
  renewalHistory: RenewalRecord[];
  lastRenewed?: Date;
  nextRenewal?: Date | null;
  
  createdAt: Date;
  updatedAt: Date;
}

export interface CertificateDeploymentTarget {
  id: string;
  type: 'virtual_server' | 'pool' | 'profile' | 'device';
  name: string;
  device: string;
  partition: string;
  status: 'deployed' | 'pending' | 'failed';
  deployedAt?: Date;
}

export interface RenewalRecord {
  id: string;
  timestamp: Date;
  status: 'success' | 'failed' | 'pending';
  method: string;
  oldExpiry: Date;
  newExpiry: Date;
  errorMessage?: string;
}

export interface CertificateOrder {
  id: string;
  certificateId?: string;
  domain: string;
  provider: CertificateProvider;
  type: CertificateType;
  keyAlgorithm: KeyAlgorithm;
  san?: string[];
  validationMethod: 'dns' | 'http' | 'email';
  status: 'pending' | 'validating' | 'issued' | 'failed';
  createdAt: Date;
  expiresAt?: Date;
  errorMessage?: string;
}

export interface CertificateValidationChallenge {
  type: 'dns' | 'http' | 'email';
  domain: string;
  status: 'pending' | 'processing' | 'valid' | 'invalid';
  token?: string;
  dnsRecord?: {
    type: string;
    name: string;
    value: string;
  };
  httpEndpoint?: {
    url: string;
    content: string;
  };
  emailRecipients?: string[];
}

export interface CertificateAlertConfig {
  enabled: boolean;
  thresholds: number[]; // Days before expiry to alert [30, 14, 7, 1]
  channels: AlertChannel[];
  notifyOnRenewal: boolean;
  notifyOnFailure: boolean;
}

export interface AlertChannel {
  type: 'email' | 'slack' | 'webhook' | 'pagerduty';
  target: string;
  enabled: boolean;
}

export interface CertificateComplianceReport {
  generatedAt: Date;
  totalCertificates: number;
  validCertificates: number;
  expiringSoon: number;
  expiredCertificates: number;
  revokedCertificates: number;
  weakAlgorithmCertificates: number;
  selfSignedCertificates: number;
  complianceScore: number;
  recommendations: ComplianceRecommendation[];
}

export interface ComplianceRecommendation {
  id: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
  category: 'expiration' | 'algorithm' | 'key_size' | 'deployment' | 'configuration';
  title: string;
  description: string;
  affectedCertificates: string[];
  suggestedAction: string;
}

export interface LetsEncryptConfig {
  enabled: boolean;
  environment: 'staging' | 'production';
  email: string;
  acceptTos: boolean;
  eabEnabled: boolean;
  eabKid?: string;
  eabHmacKey?: string;
  preferredChain?: string;
}

export interface CertificateTemplate {
  id: string;
  name: string;
  description?: string;
  provider: CertificateProvider;
  type: CertificateType;
  keyAlgorithm: KeyAlgorithm;
  autoRenew: boolean;
  renewalDaysBefore: number;
  validationMethod: 'dns' | 'http' | 'email';
  deploymentTargets: Omit<CertificateDeploymentTarget, 'id' | 'status' | 'deployedAt'>[];
}

export interface CertificateSearchFilters {
  status?: CertificateStatus[];
  provider?: CertificateProvider[];
  type?: CertificateType[];
  expiringWithin?: number; // days
  deployed?: boolean;
  autoRenew?: boolean;
  search?: string;
}

export interface BulkOperationResult {
  operation: 'renew' | 'deploy' | 'delete' | 'update';
  total: number;
  success: number;
  failed: number;
  errors: { certificateId: string; error: string }[];
}
