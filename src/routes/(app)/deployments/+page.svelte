<script lang="ts">
  import { onMount } from 'svelte';
  import { circuitBreakerStore, circuitBreakerActions } from '$lib/stores/circuitBreakerStore';
  import { notificationStore } from '$lib/stores/notificationStore';
  import { workflowStore } from '$lib/stores/workflowStore';
  import { approvalStore } from '$lib/stores/approvalStore';
  import { changeWindowStore } from '$lib/stores/changeWindowStore';
  import DeploymentForm from '$lib/components/DeploymentForm.svelte';
  import DeploymentList from '$lib/components/DeploymentList.svelte';
  import type { CircuitBreakerConfig, Application } from '$lib/types';

  let config: CircuitBreakerConfig | undefined;
  let applications: Application[] = [];
  let showDeploymentForm = false;

  $: config = $circuitBreakerStore;
  $: applications = $circuitBreakerStore?.applications || [];

  function handleDeployApplication(applicationData: Omit<Application, 'id'>) {
    // Validate Change Window
    const plannedDate = applicationData.plannedExecutionTime 
      ? new Date(applicationData.plannedExecutionTime) 
      : new Date();

    const windowCheck = changeWindowStore.isAllowed(plannedDate, $changeWindowStore);
    
    if (!windowCheck.allowed) {
      notificationStore.add({
        type: 'error',
        title: 'Deployment Blocked',
        message: `Deployment time is restricted: ${windowCheck.reason}`
      });
      return;
    }

    const deploymentRule = $workflowStore.find(r => r.actionType === 'f5_deployment');
    
    if (deploymentRule?.requiresApproval) {
      approvalStore.addRequest({
        type: 'f5_deployment',
        title: `Deploy Application: ${applicationData.name}`,
        description: `Request to deploy version ${applicationData.version || '1.0.0'} of ${applicationData.name}`,
        requester: 'user@company.com', // In a real app, get from auth context
        data: applicationData
      });
      
      showDeploymentForm = false;
      notificationStore.add({
        type: 'info',
        title: 'Approval Required',
        message: `Deployment request for ${applicationData.name} has been submitted for approval.`
      });
    } else {
      circuitBreakerActions.addApplication(applicationData);
      showDeploymentForm = false;
      notificationStore.add({
        type: 'success',
        title: 'Application Deployed',
        message: `${applicationData.name} has been deployed successfully`
      });
    }
  }

  function handleCancelDeployment() {
    showDeploymentForm = false;
  }
</script>

<svelte:head>
  <title>Deployments - OCBC Circuit Breaker Portal</title>
</svelte:head>

<div class="space-y-8">
  <!-- Header -->
  <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between">
    <div>
      <h1 class="text-3xl font-bold text-gray-900 dark:text-white">Application Deployments</h1>
      <p class="mt-2 text-gray-600 dark:text-gray-400">
        Manage application deployments across circuit breaker lanes
      </p>
    </div>
    <button
      class="btn-primary mt-4 sm:mt-0"
      on:click={() => showDeploymentForm = true}
    >
      Deploy New Application
    </button>
  </div>

  <!-- Deployment Form Modal -->
  {#if showDeploymentForm}
    <div class="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div class="relative top-20 mx-auto p-5 border w-full max-w-2xl shadow-lg rounded-md bg-white dark:bg-gray-800">
        <DeploymentForm 
          onDeploy={handleDeployApplication}
          onCancel={handleCancelDeployment}
        />
      </div>
    </div>
  {/if}

  <!-- Deployment List -->
  <DeploymentList {applications} />
</div>
