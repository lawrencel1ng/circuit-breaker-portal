import { PrismaClient } from '@prisma/client';
import { logger } from './logger';

// Global instance for development to prevent multiple instances during hot reload
const globalForPrisma = global as unknown as { prisma: PrismaClient };

export const prisma = globalForPrisma.prisma || new PrismaClient({
  log: process.env.NODE_ENV === 'development' && process.env.PRISMA_LOG_QUERIES === 'true'
    ? ['query', 'info', 'warn', 'error']
    : ['error', 'warn'],
});

// Connection management
let isConnected = false;
let connectionCheckInterval: NodeJS.Timeout | null = null;

/**
 * Connect to the database with retry logic
 */
export async function connectDatabase(retries = 3, delay = 1000): Promise<void> {
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      await prisma.$connect();
      isConnected = true;
      logger.info('Database connected successfully');
      
      // Start health check interval
      startHealthCheck();
      
      return;
    } catch (error: any) {
      logger.error(`Database connection attempt ${attempt}/${retries} failed:`, error.message);
      
      if (attempt === retries) {
        throw new Error(`Failed to connect to database after ${retries} attempts: ${error.message}`);
      }
      
      // Wait before retrying
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
}

/**
 * Disconnect from the database gracefully
 */
export async function disconnectDatabase(): Promise<void> {
  // Stop health check
  if (connectionCheckInterval) {
    clearInterval(connectionCheckInterval);
    connectionCheckInterval = null;
  }
  
  try {
    await prisma.$disconnect();
    isConnected = false;
    logger.info('Database disconnected successfully');
  } catch (error: any) {
    logger.error('Error disconnecting from database:', error.message);
    throw error;
  }
}

/**
 * Check if database is connected
 */
export function isDatabaseConnected(): boolean {
  return isConnected;
}

/**
 * Execute a database operation with automatic reconnection
 */
export async function withDatabase<T>(operation: () => Promise<T>): Promise<T> {
  if (!isConnected) {
    await connectDatabase();
  }
  
  try {
    return await operation();
  } catch (error: any) {
    // Check if error is connection-related
    if (error.message?.includes('connection') || error.code === 'P1001' || error.code === 'P1002') {
      logger.warn('Database connection lost, attempting to reconnect...');
      await connectDatabase();
      // Retry the operation once
      return await operation();
    }
    throw error;
  }
}

/**
 * Health check for database connection
 */
async function checkConnection(): Promise<boolean> {
  try {
    await prisma.$queryRaw`SELECT 1`;
    return true;
  } catch (error) {
    return false;
  }
}

/**
 * Start periodic health check
 */
function startHealthCheck(interval = 30000): void {
  if (connectionCheckInterval) {
    clearInterval(connectionCheckInterval);
  }
  
  connectionCheckInterval = setInterval(async () => {
    const healthy = await checkConnection();
    if (!healthy && isConnected) {
      logger.warn('Database health check failed');
      isConnected = false;
    } else if (healthy && !isConnected) {
      logger.info('Database connection restored');
      isConnected = true;
    }
  }, interval);
}

// Handle graceful shutdown
process.on('SIGINT', async () => {
  logger.info('SIGINT received, closing database connection...');
  await disconnectDatabase();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  logger.info('SIGTERM received, closing database connection...');
  await disconnectDatabase();
  process.exit(0);
});

// Save to global for development hot reload
if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}
