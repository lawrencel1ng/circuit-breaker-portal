<script lang="ts">
  import { Brain, TrendingUp, AlertTriangle, Activity, Bot, LineChart } from 'lucide-svelte';
  import TutorialTooltip from '$lib/components/TutorialTooltip.svelte';
  import { featureContent } from '$lib/data/featureContent';

  const content = featureContent['ai-analytics'];

  const anomalies = [
    { type: 'Traffic Spike', severity: 'medium', detected: '2 min ago', description: 'Unusual 300% increase in API calls' },
    { type: 'Latency Anomaly', severity: 'high', detected: '5 min ago', description: 'Response time increased from 50ms to 500ms' },
    { type: 'Bot Activity', severity: 'low', detected: '12 min ago', description: 'Pattern suggests credential stuffing attempt' }
  ];

  const predictions = [
    { metric: 'Traffic Volume', prediction: 'Increase 40%', confidence: 92, timeframe: 'Next 24h' },
    { metric: 'SSL Handshakes', prediction: 'Peak at 8PM', confidence: 87, timeframe: 'Today' },
    { metric: 'Error Rate', prediction: 'Stable', confidence: 95, timeframe: 'Next week' }
  ];
</script>

<svelte:head>
  <title>AI Analytics - F5 Automation Control Center</title>
</svelte:head>

<div class="space-y-6">
  <div class="flex items-center justify-between">
    <div>
      <div class="flex items-center space-x-3">
        <h1 class="text-3xl font-bold text-gray-900 dark:text-white">AI-Driven Analytics</h1>
        <TutorialTooltip
          title={content.title}
          description={content.description}
          problemSolved={content.problemSolved}
          benefits={content.benefits}
          variant="tip"
        />
      </div>
      <p class="text-gray-500 dark:text-gray-400 mt-1">
        Machine learning-powered traffic analysis and predictive insights
      </p>
    </div>
  </div>

  <!-- Value Banner -->
  <div class="bg-gradient-to-r from-violet-50 to-purple-50 dark:from-violet-900/20 dark:to-purple-900/20 border border-violet-200 dark:border-violet-800 rounded-lg p-4">
    <div class="flex items-start space-x-3">
      <div class="p-2 bg-violet-100 dark:bg-violet-800 rounded-lg">
        <Brain class="h-5 w-5 text-violet-600 dark:text-violet-300" />
      </div>
      <div>
        <h3 class="font-semibold text-violet-900 dark:text-violet-300">Why This Matters</h3>
        <p class="text-sm text-violet-800 dark:text-violet-400 mt-1">
          {content.businessValue} AI analytics reduce alert fatigue by 80% and detect 
          threats <strong>15 minutes faster</strong> than threshold-based alerting.
        </p>
      </div>
    </div>
  </div>

  <!-- Anomaly Detection -->
  <div class="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
    <div class="flex items-center space-x-2 mb-4">
      <AlertTriangle class="h-5 w-5 text-amber-500" />
      <h2 class="text-lg font-semibold text-gray-900 dark:text-white">Detected Anomalies</h2>
    </div>
    <div class="space-y-3">
      {#each anomalies as anomaly}
        <div class="flex items-center justify-between p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
          <div class="flex items-center space-x-3">
            <div class="w-2 h-2 rounded-full 
              {anomaly.severity === 'high' ? 'bg-red-500' : 
               anomaly.severity === 'medium' ? 'bg-amber-500' : 'bg-blue-500'}"></div>
            <div>
              <p class="font-medium text-gray-900 dark:text-white">{anomaly.type}</p>
              <p class="text-sm text-gray-500">{anomaly.description}</p>
            </div>
          </div>
          <span class="text-sm text-gray-500">{anomaly.detected}</span>
        </div>
      {/each}
    </div>
  </div>

  <!-- Predictions -->
  <div class="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
    <div class="flex items-center space-x-2 mb-4">
      <LineChart class="h-5 w-5 text-indigo-500" />
      <h2 class="text-lg font-semibold text-gray-900 dark:text-white">AI Predictions</h2>
    </div>
    <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
      {#each predictions as pred}
        <div class="p-4 bg-gray-50 dark:bg-gray-750 rounded-lg">
          <p class="text-sm text-gray-500 dark:text-gray-400">{pred.metric}</p>
          <p class="text-xl font-bold text-gray-900 dark:text-white mt-1">{pred.prediction}</p>
          <div class="flex items-center justify-between mt-2">
            <span class="text-xs text-gray-500">{pred.timeframe}</span>
            <span class="text-xs font-medium text-green-600">{pred.confidence}% confidence</span>
          </div>
        </div>
      {/each}
    </div>
  </div>

  <!-- ML Insights -->
  <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
    <div class="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4">
      <div class="flex items-center space-x-2 mb-3">
        <Bot class="h-5 w-5 text-purple-500" />
        <h3 class="font-medium text-gray-900 dark:text-white">Bot Detection</h3>
      </div>
      <p class="text-sm text-gray-600 dark:text-gray-400">
        AI behavioral analysis distinguishing good bots (search engines) from malicious bots 
        (credential stuffing, scraping) with 99.2% accuracy.
      </p>
    </div>
    <div class="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4">
      <div class="flex items-center space-x-2 mb-3">
        <TrendingUp class="h-5 w-5 text-green-500" />
        <h3 class="font-medium text-gray-900 dark:text-white">Capacity Forecasting</h3>
      </div>
      <p class="text-sm text-gray-600 dark:text-gray-400">
        Predictive models analyze traffic patterns to forecast capacity needs 30 days in advance, 
        enabling proactive scaling before performance degrades.
      </p>
    </div>
  </div>

  <!-- Use Cases -->
  <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
    {#each content.useCases as useCase, i}
      <div class="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4">
        <h3 class="font-medium text-gray-900 dark:text-white mb-2">Use Case {i + 1}</h3>
        <p class="text-sm text-gray-600 dark:text-gray-400">{useCase}</p>
      </div>
    {/each}
  </div>
</div>
