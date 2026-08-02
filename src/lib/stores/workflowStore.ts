import { writable } from 'svelte/store';
import type { RequestType } from './approvalStore';

export interface WorkflowRule {
  id: string;
  actionType: RequestType;
  name: string;
  description: string;
  requiresApproval: boolean;
  approverRole: 'admin' | 'secops' | 'manager';
  autoApproveCriteria?: string;
}

function createWorkflowStore() {
  const { subscribe, set, update } = writable<WorkflowRule[]>([]);

  return {
    subscribe,
    setRules: (rules: WorkflowRule[]) => set(rules),
    
    toggleApproval: async (id: string) => {
      // Optimistic update
      let currentRule: WorkflowRule | undefined;
      update(rules => {
        const index = rules.findIndex(r => r.id === id);
        if (index !== -1) {
          currentRule = rules[index];
          const newRules = [...rules];
          newRules[index] = { ...currentRule, requiresApproval: !currentRule.requiresApproval };
          return newRules;
        }
        return rules;
      });

      if (currentRule) {
        try {
          const response = await fetch(`/api/workflow-rules/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
              requiresApproval: !currentRule.requiresApproval 
            })
          });

          if (!response.ok) throw new Error('Failed to update rule');
        } catch (error) {
          console.error('Failed to update workflow rule:', error);
          // Revert on failure
          update(rules => {
             const index = rules.findIndex(r => r.id === id);
             if (index !== -1 && currentRule) {
               const newRules = [...rules];
               newRules[index] = currentRule;
               return newRules;
             }
             return rules;
          });
        }
      }
    },

    updateApprover: async (id: string, role: WorkflowRule['approverRole']) => {
       // Optimistic update
      let currentRule: WorkflowRule | undefined;
      update(rules => {
        const index = rules.findIndex(r => r.id === id);
        if (index !== -1) {
          currentRule = rules[index];
          const newRules = [...rules];
          newRules[index] = { ...currentRule, approverRole: role };
          return newRules;
        }
        return rules;
      });

      if (currentRule) {
        try {
          const response = await fetch(`/api/workflow-rules/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ approverRole: role })
          });

          if (!response.ok) throw new Error('Failed to update rule');
        } catch (error) {
          console.error('Failed to update workflow rule:', error);
          // Revert on failure
          update(rules => {
             const index = rules.findIndex(r => r.id === id);
             if (index !== -1 && currentRule) {
               const newRules = [...rules];
               newRules[index] = currentRule;
               return newRules;
             }
             return rules;
          });
        }
      }
    }
  };
}

export const workflowStore = createWorkflowStore();
