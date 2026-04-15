/**
 * 🚀 AAA Physics System — Verlet Integration + Sub-stepping
 *
 * Features:
 * - Semi-implicit Euler (Symplectic) integration for energy conservation
 * - Fixed sub-stepping for deterministic, frame-rate independent simulation
 * - Zero-allocation hot path (reuses arrays, no object spread)
 * - Typed entity contract (no `any`)
 * - Frame-rate independent friction via exponential decay
 * - Configurable gravity presets
 * - Sleep detection for idle bodies (CPU savings)
 *
 * @version 3.0.0 - SSOT compliant
 */

import { PHYSICS_CONSTANTS } from '../config';

// ---------------------------------------------------------------------------
// Types (self-contained – no cross-file allocation on import)
// ---------------------------------------------------------------------------

export type Vec2 = { x: number; y: number };

export interface PhysicsBody {
  vx: number;
  vy: number;
  ax: number;
  ay: number;
  mass: number;
  invMass: number;          // cached 1/mass
  friction: number;         // 0..1
  restitution: number;      // 0..1
  grounded: boolean;
  sleeping: boolean;
  sleepCounter: number;
  maxSpeed: number;         // magnitude cap (0 = unlimited)
  // Accumulated forces - zero-allocation approach (previously forces: Vec2[])
  accFx: number;
  accFy: number;
}

/** Minimal entity contract the system can operate on */
export interface PhysicsEntity {
  readonly id: string;
  x: number;
  y: number;
  props?: { vx?: number; vy?: number; x?: number; y?: number };
}

// ---------------------------------------------------------------------------
// Constants (SSOT: imported from config)
// ---------------------------------------------------------------------------

const {
  FIXED_DT,
  MAX_SUB_STEPS,
  SLEEP_THRESHOLD,
  SLEEP_FRAMES,
  MIN_MASS,
  MAX_SPEED_GLOBAL,
  FORCE_EPS,
  AIR_DRAG_RATIO,
} = PHYSICS_CONSTANTS;

// ---------------------------------------------------------------------------
// PhysicsSystem
// ---------------------------------------------------------------------------

export class PhysicsSystem {
  private bodies = new Map<string, PhysicsBody>();

  // Accumulator for fixed-timestep sub-stepping
  private accumulator = 0;

  // Reusable entity map to avoid per-frame allocation
  private _entityMap = new Map<string, PhysicsEntity>();

  // ── Registration ──────────────────────────────────────────────────────

  register(
    entityId: string,
    mass     = 1,
    friction = 0.1,
    restitution = 0.5,
    maxSpeed = 0,
  ): void {
    const m = Math.max(MIN_MASS, mass);
    this.bodies.set(entityId, {
      vx: 0, vy: 0,
      ax: 0, ay: 0,
      mass: m,
      invMass: 1 / m,
      friction: clamp01(friction),
      restitution: clamp01(restitution),
      grounded: false,
      sleeping: false,
      sleepCounter: 0,
      maxSpeed: maxSpeed > 0 ? maxSpeed : 0,
      accFx: 0, accFy: 0,
    });
  }

  unregister(entityId: string): void {
    this.bodies.delete(entityId);
  }

  // ── Force / Impulse API ───────────────────────────────────────────────

  applyForce(entityId: string, fx: number, fy: number): void {
    const b = this.bodies.get(entityId);
    if (!b) return;
    b.accFx += fx;
    b.accFy += fy;
    if (b.sleeping) { b.sleeping = false; b.sleepCounter = 0; }
  }

  applyImpulse(entityId: string, ix: number, iy: number): void {
    const b = this.bodies.get(entityId);
    if (!b) return;
    b.vx += ix * b.invMass;
    b.vy += iy * b.invMass;
    if (b.sleeping) { b.sleeping = false; b.sleepCounter = 0; }
  }

  setVelocity(entityId: string, vx: number, vy: number): void {
    const b = this.bodies.get(entityId);
    if (!b) return;
    b.vx = vx;
    b.vy = vy;
    if (b.sleeping) { b.sleeping = false; b.sleepCounter = 0; }
  }

  getVelocity(entityId: string): Vec2 | null {
    const b = this.bodies.get(entityId);
    return b ? { x: b.vx, y: b.vy } : null;
  }

  setMaxVelocity(entityId: string, maxVx: number, maxVy: number): void {
    const b = this.bodies.get(entityId);
    if (b) b.maxSpeed = Math.max(maxVx, maxVy);
  }

  setGrounded(entityId: string, grounded: boolean): void {
    const b = this.bodies.get(entityId);
    if (b) b.grounded = grounded;
  }

  isGrounded(entityId: string): boolean {
    return this.bodies.get(entityId)?.grounded ?? false;
  }

  getComponent(entityId: string): PhysicsBody | null {
    return this.bodies.get(entityId) ?? null;
  }

