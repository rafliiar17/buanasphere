import pino, { type Logger, type LoggerOptions, type DestinationStream } from 'pino';

export interface LogMetadata {
  requestId?: string;
  provider?: string;
  currency_pair?: string;
  duration_ms?: number;
  [key: string]: unknown;
}

export type LogLevel = 'fatal' | 'error' | 'warn' | 'info' | 'debug' | 'trace';

const isProduction = process.env.NODE_ENV === 'production';
const isTest = process.env.NODE_ENV === 'test' || process.env.BUN_ENV === 'test';
const isDevelopment = !isProduction && !isTest;

/**
 * Base options ensuring structured JSON schema:
 * { "time": 1725264000000, "level": "info", "msg": "...", "requestId": "...", ... }
 */
export const baseLoggerOptions: LoggerOptions = {
  level: process.env.LOG_LEVEL || (isProduction ? 'info' : 'debug'),
  timestamp: pino.stdTimeFunctions.epochTime,
  formatters: {
    level: (label: string) => ({ level: label }),
  },
  base: undefined, // Remove pid and hostname for edge/serverless compatibility
};

/**
 * Factory to create a customized Pino instance (useful for unit tests capturing log output).
 */
export function createLogger(
  customOptions?: Partial<LoggerOptions>,
  destination?: DestinationStream
): Logger {
  const options: LoggerOptions = {
    ...baseLoggerOptions,
    ...customOptions,
  };

  if (destination) {
    return pino(options, destination);
  }

  // Use pino-pretty only in interactive local dev when not in test or production
  if (isDevelopment && typeof process !== 'undefined' && process.stdout?.isTTY) {
    try {
      return pino({
        ...options,
        transport: {
          target: 'pino-pretty',
          options: {
            colorize: true,
            translateTime: 'HH:MM:ss Z',
            ignore: 'pid,hostname',
          },
        },
      });
    } catch {
      // Fallback to standard pino if worker thread transport is unavailable
      return pino(options);
    }
  }

  return pino(options);
}

/**
 * Global application singleton logger.
 */
export const logger: Logger = createLogger();

/**
 * Helper to create a child logger with bound contextual metadata.
 */
export function createChildLogger(context: LogMetadata, parentLogger: Logger = logger): Logger {
  return parentLogger.child(context);
}

/**
 * Helper function to log a structured event directly.
 */
export function logEvent(
  level: LogLevel,
  msg: string,
  metadata?: LogMetadata,
  targetLogger: Logger = logger
): void {
  if (metadata) {
    targetLogger[level](metadata, msg);
  } else {
    targetLogger[level](msg);
  }
}
