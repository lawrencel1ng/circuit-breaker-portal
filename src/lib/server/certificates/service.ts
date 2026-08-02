/**
 * Certificate Management Service
 * Manages SSL/TLS certificate lifecycle including issuance, renewal, and deployment
 */

import type {
  Certificate,
  CertificateDeploymentTarget,
  RenewalRecord,
  CertificateOrder,
  CertificateValidationChallenge,
  CertificateAlertConfig,
  CertificateComplianceReport,
  ComplianceRecommendation,
  LetsEncryptConfig,
  CertificateTemplate,
  CertificateSearchFilters,
  BulkOperationResult
} from './types';
import { logger } from '../logger';

// Default certificates
const DEFAULT_CERTIFICATES: Certificate[] = [
  {
    id: 'cert-001',
    domain: 'ocbc.com',
    subject: 'CN=ocbc.com, O=OCBC Bank, L=Singapore, C=SG',
    issuer: 'DigiCert',
    provider: 'digicert',
    type: 'server',
    status: 'expiring_soon',
    validFrom: new Date('2024-01-15'),
    validTo: new Date('2025-01-15'),
    daysRemaining: 45,
    autoRenew: true,
    renewalDaysBefore: 30,
    keyAlgorithm: 'RSA_2048',
    san: ['www.ocbc.com', 'api.ocbc.com'],
    deploymentTargets: [
      { id: 'dep-001', type: 'virtual_server', name: 'vs-ocbc-main', device: 'bigip-01', partition: 'Common', status: 'deployed', deployedAt: new Date('2024-01-15') },
      { id: 'dep-002', type: 'virtual_server', name: 'vs-ocbc-api', device: 'bigip-01', partition: 'Common', status: 'deployed', deployedAt: new Date('2024-01-15') }
    ],
    serialNumber: '12:34:56:78:9A:BC:DE:F0',
    fingerprint: 'SHA256:ABC123...',
    keySize: 2048,
    signatureAlgorithm: 'sha256WithRSAEncryption',
    renewalHistory: [
      { id: 'renew-001', timestamp: new Date('2023-01-15'), status: 'success', method: 'DigiCert API', oldExpiry: new Date('2023-01-15'), newExpiry: new Date('2024-01-15') }
    ],
    createdAt: new Date('2023-01-15'),
    updatedAt: new Date('2024-11-01')
  },
  {
    id: 'cert-002',
    domain: 'mobile.ocbc.com',
    subject: 'CN=mobile.ocbc.com, O=OCBC Bank, L=Singapore, C=SG',
    issuer: 'Let\'s Encrypt',
    provider: 'letsencrypt',
    type: 'server',
    status: 'expiring_soon',
    validFrom: new Date('2024-11-01'),
    validTo: new Date('2025-02-01'),
    daysRemaining: 15,
    autoRenew: true,
    renewalDaysBefore: 14,
    keyAlgorithm: 'RSA_2048',
    san: ['*.mobile.ocbc.com'],
    deploymentTargets: [
      { id: 'dep-003', type: 'virtual_server', name: 'vs-mobile-api', device: 'bigip-01', partition: 'Common', status: 'deployed', deployedAt: new Date('2024-11-01') }
    ],
    serialNumber: 'AA:BB:CC:DD:EE:FF:00:11',
    fingerprint: 'SHA256:DEF456...',
    keySize: 2048,
    signatureAlgorithm: 'sha256WithRSAEncryption',
    renewalHistory: [
      { id: 'renew-002', timestamp: new Date('2024-11-01'), status: 'success', method: 'Let\'s Encrypt ACME', oldExpiry: new Date('2024-11-01'), newExpiry: new Date('2025-02-01') }
    ],
    createdAt: new Date('2024-08-01'),
    updatedAt: new Date('2024-11-01')
  },
  {
    id: 'cert-003',
    domain: 'api.ocbc.com',
    subject: 'CN=api.ocbc.com, O=OCBC Bank, L=Singapore, C=SG',
    issuer: 'GlobalSign',
    provider: 'globalsign',
    type: 'server',
    status: 'valid',
    validFrom: new Date('2024-06-01'),
    validTo: new Date('2025-06-01'),
    daysRemaining: 210,
    autoRenew: true,
    renewalDaysBefore: 30,
    keyAlgorithm: 'ECDSA_P256',
    san: ['*.api.ocbc.com'],
    deploymentTargets: [
      { id: 'dep-004', type: 'virtual_server', name: 'vs-api-gateway', device: 'bigip-01', partition: 'Common', status: 'deployed', deployedAt: new Date('2024-06-01') }
    ],
    serialNumber: '11:22:33:44:55:66:77:88',
    fingerprint: 'SHA256:GHI789...',
    keySize: 256,
    signatureAlgorithm: 'ecdsa-with-SHA256',
    renewalHistory: [],
    createdAt: new Date('2024-06-01'),
    updatedAt: new Date('2024-06-01')
  },
  {
    id: 'cert-004',
    domain: 'internet.ocbc.com',
    subject: 'CN=internet.ocbc.com, O=OCBC Bank, L=Singapore, C=SG',
    issuer: 'Let\'s Encrypt',
    provider: 'letsencrypt',
    type: 'server',
    status: 'critical',
    validFrom: new Date('2024-10-15'),
    validTo: new Date('2025-01-15'),
    daysRemaining: 5,
    autoRenew: false,
    renewalDaysBefore: 14,
    keyAlgorithm: 'RSA_2048',
    deploymentTargets: [
      { id: 'dep-005', type: 'virtual_server', name: 'vs-internet-banking', device: 'bigip-01', partition: 'Common', status: 'deployed', deployedAt: new Date('2024-10-15') }
    ],
    serialNumber: '99:88:77:66:55:44:33:22',
    fingerprint: 'SHA256:JKL012...',
    keySize: 2048,
    signatureAlgorithm: 'sha256WithRSAEncryption',
    renewalHistory: [],
    createdAt: new Date('2024-10-15'),
    updatedAt: new Date('2024-10-15')
  },
  {
    id: 'cert-005',
    domain: 'secure.ocbc.com',
    subject: 'CN=secure.ocbc.com, O=OCBC Bank, L=Singapore, C=SG',
    issuer: 'DigiCert',
    provider: 'digicert',
    type: 'server',
    status: 'expired',
    validFrom: new Date('2023-12-01'),
    validTo: new Date('2024-12-01'),
    daysRemaining: -2,
    autoRenew: false,
    renewalDaysBefore: 30,
    keyAlgorithm: 'RSA_2048',
    deploymentTargets: [
      { id: 'dep-006', type: 'virtual_server', name: 'vs-secure-portal', device: 'bigip-01', partition: 'Common', status: 'deployed', deployedAt: new Date('2023-12-01') }
    ],
    serialNumber: '00:11:22:33:44:55:66:77',
    fingerprint: 'SHA256:MNO345...',
    keySize: 2048,
    signatureAlgorithm: 'sha256WithRSAEncryption',
    renewalHistory: [],
    createdAt: new Date('2023-12-01'),
    updatedAt: new Date('2023-12-01')
  },
  {
    id: 'cert-006',
    domain: 'payments.ocbc.com',
    subject: 'CN=payments.ocbc.com, O=OCBC Bank, L=Singapore, C=SG',
    issuer: 'GlobalSign',
    provider: 'globalsign',
    type: 'server',
    status: 'valid',
    validFrom: new Date('2024-03-01'),
    validTo: new Date('2026-03-01'),
    daysRemaining: 420,
    autoRenew: true,
    renewalDaysBefore: 30,
    keyAlgorithm: 'ECDSA_P256',
    san: ['*.payments.ocbc.com'],
    deploymentTargets: [
      { id: 'dep-007', type: 'virtual_server', name: 'vs-payments-gateway', device: 'bigip-01', partition: 'Common', status: 'deployed', deployedAt: new Date('2024-03-01') }
    ],
    serialNumber: 'AA:BB:CC:DD:EE:FF:11:22',
    fingerprint: 'SHA256:PQR678...',
    keySize: 256,
    signatureAlgorithm: 'ecdsa-with-SHA256',
    renewalHistory: [],
    createdAt: new Date('2024-03-01'),
    updatedAt: new Date('2024-03-01')
  }
];

