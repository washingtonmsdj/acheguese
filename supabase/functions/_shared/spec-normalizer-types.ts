// Type definitions for spec-normalizer.ts
// Centralized types to ensure consistency across the normalization pipeline

// Import shared types
import type { GamePlan } from "./genreContracts.ts";

// Re-export OrdaxSpec from frontend types (with adjustments for backend)
// Open types for 100% generic system - any valid string
export type OrdaxGameType = string; // Any game genre (racing, shooter, puzzle, custom, hybrid, etc.)

export type OrdaxVisualShape = string; // Any visual shape (rect, circle, custom, etc.)

// Legacy types for backward compatibility (DEPRECATED)
export type OrdaxGameTypeLegacy = "platformer" | "topdown" | "shooter" | "puzzle" | "racing" | "sports";
export type OrdaxVisualShapeLegacy = "rect" | "circle" | "triangle" | "car" | "spaceship" | "platform" | "sprite" | "path";

export type OrdaxVisual = {
  shape: OrdaxVisualShape;
  orientation?: "up" | "down" | "left" | "right";
  color?: string;
  strokeColor?: string;
  strokeWidth?: number;
  fill?: boolean;
  details?: Record<string, unknown>;
  path?: string;
};

export type OrdaxEntity = {
  id: string;
  type: string;
  x: number;
  y: number;
  w: number;
  h: number;
  visual?: OrdaxVisual;
  props?: Record<string, unknown>;
  sprite?: {
    url: string;
    frameWidth: number;
    frameHeight: number;
    currentAnimation?: string;
  };
};

export type OrdaxVisualTheme = {
  background?: string;
  primary?: string;
  accent?: string;
  font?: string;
};

export type OrdaxBackgroundLayer = {
  type: string; // Any background type (starfield, gradient, nebula, solid, or any custom type)
  parallax?: number;
  density?: number;
  speedY?: number;
};

// Main OrdaxSpec interface (backend version)
export interface OrdaxSpec {
  gameType: OrdaxGameType;
  title: string;
  description: string;
  systems: string[];
  visual?: {
    theme?: OrdaxVisualTheme;
    background?: {
      layers: OrdaxBackgroundLayer[];
    };
  };
  audio?: {
    music?: string;
    sounds?: {
      collision?: string;
      score?: string;
      gameOver?: string;
      jump?: string;
      shoot?: string;
    };
  };
  scene: {
    gravity: { x: number; y: number };
    entities: OrdaxEntity[];
  };
}

// Spawner configuration
export interface SpawnerConfig {
  interval?: number;
  maxCount?: number;
  types?: string[];
}

// UI configuration
export interface UIConfig {
  showScore?: boolean;
  showHealth?: boolean;
  showTimer?: boolean;
}

// Background configuration
export interface BackgroundConfig {
  layers?: OrdaxBackgroundLayer[];
  color?: string;
}

// Normalized spec (guaranteed to have all required fields)
export interface NormalizedSpec extends OrdaxSpec {
  gameType: OrdaxGameType;  // Not "unknown"
  title: string;            // Not empty
  description: string;      // May be empty but is string
  systems: string[];        // Not empty array
  scene: {
    gravity: { x: number; y: number };
    entities: OrdaxEntity[];
  };
}

// Partial spec (input may be incomplete)
export type PartialOrdaxSpec = Partial<OrdaxSpec> & {
  gameType?: string;
  title?: string;
  description?: string;
  systems?: unknown;
  scene?: {
    gravity?: { x?: number; y?: number };
    entities?: unknown;
  };
};

// Normalization options
export interface NormalizeOptions {
  gamePlan?: GamePlan;
  fillMissingEntities?: boolean;
  fillMissingSystems?: boolean;
  strictMode?: boolean;
  validationLevel?: "basic" | "strict" | "lenient";
}

// Validation result
export interface ValidationResult {
  valid: boolean;
  errors: string[];
  warnings?: string[];
  details?: {
    missingFields?: string[];
    invalidFields?: Array<{ field: string; reason: string }>;
    typeMismatches?: Array<{ field: string; expected: string; actual: string }>;
  };
}

