/**
 * Type guards e tipos para spec-lint.ts
 * Centralized type safety para eliminar `as any` assertions
 */

import type { OrdaxEntity, OrdaxSpec, OrdaxVisualTheme } from "@/lib/ordax/types";
import type { OrdaxAllowedSystem } from "./spec-lint-config";

// ============================================================================
// TIPOS DE ISSUES E FIXES
// ============================================================================

export type SpecIssueSeverity = "error" | "warn";

export type OrdaxSpecIssueCode =
  | "MISSING_GAME_TYPE"
  | "MISSING_TITLE"
  | "MISSING_ENTITIES"
  | "DUPLICATE_ENTITY_IDS"
  | "INVALID_SYSTEMS"
  | "ENTITY_OUT_OF_BOUNDS"
  | "THEME_NOT_HSL"
  | "INVALID_GAME_TYPE"
  | "TITLE_TOO_LONG"
  | "TITLE_INVALID_CHARS"
  | "TITLE_MULTIPLE_SPACES"
  | "INVALID_ENTITIES"
  | "MISSING_RECOMMENDED_SYSTEMS"
  | "THEME_LOW_CONTRAST"
  | "VALIDATION_ERROR"
  | "INTERNAL_VALIDATION_ERROR"
  | "INVALID_INPUT"
  | "INTERNAL_LINT_ERROR"
  | "AUTO_FIX_ERROR"
  | "INTERNAL_AUTO_FIX_ERROR";

export type OrdaxSpecFixCode =
  | "ADD_PLAYER"
  | "RENAME_DUPLICATE_IDS"
  | "FILTER_OR_MAP_SYSTEMS"
  | "CLAMP_ENTITIES_TO_WORLD"
  | "FILL_DEFAULTS";

export interface OrdaxSpecIssue {
  code: OrdaxSpecIssueCode;
  severity: SpecIssueSeverity;
  message: string;
  details?: string;
}

export interface OrdaxSpecFix {
  code: OrdaxSpecFixCode;
  message: string;
  details?: string;
}

export interface LintResult {
  issues: OrdaxSpecIssue[];
  fixes: OrdaxSpecFix[];
  spec: OrdaxSpec;
}

// ============================================================================
// TYPE GUARDS
// ============================================================================

/**
 * Type guard para OrdaxSpecIssue
 */
export function isOrdaxSpecIssue(v: unknown): v is OrdaxSpecIssue {
  if (!v || typeof v !== "object") {
    return false;
  }
  
  const obj = v as Record<string, unknown>;
  
  // Valida code
  if (typeof obj.code !== "string") {
    return false;
  }
  
  const validCodes: OrdaxSpecIssueCode[] = [
    "MISSING_GAME_TYPE", "MISSING_TITLE", "MISSING_ENTITIES",
    "DUPLICATE_ENTITY_IDS", "INVALID_SYSTEMS", "ENTITY_OUT_OF_BOUNDS",
    "THEME_NOT_HSL"
  ];
  
  if (!validCodes.includes(obj.code as OrdaxSpecIssueCode)) {
    return false;
  }
  
  // Valida severity
  if (typeof obj.severity !== "string") {
    return false;
  }
  
  const validSeverities: SpecIssueSeverity[] = ["error", "warn"];
  if (!validSeverities.includes(obj.severity as SpecIssueSeverity)) {
    return false;
  }
  
  // Valida message
  if (typeof obj.message !== "string" || obj.message.trim().length === 0) {
    return false;
  }
  
  // Valida details (opcional)
  if (obj.details !== undefined && typeof obj.details !== "string") {
    return false;
  }
  
  return true;
}

/**
 * Type guard para OrdaxSpecIssue array
 */
export function isOrdaxSpecIssueArray(v: unknown): v is OrdaxSpecIssue[] {
  if (!Array.isArray(v)) {
    return false;
  }
  
  return v.every(isOrdaxSpecIssue);
}

/**
 * Type guard para OrdaxSpecFix
 */
