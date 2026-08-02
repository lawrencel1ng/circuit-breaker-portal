<script lang="ts">
  import { fade } from 'svelte/transition';
  import type { Lane } from '$lib/types';
  import { notificationStore } from '$lib/stores/notificationStore';

  export let lanes: Lane[];

  // Layout constants
  const WIDTH = 800;
  const HEIGHT = 600;
  const CLIENT_X = WIDTH / 2;
  const CLIENT_Y = 50;
  const GSLB_X = WIDTH / 2;
  const GSLB_Y = 150;
  const LANE_START_Y = 300;
  const APP_START_Y = 500;

  function getLaneX(index: number, total: number) {
    const sectionWidth = WIDTH / total;
    return sectionWidth * index + sectionWidth / 2;
  }

  function getStatusColor(status: string) {
    switch (status) {
      case 'healthy': return '#10b981'; // success-500
      case 'degraded': return '#f59e0b'; // warning-500
      case 'down': return '#ef4444'; // danger-500
      default: return '#9ca3af'; // gray-400
    }
  }

  function handleNodeClick(nodeType: string, id: string) {
    notificationStore.add({
      type: 'info',
      title: 'Drill Down',
      message: `Navigating to metrics for ${nodeType}: ${id}`
    });
    // Future: goto(`/metrics/${id}`);
  }

  $: totalLanes = lanes.length;
</script>