// Normalization result
export interface NormalizationResult {
  spec: NormalizedSpec;
  changes: Array<{
    field: string;
    action: "added" | "modified" | "removed" | "normalized";
    before?: unknown;
    after: unknown;
    reason: string;
  }>;
  warnings: string[];
}

// Type guards
export function isOrdaxGameType(value: unknown): value is OrdaxGameType {
  // Accept any string as valid game type for 100% generic system
  // Still validate legacy types for backward compatibility
  if (typeof value !== "string") {
    return false;
  }
  
  // Accept any non-empty string as valid game type
  // Legacy validation for backward compatibility
  const legacyTypes = ["platformer", "topdown", "shooter", "puzzle", "racing", "sports"];
  if (legacyTypes.includes(value)) {
    return true;
  }
  
  // Any non-empty string is valid for generic system
  return value.trim().length > 0;
}

export function isOrdaxVisualShape(value: unknown): value is OrdaxVisualShape {
  // Accept any string as valid visual shape for 100% generic system
  // Still validate legacy shapes for backward compatibility
  if (typeof value !== "string") {
    return false;
  }
  
  // Accept any non-empty string as valid visual shape
  // Legacy validation for backward compatibility
  const legacyShapes = ["rect", "circle", "triangle", "car", "spaceship", "platform", "sprite", "path"];
  if (legacyShapes.includes(value)) {
    return true;
  }
  
  // Any non-empty string is valid for generic system
  return value.trim().length > 0;
}

export function isOrdaxEntity(value: unknown): value is OrdaxEntity {
  if (!value || typeof value !== "object") {
    return false;
  }
  
  const obj = value as Record<string, unknown>;
  
  if (typeof obj.id !== "string" || !obj.id.trim()) {
    return false;
  }
  
  if (typeof obj.type !== "string") {
    return false;
  }
  
  if (typeof obj.x !== "number") {
    return false;
  }
  
  if (typeof obj.y !== "number") {
    return false;
  }
  
  if (typeof obj.w !== "number") {
    return false;
  }
  
  if (typeof obj.h !== "number") {
    return false;
  }
  
  // Validate visual if present
  if (obj.visual !== undefined) {
    if (!obj.visual || typeof obj.visual !== "object") {
      return false;
    }
    
    const visual = obj.visual as Record<string, unknown>;
    if (!isOrdaxVisualShape(visual.shape)) {
      return false;
    }
  }
  
  return true;
}

export function isPartialOrdaxSpec(value: unknown): value is PartialOrdaxSpec {
  if (!value || typeof value !== "object") {
    return false;
  }
  
  const obj = value as Record<string, unknown>;
  
  // gameType is optional but must be string if present
  if (obj.gameType !== undefined && typeof obj.gameType !== "string") {
    return false;
  }
  
  // title is optional but must be string if present
  if (obj.title !== undefined && typeof obj.title !== "string") {
    return false;
  }
  
  // description is optional but must be string if present
  if (obj.description !== undefined && typeof obj.description !== "string") {
    return false;
  }
  
  // systems is optional
  if (obj.systems !== undefined && !Array.isArray(obj.systems)) {
    return false;
  }
  
  // scene is optional
  if (obj.scene !== undefined) {
    if (!obj.scene || typeof obj.scene !== "object") {
      return false;
    }
    
    const scene = obj.scene as Record<string, unknown>;
    
    // gravity is optional
    if (scene.gravity !== undefined) {
      if (!scene.gravity || typeof scene.gravity !== "object") {
        return false;
      }
      
      const gravity = scene.gravity as Record<string, unknown>;
      if (gravity.x !== undefined && typeof gravity.x !== "number") {
        return false;
      }
      if (gravity.y !== undefined && typeof gravity.y !== "number") {
        return false;
      }
    }
    
    // entities is optional
    if (scene.entities !== undefined && !Array.isArray(scene.entities)) {
      return false;
    }
  }
  
  return true;
}

