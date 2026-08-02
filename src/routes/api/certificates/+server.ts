/**
 * Certificate Management API
 * REST API for SSL/TLS certificate lifecycle management
 */

import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { getCertificateService } from '$lib/server/certificates/service';
import { getRBACEngine, Resource, Action } from '$lib/server/auth/rbac';
import { logger } from '$lib/server/logger';

// GET /api/certificates - Get certificate data
export const GET: RequestHandler = async ({ url, locals }) => {
  try {
    const user = locals.user;
    if (!user) {
      throw error(401, 'Unauthorized');
    }

    // Check permission
    const rbac = getRBACEngine();
    const check = rbac.checkAccess(user as any, Resource.CERTIFICATE, Action.READ);
    if (!check.allowed) {
      throw error(403, 'Access denied');
    }

    const service = getCertificateService();
    const type = url.searchParams.get('type');
    const id = url.searchParams.get('id');

    switch (type) {
      case 'certificate':
        if (!id) throw error(400, 'Missing certificate id');
        const cert = service.getCertificate(id);
        if (!cert) throw error(404, 'Certificate not found');
        return json({ certificate: cert });
      
      case 'search':
        const filters: import('$lib/server/certificates').CertificateSearchFilters = {
          status: url.searchParams.get('status')?.split(',') as import('$lib/server/certificates').CertificateStatus[] | undefined,
          provider: url.searchParams.get('provider')?.split(',') as import('$lib/server/certificates').CertificateProvider[] | undefined,
          type: url.searchParams.get('certType')?.split(',') as import('$lib/server/certificates').CertificateType[] | undefined,
          expiringWithin: url.searchParams.get('expiringWithin') 
            ? parseInt(url.searchParams.get('expiringWithin')!) 
            : undefined,
          deployed: url.searchParams.get('deployed') === 'true' ? true : 
                    url.searchParams.get('deployed') === 'false' ? false : undefined,
          autoRenew: url.searchParams.get('autoRenew') === 'true' ? true : undefined,
          search: url.searchParams.get('q') || undefined
        };
        return json({ certificates: service.searchCertificates(filters) });
      
      case 'expiring':
        const days = parseInt(url.searchParams.get('days') || '30');
        return json({ certificates: service.getExpiringCertificates(days) });
      
      case 'templates':
        return json({ templates: service.getAllTemplates() });
      
      case 'compliance':
        return json({ report: service.generateComplianceReport() });
      
      case 'letsencrypt-config':
        return json({ config: service.getLetsEncryptConfig() });
      
      case 'alert-config':
        return json({ config: service.getAlertConfig() });
      
      case 'stats':
        return json({ stats: service.getStatistics() });
      
      case 'order':
        if (!id) throw error(400, 'Missing order id');
        const order = service.getOrder(id);
        if (!order) throw error(404, 'Order not found');
        return json({ order });
      
      case 'challenges':
        const orderId = url.searchParams.get('orderId');
        if (!orderId) throw error(400, 'Missing orderId');
        return json({ challenges: service.getChallenges(orderId) });
      
      default:
        return json({ certificates: service.getAllCertificates() });
    }

  } catch (err: any) {
    if (err.status) throw err;
    logger.error('Failed to get certificate data:', err);
    throw error(500, err.message);
  }
};

