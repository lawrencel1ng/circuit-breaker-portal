import { writable } from 'svelte/store';

function createThemeStore() {
    const { subscribe, set, update } = writable(false);

    return {
        subscribe,
        toggle: () => {
            update(isDark => {
                const newMode = !isDark;
                if (typeof window !== 'undefined') {
                    if (newMode) {
                        document.documentElement.classList.add('dark');
                    } else {
                        document.documentElement.classList.remove('dark');
                    }
                    localStorage.setItem('darkMode', newMode.toString());
                }
                return newMode;
            });
        },
        init: () => {
            if (typeof window !== 'undefined') {
                const savedDarkMode = localStorage.getItem('darkMode');
                let isDark = false;
                
                if (savedDarkMode !== null) {
                    isDark = savedDarkMode === 'true';
                } else {
                    isDark = document.documentElement.classList.contains('dark');
                }
                
                if (isDark) {
                    document.documentElement.classList.add('dark');
                } else {
                    document.documentElement.classList.remove('dark');
                }
                set(isDark);
            }
        }
    };
}

export const themeStore = createThemeStore();
