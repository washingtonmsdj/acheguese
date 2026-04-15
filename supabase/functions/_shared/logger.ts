/**
 * Structured Logger
 * 
 * Logger estruturado para uso em todas as edge functions.
 * Substitui console.log/error/warn por logging estruturado com contexto.
 */

// ============================================================================
// TYPES
// ============================================================================

export type LogLevel = "debug" | "info" | "warn" | "error";

export interface LogEntry {
  timestamp: string;
  level: LogLevel;
  message: string;
  data?: unknown;
  function: string;
  sessionId?: string;
}

export interface Logger {
  debug: (message: string, data?: unknown, sessionId?: string) => void;
  info: (message: string, data?: unknown, sessionId?: string) => void;
  warn: (message: string, data?: unknown, sessionId?: string) => void;
  error: (message: string, error?: unknown, sessionId?: string) => void;
}

// ============================================================================
// CONFIGURATION
// ============================================================================

/**
 * Nível mínimo de log a ser exibido
 * Em produção, deve ser "info" ou "warn"
 * Em desenvolvimento, pode ser "debug"
 */
const MIN_LOG_LEVEL: LogLevel = "info"; // TODO: Ler de env var

const LOG_LEVELS: Record<LogLevel, number> = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3
};

// ============================================================================
// LOGGER
// ============================================================================

function shouldLog(level: LogLevel): boolean {
  return LOG_LEVELS[level] >= LOG_LEVELS[MIN_LOG_LEVEL];
}

function log(
  level: LogLevel,
  message: string,
  data?: unknown,
  functionName?: string,
  sessionId?: string
): void {
  if (!shouldLog(level)) {
    return;
  }

  const entry: LogEntry = {
    timestamp: new Date().toISOString(),
    level,
    message,
    data: data instanceof Error ? { message: data.message, stack: data.stack } : data,
    function: functionName || "unknown",
    sessionId,
  };

  const logMessage = `[${entry.timestamp}] [${entry.function}] [${entry.level.toUpperCase()}] ${entry.message}`;
  
  switch (level) {
    case "debug":
      console.log(logMessage, entry.data ? JSON.stringify(entry.data, null, 2) : "");
      break;
    case "info":
      console.log(logMessage, entry.data ? JSON.stringify(entry.data, null, 2) : "");
      break;
    case "warn":
      console.warn(logMessage, entry.data ? JSON.stringify(entry.data, null, 2) : "");
      break;
    case "error":
      console.error(logMessage, entry.data ? JSON.stringify(entry.data, null, 2) : "");
      break;
  }
}

/**
 * Cria um logger para uma função específica
 * 
 * @param functionName - Nome da função (para contexto nos logs)
 * @returns Logger com métodos debug, info, warn, error
 */
export function createLogger(functionName: string): Logger {
  return {
    debug: (message: string, data?: unknown, sessionId?: string) => 
      log("debug", message, data, functionName, sessionId),
    info: (message: string, data?: unknown, sessionId?: string) => 
      log("info", message, data, functionName, sessionId),
    warn: (message: string, data?: unknown, sessionId?: string) => 
      log("warn", message, data, functionName, sessionId),
    error: (message: string, error?: unknown, sessionId?: string) => 
      log("error", message, error, functionName, sessionId),
  };
}