// CA Certificates for SWG
const DEFAULT_CA_CERTIFICATES: Certificate[] = [
  {
    id: 'ca-001',
    domain: 'MyCompany Root CA',
    subject: 'CN=MyCompany Root CA, O=MyCompany, C=US',
    issuer: 'Self-Signed',
    provider: 'internal',
    type: 'ca',
    status: 'valid',
    validFrom: new Date('2018-01-01'),
    validTo: new Date('2028-12-31'),
    daysRemaining: 1400,
    autoRenew: false,
    renewalDaysBefore: 90,
    keyAlgorithm: 'RSA_4096',
    deploymentTargets: [
      { id: 'dep-ca-001', type: 'profile', name: 'clientssl-swg', device: 'bigip-01', partition: 'Common', status: 'deployed', deployedAt: new Date('2018-01-01') }
    ],
    serialNumber: 'CA:00:01:02:03:04:05:06',
    fingerprint: 'SHA256:CACERT01...',
    keySize: 4096,
    signatureAlgorithm: 'sha256WithRSAEncryption',
    renewalHistory: [],
    createdAt: new Date('2018-01-01'),
    updatedAt: new Date('2018-01-01')
  },
  {
    id: 'ca-002',
    domain: 'Global Intercept CA',
    subject: 'CN=Global Intercept CA, O=MyCompany, C=US',
    issuer: 'MyCompany Root CA',
    provider: 'internal',
    type: 'intermediate',
    status: 'valid',
    validFrom: new Date('2023-06-15'),
    validTo: new Date('2025-06-15'),
    daysRemaining: 400,
    autoRenew: true,
    renewalDaysBefore: 60,
    keyAlgorithm: 'RSA_2048',
    deploymentTargets: [
      { id: 'dep-ca-002', type: 'profile', name: 'clientssl-swg-intercept', device: 'bigip-01', partition: 'Common', status: 'deployed', deployedAt: new Date('2023-06-15') }
    ],
    serialNumber: 'CA:11:22:33:44:55:66:77',
    fingerprint: 'SHA256:CACERT02...',
    keySize: 2048,
    signatureAlgorithm: 'sha256WithRSAEncryption',
    renewalHistory: [],
    createdAt: new Date('2023-06-15'),
    updatedAt: new Date('2023-06-15')
  }
];

