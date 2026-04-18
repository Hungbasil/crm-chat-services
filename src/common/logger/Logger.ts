/**
 * Log Levels
 */
export enum LogLevel {
  DEBUG = 'DEBUG',
  INFO = 'INFO',
  WARN = 'WARN',
  ERROR = 'ERROR'
}

/**
 * Structured Logger
 */
export class Logger {
  private context: string;

  constructor(context: string) {
    this.context = context;
  }

  /**
   * Format log message with metadata
   */
  private formatLog(
    level: LogLevel,
    message: string,
    data?: any
  ): string {
    const timestamp = new Date().toISOString();
    const logEntry = {
      timestamp,
      level,
      context: this.context,
      message,
      ...(data && { data })
    };
    return JSON.stringify(logEntry);
  }

  /**
   * Debug log
   */
  debug(message: string, data?: any): void {
    if (process.env.NODE_ENV === 'development') {
      console.debug(this.formatLog(LogLevel.DEBUG, message, data));
    }
  }

  /**
   * Info log
   */
  info(message: string, data?: any): void {
    console.log(this.formatLog(LogLevel.INFO, message, data));
  }

  /**
   * Warn log
   */
  warn(message: string, data?: any): void {
    console.warn(this.formatLog(LogLevel.WARN, message, data));
  }

  /**
   * Error log
   */
  error(message: string, error?: any, data?: any): void {
    console.error(
      this.formatLog(LogLevel.ERROR, message, {
        error: error?.message || error,
        stack: error?.stack,
        ...data
      })
    );
  }

  /**
   * Create child logger with additional context
   */
  child(childContext: string): Logger {
    return new Logger(`${this.context}:${childContext}`);
  }
}

/**
 * Get logger instance for a module
 */
export function getLogger(moduleName: string): Logger {
  return new Logger(moduleName);
}
