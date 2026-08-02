/**
 * F5 Transaction Manager
 * Provides ACID-like transactions for F5 configuration changes
 * Supports multi-step operations with automatic rollback on failure
 */

import { getConnectionPool } from './connection-pool';
import { getJobQueue, type JobStepDefinition } from './job-queue';
import { logger } from '../logger';
import type { F5iControlClient } from './icontrol-client';

export interface Transaction {
  id: string;
  name: string;
  status: 'pending' | 'active' | 'committed' | 'rolled_back' | 'failed';
  createdAt: number;
  startedAt?: number;
  completedAt?: number;
  
  // Snapshots for rollback
  snapshots: TransactionSnapshot[];
  
  // Operations log
  operations: TransactionOperation[];
  
  // Error info
  error?: {
    message: string;
    operation?: string;
    details?: any;
  };
}

export interface TransactionSnapshot {
  id: string;
  path: string;        // F5 path, e.g., /Common/my-pool
  type: string;        // Resource type
  data: any;          // Full snapshot of resource
  createdAt: number;
}

export interface TransactionOperation {
  id: string;
  type: 'create' | 'update' | 'delete' | 'patch';
  path: string;
  description: string;
  status: 'pending' | 'success' | 'failed';
  snapshotId?: string;
  timestamp?: number;
  error?: string;
}

export interface TransactionOptions {
  name: string;
  description?: string;
  autoRollback?: boolean;  // Auto rollback on failure
  timeout?: number;        // Transaction timeout in ms
}

export class F5TransactionManager {
  private transactions: Map<string, Transaction> = new Map();
  private transactionCounter = 0;

  /**
   * Begin a new transaction
   */
  async begin(options: TransactionOptions): Promise<Transaction> {
    const id = `txn-${++this.transactionCounter}-${Date.now()}`;
    
    const transaction: Transaction = {
      id,
      name: options.name,
      status: 'pending',
      createdAt: Date.now(),
      snapshots: [],
      operations: []
    };

    this.transactions.set(id, transaction);
    logger.info(`Transaction ${id} started: ${options.name}`);
    
    return transaction;
  }

  /**
   * Create resource within transaction
   */
  async create<T>(
    transactionId: string,
    path: string,
    data: T,
    options: { description?: string; type?: string } = {}
  ): Promise<T> {
    const txn = this.getTransaction(transactionId);
    
    if (txn.status !== 'pending' && txn.status !== 'active') {
      throw new Error(`Transaction ${transactionId} is not active`);
    }

    txn.status = 'active';
    txn.startedAt = txn.startedAt || Date.now();

    const operation: TransactionOperation = {
      id: `op-${txn.operations.length + 1}`,
      type: 'create',
      path,
      description: options.description || `Create ${path}`,
      status: 'pending'
    };

    txn.operations.push(operation);

    try {
      const pool = getConnectionPool();
      
      const result = await pool.execute(async (client) => {
        // For create, no snapshot needed (rollback = delete)
        const response = await client.post(path, data);
        return response;
      });

      operation.status = 'success';
      operation.timestamp = Date.now();
      
      logger.debug(`Transaction ${transactionId}: Created ${path}`);
      
      return result as T;

    } catch (error: any) {
      operation.status = 'failed';
      operation.error = error.message;
      
      throw this.handleOperationError(txn, operation, error);
    }
  }

  /**
   * Update resource within transaction (with snapshot for rollback)
   */
  async update<T>(
    transactionId: string,
    path: string,
    data: Partial<T>,
    options: { description?: string; type?: string } = {}
  ): Promise<T> {
    const txn = this.getTransaction(transactionId);
    
    if (txn.status !== 'pending' && txn.status !== 'active') {
      throw new Error(`Transaction ${transactionId} is not active`);
    }

    txn.status = 'active';
    txn.startedAt = txn.startedAt || Date.now();

    const operation: TransactionOperation = {
      id: `op-${txn.operations.length + 1}`,
      type: 'update',
      path,
      description: options.description || `Update ${path}`,
      status: 'pending'
    };

    txn.operations.push(operation);

    try {
      const pool = getConnectionPool();
      
      const result = await pool.execute(async (client) => {
        // Take snapshot before update
        try {
          const existing = await client.get(path);
          const snapshot: TransactionSnapshot = {
            id: `snap-${txn.snapshots.length + 1}`,
            path,
            type: options.type || 'unknown',
            data: existing,
            createdAt: Date.now()
          };
          txn.snapshots.push(snapshot);
          operation.snapshotId = snapshot.id;
        } catch (snapshotError) {
          // Resource might not exist, that's ok for create-like updates
          logger.warn(`Could not snapshot ${path} before update: ${snapshotError}`);
        }

        const response = await client.put(path, data);
        return response;
      });

      operation.status = 'success';
      operation.timestamp = Date.now();
      
      logger.debug(`Transaction ${transactionId}: Updated ${path}`);
      
      return result as T;

    } catch (error: any) {
      operation.status = 'failed';
      operation.error = error.message;
      
      throw this.handleOperationError(txn, operation, error);
    }
  }

