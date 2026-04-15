// collisionSystemConfig.ts
// Configuration constants and utilities for CollisionSystem
// ✅ SSOT: Importa constantes do config.ts

import type { CollisionSystemConfig } from "./collisionSystemTypes";
import { COLLISION_CONSTANTS, COLLISION_ALGORITHM } from "../config";

// ============================================================================
// COLLISION ALGORITHM CONSTANTS
// ============================================================================

/**
 * AABB (Axis-Aligned Bounding Box) collision detection constants
 * ✅ SSOT: Uses COLLISION_ALGORITHM from config.ts
 */
export const AABB_CONFIG = {
  /** Use center-based calculations (true) or corner-based (false) */
  USE_CENTER_BASED: true,
  /** Include epsilon for floating point precision */
  EPSILON: COLLISION_ALGORITHM.EPSILON,
  /** Minimum overlap to consider a collision */
  MIN_OVERLAP: COLLISION_ALGORITHM.MIN_OVERLAP
} as const;

/**
 * Circle collision detection constants
 * ✅ SSOT: Uses COLLISION_ALGORITHM from config.ts
 */
export const CIRCLE_CONFIG = {
  /** Default radius property name if not specified */
  RADIUS_PROPERTY: "radius",
  /** Default radius if not specified */
  DEFAULT_RADIUS: COLLISION_ALGORITHM.DEFAULT_RADIUS,
  /** Epsilon for distance comparisons */
  EPSILON: COLLISION_ALGORITHM.EPSILON
} as const;

/**
 * SAT (Separating Axis Theorem) collision detection constants
 * ✅ SSOT: Uses COLLISION_ALGORITHM from config.ts
 */
export const SAT_CONFIG = {
  /** Number of axes to test (for polygons) */
  AXIS_COUNT: COLLISION_ALGORITHM.AXIS_COUNT,
  /** Epsilon for projection comparisons */
  EPSILON: COLLISION_ALGORITHM.EPSILON,
  /** Minimum penetration depth */
  MIN_PENETRATION: COLLISION_ALGORITHM.MIN_PENETRATION
} as const;

// ============================================================================
// PERFORMANCE CONSTANTS
// ============================================================================

/**
 * Spatial partitioning grid configuration
 * ✅ SSOT: Usa COLLISION_CONSTANTS do config.ts
 */
export const SPATIAL_PARTITIONING_CONFIG = {
  /** Grid cell size (pixels) */
  CELL_SIZE: COLLISION_CONSTANTS.CELL_SIZE,
  /** Maximum entities per cell before subdivision */
  MAX_ENTITIES_PER_CELL: COLLISION_CONSTANTS.MAX_ENTITIES_PER_CELL,
  /** Maximum grid dimensions */
  MAX_GRID_WIDTH: COLLISION_CONSTANTS.MAX_GRID_WIDTH,
  MAX_GRID_HEIGHT: COLLISION_CONSTANTS.MAX_GRID_HEIGHT
} as const;

/**
 * Performance optimization constants
 * ✅ SSOT: Usa COLLISION_CONSTANTS do config.ts
 */
export const PERFORMANCE_CONFIG = {
  /** Batch size for entity processing */
  BATCH_SIZE: COLLISION_CONSTANTS.BATCH_SIZE,
  /** Frame time budget for collision detection (ms) */
  FRAME_TIME_BUDGET_MS: COLLISION_CONSTANTS.FRAME_TIME_BUDGET_MS,
  /** Enable profiling */
  ENABLE_PROFILING: false,
  /** Profile sample size */
  PROFILE_SAMPLE_SIZE: 100
} as const;

// ============================================================================
// CALLBACK MANAGEMENT CONSTANTS
// ============================================================================

/**
 * Callback execution constants
 * ✅ SSOT: Usa COLLISION_CONSTANTS do config.ts
 */
export const CALLBACK_CONFIG = {
  /** Maximum callbacks to execute per collision */
  MAX_CALLBACKS_PER_COLLISION: COLLISION_CONSTANTS.MAX_CALLBACKS_PER_COLLISION,
  /** Callback execution timeout (ms) */
  EXECUTION_TIMEOUT_MS: COLLISION_CONSTANTS.EXECUTION_TIMEOUT_MS,
  /** Enable callback queuing */
  ENABLE_QUEUING: true,
  /** Queue processing batch size */
  QUEUE_BATCH_SIZE: COLLISION_CONSTANTS.QUEUE_BATCH_SIZE
} as const;

/**
 * Callback error handling constants
 */
export const ERROR_HANDLING_CONFIG = {
  /** Maximum consecutive callback errors before disabling */
  MAX_CONSECUTIVE_ERRORS: 3,
  /** Error cooldown period (ms) */
  ERROR_COOLDOWN_MS: 1000,
  /** Log callback errors */
  LOG_CALLBACK_ERRORS: true,
  /** Re-throw callback errors */
  RETHROW_ERRORS: false
} as const;

