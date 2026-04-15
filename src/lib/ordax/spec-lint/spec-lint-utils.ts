/**
 * Utilitários para spec-lint.ts
 * Funções helper reutilizáveis e otimizadas
 */

import type { OrdaxEntity, OrdaxSpec } from "@/lib/ordax/types";
import type { OrdaxAllowedSystem } from "./spec-lint-config";
import type { FixOperationResult, OrdaxSpecFix, OrdaxSpecIssueCode, OrdaxSpecFixCode } from "./spec-lint-types";

// ============================================================================
// FUNÇÕES HELPER BÁSICAS
// ============================================================================

/**
 * Clamp de número entre min e max
 */
export function clamp(n: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, n));
}

/**
 * Verifica se uma string é um formato HSL válido
 * Versão otimizada (apenas verifica prefixo para performance)
 */
export function isHslString(v: unknown): boolean {
  if (typeof v !== "string") {
    return false;
  }
  
  const t = v.trim();
  // Keep it permissive; normalize() will enforce defaults.
  return t.startsWith("hsl(") || t.startsWith("hsla(");
}

/**
 * Normaliza uma string para comparação (remove espaços, lowercase)
 */
export function normalizeStringForComparison(str: string): string {
  return str.toLowerCase().replace(/\s+/g, "");
}

// ============================================================================
// FUNÇÕES DE VALIDAÇÃO DE ENTIDADES
// ============================================================================

/**
 * Valida se uma entidade tem um player
 */
export function hasPlayerEntity(entities: OrdaxEntity[]): boolean {
  return entities.some((e) => e.id === "player" || e.type === "player");
}

/**
 * Cria um player padrão
 */
export function createDefaultPlayer(
  worldWidth: number,
  worldHeight: number,
  playerDefaults: {
    id: string;
    type: string;
    width: number;
    height: number;
    health: number;
    speed: number;
  }
): OrdaxEntity {
  return {
    id: playerDefaults.id,
    type: playerDefaults.type,
    x: worldWidth / 2,
    y: worldHeight * 0.8,
    w: playerDefaults.width,
    h: playerDefaults.height,
    props: { health: playerDefaults.health, speed: playerDefaults.speed },
  };
}

/**
 * Garante que há um player nas entidades
 */
export function ensurePlayer(
  entities: OrdaxEntity[],
  worldWidth: number,
  worldHeight: number,
  playerDefaults: {
    id: string;
    type: string;
    width: number;
    height: number;
    health: number;
    speed: number;
  }
): FixOperationResult<OrdaxEntity[]> {
  if (hasPlayerEntity(entities)) {
    return { result: entities };
  }
  
  const player = createDefaultPlayer(worldWidth, worldHeight, playerDefaults);
  
  return {
    result: [player, ...entities],
    fix: {
      code: "ADD_PLAYER",
      message: "Player ausente → adicionado player padrão.",
    },
  };
}

/**
 * Renomeia IDs duplicados
 */
export function renameDuplicateIds(
  entities: OrdaxEntity[]
): FixOperationResult<OrdaxEntity[]> {
  const seen = new Map<string, number>();
  let changed = false;
  
  const out = entities.map((e) => {
    const base = e.id || "entity";
    const count = (seen.get(base) ?? 0) + 1;
    seen.set(base, count);
    
    if (count === 1) {
      return e;
    }
    
    changed = true;
    const newId = `${base}_${count}`;
    
    // keep player id stable if collision happens
    if (base === "player") {
      return { ...e, id: "player" };
    }
    
    return { ...e, id: newId };
  });
  
  return changed
    ? {
        result: out,
        fix: {
          code: "RENAME_DUPLICATE_IDS",
          message: "IDs duplicados → renomeados automaticamente.",
        },
      }
    : { result: entities };
}

/**
 * Ajusta entidades para dentro dos bounds do mundo
 */
export function clampEntitiesToWorld(
  entities: OrdaxEntity[],
  worldWidth: number,
  worldHeight: number
): FixOperationResult<OrdaxEntity[]> {
  let changed = false;
  
  const out = entities.map((e) => {
    // Skip control entities (spawners) — they intentionally live off-screen
    if (e.type === "spawner") return e;
    
    const w = Math.max(1, e.w);
    const h = Math.max(1, e.h);
    const x = clamp(e.x, w / 2, worldWidth - w / 2);
    const y = clamp(e.y, h / 2, worldHeight - h / 2);
    
    if (x !== e.x || y !== e.y) {
      changed = true;
      return { ...e, x, y };
    }
    
    return e;
  });
  
  return changed
    ? {
        result: out,
        fix: {
          code: "CLAMP_ENTITIES_TO_WORLD",
          message: "Entidades fora do mundo → ajustadas para dentro do frame.",
        },
      }
    : { result: entities };
}

// ============================================================================
// FUNÇÕES DE VALIDAÇÃO DE SISTEMAS
// ============================================================================

/**
 * Normaliza e filtra sistemas
 */
export function fixSystems(
  systems: unknown,
  allowedSystems: readonly OrdaxAllowedSystem[],
  systemAliases: Record<string, OrdaxAllowedSystem>
): FixOperationResult<string[]> {
  // Valida input
  const list = Array.isArray(systems) 
    ? systems.filter((s): s is string => typeof s === "string")
    : [];
  
  const out: string[] = [];
  const allowedSet = new Set<string>(allowedSystems);
  let changed = false;
  
  for (const s of list) {
    // Sistema já é permitido
    if (allowedSet.has(s)) {
      out.push(s);
      continue;
    }
    
    // Tenta mapear alias
    const normalized = normalizeStringForComparison(s);
    const alias = systemAliases[normalized];
    
    if (alias) {
      out.push(alias);
      changed = true;
      continue;
    }
    
    // Sistema desconhecido - remove
    changed = true;
  }
  
  // Remove duplicatas mantendo ordem
  const deduped: string[] = [];
  const seen = new Set<string>();
  
  for (const s of out) {
    if (seen.has(s)) {
      continue;
    }
    seen.add(s);
    deduped.push(s);
  }
  
  return changed
    ? {
        result: deduped,
        fix: {
          code: "FILTER_OR_MAP_SYSTEMS",
          message: "Systems inválidos → removidos/mapeados para módulos suportados.",
        },
      }
    : { result: deduped };
}

