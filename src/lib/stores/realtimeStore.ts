/**
 * Real-time WebSocket Store
 * Manages WebSocket connections and subscriptions for real-time updates
 */

import { writable, type Readable } from 'svelte/store';

export interface WebSocketMessage {
  type: string;
  timestamp: string;
  data: any;
}

export type MessageHandler = (message: WebSocketMessage) => void;

class WebSocketManager {
  private ws: WebSocket | null = null;
  private subscribers: Map<string, Set<MessageHandler>> = new Map();
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 1000;
  private url: string;

  constructor(url: string = '') {
    this.url = url || (typeof window !== 'undefined' ? `wss://${window.location.host}/api/ws` : '');
  }

  connect(): void {
    if (this.ws?.readyState === WebSocket.OPEN) return;
    if (typeof window === 'undefined') return;

    try {
      this.ws = new WebSocket(this.url);

      this.ws.onopen = () => {
        console.log('WebSocket connected');
        this.reconnectAttempts = 0;
      };

      this.ws.onmessage = (event) => {
        try {
          const message: WebSocketMessage = JSON.parse(event.data);
          this.broadcastToSubscribers(message);
        } catch (err) {
          console.error('Failed to parse WebSocket message', err);
        }
      };

      this.ws.onclose = () => {
        console.log('WebSocket disconnected');
        this.attemptReconnect();
      };

      this.ws.onerror = (error) => {
        console.error('WebSocket error', error);
      };
    } catch (err) {
      console.error('Failed to connect WebSocket', err);
    }
  }

  private attemptReconnect(): void {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.error('Max WebSocket reconnection attempts reached');
      return;
    }

    this.reconnectAttempts++;
    const delay = this.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1);
    
    console.log(`Attempting to reconnect in ${delay}ms (attempt ${this.reconnectAttempts})`);
    
    setTimeout(() => {
      this.connect();
    }, delay);
  }

  subscribe(channel: string, handler: MessageHandler): () => void {
    if (!this.subscribers.has(channel)) {
      this.subscribers.set(channel, new Set());
    }
    
    this.subscribers.get(channel)!.add(handler);

    // Return unsubscribe function
    return () => {
      const handlers = this.subscribers.get(channel);
      if (handlers) {
        handlers.delete(handler);
      }
    };
  }

  private broadcastToSubscribers(message: WebSocketMessage): void {
    // Broadcast to all subscribers
    this.subscribers.forEach((handlers) => {
      handlers.forEach((handler) => {
        try {
          handler(message);
        } catch (err) {
          console.error('Error in message handler', err);
        }
      });
    });
  }

  send(message: any): void {
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(message));
    }
  }

  disconnect(): void {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
  }
}

// Singleton instance
let wsManager: WebSocketManager | null = null;

export function getWebSocketManager(): WebSocketManager | null {
  if (typeof window === 'undefined') return null;
  
  if (!wsManager) {
    wsManager = new WebSocketManager();
    wsManager.connect();
  }
  
  return wsManager;
}

export function resetWebSocketManager(): void {
  if (wsManager) {
    wsManager.disconnect();
    wsManager = null;
  }
}

// Create a store for real-time data
export function createRealtimeStore<T>(
  channel: string, 
  initialValue: T,
  transform?: (message: WebSocketMessage) => T | null
): Readable<T> {
  const { subscribe, set } = writable<T>(initialValue);

  if (typeof window !== 'undefined') {
    const ws = getWebSocketManager();
    if (ws) {
      ws.subscribe(channel, (message) => {
        if (transform) {
          const transformed = transform(message);
          if (transformed !== null) {
            set(transformed);
          }
        }
      });
    }
  }

  return { subscribe };
}
