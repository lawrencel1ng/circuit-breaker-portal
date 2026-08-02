<script lang="ts">
  import { onMount } from 'svelte';
  import { Chart, registerables } from 'chart.js';
  import 'chartjs-adapter-date-fns';
  import type { CircuitBreakerConfig } from '$lib/types';

  Chart.register(...registerables);

  // Config prop is kept for API compatibility but not currently used
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const _config = $$props.config as CircuitBreakerConfig | undefined;

  let rpsChartCanvas: HTMLCanvasElement;
  let errorChartCanvas: HTMLCanvasElement;
  let protocolChartCanvas: HTMLCanvasElement;

  let rpsChart: Chart;
  let errorChart: Chart;
  let protocolChart: Chart;

  // Mock data generation
  function generateTimeSeriesData(points: number, min: number, max: number) {
    const data = [];
    const now = new Date();
    for (let i = points; i > 0; i--) {
      data.push({
        x: new Date(now.getTime() - i * 5 * 60 * 1000), // Every 5 minutes
        y: Math.floor(Math.random() * (max - min + 1)) + min
      });
    }
    return data;
  }

  function initCharts() {
    // RPS Chart
    if (rpsChartCanvas) {
      const rpsData = generateTimeSeriesData(24, 800, 2500);
      rpsChart = new Chart(rpsChartCanvas, {
        type: 'line',
        data: {
          datasets: [{
            label: 'Requests per Second',
            data: rpsData as any,
            borderColor: '#3b82f6',
            backgroundColor: 'rgba(59, 130, 246, 0.1)',
            fill: true,
            tension: 0.4
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: { display: false },
            tooltip: { mode: 'index', intersect: false }
          },
          scales: {
            x: {
              type: 'time',
              time: { unit: 'hour' },
              grid: { display: false }
            },
            y: {
              beginAtZero: true,
              grid: { color: 'rgba(0, 0, 0, 0.05)' }
            }
          }
        }
      });
    }

    // Error Rate Chart
    if (errorChartCanvas) {
      const errorData = generateTimeSeriesData(24, 0, 5); // 0-5% errors
      errorChart = new Chart(errorChartCanvas, {
        type: 'line',
        data: {
          datasets: [{
            label: 'Error Rate (%)',
            data: errorData as any,
            borderColor: '#ef4444',
            backgroundColor: 'rgba(239, 68, 68, 0.1)',
            fill: true,
            tension: 0.4
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: { display: false }
          },
          scales: {
            x: {
              type: 'time',
              time: { unit: 'hour' },
              grid: { display: false }
            },
            y: {
              beginAtZero: true,
              grid: { color: 'rgba(0, 0, 0, 0.05)' }
            }
          }
        }
      });
    }

    // Protocol Distribution Chart
    if (protocolChartCanvas) {
      protocolChart = new Chart(protocolChartCanvas, {
        type: 'doughnut',
        data: {
          labels: ['HTTPS (TLS 1.3)', 'HTTPS (TLS 1.2)', 'HTTP'],
          datasets: [{
            data: [65, 30, 5],
            backgroundColor: ['#10b981', '#3b82f6', '#f59e0b'],
            borderWidth: 0
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: { position: 'right' }
          },
          cutout: '70%'
        }
      });
    }
  }

  onMount(() => {
    initCharts();
    return () => {
      if (rpsChart) rpsChart.destroy();
      if (errorChart) errorChart.destroy();
      if (protocolChart) protocolChart.destroy();
    };
  });
</script>

<div class="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
  <!-- RPS Chart -->
  <div class="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
    <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-4">Requests / Second</h3>
    <div class="h-64">
      <canvas bind:this={rpsChartCanvas}></canvas>
    </div>
  </div>

  <!-- Error Rate Chart -->
  <div class="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
    <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-4">Error Rate (24h)</h3>
    <div class="h-64">
      <canvas bind:this={errorChartCanvas}></canvas>
    </div>
  </div>

  <!-- Protocol Distribution -->
  <div class="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
    <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-4">Protocol Distribution</h3>
    <div class="h-64">
      <canvas bind:this={protocolChartCanvas}></canvas>
    </div>
  </div>
</div>