export class CertificateService {
  private certificates: Map<string, Certificate> = new Map();
  private orders: Map<string, CertificateOrder> = new Map();
  private challenges: Map<string, CertificateValidationChallenge[]> = new Map();
  private letsEncryptConfig: LetsEncryptConfig;
  private alertConfig: CertificateAlertConfig;
  private templates: Map<string, CertificateTemplate> = new Map();
  private renewalInterval: NodeJS.Timeout | null = null;

  constructor() {
    // Initialize certificates
    [...DEFAULT_CERTIFICATES, ...DEFAULT_CA_CERTIFICATES].forEach(cert => {
      this.certificates.set(cert.id, cert);
    });

    // Initialize Let's Encrypt config
    this.letsEncryptConfig = {
      enabled: true,
      environment: 'production',
      email: 'security@ocbc.com',
      acceptTos: true,
      eabEnabled: false
    };

    // Initialize alert config
    this.alertConfig = {
      enabled: true,
      thresholds: [30, 14, 7, 1],
      channels: [
        { type: 'email', target: 'security@ocbc.com', enabled: true },
        { type: 'slack', target: '#security-alerts', enabled: true }
      ],
      notifyOnRenewal: true,
      notifyOnFailure: true
    };

    // Start renewal monitoring
    this.startRenewalMonitoring();
  }

