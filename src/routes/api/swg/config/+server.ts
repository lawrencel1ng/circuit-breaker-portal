import { json } from '@sveltejs/kit';
import { prisma } from '$lib/server/db';
import { logger } from '$lib/server/logger';
import type { RequestHandler } from './$types';

// GET /api/swg/config - Retrieve SWG configuration
export const GET: RequestHandler = async () => {
  try {
    let config = await prisma.sWGConfig.findUnique({
      where: { id: 'default' }
    });

    // Create default config if not exists
    if (!config) {
      config = await prisma.sWGConfig.create({
        data: { id: 'default' }
      });
    }

    return json({
      proxyListener: {
        ip: config.proxyIp,
        port: config.proxyPort,
        enabled: config.proxyEnabled,
        vlan: JSON.parse(config.vlans || '[]')
      },
      sslConfig: {
        caCert: config.caCert,
        intercept: config.sslIntercept,
        bypassList: JSON.parse(config.bypassList || '[]')
      },
      authentication: {
        enabled: config.authEnabled,
        scheme: config.authScheme,
        realm: config.authRealm,
        ldapConfig: config.ldapConfig ? JSON.parse(config.ldapConfig) : null
      },
      logging: {
        enabled: config.logEnabled,
        level: config.logLevel,
        destination: config.logDest
      },
      siem: {
        enabled: config.siemEnabled,
        serverIp: config.siemServerIp,
        port: config.siemPort,
        protocol: config.siemProtocol,
        format: config.siemFormat
      },
      icap: {
        enabled: config.icapEnabled,
        serverUri: config.icapServerUri,
        previewSize: config.icapPreview,
        failOpen: config.icapFailOpen
      },
      blockPages: {
        customTemplate: config.blockPageTemplate,
        contactEmail: config.blockPageEmail,
        showCategory: config.showCategory,
        showIP: config.showIP
      },
      threatFeeds: {
        autoUpdate: config.threatFeedsEnabled,
        updateInterval: config.threatFeedsInterval,
        licenseKey: config.threatFeedsLicenseKey,
        lastUpdate: config.threatFeedsLastUpdate?.toISOString(),
        status: config.threatFeedsStatus
      }
    });
  } catch (error) {
    logger.error('Failed to fetch SWG config', error);
    return json({ error: 'Failed to fetch configuration' }, { status: 500 });
  }
};

// POST /api/swg/config - Update SWG configuration
export const POST: RequestHandler = async ({ request }) => {
  try {
    const data = await request.json();

    const config = await prisma.sWGConfig.upsert({
      where: { id: 'default' },
      update: {
        proxyIp: data.proxyListener?.ip,
        proxyPort: data.proxyListener?.port,
        proxyEnabled: data.proxyListener?.enabled,
        vlans: JSON.stringify(data.proxyListener?.vlan || []),
        
        sslIntercept: data.sslConfig?.intercept,
        caCert: data.sslConfig?.caCert,
        bypassList: JSON.stringify(data.sslConfig?.bypassList || []),
        
        authEnabled: data.authentication?.enabled,
        authScheme: data.authentication?.scheme,
        authRealm: data.authentication?.realm,
        ldapConfig: data.authentication?.ldapConfig ? JSON.stringify(data.authentication.ldapConfig) : null,
        
        logEnabled: data.logging?.enabled,
        logLevel: data.logging?.level,
        logDest: data.logging?.destination,
        
        siemEnabled: data.siem?.enabled,
        siemServerIp: data.siem?.serverIp,
        siemPort: data.siem?.port,
        siemProtocol: data.siem?.protocol,
        siemFormat: data.siem?.format,
        
        icapEnabled: data.icap?.enabled,
        icapServerUri: data.icap?.serverUri,
        icapPreview: data.icap?.previewSize,
        icapFailOpen: data.icap?.failOpen,
        
        blockPageTemplate: data.blockPages?.customTemplate,
        blockPageEmail: data.blockPages?.contactEmail,
        showCategory: data.blockPages?.showCategory,
        showIP: data.blockPages?.showIP,
        
        threatFeedsEnabled: data.threatFeeds?.autoUpdate,
        threatFeedsInterval: data.threatFeeds?.updateInterval,
        threatFeedsLicenseKey: data.threatFeeds?.licenseKey,
        threatFeedsStatus: data.threatFeeds?.status
      },
      create: {
        id: 'default',
        proxyIp: data.proxyListener?.ip || '10.1.10.51',
        proxyPort: data.proxyListener?.port || 8080,
        proxyEnabled: data.proxyListener?.enabled ?? true,
        vlans: JSON.stringify(data.proxyListener?.vlan || ['vlan30', 'vlan40']),
        
        sslIntercept: data.sslConfig?.intercept ?? true,
        caCert: data.sslConfig?.caCert,
        bypassList: JSON.stringify(data.sslConfig?.bypassList || []),
        
        authEnabled: data.authentication?.enabled ?? true,
        authScheme: data.authentication?.scheme || 'ntlm',
        authRealm: data.authentication?.realm || 'CORP.LOCAL',
        ldapConfig: data.authentication?.ldapConfig ? JSON.stringify(data.authentication.ldapConfig) : null,
        
        logEnabled: data.logging?.enabled ?? true,
        logLevel: data.logging?.level || 'info',
        logDest: data.logging?.destination || 'local',
        
        siemEnabled: data.siem?.enabled ?? false,
        siemServerIp: data.siem?.serverIp,
        siemPort: data.siem?.port || 514,
        siemProtocol: data.siem?.protocol || 'udp',
        siemFormat: data.siem?.format || 'cef',
        
        icapEnabled: data.icap?.enabled ?? false,
        icapServerUri: data.icap?.serverUri,
        icapPreview: data.icap?.previewSize || 1024,
        icapFailOpen: data.icap?.failOpen ?? true,
        
        blockPageTemplate: data.blockPages?.customTemplate || '<h1>Access Denied</h1>',
        blockPageEmail: data.blockPages?.contactEmail || 'security@bank.com',
        showCategory: data.blockPages?.showCategory ?? true,
        showIP: data.blockPages?.showIP ?? true,
        
        threatFeedsEnabled: data.threatFeeds?.autoUpdate ?? true,
        threatFeedsInterval: data.threatFeeds?.updateInterval || 'daily',
        threatFeedsLicenseKey: data.threatFeeds?.licenseKey,
        threatFeedsStatus: data.threatFeeds?.status || 'active'
      }
    });

    return json({ success: true, config });
  } catch (error) {
    logger.error('Failed to update SWG config', error);
    return json({ error: 'Failed to update configuration' }, { status: 500 });
  }
};
