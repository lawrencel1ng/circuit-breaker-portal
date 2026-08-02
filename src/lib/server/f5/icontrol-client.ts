/**
 * F5 iControl REST API Client
 * Base client for communicating with F5 BIG-IP devices
 */

import { F5_CONFIG } from './config';
import { logger } from '$lib/server/logger';

export interface F5AuthToken {
  token: string;
  expiry: number;
}

export interface F5ApiResponse<T = any> {
  kind: string;
  selfLink: string;
  items?: T[];
  [key: string]: any;
}

export class F5iControlClient {
  private baseUrl: string;
  private username: string;
  private password: string;
  private authToken: F5AuthToken | null = null;
  private verifySsl: boolean;
  private requestTimeout: number;

  constructor(
    host: string = F5_CONFIG.HOST,
    username: string = F5_CONFIG.USERNAME,
    password: string = F5_CONFIG.PASSWORD,
    verifySsl: boolean = F5_CONFIG.VERIFY_SSL,
    requestTimeout: number = 30000 // 30 seconds default timeout
  ) {
    this.baseUrl = host.endsWith('/') ? host.slice(0, -1) : host;
    this.username = username;
    this.password = password;
    this.verifySsl = verifySsl;
    this.requestTimeout = requestTimeout;
  }

  /**
   * Get authentication token
   */
  async authenticate(): Promise<F5AuthToken> {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), this.requestTimeout);

      const response = await fetch(`${this.baseUrl}/mgmt/shared/authn/login`, {
        method: 'POST',
        signal: controller.signal,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          username: this.username,
          password: this.password,
          loginProviderName: 'tmos'
        }),
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`Authentication failed: ${response.status}`);
      }

      const data = await response.json();
      
      this.authToken = {
        token: data.token.token,
        expiry: Date.now() + (data.token.timeout * 1000)
      };

      return this.authToken;
    } catch (error: any) {
      if (error.name === 'AbortError') {
        throw new Error(`F5 Authentication timeout after ${this.requestTimeout}ms`);
      }
      logger.error('F5 Authentication error', error);
      throw error;
    }
  }

  /**
   * Ensure valid authentication token
   */
  private async ensureAuth(): Promise<string> {
    if (!this.authToken || Date.now() >= this.authToken.expiry - 60000) {
      await this.authenticate();
    }
    return this.authToken!.token;
  }

  /**
   * Make API request with timeout
   */
  async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<F5ApiResponse<T>> {
    const token = await this.ensureAuth();
    
    const url = endpoint.startsWith('http') 
      ? endpoint 
      : `${this.baseUrl}${endpoint.startsWith('/') ? endpoint : `/mgmt/${endpoint}`}`;

    // Create abort controller for timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.requestTimeout);

    try {
      const response = await fetch(url, {
        ...options,
        signal: controller.signal,
        headers: {
          'Content-Type': 'application/json',
          'X-F5-Auth-Token': token,
          ...options.headers,
        },
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const error = await response.json().catch(() => ({ message: 'Unknown error' }));
        throw new Error(`F5 API Error: ${response.status} - ${error.message || JSON.stringify(error)}`);
      }

      // Handle 204 No Content
      if (response.status === 204) {
        return { kind: 'tm:util:empty', selfLink: url } as F5ApiResponse<T>;
      }

      return response.json();
    } catch (error: any) {
      clearTimeout(timeoutId);
      if (error.name === 'AbortError') {
        throw new Error(`F5 API request timeout after ${this.requestTimeout}ms`);
      }
      throw error;
    }
  }

  /**
   * GET request
   */
  async get<T>(endpoint: string): Promise<F5ApiResponse<T>> {
    return this.request<T>(endpoint, { method: 'GET' });
  }

  /**
   * POST request
   */
  async post<T>(endpoint: string, data: any): Promise<F5ApiResponse<T>> {
    return this.request<T>(endpoint, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  /**
   * PUT request
   */
  async put<T>(endpoint: string, data: any): Promise<F5ApiResponse<T>> {
    return this.request<T>(endpoint, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  /**
   * PATCH request
   */
  async patch<T>(endpoint: string, data: any): Promise<F5ApiResponse<T>> {
    return this.request<T>(endpoint, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  }

  /**
   * DELETE request
   */
  async delete<T>(endpoint: string): Promise<F5ApiResponse<T>> {
    return this.request<T>(endpoint, { method: 'DELETE' });
  }

  /**
   * Get device info
   */
  async getDeviceInfo(): Promise<any> {
    return this.get('shared/identified-devices/config/device-info');
  }

  /**
   * Get system status
   */
  async getSystemStatus(): Promise<any> {
    return this.get('tm/sys/global-settings');
  }

  /**
   * Get virtual servers
   */
  async getVirtualServers(): Promise<F5ApiResponse> {
    return this.get('tm/ltm/virtual');
  }

  /**
   * Get pools
   */
  async getPools(): Promise<F5ApiResponse> {
    return this.get('tm/ltm/pool');
  }

  /**
   * Get data groups
   */
  async getDataGroups(): Promise<F5ApiResponse> {
    return this.get('tm/ltm/data-group/internal');
  }

  /**
   * Create or update data group
   */
  async createDataGroup(name: string, type: 'string' | 'integer' | 'address', records: any[]): Promise<F5ApiResponse> {
    return this.post('tm/ltm/data-group/internal', {
      name,
      type,
      records
    });
  }

  /**
   * Update data group records
   */
  async updateDataGroup(name: string, records: any[]): Promise<F5ApiResponse> {
    return this.patch(`tm/ltm/data-group/internal/~Common~${name}`, {
      records
    });
  }

  /**
   * Delete data group
   */
  async deleteDataGroup(name: string): Promise<F5ApiResponse> {
    return this.delete(`tm/ltm/data-group/internal/~Common~${name}`);
  }

  /**
   * Get SSL profiles
   */
  async getSSLProfiles(): Promise<F5ApiResponse> {
    return this.get('tm/ltm/profile/client-ssl');
  }

  /**
   * Get certificates
   */
  async getCertificates(): Promise<F5ApiResponse> {
    return this.get('tm/sys/file/ssl-cert');
  }

  /**
   * Upload certificate
   */
  async uploadCertificate(name: string, content: string): Promise<F5ApiResponse> {
    return this.post('tm/sys/file/ssl-cert', {
      name,
      sourcePath: `file:/var/tmp/${name}`,
      // Note: Actual file upload requires separate file transfer API
    });
  }

  /**
   * Test connectivity to F5
   */
  async testConnectivity(): Promise<{ success: boolean; message: string }> {
    try {
      await this.getDeviceInfo();
      return { success: true, message: 'Successfully connected to F5 BIG-IP' };
    } catch (error: any) {
      return { success: false, message: error.message };
    }
  }

  /**
   * Revoke authentication token (logout)
   */
  async revokeToken(): Promise<void> {
    if (!this.authToken) return;
    
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 second timeout for logout

      await fetch(`${this.baseUrl}/mgmt/shared/authz/tokens/${this.authToken.token}`, {
        method: 'DELETE',
        signal: controller.signal,
        headers: {
          'X-F5-Auth-Token': this.authToken.token
        }
      });

      clearTimeout(timeoutId);
    } catch (error) {
      // Ignore errors during token revocation
      logger.debug('Token revocation failed (may already be expired):', error);
    } finally {
      this.authToken = null;
    }
  }

  /**
   * Close the client and cleanup
   */
  async close(): Promise<void> {
    await this.revokeToken();
  }
}

// Singleton instance
let f5Client: F5iControlClient | null = null;

export function getF5Client(): F5iControlClient {
  if (!f5Client) {
    f5Client = new F5iControlClient();
  }
  return f5Client;
}

export function resetF5Client(): void {
  f5Client = null;
}
