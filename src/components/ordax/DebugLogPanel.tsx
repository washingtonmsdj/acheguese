/**
 * DebugLogPanel - Painel de logs robusto para rastrear geração de jogos
 * Mostra: quem chama quem, qual etapa, erros, fase, arquivo, causa
 */

import { useState, useEffect, useRef } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";

// ============================================================================
// TYPES
// ============================================================================

import type { CompilerPhase } from "@/lib/ordax/types";

export type LogLevel = "info" | "success" | "warning" | "error" | "debug";
// ✅ SSOT: Usar CompilerPhase de types.ts + execution
export type LogPhase = CompilerPhase | "execution";

export interface LogEntry {
  id: string;
  timestamp: number;
  level: LogLevel;
  phase?: LogPhase;
  caller: string; // Quem chamou (arquivo/função)
  callee?: string; // Quem foi chamado
  message: string;
  details?: Record<string, any>;
  error?: {
    message: string;
    type: string;
    stack?: string;
    cause?: string;
  };
  file?: string; // Arquivo sendo processado
  sessionId?: string;
  requestId?: string;
}

// ============================================================================
// GLOBAL LOG STORE
// ============================================================================

class LogStore {
  private logs: LogEntry[] = [];
  private listeners: Set<(logs: LogEntry[]) => void> = new Set();
  private maxLogs = 500;

  add(entry: Omit<LogEntry, "id" | "timestamp">) {
    const logEntry: LogEntry = {
      ...entry,
      id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      timestamp: Date.now(),
    };

    this.logs.push(logEntry);

    // Limitar número de logs
    if (this.logs.length > this.maxLogs) {
      this.logs = this.logs.slice(-this.maxLogs);
    }

    // Notificar listeners
    this.listeners.forEach((listener) => listener([...this.logs]));

    // Log no console também
    this.logToConsole(logEntry);
  }

  private logToConsole(entry: LogEntry) {
    const prefix = `[${entry.caller}${entry.phase ? ` | ${entry.phase}` : ""}]`;
    const style = this.getConsoleStyle(entry.level);

    if (entry.error) {
      console.error(`${prefix} ❌`, entry.message, entry.error, entry.details);
    } else if (entry.level === "warning") {
      console.warn(`${prefix} ⚠️`, entry.message, entry.details);
    } else if (entry.level === "success") {
      console.log(`${prefix} ✅`, entry.message, entry.details);
    } else if (entry.level === "debug") {
      console.debug(`${prefix} 🔍`, entry.message, entry.details);
    } else {
      console.log(`${prefix} ℹ️`, entry.message, entry.details);
    }
  }

  private getConsoleStyle(level: LogLevel): string {
    switch (level) {
      case "error": return "color: #ef4444; font-weight: bold;";
      case "warning": return "color: #f59e0b; font-weight: bold;";
      case "success": return "color: #10b981; font-weight: bold;";
      case "debug": return "color: #6b7280;";
      default: return "color: #3b82f6;";
    }
  }

  subscribe(listener: (logs: LogEntry[]) => void) {
    this.listeners.add(listener);
    listener([...this.logs]); // Enviar logs atuais
    return () => {
      this.listeners.delete(listener);
    };
  }

  clear() {
    this.logs = [];
    this.listeners.forEach((listener) => listener([]));
  }

  getLogs() {
    return [...this.logs];
  }
}

export const logStore = new LogStore();

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

export function logInfo(
  caller: string,
  message: string,
  details?: Record<string, any>,
  phase?: LogPhase
) {
  logStore.add({ level: "info", caller, message, details, phase });
}

export function logSuccess(
  caller: string,
  message: string,
  details?: Record<string, any>,
  phase?: LogPhase
) {
  logStore.add({ level: "success", caller, message, details, phase });
}

export function logWarning(
  caller: string,
  message: string,
  details?: Record<string, any>,
  phase?: LogPhase
) {
  logStore.add({ level: "warning", caller, message, details, phase });
}

export function logError(
  caller: string,
  message: string,
  error?: Error | any,
  details?: Record<string, any>,
  phase?: LogPhase
) {
  logStore.add({
    level: "error",
    caller,
    message,
    error: error ? {
      message: error.message || String(error),
      type: error.constructor?.name || "Error",
      stack: error.stack,
      cause: error.cause ? String(error.cause) : undefined,
    } : undefined,
    details,
    phase,
  });
}

export function logDebug(
  caller: string,
  message: string,
  details?: Record<string, any>,
  phase?: LogPhase
) {
  logStore.add({ level: "debug", caller, message, details, phase });
}

