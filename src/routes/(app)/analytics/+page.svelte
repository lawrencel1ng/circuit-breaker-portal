<script lang="ts">
  import { onMount } from 'svelte';
  import { BarChart, TrendingUp, Activity, Server, Globe, Zap, AlertTriangle } from 'lucide-svelte';

  let performanceMetrics = {
    avgResponseTime: 145,
    uptime: 99.8,
    throughput: 1250,
    errorRate: 0.2
  };

  let recommendations = [
    { id: 'rec1', type: 'performance', priority: 'high', title: 'Consolidate Load Balancers', description: 'Merge 3 underutilized VIPs to improve management efficiency', effort: 'low' },
    { id: 'rec2', type: 'performance', priority: 'medium', title: 'Enable Compression', description: 'Enable gzip compression to reduce bandwidth by 40%', effort: 'low' },
    { id: 'rec3', type: 'security', priority: 'high', title: 'Update SSL Certificates', description: 'Upgrade to newer TLS versions for better security', effort: 'medium' },
    { id: 'rec4', type: 'performance', priority: 'medium', title: 'Optimize WAF Policies', description: 'Review and streamline WAF rules for better performance', effort: 'low' },
    { id: 'rec5', type: 'performance', priority: 'low', title: 'Enable HTTP/2', description: 'Upgrade to HTTP/2 for better performance', effort: 'high' }
  ];

  let utilizationData = [
    { time: '00:00', cpu: 45, memory: 60, network: 30 },
    { time: '04:00', cpu: 35, memory: 55, network: 25 },
    { time: '08:00', cpu: 75, memory: 80, network: 85 },
    { time: '12:00', cpu: 85, memory: 90, network: 95 },
    { time: '16:00', cpu: 80, memory: 85, network: 90 },
    { time: '20:00', cpu: 70, memory: 75, network: 80 },
    { time: '24:00', cpu: 50, memory: 65, network: 40 }
  ];

  function getPriorityColor(priority: string) {
    switch (priority) {
      case 'high': return 'text-red-600 bg-red-100 dark:bg-red-900 dark:text-red-200';
      case 'medium': return 'text-yellow-600 bg-yellow-100 dark:bg-yellow-900 dark:text-yellow-200';
      case 'low': return 'text-green-600 bg-green-100 dark:bg-green-900 dark:text-green-200';
      default: return 'text-gray-600 bg-gray-100 dark:bg-gray-900 dark:text-gray-200';
    }
  }

  function getTypeIcon(type: string) {
    switch (type) {
      case 'performance': return TrendingUp;
      case 'security': return AlertTriangle;
      default: return Activity;
    }
  }

  function getEffortColor(effort: string) {
    switch (effort) {
      case 'low': return 'text-green-600 bg-green-100 dark:bg-green-900 dark:text-green-200';
      case 'medium': return 'text-yellow-600 bg-yellow-100 dark:bg-yellow-900 dark:text-yellow-200';
      case 'high': return 'text-red-600 bg-red-100 dark:bg-red-900 dark:text-red-200';
      default: return 'text-gray-600 bg-gray-100 dark:bg-gray-900 dark:text-gray-200';
    }
  }

  onMount(() => {
    // Simulate real-time updates
    const interval = setInterval(() => {
      // Update performance metrics
      performanceMetrics.avgResponseTime += (Math.random() - 0.5) * 10;
      performanceMetrics.throughput += (Math.random() - 0.5) * 50;
      performanceMetrics.errorRate += (Math.random() - 0.5) * 0.1;
      
      // Update utilization data
      utilizationData = utilizationData.map(item => ({
        ...item,
        cpu: Math.max(0, Math.min(100, item.cpu + (Math.random() - 0.5) * 10)),
        memory: Math.max(0, Math.min(100, item.memory + (Math.random() - 0.5) * 5)),
        network: Math.max(0, Math.min(100, item.network + (Math.random() - 0.5) * 8))
      }));
    }, 5000);

    return () => clearInterval(interval);
  });
</script>

<svelte:head>
  <title>Analytics & Optimization - F5 Control Center</title>
</svelte:head>

