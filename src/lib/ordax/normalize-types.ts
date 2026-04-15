/**
 * Type guards and validation for normalize.ts
 * Centralized type safety to eliminate `as any` assertions
 */

import type { 
  OrdaxBackgroundLayer, 
  OrdaxEntity, 
  OrdaxGameType, 
  OrdaxSpec, 
  OrdaxVisualTheme,
  OrdaxVisual
} from "./types";

// ============================================================================
// TYPE GUARDS
// ============================================================================

/**
 * Type guard for HslObj
 */
export interface HslObj {
  h: number;
  s: number;
  l: number;
}

export function isHslObj(v: unknown): v is HslObj {
  if (!v || typeof v !== "object") {
    return false;
  }
  
  const obj = v as Record<string, unknown>;
  return (
    typeof obj.h === "number" &&
    typeof obj.s === "number" &&
    typeof obj.l === "number" &&
    obj.h >= 0 && obj.h <= 360 &&
    obj.s >= 0 && obj.s <= 100 &&
    obj.l >= 0 && obj.l <= 100
  );
}

/**
 * Type guard for OrdaxEntity
 */
export function isOrdaxEntity(v: unknown): v is OrdaxEntity {
  if (!v || typeof v !== "object") {
    return false;
  }
  
  const obj = v as Record<string, unknown>;
  return (
    typeof obj.id === "string" &&
    typeof obj.type === "string" &&
    typeof obj.x === "number" &&
    typeof obj.y === "number" &&
    typeof obj.w === "number" &&
    typeof obj.h === "number" &&
    Number.isFinite(obj.x) &&
    Number.isFinite(obj.y) &&
    Number.isFinite(obj.w) &&
    Number.isFinite(obj.h) &&
    obj.w > 0 &&
    obj.h > 0
  );
}

/**
 * Type guard for OrdaxEntity array
 */
export function isOrdaxEntityArray(v: unknown): v is OrdaxEntity[] {
  if (!Array.isArray(v)) {
    return false;
  }
  
  return v.every(isOrdaxEntity);
}

/**
 * Type guard for OrdaxGameType
 * For 100% generic system, accepts any non-empty string
 * Legacy validation for backward compatibility
 */
export function isOrdaxGameType(v: unknown): v is OrdaxGameType {
  if (typeof v !== "string") {
    return false;
  }
  
  // Accept any non-empty string for 100% generic system
  // Legacy validation for backward compatibility
  const legacyTypes = [
    "platformer", "topdown", "shooter", "puzzle", "racing", "sports", "unknown"
  ];
  
  if (legacyTypes.includes(v)) {
    return true;
  }
  
  // Any non-empty string is valid for generic system
  return v.trim().length > 0;
}

/**
 * Type guard for OrdaxVisual
 * For 100% generic system, accepts any visual shape
 * Legacy validation for backward compatibility
 */
export function isOrdaxVisual(v: unknown): v is OrdaxVisual {
  if (!v || typeof v !== "object") {
    return false;
  }
  
  const obj = v as Record<string, unknown>;
  if (typeof obj.shape !== "string") {
    return false;
  }
  
  // Legacy validation for backward compatibility
  const legacyShapes = [
    "rect", "circle", "triangle", "car", "spaceship", "platform", "sprite", "path"
  ];
  
  if (legacyShapes.includes(obj.shape)) {
    return true;
  }
  
  // Any non-empty string is valid for generic system
  return obj.shape.trim().length > 0;
}

/**
 * Type guard for OrdaxVisualTheme
 */
export function isOrdaxVisualTheme(v: unknown): v is OrdaxVisualTheme {
  if (!v || typeof v !== "object") {
    return false;
  }
  
  const obj = v as Record<string, unknown>;
  
  // All fields are optional, but if present must be strings
  if (obj.background !== undefined && typeof obj.background !== "string") {
    return false;
  }
  if (obj.primary !== undefined && typeof obj.primary !== "string") {
    return false;
  }
  if (obj.secondary !== undefined && typeof obj.secondary !== "string") {
    return false;
  }
  if (obj.accent !== undefined && typeof obj.accent !== "string") {
    return false;
  }
  if (obj.font !== undefined && typeof obj.font !== "string") {
    return false;
  }
  
  return true;
}

/**
 * Type guard for OrdaxBackgroundLayer
 * For 100% generic system, accepts any background layer type
 * Legacy validation for backward compatibility
 */
