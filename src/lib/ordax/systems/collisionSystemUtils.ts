// collisionSystemUtils.ts
// Utility functions for CollisionSystem

import type { CollidableEntity, CollisionInfo, Result } from "./collisionSystemTypes";
import { AABB_CONFIG, CIRCLE_CONFIG, SAT_CONFIG } from "./collisionSystemConfig";

// ============================================================================
// COLLISION DETECTION ALGORITHMS
// ============================================================================

/**
 * AABB (Axis-Aligned Bounding Box) collision detection
 */
export function checkAABBCollision(a: CollidableEntity, b: CollidableEntity): boolean {
  // Calculate half dimensions
  const aHalfW = a.w / 2;
  const aHalfH = a.h / 2;
  const bHalfW = b.w / 2;
  const bHalfH = b.h / 2;
  
  // Check for overlap on both axes
  const overlapX = Math.abs(a.x - b.x) < (aHalfW + bHalfW - AABB_CONFIG.EPSILON);
  const overlapY = Math.abs(a.y - b.y) < (aHalfH + bHalfH - AABB_CONFIG.EPSILON);
  
  return overlapX && overlapY;
}

/**
 * Calculate AABB collision info
 */
export function getAABBCollisionInfo(a: CollidableEntity, b: CollidableEntity): CollisionInfo {
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  
  const aHalfW = a.w / 2;
  const aHalfH = a.h / 2;
  const bHalfW = b.w / 2;
  const bHalfH = b.h / 2;
  
  const distance = Math.hypot(dx, dy);
  const angle = Math.atan2(dy, dx);
  
  // Calculate overlap (positive = overlapping, negative = separated)
  const overlapX = (aHalfW + bHalfW) - Math.abs(dx);
  const overlapY = (aHalfH + bHalfH) - Math.abs(dy);
  
  return {
    distance,
    angle,
    overlap: {
      x: Math.max(overlapX, 0),
      y: Math.max(overlapY, 0)
    }
  };
}

/**
 * Circle collision detection
 */
export function checkCircleCollision(a: CollidableEntity, b: CollidableEntity): boolean {
  // Get radii (use width/2 as default if radius not specified)
  const radiusA = a.radius ?? a.w / 2;
  const radiusB = b.radius ?? b.w / 2;
  
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  const distanceSquared = dx * dx + dy * dy;
  const radiusSum = radiusA + radiusB;
  
  return distanceSquared < (radiusSum * radiusSum - CIRCLE_CONFIG.EPSILON);
}

/**
 * Calculate circle collision info
 */
export function getCircleCollisionInfo(a: CollidableEntity, b: CollidableEntity): CollisionInfo {
  const radiusA = a.radius ?? a.w / 2;
  const radiusB = b.radius ?? b.w / 2;
  
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  const distance = Math.hypot(dx, dy);
  const angle = Math.atan2(dy, dx);
  
  // Calculate overlap (positive = overlapping, negative = separated)
  const overlap = (radiusA + radiusB) - distance;
  
  return {
    distance,
    angle,
    overlap: {
      x: overlap > 0 ? overlap * Math.cos(angle) : 0,
      y: overlap > 0 ? overlap * Math.sin(angle) : 0
    }
  };
}

/**
 * SAT (Separating Axis Theorem) collision detection for convex polygons
 * Note: This is a simplified implementation
 */
export function checkSATCollision(a: CollidableEntity, b: CollidableEntity): boolean {
  // For rectangles, we can use AABB as a simplified SAT
  // Full SAT implementation would require polygon vertices
  return checkAABBCollision(a, b);
}

// ============================================================================
// SPATIAL PARTITIONING
// ============================================================================

/**
 * Simple grid-based spatial partitioning
 */
export class SpatialGrid {
  private grid: Map<string, CollidableEntity[]> = new Map();
  private cellSize: number;
  
  constructor(cellSize: number = 100) {
    this.cellSize = cellSize;
  }
  
  /**
   * Get grid cell key for position
   */
  private getCellKey(x: number, y: number): string {
    const cellX = Math.floor(x / this.cellSize);
    const cellY = Math.floor(y / this.cellSize);
    return `${cellX},${cellY}`;
  }
  
  /**
   * Insert entity into grid
   */
  insert(entity: CollidableEntity): void {
    // Get cells that entity occupies (could be multiple for large entities)
    const minX = entity.x - entity.w / 2;
    const maxX = entity.x + entity.w / 2;
    const minY = entity.y - entity.h / 2;
    const maxY = entity.y + entity.h / 2;
    
    const startCellX = Math.floor(minX / this.cellSize);
    const endCellX = Math.floor(maxX / this.cellSize);
    const startCellY = Math.floor(minY / this.cellSize);
    const endCellY = Math.floor(maxY / this.cellSize);
    
    // Insert into all occupied cells
    for (let cellX = startCellX; cellX <= endCellX; cellX++) {
      for (let cellY = startCellY; cellY <= endCellY; cellY++) {
        const key = `${cellX},${cellY}`;
        if (!this.grid.has(key)) {
          this.grid.set(key, []);
        }
        this.grid.get(key)!.push(entity);
      }
    }
  }
  
  /**
   * Clear grid
   */
  clear(): void {
    this.grid.clear();
  }
  
