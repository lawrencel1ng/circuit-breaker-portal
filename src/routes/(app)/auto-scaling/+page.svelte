<script lang="ts">
  import { onMount } from 'svelte';
  import { TrendingUp, TrendingDown, Activity, Server, Zap, AlertTriangle, CheckCircle } from 'lucide-svelte';

  let scalingMetrics = {
    currentCapacity: 65,
    targetCapacity: 70,
    minCapacity: 20,
    maxCapacity: 100,
    responseTime: 145,
    throughput: 1250,
    errorRate: 0.8
  };

  let scalingEvents = [
    { id: 'event1', timestamp: '2 minutes ago', type: 'scale_out', reason: 'High CPU usage (85%)', instances: '+2', status: 'completed' },
    { id: 'event2', timestamp: '15 minutes ago', type: 'scale_in', reason: 'Low traffic detected', instances: '-1', status: 'completed' },
    { id: 'event3', timestamp: '1 hour ago', type: 'scale_out', reason: 'Peak traffic period', instances: '+3', status: 'completed' },
    { id: 'event4', timestamp: '2 hours ago', type: 'scale_in', reason: 'Off-peak hours', instances: '-2', status: 'completed' }
  ];

  let poolMembers = [
    { id: 'member1', name: 'app-server-1', ip: '10.10.1.10', port: 8080, status: 'up', health: 'healthy', cpu: 45, memory: 60, responseTime: 120 },
    { id: 'member2', name: 'app-server-2', ip: '10.10.1.11', port: 8080, status: 'up', health: 'healthy', cpu: 52, memory: 65, responseTime: 135 },
    { id: 'member3', name: 'app-server-3', ip: '10.10.1.12', port: 8080, status: 'up', health: 'degraded', cpu: 78, memory: 80, responseTime: 180 },
    { id: 'member4', name: 'app-server-4', ip: '10.10.1.13', port: 8080, status: 'up', health: 'healthy', cpu: 38, memory: 55, responseTime: 110 },
    { id: 'member5', name: 'app-server-5', ip: '10.10.1.14', port: 8080, status: 'up', health: 'healthy', cpu: 42, memory: 58, responseTime: 125 }
  ];

  let scalingPolicies = [
    { id: 'policy1', name: 'CPU-based Scaling', metric: 'CPU Usage', threshold: 70, action: 'Scale Out', cooldown: 300, status: 'active' },
    { id: 'policy2', name: 'Memory-based Scaling', metric: 'Memory Usage', threshold: 80, action: 'Scale Out', cooldown: 300, status: 'active' },
    { id: 'policy3', name: 'Response Time Scaling', metric: 'Response Time', threshold: 200, action: 'Scale Out', cooldown: 180, status: 'active' },
    { id: 'policy4', name: 'Low Traffic Scale-in', metric: 'Throughput', threshold: 500, action: 'Scale In', cooldown: 600, status: 'active' }
  ];

  function getHealthColor(health: string) {
    switch (health) {
      case 'healthy': return 'text-green-600 bg-green-100 dark:bg-green-900 dark:text-green-200';
      case 'degraded': return 'text-yellow-600 bg-yellow-100 dark:bg-yellow-900 dark:text-yellow-200';
      case 'unhealthy': return 'text-red-600 bg-red-100 dark:bg-red-900 dark:text-red-200';
      default: return 'text-gray-600 bg-gray-100 dark:bg-gray-900 dark:text-gray-200';
    }
  }

  function getStatusColor(status: string) {
    switch (status) {
      case 'up': return 'text-green-600 bg-green-100 dark:bg-green-900 dark:text-green-200';
      case 'down': return 'text-red-600 bg-red-100 dark:bg-red-900 dark:text-red-200';
      case 'disabled': return 'text-gray-600 bg-gray-100 dark:bg-gray-900 dark:text-gray-200';
      default: return 'text-gray-600 bg-gray-100 dark:bg-gray-900 dark:text-gray-200';
    }
  }

  function getEventIcon(type: string) {
    switch (type) {
      case 'scale_out': return TrendingUp;
      case 'scale_in': return TrendingDown;
      default: return Activity;
    }
  }

  function getEventColor(type: string) {
    switch (type) {
      case 'scale_out': return 'text-blue-600 bg-blue-100 dark:bg-blue-900 dark:text-blue-200';
      case 'scale_in': return 'text-green-600 bg-green-100 dark:bg-green-900 dark:text-green-200';
      default: return 'text-gray-600 bg-gray-100 dark:bg-gray-900 dark:text-gray-200';
    }
  }

  onMount(() => {
    // Simulate real-time scaling updates
    const interval = setInterval(() => {
      // Simulate capacity changes
      scalingMetrics.currentCapacity += (Math.random() - 0.5) * 5;
      scalingMetrics.currentCapacity = Math.max(scalingMetrics.minCapacity, Math.min(scalingMetrics.maxCapacity, scalingMetrics.currentCapacity));
      
      // Simulate performance metrics
      scalingMetrics.responseTime += (Math.random() - 0.5) * 20;
      scalingMetrics.throughput += (Math.random() - 0.5) * 100;
      scalingMetrics.errorRate += (Math.random() - 0.5) * 0.2;
      
      // Ensure values stay within reasonable bounds
      scalingMetrics.responseTime = Math.max(50, Math.min(500, scalingMetrics.responseTime));
      scalingMetrics.throughput = Math.max(500, Math.min(2000, scalingMetrics.throughput));
      scalingMetrics.errorRate = Math.max(0, Math.min(5, scalingMetrics.errorRate));
      
      // Update pool member metrics
      poolMembers = poolMembers.map(member => ({
        ...member,
        cpu: Math.max(10, Math.min(100, member.cpu + (Math.random() - 0.5) * 10)),
        memory: Math.max(20, Math.min(100, member.memory + (Math.random() - 0.5) * 5)),
        responseTime: Math.max(50, Math.min(300, member.responseTime + (Math.random() - 0.5) * 20))
      }));
    }, 5000);

    return () => clearInterval(interval);
  });