// POST /api/certificates - Create or manage certificates
export const POST: RequestHandler = async ({ request, locals }) => {
  try {
    const user = locals.user;
    if (!user) {
      throw error(401, 'Unauthorized');
    }

    const body = await request.json();
    const { action } = body;

    const service = getCertificateService();
    const rbac = getRBACEngine();

    switch (action) {
      case 'create':
        const createCheck = rbac.checkAccess(user as any, Resource.CERTIFICATE, Action.CREATE);
        if (!createCheck.allowed) throw error(403, 'Access denied');
        
        if (!body.certificate) {
          throw error(400, 'Missing certificate data');
        }
        
        const newCert = service.createCertificate(body.certificate);
        logger.info(`Certificate created by ${user.username}`);
        return json({ certificate: newCert }, { status: 201 });
      
      case 'update':
        const updateCheck = rbac.checkAccess(user as any, Resource.CERTIFICATE, Action.UPDATE);
        if (!updateCheck.allowed) throw error(403, 'Access denied');
        
        if (!body.certificateId || !body.updates) {
          throw error(400, 'Missing certificateId or updates');
        }
        
        const updatedCert = service.updateCertificate(body.certificateId, body.updates);
        logger.info(`Certificate ${body.certificateId} updated by ${user.username}`);
        return json({ certificate: updatedCert });
      
      case 'delete':
        const deleteCheck = rbac.checkAccess(user as any, Resource.CERTIFICATE, Action.DELETE);
        if (!deleteCheck.allowed) throw error(403, 'Access denied');
        
        if (!body.certificateId) {
          throw error(400, 'Missing certificateId');
        }
        
        service.deleteCertificate(body.certificateId);
        logger.info(`Certificate ${body.certificateId} deleted by ${user.username}`);
        return json({ success: true });
      
      case 'renew':
        const renewCheck = rbac.checkAccess(user as any, Resource.CERTIFICATE, Action.EXECUTE);
        if (!renewCheck.allowed) throw error(403, 'Access denied');
        
        if (!body.certificateId) {
          throw error(400, 'Missing certificateId');
        }
        
        const renewedCert = await service.renewCertificate(body.certificateId);
        logger.info(`Certificate ${body.certificateId} renewed by ${user.username}`);
        return json({ certificate: renewedCert });
      
      case 'renew-all':
        const renewAllCheck = rbac.checkAccess(user as any, Resource.CERTIFICATE, Action.EXECUTE);
        if (!renewAllCheck.allowed) throw error(403, 'Access denied');
        
        const daysThreshold = body.daysThreshold || 30;
        const result = await service.renewAllExpiring(daysThreshold);
        logger.info(`Bulk renewal executed by ${user.username}: ${result.success}/${result.total} succeeded`);
        return json({ result });
      
      case 'deploy':
        const deployCheck = rbac.checkAccess(user as any, Resource.CERTIFICATE, Action.EXECUTE);
        if (!deployCheck.allowed) throw error(403, 'Access denied');
        
        if (!body.certificateId || !body.targets) {
          throw error(400, 'Missing certificateId or targets');
        }
        
        const deployedCert = await service.deployCertificate(body.certificateId, body.targets);
        logger.info(`Certificate ${body.certificateId} deployed by ${user.username}`);
        return json({ certificate: deployedCert });
      
      case 'order-letsencrypt':
        const orderCheck = rbac.checkAccess(user as any, Resource.CERTIFICATE, Action.CREATE);
        if (!orderCheck.allowed) throw error(403, 'Access denied');
        
        if (!body.domain) {
          throw error(400, 'Missing domain');
        }
        
        const newOrder = await service.requestLetsEncryptCertificate(body.domain, body.san);
        logger.info(`Let's Encrypt order created by ${user.username}`);
        return json({ order: newOrder }, { status: 201 });
      
      case 'update-letsencrypt-config':
        const configCheck = rbac.checkAccess(user as any, Resource.CERTIFICATE, Action.UPDATE);
        if (!configCheck.allowed) throw error(403, 'Access denied');
        
        const config = service.updateLetsEncryptConfig(body.config);
        logger.info(`Let's Encrypt config updated by ${user.username}`);
        return json({ config });
      
      case 'update-alert-config':
        const alertCheck = rbac.checkAccess(user as any, Resource.CERTIFICATE, Action.UPDATE);
        if (!alertCheck.allowed) throw error(403, 'Access denied');
        
        const alertConfig = service.updateAlertConfig(body.config);
        logger.info(`Alert config updated by ${user.username}`);
        return json({ config: alertConfig });
      
      case 'create-template':
        const templateCheck = rbac.checkAccess(user as any, Resource.CERTIFICATE, Action.CREATE);
        if (!templateCheck.allowed) throw error(403, 'Access denied');
        
        const template = service.createTemplate(body.template);
        logger.info(`Certificate template created by ${user.username}`);
        return json({ template }, { status: 201 });
      
      default:
        throw error(400, 'Invalid action');
    }

  } catch (err: any) {
    if (err.status) throw err;
    logger.error('Failed to process certificate request:', err);
    throw error(500, err.message);
  }
};
