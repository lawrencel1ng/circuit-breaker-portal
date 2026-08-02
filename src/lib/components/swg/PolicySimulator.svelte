<script lang="ts">
  import { swgStore } from '$lib/stores/swgStore';
  import { Play, RotateCcw, Shield, CheckCircle, AlertTriangle, XCircle, Info, Search, User, Globe, Lock } from 'lucide-svelte';
  
  // Simulation Inputs
  let testUrl = 'https://www.facebook.com';
  let testUser = 'john.doe@example.com';
  let testIp = '192.168.1.105';
  let testProtocol = 'HTTPS';
  
  // Simulation State
  let isSimulating = false;
  let result: any = null;
  
  function simulatePolicy() {
    isSimulating = true;
    result = null;
    
    // Simulate network delay
    setTimeout(() => {
      // Get current active policy
      const policy = $swgStore.policies[0]; // Assuming first policy is active for now
      
      let matchedRule = null;
      let outcome = 'allowed'; // Default allow
      
      // Simple simulation logic
      for (const rule of policy.rules) {
        if (!rule.enabled) continue;
        
        let isMatch = false;
        const val = rule.condition.value.toLowerCase();
        
        if (rule.condition.type === 'HTTP_URI' || rule.condition.type === 'TLS_ClientHello') {
          if (rule.condition.operator === 'contains' && testUrl.toLowerCase().includes(val)) isMatch = true;
          if (rule.condition.operator === 'equals' && testUrl.toLowerCase() === val) isMatch = true;
        } else if (rule.condition.type === 'User_ID') {
          if (rule.condition.operator === 'contains' && testUser.toLowerCase().includes(val)) isMatch = true;
          if (rule.condition.operator === 'equals' && testUser.toLowerCase() === val) isMatch = true;
        }
        
        if (isMatch) {
          matchedRule = rule;
          outcome = rule.action;
          break; // First match wins
        }
      }
      
      result = {
        outcome,
        rule: matchedRule,
        policyName: policy.name,
        timestamp: new Date().toISOString(),
        details: matchedRule 
          ? `Matched rule "${matchedRule.name}" at priority position.` 
          : 'No specific blocking rules matched. Default policy allows traffic.'
      };
      
      isSimulating = false;
    }, 800);
  }
  
  function resetForm() {
    testUrl = '';
    testUser = '';
    testIp = '';
    result = null;
  }
  
  function getOutcomeColor(outcome: string) {
    switch (outcome) {
      case 'allow': return 'text-green-600 bg-green-50 border-green-200 dark:bg-green-900/20 dark:border-green-800 dark:text-green-400';
      case 'reject': return 'text-red-600 bg-red-50 border-red-200 dark:bg-red-900/20 dark:border-red-800 dark:text-red-400';
      case 'intercept': return 'text-yellow-600 bg-yellow-50 border-yellow-200 dark:bg-yellow-900/20 dark:border-yellow-800 dark:text-yellow-400';
      default: return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  }
</script>

<div class="space-y-6">
  <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
    <!-- Input Panel -->
    <div class="lg:col-span-1 space-y-4">
      <div class="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
        <h3 class="text-lg font-medium text-gray-900 dark:text-white mb-4 flex items-center">
          <Search class="h-5 w-5 mr-2 text-indigo-500" />
          Simulation Parameters
        </h3>
        
        <div class="space-y-4">
          <div>
            <label for="url" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Destination URL</label>
            <div class="relative rounded-md shadow-sm">
              <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Globe class="h-4 w-4 text-gray-400" />
              </div>
              <input
                type="text"
                id="url"
                bind:value={testUrl}
                class="focus:ring-indigo-500 focus:border-indigo-500 block w-full pl-10 sm:text-sm border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-md"
                placeholder="https://example.com"
              />
            </div>
          </div>
          
          <div>
            <label for="user" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">User Identity</label>
            <div class="relative rounded-md shadow-sm">
              <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <User class="h-4 w-4 text-gray-400" />
              </div>
              <input
                type="text"
                id="user"
                bind:value={testUser}
                class="focus:ring-indigo-500 focus:border-indigo-500 block w-full pl-10 sm:text-sm border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-md"
                placeholder="user@domain.com"
              />
            </div>
          </div>
          
          <div class="grid grid-cols-2 gap-4">
            <div>
              <label for="ip" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Source IP</label>
              <input
                type="text"
                id="ip"
                bind:value={testIp}
                class="focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-md"
                placeholder="10.x.x.x"
              />
            </div>
            <div>
              <label for="proto" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Protocol</label>
              <select
                id="proto"
                bind:value={testProtocol}
                class="focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-md"
              >
                <option>HTTP</option>
                <option>HTTPS</option>
                <option>FTP</option>
              </select>
            </div>
          </div>
          
          <div class="pt-4 flex space-x-3">
            <button
              on:click={simulatePolicy}
              disabled={isSimulating}
              class="flex-1 flex justify-center items-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {#if isSimulating}
                <svg class="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                  <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Analyzing...
              {:else}
                <Play class="h-4 w-4 mr-2" />
                Run Simulation
              {/if}
            </button>
            <button
              on:click={resetForm}
              class="flex justify-center items-center py-2 px-4 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm text-sm font-medium text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              <RotateCcw class="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
      
      <!-- Quick Tips -->
      <div class="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4 border border-blue-100 dark:border-blue-800">
        <div class="flex">
          <div class="flex-shrink-0">
            <Info class="h-5 w-5 text-blue-400" />
          </div>
          <div class="ml-3">
            <h3 class="text-sm font-medium text-blue-800 dark:text-blue-200">How this works</h3>
            <div class="mt-2 text-sm text-blue-700 dark:text-blue-300">
              <p>The simulator runs your request parameters against the currently active policy chain in real-time, respecting rule order and priority.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
    
    <!-- Result Panel -->
    <div class="lg:col-span-2">
      {#if result}
        <div class="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
          <div class="p-6 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center bg-gray-50 dark:bg-gray-800/50">
            <h3 class="text-lg font-medium text-gray-900 dark:text-white">Simulation Result</h3>
            <span class="text-sm text-gray-500">{new Date(result.timestamp).toLocaleTimeString()}</span>
          </div>
          
          <div class="p-8">
            <div class="flex flex-col items-center justify-center text-center mb-8">
              <div class="rounded-full p-4 mb-4 {result.outcome === 'allow' ? 'bg-green-100' : result.outcome === 'reject' ? 'bg-red-100' : 'bg-yellow-100'}">
                {#if result.outcome === 'allow'}
                  <CheckCircle class="h-12 w-12 text-green-600" />
                {:else if result.outcome === 'reject'}
                  <XCircle class="h-12 w-12 text-red-600" />
                {:else}
                  <Lock class="h-12 w-12 text-yellow-600" />
                {/if}
              </div>
              <h2 class="text-3xl font-bold text-gray-900 dark:text-white capitalize mb-2">
                Action: {result.outcome}
              </h2>
              <p class="text-gray-600 dark:text-gray-400 max-w-lg mx-auto">
                {result.details}
              </p>
            </div>
            
            <div class="border-t border-gray-200 dark:border-gray-700 pt-8">
              <h4 class="text-sm font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-4">Policy Trace</h4>
              
              <div class="relative pl-8 border-l-2 border-gray-200 dark:border-gray-700 space-y-8">
                <!-- Step 1 -->
                <div class="relative">
                  <div class="absolute -left-[39px] bg-green-500 h-6 w-6 rounded-full border-4 border-white dark:border-gray-800"></div>
                  <div class="mb-1 text-sm font-bold text-gray-900 dark:text-white">Start</div>
                  <div class="text-sm text-gray-500">Request received from {testIp}</div>
                </div>
                
                <!-- Step 2 -->
                <div class="relative">
                  <div class="absolute -left-[39px] bg-green-500 h-6 w-6 rounded-full border-4 border-white dark:border-gray-800"></div>
                  <div class="mb-1 text-sm font-bold text-gray-900 dark:text-white">Identity Resolution</div>
                  <div class="text-sm text-gray-500">User identified as <span class="font-mono text-xs bg-gray-100 dark:bg-gray-700 px-1 rounded">{testUser}</span></div>
                </div>
                
                <!-- Step 3: Rule Match -->
                <div class="relative">
                  <div class="absolute -left-[39px] {result.rule ? 'bg-indigo-500' : 'bg-gray-400'} h-6 w-6 rounded-full border-4 border-white dark:border-gray-800"></div>
                  <div class="mb-1 text-sm font-bold text-gray-900 dark:text-white">
                    {result.rule ? `Rule Match: ${result.rule.name}` : 'No Rule Matched'}
                  </div>
                  <div class="text-sm text-gray-500">
                    {#if result.rule}
                      Matched condition <span class="font-mono text-xs bg-gray-100 dark:bg-gray-700 px-1 rounded">{result.rule.condition.type} {result.rule.condition.operator} "{result.rule.condition.value}"</span>
                    {:else}
                      Traversed all rules in policy "{result.policyName}" without match.
                    {/if}
                  </div>
                </div>
                
                <!-- Final Step -->
                <div class="relative">
                  <div class="absolute -left-[39px] {result.outcome === 'allow' ? 'bg-green-500' : result.outcome === 'reject' ? 'bg-red-500' : 'bg-yellow-500'} h-6 w-6 rounded-full border-4 border-white dark:border-gray-800"></div>
                  <div class="mb-1 text-sm font-bold text-gray-900 dark:text-white">Final Action</div>
                  <div class="text-sm text-gray-500">
                    Traffic was <span class="uppercase font-bold {result.outcome === 'allow' ? 'text-green-600' : result.outcome === 'reject' ? 'text-red-600' : 'text-yellow-600'}">{result.outcome}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      {:else}
        <div class="h-full bg-gray-50 dark:bg-gray-800/50 rounded-lg border-2 border-dashed border-gray-300 dark:border-gray-700 flex flex-col items-center justify-center text-center p-12">
          <div class="h-16 w-16 bg-indigo-50 dark:bg-indigo-900/20 rounded-full flex items-center justify-center mb-4">
            <Play class="h-8 w-8 text-indigo-400" />
          </div>
          <h3 class="text-lg font-medium text-gray-900 dark:text-white">Ready to Simulate</h3>
          <p class="text-gray-500 dark:text-gray-400 mt-2 max-w-sm">
            Enter the traffic parameters on the left and click "Run Simulation" to see how your security policies will react.
          </p>
        </div>
      {/if}
    </div>
  </div>
</div>
