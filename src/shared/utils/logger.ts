/**
 * Sistema de logging centralizado - nivel AAA
 *
 * Integrado com Sentry para monitoramento em producao.
 * Integrado com Supabase para persistência de logs.
 *
 * @version 4.0.0
 */

import {
  captureSentryException,
  captureSentryMessage,
  addSentryBreadcrumb,
} from "@/shared/config/sentry.config";
import { ApplicationLogService } from "@/core/telemetry/services/ApplicationLogService";

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
  private persistQueue: LogEntry[] = [];
  private persistTimer: NodeJS.Timeout | null = null;
  private readonly PERSIST_INTERVAL = 5000; // 5 segundos
  private readonly PERSIST_BATCH_SIZE = 50;

  constructor() {
    this.isDevelopment = import.meta.env.DEV;
    this.minLevel = this.isDevelopment ? LogLevel.DEBUG : LogLevel.INFO;
    
    // Iniciar flush periódico em produção
    if (!this.isDevelopment) {
      this.startPeriodicFlush();
    }
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

    // Enviar para Sentry em produção (erros e warnings)
    if (!this.isDevelopment && level >= LogLevel.WARN) {
      this.sendToMonitoring(entry);
    }

    // Adicionar à fila de persistência (apenas warn, error, fatal)
    if (!this.isDevelopment && level >= LogLevel.WARN) {
      this.queueForPersistence(entry);
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

  private getLevelString(level: LogLevel): 'debug' | 'info' | 'warn' | 'error' | 'fatal' {
    switch (level) {
      case LogLevel.DEBUG:
        return 'debug';
      case LogLevel.INFO:
        return 'info';
      case LogLevel.WARN:
        return 'warn';
      case LogLevel.ERROR:
        return 'error';
      case LogLevel.FATAL:
        return 'fatal';
      default:
        return 'info';
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

  /**
   * Adiciona log à fila de persistência
   */
  private queueForPersistence(entry: LogEntry): void {
    this.persistQueue.push(entry);
    
    // Flush imediato se a fila estiver cheia
    if (this.persistQueue.length >= this.PERSIST_BATCH_SIZE) {
      this.flushPersistQueue();
    }
  }

  /**
   * Inicia flush periódico da fila
   */
  private startPeriodicFlush(): void {
    this.persistTimer = setInterval(() => {
      if (this.persistQueue.length > 0) {
        this.flushPersistQueue();
      }
    }, this.PERSIST_INTERVAL);
  }

  /**
   * Persiste logs no Supabase
   */
  private async flushPersistQueue(): Promise<void> {
    if (this.persistQueue.length === 0) return;

    const batch = this.persistQueue.splice(0, this.PERSIST_BATCH_SIZE);

    try {
      const records = batch.map(entry => ({
        level: this.getLevelString(entry.level),
        message: entry.message,
        context: entry.context || {},
        url: window.location.href,
        user_agent: navigator.userAgent,
        session_id: this.getSessionId(),
      }));

      await ApplicationLogService.insert(records);
    } catch (error) {
      // Falha silenciosa - não queremos que logging quebre a aplicação
      if (batch.length < 100) {
        this.persistQueue.unshift(...batch);
      }
      if (this.isDevelopment) {
        console.error('Failed to persist logs:', error);
      }
    }
  }

  /**
   * Obtém ou cria session ID
   */
  private getSessionId(): string {
    let sessionId = sessionStorage.getItem('log_session_id');
    
    if (!sessionId) {
      sessionId = `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
      sessionStorage.setItem('log_session_id', sessionId);
    }
    
    return sessionId;
  }

  /**
   * Força flush imediato da fila
   */
  async flush(): Promise<void> {
    await this.flushPersistQueue();
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

  /**
   * Cleanup ao desmontar
   */
  destroy(): void {
    if (this.persistTimer) {
      clearInterval(this.persistTimer);
      this.persistTimer = null;
    }
    this.flush();
  }
}

export const logger = new Logger();
export default logger;

// Flush logs antes de sair da página
if (typeof window !== 'undefined') {
  window.addEventListener('beforeunload', () => {
    logger.flush();
  });
}