<div class="w-full bg-white dark:bg-gray-800 rounded-xl shadow-lg p-4 overflow-hidden">
  <div class="flex justify-between items-center mb-4 border-b border-gray-100 dark:border-gray-700 pb-2">
    <h3 class="text-lg font-semibold text-gray-900 dark:text-white">Real-Time Traffic Topology</h3>
    <div class="flex items-center space-x-4 text-sm">
      <div class="flex items-center"><span class="w-3 h-3 rounded-full bg-emerald-500 mr-2"></span>Healthy</div>
      <div class="flex items-center"><span class="w-3 h-3 rounded-full bg-amber-500 mr-2"></span>Degraded</div>
      <div class="flex items-center"><span class="w-3 h-3 rounded-full bg-red-500 mr-2"></span>Down</div>
    </div>
  </div>

  <svg viewBox="0 0 {WIDTH} {HEIGHT}" class="w-full h-auto max-h-[600px]">
    <defs>
      <marker id="arrowhead" markerWidth="10" markerHeight="7" refX="9" refY="3.5" orient="auto">
        <polygon points="0 0, 10 3.5, 0 7" fill="#9ca3af" />
      </marker>
      <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
        <feGaussianBlur stdDeviation="3" result="blur" />
        <feComposite in="SourceGraphic" in2="blur" operator="over" />
      </filter>
    </defs>

    <!-- 1. Clients Node -->
    <g transform="translate({CLIENT_X}, {CLIENT_Y})" class="cursor-pointer" role="button" tabindex="0" on:click={() => handleNodeClick('Source', 'Clients')} on:keypress={(e) => e.key === 'Enter' && handleNodeClick('Source', 'Clients')}>
      <circle r="30" fill="#3b82f6" fill-opacity="0.1" stroke="#3b82f6" stroke-width="2" />
      <text y="5" text-anchor="middle" class="text-xs fill-gray-700 dark:fill-gray-200 font-bold pointer-events-none">Clients</text>
      <path d="M-10,-10 L10,10 M10,-10 L-10,10" stroke="transparent" /> <!-- Hit area fix -->
    </g>

    <!-- Path: Clients -> GSLB -->
    <path d="M{CLIENT_X},{CLIENT_Y + 30} L{GSLB_X},{GSLB_Y - 30}" 
          stroke="#e5e7eb" stroke-width="2" marker-end="url(#arrowhead)" />
    
    <!-- Traffic Dots: Clients -> GSLB -->
    <circle r="4" fill="#3b82f6">
      <animateMotion dur="2s" repeatCount="indefinite" path="M{CLIENT_X},{CLIENT_Y + 30} L{GSLB_X},{GSLB_Y - 30}" />
    </circle>
    <circle r="4" fill="#3b82f6">
      <animateMotion dur="2s" begin="1s" repeatCount="indefinite" path="M{CLIENT_X},{CLIENT_Y + 30} L{GSLB_X},{GSLB_Y - 30}" />
    </circle>


    <!-- 2. GSLB Node -->
    <g transform="translate({GSLB_X}, {GSLB_Y})" class="cursor-pointer" role="button" tabindex="0" on:click={() => handleNodeClick('Component', 'GSLB')} on:keypress={(e) => e.key === 'Enter' && handleNodeClick('Component', 'GSLB')}>
      <rect x="-60" y="-25" width="120" height="50" rx="8" 
            fill="white" stroke="#6366f1" stroke-width="2" 
            class="dark:fill-gray-800" />
      <text y="5" text-anchor="middle" class="text-sm fill-gray-900 dark:fill-white font-medium pointer-events-none">Global LB</text>
    </g>

    <!-- Lanes -->
    {#each lanes as lane, i}
      {@const laneX = getLaneX(i, totalLanes)}
      {@const color = getStatusColor(lane.healthStatus)}
      {@const traffic = lane.trafficDistribution}
      
      <!-- Path: GSLB -> Edge Lane -->
      <path id="path-gslb-lane-{i}" 
            d="M{GSLB_X},{GSLB_Y + 25} C{GSLB_X},{GSLB_Y + 100} {laneX},{LANE_START_Y - 100} {laneX},{LANE_START_Y - 30}" 
            stroke="#e5e7eb" stroke-width="2" fill="none" />

      <!-- Traffic Dots: GSLB -> Edge Lane (Density based on traffic) -->
      {#if traffic > 0}
        <circle r="3" fill={color}>
          <animateMotion dur="{3000 / (traffic/20 + 1)}ms" repeatCount="indefinite">
            <mpath href="#path-gslb-lane-{i}"/>
          </animateMotion>
        </circle>
        {#if traffic > 30}
          <circle r="3" fill={color}>
            <animateMotion dur="{3000 / (traffic/20 + 1)}ms" begin="1s" repeatCount="indefinite">
              <mpath href="#path-gslb-lane-{i}"/>
            </animateMotion>
          </circle>
        {/if}
      {/if}

      <!-- 3. Edge Lane Node -->
      <g transform="translate({laneX}, {LANE_START_Y})" class="cursor-pointer hover:opacity-80 transition-opacity" role="button" tabindex="0"
         on:click={() => handleNodeClick('Lane', lane.name)} on:keypress={(e) => e.key === 'Enter' && handleNodeClick('Lane', lane.name)}>
        <rect x="-50" y="-30" width="100" height="60" rx="6" 
              fill={color} fill-opacity="0.1" stroke={color} stroke-width="2" />
        <text y="-5" text-anchor="middle" class="text-xs fill-gray-900 dark:fill-white font-bold pointer-events-none">{lane.name}</text>
        <text y="15" text-anchor="middle" class="text-[10px] fill-gray-600 dark:fill-gray-300 pointer-events-none">
          {traffic.toFixed(0)}% Traffic
        </text>
      </g>

      <!-- Path: Edge -> Enterprise -->
      <path id="path-edge-ent-{i}"
            d="M{laneX},{LANE_START_Y + 30} L{laneX},{APP_START_Y - 30}" 
            stroke="#e5e7eb" stroke-width="2" stroke-dasharray="4" />

      <!-- 4. Enterprise App Node -->
      <g transform="translate({laneX}, {APP_START_Y})" class="cursor-pointer" role="button" tabindex="0"
         on:click={() => handleNodeClick('App', 'Backend Pool')} on:keypress={(e) => e.key === 'Enter' && handleNodeClick('App', 'Backend Pool')}>
        <circle r="25" fill="white" stroke={color} stroke-width="2" class="dark:fill-gray-800" />
        <text y="4" text-anchor="middle" class="text-[10px] fill-gray-700 dark:fill-gray-200 pointer-events-none">App Pool</text>
      </g>

    {/each}
  </svg>
</div>
