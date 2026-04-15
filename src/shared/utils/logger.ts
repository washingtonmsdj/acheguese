/**
 * Sistema de logging centralizado - nivel AAA
 *
 * Integrado com Sentry para monitoramento em producao.
 *
 * @version 3.0.0
 */

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

export interface LogContextObject {
  component?: string;
  action?: string;
  userId?: string;
  profileId?: string;
  [key: string]: unknown;
}

export interface LogEntry {
  level: LogLevel;
  message: string;
  context?: LogContext;
  error?: Error;
  timestamp: string;
}

class Logger {
  private minLevel: LogLevel;
  private isDevelopment: boolean;
  private logs: LogEntry[] = [];
  private maxLogs = 1000;

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

    const contextObj =
      typeof context === "object" && context !== null
        ? (context as Record<string, unknown>)
        : { value: context };

    const entry: LogEntry = {
      level,
      message,
      context: { ...contextObj, timestamp: new Date().toISOString() },
      error,
      timestamp: new Date().toISOString(),
    };

    this.storeLogs(entry);

    if (this.isDevelopment) {
      this.consoleOutput(entry);
    }

    if (!this.isDevelopment && level >= LogLevel.ERROR) {
      this.sendToMonitoring(entry);
    }
  }

  private consoleOutput(entry: LogEntry): void {
    const { level, message, context, error } = entry;
    const prefix = this.getLevelPrefix(level);
    const contextStr = context ? ` | ${JSON.stringify(context)}` : "";

    switch (level) {
      case LogLevel.DEBUG:
        console.debug(`${prefix} ${message}${contextStr}`);
        break;
      case LogLevel.INFO:
        console.info(`${prefix} ${message}${contextStr}`);
        break;
      case LogLevel.WARN:
        console.warn(`${prefix} ${message}${contextStr}`);
        break;
      case LogLevel.ERROR:
      case LogLevel.FATAL:
        console.error(`${prefix} ${message}${contextStr}`, error);
        break;
    }
  }

  private getLevelPrefix(level: LogLevel): string {
    switch (level) {
      case LogLevel.DEBUG:
        return "[DEBUG]";
      case LogLevel.INFO:
        return "[INFO]";
      case LogLevel.WARN:
        return "[WARN]";
      case LogLevel.ERROR:
        return "[ERROR]";
      case LogLevel.FATAL:
        return "[FATAL]";
      default:
        return "[LOG]";
    }
  }

  private storeLogs(entry: LogEntry): void {
    this.logs.push(entry);
    if (this.logs.length > this.maxLogs) this.logs.shift();
  }

  private sendToMonitoring(entry: LogEntry): void {
    try {
      const { level, message, context, error } = entry;
      
      // Enviar para Sentry baseado no nivel
      if (level === LogLevel.FATAL || level === LogLevel.ERROR) {
        if (error) {
          captureSentryException(error, context as Record<string, unknown>);
        } else {
          captureSentryMessage(
            message,
            level === LogLevel.FATAL ? 'fatal' : 'error',
            context as Record<string, unknown>
          );
        }
      } else if (level === LogLevel.WARN) {
        captureSentryMessage(
          message,
          'warning',
          context as Record<string, unknown>
        );
      }
      
      // Adicionar breadcrumb para todos os niveis
      addSentryBreadcrumb(
        message,
        'log',
        this.getSentryLevel(level),
        context as Record<string, unknown>
      );
    } catch {
      // Falha silenciosa
    }
  }

  private getSentryLevel(level: LogLevel): 'debug' | 'info' | 'warning' | 'error' | 'fatal' {
    switch (level) {
      case LogLevel.DEBUG:
        return 'debug';
      case LogLevel.INFO:
        return 'info';
      case LogLevel.WARN:
        return 'warning';
      case LogLevel.ERROR:
        return 'error';
      case LogLevel.FATAL:
        return 'fatal';
      default:
        return 'info';
    }
  }

  getLogs(level?: LogLevel): LogEntry[] {
    if (level !== undefined)
      return this.logs.filter((log) => log.level === level);
    return [...this.logs];
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
}

export const logger = new Logger();
export default logger;