<div class="space-y-6">
  <!-- Header -->
  <div class="bg-gradient-to-r from-green-600 to-blue-600 rounded-xl p-6 text-white">
    <div class="flex items-center justify-between">
      <div>
        <div class="flex items-center space-x-3 mb-2">
          <h1 class="text-3xl font-bold">Analytics & Optimization</h1>
          <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
            Future Roadmap
          </span>
        </div>
        <p class="text-green-100">F5 performance analytics and insights</p>
        <p class="text-green-200 text-sm mt-2">
          <strong>Requirements:</strong> F5 Cloud Edition, external monitoring tools, AI/ML integration
        </p>
      </div>
      <div class="flex items-center space-x-6">
        <div class="text-center">
          <div class="text-2xl font-bold">{performanceMetrics.avgResponseTime.toFixed(0)}ms</div>
          <div class="text-sm text-green-100">Avg Response</div>
        </div>
        <div class="text-center">
          <div class="text-2xl font-bold">{performanceMetrics.uptime}%</div>
          <div class="text-sm text-green-100">Uptime</div>
        </div>
        <div class="text-center">
          <div class="text-2xl font-bold">{performanceMetrics.throughput.toFixed(0)}</div>
          <div class="text-sm text-green-100">Throughput</div>
        </div>
      </div>
    </div>
  </div>

  <!-- Key Metrics -->
  <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
    <div class="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
      <div class="flex items-center justify-between">
        <div>
          <p class="text-sm font-medium text-gray-600 dark:text-gray-400">Response Time</p>
          <p class="text-3xl font-bold text-blue-600 dark:text-blue-400">{performanceMetrics.avgResponseTime.toFixed(0)}ms</p>
        </div>
        <div class="w-12 h-12 bg-blue-100 dark:bg-blue-900 rounded-lg flex items-center justify-center">
          <Activity class="h-6 w-6 text-blue-600 dark:text-blue-400" />
        </div>
      </div>
    </div>

    <div class="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
      <div class="flex items-center justify-between">
        <div>
          <p class="text-sm font-medium text-gray-600 dark:text-gray-400">Uptime</p>
          <p class="text-3xl font-bold text-green-600 dark:text-green-400">{performanceMetrics.uptime}%</p>
        </div>
        <div class="w-12 h-12 bg-green-100 dark:bg-green-900 rounded-lg flex items-center justify-center">
          <TrendingUp class="h-6 w-6 text-green-600 dark:text-green-400" />
        </div>
      </div>
    </div>

    <div class="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
      <div class="flex items-center justify-between">
        <div>
          <p class="text-sm font-medium text-gray-600 dark:text-gray-400">Throughput</p>
          <p class="text-3xl font-bold text-purple-600 dark:text-purple-400">{performanceMetrics.throughput.toFixed(0)}</p>
        </div>
        <div class="w-12 h-12 bg-purple-100 dark:bg-purple-900 rounded-lg flex items-center justify-center">
          <Globe class="h-6 w-6 text-purple-600 dark:text-purple-400" />
        </div>
      </div>
    </div>

    <div class="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
      <div class="flex items-center justify-between">
        <div>
          <p class="text-sm font-medium text-gray-600 dark:text-gray-400">Error Rate</p>
          <p class="text-3xl font-bold text-orange-600 dark:text-orange-400">{performanceMetrics.errorRate.toFixed(1)}%</p>
        </div>
        <div class="w-12 h-12 bg-orange-100 dark:bg-orange-900 rounded-lg flex items-center justify-center">
          <AlertTriangle class="h-6 w-6 text-orange-600 dark:text-orange-400" />
        </div>
      </div>
    </div>
  </div>

  <!-- Resource Utilization -->
  <div class="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
    <div class="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
      <h2 class="text-xl font-semibold text-gray-900 dark:text-white">Resource Utilization</h2>
      <p class="text-sm text-gray-600 dark:text-gray-400 mt-1">
        24-hour resource usage patterns
      </p>
    </div>
    <div class="p-6">
      <div class="space-y-4">
        {#each utilizationData as dataPoint}
          <div class="flex items-center space-x-4">
            <div class="w-16 text-sm text-gray-500 dark:text-gray-400">
              {dataPoint.time}
            </div>
            <div class="flex-1 space-y-2">
              <div class="flex items-center space-x-2">
                <span class="text-xs text-gray-500 dark:text-gray-400 w-12">CPU</span>
                <div class="flex-1 bg-gray-200 dark:bg-gray-600 rounded-full h-2">
                  <div 
                    class="bg-blue-600 h-2 rounded-full transition-all duration-300"
                    style="width: {dataPoint.cpu}%"
                  ></div>
                </div>
                <span class="text-xs text-gray-900 dark:text-white w-8">{dataPoint.cpu.toFixed(0)}%</span>
              </div>
              <div class="flex items-center space-x-2">
                <span class="text-xs text-gray-500 dark:text-gray-400 w-12">Memory</span>
                <div class="flex-1 bg-gray-200 dark:bg-gray-600 rounded-full h-2">
                  <div 
                    class="bg-green-600 h-2 rounded-full transition-all duration-300"
                    style="width: {dataPoint.memory}%"
                  ></div>
                </div>
                <span class="text-xs text-gray-900 dark:text-white w-8">{dataPoint.memory.toFixed(0)}%</span>
              </div>
              <div class="flex items-center space-x-2">
                <span class="text-xs text-gray-500 dark:text-gray-400 w-12">Network</span>
                <div class="flex-1 bg-gray-200 dark:bg-gray-600 rounded-full h-2">
                  <div 
                    class="bg-purple-600 h-2 rounded-full transition-all duration-300"
                    style="width: {dataPoint.network}%"
                  ></div>
                </div>
                <span class="text-xs text-gray-900 dark:text-white w-8">{dataPoint.network.toFixed(0)}%</span>
              </div>
            </div>
          </div>
        {/each}
      </div>
    </div>
  </div>

  <!-- Optimization Recommendations -->
  <div class="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
    <div class="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
      <h2 class="text-xl font-semibold text-gray-900 dark:text-white">Optimization Recommendations</h2>
      <p class="text-sm text-gray-600 dark:text-gray-400 mt-1">
        AI-powered suggestions to improve performance and security
      </p>
    </div>
    <div class="p-6">
      <div class="space-y-4">
        {#each recommendations as rec}
          {@const TypeIcon = getTypeIcon(rec.type)}
          <div class="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
            <div class="flex items-center space-x-4">
              <div class="flex-shrink-0">
                <div class="w-10 h-10 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center">
                  <TypeIcon class="h-5 w-5 text-blue-600 dark:text-blue-400" />
                </div>
              </div>
              <div>
                <h3 class="text-sm font-medium text-gray-900 dark:text-white">{rec.title}</h3>
                <p class="text-sm text-gray-500 dark:text-gray-400">{rec.description}</p>
              </div>
            </div>
            <div class="flex items-center space-x-3">
              <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium {getPriorityColor(rec.priority)}">
                {rec.priority}
              </span>
              <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium {getEffortColor(rec.effort)}">
                {rec.effort} effort
              </span>
              <button class="text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300">
                <Zap class="h-4 w-4" />
              </button>
            </div>
          </div>
        {/each}
      </div>
    </div>
  </div>
</div>