export function isOrdaxSpecFix(v: unknown): v is OrdaxSpecFix {
  if (!v || typeof v !== "object") {
    return false;
  }
  
  const obj = v as Record<string, unknown>;
  
  // Valida code
  if (typeof obj.code !== "string") {
    return false;
  }
  
  const validCodes: OrdaxSpecFixCode[] = [
    "ADD_PLAYER", "RENAME_DUPLICATE_IDS", "FILTER_OR_MAP_SYSTEMS",
    "CLAMP_ENTITIES_TO_WORLD", "FILL_DEFAULTS"
  ];
  
  if (!validCodes.includes(obj.code as OrdaxSpecFixCode)) {
    return false;
  }
  
  // Valida message
  if (typeof obj.message !== "string" || obj.message.trim().length === 0) {
    return false;
  }
  
  // Valida details (opcional)
  if (obj.details !== undefined && typeof obj.details !== "string") {
    return false;
  }
  
  return true;
}

/**
 * Type guard para OrdaxSpecFix array
 */
export function isOrdaxSpecFixArray(v: unknown): v is OrdaxSpecFix[] {
  if (!Array.isArray(v)) {
    return false;
  }
  
  return v.every(isOrdaxSpecFix);
}

/**
 * Type guard para OrdaxAllowedSystem
 */
export function isOrdaxAllowedSystem(v: unknown): v is OrdaxAllowedSystem {
  if (typeof v !== "string") {
    return false;
  }
  
  // Importamos a lista de sistemas permitidos
  const { ORDAX_ALLOWED_SYSTEMS } = require("./spec-lint-config");
  return ORDAX_ALLOWED_SYSTEMS.includes(v as OrdaxAllowedSystem);
}

/**
 * Type guard para string array (sistemas)
 */
export function isStringArray(v: unknown): v is string[] {
  if (!Array.isArray(v)) {
    return false;
  }
  
  return v.every(item => typeof item === "string");
}

/**
 * Type guard para Partial OrdaxSpec
 */
export function isPartialOrdaxSpec(v: unknown): v is Partial<OrdaxSpec> {
  if (!v || typeof v !== "object") {
    return false;
  }
  
  const obj = v as Record<string, unknown>;
  
  // Todos os campos são opcionais, mas se presentes devem ter tipos válidos
  
  // gameType (opcional)
  if (obj.gameType !== undefined && typeof obj.gameType !== "string") {
    return false;
  }
  
  // title (opcional)
  if (obj.title !== undefined && typeof obj.title !== "string") {
    return false;
  }
  
  // description (opcional)
  if (obj.description !== undefined && typeof obj.description !== "string") {
    return false;
  }
  
  // systems (opcional)
  if (obj.systems !== undefined && !isStringArray(obj.systems)) {
    return false;
  }
  
  // visual (opcional)
  if (obj.visual !== undefined) {
    if (typeof obj.visual !== "object" || obj.visual === null) {
      return false;
    }
    
    const visual = obj.visual as Record<string, unknown>;
    if (visual.theme !== undefined) {
      if (typeof visual.theme !== "object" || visual.theme === null) {
        return false;
      }
    }
  }
  
  // scene (opcional)
  if (obj.scene !== undefined) {
    if (typeof obj.scene !== "object" || obj.scene === null) {
      return false;
    }
    
    const scene = obj.scene as Record<string, unknown>;
    
    // entities (opcional)
    if (scene.entities !== undefined) {
      if (!Array.isArray(scene.entities)) {
        return false;
      }
      
      // Validação básica de entidades
      for (const entity of scene.entities) {
        if (!entity || typeof entity !== "object") {
          return false;
        }
      }
    }
    
    // gravity (opcional)
    if (scene.gravity !== undefined) {
      if (typeof scene.gravity !== "object" || scene.gravity === null) {
        return false;
      }
      
      const gravity = scene.gravity as Record<string, unknown>;
      if (typeof gravity.x !== "number" || typeof gravity.y !== "number") {
        return false;
      }
    }
  }
  
  return true;
}

// ============================================================================
// VALIDATION FUNCTIONS
// ============================================================================

/**
 * Valida se uma string é um formato HSL válido
 */
