<script lang="ts">
  import { onMount } from 'svelte';
  import { Shield, AlertTriangle, CheckCircle, Clock, RefreshCw, Calendar, Lock } from 'lucide-svelte';

  let activeTab: 'server' | 'ca' = 'server';

  // Server Certificates (Reverse Proxy)
  let serverCertificates = [
    {
      id: 'cert1',
      domain: 'ocbc.com',
      issuer: 'DigiCert',
      validFrom: '2024-01-15',
      validTo: '2025-01-15',
      daysRemaining: 45,
      status: 'expiring_soon',
      autoRenew: true,
      lastRenewed: '2024-01-15',
      nextRenewal: '2024-12-01',
      virtualServers: ['vs-ocbc-main', 'vs-ocbc-api'],
      type: 'Wildcard SSL'
    },
    {
      id: 'cert2',
      domain: 'mobile.ocbc.com',
      issuer: 'Let\'s Encrypt',
      validFrom: '2024-11-01',
      validTo: '2025-02-01',
      daysRemaining: 15,
      status: 'expiring_soon',
      autoRenew: true,
      lastRenewed: '2024-11-01',
      nextRenewal: '2025-01-15',
      virtualServers: ['vs-mobile-api'],
      type: 'Standard SSL'
    },
    {
      id: 'cert3',
      domain: 'api.ocbc.com',
      issuer: 'GlobalSign',
      validFrom: '2024-06-01',
      validTo: '2025-06-01',
      daysRemaining: 210,
      status: 'valid',
      autoRenew: true,
      lastRenewed: '2024-06-01',
      nextRenewal: '2025-05-01',
      virtualServers: ['vs-api-gateway'],
      type: 'EV SSL'
    },
    {
      id: 'cert4',
      domain: 'internet.ocbc.com',
      issuer: 'Let\'s Encrypt',
      validFrom: '2024-10-15',
      validTo: '2025-01-15',
      daysRemaining: 5,
      status: 'critical',
      autoRenew: false,
      lastRenewed: '2024-10-15',
      nextRenewal: null,
      virtualServers: ['vs-internet-banking'],
      type: 'Standard SSL'
    },
    {
      id: 'cert5',
      domain: 'secure.ocbc.com',
      issuer: 'DigiCert',
      validFrom: '2023-12-01',
      validTo: '2024-12-01',
      daysRemaining: -2,
      status: 'expired',
      autoRenew: false,
      lastRenewed: '2023-12-01',
      nextRenewal: null,
      virtualServers: ['vs-secure-portal'],
      type: 'Wildcard SSL'
    },
    {
      id: 'cert6',
      domain: 'payments.ocbc.com',
      issuer: 'GlobalSign',
      validFrom: '2024-03-01',
      validTo: '2026-03-01',
      daysRemaining: 420,
      status: 'valid',
      autoRenew: true,
      lastRenewed: '2024-03-01',
      nextRenewal: '2026-02-01',
      virtualServers: ['vs-payments-gateway'],
      type: 'EV SSL'
    }
  ];

  // CA Certificates (Forward Proxy / SWG)
  let caCertificates = [
    { 
      id: 'ca_001', 
      domain: 'MyCompany Root CA', 
      type: 'Root CA', 
      validTo: '2028-12-31', 
      validFrom: '2018-01-01',
      status: 'valid', 
      issuer: 'Self-Signed', 
      virtualServers: ['SWG-Proxy'],
      daysRemaining: 1400,
      autoRenew: false,
      lastRenewed: null,
      nextRenewal: null
    },
    { 
      id: 'ca_002', 
      domain: 'Global Intercept CA', 
      type: 'Intermediate', 
      validTo: '2025-06-15', 
      validFrom: '2023-06-15',
      status: 'valid', 
      issuer: 'MyCompany Root CA', 
      virtualServers: ['SWG-Proxy'],
      daysRemaining: 400,
      autoRenew: true,
      lastRenewed: '2023-06-15',
      nextRenewal: '2025-05-15'
    },
    { 
      id: 'ca_003', 
      domain: 'Legacy Proxy CA', 
      type: 'Root CA', 
      validTo: '2023-01-01', 
      validFrom: '2013-01-01',
      status: 'expired', 
      issuer: 'Self-Signed', 
      virtualServers: [],
      daysRemaining: -400,
      autoRenew: false,
      lastRenewed: null,
      nextRenewal: null
    }
  ];

  $: certificates = activeTab === 'server' ? serverCertificates : caCertificates;

  let renewalHistory = [
    { id: 'renew1', domain: 'mobile.ocbc.com', timestamp: '2024-11-01T10:30:00Z', status: 'success', method: 'Let\'s Encrypt Auto', deployedTo: 'All Virtual Servers' },
    { id: 'renew2', domain: 'ocbc.com', timestamp: '2024-10-15T14:20:00Z', status: 'success', method: 'DigiCert API', deployedTo: 'vs-ocbc-main, vs-ocbc-api' },
    { id: 'renew3', domain: 'api.ocbc.com', timestamp: '2024-06-01T09:15:00Z', status: 'success', method: 'GlobalSign API', deployedTo: 'vs-api-gateway' },
    { id: 'renew4', domain: 'secure.ocbc.com', timestamp: '2024-11-28T16:45:00Z', status: 'failed', method: 'Manual', deployedTo: 'None', error: 'Certificate expired, manual intervention required' }
  ];

  $: complianceStatus = {
    totalCertificates: serverCertificates.length + caCertificates.length,
    expiredCertificates: (certificates || []).filter(c => c.status === 'expired').length,
    expiringSoon: (certificates || []).filter(c => c.status === 'expiring_soon' || c.status === 'critical').length,
    autoRenewEnabled: (certificates || []).filter(c => c.autoRenew).length,
    complianceScore: 85
  };

  function getStatusColor(status: string) {
    switch (status) {
      case 'valid': return 'text-green-600 bg-green-100 dark:bg-green-900 dark:text-green-200';
      case 'expiring_soon': return 'text-yellow-600 bg-yellow-100 dark:bg-yellow-900 dark:text-yellow-200';
      case 'critical': return 'text-orange-600 bg-orange-100 dark:bg-orange-900 dark:text-orange-200';
      case 'expired': return 'text-red-600 bg-red-100 dark:bg-red-900 dark:text-red-200';
      default: return 'text-gray-600 bg-gray-100 dark:bg-gray-900 dark:text-gray-200';
    }
  }

  function getStatusText(status: string) {
    switch (status) {
      case 'valid': return 'Valid';
      case 'expiring_soon': return 'Expiring Soon';
      case 'critical': return 'Critical';
      case 'expired': return 'Expired';
      default: return 'Unknown';
    }
  }

  function getDaysRemainingColor(days: number) {
    if (days < 0) return 'text-red-600';
    if (days < 30) return 'text-orange-600';
    if (days < 90) return 'text-yellow-600';
    return 'text-green-600';
  }

  function getRenewalStatusColor(status: string) {
    switch (status) {
      case 'success': return 'text-green-600 bg-green-100 dark:bg-green-900 dark:text-green-200';
      case 'failed': return 'text-red-600 bg-red-100 dark:bg-red-900 dark:text-red-200';
      case 'pending': return 'text-yellow-600 bg-yellow-100 dark:bg-yellow-900 dark:text-yellow-200';
      default: return 'text-gray-600 bg-gray-100 dark:bg-gray-900 dark:text-gray-200';
    }
  }

  function formatDate(dateString: string) {
    return new Date(dateString).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
  }

  function formatDateTime(dateString: string) {
    return new Date(dateString).toLocaleString('en-US', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
  }

  async function renewCertificate(certId: string) {
    const cert = certificates.find(c => c.id === certId);
    if (!cert) return;

    // Simulate renewal process
    cert.status = 'valid';
    cert.lastRenewed = new Date().toISOString().split('T')[0];
    cert.validTo = new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    cert.daysRemaining = 90;
    cert.nextRenewal = new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

    // Add to renewal history
    renewalHistory = [
      {
        id: `renew_${Date.now()}`,
        domain: cert.domain,
        timestamp: new Date().toISOString(),
        status: 'success',
        method: cert.issuer === 'Let\'s Encrypt' ? 'Let\'s Encrypt Auto' : `${cert.issuer} API`,
        deployedTo: cert.virtualServers.join(', ')
      },
      ...renewalHistory
    ];
  }

  function toggleAutoRenew(certId: string) {
    const cert = certificates.find(c => c.id === certId);
    if (cert) {
      cert.autoRenew = !cert.autoRenew;
      if (cert.autoRenew) {
        cert.nextRenewal = new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
      } else {
        cert.nextRenewal = null;
      }
    }
  }

  function updateCertificates() {
    const updateCert = (cert: any) => {
      const daysRemaining = Math.floor((new Date(cert.validTo).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
      let status = cert.status;
      
      if (daysRemaining < 0) {
        status = 'expired';
      } else if (daysRemaining < 7) {
        status = 'critical';
      } else if (daysRemaining < 30) {
        status = 'expiring_soon';
      } else {
        status = 'valid';
      }
      
      return { ...cert, daysRemaining, status };
    };

    serverCertificates = serverCertificates.map(updateCert);
    caCertificates = caCertificates.map(updateCert);
  }

  onMount(() => {
    // Initial update
    updateCertificates();
    
    // Simulate daily certificate expiration check
    const interval = setInterval(updateCertificates, 60000); // Check every minute

    return () => clearInterval(interval);
  });
</script>

<svelte:head>
  <title>Certificate Lifecycle Management - F5 Control Center</title>
</svelte:head>

<div class="space-y-6">
  <!-- Header -->
  <div class="bg-gradient-to-r from-green-600 to-teal-600 rounded-xl p-6 text-white">
    <div class="flex items-center justify-between">
      <div>
        <div class="flex items-center space-x-3 mb-2">
          <h1 class="text-3xl font-bold">Certificate Lifecycle Management</h1>
          <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
            Ready to Integrate
          </span>
        </div>
        <p class="text-green-100">Never let SSL certificates expire again</p>
        <p class="text-green-200 text-sm mt-2">
          <strong>Requirements:</strong> F5 BIG-IP SSL Orchestrator, iControl REST API, Let's Encrypt integration
        </p>
      </div>
      <div class="flex items-center space-x-6">
        <div class="text-center">
          <div class="text-2xl font-bold">{complianceStatus.totalCertificates}</div>
          <div class="text-sm text-green-100">Total Certificates</div>
        </div>
        <div class="text-center">
          <div class="text-2xl font-bold">{complianceStatus.expiredCertificates}</div>
          <div class="text-sm text-green-100">Expired</div>
        </div>
        <div class="text-center">
          <div class="text-2xl font-bold">{complianceStatus.complianceScore}%</div>
          <div class="text-sm text-green-100">Compliance Score</div>
        </div>
      </div>
    </div>
  </div>

  <!-- Compliance Overview -->
  <div class="grid grid-cols-1 md:grid-cols-4 gap-6">
    <div class="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
      <div class="flex items-center justify-between">
        <div>
          <p class="text-sm font-medium text-gray-600 dark:text-gray-400">Valid Certificates</p>
          <p class="text-3xl font-bold text-green-600 dark:text-green-400">
            {certificates.filter(c => c.status === 'valid').length}
          </p>
        </div>
        <div class="w-12 h-12 bg-green-100 dark:bg-green-900 rounded-lg flex items-center justify-center">
          <CheckCircle class="h-6 w-6 text-green-600 dark:text-green-400" />
        </div>
      </div>
    </div>

    <div class="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
      <div class="flex items-center justify-between">
        <div>
          <p class="text-sm font-medium text-gray-600 dark:text-gray-400">Expiring Soon</p>
          <p class="text-3xl font-bold text-yellow-600 dark:text-yellow-400">
            {certificates.filter(c => c.status === 'expiring_soon' || c.status === 'critical').length}
          </p>
        </div>
        <div class="w-12 h-12 bg-yellow-100 dark:bg-yellow-900 rounded-lg flex items-center justify-center">
          <Clock class="h-6 w-6 text-yellow-600 dark:text-yellow-400" />
        </div>
      </div>
    </div>

    <div class="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
      <div class="flex items-center justify-between">
        <div>
          <p class="text-sm font-medium text-gray-600 dark:text-gray-400">Auto-Renew Enabled</p>
          <p class="text-3xl font-bold text-blue-600 dark:text-blue-400">
            {certificates.filter(c => c.autoRenew).length}
          </p>
        </div>
        <div class="w-12 h-12 bg-blue-100 dark:bg-blue-900 rounded-lg flex items-center justify-center">
          <RefreshCw class="h-6 w-6 text-blue-600 dark:text-blue-400" />
        </div>
      </div>
    </div>

    <div class="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
      <div class="flex items-center justify-between">
        <div>
          <p class="text-sm font-medium text-gray-600 dark:text-gray-400">Expired</p>
          <p class="text-3xl font-bold text-red-600 dark:text-red-400">
            {certificates.filter(c => c.status === 'expired').length}
          </p>
        </div>
        <div class="w-12 h-12 bg-red-100 dark:bg-red-900 rounded-lg flex items-center justify-center">
          <AlertTriangle class="h-6 w-6 text-red-600 dark:text-red-400" />
        </div>
      </div>
    </div>
  </div>

  <!-- Tabs -->
  <div class="border-b border-gray-200 dark:border-gray-700">
    <nav class="-mb-px flex space-x-8" aria-label="Tabs">
      <button
        on:click={() => activeTab = 'server'}
        class="{activeTab === 'server'
          ? 'border-indigo-500 text-indigo-600 dark:text-indigo-400'
          : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 hover:border-gray-300'}
          whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm flex items-center"
      >
        <Lock class="h-4 w-4 mr-2" />
        Server Certificates (Reverse Proxy)
      </button>
      <button
        on:click={() => activeTab = 'ca'}
        class="{activeTab === 'ca'
          ? 'border-indigo-500 text-indigo-600 dark:text-indigo-400'
          : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 hover:border-gray-300'}
          whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm flex items-center"
      >
        <Shield class="h-4 w-4 mr-2" />
        Certificate Authorities (SWG/Forward Proxy)
      </button>
    </nav>
  </div>

  <!-- Certificate Inventory -->
  <div class="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
    <div class="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
      <h2 class="text-xl font-semibold text-gray-900 dark:text-white">Certificate Inventory</h2>
      <p class="text-sm text-gray-600 dark:text-gray-400 mt-1">
        Complete SSL certificate inventory with expiration tracking
      </p>
    </div>
    <div class="overflow-x-auto">
      <table class="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
        <thead class="bg-gray-50 dark:bg-gray-700">
          <tr>
            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
              Domain
            </th>
            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
              Issuer
            </th>
            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
              Valid To
            </th>
            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
              Days Remaining
            </th>
            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
              Status
            </th>
            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
              Auto-Renew
            </th>
            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
              Actions
            </th>
          </tr>
        </thead>
        <tbody class="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
          {#each certificates as cert}
            <tr class="hover:bg-gray-50 dark:hover:bg-gray-700">
              <td class="px-6 py-4 whitespace-nowrap">
                <div class="flex items-center">
                  <Shield class="h-4 w-4 text-gray-400 mr-2" />
                  <div>
                    <div class="text-sm font-medium text-gray-900 dark:text-white">{cert.domain}</div>
                    <div class="text-xs text-gray-500 dark:text-gray-400">{cert.type}</div>
                  </div>
                </div>
              </td>
              <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                {cert.issuer}
              </td>
              <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                {formatDate(cert.validTo)}
              </td>
              <td class="px-6 py-4 whitespace-nowrap">
                <span class="text-sm font-medium {getDaysRemainingColor(cert.daysRemaining)}">
                  {cert.daysRemaining} days
                </span>
              </td>
              <td class="px-6 py-4 whitespace-nowrap">
                <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium {getStatusColor(cert.status)}">
                  {getStatusText(cert.status)}
                </span>
              </td>
              <td class="px-6 py-4 whitespace-nowrap">
                <label class="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={cert.autoRenew}
                    on:change={() => toggleAutoRenew(cert.id)}
                    class="sr-only peer"
                  />
                  <div class="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
                </label>
              </td>
              <td class="px-6 py-4 whitespace-nowrap text-sm font-medium">
                <button
                  on:click={() => renewCertificate(cert.id)}
                  disabled={cert.status === 'valid' && cert.daysRemaining > 30}
                  class="text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300 disabled:opacity-50 disabled:cursor-not-allowed mr-3"
                >
                  {cert.status === 'expired' ? 'Renew Now' : 'Renew Early'}
                </button>
                <button class="text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-300">
                  View
                </button>
              </td>
            </tr>
          {/each}
        </tbody>
      </table>
    </div>
  </div>

  <!-- Renewal History -->
  <div class="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
    <div class="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
      <h2 class="text-xl font-semibold text-gray-900 dark:text-white">Renewal History</h2>
      <p class="text-sm text-gray-600 dark:text-gray-400 mt-1">
        Recent certificate renewals and deployment status
      </p>
    </div>
    <div class="p-6">
      <div class="space-y-4">
        {#each renewalHistory as renewal}
          <div class="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
            <div class="flex items-center space-x-4">
              <div class="flex-shrink-0">
                {#if renewal.status === 'success'}
                  <CheckCircle class="h-6 w-6 text-green-600" />
                {:else}
                  <AlertTriangle class="h-6 w-6 text-red-600" />
                {/if}
              </div>
              <div>
                <h3 class="text-sm font-medium text-gray-900 dark:text-white">{renewal.domain}</h3>
                <p class="text-sm text-gray-500 dark:text-gray-400">
                  {renewal.method} • Deployed to: {renewal.deployedTo}
                </p>
                {#if renewal.error}
                  <p class="text-xs text-red-600 dark:text-red-400 mt-1">{renewal.error}</p>
                {/if}
              </div>
            </div>
            <div class="flex items-center space-x-3">
              <span class="text-xs text-gray-500 dark:text-gray-400">
                {formatDateTime(renewal.timestamp)}
              </span>
              <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium {getRenewalStatusColor(renewal.status)}">
                {renewal.status}
              </span>
            </div>
          </div>
        {/each}
      </div>
    </div>
  </div>

  <!-- Expiration Calendar -->
  <div class="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
    <div class="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
      <h2 class="text-xl font-semibold text-gray-900 dark:text-white">Upcoming Expirations</h2>
      <p class="text-sm text-gray-600 dark:text-gray-400 mt-1">
        Certificates expiring in the next 90 days
      </p>
    </div>
    <div class="p-6">
      <div class="space-y-3">
        {#each certificates.filter(c => c.daysRemaining < 90 && c.daysRemaining >= 0).sort((a, b) => a.daysRemaining - b.daysRemaining) as cert}
          <div class="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
            <div class="flex items-center space-x-3">
              <Calendar class="h-4 w-4 text-gray-400" />
              <div>
                <div class="text-sm font-medium text-gray-900 dark:text-white">{cert.domain}</div>
                <div class="text-xs text-gray-500 dark:text-gray-400">
                  Expires: {formatDate(cert.validTo)}
                  {#if cert.autoRenew && cert.nextRenewal}
                    • Auto-renewal scheduled: {formatDate(cert.nextRenewal)}
                  {/if}
                </div>
              </div>
            </div>
            <div class="flex items-center space-x-3">
              <span class="text-sm font-medium {getDaysRemainingColor(cert.daysRemaining)}">
                {cert.daysRemaining} days
              </span>
              <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium {getStatusColor(cert.status)}">
                {getStatusText(cert.status)}
              </span>
            </div>
          </div>
        {/each}
      </div>
    </div>
  </div>
</div>
