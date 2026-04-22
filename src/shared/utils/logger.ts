import {
  captureSentryException,
  captureSentryMessage,
  addSentryBreadcrumb,
} from "@/shared/config/sentry.config";

export enum LogLevel {
  DEBUG = 0,
  INFO = 1,
  WARN = 2,
  ERROR = 3,
  FATAL = 4,
}

export type LogContext = Record<string, unknown> | string | number | unknown;

export interface LogEntry {
  level: LogLevel;
  message: string;
  context?: LogContext;
  error?: Error;
  timestamp: string;
}

class Logger {
  private minLevel: LogLevel;
  private readonly isDevelopment: boolean;
  private logs: LogEntry[] = [];
  private readonly maxLogs = 1000;

  constructor() {
    this.isDevelopment = import.meta.env.DEV;
    this.minLevel = this.isDevelopment ? LogLevel.DEBUG : LogLevel.INFO;
  }

  debug(message: string, context?: LogContext): void {
    this.log(LogLevel.DEBUG, message, context);
  }

  info(message: string, context?: LogContext): void {
    this.log(LogLevel.INFO, message, context);
  }

  warn(message: string, context?: LogContext): void {
    this.log(LogLevel.WARN, message, context);
  }

  error(message: string, error?: Error | unknown, context?: LogContext): void {
    const errorObj = error instanceof Error ? error : new Error(String(error));
    this.log(LogLevel.ERROR, message, context, errorObj);
  }

  fatal(message: string, error?: Error | unknown, context?: LogContext): void {
    const errorObj = error instanceof Error ? error : new Error(String(error));
    this.log(LogLevel.FATAL, message, context, errorObj);
  }

  private log(
    level: LogLevel,
    message: string,
    context?: LogContext,
    error?: Error,
  ): void {
    if (level < this.minLevel) return;

    const entry: LogEntry = {
      level,
      message,
      context,
      error,
      timestamp: new Date().toISOString(),
    };

    this.logs.push(entry);
    if (this.logs.length > this.maxLogs) this.logs.shift();

    if (this.isDevelopment) {
      this.consoleOutput(entry);
    } else if (level >= LogLevel.WARN) {
      this.sendToMonitoring(entry);
    }
  }

  private consoleOutput(entry: LogEntry): void {
    const contextStr =
      entry.context !== undefined ? ` | ${JSON.stringify(entry.context)}` : "";
    const prefix = ["DEBUG", "INFO", "WARN", "ERROR", "FATAL"][entry.level] ?? "LOG";
    const text = `[${prefix}] ${entry.message}${contextStr}`;

    if (entry.level === LogLevel.DEBUG) console.debug(text);
    else if (entry.level === LogLevel.INFO) console.info(text);
    else if (entry.level === LogLevel.WARN) console.warn(text);
    else console.error(text, entry.error);
  }

  private sendToMonitoring(entry: LogEntry): void {
    const context =
      typeof entry.context === "object" && entry.context !== null
        ? (entry.context as Record<string, unknown>)
        : undefined;

    if (entry.level >= LogLevel.ERROR) {
      if (entry.error) {
        captureSentryException(entry.error, context);
      } else {
        captureSentryMessage(entry.message, "error", context);
      }
    } else if (entry.level === LogLevel.WARN) {
      captureSentryMessage(entry.message, "warning", context);
    }

    addSentryBreadcrumb(
      entry.message,
      "log",
      entry.level >= LogLevel.ERROR
        ? "error"
        : entry.level === LogLevel.WARN
          ? "warning"
          : "info",
      context,
    );
  }

  getLogs(level?: LogLevel): LogEntry[] {
    if (level === undefined) return [...this.logs];
    return this.logs.filter((log) => log.level === level);
  }

  clearLogs(): void {
    this.logs = [];
  }

  setMinLevel(level: LogLevel): void {
    this.minLevel = level;
  }

  exportLogs(): string {
    return JSON.stringify(this.logs, null, 2);
  }

  async flush(): Promise<void> {
    return Promise.resolve();
  }

  destroy(): void {
    // noop
  }
}

export const logger = new Logger();
export default logger;
