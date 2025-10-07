// src/lib/logger.ts
interface LogLevel {
  ERROR: number;
  WARN: number;
  INFO: number;
  DEBUG: number;
}

const LOG_LEVELS: LogLevel = {
  ERROR: 0,
  WARN: 1,
  INFO: 2,
  DEBUG: 3,
};

class Logger {
  private currentLevel: number;
  private context: string;

  constructor(context: string = 'APP') {
    this.context = context;
    this.currentLevel = process.env.NODE_ENV === 'production' 
      ? LOG_LEVELS.INFO 
      : LOG_LEVELS.DEBUG;
  }

  private shouldLog(level: number): boolean {
    return level <= this.currentLevel;
  }

  private formatMessage(level: string, message: string, data?: any): string {
    const timestamp = new Date().toISOString();
    const baseMessage = `[${timestamp}] [${level}] [${this.context}] ${message}`;
    
    if (data) {
      return `${baseMessage} ${JSON.stringify(data, null, 2)}`;
    }
    
    return baseMessage;
  }

  error(message: string, error?: Error | any, context?: any): void {
    if (!this.shouldLog(LOG_LEVELS.ERROR)) return;
    
    const logData = {
      ...(context && { context }),
      ...(error && { 
        error: {
          message: error.message,
          stack: error.stack,
          name: error.name,
        }
      }),
    };
    
    console.error(this.formatMessage('ERROR', message, logData));
    
    // In production, send to external logging service
    if (process.env.NODE_ENV === 'production') {
      this.sendToExternalLogger('error', message, logData);
    }
  }

  warn(message: string, data?: any): void {
    if (!this.shouldLog(LOG_LEVELS.WARN)) return;
    console.warn(this.formatMessage('WARN', message, data));
    
    if (process.env.NODE_ENV === 'production') {
      this.sendToExternalLogger('warn', message, data);
    }
  }

  info(message: string, data?: any): void {
    if (!this.shouldLog(LOG_LEVELS.INFO)) return;
    console.info(this.formatMessage('INFO', message, data));
  }

  debug(message: string, data?: any): void {
    if (!this.shouldLog(LOG_LEVELS.DEBUG)) return;
    console.debug(this.formatMessage('DEBUG', message, data));
  }

  // Performance monitoring
  time(label: string): void {
    if (process.env.NODE_ENV === 'development') {
      console.time(`[${this.context}] ${label}`);
    }
  }

  timeEnd(label: string): void {
    if (process.env.NODE_ENV === 'development') {
      console.timeEnd(`[${this.context}] ${label}`);
    }
  }

  // User action tracking
  trackUserAction(action: string, userId?: string, metadata?: any): void {
    const logData = {
      action,
      userId,
      timestamp: new Date().toISOString(),
      ...metadata,
    };
    
    this.info('User action', logData);
    
    // In production, send to analytics service
    if (process.env.NODE_ENV === 'production') {
      this.sendToAnalytics(logData);
    }
  }

  // API request logging
  logApiRequest(method: string, path: string, statusCode: number, duration: number, userId?: string): void {
    const logData = {
      method,
      path,
      statusCode,
      duration,
      userId,
      timestamp: new Date().toISOString(),
    };
    
    if (statusCode >= 400) {
      this.warn('API request failed', logData);
    } else {
      this.info('API request', logData);
    }
  }

  // Database operation logging
  logDatabaseOperation(operation: string, table: string, duration: number, error?: Error): void {
    const logData = {
      operation,
      table,
      duration,
      timestamp: new Date().toISOString(),
    };
    
    if (error) {
      this.error('Database operation failed', error, logData);
    } else {
      this.debug('Database operation', logData);
    }
  }

  private async sendToExternalLogger(level: string, message: string, data?: any): Promise<void> {
    try {
      // Implement external logging service integration here
      // Example: Sentry, LogRocket, DataDog, etc.
      // 
      // await fetch('/api/logs', {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify({ level, message, data, timestamp: new Date().toISOString() })
      // });
    } catch (error) {
      console.error('Failed to send log to external service:', error);
    }
  }

  private async sendToAnalytics(data: any): Promise<void> {
    try {
      // Implement analytics service integration here
      // Example: Google Analytics, Mixpanel, Amplitude, etc.
    } catch (error) {
      console.error('Failed to send analytics data:', error);
    }
  }
}

// Create default logger instances
export const logger = new Logger('APP');
export const apiLogger = new Logger('API');
export const dbLogger = new Logger('DB');
export const authLogger = new Logger('AUTH');

// Create logger with custom context
export function createLogger(context: string): Logger {
  return new Logger(context);
}

// Performance measurement utility
export function measurePerformance<T>(fn: () => T | Promise<T>, label: string): T | Promise<T> {
  const startTime = performance.now();
  
  try {
    const result = fn();
    
    if (result instanceof Promise) {
      return result.finally(() => {
        const duration = performance.now() - startTime;
        logger.debug(`Performance: ${label}`, { duration: `${duration.toFixed(2)}ms` });
      });
    }
    
    const duration = performance.now() - startTime;
    logger.debug(`Performance: ${label}`, { duration: `${duration.toFixed(2)}ms` });
    return result;
  } catch (error) {
    const duration = performance.now() - startTime;
    logger.error(`Performance: ${label} failed`, error, { duration: `${duration.toFixed(2)}ms` });
    throw error;
  }
}