  // Certificate CRUD
  getAllCertificates(): Certificate[] {
    return Array.from(this.certificates.values());
  }

  getCertificate(id: string): Certificate | undefined {
    return this.certificates.get(id);
  }

  searchCertificates(filters: CertificateSearchFilters): Certificate[] {
    let certs = this.getAllCertificates();

    if (filters.status?.length) {
      certs = certs.filter(c => filters.status!.includes(c.status));
    }

    if (filters.provider?.length) {
      certs = certs.filter(c => filters.provider!.includes(c.provider));
    }

    if (filters.type?.length) {
      certs = certs.filter(c => filters.type!.includes(c.type));
    }

    if (filters.expiringWithin !== undefined) {
      const now = new Date();
      const cutoff = new Date(now.getTime() + filters.expiringWithin * 24 * 60 * 60 * 1000);
      certs = certs.filter(c => c.validTo <= cutoff);
    }

    if (filters.deployed !== undefined) {
      certs = certs.filter(c => 
        filters.deployed 
          ? c.deploymentTargets.some(d => d.status === 'deployed')
          : !c.deploymentTargets.some(d => d.status === 'deployed')
      );
    }

    if (filters.autoRenew !== undefined) {
      certs = certs.filter(c => c.autoRenew === filters.autoRenew);
    }

    if (filters.search) {
      const search = filters.search.toLowerCase();
      certs = certs.filter(c => 
        c.domain.toLowerCase().includes(search) ||
        c.issuer.toLowerCase().includes(search)
      );
    }

    return certs;
  }

  createCertificate(cert: Omit<Certificate, 'id' | 'createdAt' | 'updatedAt'>): Certificate {
    const newCert: Certificate = {
      ...cert,
      id: `cert-${Date.now()}`,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    this.certificates.set(newCert.id, newCert);
    logger.info(`Created certificate: ${newCert.id}`);
    return newCert;
  }

  updateCertificate(id: string, updates: Partial<Certificate>): Certificate {
    const existing = this.certificates.get(id);
    if (!existing) {
      throw new Error(`Certificate ${id} not found`);
    }

    const updated = { ...existing, ...updates, updatedAt: new Date() };
    this.certificates.set(id, updated);
    logger.info(`Updated certificate: ${id}`);
    return updated;
  }

  deleteCertificate(id: string): void {
    if (!this.certificates.has(id)) {
      throw new Error(`Certificate ${id} not found`);
    }
    this.certificates.delete(id);
    logger.info(`Deleted certificate: ${id}`);
  }

  // Renewal Operations
  async renewCertificate(id: string): Promise<Certificate> {
    const cert = this.certificates.get(id);
    if (!cert) {
      throw new Error(`Certificate ${id} not found`);
    }

    // Simulate renewal process
    const renewalRecord: RenewalRecord = {
      id: `renew-${Date.now()}`,
      timestamp: new Date(),
      status: 'success',
      method: cert.provider === 'letsencrypt' ? 'Let\'s Encrypt ACME' : `${cert.issuer} API`,
      oldExpiry: cert.validTo,
      newExpiry: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000) // 90 days
    };

    cert.renewalHistory.unshift(renewalRecord);
    cert.validTo = renewalRecord.newExpiry;
    cert.validFrom = new Date();
    cert.daysRemaining = 90;
    cert.status = 'valid';
    cert.lastRenewed = renewalRecord.timestamp;
    cert.updatedAt = new Date();

    logger.info(`Renewed certificate: ${id}`);
    return cert;
  }

  async renewAllExpiring(daysThreshold: number = 30): Promise<BulkOperationResult> {
    const expiring = this.getExpiringCertificates(daysThreshold);
    const result: BulkOperationResult = {
      operation: 'renew',
      total: expiring.length,
      success: 0,
      failed: 0,
      errors: []
    };

    for (const cert of expiring) {
      try {
        if (cert.autoRenew) {
          await this.renewCertificate(cert.id);
          result.success++;
        }
      } catch (error: any) {
        result.failed++;
        result.errors.push({ certificateId: cert.id, error: error.message });
      }
    }

    return result;
  }

