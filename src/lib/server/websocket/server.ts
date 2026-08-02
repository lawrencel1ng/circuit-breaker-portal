/**
 * WebSocket Server for Real-Time Updates
 * Provides live updates for deployments, circuit breakers, metrics, and events
 */

import { WebSocketServer, WebSocket } from 'ws';
import { logger } from '../logger';
import type { IncomingMessage } from 'http';

// Message types for WebSocket communication
export type WebSocketMessageType = 
  | 'deployment_update'
  | 'circuit_breaker_update'
  | 'scaling_event'
  | 'metrics_update'
  | 'alert'
  | 'health_check'
  | 'traffic_update'
  | 'certificate_expiry'
  | 'auth_event'
  | 'system_status';

export interface WebSocketMessage {
  type: WebSocketMessageType;
  timestamp: string;
  data: any;
  channel?: string;
}

export interface WebSocketClient {
  id: string;
  ws: WebSocket;
  userId?: string;
  roles: string[];
  subscribedChannels: Set<string>;
  connectedAt: Date;
  lastPing: Date;
}

// Channel definitions
export const WEBSOCKET_CHANNELS = {
  DEPLOYMENTS: 'deployments',
  CIRCUIT_BREAKERS: 'circuit-breakers',
  SCALING: 'scaling',
  METRICS: 'metrics',
  ALERTS: 'alerts',
  CERTIFICATES: 'certificates',
  SYSTEM: 'system',
  TRAFFIC: 'traffic',
  ALL: 'all'
} as const;

export class WebSocketManager {
  private wss: WebSocketServer | null = null;
  private clients: Map<string, WebSocketClient> = new Map();
  private heartbeatInterval: NodeJS.Timeout | null = null;
  private readonly HEARTBEAT_INTERVAL = 30000; // 30 seconds
  private readonly HEARTBEAT_TIMEOUT = 60000; // 60 seconds

  constructor() {
    this.startHeartbeat();
  }

  /**
   * Initialize WebSocket server
   */
  initialize(server: any): void {
    this.wss = new WebSocketServer({ 
      server,
      path: '/ws',
      perMessageDeflate: {
        zlibDeflateOptions: {
          chunkSize: 1024,
          memLevel: 7,
          level: 3
        },
        zlibInflateOptions: {
          chunkSize: 10 * 1024
        },
        clientNoContextTakeover: true,
        serverNoContextTakeover: true,
        serverMaxWindowBits: 10,
        concurrencyLimit: 10
      }
    });

    this.wss.on('connection', (ws: WebSocket, req: IncomingMessage) => {
      this.handleConnection(ws, req);
    });

    logger.info('WebSocket server initialized on /ws');
  }

  /**
   * Handle new WebSocket connection
   */
  private handleConnection(ws: WebSocket, req: IncomingMessage): void {
    const clientId = this.generateClientId();
    const client: WebSocketClient = {
      id: clientId,
      ws,
      roles: [],
      subscribedChannels: new Set(),
      connectedAt: new Date(),
      lastPing: new Date()
    };

    this.clients.set(clientId, client);
    logger.info(`WebSocket client connected: ${clientId}`);

    // Send welcome message
    this.sendToClient(client, {
      type: 'system_status',
      timestamp: new Date().toISOString(),
      data: { message: 'Connected to F5 Control Center', clientId }
    });

    // Handle messages
    ws.on('message', (data: Buffer) => {
      this.handleMessage(client, data);
    });

    // Handle close
    ws.on('close', () => {
      this.handleDisconnect(clientId);
    });

    // Handle pong
    ws.on('pong', () => {
      client.lastPing = new Date();
    });

    // Handle errors
    ws.on('error', (error) => {
      logger.error(`WebSocket error for client ${clientId}:`, error);
    });
  }

