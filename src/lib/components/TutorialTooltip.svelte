<script lang="ts">
  import { fade, fly } from 'svelte/transition';
  import { Info, X, Lightbulb, Target, HelpCircle } from 'lucide-svelte';

  export let title: string;
  export let description: string;
  export let benefits: string[] = [];
  export let problemSolved: string = '';
  export let position: 'top' | 'bottom' | 'left' | 'right' = 'right';
  export let variant: 'info' | 'tip' | 'warning' = 'info';

  let isOpen = false;
  let isDismissed = false;

  const variants = {
    info: {
      bg: 'bg-blue-50 dark:bg-blue-900/20',
      border: 'border-blue-200 dark:border-blue-800',
      icon: 'text-blue-500',
      iconComponent: Info
    },
    tip: {
      bg: 'bg-amber-50 dark:bg-amber-900/20',
      border: 'border-amber-200 dark:border-amber-800',
      icon: 'text-amber-500',
      iconComponent: Lightbulb
    },
    warning: {
      bg: 'bg-orange-50 dark:bg-orange-900/20',
      border: 'border-orange-200 dark:border-orange-800',
      icon: 'text-orange-500',
      iconComponent: HelpCircle
    }
  };

  $: variantStyle = variants[variant];
  $: IconComponent = variantStyle.iconComponent;

  const positionClasses = {
    top: 'bottom-full left-1/2 -translate-x-1/2 mb-2',
    bottom: 'top-full left-1/2 -translate-x-1/2 mt-2',
    left: 'right-full top-1/2 -translate-y-1/2 mr-2',
    right: 'left-full top-1/2 -translate-y-1/2 ml-2'
  };

  const arrowClasses = {
    top: 'top-full left-1/2 -translate-x-1/2 -mt-1 border-l-transparent border-r-transparent border-b-transparent',
    bottom: 'bottom-full left-1/2 -translate-x-1/2 -mb-1 border-l-transparent border-r-transparent border-t-transparent',
    left: 'left-full top-1/2 -translate-y-1/2 -ml-1 border-t-transparent border-b-transparent border-r-transparent',
    right: 'right-full top-1/2 -translate-y-1/2 -mr-1 border-t-transparent border-b-transparent border-l-transparent'
  };
</script>

{#if !isDismissed}
  <div class="relative inline-block">
    <!-- Trigger Button -->
    <button
      class="p-1.5 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
      on:click={() => isOpen = !isOpen}
      on:mouseenter={() => isOpen = true}
      title="Learn more about this feature"
    >
      <HelpCircle class="h-5 w-5 text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300" />
    </button>

    <!-- Tooltip Content -->
    {#if isOpen}
      <div
        class="absolute z-50 w-80 {positionClasses[position]} {variantStyle.bg} {variantStyle.border} border rounded-lg shadow-lg p-4"
        transition:fly={{ y: 10, duration: 200 }}
        on:mouseleave={() => isOpen = false}
      >
        <!-- Arrow -->
        <div class="absolute w-3 h-3 {variantStyle.bg} {variantStyle.border} transform rotate-45 {arrowClasses[position]}"></div>
        
        <!-- Header -->
        <div class="flex items-start justify-between mb-3">
          <div class="flex items-center space-x-2">
            <IconComponent class="h-5 w-5 {variantStyle.icon}" />
            <h4 class="font-semibold text-gray-900 dark:text-white">{title}</h4>
          </div>
          <button
            on:click={() => { isOpen = false; isDismissed = true; }}
            class="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
          >
            <X class="h-4 w-4" />
          </button>
        </div>

        <!-- Description -->
        <p class="text-sm text-gray-700 dark:text-gray-300 mb-3">{description}</p>

        <!-- Problem Solved -->
        {#if problemSolved}
          <div class="mb-3 p-2 bg-white/50 dark:bg-gray-800/50 rounded">
            <div class="flex items-center space-x-1 mb-1">
              <Target class="h-3.5 w-3.5 text-indigo-500" />
              <span class="text-xs font-medium text-indigo-700 dark:text-indigo-300">Problem Solved</span>
            </div>
            <p class="text-xs text-gray-600 dark:text-gray-400">{problemSolved}</p>
          </div>
        {/if}

        <!-- Benefits -->
        {#if benefits.length > 0}
          <div>
            <div class="flex items-center space-x-1 mb-2">
              <Lightbulb class="h-3.5 w-3.5 text-amber-500" />
              <span class="text-xs font-medium text-gray-700 dark:text-gray-300">Key Benefits</span>
            </div>
            <ul class="space-y-1">
              {#each benefits as benefit}
                <li class="text-xs text-gray-600 dark:text-gray-400 flex items-start">
                  <span class="text-green-500 mr-1.5 mt-0.5">✓</span>
                  {benefit}
                </li>
              {/each}
            </ul>
          </div>
        {/if}
      </div>
    {/if}
  </div>
{/if}