  getExpiringCertificates(days: number): Certificate[] {
    const cutoff = new Date(Date.now() + days * 24 * 60 * 60 * 1000);
    return this.getAllCertificates().filter(c => c.validTo <= cutoff && c.status !== 'revoked');
  }

  // Deployment
  async deployCertificate(certificateId: string, targets: CertificateDeploymentTarget[]): Promise<Certificate> {
    const cert = this.certificates.get(certificateId);
    if (!cert) {
      throw new Error(`Certificate ${certificateId} not found`);
    }

    // Simulate deployment
    for (const target of targets) {
      target.status = 'deployed';
      target.deployedAt = new Date();
    }

    cert.deploymentTargets = [...cert.deploymentTargets, ...targets];
    cert.deployedAt = new Date();
    cert.updatedAt = new Date();

    logger.info(`Deployed certificate ${certificateId} to ${targets.length} targets`);
    return cert;
  }

  // Let's Encrypt Integration
  getLetsEncryptConfig(): LetsEncryptConfig {
    return this.letsEncryptConfig;
  }

  updateLetsEncryptConfig(config: Partial<LetsEncryptConfig>): LetsEncryptConfig {
    this.letsEncryptConfig = { ...this.letsEncryptConfig, ...config };
    return this.letsEncryptConfig;
  }

  async requestLetsEncryptCertificate(domain: string, san?: string[]): Promise<CertificateOrder> {
    const order: CertificateOrder = {
      id: `order-${Date.now()}`,
      domain,
      provider: 'letsencrypt',
      type: 'server',
      keyAlgorithm: 'RSA_2048',
      san,
      validationMethod: 'dns',
      status: 'pending',
      createdAt: new Date()
    };

    this.orders.set(order.id, order);

    // Simulate validation challenges
    const challenges: CertificateValidationChallenge[] = [
      {
        type: 'dns',
        domain,
        status: 'pending',
        dnsRecord: {
          type: 'TXT',
          name: `_acme-challenge.${domain}`,
          value: 'validation-token-12345'
        }
      }
    ];

    this.challenges.set(order.id, challenges);

    logger.info(`Created Let's Encrypt order: ${order.id}`);
    return order;
  }

  getOrder(id: string): CertificateOrder | undefined {
    return this.orders.get(id);
  }

  getChallenges(orderId: string): CertificateValidationChallenge[] {
    return this.challenges.get(orderId) || [];
  }

