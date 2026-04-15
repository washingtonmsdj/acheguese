/**
 * 🛠️ PHYSICS SYSTEM UTILS — Helper functions
 *
 * Lean helpers for vector math and friction calculations.
 * No object pools or metrics bloat — those live in PerformanceMonitor.
 *
 * @version 2.0.0
 */

import {
  isFiniteNumber,
  isVector2,
  validateFriction,
  validateDeltaTime,
  validateMass,
  PHYSICS_LIMITS,
  DEFAULT_VALUES,
} from './physicsSystemTypes';

// ---------------------------------------------------------------------------
// Vector math
// ---------------------------------------------------------------------------

export function magnitude(v: { x: number; y: number }): number {
  return Math.sqrt(v.x * v.x + v.y * v.y);
}

export function normalize(v: { x: number; y: number }): { x: number; y: number } {
  const m = magnitude(v);
  return m === 0 ? { x: 0, y: 0 } : { x: v.x / m, y: v.y / m };
}

export function dot(a: { x: number; y: number }, b: { x: number; y: number }): number {
  return a.x * b.x + a.y * b.y;
}

export function distance(a: { x: number; y: number }, b: { x: number; y: number }): number {
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  return Math.sqrt(dx * dx + dy * dy);
}

// ---------------------------------------------------------------------------
// Physics helpers
// ---------------------------------------------------------------------------

export function applyFriction(
  velocity: { x: number; y: number },
  friction: number,
  dt: number,
  isGrounded: boolean,
): { x: number; y: number } {
  const f = validateFriction(friction);
  const coeff = isGrounded ? f : f * PHYSICS_LIMITS.AIR_RESISTANCE_FACTOR;
  const decay = Math.pow(1 - coeff, dt * 60);
  return { x: velocity.x * decay, y: velocity.y * decay };
}

export function clampVelocity(
  velocity: { x: number; y: number },
  maxSpeed: number,
): { x: number; y: number } {
  const cap = maxSpeed > 0 ? maxSpeed : PHYSICS_LIMITS.MAX_VELOCITY;
  const speedSq = velocity.x * velocity.x + velocity.y * velocity.y;
  if (speedSq > cap * cap) {
    const scale = cap / Math.sqrt(speedSq);
    return { x: velocity.x * scale, y: velocity.y * scale };
  }
  return velocity;
}

export function calculateAcceleration(
  force: { x: number; y: number },
  mass: number,
): { x: number; y: number } {
  const m = validateMass(mass);
  return { x: force.x / m, y: force.y / m };
}

/**
 * Sum an array of forces into a single net force (zero-alloc accumulator).
 */
export function sumForces(forces: readonly { x: number; y: number }[]): { x: number; y: number } {
  let fx = 0, fy = 0;
  for (let i = 0; i < forces.length; i++) {
    fx += forces[i].x;
    fy += forces[i].y;
  }
  return { x: fx, y: fy };
}

// Re-export everything from types for backward compat
export {
  isFiniteNumber,
  isVector2,
  validateFriction,
  validateDeltaTime,
  validateMass,
  PHYSICS_LIMITS,
  DEFAULT_VALUES,
} from './physicsSystemTypes';