// ============================================================================
// VALIDATION CONSTANTS
// ============================================================================

/**
 * Entity validation constants
 */
export const VALIDATION_CONFIG = {
  /** Maximum entity position value */
  MAX_POSITION: 10000,
  /** Minimum entity position value */
  MIN_POSITION: -10000,
  /** Maximum entity dimension */
  MAX_DIMENSION: 1000,
  /** Minimum entity dimension */
  MIN_DIMENSION: 0.1,
  /** Validate entity types against whitelist */
  VALIDATE_TYPES: false
} as const;

/**
 * Entity type whitelist (if VALIDATE_TYPES is true)
 */
export const ENTITY_TYPE_WHITELIST = [
  "player", "enemy", "bullet", "wall", "obstacle", "powerup",
  "collectible", "platform", "door", "trigger", "npc", "vehicle"
] as const;

// ============================================================================
// DEBUGGING AND LOGGING CONSTANTS
// ============================================================================

/**
 * Debugging constants
 */
export const DEBUG_CONFIG = {
  /** Enable collision visualization */
  ENABLE_VISUALIZATION: false,
  /** Draw collision bounds */
  DRAW_BOUNDS: false,
  /** Draw collision normals */
  DRAW_NORMALS: false,
  /** Log collision events */
  LOG_COLLISIONS: false,
  /** Log performance metrics */
  LOG_PERFORMANCE: false
} as const;

/**
 * Logging level constants
 */
export const LOG_LEVEL = {
  NONE: 0,
  ERROR: 1,
  WARN: 2,
  INFO: 3,
  DEBUG: 4
} as const;

// ============================================================================
// CONFIGURATION PRESETS
// ============================================================================

/**
 * Performance-optimized configuration
 */
export const PERFORMANCE_PRESET: CollisionSystemConfig = {
  maxEntities: 500,
  maxCallbacksPerType: 5,
  algorithm: "AABB",
  useSpatialPartitioning: true,
  enableCaching: true,
  callbackTimeoutMs: 50
} as const;

/**
 * Accuracy-optimized configuration
 */
export const ACCURACY_PRESET: CollisionSystemConfig = {
  maxEntities: 200,
  maxCallbacksPerType: 20,
  algorithm: "SAT",
  useSpatialPartitioning: false,
  enableCaching: false,
  callbackTimeoutMs: 200
} as const;

/**
 * Development/debugging configuration
 */
export const DEBUG_PRESET: CollisionSystemConfig = {
  maxEntities: 100,
  maxCallbacksPerType: 10,
  algorithm: "AABB",
  useSpatialPartitioning: false,
  enableCaching: false,
  callbackTimeoutMs: 1000
} as const;

// ============================================================================
// CONFIGURATION UTILITIES
// ============================================================================

/**
 * Get configuration preset by name
 */
export function getConfigPreset(preset: "performance" | "accuracy" | "debug"): CollisionSystemConfig {
  switch (preset) {
    case "performance":
      return { ...PERFORMANCE_PRESET };
    case "accuracy":
      return { ...ACCURACY_PRESET };
    case "debug":
      return { ...DEBUG_PRESET };
    default:
      return { ...PERFORMANCE_PRESET };
  }
}

/**
 * Merge user configuration with defaults
 */
export function mergeConfig(userConfig: Partial<CollisionSystemConfig>): CollisionSystemConfig {
  const baseConfig = getConfigPreset("performance");
  
  return {
    ...baseConfig,
    ...userConfig,
    // Ensure numeric values are within bounds
    maxEntities: Math.max(1, Math.min(userConfig.maxEntities ?? baseConfig.maxEntities, 10000)),
    maxCallbacksPerType: Math.max(1, Math.min(userConfig.maxCallbacksPerType ?? baseConfig.maxCallbacksPerType, 100)),
    callbackTimeoutMs: Math.max(0, Math.min(userConfig.callbackTimeoutMs ?? baseConfig.callbackTimeoutMs, 5000))
  };
}

/**
 * Validate configuration against constraints
 */
export function validateConfigConstraints(config: CollisionSystemConfig): string[] {
  const warnings: string[] = [];
  
  if (config.maxEntities > 2000) {
    warnings.push(`maxEntities (${config.maxEntities}) is high, may impact performance`);
  }
  
  if (config.maxCallbacksPerType > 20) {
    warnings.push(`maxCallbacksPerType (${config.maxCallbacksPerType}) is high, may impact performance`);
  }
  
  if (config.callbackTimeoutMs > 1000) {
    warnings.push(`callbackTimeoutMs (${config.callbackTimeoutMs}ms) is high, may cause UI freezing`);
  }
  
  if (config.algorithm === "SAT" && config.maxEntities > 100) {
    warnings.push(`SAT algorithm with ${config.maxEntities} entities may be slow`);
  }
  
  return warnings;
}

// ============================================================================
// EXPORTS
// ============================================================================

export {
  // Re-export types for convenience
  type CollisionSystemConfig
};