export function isOrdaxBackgroundLayer(v: unknown): v is OrdaxBackgroundLayer {
  if (!v || typeof v !== "object") {
    return false;
  }
  
  const obj = v as Record<string, unknown>;
  if (typeof obj.type !== "string") {
    return false;
  }
  
  // Legacy validation for backward compatibility
  const legacyTypes = [
    "solid", "gradient", "starfield", "nebula"
  ];
  
  if (legacyTypes.includes(obj.type)) {
    // Validate legacy type-specific properties
    if (obj.type === "starfield") {
      if (obj.density !== undefined && typeof obj.density !== "number") {
        return false;
      }
      if (obj.speedY !== undefined && typeof obj.speedY !== "number") {
        return false;
      }
    }
    return true;
  }
  
  // Any non-empty string is valid for generic system
  // Custom background types can have any properties
  return obj.type.trim().length > 0;
  
  return true;
}

/**
 * Type guard for OrdaxBackgroundLayer array
 */
export function isOrdaxBackgroundLayerArray(v: unknown): v is OrdaxBackgroundLayer[] {
  if (!Array.isArray(v)) {
    return false;
  }
  
  return v.every(isOrdaxBackgroundLayer);
}

/**
 * Type guard for OrdaxSpec
 */
export function isOrdaxSpec(v: unknown): v is OrdaxSpec {
  if (!v || typeof v !== "object") {
    return false;
  }
  
  const obj = v as Record<string, unknown>;
  
  // Required fields
  if (!isOrdaxGameType(obj.gameType)) {
    return false;
  }
  if (typeof obj.title !== "string" || obj.title.trim().length === 0) {
    return false;
  }
  if (typeof obj.description !== "string") {
    return false;
  }
  
  // Optional but validated fields
  if (obj.systems !== undefined && !Array.isArray(obj.systems)) {
    return false;
  }
  if (obj.systems !== undefined && !(obj.systems as unknown[]).every((s: unknown) => typeof s === "string")) {
    return false;
  }
  
  if (obj.visual !== undefined) {
    const visual = obj.visual as Record<string, unknown>;
    if (visual.theme !== undefined && !isOrdaxVisualTheme(visual.theme)) {
      return false;
    }
  }
  
  if (obj.scene !== undefined) {
    const scene = obj.scene as Record<string, unknown>;
    if (scene.gravity !== undefined) {
      const gravity = scene.gravity as Record<string, unknown>;
      if (typeof gravity.x !== "number" || typeof gravity.y !== "number") {
        return false;
      }
    }
    
    if (scene.entities !== undefined && !isOrdaxEntityArray(scene.entities)) {
      return false;
    }
  }
  
  return true;
}

// ============================================================================
// VALIDATION FUNCTIONS
// ============================================================================

/**
 * Validate and convert HSL value to string
 */
export function validateAndConvertHsl(v: unknown, fallback: string): string {
  if (typeof v === "string") {
    // Basic HSL string validation
    if (v.startsWith("hsl(") && v.endsWith(")")) {
      return v;
    }
    // Could be other color format, return as-is
    return v;
  }
  
  if (isHslObj(v)) {
    return `hsl(${v.h}, ${v.s}%, ${v.l}%)`;
  }
  
  return fallback;
}

/**
 * Validate numeric range
 */
export function validateNumberRange(
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
 * Validate entity position
 */
export function validateEntityPosition(
  x: unknown,
  y: unknown,
  defaultValue: { x: number; y: number }
): { x: number; y: number } {
  return {
    x: validateNumberRange(x, -10000, 10000, defaultValue.x),
    y: validateNumberRange(y, -10000, 10000, defaultValue.y)
  };
}

/**
 * Validate entity size
 */
export function validateEntitySize(
  w: unknown,
  h: unknown,
  defaultValue: { w: number; h: number }
): { w: number; h: number } {
  return {
    w: validateNumberRange(w, 1, 1000, defaultValue.w),
    h: validateNumberRange(h, 1, 1000, defaultValue.h)
  };
}

// ============================================================================
// HELPER TYPES
// ============================================================================

/**
 * Partial OrdaxSpec for adaptation
 */
export type PartialOrdaxSpec = {
  gameType?: OrdaxGameType;
  title?: string;
  description?: string;
  systems?: string[];
  visual?: {
    theme?: Partial<OrdaxVisualTheme>;
    background?: {
      layers?: OrdaxBackgroundLayer[];
    };
  };
  scene?: {
    gravity?: { x: number; y: number };
    entities?: OrdaxEntity[];
  };
  audio?: {
    music?: string;
    sounds?: Record<string, string>;
  };
};

/**
 * Normalization result with validation details
 */
export interface NormalizationResult {
  spec: OrdaxSpec;
  changes: Array<{
    field: string;
    action: "added" | "modified" | "removed";
    before?: unknown;
    after: unknown;
    reason: string;
  }>;
  warnings: string[];
}

/**
 * Normalization options
 */
export interface NormalizeOptions {
  strictMode?: boolean;
  fillMissingEntities?: boolean;
  fillMissingSystems?: boolean;
  gameType?: OrdaxGameType;
}