</script>

<svelte:head>
  <title>Cloud Auto-Scaling - F5 Control Center</title>
</svelte:head>

<div class="space-y-6">
  <!-- Header -->
  <div class="bg-gradient-to-r from-orange-600 to-red-600 rounded-xl p-6 text-white">
    <div class="flex items-center justify-between">
      <div>
        <div class="flex items-center space-x-3 mb-2">
          <h1 class="text-3xl font-bold">Cloud Auto-Scaling & Dynamic Pool Management</h1>
          <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
            Future Roadmap
          </span>
        </div>
        <p class="text-orange-100">Cloud-native elastic load balancing with intelligent resource management</p>
        <p class="text-orange-200 text-sm mt-2">
          <strong>Requirements:</strong> F5 Cloud Edition, Kubernetes integration, external monitoring tools
        </p>
      </div>
      <div class="flex items-center space-x-6">
        <div class="text-center">
          <div class="text-2xl font-bold">{Math.round(scalingMetrics.currentCapacity)}%</div>
          <div class="text-sm text-orange-100">Current Capacity</div>
        </div>
        <div class="text-center">
          <div class="text-2xl font-bold">{scalingMetrics.responseTime.toFixed(0)}ms</div>
          <div class="text-sm text-orange-100">Response Time</div>
        </div>
        <div class="text-center">
          <div class="text-2xl font-bold">{poolMembers.length}</div>
          <div class="text-sm text-orange-100">Active Instances</div>
        </div>
      </div>
    </div>
  </div>

  <!-- Capacity Overview -->
  <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
    <div class="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
      <div class="flex items-center justify-between">
        <div>
          <p class="text-sm font-medium text-gray-600 dark:text-gray-400">Current Capacity</p>
          <p class="text-3xl font-bold text-blue-600 dark:text-blue-400">{Math.round(scalingMetrics.currentCapacity)}%</p>
        </div>
        <div class="w-12 h-12 bg-blue-100 dark:bg-blue-900 rounded-lg flex items-center justify-center">
          <Activity class="h-6 w-6 text-blue-600 dark:text-blue-400" />
        </div>
      </div>
      <div class="mt-4">
        <div class="w-full bg-gray-200 dark:bg-gray-600 rounded-full h-2">
          <div 
            class="bg-blue-600 h-2 rounded-full transition-all duration-300"
            style="width: {Math.round(scalingMetrics.currentCapacity)}%"
          ></div>
        </div>
        <div class="flex justify-between text-xs text-gray-500 dark:text-gray-400 mt-1">
          <span>Min: {Math.round(scalingMetrics.minCapacity)}%</span>
          <span>Max: {Math.round(scalingMetrics.maxCapacity)}%</span>
        </div>
      </div>
    </div>

    <div class="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
      <div class="flex items-center justify-between">
        <div>
          <p class="text-sm font-medium text-gray-600 dark:text-gray-400">Response Time</p>
          <p class="text-3xl font-bold text-green-600 dark:text-green-400">{scalingMetrics.responseTime.toFixed(0)}ms</p>
        </div>
        <div class="w-12 h-12 bg-green-100 dark:bg-green-900 rounded-lg flex items-center justify-center">
          <Zap class="h-6 w-6 text-green-600 dark:text-green-400" />
        </div>
      </div>
    </div>

    <div class="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
      <div class="flex items-center justify-between">
        <div>
          <p class="text-sm font-medium text-gray-600 dark:text-gray-400">Throughput</p>
          <p class="text-3xl font-bold text-purple-600 dark:text-purple-400">{scalingMetrics.throughput.toFixed(0)}</p>
        </div>
        <div class="w-12 h-12 bg-purple-100 dark:bg-purple-900 rounded-lg flex items-center justify-center">
          <TrendingUp class="h-6 w-6 text-purple-600 dark:text-purple-400" />
        </div>
      </div>
    </div>

    <div class="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
      <div class="flex items-center justify-between">
        <div>
          <p class="text-sm font-medium text-gray-600 dark:text-gray-400">Error Rate</p>
          <p class="text-3xl font-bold text-orange-600 dark:text-orange-400">{scalingMetrics.errorRate.toFixed(2)}%</p>
        </div>
        <div class="w-12 h-12 bg-orange-100 dark:bg-orange-900 rounded-lg flex items-center justify-center">
          <AlertTriangle class="h-6 w-6 text-orange-600 dark:text-orange-400" />
        </div>
      </div>
    </div>
  </div>

  <!-- Pool Members -->
  <div class="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
    <div class="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
      <h2 class="text-xl font-semibold text-gray-900 dark:text-white">Pool Members</h2>
      <p class="text-sm text-gray-600 dark:text-gray-400 mt-1">
        Real-time monitoring of all pool members with auto-scaling metrics
      </p>
    </div>
    <div class="overflow-x-auto">
      <table class="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
        <thead class="bg-gray-50 dark:bg-gray-700">
          <tr>
            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
              Instance
            </th>
            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
              Status
            </th>
            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
              CPU
            </th>
            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
              Memory
            </th>
            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
              Response Time
            </th>
            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
              Actions
            </th>
          </tr>
        </thead>
        <tbody class="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
          {#each poolMembers as member}
            <tr class="hover:bg-gray-50 dark:hover:bg-gray-700">
              <td class="px-6 py-4 whitespace-nowrap">
                <div class="flex items-center">
                  <Server class="h-4 w-4 text-gray-400 mr-2" />
                  <div>
                    <div class="text-sm font-medium text-gray-900 dark:text-white">{member.name}</div>
                    <div class="text-xs text-gray-500 dark:text-gray-400">{member.ip}:{member.port}</div>
                  </div>
                </div>
              </td>
              <td class="px-6 py-4 whitespace-nowrap">
                <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium {getStatusColor(member.status)}">
                  {member.status}
                </span>
              </td>
              <td class="px-6 py-4 whitespace-nowrap">
                <div class="flex items-center">
                  <div class="w-16 bg-gray-200 dark:bg-gray-600 rounded-full h-2 mr-2">
                    <div 
                      class="bg-blue-600 h-2 rounded-full transition-all duration-300"
                      style="width: {member.cpu}%"
                    ></div>
                  </div>
                  <span class="text-sm text-gray-900 dark:text-white">{member.cpu.toFixed(0)}%</span>
                </div>
              </td>
              <td class="px-6 py-4 whitespace-nowrap">
                <div class="flex items-center">
                  <div class="w-16 bg-gray-200 dark:bg-gray-600 rounded-full h-2 mr-2">
                    <div 
                      class="bg-green-600 h-2 rounded-full transition-all duration-300"
                      style="width: {member.memory}%"
                    ></div>
                  </div>
                  <span class="text-sm text-gray-900 dark:text-white">{member.memory.toFixed(0)}%</span>
                </div>
              </td>
              <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                {member.responseTime.toFixed(0)}ms
              </td>
              <td class="px-6 py-4 whitespace-nowrap text-sm font-medium">
                <button class="text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300 mr-3">
                  Monitor
                </button>
                <button class="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300">
                  Remove
                </button>
              </td>
            </tr>
          {/each}
        </tbody>
      </table>
    </div>
  </div>

  <!-- Scaling Events Timeline -->
  <div class="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
    <div class="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
      <h2 class="text-xl font-semibold text-gray-900 dark:text-white">Scaling Events Timeline</h2>
      <p class="text-sm text-gray-600 dark:text-gray-400 mt-1">
        Recent auto-scaling events and their impact on capacity and performance
      </p>
    </div>
    <div class="p-6">
      <div class="space-y-4">
        {#each scalingEvents as event}
          {@const EventIcon = getEventIcon(event.type)}
          <div class="flex items-center space-x-4 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
            <div class="flex-shrink-0">
              <div class="w-10 h-10 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center">
                <EventIcon class="h-5 w-5 text-blue-600 dark:text-blue-400" />
              </div>
            </div>
            <div class="flex-1">
              <div class="flex items-center justify-between">
                <h3 class="text-sm font-medium text-gray-900 dark:text-white">{event.reason}</h3>
                <span class="text-xs text-gray-500 dark:text-gray-400">{event.timestamp}</span>
              </div>
              <div class="flex items-center space-x-4 mt-1">
                <span class="text-sm text-gray-600 dark:text-gray-400">
                  {event.instances} instances
                </span>
                <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium {getEventColor(event.type)}">
                  {event.type.replace('_', ' ')}
                </span>
              </div>
            </div>
          </div>
        {/each}
      </div>
    </div>
  </div>

  <!-- Scaling Policies -->
  <div class="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
    <div class="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
      <h2 class="text-xl font-semibold text-gray-900 dark:text-white">Scaling Policies</h2>
      <p class="text-sm text-gray-600 dark:text-gray-400 mt-1">
        Automated scaling rules based on performance metrics
      </p>
    </div>
    <div class="p-6">
      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
        {#each scalingPolicies as policy}
          <div class="p-4 border border-gray-200 dark:border-gray-600 rounded-lg">
            <div class="flex items-center justify-between mb-2">
              <h3 class="text-sm font-medium text-gray-900 dark:text-white">{policy.name}</h3>
              <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                {policy.status}
              </span>
            </div>
            <div class="space-y-2 text-sm text-gray-600 dark:text-gray-400">
              <div class="flex justify-between">
                <span>Metric:</span>
                <span class="font-medium">{policy.metric}</span>
              </div>
              <div class="flex justify-between">
                <span>Threshold:</span>
                <span class="font-medium">{policy.threshold}%</span>
              </div>
              <div class="flex justify-between">
                <span>Action:</span>
                <span class="font-medium">{policy.action}</span>
              </div>
              <div class="flex justify-between">
                <span>Cooldown:</span>
                <span class="font-medium">{policy.cooldown}s</span>
              </div>
            </div>
          </div>
        {/each}
      </div>
    </div>
  </div>
</div>