  /**
   * Get potential collision candidates for an entity
   */
  getCandidates(entity: CollidableEntity): CollidableEntity[] {
    const candidates = new Set<CollidableEntity>();
    const minX = entity.x - entity.w / 2;
    const maxX = entity.x + entity.w / 2;
    const minY = entity.y - entity.h / 2;
    const maxY = entity.y + entity.h / 2;
    
    const startCellX = Math.floor(minX / this.cellSize);
    const endCellX = Math.floor(maxX / this.cellSize);
    const startCellY = Math.floor(minY / this.cellSize);
    const endCellY = Math.floor(maxY / this.cellSize);
    
    // Check all occupied cells and neighboring cells
    for (let cellX = startCellX - 1; cellX <= endCellX + 1; cellX++) {
      for (let cellY = startCellY - 1; cellY <= endCellY + 1; cellY++) {
        const key = `${cellX},${cellY}`;
        const cellEntities = this.grid.get(key);
        if (cellEntities) {
          cellEntities.forEach(e => {
            if (e !== entity) {
              candidates.add(e);
            }
          });
        }
      }
    }
    
    return Array.from(candidates);
  }
}

// ============================================================================
// PERFORMANCE OPTIMIZATIONS
// ============================================================================

/**
 * Object pool for collision info objects
 */
export class CollisionInfoPool {
  private pool: CollisionInfo[] = [];
  private maxSize: number;
  
  constructor(maxSize: number = 100) {
    this.maxSize = maxSize;
  }
  
  /**
   * Get collision info from pool or create new
   */
  acquire(): CollisionInfo {
    if (this.pool.length > 0) {
      return this.pool.pop()!;
    }
    return {
      distance: 0,
      angle: 0,
      overlap: { x: 0, y: 0 }
    };
  }
  
  /**
   * Return collision info to pool
   */
  release(info: CollisionInfo): void {
    if (this.pool.length < this.maxSize) {
      // Reset values
      info.distance = 0;
      info.angle = 0;
      info.overlap.x = 0;
      info.overlap.y = 0;
      this.pool.push(info);
    }
  }
  
  /**
   * Clear pool
   */
  clear(): void {
    this.pool.length = 0;
  }
}

/**
 * Batch process entities for better cache locality
 */
export function processEntitiesInBatches<T>(
  entities: T[],
  batchSize: number,
  processBatch: (batch: T[], startIndex: number) => void
): void {
  for (let i = 0; i < entities.length; i += batchSize) {
    const batch = entities.slice(i, i + batchSize);
    processBatch(batch, i);
  }
}

// ============================================================================
// ERROR HANDLING AND LOGGING
// ============================================================================

/**
 * Safe callback execution with timeout and error handling
 */
export async function executeCallbackSafely(
  callback: (a: CollidableEntity, b: CollidableEntity) => boolean,
  a: CollidableEntity,
  b: CollidableEntity,
  timeoutMs: number = 100
): Promise<Result<boolean>> {
  try {
    // Create promise with timeout
    const timeoutPromise = new Promise<never>((_, reject) => {
      setTimeout(() => reject(new Error("Callback execution timeout")), timeoutMs);
    });
    
    // Execute callback with timeout
    const result = await Promise.race([
      Promise.resolve(callback(a, b)),
      timeoutPromise
    ]);
    
    return {
      success: true,
      value: result as boolean
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error : new Error(String(error))
    };
  }
}

/**
 * Log collision event
 */
export function logCollisionEvent(
  a: CollidableEntity,
  b: CollidableEntity,
  info: CollisionInfo,
  level: "debug" | "info" | "warn" = "debug"
): void {
  // Collision logging silenciado conforme regras de zero console.log em sistemas
  // Usar DebugLogPanel se necessário para diagnósticos
  return;
}

/**
 * Log performance metrics
 */
export function logPerformanceMetrics(
  _entityCount: number,
  _collisionChecks: number,
  _processingTimeMs: number
): void {
  // Performance logging silenciado conforme regras de zero console.log em sistemas
  // Usar DebugLogPanel se necessário para diagnósticos
  return;
}

// ============================================================================
// VALIDATION UTILITIES
// ============================================================================

/**
 * Validate entity properties for collision detection
 */
export function validateEntityForCollision(entity: CollidableEntity): Result<void> {
  const errors: string[] = [];
  
  // Check position
  if (!Number.isFinite(entity.x)) errors.push("x must be a finite number");
  if (!Number.isFinite(entity.y)) errors.push("y must be a finite number");
  
  // Check dimensions
  if (!Number.isFinite(entity.w) || entity.w <= 0) errors.push("w must be a positive finite number");
  if (!Number.isFinite(entity.h) || entity.h <= 0) errors.push("h must be a positive finite number");
  
  // Check type
  if (typeof entity.type !== "string" || entity.type.trim().length === 0) {
    errors.push("type must be a non-empty string");
  }
  
  if (errors.length > 0) {
    return {
      success: false,
      error: new Error(`Invalid entity: ${errors.join(", ")}`)
    };
  }
  
  return { success: true, value: undefined };
}

/**
 * Normalize entity type (lowercase, trim)
 */
export function normalizeEntityType(type: string): string {
  return type.trim().toLowerCase();
}

// ============================================================================
// MATH UTILITIES
// ============================================================================

/**
 * Clamp value between min and max
 */
export function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

/**
 * Linear interpolation
 */
export function lerp(start: number, end: number, t: number): number {
  return start + (end - start) * t;
}

/**
 * Check if two numbers are approximately equal
 */
export function approxEqual(a: number, b: number, epsilon: number = 0.001): boolean {
  return Math.abs(a - b) < epsilon;
}

// ============================================================================
// EXPORTS
// ============================================================================

export {
  // Re-export types for convenience
  type CollidableEntity,
  type CollisionInfo,
  type Result
};