<script lang="ts">
  import { onMount, onDestroy } from 'svelte';
  import { page } from '$app/stores';
  import { themeStore } from '$lib/stores/themeStore';
  import { sidebarStore } from '$lib/stores/sidebarStore';
  import { Moon, Sun, Settings, Activity, Server, Globe, Shield, BarChart, Zap, TrendingUp, FileText, ChevronDown, ChevronRight, Menu, X, User, Key, Info, Clipboard, Terminal, GitCompare, Database, Brain } from 'lucide-svelte';

  // These props are provided by parent for external reference
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const _user = $$props.user as any;
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const _onLogout = $$props.onLogout as () => void;

  let navElement: HTMLElement;

  // Subscribe to sidebar store - true = collapsed, false = expanded
  $: isCollapsed = $sidebarStore;

  function toggleCollapse() {
    sidebarStore.toggle();
  }

  function handleClickOutside(event: MouseEvent) {
    // Only handle clicks when menu is expanded
    if (isCollapsed) return;
    
    // Check if click is outside the navigation
    if (navElement && !navElement.contains(event.target as Node)) {
      sidebarStore.collapse();
    }
  }

  let openDropdowns: Record<string, boolean> = {
    onPremises: false,
    cloud: false,
    aiServices: false,
    security: false,
    analytics: false,
    settings: false
  };

  const navigation: {
    name: string;
    href?: string;
    icon: any;
    type: 'single' | 'dropdown';
    key?: string;
    items?: { name: string; href: string; icon: any }[];
  }[] = [
    { 
      name: 'Dashboard', 
      href: '/', 
      icon: Activity,
      type: 'single'
    },
    { 
      name: 'On-Premises', 
      icon: Server,
      type: 'dropdown',
      key: 'onPremises',
      items: [
        { name: 'F5 Deployments', href: '/deployment-portal', icon: Server },
        { name: 'Blue/Green', href: '/blue-green', icon: Zap },
        { name: 'Circuit Breakers', href: '/control', icon: Settings },
        { name: 'Certificates', href: '/certificates', icon: FileText },
        { name: 'Secure Web Gateway', href: '/swg', icon: Globe },
        { name: 'Configuration Drift', href: '/configuration', icon: GitCompare }
      ]
    },
    { 
      name: 'Cloud Services', 
      icon: Globe,
      type: 'dropdown',
      key: 'cloud',
      items: [
        { name: 'Multi-Cloud', href: '/multi-cloud', icon: Globe },
        { name: 'Auto-Scaling', href: '/auto-scaling', icon: TrendingUp }
      ]
    },
    { 
      name: 'AI Services', 
      icon: Brain,
      type: 'dropdown',
      key: 'aiServices',
      items: [
        { name: 'AI Gateway (Calypso)', href: '/ai-gateway', icon: Brain },
        { name: 'LLM Security', href: '/ai-security', icon: Shield },
        { name: 'AI Analytics', href: '/ai-analytics', icon: BarChart }
      ]
    },
    {
      name: 'Automation',
      href: '/automation',
      icon: Zap,
      type: 'single'
    },
    { 
      name: 'Security', 
      href: '/security', 
      icon: Shield,
      type: 'single'
    },
    { 
      name: 'Analytics', 
      href: '/analytics', 
      icon: BarChart,
      type: 'single'
    },
    {
      name: 'Approvals',
      href: '/approvals',
      icon: Clipboard,
      type: 'single'
    },
    {
      name: 'System Logs',
      href: '/logs',
      icon: Terminal,
      type: 'single'
    },
    { 
      name: 'Settings', 
      icon: Settings,
      type: 'dropdown',
      key: 'settings',
      items: [
        { name: 'User Administration', href: '/settings/users', icon: User },
        { name: 'RBAC Access Control', href: '/settings/rbac', icon: Shield },
        { name: 'SAML Configuration', href: '/settings/saml', icon: Key },
        { name: 'Change Windows', href: '/settings/change-windows', icon: Clipboard },
        { name: 'Workflow Rules', href: '/settings/workflows', icon: Zap },
        { name: 'Alerts & Notifications', href: '/settings/alerts', icon: Activity },
        { name: 'System Settings', href: '/settings/system', icon: Settings },
        { name: 'Backup & DR', href: '/backup', icon: Database }
      ]
    },
    { 
      name: 'About', 
      href: '/about', 
      icon: Info,
      type: 'single'
    }
  ];

  function toggleDropdown(key: string) {
    if (openDropdowns[key]) {
      openDropdowns[key] = false;
    } else {
      // Close all others and open the clicked one
      Object.keys(openDropdowns).forEach(k => {
        openDropdowns[k] = (k === key);
      });
    }
  }

  function handleDropdownClick(key: string) {
    if (isCollapsed) {
      sidebarStore.expand();
      // Expand and ensure only the clicked one is open
      Object.keys(openDropdowns).forEach(k => {
        openDropdowns[k] = (k === key);
      });
    } else {
      toggleDropdown(key);
    }
  }

  // Auto-collapse dropdowns when sidebar is collapsed
  $: if (isCollapsed) {
    Object.keys(openDropdowns).forEach(k => {
      openDropdowns[k] = false;
    });
  }

  // Make this reactive to the page store
  // $: currentPath = $page.url.pathname;
  
  // Normalize path helper
  // function normalizePath(path: string): string {
  //   if (!path) return '';
  //   return path === '/' ? '/' : path.replace(/\/$/, '');
  // }
  
  function isCurrentPage(_href: string) {
    return false;
  }

  function isDropdownActive(items: any[]) {
    if (!items || !Array.isArray(items)) return false;
    return items.some(item => isCurrentPage(item.href));
  }
  
  // Compute active states reactively for all navigation items
  $: activeStates = navigation.map(item => {
    if (item.type === 'single' && item.href) {
      return isCurrentPage(item.href);
    } else if (item.type === 'dropdown' && item.items) {
      return isDropdownActive(item.items);
    }
    return false;
  });
  
  // Auto-open dropdown if a child page is active (reacts to page changes)
  $: {
    navigation.forEach((item, index) => {
      if (item.type === 'dropdown' && item.key && activeStates[index]) {
        openDropdowns[item.key] = true;
      }
    });
  }

  onMount(() => {
    if (typeof window !== 'undefined') {
      // Use setTimeout to delay the event listener attachment
      // This prevents the initial click that opened the menu from immediately closing it
      setTimeout(() => {
        window.addEventListener('click', handleClickOutside);
      }, 0);
    }
    
    // Auto-open dropdowns for active child pages on mount
    navigation.forEach(item => {
      if (item.type === 'dropdown' && item.items && item.key && isDropdownActive(item.items)) {
        openDropdowns[item.key] = true;
      }
    });
  });

  onDestroy(() => {
    if (typeof window !== 'undefined') {
      window.removeEventListener('click', handleClickOutside);
    }
  });