export function logCall(
  caller: string,
  callee: string,
  message: string,
  details?: Record<string, any>,
  phase?: LogPhase
) {
  logStore.add({ level: "info", caller, callee, message, details, phase });
}

// ============================================================================
// COMPONENT
// ============================================================================

export function DebugLogPanel() {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [filter, setFilter] = useState<LogLevel | "all">("all");
  const [phaseFilter, setPhaseFilter] = useState<LogPhase | "all">("all");
  const scrollRef = useRef<HTMLDivElement>(null);
  const [autoScroll, setAutoScroll] = useState(true);

  useEffect(() => {
    const unsubscribe = logStore.subscribe(setLogs);
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (autoScroll && scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [logs, autoScroll]);

  const filteredLogs = logs.filter((log) => {
    if (filter !== "all" && log.level !== filter) return false;
    if (phaseFilter !== "all" && log.phase !== phaseFilter) return false;
    return true;
  });

  const getLevelIcon = (level: LogLevel) => {
    switch (level) {
      case "error": return "❌";
      case "warning": return "⚠️";
      case "success": return "✅";
      case "debug": return "🔍";
      default: return "ℹ️";
    }
  };

  const getLevelColor = (level: LogLevel) => {
    switch (level) {
      case "error": return "bg-red-500";
      case "warning": return "bg-yellow-500";
      case "success": return "bg-green-500";
      case "debug": return "bg-gray-500";
      default: return "bg-blue-500";
    }
  };

  const getPhaseColor = (phase?: LogPhase) => {
    if (!phase) return "bg-gray-600";
    switch (phase) {
      case "interpretation": return "bg-purple-600";
      case "plan": return "bg-blue-600";
      case "validation": return "bg-yellow-600";
      case "confirmation": return "bg-green-600";
      case "compilation": return "bg-orange-600";
      case "execution": return "bg-red-600";
      default: return "bg-gray-600";
    }
  };

  const formatTime = (timestamp: number) => {
    const date = new Date(timestamp);
    const time = date.toLocaleTimeString("pt-BR", {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });
    const ms = date.getMilliseconds().toString().padStart(3, '0');
    return `${time}.${ms}`;
  };

  const errorCount = logs.filter((l) => l.level === "error").length;
  const warningCount = logs.filter((l) => l.level === "warning").length;

  if (!isOpen) {
    return (
      <div className="fixed bottom-4 right-4 z-50">
        <Button
          onClick={() => setIsOpen(true)}
          variant="outline"
          className="shadow-lg"
        >
          🔍 Debug Logs
          {errorCount > 0 && (
            <Badge variant="destructive" className="ml-2">
              {errorCount}
            </Badge>
          )}
          {warningCount > 0 && (
            <Badge variant="secondary" className="ml-2">
              {warningCount}
            </Badge>
          )}
        </Button>
      </div>
    );
  }

  return (
    <Card className="fixed bottom-4 right-4 w-[800px] h-[600px] z-50 shadow-2xl flex flex-col">
      {/* Header */}
      <div className="p-4 border-b flex items-center justify-between bg-gray-50 dark:bg-gray-900">
        <div className="flex items-center gap-4">
          <h3 className="font-bold text-lg">🔍 Debug Logs</h3>
          <Badge variant="outline">{filteredLogs.length} logs</Badge>
          {errorCount > 0 && (
            <Badge variant="destructive">{errorCount} erros</Badge>
          )}
          {warningCount > 0 && (
            <Badge variant="secondary">{warningCount} avisos</Badge>
          )}
        </div>
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={() => setAutoScroll(!autoScroll)}
          >
            {autoScroll ? "🔒 Auto-scroll" : "🔓 Manual"}
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => logStore.clear()}
          >
            🗑️ Limpar
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => setIsOpen(false)}
          >
            ✕
          </Button>
        </div>
      </div>

      {/* Filters */}
      <div className="p-2 border-b flex items-center gap-2 bg-gray-50 dark:bg-gray-900">
        <span className="text-sm font-medium">Nível:</span>
        {(["all", "error", "warning", "success", "info", "debug"] as const).map((level) => (
          <Button
            key={level}
            size="sm"
            variant={filter === level ? "default" : "ghost"}
            onClick={() => setFilter(level)}
          >
            {level === "all" ? "Todos" : level}
          </Button>
        ))}
        <span className="text-sm font-medium ml-4">Fase:</span>
        {(["all", "interpretation", "plan", "validation", "confirmation", "compilation", "execution"] as const).map((phase) => (
          <Button
            key={phase}
            size="sm"
            variant={phaseFilter === phase ? "default" : "ghost"}
            onClick={() => setPhaseFilter(phase)}
          >
            {phase === "all" ? "Todas" : phase}
          </Button>
        ))}
      </div>

      {/* Logs */}
      <ScrollArea className="flex-1 p-4" ref={scrollRef}>
        <div className="space-y-2">
          {filteredLogs.map((log) => (
            <div
              key={log.id}
              className="p-3 rounded-lg border transition-colors"
              style={{
                backgroundColor: '#1a1a1a', // Preto
                borderColor: '#444',
                color: '#fff' // Branco
              }}
            >
              {/* Header */}
              <div className="flex items-start gap-2 mb-2">
                <span className="text-lg">{getLevelIcon(log.level)}</span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <Badge className={getLevelColor(log.level)}>
                      {log.level}
                    </Badge>
                    {log.phase && (
                      <Badge className={getPhaseColor(log.phase)}>
                        {log.phase}
                      </Badge>
                    )}
                    <span className="text-xs" style={{ color: '#aaa' }}>
                      {formatTime(log.timestamp)}
                    </span>
                    <span
                      className="font-mono text-xs px-2 py-1 rounded-md border inline-block"
                      style={{ 
                        backgroundColor: '#333',
                        color: '#fff',
                        borderColor: '#555'
                      }}
                    >
                      {log.caller}
                    </span>
                    {log.callee && (
                      <>
                        <span style={{ color: '#fff' }}>→</span>
                        <span
                          className="font-mono text-xs px-2 py-1 rounded-md border inline-block"
                          style={{ 
                            backgroundColor: '#333',
                            color: '#fff',
                            borderColor: '#555'
                          }}
                        >
                          {log.callee}
                        </span>
                      </>
                    )}
                  </div>
                  <p className="mt-1 text-sm font-medium" style={{ color: '#fff' }}>{log.message}</p>
                </div>
              </div>

              {/* Error Details */}
              {log.error && (
                <div className="mt-2 p-2 bg-red-50 dark:bg-red-900/20 rounded border border-red-200 dark:border-red-800">
                  <p className="text-sm font-medium text-red-700 dark:text-red-300">
                    {log.error.type}: {log.error.message}
                  </p>
                  {log.error.cause && (
                    <p className="text-xs text-red-600 dark:text-red-400 mt-1">
                      Causa: {log.error.cause}
                    </p>
                  )}
                  {log.error.stack && (
                    <details className="mt-2">
                      <summary className="text-xs text-red-600 dark:text-red-400 cursor-pointer">
                        Stack trace
                      </summary>
                      <pre className="text-xs mt-1 overflow-x-auto text-red-700 dark:text-red-300">
                        {log.error.stack}
                      </pre>
                    </details>
                  )}
                </div>
              )}

              {/* Details */}
              {log.details && Object.keys(log.details).length > 0 && (
                <details className="mt-2">
                  <summary 
                    className="text-xs cursor-pointer hover:underline"
                    style={{ color: '#fff' }}
                  >
                    Detalhes ({Object.keys(log.details).length} campos)
                  </summary>
                  <pre 
                    className="text-xs mt-1 p-2 rounded overflow-x-auto border"
                    style={{ 
                      backgroundColor: '#2a2a2a',
                      color: '#fff',
                      borderColor: '#555'
                    }}
                  >
                    {JSON.stringify(log.details, null, 2)}
                  </pre>
                </details>
              )}

              {/* File */}
              {log.file && (
                <div className="mt-2 text-xs" style={{ color: '#fff' }}>
                  📄 Arquivo: <code className="font-mono px-1 py-0.5 rounded border" style={{ backgroundColor: '#333', color: '#fff', borderColor: '#555' }}>{log.file}</code>
                </div>
              )}

              {/* Session/Request IDs */}
              {(log.sessionId || log.requestId) && (
                <div className="mt-2 flex gap-4 text-xs" style={{ color: '#fff' }}>
                  {log.sessionId && (
                    <span>Session: <code className="font-mono px-1 py-0.5 rounded border" style={{ backgroundColor: '#333', color: '#fff', borderColor: '#555' }}>{log.sessionId.slice(-8)}</code></span>
                  )}
                  {log.requestId && (
                    <span>Request: <code className="font-mono px-1 py-0.5 rounded border" style={{ backgroundColor: '#333', color: '#fff', borderColor: '#555' }}>{log.requestId.slice(-8)}</code></span>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      </ScrollArea>
    </Card>
  );
}
