import { writable } from 'svelte/store';
import { notificationStore } from './notificationStore';

export type RequestStatus = 'pending' | 'approved' | 'rejected';
export type RequestType = 'swg_whitelist' | 'circuit_breaker_create' | 'certificate_renew' | 'deployment_rollback' | 'f5_deployment';

export interface ApprovalRequest {
  id: string;
  type: RequestType;
  title: string;
  description: string;
  requester: string;
  timestamp: string;
  status: RequestStatus;
  data: any; // The payload needed to execute the action
  comments?: string;
}

function createApprovalStore() {
  const { subscribe, update, set } = writable<ApprovalRequest[]>([]);

  return {
    subscribe,
    setRequests: (requests: ApprovalRequest[]) => set(requests),
    loadRequests: async () => {
      if (typeof window === 'undefined' || typeof fetch === 'undefined') return;
      try {
        const response = await fetch('/api/approvals');
        if (response.ok) {
          const requests = await response.json();
          set(requests);
        } else if (response.status === 401 || response.status === 302 || response.status === 307) {
          // Don't show error for auth failures - expected when not logged in
          console.debug('Approval requests load skipped - not authenticated');
        }
      } catch (error) {
        console.error('Failed to load approval requests:', error);
        notificationStore.add({
          type: 'error',
          title: 'Error',
          message: 'Failed to load approval requests'
        });
      }
    },

    addRequest: async (request: Omit<ApprovalRequest, 'id' | 'timestamp' | 'status'>) => {
      try {
        const response = await fetch('/api/approvals', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(request)
        });
        
        if (!response.ok) throw new Error('Failed to create request');
        
        const newRequest = await response.json();
        update(requests => [newRequest, ...requests]);
        
        notificationStore.add({
          type: 'success',
          title: 'Request Submitted',
          message: 'Approval request created successfully'
        });
      } catch (error) {
        console.error('Failed to add request:', error);
        notificationStore.add({
          type: 'error',
          title: 'Error',
          message: 'Failed to create approval request'
        });
      }
    },

    approveRequest: async (id: string, comments?: string) => {
      try {
        const response = await fetch(`/api/approvals/${id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ status: 'approved', comments })
        });

        if (!response.ok) throw new Error('Failed to approve request');
        const updated = await response.json();

        update(requests => requests.map(req => 
          req.id === id ? { ...req, ...updated } : req
        ));

        notificationStore.add({
          type: 'success',
          title: 'Approved',
          message: 'Request approved successfully'
        });
      } catch (error) {
        console.error('Failed to approve request:', error);
        notificationStore.add({
          type: 'error',
          title: 'Error',
          message: 'Failed to approve request'
        });
      }
    },

    rejectRequest: async (id: string, comments?: string) => {
      try {
        const response = await fetch(`/api/approvals/${id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ status: 'rejected', comments })
        });

        if (!response.ok) throw new Error('Failed to reject request');
        const updated = await response.json();

        update(requests => requests.map(req => 
          req.id === id ? { ...req, ...updated } : req
        ));

        notificationStore.add({
          type: 'success',
          title: 'Rejected',
          message: 'Request rejected successfully'
        });
      } catch (error) {
        console.error('Failed to reject request:', error);
        notificationStore.add({
          type: 'error',
          title: 'Error',
          message: 'Failed to reject request'
        });
      }
    }
  };
}

export const approvalStore = createApprovalStore();
