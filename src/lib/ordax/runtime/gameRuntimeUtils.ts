/**
 * Utilitários para GameRuntime
 * Funções helper e validações
 */

import type { Entity } from "./gameRuntimeTypes";
import { LOG_CONFIG, ERROR_MESSAGES, WARNING_MESSAGES, INFO_MESSAGES } from "./gameRuntimeConfig";

/**
 * Logger estruturado para GameRuntime
 */
export class GameRuntimeLogger {
  private static enabled = LOG_CONFIG.ENABLE_DEBUG;

  /**
   * Habilita/desabilita logging
   */
  static setEnabled(enabled: boolean): void {
    this.enabled = enabled;
  }

  /**
   * Log de debug
   */
  static debug(message: string, ...args: unknown[]): void {
    if (!this.enabled) return;
    console.log(`${LOG_CONFIG.PREFIX} [DEBUG]`, message, ...args);
  }

  /**
   * Log de info
   */
  static info(message: string, ...args: unknown[]): void {
    if (!this.enabled) return;
    console.info(`${LOG_CONFIG.PREFIX} [INFO]`, message, ...args);
  }

  /**
   * Log de warning
   */
  static warn(message: string, ...args: unknown[]): void {
    console.warn(`${LOG_CONFIG.PREFIX} [WARN]`, message, ...args);
  }

  /**
   * Log de erro
   */
  static error(message: string, ...args: unknown[]): void {
    console.error(`${LOG_CONFIG.PREFIX} [ERROR]`, message, ...args);
  }
}

/**
 * Validador de canvas
 */
export function validateCanvas(canvas: HTMLCanvasElement | null | undefined): canvas is HTMLCanvasElement {
  if (!canvas) {
    GameRuntimeLogger.error(ERROR_MESSAGES.INVALID_CANVAS);
    return false;
  }
  
  if (!(canvas instanceof HTMLCanvasElement)) {
    GameRuntimeLogger.error(ERROR_MESSAGES.INVALID_CANVAS);
    return false;
  }
  
  return true;
}

/**
 * Interface para spec de jogo (validação de tipo)
 */
export interface GameSpec {
  systems?: string[];
  scene?: {
    entities?: Entity[];
    [key: string]: unknown;
  };
  [key: string]: unknown;
}

/**
 * Validador de spec
 */
export function validateSpec(spec: unknown): spec is GameSpec {
  if (!spec || typeof spec !== "object") {
    GameRuntimeLogger.error(ERROR_MESSAGES.INVALID_SPEC);
    return false;
  }
  
  // Valida campos básicos
  if (!Array.isArray((spec as GameSpec).systems)) {
    GameRuntimeLogger.warn("Spec has no systems array, using empty array");
  }
  
  if (!(spec as GameSpec).scene || !Array.isArray((spec as GameSpec).scene?.entities)) {
    GameRuntimeLogger.warn("Spec has no scene.entities array, using empty array");
  }
  
  return true;
}

/**
 * Validador de entidade
 */
export function validateEntity(entity: unknown): entity is Entity {
  if (!entity || typeof entity !== "object") {
    GameRuntimeLogger.warn("Entity is not an object");
    return false;
  }
  
  const e = entity as Record<string, unknown>;
  if (typeof e.id !== "string" || (e.id as string).trim().length === 0) {
    GameRuntimeLogger.warn("Entity has no valid id");
    return false;
  }
  
  return true;
}

/**
 * Normaliza entidade com valores padrão
 */
export function normalizeEntity(entity: unknown): Entity {
  if (!entity || typeof entity !== "object") {
    return {
      id: `entity_${Date.now()}`,
      type: "unknown",
      x: 0,
      y: 0,
      w: 32,
      h: 32,
    };
  }

  const e = entity as Record<string, unknown>;
  return {
    id: (e.id as string) || `entity_${Date.now()}`,
    type: (e.type as string) || "unknown",
    x: typeof e.x === "number" ? e.x : 0,
    y: typeof e.y === "number" ? e.y : 0,
    w: typeof e.w === "number" ? e.w : 32,
    h: typeof e.h === "number" ? e.h : 32,
    visual: e.visual as Entity["visual"],
    physics: e.physics as Entity["physics"],
    props: e.props as Entity["props"],
    metadata: e.metadata as Entity["metadata"],
  } as Entity;
}

/**
 * Clamp de deltaTime para prevenir "spiral of death"
 */
export function clampDeltaTime(deltaTime: number, maxDeltaTime: number): number {
  if (deltaTime > maxDeltaTime) {
    GameRuntimeLogger.warn(`DeltaTime ${deltaTime.toFixed(3)}s exceeds max ${maxDeltaTime}s, clamping`);
    return maxDeltaTime;
  }
  return deltaTime;
}

/**
 * Calcula FPS baseado em deltaTime
 */
export function calculateFPS(deltaTime: number): number {
  if (deltaTime === 0) return 0;
  return Math.round(1 / deltaTime);
}

/**
 * Formata tempo em ms para string legível
 */
export function formatTime(ms: number): string {
  if (ms < 1) return `${(ms * 1000).toFixed(2)}μs`;
  if (ms < 1000) return `${ms.toFixed(2)}ms`;
  return `${(ms / 1000).toFixed(2)}s`;
}

/**
 * Contexto adicional para erros
 */
export interface ErrorContext {
  [key: string]: unknown;
}

/**
 * Cria erro com contexto
 */
export function createError(message: string, context?: ErrorContext): Error {
  const error = new Error(message);
  if (context) {
    (error as Error & { context: ErrorContext }).context = context;
  }
  return error;
}

/**
 * Safe getter para propriedades aninhadas
 */
export function safeGet<T>(obj: unknown, path: string, defaultValue: T): T {
  const keys = path.split(".");
  let current: unknown = obj;
  
  for (const key of keys) {
    if (current == null || typeof current !== "object") {
      return defaultValue;
    }
    current = (current as Record<string, unknown>)[key];
  }
  
  return current !== undefined ? (current as T) : defaultValue;
}

/**
 * Debounce de função
 */
export function debounce<T extends (...args: unknown[]) => unknown>(
  fn: T,
  delay: number
): (...args: Parameters<T>) => void {
  let timeoutId: ReturnType<typeof setTimeout> | null = null;
  
  return (...args: Parameters<T>) => {
    if (timeoutId !== null) {
      clearTimeout(timeoutId);
    }
    timeoutId = setTimeout(() => fn(...args), delay);
  };
}

/**
 * Throttle de função
 */
export function throttle<T extends (...args: unknown[]) => unknown>(
  fn: T,
  delay: number
): (...args: Parameters<T>) => void {
  let lastCall = 0;
  
  return (...args: Parameters<T>) => {
    const now = Date.now();
    if (now - lastCall >= delay) {
      lastCall = now;
      fn(...args);
    }
  };
}
