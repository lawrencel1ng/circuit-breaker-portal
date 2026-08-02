import { writable } from 'svelte/store';
import type { DeploymentRequest, DeployedService, AS3Declaration } from '$lib/types';

export interface DeploymentState {
  deploymentRequests: DeploymentRequest[];
  deployedServices: DeployedService[];
  as3Declarations: AS3Declaration[];
}

// Initial state with sample data
const initialState: DeploymentState = {
  deploymentRequests: [
    {
      id: 'req-001',
      timestamp: '2024-01-15T10:30:00Z',
      developer: 'john.doe@ocbc.com',
      applicationName: 'OCBC Mobile API',
      applicationType: 'api',
      securityLevel: 'high',
      environment: 'production',
      description: 'Mobile banking API with high security requirements',
      status: 'deployed',
      vipAddress: '203.0.113.100',
      monitoringUrl: 'https://monitoring.ocbc.com/mobile-api',
      as3Declaration: null
    },
    {
      id: 'req-002',
      timestamp: '2024-01-15T11:15:00Z',
      developer: 'jane.smith@ocbc.com',
      applicationName: 'OCBC Web Portal',
      applicationType: 'web',
      securityLevel: 'medium',
      environment: 'staging',
      description: 'Customer web portal for internet banking',
      status: 'pending',
      vipAddress: null,
      monitoringUrl: null,
      as3Declaration: null
    }
  ],
  deployedServices: [
    {
      id: 'svc-001',
      name: 'OCBC Mobile API',
      vipAddress: '203.0.113.100',
      port: 443,
      protocol: 'HTTPS',
      status: 'active',
      health: 'healthy',
      traffic: 1250,
      responseTime: 45,
      errorRate: 0.1,
      deployedAt: '2024-01-15T10:30:00Z',
      lastUpdated: '2024-01-15T14:30:00Z',
      poolMembers: [
        { name: 'app-server-1', ip: '10.1.1.10', port: 8080, status: 'up', health: 'healthy' },
        { name: 'app-server-2', ip: '10.1.1.11', port: 8080, status: 'up', health: 'healthy' },
        { name: 'app-server-3', ip: '10.1.1.12', port: 8080, status: 'up', health: 'healthy' }
      ],
      sslProfile: 'OCBC-SSL-Profile',
      wafPolicy: 'OCBC-WAF-Policy',
      monitoringUrl: 'https://monitoring.ocbc.com/mobile-api'
    },
    {
      id: 'svc-002',
      name: 'OCBC Payment Gateway',
      vipAddress: '203.0.113.101',
      port: 443,
      protocol: 'HTTPS',
      status: 'active',
      health: 'degraded',
      traffic: 850,
      responseTime: 120,
      errorRate: 2.3,
      deployedAt: '2024-01-14T09:15:00Z',
      lastUpdated: '2024-01-15T14:30:00Z',
      poolMembers: [
        { name: 'payment-server-1', ip: '10.2.1.10', port: 8080, status: 'up', health: 'healthy' },
        { name: 'payment-server-2', ip: '10.2.1.11', port: 8080, status: 'down', health: 'unhealthy' },
        { name: 'payment-server-3', ip: '10.2.1.12', port: 8080, status: 'up', health: 'degraded' }
      ],
      sslProfile: 'OCBC-SSL-Profile',
      wafPolicy: 'OCBC-WAF-Policy',
      monitoringUrl: 'https://monitoring.ocbc.com/payment-gateway'
    }
  ],
  as3Declarations: []
};

export const deploymentStore = writable<DeploymentState>(initialState);