export function isValidHslString(v: unknown): boolean {
  if (typeof v !== "string") {
    return false;
  }
  
  const str = v.trim();
  
  // Verifica prefixo
  if (!str.startsWith("hsl(") && !str.startsWith("hsla(")) {
    return false;
  }
  
  // Verifica sufixo
  if (!str.endsWith(")")) {
    return false;
  }
  
  // Extrai conteúdo dentro dos parênteses
  const content = str.slice(str.indexOf("(") + 1, -1).trim();
  
  // Valida formato básico (h, s%, l%) ou (h, s%, l%, a)
  const parts = content.split(",").map(p => p.trim());
  
  if (parts.length < 3 || parts.length > 4) {
    return false;
  }
  
  // Valida hue (0-360)
  const hue = parseFloat(parts[0]);
  if (isNaN(hue) || hue < 0 || hue > 360) {
    return false;
  }
  
  // Valida saturation (0-100%)
  const saturation = parts[1].endsWith("%") 
    ? parseFloat(parts[1].slice(0, -1))
    : parseFloat(parts[1]);
  
  if (isNaN(saturation) || saturation < 0 || saturation > 100) {
    return false;
  }
  
  // Valida lightness (0-100%)
  const lightness = parts[2].endsWith("%")
    ? parseFloat(parts[2].slice(0, -1))
    : parseFloat(parts[2]);
  
  if (isNaN(lightness) || lightness < 0 || lightness > 100) {
    return false;
  }
  
  // Valida alpha se presente (0-1)
  if (parts.length === 4) {
    const alpha = parseFloat(parts[3]);
    if (isNaN(alpha) || alpha < 0 || alpha > 1) {
      return false;
    }
  }
  
  return true;
}

/**
 * Valida se um tema tem cores HSL válidas
 */
export function hasValidHslTheme(theme: unknown): boolean {
  if (!theme || typeof theme !== "object") {
    return false;
  }
  
  const themeObj = theme as Record<string, unknown>;
  
  // Campos opcionais, mas se presentes devem ser HSL válidos
  const fields = ["background", "primary", "accent", "secondary"] as const;
  
  for (const field of fields) {
    if (themeObj[field] !== undefined && !isValidHslString(themeObj[field])) {
      return false;
    }
  }
  
  return true;
}

/**
 * Valida se uma entidade está dentro dos bounds do mundo
 */
export function isEntityInBounds(
  entity: OrdaxEntity,
  worldWidth: number,
  worldHeight: number
): boolean {
  const halfWidth = entity.w / 2;
  const halfHeight = entity.h / 2;
  
  return (
    entity.x >= halfWidth &&
    entity.x <= worldWidth - halfWidth &&
    entity.y >= halfHeight &&
    entity.y <= worldHeight - halfHeight
  );
}

/**
 * Valida e normaliza um número dentro de um range
 */
export function clampNumber(
  value: unknown,
  min: number,
  max: number,
  defaultValue: number
): number {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    return defaultValue;
  }
  
  return Math.max(min, Math.min(max, value));
}

/**
 * Valida se um array tem elementos duplicados
 */
export function hasDuplicates<T>(array: T[]): boolean {
  const seen = new Set<T>();
  
  for (const item of array) {
    if (seen.has(item)) {
      return true;
    }
    seen.add(item);
  }
  
  return false;
}

/**
 * Retorna elementos duplicados em um array
 */
export function getDuplicates<T>(array: T[]): T[] {
  const seen = new Set<T>();
  const duplicates = new Set<T>();
  
  for (const item of array) {
    if (seen.has(item)) {
      duplicates.add(item);
    } else {
      seen.add(item);
    }
  }
  
  return Array.from(duplicates);
}

// ============================================================================
// HELPER TYPES
// ============================================================================

/**
 * Resultado de uma operação de fix
 */
export interface FixOperationResult<T> {
  result: T;
  fix?: OrdaxSpecFix;
}

/**
 * Opções para lint
 */
export interface LintOptions {
  strictMode?: boolean;
  autoFix?: boolean;
  maxIssues?: number;
  validateTheme?: boolean;
  validateBounds?: boolean;
  validateSystems?: boolean;
}

/**
 * Opções para auto-fix
 */
export interface AutoFixOptions {
  addMissingPlayer?: boolean;
  renameDuplicateIds?: boolean;
  clampToWorld?: boolean;
  filterInvalidSystems?: boolean;
  fillMissingDefaults?: boolean;
}