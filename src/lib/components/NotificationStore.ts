import { writable } from 'svelte/store';

export interface Notification {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  title: string;
  message: string;
  show: boolean;
  duration?: number;
}

const createNotificationStore = () => {
  const { subscribe, update } = writable<Notification[]>([]);

  return {
    subscribe,
    add: (notification: Omit<Notification, 'id' | 'show'>) => {
      const id = `notification_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      const newNotification: Notification = {
        ...notification,
        id,
        show: true,
        duration: notification.duration || 5000
      };

      update(notifications => [...notifications, newNotification]);

      // Auto remove after duration
      const duration = newNotification.duration || 5000;
      if (duration > 0) {
        setTimeout(() => {
          update(notifications => {
            const notification = notifications.find(n => n.id === id);
            if (notification) {
              notification.show = false;
              // Remove from array after animation
              setTimeout(() => {
                update(notifications => notifications.filter(n => n.id !== id));
              }, 300);
            }
            return notifications;
          });
        }, duration);
      }

      return id;
    },
    remove: (id: string) => {
      update(notifications => {
        const notification = notifications.find(n => n.id === id);
        if (notification) {
          notification.show = false;
          // Remove from array after animation
          setTimeout(() => {
            update(notifications => notifications.filter(n => n.id !== id));
          }, 300);
        }
        return notifications;
      });
    },
    clear: () => {
      update(() => []);
    }
  };
};

export const notificationStore = createNotificationStore();

