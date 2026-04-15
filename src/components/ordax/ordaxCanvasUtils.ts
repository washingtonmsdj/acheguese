/**
 * 🛠️ ORDAX CANVAS UTILS - FUNÇÕES HELPER E VALIDAÇÕES
 * 
 * Funções utilitárias para validação, type safety e operações comuns.
 * 
 * @version 2.0.0
 * @build 2026-02-16
 */

import type { OrdaxEntity } from "@/lib/ordax/types";
import type { ShieldState, Buffs, Spawned, Bullet } from "./ordaxCanvasTypes";
import {
  VALIDATION_CONFIG,
  WORLD_CONFIG,
  PERFORMANCE_CONFIG,
  DAMAGE_CONFIG,
  CANVAS_CONFIG,
  STARS_CONFIG,
  COLORS_CONFIG,
} from "./ordaxCanvasConfig";

// ============================================================================
// VALIDAÇÃO DE NÚMEROS
// ============================================================================

/**
 * Valida se um número é finito e dentro dos limites
 */
export function validateNumber(
  value: unknown,
  min: number = VALIDATION_CONFIG.MIN_COORDINATE,
  max: number = VALIDATION_CONFIG.MAX_COORDINATE,
  defaultValue: number = 0
): number {
  if (typeof value !== 'number' || !isFinite(value)) {
    return defaultValue;
  }
  
  return Math.max(min, Math.min(max, value));
}

/**
 * Valida se um número é finito (não NaN, não Infinity)
 */
export function isFiniteNumber(value: unknown): value is number {
  return typeof value === 'number' && isFinite(value);
}

/**
 * Valida se um número é positivo
 */
export function isPositiveNumber(value: unknown): value is number {
  return isFiniteNumber(value) && value > 0;
}

// ============================================================================
// VALIDAÇÃO DE DIMENSÕES
// ============================================================================

/**
 * Valida dimensões do canvas
 */
export function validateCanvasDimensions(
  width: number,
  height: number,
  minWidth: number = CANVAS_CONFIG.MIN_WIDTH,
  minHeight: number = CANVAS_CONFIG.MIN_HEIGHT
): { width: number; height: number; isValid: boolean } {
  const validWidth = Math.max(minWidth, validateNumber(width, minWidth, 10000));
  const validHeight = Math.max(minHeight, validateNumber(height, minHeight, 10000));
  
  return {
    width: validWidth,
    height: validHeight,
    isValid: validWidth >= minWidth && validHeight >= minHeight,
  };
}

/**
 * Valida dimensões do mundo
 */
export function validateWorldDimensions(
  width: number,
  height: number
): boolean {
  return (
    isPositiveNumber(width) &&
    isPositiveNumber(height) &&
    width <= VALIDATION_CONFIG.MAX_DIMENSION &&
    height <= VALIDATION_CONFIG.MAX_DIMENSION &&
    width >= VALIDATION_CONFIG.MIN_DIMENSION &&
    height >= VALIDATION_CONFIG.MIN_DIMENSION
  );
}

// ============================================================================
// VALIDAÇÃO DE TEMPO
// ============================================================================

/**
 * Valida delta time (evita valores extremos)
 */
export function validateDeltaTime(
  dt: number,
  maxDeltaTime: number = PERFORMANCE_CONFIG.MAX_DELTA_TIME
): number {
  if (!isFiniteNumber(dt) || dt <= 0) {
    return 0.016; // ~60 FPS
  }
  
  return Math.min(dt, maxDeltaTime);
}

// ============================================================================
// VALIDAÇÃO DE ENTIDADES
// ============================================================================

/**
 * Valida ID de entidade
 */
