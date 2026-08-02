/**
 * Backup & Disaster Recovery API
 */

import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { getBackupService } from '$lib/server/backup/service';
import { getRBACEngine, Resource, Action } from '$lib/server/auth/rbac';
import { logger } from '$lib/server/logger';

export const GET: RequestHandler = async ({ url, locals }) => {
  try {
    const user = locals.user;
    if (!user) throw error(401, 'Unauthorized');

    const rbac = getRBACEngine();
    const check = rbac.checkAccess(user as any, Resource.BACKUP, Action.READ);
    if (!check.allowed) throw error(403, 'Access denied');

    const service = getBackupService();
    const type = url.searchParams.get('type');

    switch (type) {
      case 'backups':
        return json({ backups: service.getAllBackups() });
      
      case 'destinations':
        return json({ destinations: service.getAllDestinations() });
      
      case 'schedules':
        return json({ schedules: service.getAllSchedules() });
      
      case 'restores':
        return json({ restores: service.getAllRestores() });
      
      case 'dr-plans':
        return json({ plans: service.getAllDRPlans() });
      
      case 'stats':
        return json({ stats: service.getStatistics() });
      
      case 'health':
        return json({ status: service.getHealthStatus() });
      
      default:
        return json({
          backups: service.getAllBackups().slice(0, 10),
          schedules: service.getAllSchedules(),
          stats: service.getStatistics(),
          health: service.getHealthStatus()
        });
    }
  } catch (err: any) {
    if (err.status) throw err;
    logger.error('Failed to get backup data:', err);
    throw error(500, err.message);
  }
};

export const POST: RequestHandler = async ({ request, locals }) => {
  try {
    const user = locals.user;
    if (!user) throw error(401, 'Unauthorized');

    const body = await request.json();
    const { action } = body;

    const service = getBackupService();
    const rbac = getRBACEngine();

    switch (action) {
      case 'create-backup':
        const createCheck = rbac.checkAccess(user as any, Resource.BACKUP, Action.CREATE);
        if (!createCheck.allowed) throw error(403, 'Access denied');
        
        const backup = await service.createBackup(body.config);
        return json({ backup }, { status: 201 });
      
      case 'cancel-backup':
        const cancelCheck = rbac.checkAccess(user as any, Resource.BACKUP, Action.UPDATE);
        if (!cancelCheck.allowed) throw error(403, 'Access denied');
        
        await service.cancelBackup(body.backupId);
        return json({ success: true });
      
      case 'delete-backup':
        const deleteCheck = rbac.checkAccess(user as any, Resource.BACKUP, Action.DELETE);
        if (!deleteCheck.allowed) throw error(403, 'Access denied');
        
        await service.deleteBackup(body.backupId);
        return json({ success: true });
      
      case 'create-destination':
        const destCheck = rbac.checkAccess(user as any, Resource.BACKUP, Action.CREATE);
        if (!destCheck.allowed) throw error(403, 'Access denied');
        
        const destination = service.createDestination(body.destination);
        return json({ destination }, { status: 201 });
      
      case 'test-destination':
        const testCheck = rbac.checkAccess(user as any, Resource.BACKUP, Action.EXECUTE);
        if (!testCheck.allowed) throw error(403, 'Access denied');
        
        const testResult = await service.testDestination(body.destinationId);
        return json({ result: testResult });
      
      case 'create-schedule':
        const schedCheck = rbac.checkAccess(user as any, Resource.BACKUP, Action.CREATE);
        if (!schedCheck.allowed) throw error(403, 'Access denied');
        
        const schedule = service.createSchedule(body.schedule);
        return json({ schedule }, { status: 201 });
      
      case 'update-schedule':
        const updateSchedCheck = rbac.checkAccess(user as any, Resource.BACKUP, Action.UPDATE);
        if (!updateSchedCheck.allowed) throw error(403, 'Access denied');
        
        const updatedSchedule = service.updateSchedule(body.scheduleId, body.updates);
        return json({ schedule: updatedSchedule });
      
      case 'delete-schedule':
        const delSchedCheck = rbac.checkAccess(user as any, Resource.BACKUP, Action.DELETE);
        if (!delSchedCheck.allowed) throw error(403, 'Access denied');
        
        service.deleteSchedule(body.scheduleId);
        return json({ success: true });
      
      case 'create-restore':
        const restoreCheck = rbac.checkAccess(user as any, Resource.BACKUP, Action.EXECUTE);
        if (!restoreCheck.allowed) throw error(403, 'Access denied');
        
        const restore = await service.createRestore(body.config);
        return json({ restore }, { status: 201 });
      
      case 'create-dr-plan':
        const drCheck = rbac.checkAccess(user as any, Resource.BACKUP, Action.CREATE);
        if (!drCheck.allowed) throw error(403, 'Access denied');
        
        const plan = service.createDRPlan(body.plan);
        return json({ plan }, { status: 201 });
      
      case 'execute-dr-plan':
        const execDRCheck = rbac.checkAccess(user as any, Resource.BACKUP, Action.EXECUTE);
        if (!execDRCheck.allowed) throw error(403, 'Access denied');
        
        const executedPlan = await service.executeDRPlan(body.planId, user.username);
        return json({ plan: executedPlan });
      
      case 'test-dr-plan':
        const testDRCheck = rbac.checkAccess(user as any, Resource.BACKUP, Action.EXECUTE);
        if (!testDRCheck.allowed) throw error(403, 'Access denied');
        
        const testDRResult = await service.testDRPlan(body.planId);
        return json({ result: testDRResult });
      
      default:
        throw error(400, 'Invalid action');
    }
  } catch (err: any) {
    if (err.status) throw err;
    logger.error('Failed to process backup request:', err);
    throw error(500, err.message);
  }
};
