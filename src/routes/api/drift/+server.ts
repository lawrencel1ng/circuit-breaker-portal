/**
 * Configuration Drift Detection API
 */

import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { getDriftDetectionService } from '$lib/server/drift/service';
import { getRBACEngine, Resource, Action } from '$lib/server/auth/rbac';
import { logger } from '$lib/server/logger';

export const GET: RequestHandler = async ({ url, locals }) => {
  try {
    const user = locals.user;
    if (!user) throw error(401, 'Unauthorized');

    const rbac = getRBACEngine();
    const check = rbac.checkAccess(user as any, Resource.SETTING, Action.READ);
    if (!check.allowed) throw error(403, 'Access denied');

    const service = getDriftDetectionService();
    const type = url.searchParams.get('type');

    switch (type) {
      case 'detections':
        return json({ detections: service.getAllDetections() });
      
      case 'reports':
        return json({ reports: service.getAllReports() });
      
      case 'active-drifts':
        return json({ drifts: service.getActiveDrifts() });
      
      case 'snapshots':
        return json({ snapshots: service.getAllSnapshots() });
      
      case 'compliance-rules':
        return json({ rules: service.getAllComplianceRules() });
      
      case 'git-config':
        return json({ config: service.getGitConfig() });
      
      case 'stats':
        return json({ stats: service.getStatistics() });
      
      default:
        return json({
          detections: service.getAllDetections(),
          reports: service.getAllReports().slice(0, 10),
          stats: service.getStatistics()
        });
    }
  } catch (err: any) {
    if (err.status) throw err;
    logger.error('Failed to get drift data:', err);
    throw error(500, err.message);
  }
};

export const POST: RequestHandler = async ({ request, locals }) => {
  try {
    const user = locals.user;
    if (!user) throw error(401, 'Unauthorized');

    const body = await request.json();
    const { action } = body;

    const service = getDriftDetectionService();
    const rbac = getRBACEngine();

    switch (action) {
      case 'create-detection':
        const createCheck = rbac.checkAccess(user as any, Resource.SETTING, Action.CREATE);
        if (!createCheck.allowed) throw error(403, 'Access denied');
        
        const newDetection = service.createDetection(body.detection);
        return json({ detection: newDetection }, { status: 201 });
      
      case 'update-detection':
        const updateCheck = rbac.checkAccess(user as any, Resource.SETTING, Action.UPDATE);
        if (!updateCheck.allowed) throw error(403, 'Access denied');
        
        const updatedDetection = service.updateDetection(body.detectionId, body.updates);
        return json({ detection: updatedDetection });
      
      case 'delete-detection':
        const deleteCheck = rbac.checkAccess(user as any, Resource.SETTING, Action.DELETE);
        if (!deleteCheck.allowed) throw error(403, 'Access denied');
        
        service.deleteDetection(body.detectionId);
        return json({ success: true });
      
      case 'run-detection':
        const runCheck = rbac.checkAccess(user as any, Resource.SETTING, Action.EXECUTE);
        if (!runCheck.allowed) throw error(403, 'Access denied');
        
        const report = await service.runDetection(body.detectionId);
        return json({ report });
      
      case 'run-all-detections':
        const runAllCheck = rbac.checkAccess(user as any, Resource.SETTING, Action.EXECUTE);
        if (!runAllCheck.allowed) throw error(403, 'Access denied');
        
        const reports = await service.runAllDetections();
        return json({ reports });
      
      case 'acknowledge-drift':
        const ackCheck = rbac.checkAccess(user as any, Resource.SETTING, Action.UPDATE);
        if (!ackCheck.allowed) throw error(403, 'Access denied');
        
        const ackReport = service.acknowledgeDrift(body.reportId, user.id);
        return json({ report: ackReport });
      
      case 'remediate':
        const remCheck = rbac.checkAccess(user as any, Resource.SETTING, Action.EXECUTE);
        if (!remCheck.allowed) throw error(403, 'Access denied');
        
        await service.remediateDriftItem(body.reportId, body.itemId, body.remediationAction);
        return json({ success: true });
      
      case 'create-snapshot':
        const snapCheck = rbac.checkAccess(user as any, Resource.SETTING, Action.CREATE);
        if (!snapCheck.allowed) throw error(403, 'Access denied');
        
        const snapshot = service.createSnapshot(body.id, body.source, body.reference);
        return json({ snapshot }, { status: 201 });
      
      case 'sync-from-git':
        const gitCheck = rbac.checkAccess(user as any, Resource.SETTING, Action.EXECUTE);
        if (!gitCheck.allowed) throw error(403, 'Access denied');
        
        const gitSnapshot = await service.syncFromGit();
        return json({ snapshot: gitSnapshot });
      
      case 'update-git-config':
        const gitConfigCheck = rbac.checkAccess(user as any, Resource.SETTING, Action.UPDATE);
        if (!gitConfigCheck.allowed) throw error(403, 'Access denied');
        
        const config = service.updateGitConfig(body.config);
        return json({ config });
      
      default:
        throw error(400, 'Invalid action');
    }
  } catch (err: any) {
    if (err.status) throw err;
    logger.error('Failed to process drift request:', err);
    throw error(500, err.message);
  }
};