export const deploymentActions = {
  // Submit new deployment request
  submitDeploymentRequest: (request: Omit<DeploymentRequest, 'id' | 'timestamp' | 'status' | 'vipAddress' | 'monitoringUrl' | 'as3Declaration'>) => {
    const newRequest: DeploymentRequest = {
      ...request,
      id: `req-${Date.now()}`,
      timestamp: new Date().toISOString(),
      status: 'pending',
      vipAddress: null,
      monitoringUrl: null,
      as3Declaration: null
    };

    deploymentStore.update(state => ({
      ...state,
      deploymentRequests: [newRequest, ...state.deploymentRequests]
    }));

    return newRequest;
  },

  // Approve deployment request
  approveDeployment: (requestId: string) => {
    deploymentStore.update(state => ({
      ...state,
      deploymentRequests: state.deploymentRequests.map(req => 
        req.id === requestId ? { ...req, status: 'approved' } : req
      )
    }));
  },

  // Deploy service using AS3
  deployService: (requestId: string) => {
    let currentState: DeploymentState | undefined;
    deploymentStore.subscribe(s => currentState = s)();

    const request = currentState?.deploymentRequests.find(req => req.id === requestId);
    if (!request) return;

    // Generate VIP address
    const vipAddress = `203.0.113.${Math.floor(Math.random() * 100) + 100}`;
    
    // Create AS3 declaration
    const as3Declaration: AS3Declaration = {
      id: `as3-${Date.now()}`,
      requestId,
      declaration: {
        class: 'AS3',
        schemaVersion: '3.0.0',
        target: {
          host: 'f5-bigip-01.ocbc.com',
          username: 'admin',
          passphrase: 'encrypted'
        },
        declaration: {
          class: 'ADC',
          schemaVersion: '3.0.0',
          id: `ocbc-${request.applicationName.toLowerCase().replace(/\s+/g, '-')}`,
          label: request.applicationName,
          remark: request.description,
          [request.applicationName.toLowerCase().replace(/\s+/g, '')]: {
            class: 'Tenant',
            Application: {
              class: 'Application',
              template: 'generic',
              serviceMain: {
                class: 'Service_HTTP',
                virtualAddresses: [vipAddress],
                pool: 'pool_main',
                profileHTTP: 'basic',
                profileTCP: 'basic',
                profileClientSSL: request.securityLevel === 'high' ? 'OCBC-SSL-Profile' : 'basic',
                policyWAF: request.securityLevel === 'high' ? 'OCBC-WAF-Policy' : 'basic'
              },
              pool_main: {
                class: 'Pool',
                monitors: ['http'],
                members: [
                  { servicePort: 8080, serverAddresses: ['10.1.1.10', '10.1.1.11', '10.1.1.12'] }
                ]
              }
            }
          }
        }
      }
    };

    // Update request with AS3 declaration
    deploymentStore.update(state => ({
      ...state,
      deploymentRequests: state.deploymentRequests.map(req => 
        req.id === requestId ? { 
          ...req, 
          status: 'deploying',
          as3Declaration 
        } : req
      ),
      as3Declarations: [...state.as3Declarations, as3Declaration]
    }));

    // Simulate deployment process
    setTimeout(() => {
      deploymentStore.update(state => {
        const updatedRequest = state.deploymentRequests.find(req => req.id === requestId);
        if (!updatedRequest) return state;

        // Create deployed service
        const deployedService: DeployedService = {
          id: `svc-${Date.now()}`,
          name: updatedRequest.applicationName,
          vipAddress,
          port: 443,
          protocol: 'HTTPS',
          status: 'active',
          health: 'healthy',
          traffic: 0,
          responseTime: 0,
          errorRate: 0,
          deployedAt: new Date().toISOString(),
          lastUpdated: new Date().toISOString(),
          poolMembers: [
            { name: 'app-server-1', ip: '10.1.1.10', port: 8080, status: 'up', health: 'healthy' },
            { name: 'app-server-2', ip: '10.1.1.11', port: 8080, status: 'up', health: 'healthy' },
            { name: 'app-server-3', ip: '10.1.1.12', port: 8080, status: 'up', health: 'healthy' }
          ],
          sslProfile: updatedRequest.securityLevel === 'high' ? 'OCBC-SSL-Profile' : 'basic',
          wafPolicy: updatedRequest.securityLevel === 'high' ? 'OCBC-WAF-Policy' : 'basic',
          monitoringUrl: `https://monitoring.ocbc.com/${updatedRequest.applicationName.toLowerCase().replace(/\s+/g, '-')}`
        };

        return {
          ...state,
          deploymentRequests: state.deploymentRequests.map(req => 
            req.id === requestId ? { 
              ...req, 
              status: 'deployed',
              vipAddress,
              monitoringUrl: deployedService.monitoringUrl
            } : req
          ),
          deployedServices: [...state.deployedServices, deployedService]
        };
      });
    }, 3000);

    return as3Declaration;
  },

  // Initialize store with sample data
  initialize: () => {
    deploymentStore.set(initialState);
  },

  // Get current state
  getState: () => {
    let currentState: DeploymentState | undefined;
    const unsubscribe = deploymentStore.subscribe(state => currentState = state);
    unsubscribe();
    return currentState || initialState;
  }
};