  /**
   * Handle incoming WebSocket message
   */
  private handleMessage(client: WebSocketClient, data: Buffer): void {
    try {
      const message = JSON.parse(data.toString());
      
      switch (message.action) {
        case 'subscribe':
          this.handleSubscribe(client, message.channels);
          break;
        
        case 'unsubscribe':
          this.handleUnsubscribe(client, message.channels);
          break;
        
        case 'authenticate':
          this.handleAuthenticate(client, message.token);
          break;
        
        case 'ping':
          this.sendToClient(client, {
            type: 'system_status',
            timestamp: new Date().toISOString(),
            data: { message: 'pong' }
          });
          break;
        
        default:
          logger.warn(`Unknown WebSocket action: ${message.action}`);
      }
    } catch (error) {
      logger.error('Failed to parse WebSocket message:', error);
      this.sendToClient(client, {
        type: 'system_status',
        timestamp: new Date().toISOString(),
        data: { error: 'Invalid message format' }
      });
    }
  }

  /**
   * Handle channel subscription
   */
  private handleSubscribe(client: WebSocketClient, channels: string[]): void {
    if (!Array.isArray(channels)) {
      this.sendToClient(client, {
        type: 'system_status',
        timestamp: new Date().toISOString(),
        data: { error: 'Channels must be an array' }
      });
      return;
    }

    channels.forEach(channel => {
      client.subscribedChannels.add(channel);
    });

    logger.info(`Client ${client.id} subscribed to channels: ${channels.join(', ')}`);
    
    this.sendToClient(client, {
      type: 'system_status',
      timestamp: new Date().toISOString(),
      data: { message: 'Subscribed', channels: Array.from(client.subscribedChannels) }
    });
  }

  /**
   * Handle channel unsubscription
   */
  private handleUnsubscribe(client: WebSocketClient, channels: string[]): void {
    if (!Array.isArray(channels)) return;

    channels.forEach(channel => {
      client.subscribedChannels.delete(channel);
    });

    logger.info(`Client ${client.id} unsubscribed from channels: ${channels.join(', ')}`);
  }

  /**
   * Handle client authentication
   */
  private async handleAuthenticate(client: WebSocketClient, token: string): Promise<void> {
    try {
      // Validate JWT token and extract user info
      // This would integrate with your existing auth system
      // For now, simulate successful auth
      client.userId = 'authenticated-user';
      client.roles = ['operator'];

      this.sendToClient(client, {
        type: 'auth_event',
        timestamp: new Date().toISOString(),
        data: { status: 'authenticated', userId: client.userId }
      });
    } catch (error) {
      logger.error('WebSocket authentication failed:', error);
      this.sendToClient(client, {
        type: 'auth_event',
        timestamp: new Date().toISOString(),
        data: { status: 'authentication_failed' }
      });
    }
  }

  /**
   * Handle client disconnect
   */
  private handleDisconnect(clientId: string): void {
    this.clients.delete(clientId);
    logger.info(`WebSocket client disconnected: ${clientId}`);
  }

  /**
   * Send message to specific client
   */
  private sendToClient(client: WebSocketClient, message: WebSocketMessage): void {
    if (client.ws.readyState === WebSocket.OPEN) {
      client.ws.send(JSON.stringify(message));
    }
  }

  /**
   * Broadcast message to all clients subscribed to a channel
   */
  broadcast(message: WebSocketMessage, channel?: string): void {
    const targetChannel = channel || message.channel || WEBSOCKET_CHANNELS.ALL;
    
    this.clients.forEach(client => {
      // Check if client is subscribed to the channel or 'all'
      if (client.subscribedChannels.has(targetChannel) || 
          client.subscribedChannels.has(WEBSOCKET_CHANNELS.ALL)) {
        this.sendToClient(client, { ...message, channel: targetChannel });
      }
    });
  }

  /**
   * Broadcast to specific channels
   */
  broadcastToChannels(message: WebSocketMessage, channels: string[]): void {
    this.clients.forEach(client => {
      const isSubscribed = channels.some(channel => 
        client.subscribedChannels.has(channel) || 
        client.subscribedChannels.has(WEBSOCKET_CHANNELS.ALL)
      );
      
      if (isSubscribed) {
        this.sendToClient(client, message);
      }
    });
  }

  /**
   * Send deployment update
   */
  sendDeploymentUpdate(deploymentId: string, status: string, progress: number, data?: any): void {
    this.broadcast({
      type: 'deployment_update',
      timestamp: new Date().toISOString(),
      data: {
        deploymentId,
        status,
        progress,
        ...data
      }
    }, WEBSOCKET_CHANNELS.DEPLOYMENTS);
  }

