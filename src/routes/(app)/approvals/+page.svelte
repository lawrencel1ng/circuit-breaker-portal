<script lang="ts">
  import { approvalStore } from '$lib/stores/approvalStore';
  import { circuitBreakerActions } from '$lib/stores/circuitBreakerStore';
  import { notificationStore } from '$lib/stores/notificationStore';
  import { CheckCircle, XCircle, Clock, AlertCircle, FileText, User, ChevronRight, Filter } from 'lucide-svelte';
  import { fade, slide } from 'svelte/transition';

  let selectedTab: 'pending' | 'history' = 'pending';
  let selectedType: string = 'all';
  let selectedRequest: any = null;
  let comment = '';

  $: pendingRequests = $approvalStore.filter(r => r.status === 'pending');
  $: historyRequests = $approvalStore.filter(r => r.status !== 'pending');
  $: displayRequests = (selectedTab === 'pending' ? pendingRequests : historyRequests)
      .filter(r => selectedType === 'all' || r.type === selectedType);

  function handleApprove(id: string) {
    if (confirm('Are you sure you want to approve this request?')) {
      const req = $approvalStore.find(r => r.id === id);
      
      if (req && req.type === 'f5_deployment') {
        try {
          circuitBreakerActions.addApplication(req.data);
          notificationStore.add({
            type: 'success',
            title: 'Deployment Approved',
            message: `Application ${req.data.name} has been deployed.`
          });
        } catch (error) {
          console.error('Deployment failed:', error);
          notificationStore.add({
            type: 'error',
            title: 'Deployment Failed',
            message: 'Failed to deploy application after approval.'
          });
          return;
        }
      }

      approvalStore.approveRequest(id, comment);
      selectedRequest = null;
      comment = '';
    }
  }

  function handleReject(id: string) {
    if (confirm('Are you sure you want to reject this request?')) {
      approvalStore.rejectRequest(id, comment);
      selectedRequest = null;
      comment = '';
    }
  }

  function getTypeColor(type: string) {
    switch(type) {
      case 'swg_whitelist': return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300';
      case 'circuit_breaker_create': return 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300';
      case 'deployment_rollback': return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300';
      case 'f5_deployment': return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300';
    }
  }
</script>

<svelte:head>
  <title>Approvals Dashboard - Circuit Breaker Portal</title>
</svelte:head>