export function isNormalizedSpec(value: unknown): value is NormalizedSpec {
  if (!isPartialOrdaxSpec(value)) {
    return false;
  }
  
  const obj = value as PartialOrdaxSpec;
  
  // Required fields must be present and valid
  if (typeof obj.gameType !== "string" || !obj.gameType.trim() || !isOrdaxGameType(obj.gameType)) {
    return false;
  }
  
  if (typeof obj.title !== "string" || !obj.title.trim()) {
    return false;
  }
  
  if (typeof obj.description !== "string") {
    return false;
  }
  
  if (!Array.isArray(obj.systems)) {
    return false;
  }
  
  if (!obj.scene || typeof obj.scene !== "object") {
    return false;
  }
  
  const scene = obj.scene as Record<string, unknown>;
  
  if (!scene.gravity || typeof scene.gravity !== "object") {
    return false;
  }
  
  const gravity = scene.gravity as Record<string, unknown>;
  if (typeof gravity.x !== "number" || typeof gravity.y !== "number") {
    return false;
  }
  
  if (!Array.isArray(scene.entities)) {
    return false;
  }
  
  // All entities must be valid
  // Type guard ensures entities is an array
  const entities = scene.entities;
  for (const entity of entities) {
    if (!isOrdaxEntity(entity)) {
      return false;
    }
  }
  
  return true;
}

// Helper types for gameplay configuration
export interface PlayerConfig {
  speed: number;
  health: number;
  maxHealth: number;
  forceMult?: number;
  canMoveVertical?: boolean;
  canMoveHorizontal?: boolean;
  canJump?: boolean;
  canShoot?: boolean;
  fireRate?: number;
  bulletSpeed?: number;
  bulletSize?: { w: number; h: number };
  bulletSpawnOffset?: { x: number; y: number };
  spreadAngle?: number;
  spreadSpeedMult?: number;
  jumpForce?: number;
  movementType?: "platformer" | "topdown" | "racing";
}

export interface SpawnerVariant {
  name: string;
  chance: number;
  size: number;
  hp: number;
  speed: number;
  speedPerWave?: number;
  speedVariation?: number;
  lateralSpeed?: number;
}

export interface SpawnerType {
  type: string;
  chance: number;
  chancePerWave?: number;
  maxChance?: number;
  variants?: SpawnerVariant[];
  size?: number | { base: number; variation: number };
  hp?: number;
  speed?: number | { base: number; perWave?: number; variation?: number };
}

export interface PowerupConfig {
  enabled: boolean;
  interval: number;
  chance: number;
  types: Array<{ kind: string; chance: number }>;
}

export interface SpawnerConfig {
  spawnRate: number;
  waveScoreInterval: number;
  waveRateIncrease: number;
  spawnTypes: SpawnerType[];
  powerups?: PowerupConfig;
}

export interface UIConfig {
  showHealth: boolean;
  showScore: boolean;
  showShield?: boolean;
  healthBarWidth: number;
  healthBarHeight: number;
  healthThresholds: {
    danger: number;
    warning: number;
  };
  controlsHint?: {
    movement?: string;
    action?: string;
    gameOver?: string;
  };
}

export interface BackgroundConfig {
  type: string;
  layers?: Array<{
    type: string;
    parallax?: number;
    density?: number;
    speedY?: number;
  }>;
  racingRoad?: {
    roadWidth: number;
    scrollSpeed: number;
    colors: {
      grass: string;
      road: string;
      border: string;
      centerLine: string;
    };
    centerLine: {
      dashHeight: number;
      gap: number;
      width: number;
    };
  };
}

export interface BackgroundConfigExtended extends BackgroundConfig {
  racingRoad?: {
    roadWidth: number;
    scrollSpeed: number;
    colors: {
      grass: string;
      road: string;
      border: string;
      centerLine: string;
    };
    centerLine: {
      dashHeight: number;
      gap: number;
      width: number;
    };
  };
}

// Helper types for internal use
export type EntityDetectionResult = {
  exists: boolean;
  entity?: OrdaxEntity;
  matchType: "exact" | "partial" | "none";
  details: {
    matchedById: boolean;
    matchedByType: boolean;
    matchedByPrefix: boolean;
  };
};

export type NormalizationContext = {
  gamePlan?: GamePlan;
  options: NormalizeOptions;
  changes: NormalizationResult["changes"];
  warnings: string[];
};