/**
 * Structured logging utility
 * Replaces console.log with proper logging
 */

type LogLevel = 'debug' | 'info' | 'warn' | 'error';

interface LogEntry {
  timestamp: string;
  level: LogLevel;
  message: string;
  context?: string;
  data?: any;
  error?: Error;
}

class Logger {
  private static instance: Logger;
  private logs: LogEntry[] = [];
  private maxLogs = 1000;

  private constructor() {}

  static getInstance(): Logger {
    if (!Logger.instance) {
      Logger.instance = new Logger();
    }
    return Logger.instance;
  }

  private log(level: LogLevel, message: string, context?: string, data?: any, error?: Error) {
    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level,
      message,
      context,
      data,
      error
    };

    // Store in memory (limited)
    this.logs.unshift(entry);
    if (this.logs.length > this.maxLogs) {
      this.logs.pop();
    }

    // Console output with formatting
    const prefix = `[${entry.timestamp}] [${level.toUpperCase()}]${context ? ` [${context}]` : ''}`;
    
    switch (level) {
      case 'debug':
        if (process.env.NODE_ENV === 'development') {
          console.debug(prefix, message, data || '');
        }
        break;
      case 'info':
        console.info(prefix, message, data || '');
        break;
      case 'warn':
        console.warn(prefix, message, data || '');
        break;
      case 'error':
        console.error(prefix, message, error?.stack || data || '');
        break;
    }

    // TODO: Send to external logging service (Splunk, ELK, etc.)
    // this.sendToExternalService(entry);
  }

  debug(message: string, data?: any) {
    this.log('debug', message, undefined, data);
  }

  info(message: string, data?: any) {
    this.log('info', message, undefined, data);
  }

  warn(message: string, data?: any) {
    this.log('warn', message, undefined, data);
  }

  error(message: string, error?: any) {
    this.log('error', message, undefined, undefined, error instanceof Error ? error : new Error(String(error)));
  }

  getLogs(level?: LogLevel, limit = 100): LogEntry[] {
    let filtered = this.logs;
    if (level) {
      filtered = this.logs.filter(log => log.level === level);
    }
    return filtered.slice(0, limit);
  }

  clear() {
    this.logs = [];
  }
}

export const logger = Logger.getInstance();
