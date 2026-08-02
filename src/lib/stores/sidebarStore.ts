import { writable } from 'svelte/store';

function createSidebarStore() {
  const { subscribe, set, update } = writable(true);

  return {
    subscribe,
    toggle: () => update(isCollapsed => !isCollapsed),
    set: (value: boolean) => set(value),
    expand: () => set(false),
    collapse: () => set(true)
  };
}

export const sidebarStore = createSidebarStore();
