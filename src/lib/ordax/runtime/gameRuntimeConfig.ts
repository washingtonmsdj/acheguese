/**
 * Configuração e constantes para GameRuntime
 * Importa valores compartilhados de config.ts central
 */

import {
  ENGINE_PERFORMANCE,
  ENTITY_DEFAULTS,
  LOG_DEFAULTS,
} from "@/lib/ordax/config";

/**
 * Constantes de renderização
 */
export const RENDER_CONFIG = {
  DEFAULT_WIDTH: ENTITY_DEFAULTS.RENDER_WIDTH,
  DEFAULT_HEIGHT: ENTITY_DEFAULTS.RENDER_HEIGHT,
  DEFAULT_COLOR: ENTITY_DEFAULTS.COLOR,
  DEFAULT_X: 0,
  DEFAULT_Y: 0,
} as const;

/**
 * Constantes de performance
 */
export const PERFORMANCE_CONFIG = {
  TARGET_FPS: ENGINE_PERFORMANCE.TARGET_FPS,
  MAX_DELTA_TIME: ENGINE_PERFORMANCE.MAX_DELTA_TIME,
  METRICS_UPDATE_INTERVAL: ENGINE_PERFORMANCE.METRICS_INTERVAL_MS,
  MS_TO_SECONDS: ENGINE_PERFORMANCE.MS_TO_SECONDS,
} as const;

/**
 * Constantes de logging
 */
export const LOG_CONFIG = {
  PREFIX: LOG_DEFAULTS.RUNTIME_PREFIX,
  ENABLE_DEBUG: LOG_DEFAULTS.ENABLE_DEBUG,
} as const;

/**
 * Mensagens de erro
 */
export const ERROR_MESSAGES = {
  INVALID_CANVAS: "Canvas element is invalid or not provided",
  INVALID_SPEC: "Game spec is invalid or not provided",
  INVALID_SYSTEM: "System constructor is invalid",
  INVALID_ENTITY: "Entity is invalid or missing required fields",
  SYSTEM_NOT_FOUND: (name: string) => `System "${name}" not found in registry`,
  SYSTEM_UPDATE_FAILED: (name: string, error: string) => `System "${name}" update failed: ${error}`,
  RENDER_FAILED: (error: string) => `Render failed: ${error}`,
  ENTITY_NOT_FOUND: (id: string) => `Entity "${id}" not found`,
} as const;

/**
 * Mensagens de warning
 */
export const WARNING_MESSAGES = {
  SYSTEM_IGNORED: (name: string) => `System "${name}" not found in registry, ignoring`,
  ENTITY_INVALID: (id: string) => `Entity "${id}" is invalid, skipping`,
  NO_VISUAL: (id: string) => `Entity "${id}" has no visual, skipping render`,
  UNKNOWN_SHAPE: (shape: string) => `Unknown shape "${shape}", using default renderer`,
  CONTEXT_NULL: "Canvas context is null, cannot render",
} as const;

/**
 * Mensagens de info
 */
export const INFO_MESSAGES = {
  RUNTIME_STARTED: "GameRuntime started",
  RUNTIME_STOPPED: "GameRuntime stopped",
  RUNTIME_DISPOSED: "GameRuntime disposed",
  SYSTEM_REGISTERED: (name: string) => `System "${name}" registered`,
  SYSTEM_INITIALIZED: (name: string) => `System "${name}" initialized`,
  ENTITY_ADDED: (id: string) => `Entity "${id}" added`,
  ENTITY_REMOVED: (id: string) => `Entity "${id}" removed`,
} as const;

/**
 * Renderers padrão para shapes básicas
 */
export const DEFAULT_SHAPE_RENDERERS = {
  rect: (
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    width: number,
    height: number,
    color: string
  ) => {
    ctx.fillStyle = color;
    ctx.fillRect(x, y, width, height);
  },
  
  circle: (
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    width: number,
    _height: number,
    color: string
  ) => {
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.arc(x, y, width / 2, 0, Math.PI * 2);
    ctx.fill();
  },
  
  car: (
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    width: number,
    height: number,
    color: string
  ) => {
    ctx.fillStyle = color;
    ctx.fillRect(x, y, width, height);
    ctx.fillStyle = "#000";
    ctx.fillRect(x + 5, y + 5, width - 10, height - 10);
  },
} as const;