</script>

<nav 
  bind:this={navElement}
  class="{isCollapsed ? 'w-16' : 'w-72'} h-full bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 flex flex-col shadow-lg z-10 transition-all duration-300 relative"
>
  <!-- Collapse Toggle Button - Removed as per new design using Menu icon -->


  <!-- Logo Area -->
  <div class="h-20 flex items-center justify-center border-b border-gray-200 dark:border-gray-700 overflow-hidden relative">
    {#if isCollapsed}
      <button 
        on:click={(e: MouseEvent) => {
          e.stopPropagation();
          toggleCollapse();
        }}
        class="flex items-center justify-center p-2 rounded-lg text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors focus:outline-none"
        title="Expand Menu"
      >
        <Menu class="h-6 w-6" />
      </button>
    {:else}
      <div class="flex items-center justify-between w-full px-6">
        <img 
          src="/ntt-data-logo.png" 
          alt="NTT Data Logo" 
          class="h-10 w-auto transition-all duration-300"
        />
        <button 
          on:click={(e: MouseEvent) => {
            e.stopPropagation();
            toggleCollapse();
          }}
          class="p-1 rounded-md text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
          title="Collapse Menu"
        >
          <Menu class="h-5 w-5" />
        </button>
      </div>
    {/if}
  </div>

  <!-- Navigation Items -->
  <div class="flex-1 overflow-y-auto py-6 px-3 space-y-1 scrollbar-thin scrollbar-thumb-gray-300 dark:scrollbar-thumb-gray-600 {isCollapsed ? 'overflow-x-hidden' : ''}">
    {#each navigation as item, index}
      {#if item.type === 'single'}
        <a
          href={item.href}
          on:click={() => sidebarStore.collapse()}
          class="flex items-center {isCollapsed ? 'justify-center' : 'space-x-3'} px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 group
            {activeStates[index]
              ? 'bg-indigo-50 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300 shadow-sm ring-1 ring-indigo-200 dark:ring-indigo-800'
              : 'text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white hover:bg-gray-50 dark:hover:bg-gray-700/50'}"
          title={isCollapsed ? item.name : ''}
        >
          <svelte:component 
            this={item.icon} 
            class="h-5 w-5 flex-shrink-0 transition-colors duration-200 {activeStates[index] ? 'text-indigo-600 dark:text-indigo-400' : 'text-gray-500 group-hover:text-gray-700 dark:text-gray-500 dark:group-hover:text-gray-300'}" 
          />
          {#if !isCollapsed}
            <span class="truncate">{item.name}</span>
          {/if}
        </a>
      {:else if item.type === 'dropdown'}
        <div>
          <button
            on:click={() => item.key && handleDropdownClick(item.key)}
            class="w-full flex items-center {isCollapsed ? 'justify-center' : 'justify-between'} px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 group
              {activeStates[index]
                ? 'bg-indigo-50 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300'
                : 'text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white hover:bg-gray-50 dark:hover:bg-gray-700/50'}"
             title={isCollapsed ? item.name : ''}
          >
            <div class="flex items-center {isCollapsed ? 'justify-center' : 'space-x-3'}">
              <svelte:component 
                this={item.icon} 
                class="h-5 w-5 flex-shrink-0 transition-colors duration-200 {activeStates[index] ? 'text-indigo-600 dark:text-indigo-400' : 'text-gray-500 group-hover:text-gray-700 dark:text-gray-500 dark:group-hover:text-gray-300'}" 
              />
              {#if !isCollapsed}
                <span class="truncate">{item.name}</span>
              {/if}
            </div>
            {#if !isCollapsed && item.key}
              <svelte:component 
                this={openDropdowns[item.key] ? ChevronDown : ChevronRight} 
                class="h-4 w-4 opacity-50 group-hover:opacity-100 transition-opacity" 
              />
            {/if}
          </button>
          
          {#if !isCollapsed && item.key && openDropdowns[item.key] && item.items}
            <div class="mt-1 ml-4 pl-3 border-l-2 border-gray-100 dark:border-gray-700 space-y-1">
              {#each item.items as subItem}
                {@const isSubActive = isCurrentPage(subItem.href)}
                <a
                  href={subItem.href}
                  on:click={() => sidebarStore.collapse()}
                  class="flex items-center space-x-3 px-3 py-2 rounded-md text-sm transition-colors duration-200
                    {isSubActive 
                      ? 'text-indigo-600 dark:text-indigo-400 font-medium bg-indigo-50/50 dark:bg-indigo-900/20' 
                      : 'text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-50 dark:hover:bg-gray-700/50'}"
                >
                  <svelte:component this={subItem.icon} class="h-4 w-4 flex-shrink-0" />
                  <span class="truncate">{subItem.name}</span>
                </a>
              {/each}
            </div>
          {/if}
        </div>
      {/if}
    {/each}

    <!-- Integration Status Legend - Now part of scrollable content -->
    {#if !isCollapsed}
    <div class="mt-8 pt-4 border-t border-gray-200 dark:border-gray-700 space-y-2">
      <div class="text-xs font-semibold text-gray-400 uppercase tracking-wider">Status Legend</div>
      <div class="grid grid-cols-1 gap-2">
        <div class="flex items-center space-x-2">
          <div class="w-2 h-2 bg-green-500 rounded-full shadow-sm"></div>
          <span class="text-xs text-gray-600 dark:text-gray-400">Phase 1: Circuit Breaker</span>
        </div>
        <div class="flex items-center space-x-2">
          <div class="w-2 h-2 bg-indigo-500 rounded-full shadow-sm"></div>
          <span class="text-xs text-gray-600 dark:text-gray-400">Phase 2: Forward Proxy</span>
        </div>
        <div class="flex items-center space-x-2">
          <div class="w-2 h-2 bg-yellow-500 rounded-full shadow-sm"></div>
          <span class="text-xs text-gray-600 dark:text-gray-400">Phase 3: Additional</span>
        </div>
        <div class="flex items-center space-x-2">
          <div class="w-2 h-2 bg-blue-500 rounded-full shadow-sm"></div>
          <span class="text-xs text-gray-600 dark:text-gray-400">Phase 4: Future</span>
        </div>
      </div>
    </div>
    {/if}
  </div>
</nav>