  // Compliance Report
  generateComplianceReport(): CertificateComplianceReport {
    const certs = this.getAllCertificates();
    const now = new Date();

    const expired = certs.filter(c => c.validTo < now);
    const expiring30Days = certs.filter(c => {
      const days = Math.floor((c.validTo.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
      return days >= 0 && days <= 30;
    });
    const weakAlgorithm = certs.filter(c => c.keyAlgorithm === 'RSA_2048' && c.keySize < 2048);
    const selfSigned = certs.filter(c => c.issuer === 'Self-Signed');

    const recommendations: ComplianceRecommendation[] = [];

    if (expired.length > 0) {
      recommendations.push({
        id: 'rec-001',
        severity: 'critical',
        category: 'expiration',
        title: 'Expired Certificates Found',
        description: `${expired.length} certificates have expired and should be renewed immediately.`,
        affectedCertificates: expired.map(c => c.id),
        suggestedAction: 'Renew or replace expired certificates immediately'
      });
    }

    if (expiring30Days.length > 0) {
      recommendations.push({
        id: 'rec-002',
        severity: 'high',
        category: 'expiration',
        title: 'Certificates Expiring Soon',
        description: `${expiring30Days.length} certificates will expire within 30 days.`,
        affectedCertificates: expiring30Days.map(c => c.id),
        suggestedAction: 'Enable auto-renewal or schedule renewal'
      });
    }

    // Calculate compliance score
    const totalWeight = certs.length * 100;
    const deductions = 
      (expired.length * 50) +
      (expiring30Days.length * 20) +
      (weakAlgorithm.length * 15) +
      (selfSigned.length * 10);
    
    const complianceScore = Math.max(0, Math.round(100 - (deductions / totalWeight) * 100));

    return {
      generatedAt: new Date(),
      totalCertificates: certs.length,
      validCertificates: certs.filter(c => c.status === 'valid').length,
      expiringSoon: expiring30Days.length,
      expiredCertificates: expired.length,
      revokedCertificates: certs.filter(c => c.status === 'revoked').length,
      weakAlgorithmCertificates: weakAlgorithm.length,
      selfSignedCertificates: selfSigned.length,
      complianceScore,
      recommendations
    };
  }

  // Alert Configuration
  getAlertConfig(): CertificateAlertConfig {
    return this.alertConfig;
  }

  updateAlertConfig(config: Partial<CertificateAlertConfig>): CertificateAlertConfig {
    this.alertConfig = { ...this.alertConfig, ...config };
    return this.alertConfig;
  }

  // Templates
  getAllTemplates(): CertificateTemplate[] {
    return Array.from(this.templates.values());
  }

  createTemplate(template: Omit<CertificateTemplate, 'id'>): CertificateTemplate {
    const newTemplate: CertificateTemplate = {
      ...template,
      id: `template-${Date.now()}`
    };
    this.templates.set(newTemplate.id, newTemplate);
    return newTemplate;
  }

  // Statistics
  getStatistics(): {
    totalCertificates: number;
    activeCertificates: number;
    expiredCertificates: number;
    expiringSoon: number;
    autoRenewEnabled: number;
    totalDeployments: number;
  } {
    const certs = this.getAllCertificates();
    const now = new Date();

    return {
      totalCertificates: certs.length,
      activeCertificates: certs.filter(c => c.status === 'valid').length,
      expiredCertificates: certs.filter(c => c.status === 'expired').length,
      expiringSoon: certs.filter(c => c.status === 'expiring_soon' || c.status === 'critical').length,
      autoRenewEnabled: certs.filter(c => c.autoRenew).length,
      totalDeployments: certs.reduce((sum, c) => sum + c.deploymentTargets.length, 0)
    };
  }

  // Private
  private startRenewalMonitoring(): void {
    // Check for expiring certificates every hour
    this.renewalInterval = setInterval(() => {
      this.checkExpiringCertificates();
    }, 3600000);

    // Initial check
    this.checkExpiringCertificates();
  }

  private checkExpiringCertificates(): void {
    const certs = this.getAllCertificates();
    const now = new Date();

    for (const cert of certs) {
      const daysRemaining = Math.floor((cert.validTo.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
      cert.daysRemaining = daysRemaining;

      // Update status
      if (daysRemaining < 0) {
        cert.status = 'expired';
      } else if (daysRemaining < 7) {
        cert.status = 'critical';
      } else if (daysRemaining < 30) {
        cert.status = 'expiring_soon';
      } else {
        cert.status = 'valid';
      }

      // Auto-renew if enabled and approaching threshold
      if (cert.autoRenew && daysRemaining <= cert.renewalDaysBefore && daysRemaining > 0) {
        this.renewCertificate(cert.id).catch(error => {
          logger.error(`Auto-renewal failed for ${cert.id}:`, error);
        });
      }
    }
  }

  dispose(): void {
    if (this.renewalInterval) {
      clearInterval(this.renewalInterval);
    }
  }
}

// Singleton instance
let certificateService: CertificateService | null = null;

export function getCertificateService(): CertificateService {
  if (!certificateService) {
    certificateService = new CertificateService();
  }
  return certificateService;
}

export function resetCertificateService(): void {
  if (certificateService) {
    certificateService.dispose();
    certificateService = null;
  }
}
