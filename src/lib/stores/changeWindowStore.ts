import { writable, derived } from 'svelte/store';
import { notificationStore } from './notificationStore';

export interface ChangeWindow {
  id: string;
  name: string;
  type: 'allowed' | 'restricted';
  dayOfWeek?: number; // 0-6 (Sun-Sat)
  startTime: string; // HH:mm
  endTime: string; // HH:mm
  isActive: boolean;
  description?: string;
}

function isTimeInRange(time: string, start: string, end: string): boolean {
  if (start <= end) {
    return time >= start && time <= end;
  } else {
    // Crosses midnight (e.g., 22:00 to 06:00)
    return time >= start || time <= end;
  }
}

function createChangeWindowStore() {
  const { subscribe, set, update } = writable<ChangeWindow[]>([]);

  return {
    subscribe,
    setWindows: (windows: ChangeWindow[]) => set(windows),

    addWindow: async (window: Omit<ChangeWindow, 'id'>) => {
      try {
        const response = await fetch('/api/change-windows', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(window)
        });
        
        if (!response.ok) throw new Error('Failed to create change window');
        const newWindow = await response.json();

        update(windows => [...windows, newWindow]);
        
        notificationStore.add({
          type: 'success',
          title: 'Window Created',
          message: 'Change window created successfully'
        });
      } catch (error) {
        console.error('Failed to add window:', error);
        notificationStore.add({
          type: 'error',
          title: 'Error',
          message: 'Failed to create change window'
        });
      }
    },

    removeWindow: async (id: string) => {
      try {
        const response = await fetch(`/api/change-windows/${id}`, {
          method: 'DELETE'
        });

        if (!response.ok) throw new Error('Failed to delete change window');

        update(windows => windows.filter(w => w.id !== id));
        
        notificationStore.add({
          type: 'success',
          title: 'Window Deleted',
          message: 'Change window deleted successfully'
        });
      } catch (error) {
        console.error('Failed to remove window:', error);
        notificationStore.add({
          type: 'error',
          title: 'Error',
          message: 'Failed to delete change window'
        });
      }
    },

    toggleWindow: async (id: string) => {
      let currentWindow: ChangeWindow | undefined;
      update(windows => {
        const index = windows.findIndex(w => w.id === id);
        if (index !== -1) {
          currentWindow = windows[index];
          // Optimistic update
          const newWindows = [...windows];
          newWindows[index] = { ...currentWindow, isActive: !currentWindow.isActive };
          return newWindows;
        }
        return windows;
      });

      if (currentWindow) {
        try {
          const response = await fetch(`/api/change-windows/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ isActive: !currentWindow.isActive })
          });
          if (!response.ok) throw new Error('Failed to update change window');
        } catch (error) {
           console.error('Failed to toggle window:', error);
           notificationStore.add({
             type: 'error',
             title: 'Error',
             message: 'Failed to toggle window status'
           });
           // Revert
           update(windows => {
              const index = windows.findIndex(w => w.id === id);
              if (index !== -1 && currentWindow) {
                const newWindows = [...windows];
                newWindows[index] = currentWindow;
                return newWindows;
              }
              return windows;
           });
        }
      }
    },

    updateWindow: async (id: string, data: Partial<ChangeWindow>) => {
      try {
         const response = await fetch(`/api/change-windows/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
          });
          if (!response.ok) throw new Error('Failed to update change window');
          const updated = await response.json();

          update(windows => windows.map(w => w.id === id ? { ...w, ...updated } : w));
          
          notificationStore.add({
            type: 'success',
            title: 'Window Updated',
            message: 'Change window updated successfully'
          });
      } catch (error) {
        console.error('Failed to update window:', error);
        notificationStore.add({
          type: 'error',
          title: 'Error',
          message: 'Failed to update change window'
        });
      }
    },

    isAllowed: (date: Date, windows: ChangeWindow[]) => {
      const day = date.getDay();
      const hours = date.getHours();
      const minutes = date.getMinutes();
      const timeString = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;

      // Check restricted windows first
      const restrictedWindows = windows.filter(w => w.isActive && w.type === 'restricted');
      for (const window of restrictedWindows) {
        if (window.dayOfWeek !== undefined && window.dayOfWeek !== day) continue;
        
        if (isTimeInRange(timeString, window.startTime, window.endTime)) {
          return { allowed: false, reason: `Falls within restricted window: ${window.name}` };
        }
      }

      // If there are allowed windows defined, it MUST fall in one of them
      const allowedWindows = windows.filter(w => w.isActive && w.type === 'allowed');
      if (allowedWindows.length > 0) {
        let inAllowed = false;
        for (const window of allowedWindows) {
          if (window.dayOfWeek !== undefined && window.dayOfWeek !== day) continue;
          
          if (isTimeInRange(timeString, window.startTime, window.endTime)) {
            inAllowed = true;
            break;
          }
        }
        if (!inAllowed) {
          return { allowed: false, reason: 'Does not fall within any allowed window' };
        }
      }

      return { allowed: true };
    }
  };
}

export const changeWindowStore = createChangeWindowStore();