  /**
   * Send circuit breaker update
   */
  sendCircuitBreakerUpdate(laneId: string, edgeStatus: string, enterpriseStatus: string): void {
    this.broadcast({
      type: 'circuit_breaker_update',
      timestamp: new Date().toISOString(),
      data: {
        laneId,
        edgeStatus,
        enterpriseStatus,
        timestamp: new Date().toISOString()
      }
    }, WEBSOCKET_CHANNELS.CIRCUIT_BREAKERS);
  }

  /**
   * Send scaling event
   */
  sendScalingEvent(event: { type: string; policyId: string; instancesChanged: number; reason: string }): void {
    this.broadcast({
      type: 'scaling_event',
      timestamp: new Date().toISOString(),
      data: event
    }, WEBSOCKET_CHANNELS.SCALING);
  }

  /**
   * Send metrics update
   */
  sendMetricsUpdate(metrics: any): void {
    this.broadcast({
      type: 'metrics_update',
      timestamp: new Date().toISOString(),
      data: metrics
    }, WEBSOCKET_CHANNELS.METRICS);
  }

  /**
   * Send alert
   */
  sendAlert(alert: { severity: string; title: string; message: string; source: string }): void {
    this.broadcast({
      type: 'alert',
      timestamp: new Date().toISOString(),
      data: alert
    }, WEBSOCKET_CHANNELS.ALERTS);
  }

  /**
   * Send traffic update
   */
  sendTrafficUpdate(trafficData: any): void {
    this.broadcast({
      type: 'traffic_update',
      timestamp: new Date().toISOString(),
      data: trafficData
    }, WEBSOCKET_CHANNELS.TRAFFIC);
  }

  /**
   * Send certificate expiry warning
   */
  sendCertificateExpiryWarning(certificates: Array<{ id: string; domain: string; daysRemaining: number }>): void {
    this.broadcast({
      type: 'certificate_expiry',
      timestamp: new Date().toISOString(),
      data: { certificates }
    }, WEBSOCKET_CHANNELS.CERTIFICATES);
  }

  /**
   * Start heartbeat to check client connections
   */
  private startHeartbeat(): void {
    this.heartbeatInterval = setInterval(() => {
      const now = new Date();
      
      this.clients.forEach((client, clientId) => {
        // Check if client is still responsive
        if (now.getTime() - client.lastPing.getTime() > this.HEARTBEAT_TIMEOUT) {
          logger.warn(`Client ${clientId} timed out`);
          client.ws.terminate();
          this.clients.delete(clientId);
          return;
        }

        // Send ping
        if (client.ws.readyState === WebSocket.OPEN) {
          client.ws.ping();
        }
      });
    }, this.HEARTBEAT_INTERVAL);
  }

  /**
   * Get connected clients count
   */
  getConnectedClientsCount(): number {
    return this.clients.size;
  }

  /**
   * Get client statistics
   */
  getStatistics(): {
    totalClients: number;
    authenticatedClients: number;
    channels: Record<string, number>;
  } {
    const channels: Record<string, number> = {};
    let authenticatedCount = 0;

    this.clients.forEach(client => {
      if (client.userId) authenticatedCount++;
      
      client.subscribedChannels.forEach(channel => {
        channels[channel] = (channels[channel] || 0) + 1;
      });
    });

    return {
      totalClients: this.clients.size,
      authenticatedClients: authenticatedCount,
      channels
    };
  }

  /**
   * Generate unique client ID
   */
  private generateClientId(): string {
    return `ws-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Dispose WebSocket server
   */
  dispose(): void {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
    }

    this.clients.forEach(client => {
      client.ws.close();
    });
    this.clients.clear();

    if (this.wss) {
      this.wss.close();
    }
  }
}

// Singleton instance
let wsManager: WebSocketManager | null = null;

export function getWebSocketManager(): WebSocketManager {
  if (!wsManager) {
    wsManager = new WebSocketManager();
  }
  return wsManager;
}

export function resetWebSocketManager(): void {
  if (wsManager) {
    wsManager.dispose();
    wsManager = null;
  }
}