  // ── Main Update (variable dt → fixed sub-steps) ──────────────────────

  update(dt: number, entities: PhysicsEntity[], gravity?: Vec2): void {
    // Clamp incoming dt to avoid spiral-of-death
    const clampedDt = Math.min(dt, FIXED_DT * MAX_SUB_STEPS);
    this.accumulator += clampedDt;

    // Build lookup once using reusable map
    this.buildEntityMap(entities);

    // Fixed sub-steps for determinism
    let steps = 0;
    while (this.accumulator >= FIXED_DT && steps < MAX_SUB_STEPS) {
      this.step(FIXED_DT, this._entityMap, gravity);
      this.accumulator -= FIXED_DT;
      steps++;
    }

    // Process simple-mode entities (no registered body, just props.vx/vy)
    this.processSimpleEntities(entities, clampedDt);
  }

  // ── Single Fixed Step ─────────────────────────────────────────────────

  private step(
    dt: number,
    entityMap: Map<string, PhysicsEntity>,
    gravity: Vec2 | undefined,
  ): void {
    for (const [id, b] of this.bodies) {
      if (b.sleeping) continue;

      const entity = entityMap.get(id);
      if (!entity) continue;

      // 1. Get accumulated forces → net force (zero-allocation)
      let fx = b.accFx;
      let fy = b.accFy;
      b.accFx = 0; // reset for next frame
      b.accFy = 0;

      // 2. Add gravity (F = m·g)
      if (gravity) {
        fx += gravity.x * b.mass;
        fy += gravity.y * b.mass;
      }

      // 3. Acceleration (a = F / m)  →  uses cached invMass
      b.ax = fx * b.invMass;
      b.ay = fy * b.invMass;

      // 4. Semi-implicit Euler: update velocity FIRST, then position
      b.vx += b.ax * dt;
      b.vy += b.ay * dt;

      // 5. Frame-rate independent friction (exponential decay)
      const hasActiveForce = Math.abs(fx) > FORCE_EPS || Math.abs(fy) > FORCE_EPS;
      if (!hasActiveForce) {
        const frictionCoeff = b.grounded ? b.friction : b.friction * AIR_DRAG_RATIO;
        // decay = (1 - f)^(dt * 60)  → identical result at any frame rate
        const decay = Math.pow(1 - frictionCoeff, dt * 60);
        b.vx *= decay;
        b.vy *= decay;
      }

      // 6. Speed cap (magnitude-based for diagonal consistency)
      const cap = b.maxSpeed > 0 ? b.maxSpeed : MAX_SPEED_GLOBAL;
      const speedSq = b.vx * b.vx + b.vy * b.vy;
      if (speedSq > cap * cap) {
        const scale = cap / Math.sqrt(speedSq);
        b.vx *= scale;
        b.vy *= scale;
      }

      // 7. Update position
      entity.x += b.vx * dt;
      entity.y += b.vy * dt;

      // 8. Sleep detection
      if (speedSq < SLEEP_THRESHOLD * SLEEP_THRESHOLD && !hasActiveForce) {
        b.sleepCounter++;
        if (b.sleepCounter >= SLEEP_FRAMES) {
          b.sleeping = true;
          b.vx = 0;
          b.vy = 0;
        }
      } else {
        b.sleepCounter = 0;
      }
    }
  }

  // ── Simple-mode entities (props.vx/vy, no registered body) ────────────

  private processSimpleEntities(entities: PhysicsEntity[], dt: number): void {
    for (let i = 0; i < entities.length; i++) {
      const e = entities[i];
      if (this.bodies.has(e.id) || !e.props) continue;

      const vx = e.props.vx;
      const vy = e.props.vy;
      if (vx === undefined && vy === undefined) continue;

      e.x += (vx || 0) * dt;
      e.y += (vy || 0) * dt;
      e.props.x = e.x;
      e.props.y = e.y;
    }
  }

  // ── Helpers ───────────────────────────────────────────────────────────

  private buildEntityMap(entities: PhysicsEntity[]): void {
    // Clear and reuse existing map to avoid allocation
    this._entityMap.clear();
    for (let i = 0; i < entities.length; i++) {
      const e = entities[i];
      if (e && e.id) this._entityMap.set(e.id, e);
    }
  }

  clear(): void {
    this.bodies.clear();
    this.accumulator = 0;
    this._entityMap.clear();
  }

  /** Number of active (non-sleeping) bodies */
  get activeCount(): number {
    let n = 0;
    for (const b of this.bodies.values()) if (!b.sleeping) n++;
    return n;
  }

  get totalCount(): number {
    return this.bodies.size;
  }
}

// ---------------------------------------------------------------------------
// Utility
// ---------------------------------------------------------------------------

function clamp01(v: number): number {
  return v < 0 ? 0 : v > 1 ? 1 : v;
}
