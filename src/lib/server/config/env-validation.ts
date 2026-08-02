/**
 * Environment Variable Validation
 * Validates required environment variables at startup
 */

import { logger } from '../logger';

interface EnvVarConfig {
  name: string;
  required: boolean;
  defaultValue?: string;
  validator?: (value: string) => boolean | string;
}

// Environment variable definitions
const ENV_VARS: EnvVarConfig[] = [
  {
    name: 'DATABASE_URL',
    required: true,
    validator: (value) => value.startsWith('file:') || value.startsWith('postgres:') || 'Must be a valid database URL'
  },
  {
    name: 'JWT_SECRET',
    required: true,
    validator: (value) => {
      if (value.length < 32) return 'Must be at least 32 characters long';
      if (value === 'default-secret-change-in-production') return 'Must be changed from default value';
      return true;
    }
  },
  {
    name: 'SESSION_SECRET',
    required: true,
    validator: (value) => {
      if (value.length < 32) return 'Must be at least 32 characters long';
      if (value === 'your-super-secret-session-key-change-in-production') return 'Must be changed from default value';
      return true;
    }
  },
  {
    name: 'NODE_ENV',
    required: false,
    defaultValue: 'development',
    validator: (value) => ['development', 'production', 'test'].includes(value) || 'Must be development, production, or test'
  },
  {
    name: 'F5_HOST',
    required: false,
    defaultValue: 'https://bigip-mgmt.bank.com'
  },
  {
    name: 'F5_USERNAME',
    required: false,
    defaultValue: 'admin'
  },
  {
    name: 'F5_PASSWORD',
    required: false,
    defaultValue: ''
  },
  {
    name: 'F5_VERIFY_SSL',
    required: false,
    defaultValue: 'true'
  },
  {
    name: 'LOG_LEVEL',
    required: false,
    defaultValue: 'info',
    validator: (value) => ['debug', 'info', 'warn', 'error'].includes(value) || 'Must be debug, info, warn, or error'
  },
  {
    name: 'COOKIE_SECURE',
    required: false,
    defaultValue: 'false'
  },
  {
    name: 'API_TIMEOUT',
    required: false,
    defaultValue: '30000',
    validator: (value) => !isNaN(parseInt(value)) || 'Must be a valid number'
  }
];

interface ValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
  configured: Record<string, string>;
}

/**
 * Validate all environment variables
 */
export function validateEnv(): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];
  const configured: Record<string, string> = {};

  for (const envVar of ENV_VARS) {
    const value = process.env[envVar.name];

    if (!value || value.trim() === '') {
      if (envVar.required) {
        errors.push(`Required environment variable ${envVar.name} is not set`);
      } else if (envVar.defaultValue !== undefined) {
        warnings.push(`${envVar.name} not set, using default: ${envVar.defaultValue}`);
        process.env[envVar.name] = envVar.defaultValue;
        configured[envVar.name] = envVar.defaultValue;
      }
      continue;
    }

    // Run validator if provided
    if (envVar.validator) {
      const result = envVar.validator(value);
      if (result !== true) {
        errors.push(`${envVar.name} validation failed: ${result}`);
        continue;
      }
    }

    configured[envVar.name] = value;
  }

  // Additional security checks
  if (process.env.NODE_ENV === 'production') {
    if (process.env.F5_VERIFY_SSL === 'false') {
      warnings.push('F5_VERIFY_SSL is set to false in production - this is insecure');
    }
    if (process.env.COOKIE_SECURE !== 'true') {
      warnings.push('COOKIE_SECURE should be set to true in production');
    }
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
    configured
  };
}

/**
 * Validate and log results, exit if invalid
 */
export function validateAndExit(): void {
  const result = validateEnv();

  // Log warnings
  for (const warning of result.warnings) {
    logger.warn(`Environment: ${warning}`);
  }

  // Log configured variables (with sensitive data masked)
  for (const [name, value] of Object.entries(result.configured)) {
    const isSensitive = /secret|password|token|key/i.test(name);
    const displayValue = isSensitive ? '*'.repeat(Math.min(value.length, 8)) : value;
    logger.info(`Environment: ${name}=${displayValue}`);
  }

  // Exit if validation failed
  if (!result.valid) {
    logger.error('Environment validation failed:');
    for (const error of result.errors) {
      logger.error(`  - ${error}`);
    }
    logger.error('\nPlease check your .env file and ensure all required variables are set.');
    process.exit(1);
  }

  logger.info('Environment validation passed');
}

/**
 * Get a typed environment variable
 */
export function getEnv(name: string, defaultValue?: string): string {
  return process.env[name] ?? defaultValue ?? '';
}

/**
 * Get a numeric environment variable
 */
export function getEnvNumber(name: string, defaultValue: number): number {
  const value = process.env[name];
  if (!value) return defaultValue;
  const parsed = parseInt(value, 10);
  return isNaN(parsed) ? defaultValue : parsed;
}

/**
 * Get a boolean environment variable
 */
export function getEnvBoolean(name: string, defaultValue: boolean): boolean {
  const value = process.env[name];
  if (!value) return defaultValue;
  return value.toLowerCase() === 'true' || value === '1';
}