export function validateEntityId(id: unknown): string {
  if (typeof id !== 'string' || !id.trim()) {
    return `invalid_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
  
  // Remove caracteres inválidos
  return id.replace(/[^a-zA-Z0-9_-]/g, '_');
}

/**
 * Valida propriedades de escudo
 */
export function validateShieldProps(
  shield: unknown,
  shieldRegen: unknown
): { isValid: boolean; max: number; regen: number } {
  const maxShield = validateNumber(
    shield,
    VALIDATION_CONFIG.MIN_SHIELD,
    VALIDATION_CONFIG.MAX_SHIELD,
    VALIDATION_CONFIG.DEFAULT_SHIELD
  );
  
  const regen = validateNumber(
    shieldRegen,
    0,
    100,
    0
  );
  
  return {
    isValid: maxShield > 0,
    max: maxShield,
    regen: regen,
  };
}

/**
 * Valida saúde
 */
export function validateHealth(
  health: unknown,
  defaultValue: number = VALIDATION_CONFIG.DEFAULT_HEALTH
): number {
  return validateNumber(
    health,
    VALIDATION_CONFIG.MIN_HEALTH,
    VALIDATION_CONFIG.MAX_HEALTH,
    defaultValue
  );
}

/**
 * Valida dano
 */
export function validateDamage(
  damage: unknown,
  minDamage: number = DAMAGE_CONFIG.MIN_DAMAGE
): number {
  const validDamage = validateNumber(
    damage,
    minDamage,
    DAMAGE_CONFIG.MAX_DAMAGE,
    minDamage
  );
  
  return Math.max(minDamage, validDamage);
}

// ============================================================================
// VALIDAÇÃO DE ESTRELAS
// ============================================================================

/**
 * Valida contagem de estrelas
 */
export function validateStarCount(
  count: unknown,
  maxCount: number = STARS_CONFIG.MAX_COUNT
): number {
  return validateNumber(count, 0, maxCount, STARS_CONFIG.DENSITY);
}

// ============================================================================
// NORMALIZAÇÃO DE CORES
// ============================================================================

/**
 * Normaliza cor (fallback se inválida)
 */
export function normalizeColor(
  color: unknown,
  fallback: string = COLORS_CONFIG.FALLBACK.PRIMARY
): string {
  if (typeof color !== 'string' || !color.trim()) {
    return fallback;
  }
  
  // Valida formato hexadecimal simples
  const hexRegex = /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/;
  if (hexRegex.test(color)) {
    return color;
  }
  
  // Valida formato hsl/hsla
  const hslRegex = /^hsla?\(\s*\d+\s*,\s*\d+%\s*,\s*\d+%\s*(,\s*[\d.]+)?\s*\)$/i;
  if (hslRegex.test(color)) {
    return color;
  }
  
  // Valida formato rgb/rgba
  const rgbRegex = /^rgba?\(\s*\d+\s*,\s*\d+\s*,\s*\d+\s*(,\s*[\d.]+)?\s*\)$/i;
  if (rgbRegex.test(color)) {
    return color;
  }
  
  return fallback;
}

// ============================================================================
// OPERAÇÕES COM ENTIDADES
// ============================================================================

/**
 * Obtém entidade do jogador de forma segura
 */
export function getPlayerEntitySafe(entities: OrdaxEntity[]): OrdaxEntity | null {
  if (!Array.isArray(entities)) return null;
  
  for (const entity of entities) {
    if (
      entity &&
      typeof entity === 'object' &&
      'type' in entity &&
      (entity.type === 'player' || entity.id === 'player') &&
      'x' in entity && isFiniteNumber(entity.x) &&
      'y' in entity && isFiniteNumber(entity.y) &&
      'w' in entity && isPositiveNumber(entity.w) &&
      'h' in entity && isPositiveNumber(entity.h)
    ) {
      return entity;
    }
  }
  
  return null;
}

/**
 * Filtra spawners de forma segura
 */
export function filterSpawnersSafe(entities: OrdaxEntity[]): OrdaxEntity[] {
  if (!Array.isArray(entities)) return [];
  
  return entities.filter(entity => 
    entity &&
    typeof entity === 'object' &&
    'type' in entity &&
    entity.type === 'spawner' &&
    'x' in entity && isFiniteNumber(entity.x) &&
    'y' in entity && isFiniteNumber(entity.y) &&
    // w/h can be 0 for spawners (invisible control entities)
    'w' in entity && typeof entity.w === 'number' && isFinite(entity.w) &&
    'h' in entity && typeof entity.h === 'number' && isFinite(entity.h)
  );
}

// ============================================================================
// OPERAÇÕES COM SPAWNED E BULLETS
// ============================================================================

/**
 * Valida spawned array
 */
export function validateSpawnedArray(spawned: unknown): Spawned[] {
  if (!Array.isArray(spawned)) return [];
  
  return spawned.filter((item): item is Spawned => {
    if (!item || typeof item !== 'object') return false;
    
    const s = item as Record<string, unknown>;
    
    // Campos obrigatórios
    if (typeof s.id !== 'string' || !s.id) return false;
    if (typeof s.type !== 'string' || !['enemy', 'asteroid', 'powerup'].includes(s.type)) return false;
    if (!isFiniteNumber(s.x)) return false;
    if (!isFiniteNumber(s.y)) return false;
    if (!isPositiveNumber(s.w)) return false;
    if (!isPositiveNumber(s.h)) return false;
    if (!isFiniteNumber(s.vy)) return false;
    
    return true;
  });
}

/**
 * Valida bullets array
 */
export function validateBulletsArray(bullets: unknown): Bullet[] {
  if (!Array.isArray(bullets)) return [];
  
  return bullets.filter((item): item is Bullet => {
    if (!item || typeof item !== 'object') return false;
    
    const b = item as Record<string, unknown>;
    
    // Campos obrigatórios
    if (typeof b.id !== 'string' || !b.id) return false;
    if (b.type !== 'bullet') return false;
    if (!isFiniteNumber(b.x)) return false;
    if (!isFiniteNumber(b.y)) return false;
    if (!isPositiveNumber(b.w)) return false;
    if (!isPositiveNumber(b.h)) return false;
    if (!isFiniteNumber(b.vx)) return false;
    if (!isFiniteNumber(b.vy)) return false;
    
    return true;
  });
}

// ============================================================================
// OPERAÇÕES COM ESTADO
// ============================================================================

/**
 * Valida estado do escudo
 */
export function validateShieldState(state: unknown): ShieldState | null {
  if (!state || typeof state !== 'object') return null;
  
  const s = state as Record<string, unknown>;
  
  if (
    !isFiniteNumber(s.value) || s.value < 0 ||
    !isPositiveNumber(s.max) ||
    !isFiniteNumber(s.regenPerSec) || s.regenPerSec < 0
  ) {
    return null;
  }
  
  return {
    value: Math.min(s.value, s.max as number),
    max: s.max as number,
    regenPerSec: s.regenPerSec as number,
  };
}

/**
 * Valida buffs
 */
export function validateBuffs(buffs: unknown): Buffs {
  if (!buffs || typeof buffs !== 'object') {
    return { shield: 0, spread: 0 };
  }
  
  const b = buffs as Record<string, unknown>;
  
  return {
    shield: validateNumber(b.shield, 0, 1000, 0),
    spread: validateNumber(b.spread, 0, 1000, 0),
  };
}

// ============================================================================
// LOGGING ESTRUTURADO
// ============================================================================

/**
 * Log estruturado para debugging
 */
export function logStructured(
  level: 'info' | 'warn' | 'error',
  message: string,
  context?: Record<string, unknown>
): void {
  const timestamp = new Date().toISOString();
  const logEntry = {
    timestamp,
    level,
    message,
    context: context || {},
  };
  
  switch (level) {
    case 'info':
      console.info('[OrdaxCanvas]', logEntry);
      break;
    case 'warn':
      console.warn('[OrdaxCanvas]', logEntry);
      break;
    case 'error':
      console.error('[OrdaxCanvas]', logEntry);
      break;
  }
}

/**
 * Log de erro com stack trace
 */
export function logErrorWithContext(
  error: unknown,
  context: string,
  additionalContext?: Record<string, unknown>
): void {
  const errorObj = error instanceof Error ? error : new Error(String(error));
  
  logStructured('error', `${context}: ${errorObj.message}`, {
    stack: errorObj.stack,
    ...additionalContext,
  });
}

// ============================================================================
// PERFORMANCE
// ============================================================================

/**
 * Debounce function para otimizar chamadas frequentes
 */
export function createDebouncedFunction<T extends (...args: unknown[]) => unknown>(
  func: T,
  wait: number = PERFORMANCE_CONFIG.DEBOUNCE_MS
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout | null = null;
  
  return (...args: Parameters<T>) => {
    if (timeout) {
      clearTimeout(timeout);
    }
    
    timeout = setTimeout(() => {
      func(...args);
      timeout = null;
    }, wait);
  };
}

/**
 * Throttle function para limitar chamadas
 */
export function createThrottledFunction<T extends (...args: unknown[]) => unknown>(
  func: T,
  limit: number = PERFORMANCE_CONFIG.THROTTLE_MS
): (...args: Parameters<T>) => void {
  let inThrottle = false;
  
  return (...args: Parameters<T>) => {
    if (!inThrottle) {
      func(...args);
      inThrottle = true;
      setTimeout(() => {
        inThrottle = false;
      }, limit);
    }
  };
}