  /**
   * Patch resource within transaction
   */
  async patch<T>(
    transactionId: string,
    path: string,
    data: Partial<T>,
    options: { description?: string; type?: string } = {}
  ): Promise<T> {
    const txn = this.getTransaction(transactionId);
    
    if (txn.status !== 'pending' && txn.status !== 'active') {
      throw new Error(`Transaction ${transactionId} is not active`);
    }

    txn.status = 'active';
    txn.startedAt = txn.startedAt || Date.now();

    const operation: TransactionOperation = {
      id: `op-${txn.operations.length + 1}`,
      type: 'patch',
      path,
      description: options.description || `Patch ${path}`,
      status: 'pending'
    };

    txn.operations.push(operation);

    try {
      const pool = getConnectionPool();
      
      const result = await pool.execute(async (client) => {
        // Take snapshot before patch
        try {
          const existing = await client.get(path);
          const snapshot: TransactionSnapshot = {
            id: `snap-${txn.snapshots.length + 1}`,
            path,
            type: options.type || 'unknown',
            data: existing,
            createdAt: Date.now()
          };
          txn.snapshots.push(snapshot);
          operation.snapshotId = snapshot.id;
        } catch (snapshotError) {
          logger.warn(`Could not snapshot ${path} before patch:`, snapshotError);
        }

        const response = await client.patch(path, data);
        return response;
      });

      operation.status = 'success';
      operation.timestamp = Date.now();
      
      logger.debug(`Transaction ${transactionId}: Patched ${path}`);
      
      return result as T;

    } catch (error: any) {
      operation.status = 'failed';
      operation.error = error.message;
      
      throw this.handleOperationError(txn, operation, error);
    }
  }

  /**
   * Delete resource within transaction
   */
  async delete(
    transactionId: string,
    path: string,
    options: { description?: string; type?: string } = {}
  ): Promise<void> {
    const txn = this.getTransaction(transactionId);
    
    if (txn.status !== 'pending' && txn.status !== 'active') {
      throw new Error(`Transaction ${transactionId} is not active`);
    }

    txn.status = 'active';
    txn.startedAt = txn.startedAt || Date.now();

    const operation: TransactionOperation = {
      id: `op-${txn.operations.length + 1}`,
      type: 'delete',
      path,
      description: options.description || `Delete ${path}`,
      status: 'pending'
    };

    txn.operations.push(operation);

    try {
      const pool = getConnectionPool();
      
      await pool.execute(async (client) => {
        // Take snapshot before delete (for rollback)
        try {
          const existing = await client.get(path);
          const snapshot: TransactionSnapshot = {
            id: `snap-${txn.snapshots.length + 1}`,
            path,
            type: options.type || 'unknown',
            data: existing,
            createdAt: Date.now()
          };
          txn.snapshots.push(snapshot);
          operation.snapshotId = snapshot.id;
        } catch (snapshotError) {
          logger.warn(`Could not snapshot ${path} before delete:`, snapshotError);
        }

        await client.delete(path);
      });

      operation.status = 'success';
      operation.timestamp = Date.now();
      
      logger.debug(`Transaction ${transactionId}: Deleted ${path}`);

    } catch (error: any) {
      operation.status = 'failed';
      operation.error = error.message;
      
      throw this.handleOperationError(txn, operation, error);
    }
  }

  /**
   * Commit transaction
   */
  async commit(transactionId: string): Promise<Transaction> {
    const txn = this.getTransaction(transactionId);
    
    if (txn.status !== 'active') {
      throw new Error(`Transaction ${transactionId} cannot be committed (status: ${txn.status})`);
    }

    // Verify all operations succeeded
    const failedOps = txn.operations.filter(op => op.status === 'failed');
    if (failedOps.length > 0) {
      throw new Error(`Transaction has failed operations: ${failedOps.map(o => o.path).join(', ')}`);
    }

    txn.status = 'committed';
    txn.completedAt = Date.now();
    
    logger.info(`Transaction ${transactionId} committed successfully`);
    
    return txn;
  }

