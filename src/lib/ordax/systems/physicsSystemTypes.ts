/**
 * 🔒 PHYSICS SYSTEM TYPES — Lean type-safe layer
 *
 * Re-exports core types from PhysicsSystem and provides validation helpers.
 * Removed bloat: Vector2Pool with duplicate return bug, excessive guard fns.
 *
 * @version 2.1.0
 * @changelog
 *   - 2.1.0: SSOT compliance - imports from config.ts
 */

// Re-export canonical types from the system itself
export type { Vec2 as Vector2, PhysicsBody as PhysicsComponent, PhysicsEntity as EntityWithPhysics } from './PhysicsSystem';

// ✅ SSOT: Importa constantes do config.ts
import { PHYSICS_CONSTANTS, PHYSICS_DEFAULTS } from "../config";

// ---------------------------------------------------------------------------
// Validation limits (used by config & utils)
// ---------------------------------------------------------------------------

/**
 * Physics limits - SSOT from config.ts
 */
export const PHYSICS_LIMITS = {
  MIN_MASS: PHYSICS_CONSTANTS.MIN_MASS,
  MAX_MASS: PHYSICS_CONSTANTS.MAX_SPEED_GLOBAL, // Using MAX_SPEED_GLOBAL as proxy for MAX_MASS
  MIN_FRICTION: 0,
  MAX_FRICTION: 0.99,
  MIN_RESTITUTION: 0,
  MAX_RESTITUTION: 1,
  MAX_VELOCITY: PHYSICS_CONSTANTS.MAX_SPEED_GLOBAL,
  MIN_DT: PHYSICS_CONSTANTS.FIXED_DT / 100, // Approximate
  MAX_DT: PHYSICS_CONSTANTS.MAX_SUB_STEPS * PHYSICS_CONSTANTS.FIXED_DT,
  FORCE_THRESHOLD: PHYSICS_CONSTANTS.FORCE_EPS,
  AIR_RESISTANCE_FACTOR: PHYSICS_CONSTANTS.AIR_DRAG_RATIO,
} as const;

/**
 * Default values - SSOT from config.ts
 */
export const DEFAULT_VALUES = {
  MASS: PHYSICS_DEFAULTS.MASS,
  FRICTION: PHYSICS_DEFAULTS.FRICTION,
  RESTITUTION: PHYSICS_DEFAULTS.RESTITUTION,
  VELOCITY: { x: 0, y: 0 } as { x: number; y: number },
  ACCELERATION: { x: 0, y: 0 } as { x: number; y: number },
  GRAVITY: PHYSICS_DEFAULTS.GRAVITY,
} as const;

// ---------------------------------------------------------------------------
// Type guards
// ---------------------------------------------------------------------------

export function isFiniteNumber(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value);
}

export function isPositiveFiniteNumber(value: unknown): value is number {
  return isFiniteNumber(value) && value > 0;
}

export function isNonNegativeFiniteNumber(value: unknown): value is number {
  return isFiniteNumber(value) && value >= 0;
}

export function isVector2(value: unknown): value is { x: number; y: number } {
  if (!value || typeof value !== 'object') return false;
  const v = value as Record<string, unknown>;
  return isFiniteNumber(v.x) && isFiniteNumber(v.y);
}

// ---------------------------------------------------------------------------
// Validation helpers
// ---------------------------------------------------------------------------

export function validateNumber(
  value: number,
  min = -Infinity,
  max = Infinity,
  defaultValue = 0,
): number {
  if (!isFiniteNumber(value)) return defaultValue;
  return Math.max(min, Math.min(max, value));
}

export function validateMass(mass: number): number {
  return validateNumber(mass, PHYSICS_LIMITS.MIN_MASS, PHYSICS_LIMITS.MAX_MASS, DEFAULT_VALUES.MASS);
}

export function validateFriction(friction: number): number {
  return validateNumber(friction, PHYSICS_LIMITS.MIN_FRICTION, PHYSICS_LIMITS.MAX_FRICTION, DEFAULT_VALUES.FRICTION);
}

export function validateRestitution(restitution: number): number {
  return validateNumber(restitution, PHYSICS_LIMITS.MIN_RESTITUTION, PHYSICS_LIMITS.MAX_RESTITUTION, DEFAULT_VALUES.RESTITUTION);
}

export function validateDeltaTime(dt: number): number {
  return validateNumber(dt, PHYSICS_LIMITS.MIN_DT, PHYSICS_LIMITS.MAX_DT, PHYSICS_LIMITS.MIN_DT);
}

export function validateVector2(
  vector: { x: number; y: number },
  maxMagnitude = PHYSICS_LIMITS.MAX_VELOCITY,
): { x: number; y: number } {
  if (!isVector2(vector)) return DEFAULT_VALUES.VELOCITY;
  const magSq = vector.x * vector.x + vector.y * vector.y;
  if (magSq > maxMagnitude * maxMagnitude) {
    const scale = maxMagnitude / Math.sqrt(magSq);
    return { x: vector.x * scale, y: vector.y * scale };
  }
  return vector;
}

export function validateEntityId(entityId: string): string {
  if (typeof entityId !== 'string' || entityId.trim() === '') {
    throw new Error(`Invalid entityId: ${entityId}`);
  }
  return entityId.trim();
}

export function createVector2(x: number, y: number): { x: number; y: number } {
  return { x, y };
}
