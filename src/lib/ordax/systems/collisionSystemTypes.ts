// collisionSystemTypes.ts
// Type definitions and guards for CollisionSystem

import type { OrdaxEntity } from "../types";

// ============================================================================
// INTERFACES
// ============================================================================

/**
 * Entity that can participate in collision detection
 * Must have position, dimensions, and type
 */
export interface CollidableEntity extends OrdaxEntity {
  /** X position (center) */
  x: number;
  /** Y position (center) */
  y: number;
  /** Width of collision bounds */
  w: number;
  /** Height of collision bounds */
  h: number;
  /** Entity type for collision filtering */
  type: string;
  /** Optional radius for circle collision (defaults to w/2) */
  radius?: number;
}

/**
 * Collision callback function type
 * Returns boolean indicating if collision was handled successfully
 */
export type CollisionCallback = (a: CollidableEntity, b: CollidableEntity) => boolean;

/**
 * Collision information returned by getCollisionInfo
 */
export interface CollisionInfo {
  /** Distance between entity centers */
  distance: number;
  /** Angle from a to b in radians */
  angle: number;
  /** Overlap amounts in x and y axes */
  overlap: {
    x: number;
    y: number;
  };
}

/**
 * Collision detection algorithm type
 */
export type CollisionAlgorithm = "AABB" | "CIRCLE" | "SAT";

/**
 * Collision system configuration
 */
export interface CollisionSystemConfig {
  /** Maximum number of entities to process before early exit */
  maxEntities: number;
  /** Maximum number of callbacks per collision type */
  maxCallbacksPerType: number;
  /** Collision algorithm to use */
  algorithm: CollisionAlgorithm;
  /** Enable spatial partitioning */
  useSpatialPartitioning: boolean;
  /** Enable collision info caching */
  enableCaching: boolean;
  /** Timeout for callback execution (ms) */
  callbackTimeoutMs: number;
}

/**
 * Result type for operations that can fail
 */
export type Result<T, E = Error> = 
  | { success: true; value: T }
  | { success: false; error: E };

// ============================================================================
// TYPE GUARDS
// ============================================================================

/**
 * Check if an entity is collidable (has required properties)
 */
export function isCollidableEntity(entity: unknown): entity is CollidableEntity {
  if (!entity || typeof entity !== "object") return false;
  
  const e = entity as Record<string, unknown>;
  
  return (
    typeof e.x === "number" && !isNaN(e.x) && isFinite(e.x) &&
    typeof e.y === "number" && !isNaN(e.y) && isFinite(e.y) &&
    typeof e.w === "number" && !isNaN(e.w) && isFinite(e.w) && e.w > 0 &&
    typeof e.h === "number" && !isNaN(e.h) && isFinite(e.h) && e.h > 0 &&
    typeof e.type === "string" && e.type.trim().length > 0
  );
}

/**
 * Check if an array contains only collidable entities
 */
export function isCollidableEntityArray(entities: unknown): entities is CollidableEntity[] {
  if (!Array.isArray(entities)) return false;
  
  // Early exit for empty arrays
  if (entities.length === 0) return true;
  
  // Check first few elements to validate
  const sampleSize = Math.min(entities.length, 5);
  for (let i = 0; i < sampleSize; i++) {
    if (!isCollidableEntity(entities[i])) return false;
  }
  
  return true;
}

/**
 * Check if a value is a valid collision callback
 */
export function isCollisionCallback(callback: unknown): callback is CollisionCallback {
  return typeof callback === "function";
}

/**
 * Check if a value is a valid collision algorithm
 */
export function isCollisionAlgorithm(algorithm: unknown): algorithm is CollisionAlgorithm {
  return typeof algorithm === "string" && 
    ["AABB", "CIRCLE", "SAT"].includes(algorithm);
}

/**
 * Validate collision system configuration
 */
export function validateCollisionSystemConfig(config: unknown): Result<CollisionSystemConfig> {
  if (!config || typeof config !== "object") {
    return {
      success: false,
      error: new Error("Config must be an object")
    };
  }
  
  const c = config as Record<string, unknown>;
  
  // Validate maxEntities
  if (typeof c.maxEntities !== "number" || !Number.isInteger(c.maxEntities) || c.maxEntities < 1) {
    return {
      success: false,
      error: new Error("maxEntities must be a positive integer")
    };
  }
  
  // Validate maxCallbacksPerType
  if (typeof c.maxCallbacksPerType !== "number" || !Number.isInteger(c.maxCallbacksPerType) || c.maxCallbacksPerType < 1) {
    return {
      success: false,
      error: new Error("maxCallbacksPerType must be a positive integer")
    };
  }
  
  // Validate algorithm
  if (!isCollisionAlgorithm(c.algorithm)) {
    return {
      success: false,
      error: new Error(`algorithm must be one of: "AABB", "CIRCLE", "SAT"`)
    };
  }
  
  // Validate useSpatialPartitioning
  if (typeof c.useSpatialPartitioning !== "boolean") {
    return {
      success: false,
      error: new Error("useSpatialPartitioning must be a boolean")
    };
  }
  
  // Validate enableCaching
  if (typeof c.enableCaching !== "boolean") {
    return {
      success: false,
      error: new Error("enableCaching must be a boolean")
    };
  }
  
  // Validate callbackTimeoutMs
  if (typeof c.callbackTimeoutMs !== "number" || !Number.isInteger(c.callbackTimeoutMs) || c.callbackTimeoutMs < 0) {
    return {
      success: false,
      error: new Error("callbackTimeoutMs must be a non-negative integer")
    };
  }
  
  return {
    success: true,
    value: config as CollisionSystemConfig
  };
}