  /**
   * Rollback transaction
   */
  async rollback(transactionId: string): Promise<Transaction> {
    const txn = this.getTransaction(transactionId);
    
    if (txn.status !== 'active' && txn.status !== 'failed') {
      throw new Error(`Transaction ${transactionId} cannot be rolled back (status: ${txn.status})`);
    }

    logger.info(`Rolling back transaction ${transactionId}`);
    txn.status = 'rolled_back';

    const pool = getConnectionPool();
    const errors: string[] = [];

    // Rollback operations in reverse order
    for (let i = txn.operations.length - 1; i >= 0; i--) {
      const op = txn.operations[i];
      
      // Skip operations that didn't succeed
      if (op.status !== 'success') continue;

      try {
        await pool.execute(async (client) => {
          switch (op.type) {
            case 'create':
              // Rollback create = delete
              await client.delete(op.path);
              logger.debug(`Rolled back create: ${op.path}`);
              break;
              
            case 'update':
            case 'patch':
              // Rollback update/patch = restore snapshot
              if (op.snapshotId) {
                const snapshot = txn.snapshots.find(s => s.id === op.snapshotId);
                if (snapshot) {
                  await client.put(op.path, snapshot.data);
                  logger.debug(`Rolled back update: ${op.path}`);
                }
              }
              break;
              
            case 'delete':
              // Rollback delete = recreate
              if (op.snapshotId) {
                const snapshot = txn.snapshots.find(s => s.id === op.snapshotId);
                if (snapshot) {
                  await client.post(op.path, snapshot.data);
                  logger.debug(`Rolled back delete: ${op.path}`);
                }
              }
              break;
          }
        });
      } catch (error: any) {
        errors.push(`Failed to rollback ${op.path}: ${error.message}`);
        logger.error(`Rollback failed for ${op.path}:`, error);
      }
    }

    txn.completedAt = Date.now();

    if (errors.length > 0) {
      txn.error = {
        message: `Partial rollback completed with errors: ${errors.join('; ')}`,
        details: errors
      };
    }

    logger.info(`Transaction ${transactionId} rolled back`);
    
    return txn;
  }

  /**
   * Get transaction status
   */
  getTransaction(id: string): Transaction {
    const txn = this.transactions.get(id);
    if (!txn) {
      throw new Error(`Transaction ${id} not found`);
    }
    return txn;
  }

  /**
   * List all transactions
   */
  getAllTransactions(): Transaction[] {
    return Array.from(this.transactions.values()).sort((a, b) => b.createdAt - a.createdAt);
  }

  /**
   * Clean up old transactions
   */
  cleanup(maxAge: number = 24 * 60 * 60 * 1000): number {
    const cutoff = Date.now() - maxAge;
    let removed = 0;

    for (const [id, txn] of this.transactions) {
      if (txn.completedAt && txn.completedAt < cutoff) {
        this.transactions.delete(id);
        removed++;
      }
    }

    if (removed > 0) {
      logger.info(`Cleaned up ${removed} old transactions`);
    }

    return removed;
  }

  /**
   * Create job from transaction for async execution
   */
  async executeAsJob(
    options: TransactionOptions,
    operations: ((txn: TransactionExecutor) => Promise<void>)[]
  ): Promise<string> {
    const queue = getJobQueue();
    
    let txnId: string;

    const jobOptions = {
      name: options.name,
      description: options.description,
      type: 'config_change' as const,
      createdBy: 'system', // Should be passed from caller
      steps: operations.map((op, index) => ({
        id: `txn-step-${index + 1}`,
        name: `Transaction Step ${index + 1}`,
        execute: async (client: F5iControlClient, context: any) => {
          if (!txnId) {
            const newTxn = await this.begin(options);
            txnId = newTxn.id;
            context.sharedData.set('transactionId', txnId);
          }
          
          const executor = new TransactionExecutor(this, txnId, client);
          await op(executor);
        }
      })),
      metadata: { autoRollback: options.autoRollback }
    };

    const job = await queue.enqueue(jobOptions);
    return job.id;
  }

  private handleOperationError(txn: Transaction, operation: TransactionOperation, error: Error): Error {
    txn.error = {
      message: error.message,
      operation: operation.path,
      details: error
    };

    if (txn.status === 'active') {
      txn.status = 'failed';
    }

    logger.error(`Transaction ${txn.id} operation failed:`, error);
    return error;
  }
}

/**
 * Helper class for executing operations within a transaction
 */
export class TransactionExecutor {
  constructor(
    private manager: F5TransactionManager,
    private transactionId: string,
    private client: F5iControlClient
  ) {}

  async create<T>(path: string, data: T, options?: { description?: string; type?: string }): Promise<T> {
    return this.manager.create(this.transactionId, path, data, options);
  }

  async update<T>(path: string, data: Partial<T>, options?: { description?: string; type?: string }): Promise<T> {
    return this.manager.update(this.transactionId, path, data, options);
  }

  async patch<T>(path: string, data: Partial<T>, options?: { description?: string; type?: string }): Promise<T> {
    return this.manager.patch(this.transactionId, path, data, options);
  }

  async delete(path: string, options?: { description?: string; type?: string }): Promise<void> {
    return this.manager.delete(this.transactionId, path, options);
  }

  getTransactionId(): string {
    return this.transactionId;
  }
}

// Singleton instance
let transactionManager: F5TransactionManager | null = null;

export function getTransactionManager(): F5TransactionManager {
  if (!transactionManager) {
    transactionManager = new F5TransactionManager();
  }
  return transactionManager;
}

export function resetTransactionManager(): void {
  transactionManager = null;
}
