import { createLogger, transports, format, Logger as WinstonLogger } from 'winston';
import { mkdirSync } from 'fs';

type LogLevel = 'error' | 'warn' | 'info' | 'debug' | 'verbose';

/**
 * Singleton Winston logger. Log level is controlled by the LOG_LEVEL environment variable.
 * This is the framework's internal log stream — separate from Allure step annotations.
 *
 *   LOG_LEVEL=debug npm run test:regression   → full detail locally
 *   LOG_LEVEL=warn  npx playwright test        → only warnings in CI
 *
 * All logs  → logs/test-run.log   (overwritten each run)
 * Error logs → logs/test-errors.log (error level only, overwritten each run)
 *
 * When running multiple spec files, call Logger.startSpec(specName) in beforeAll
 * to write a separator so the combined log stays scannable.
 */
export class Logger {
  private static instance: WinstonLogger;
  private static lastSpec: string | undefined;

  static getInstance(): WinstonLogger {
    if (!Logger.instance) {
      const level: LogLevel = (process.env.LOG_LEVEL as LogLevel) ?? 'info';

      mkdirSync('logs', { recursive: true });

      const sharedFormat = format.combine(
        format.timestamp({ format: 'HH:mm:ss.SSS' }),
        format.printf(({ timestamp, level, message, ...meta }) => {
          const metaStr = Object.keys(meta).length ? ` ${JSON.stringify(meta)}` : '';
          return `[${timestamp as string}] ${level.toUpperCase().padEnd(7)} ${message as string}${metaStr}`;
        })
      );

      // Error transport uses errors() to capture stack traces when present.
      const errorFormat = format.combine(
        format.errors({ stack: true }),
        format.timestamp({ format: 'HH:mm:ss.SSS' }),
        format.printf(({ timestamp, level, message, stack, ...meta }) => {
          const metaStr = Object.keys(meta).length ? ` ${JSON.stringify(meta)}` : '';
          const stackStr = stack ? `\n${stack as string}` : '';
          return `[${timestamp as string}] ${level.toUpperCase().padEnd(7)} ${message as string}${metaStr}${stackStr}`;
        })
      );

      Logger.instance = createLogger({
        level,
        format: sharedFormat,
        transports: [
          new transports.Console(),
          new transports.File({ filename: 'logs/test-run.log', options: { flags: 'w' } }),
          // Captures only error-level entries; includes stack traces when available.
          new transports.File({ filename: 'logs/test-errors.log', level: 'error', format: errorFormat, options: { flags: 'w' } }),
        ],
      });
    }

    return Logger.instance;
  }

  /**
   * Write a visible separator into the combined log so spec boundaries are clear
   * when multiple spec files run in one session.
   *
   * Deduplicated — safe to call from an auto-use per-test fixture; the separator
   * is written only once each time the spec file name changes.
   *
   * Wired automatically via the _specLogger auto-use fixture in baseFixtures.ts.
   * You can also call it manually from test.beforeAll if preferred.
   */
  static startSpec(specName: string): void {
    if (Logger.lastSpec === specName) return;
    Logger.lastSpec = specName;

    const separator = '='.repeat(72);
    const log = Logger.getInstance();
    log.info(separator);
    log.info(`SPEC  ${specName}`);
    log.info(separator);
  }
}