<div class="h-full flex flex-col space-y-6">
  <!-- Header -->
  <div class="flex items-center justify-between">
    <div>
      <h1 class="text-2xl font-bold text-gray-900 dark:text-white flex items-center">
        <FileText class="mr-3 h-8 w-8 text-indigo-600" />
        Approval Inbox
      </h1>
      <p class="text-gray-500 dark:text-gray-400 mt-1">Review and manage pending requests from your team.</p>
    </div>
    
    <div class="flex items-center space-x-4">
      <div class="relative">
        <select
          bind:value={selectedType}
          class="appearance-none bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-200 py-2 pl-3 pr-8 rounded-lg leading-tight focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm"
        >
          <option value="all">All Types</option>
          <option value="f5_deployment">F5 Deployment</option>
          <option value="swg_whitelist">SWG Whitelist</option>
          <option value="circuit_breaker_create">Circuit Breaker</option>
          <option value="deployment_rollback">Rollback</option>
          <option value="certificate_renew">Certificate Renew</option>
        </select>
        <div class="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-500">
          <Filter class="h-4 w-4" />
        </div>
      </div>

      <div class="flex space-x-1 bg-gray-100 dark:bg-gray-800 p-1 rounded-lg">
        <button
          on:click={() => selectedTab = 'pending'}
          class="px-4 py-2 text-sm font-medium rounded-md transition-colors {selectedTab === 'pending' ? 'bg-white dark:bg-gray-700 shadow text-gray-900 dark:text-white' : 'text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'}"
        >
          Pending ({pendingRequests.length})
        </button>
        <button
          on:click={() => selectedTab = 'history'}
          class="px-4 py-2 text-sm font-medium rounded-md transition-colors {selectedTab === 'history' ? 'bg-white dark:bg-gray-700 shadow text-gray-900 dark:text-white' : 'text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'}"
        >
          History
        </button>
      </div>
    </div>
  </div>

  <div class="flex-1 grid grid-cols-1 lg:grid-cols-3 gap-6 min-h-0">
    <!-- List View -->
    <div class="lg:col-span-1 bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-y-auto">
      <div class="divide-y divide-gray-200 dark:divide-gray-700">
        {#if displayRequests.length === 0}
          <div class="p-8 text-center text-gray-500 dark:text-gray-400">
            <CheckCircle class="h-12 w-12 mx-auto mb-3 text-green-500 opacity-50" />
            <p>No {selectedTab} requests.</p>
          </div>
        {:else}
          {#each displayRequests as req}
            <button
              on:click={() => selectedRequest = req}
              class="w-full text-left p-4 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors {selectedRequest?.id === req.id ? 'bg-indigo-50 dark:bg-indigo-900/20 border-l-4 border-indigo-500' : 'border-l-4 border-transparent'}"
            >
              <div class="flex justify-between items-start mb-1">
                <span class="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium {getTypeColor(req.type)}">
                  {req.type.split('_').join(' ')}
                </span>
                <span class="text-xs text-gray-500 dark:text-gray-400">
                  {new Date(req.timestamp).toLocaleDateString()}
                </span>
              </div>
              <h3 class="text-sm font-bold text-gray-900 dark:text-white truncate">{req.title}</h3>
              <p class="text-xs text-gray-500 dark:text-gray-400 mt-1 flex items-center">
                <User class="h-3 w-3 mr-1" /> {req.requester}
              </p>
            </button>
          {/each}
        {/if}
      </div>
    </div>

    <!-- Detail View -->
    <div class="lg:col-span-2 bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6 overflow-y-auto">
      {#if selectedRequest}
        <div in:fade={{ duration: 200 }} class="h-full flex flex-col">
          <div class="flex items-start justify-between mb-6">
            <div>
              <h2 class="text-2xl font-bold text-gray-900 dark:text-white mb-2">{selectedRequest.title}</h2>
              <div class="flex items-center space-x-4 text-sm text-gray-500 dark:text-gray-400">
                <span class="flex items-center"><User class="h-4 w-4 mr-1" /> {selectedRequest.requester}</span>
                <span class="flex items-center"><Clock class="h-4 w-4 mr-1" /> {new Date(selectedRequest.timestamp).toLocaleString()}</span>
              </div>
              {#if selectedRequest.data?.plannedExecutionTime}
                <div class="mt-2 flex items-center text-sm font-medium text-amber-600 dark:text-amber-400">
                  <Clock class="h-4 w-4 mr-1" />
                  Change Window: {new Date(selectedRequest.data.plannedExecutionTime).toLocaleString()}
                </div>
              {/if}
            </div>
            {#if selectedRequest.status !== 'pending'}
              <span class="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium 
                {selectedRequest.status === 'approved' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}">
                {selectedRequest.status.toUpperCase()}
              </span>
            {/if}
          </div>

          <div class="prose dark:prose-invert max-w-none mb-8">
            <h3 class="text-lg font-medium text-gray-900 dark:text-white">Description</h3>
            <p class="text-gray-600 dark:text-gray-300">{selectedRequest.description}</p>
            
            <h3 class="text-lg font-medium text-gray-900 dark:text-white mt-6">Request Payload</h3>
            <div class="bg-gray-50 dark:bg-gray-900 p-4 rounded-lg font-mono text-sm overflow-x-auto">
              <pre>{JSON.stringify(selectedRequest.data, null, 2)}</pre>
            </div>
          </div>

          {#if selectedRequest.status === 'pending'}
            <div class="mt-auto border-t border-gray-200 dark:border-gray-700 pt-6">
              <label for="comment" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Approval/Rejection Comments (Optional)
              </label>
              <textarea
                id="comment"
                bind:value={comment}
                rows="3"
                class="shadow-sm block w-full focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm border-gray-300 dark:border-gray-600 dark:bg-gray-700 rounded-md mb-4"
                placeholder="Add a note..."
              ></textarea>
              
              <div class="flex justify-end space-x-3">
                <button
                  on:click={() => handleReject(selectedRequest.id)}
                  class="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-red-700 bg-red-100 hover:bg-red-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                >
                  <XCircle class="mr-2 h-4 w-4" />
                  Reject
                </button>
                <button
                  on:click={() => handleApprove(selectedRequest.id)}
                  class="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                >
                  <CheckCircle class="mr-2 h-4 w-4" />
                  Approve
                </button>
              </div>
            </div>
          {/if}
        </div>
      {:else}
        <div class="h-full flex flex-col items-center justify-center text-gray-400">
          <AlertCircle class="h-16 w-16 mb-4 opacity-20" />
          <p class="text-lg font-medium">Select a request to view details</p>
        </div>
      {/if}
    </div>
  </div>
</div>