// ============================================================================
// VALIDATION FUNCTIONS
// ============================================================================

/**
 * Validate entity type string
 */
export function validateEntityType(type: unknown): Result<void, Error> {
  if (typeof type !== "string") {
    return {
      success: false,
      error: new Error("Entity type must be a string")
    };
  }
  
  const trimmed = type.trim();
  if (trimmed.length === 0) {
    return {
      success: false,
      error: new Error("Entity type cannot be empty")
    };
  }
  
  return {
    success: true,
    value: undefined
  };
}

/**
 * Validate and normalize entity type string
 */
export function validateAndNormalizeEntityType(type: unknown): Result<string> {
  if (typeof type !== "string") {
    return {
      success: false,
      error: new Error("Entity type must be a string")
    };
  }
  
  const trimmed = type.trim();
  if (trimmed.length === 0) {
    return {
      success: false,
      error: new Error("Entity type cannot be empty")
    };
  }
  
  return {
    success: true,
    value: trimmed.toLowerCase()
  };
}

/**
 * Validate collision key (typeA:typeB)
 */
export function validateCollisionKey(key: unknown): Result<string> {
  if (typeof key !== "string") {
    return {
      success: false,
      error: new Error("Collision key must be a string")
    };
  }
  
  const parts = key.split(":");
  if (parts.length !== 2) {
    return {
      success: false,
      error: new Error(`Invalid collision key format: ${key}. Expected "typeA:typeB"`)
    };
  }
  
  const [typeA, typeB] = parts;
  const typeAResult = validateEntityType(typeA);
  const typeBResult = validateEntityType(typeB);
  
  if (typeAResult.success === false) {
    const error = typeAResult.error;
    return { success: false, error };
  }
  if (typeBResult.success === false) {
    const error = typeBResult.error;
    return { success: false, error };
  }
  
  return {
    success: true,
    value: `${typeAResult.value}:${typeBResult.value}`
  };
}

/**
 * Create collision key from two entity types
 */
export function createCollisionKey(typeA: string, typeB: string): Result<string> {
  const typeAResult = validateAndNormalizeEntityType(typeA);
  const typeBResult = validateAndNormalizeEntityType(typeB);
  
  if (!typeAResult.success) return typeAResult;
  if (!typeBResult.success) return typeBResult;
  
  // Sort types to ensure consistent key (player:enemy == enemy:player)
  const sortedTypes = [typeAResult.value, typeBResult.value].sort();
  
  return {
    success: true,
    value: `${sortedTypes[0]}:${sortedTypes[1]}`
  };
}

/**
 * Create collision key from two entity types (void return version for methods)
 */
export function createCollisionKeyForMethod(typeA: string, typeB: string): Result<void, Error> {
  const typeAResult = validateEntityType(typeA);
  const typeBResult = validateEntityType(typeB);
  
  if (typeAResult.success === false) {
    const error = typeAResult.error;
    return { success: false, error };
  }
  if (typeBResult.success === false) {
    const error = typeBResult.error;
    return { success: false, error };
  }
  
  return { success: true, value: undefined };
}

/**
 * Validate collision info calculation inputs
 */
export function validateCollisionInfoInputs(a: unknown, b: unknown): Result<{ a: CollidableEntity; b: CollidableEntity }> {
  if (!isCollidableEntity(a)) {
    return {
      success: false,
      error: new Error("Entity A is not collidable")
    };
  }
  
  if (!isCollidableEntity(b)) {
    return {
      success: false,
      error: new Error("Entity B is not collidable")
    };
  }
  
  return {
    success: true,
    value: { a, b }
  };
}

// ============================================================================
// CONSTANTS
// ============================================================================

/**
 * Default collision system configuration
 */
export const DEFAULT_COLLISION_CONFIG: CollisionSystemConfig = {
  maxEntities: 1000,
  maxCallbacksPerType: 10,
  algorithm: "AABB",
  useSpatialPartitioning: true,
  enableCaching: true,
  callbackTimeoutMs: 100
} as const;

/**
 * Maximum number of entities before warning about performance
 */
export const PERFORMANCE_WARNING_THRESHOLD = 500;

/**
 * Maximum recursion depth for collision callbacks
 */
export const MAX_CALLBACK_RECURSION_DEPTH = 3;

/**
 * Error messages
 */
export const ERROR_MESSAGES = {
  INVALID_ENTITY: "Entity is not collidable",
  INVALID_ENTITY_ARRAY: "Entities array is invalid",
  INVALID_CALLBACK: "Callback must be a function",
  CALLBACK_TIMEOUT: "Callback execution timed out",
  MAX_CALLBACKS_EXCEEDED: "Maximum number of callbacks exceeded",
  INVALID_COLLISION_KEY: "Invalid collision key format",
  ENTITY_TYPE_EMPTY: "Entity type cannot be empty",
  CONFIG_VALIDATION_FAILED: "Collision system configuration validation failed"
} as const;