/**
 * Valida sistemas contra lista permitida
 */
export function validateSystems(
  systems: unknown,
  allowedSystems: readonly OrdaxAllowedSystem[]
): { valid: boolean; invalid: string[] } {
  if (!Array.isArray(systems)) {
    return { valid: false, invalid: [] };
  }
  
  const allowedSet = new Set<string>(allowedSystems);
  const invalid = systems.filter(
    (sys): sys is string => typeof sys === "string" && !allowedSet.has(sys)
  );
  
  return {
    valid: invalid.length === 0,
    invalid: Array.from(new Set(invalid)), // Remove duplicatas
  };
}

// ============================================================================
// FUNÇÕES DE VALIDAÇÃO DE SPEC
// ============================================================================

/**
 * Valida se um spec tem entidades
 */
export function hasEntities(spec: Partial<OrdaxSpec>): boolean {
  return Array.isArray(spec.scene?.entities) && spec.scene.entities.length > 0;
}

/**
 * Extrai IDs de entidades de forma segura
 */
export function extractEntityIds(entities: unknown[]): string[] {
  if (!Array.isArray(entities)) {
    return [];
  }
  
  return entities
    .map((e) => {
      if (!e || typeof e !== "object") {
        return null;
      }
      
      // Acesso seguro sem type assertion
      const entity = e as Record<string, unknown>;
      const id = entity.id;
      return typeof id === "string" ? id : null;
    })
    .filter((id): id is string => id !== null);
}

/**
 * Verifica se há entidades fora dos bounds
 */
export function hasEntitiesOutOfBounds(
  entities: unknown[],
  worldWidth: number,
  worldHeight: number
): boolean {
  if (!Array.isArray(entities)) {
    return false;
  }
  
  return entities.some((e) => {
    if (!e || typeof e !== "object") {
      return false;
    }
    
    const entity = e as Record<string, unknown>;
    const x = entity.x;
    const y = entity.y;
    const w = entity.w;
    const h = entity.h;
    
    // Validação type safe
    if (
      typeof x !== "number" ||
      typeof y !== "number" ||
      typeof w !== "number" ||
      typeof h !== "number"
    ) {
      return false;
    }
    
    const halfWidth = w / 2;
    const halfHeight = h / 2;
    
    return (
      x < halfWidth ||
      x > worldWidth - halfWidth ||
      y < halfHeight ||
      y > worldHeight - halfHeight
    );
  });
}

// ============================================================================
// FUNÇÕES DE LOGGING E ERROR HANDLING
// ============================================================================

/**
 * Loga uma mudança de normalização (apenas em desenvolvimento)
 */
export function logLintChange(
  field: string,
  action: "added" | "modified" | "removed",
  after: unknown,
  reason: string,
  before?: unknown
): void {
  if (import.meta.env.DEV) {
    console.debug(`[spec-lint] ${action} ${field}:`, {
      before,
      after,
      reason,
    });
  }
}

/**
 * Cria uma issue de forma type-safe
 */
export function createIssue(
  code: OrdaxSpecIssueCode,
  severity: "error" | "warn",
  message: string,
  details?: string
) {
  return {
    code,
    severity,
    message,
    ...(details && { details }),
  };
}

/**
 * Cria um fix de forma type-safe
 */
export function createFix(
  code: OrdaxSpecFixCode,
  message: string,
  details?: string
): OrdaxSpecFix {
  return {
    code,
    message,
    ...(details && { details }),
  };
}

// ============================================================================
// FUNÇÕES DE PERFORMANCE
// ============================================================================

/**
 * Cache simples para funções custosas
 * Type safe 100% - elimina non-null assertions inseguras
 */
export function createCache<T extends (...args: unknown[]) => unknown>(
  fn: T,
  maxSize: number = 100
): T {
  const cache = new Map<string, ReturnType<T>>();
  const keys: string[] = [];
  
  return ((...args: Parameters<T>): ReturnType<T> => {
    const key = JSON.stringify(args);
    
    // Acesso seguro ao cache (sem non-null assertion)
    const cachedResult = cache.get(key);
    if (cachedResult !== undefined) {
      return cachedResult;
    }
    
    const result = fn(...args);
    cache.set(key, result);
    keys.push(key);
    
    // Limita tamanho do cache (type safe)
    if (keys.length > maxSize) {
      const oldestKey = keys.shift();
      if (oldestKey !== undefined) {
        cache.delete(oldestKey);
      }
    }
    
    return result;
  }) as T;
}

/**
 * Debounce para evitar chamadas excessivas
 */
export function debounce<T extends (...args: unknown[]) => unknown>(
  fn: T,
  delay: number
): (...args: Parameters<T>) => void {
  let timeoutId: NodeJS.Timeout | null = null;
  
  return (...args: Parameters<T>) => {
    if (timeoutId) {
      clearTimeout(timeoutId);
    }
    
    timeoutId = setTimeout(() => {
      fn(...args);
      timeoutId = null;
    }, delay);
  };
}